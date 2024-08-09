import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const api_url = 'http://localhost:8000';

interface DeploymentData {
  day: string;
  total_aggregate_revenue: number;
  [key: string]: string | number;
}

interface VisibleLines {
  [key: string]: boolean;
}

const DeploymentRevenueChart: React.FC = () => {
  const [chartData, setChartData] = useState<DeploymentData[]>([]);
  const [deployments, setDeployments] = useState<string[]>([]);
  const [visibleLines, setVisibleLines] = useState<VisibleLines>({});

  useEffect(() => {
    axios.get<DeploymentData[]>(`${api_url}/api/deployment_revenue`)
      .then(response => {
        setChartData(response.data);
        const allDeployments = new Set(
          response.data.flatMap(entry => Object.keys(entry).filter(key => key !== 'day' && key !== 'total_aggregate_revenue'))
        );
        const deploymentsList = Array.from(allDeployments);
        setDeployments(deploymentsList);
        
        const initialVisibility: VisibleLines = deploymentsList.reduce((acc, deployment) => {
          acc[deployment] = true;
          return acc;
        }, { total_aggregate_revenue: true } as VisibleLines);
        setVisibleLines(initialVisibility);
      })
      .catch(error => console.error('Error fetching deployment revenue data:', error));
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
            <p key={index} style={{ color: pld.color, margin: '2px 0'}}>
              {`${capitalize(pld.name.replace('_', ' '))}: $${Number(pld.value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
            </p>
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

  const CustomLegend = () => {
    const allKeys = ['total_aggregate_revenue', ...deployments];
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
            {capitalize(key.replace('_', ' '))}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis 
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
          <Line 
            type="monotone"
            dataKey="total_aggregate_revenue"
            name="Total Aggregate Revenue"
            stroke={colors[0]}
            dot={false}
            strokeWidth={2}
            hide={!visibleLines['total_aggregate_revenue']}
          />
          {deployments.map((deployment, index) => (
            <Line 
              key={deployment}
              type="monotone"
              dataKey={deployment}
              name={deployment}
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

export default DeploymentRevenueChart;