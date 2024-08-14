import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const api_url = "https://api-dot-internal-website-427620.uc.r.appspot.com";

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

  useEffect(() => {
    axios.get<CumulativeRevenueData[]>(`${api_url}/api/revenue_by_type`)
      .then(response => {
        const sortedData = response.data.sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime());
        const uniqueRevenueTypes = Array.from(new Set(sortedData.map(item => item.revenue_type)));
        setRevenueTypes(uniqueRevenueTypes);

        // Process data to create a point for each day for each revenue type
        const processedData: ChartDataPoint[] = [];
        const dateSet = new Set(sortedData.map(item => item.day));
        const dates = Array.from(dateSet).sort();

        dates.forEach(date => {
            const dataPoint: ChartDataPoint = { day: date };
            uniqueRevenueTypes.forEach(type => {
              const entry = sortedData.find(item => item.day === date && item.revenue_type === type);
              dataPoint[type] = entry ? entry.cumulative_revenue : undefined;
            });
            processedData.push(dataPoint);
          });

        setChartData(processedData);
        
        const initialVisibility: VisibleLines = uniqueRevenueTypes.reduce((acc, type) => {
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
                {`${capitalize(pld.name)}: $${Number(pld.value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
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
  );

  const visibleData = useMemo(() => {
    return chartData.filter(entry => 
      revenueTypes.some(type => visibleLines[type] && entry[type] !== undefined)
    );
  }, [chartData, visibleLines, revenueTypes]);

  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>
        <LineChart
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
            tickFormatter={(value) => {
              if (value >= 1000000) {
                return `$${(value / 1000000).toFixed(1)}M`.replace('.0M', 'M');
              } else if (value >= 1000) {
                return `$${Math.round(value / 1000)}K`;
              } else {
                return `$${Math.round(value)}`;
              }
            }}
            domain={['dataMin', 'dataMax']}
            scale="linear"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
          {revenueTypes.map((type, index) => (
            <Line 
              key={type}
              type="monotone"
              dataKey={type}
              name={type}
              stroke={colors[index % colors.length]}
              dot={false}
              hide={!visibleLines[type]}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueByTypeChart;