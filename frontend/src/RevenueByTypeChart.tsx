import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const api_url = "http://localhost:8000";

interface CumulativeRevenueData {
  day: string;
  revenue_type: string;
  cumulative_revenue: number;
}

interface ChartDataPoint {
  day: string;
  [key: string]: string | number | undefined;
}

interface VisibleLines {
  [key: string]: boolean;
}

const RevenueByTypeChart: React.FC = () => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [revenueTypes, setRevenueTypes] = useState<string[]>([]);
  const [visibleLines, setVisibleLines] = useState<VisibleLines>({});
  const [showUSD, setShowUSD] = useState(false);

  useEffect(() => {
    axios.get<CumulativeRevenueData[]>(`${api_url}/api/revenue_by_type`)
      .then(response => {
        const sortedData = response.data.sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime());
        const uniqueRevenueTypes = Array.from(new Set(sortedData.map(item => item.revenue_type)));
        setRevenueTypes(uniqueRevenueTypes);

        const processedData: ChartDataPoint[] = [];
        const dateSet = new Set(sortedData.map(item => item.day));
        const dates = Array.from(dateSet).sort();

        dates.forEach(date => {
          const dataPoint: ChartDataPoint = { day: date };
          let totalRevenue = 0;
          
          // Calculate total revenue for this date
          uniqueRevenueTypes.forEach(type => {
            const entry = sortedData.find(item => item.day === date && item.revenue_type === type);
            if (entry) {
              totalRevenue += entry.cumulative_revenue;
              // Store raw USD amount
              dataPoint[`${type}_usd`] = entry.cumulative_revenue;
            }
          });

          // Calculate percentage for each type
          uniqueRevenueTypes.forEach(type => {
            const entry = sortedData.find(item => item.day === date && item.revenue_type === type);
            const revenue = entry ? entry.cumulative_revenue : 0;
            dataPoint[type] = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;
          });
          
          processedData.push(dataPoint);
        });

        setChartData(processedData);
        
        const initialVisibility = uniqueRevenueTypes.reduce((acc, type) => {
          acc[type] = true;
          return acc;
        }, {} as VisibleLines);
        setVisibleLines(initialVisibility);
      })
      .catch(error => console.error('Error fetching cumulative revenue data:', error));
  }, []);

  const colors = [
    '#e5989b', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#a4de6c',
    '#d0ed57', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c'
  ];

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{ backgroundColor: '#404040', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
          <p style={{ margin: '0 0 5px', fontWeight: 'bold', color: 'white' }}>{`Date: ${label}`}</p>
          {payload.map((pld: any, index: number) => (
            pld.value !== undefined && (
              <p key={index} style={{ color: pld.color, margin: '2px 0'}}>
              {`${capitalize(pld.name.replace('_usd', ''))}: ${
                showUSD 
                  ? `$${Number(pld.value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
                  : `${Number(pld.value).toFixed(2)}%`
              }`}
              </p>
            )
          ))}
        </div>
      );
    }
    return null;
  };

  const handleLegendClick = (dataKey: string) => {
    setVisibleLines(prev => ({
      ...prev,
      [dataKey]: !prev[dataKey]
    }));
  };

  const CustomLegend = () => (
    <div>
      <div style={{ marginBottom: '10px', textAlign: 'center' }}>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
        {revenueTypes.map((type, index) => (
          <li 
            key={type} 
            style={{ 
              marginRight: '10px', 
              cursor: 'pointer',
              textDecoration: visibleLines[type] ? 'none' : 'line-through',
              opacity: visibleLines[type] ? 1 : 0.5,
              color: colors[index % colors.length],
              display: 'flex',
              alignItems: 'center',
            }}
            onClick={() => handleLegendClick(type)}
          >
            <span 
              style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: colors[index % colors.length],
                marginRight: '5px'
              }}
            />
            {capitalize(type)}
          </li>
        ))}
      </ul>
      <div style={{ textAlign: 'center' }}>
        <button
            onClick={() => setShowUSD(!showUSD)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Show {showUSD ? 'Percentage' : 'USD'}
        </button>
      </div>
    </div>
  );

  const visibleData = useMemo(() => {
    return chartData.filter(entry => 
      revenueTypes.some(type => visibleLines[type] && entry[showUSD ? `${type}_usd` : type] !== undefined)
    );
  }, [chartData, visibleLines, revenueTypes, showUSD]);

  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>
        <AreaChart
          data={visibleData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="day" 
            type="category"
            tickFormatter={(tick) => new Date(tick).toLocaleDateString()}
            interval="preserveStartEnd"
            minTickGap={50}
          />
        <YAxis 
          tickFormatter={(value) => showUSD 
            ? value >= 1000000
              ? `$${(value / 1000000).toFixed(0)}M`
              : value >= 1000
                ? `$${(value / 1000).toFixed(0)}K`
                : `$${value}`
            : `${value}%`}
          domain={showUSD ? ['auto', 'auto'] : [0, 100]}
          scale="linear"
        />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
          {revenueTypes.map((type, index) => (
            <Area
              key={type}
              type="monotone"
              dataKey={showUSD ? `${type}_usd` : type}
              name={type}
              stroke={colors[index % colors.length]}
              fill={colors[index % colors.length]}
              stackId="1"
              hide={!visibleLines[type]}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueByTypeChart;