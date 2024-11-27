import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const api_url = 'https://frontend-dot-internal-website-427620.uc.r.appspot.com';

interface MARevenueData {
  day: string;
  total_180_days_ma_revenue: number;
  [key: string]: string | number;
}

interface VisibleLines {
  [key: string]: boolean;
}

const OneEightyDayMARevenueChart: React.FC = () => {
  const [chartData, setChartData] = useState<MARevenueData[]>([]);
  const [deployments, setDeployments] = useState<string[]>([]);
  const [visibleLines, setVisibleLines] = useState<VisibleLines>({});

  useEffect(() => {
    axios.get<MARevenueData[]>(`${api_url}/api/180_days_ma_revenue`)
      .then(response => {
        setChartData(response.data);
        const allDeployments = new Set(
          response.data.flatMap(entry => 
            Object.keys(entry).filter(key => 
              key !== 'day' && key !== 'total_180_days_ma_revenue' && key.endsWith('_180_days_ma_revenue')
            )
          )
        );
        const deploymentsList = Array.from(allDeployments).map(key => key.replace('_180_days_ma_revenue', ''));
        setDeployments(deploymentsList);
        
        const initialVisibility: VisibleLines = deploymentsList.reduce((acc, deployment) => {
          acc[deployment] = true;
          return acc;
        }, { total_180_days_ma_revenue: true } as VisibleLines);
        setVisibleLines(initialVisibility);
      })
      .catch(error => console.error('Error fetching MA revenue data:', error));
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
          {payload.map((pld: any, index: number) => {
            let displayName = pld.name;
            if (displayName !== 'Total 180 Days MA Revenue') {
              displayName = displayName.replace('180 Days MA Revenue', '').trim();
            }
            return (
              <p key={index} style={{ color: pld.color, margin: '2px 0'}}>
                {`${capitalize(displayName)}: $${Number(pld.value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
              </p>
            );
          })}
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

  const CustomLegend = () => {
    const allKeys = ['total_180_days_ma_revenue', ...deployments];
    return (
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
        {allKeys.map((key, index) => (
          <li 
            key={key} 
            style={{ 
              marginRight: '10px', 
              cursor: 'pointer',
              textDecoration: visibleLines[key] ? 'none' : 'line-through',
              opacity: visibleLines[key] ? 1 : 0.5,
              color: colors[index % colors.length],
              display: 'flex',
              alignItems: 'center',
            }}
            onClick={() => handleLegendClick(key)}
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
            {
            key === 'total_180_days_ma_revenue' 
            ? 'Total' 
            : capitalize(key.replace('_180_days_ma_revenue', ''))
            }
          </li>
        ))}
      </ul>
    );
  };

  const visibleData = useMemo(() => {
    return chartData.filter(entry => {
      return Object.entries(visibleLines).some(([key, isVisible]) => {
        return isVisible && entry[`${key}_180_days_ma_revenue`] !== undefined;
      });
    });
  }, [chartData, visibleLines]);

  const dateRange = useMemo(() => {
    if (visibleData.length === 0) return { min: '', max: '' };
    const dates = visibleData.map(entry => new Date(entry.day).getTime());
    return {
      min: new Date(Math.min(...dates)).toISOString().split('T')[0],
      max: new Date(Math.max(...dates)).toISOString().split('T')[0]
    };
  }, [visibleData]);

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
            domain={[dateRange.min, dateRange.max]}
            type="category"
            tickFormatter={(tick) => new Date(tick).toLocaleDateString()}
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
          <Line 
            type="monotone"
            dataKey="total_180_days_ma_revenue"
            name="Total 180 Days MA Revenue"
            stroke={colors[0]}
            dot={false}
            strokeWidth={2}
            hide={!visibleLines['total_180_days_ma_revenue']}
          />
          {deployments.map((deployment, index) => (
            <Line 
              key={deployment}
              type="monotone"
              dataKey={`${deployment}_180_days_ma_revenue`}
              name={`${deployment}`}
              stroke={colors[(index + 1) % colors.length]}
              dot={false}
              hide={!visibleLines[deployment]}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OneEightyDayMARevenueChart;