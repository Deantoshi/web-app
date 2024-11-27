import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const api_url = "https://frontend-dot-internal-website-427620.uc.r.appspot.com";

interface DeploymentData {
  day: string;
  total_aggregate_revenue: number;
  daily_revenue: number;
  [key: string]: string | number;
}

interface ProcessedDeploymentData extends DeploymentData {
  [key: string]: string | number;
}

interface VisibleLines {
  [key: string]: boolean;
}

const DeploymentRevenueChart: React.FC = () => {
  const [chartData, setChartData] = useState<ProcessedDeploymentData[]>([]);
  const [deployments, setDeployments] = useState<string[]>([]);
  const [visibleLines, setVisibleLines] = useState<VisibleLines>({});
  const [showDailyRevenue, setShowDailyRevenue] = useState(false);


  const visibleData = useMemo(() => {
    return chartData.filter(entry => {
      return Object.entries(visibleLines).some(([key, isVisible]) => {
        return isVisible && entry[key] !== undefined;
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

  useEffect(() => {
    axios.get<DeploymentData[]>(`${api_url}/api/deployment_revenue`)
      .then(response => {
        // Process the data to add daily revenue per deployment
        const processedData = response.data.map((entry, index, arr) => {
          const newEntry: ProcessedDeploymentData = { ...entry };
          if (index > 0) {
            // Calculate daily revenue for each deployment
            let totalDailyRevenue = 0;
            Object.keys(entry).forEach(key => {
              if (key !== 'day' && key !== 'total_aggregate_revenue' && key !== 'daily_revenue') {
                const dailyKey = `${key}_daily`;
                const currentValue = Number(entry[key]);
                const previousValue = Number(arr[index - 1][key]);
                const dailyValue = currentValue - previousValue;
                newEntry[dailyKey] = dailyValue;
                totalDailyRevenue += dailyValue;
              }
            });
            newEntry.total_daily_revenue = totalDailyRevenue;
          } else {
            // For first entry, daily revenue equals total revenue
            let totalDailyRevenue = 0;
            Object.keys(entry).forEach(key => {
              if (key !== 'day' && key !== 'total_aggregate_revenue' && key !== 'daily_revenue') {
                const dailyKey = `${key}_daily`;
                const value = Number(entry[key]);
                newEntry[dailyKey] = value;
                totalDailyRevenue += value;
              }
            });
            newEntry.total_daily_revenue = totalDailyRevenue;
          }
          return newEntry;
        });

        setChartData(processedData);
        const allDeployments = new Set(
          processedData.flatMap(entry => Object.keys(entry).filter(key => 
            key !== 'day' && 
            key !== 'total_aggregate_revenue' && 
            key !== 'daily_revenue' &&
            key !== 'total_daily_revenue' &&
            !key.endsWith('_daily')
          ))
        );
        const deploymentsList = Array.from(allDeployments);
        setDeployments(deploymentsList);
        
        const initialVisibility: VisibleLines = deploymentsList.reduce((acc, deployment) => {
          acc[deployment] = true;
          acc[`${deployment}_daily`] = true;
          return acc;
        }, { total_aggregate_revenue: true, total_daily_revenue: true } as VisibleLines);
        setVisibleLines(initialVisibility);
      })
      .catch(error => console.error('Error fetching deployment revenue data:', error));
  }, []);

  const colors = [
    '#e5989b', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#a4de6c',
    '#d0ed57', '#83a6ed', '#8dd1e1', '#9b5de5', '#ffbe0b'
  ];

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{ backgroundColor: '#404040', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
          <p style={{ margin: '0 0 5px', fontWeight: 'bold', color: 'white' }}>{`Date: ${label}`}</p>
          {payload.map((pld: any, index: number) => {
            const displayName = pld.dataKey.endsWith('_daily') 
              ? `${capitalize(pld.dataKey.replace('_daily', ''))} (Daily)`
              : capitalize(pld.dataKey.replace('_', ' '));
            return (
              <p key={index} style={{ color: pld.color, margin: '2px 0'}}>
                {`${displayName}: $${Number(pld.value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
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
    const allKeys = showDailyRevenue 
      ? ['total_daily_revenue', ...deployments.map(d => `${d}_daily`)]
      : ['total_aggregate_revenue', ...deployments];
    
    return (
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
        {allKeys.map((key, index) => {
          let displayName;
          if (key === 'total_daily_revenue') {
            displayName = 'Total Daily Revenue';
          } else if (key === 'total_aggregate_revenue') {
            displayName = 'Total Revenue';
          } else if (key.endsWith('_daily')) {
            displayName = `${capitalize(key.replace('_daily', ''))} (Daily)`;
          } else {
            displayName = capitalize(key.replace('_', ' '));
          }
          
          return (
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
                  borderRadius: key === 'total_aggregate_revenue' || key === 'total_daily_revenue' ? '0%' : '50%',
                  backgroundColor: colors[index % colors.length],
                  marginRight: '5px'
                }}
              />
              {displayName}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div style={{ width: '100%', minHeight: '600px', padding: '20px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Deployment Revenue Over Time</h2>
      
      <div style={{ width: '100%', height: '500px' }}>
        <ResponsiveContainer>
          <ComposedChart
            data={visibleData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 20,
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
              yAxisId="left"
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
            <YAxis 
              yAxisId="right"
              orientation="right"
              tickFormatter={(value) => {
                if (value >= 1000000) {
                  return `$${(value / 1000000).toFixed(1)}M`.replace('.0M', 'M');
                } else if (value >= 1000) {
                  return `$${Math.round(value / 1000)}K`;
                } else {
                  return `$${Math.round(value)}`;
                }
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
            
            {showDailyRevenue ? (
              // Show daily revenue as stacked areas with total line
              <>
                {deployments.map((deployment, index) => (
                  <Area
                    key={`${deployment}_daily`}
                    yAxisId="left"
                    dataKey={`${deployment}_daily`}
                    name={`${deployment} Daily`}
                    fill={colors[(index + 1) % colors.length]}
                    stroke={colors[(index + 1) % colors.length]}
                    stackId="daily"
                    hide={!visibleLines[`${deployment}_daily`]}
                    fillOpacity={0.6}
                  />
                ))}
                <Line 
                  yAxisId="right"
                  type="monotone"
                  dataKey="total_daily_revenue"
                  name="Total Daily Revenue"
                  stroke={colors[0]}
                  dot={false}
                  strokeWidth={2}
                  hide={!visibleLines['total_daily_revenue']}
                />
              </>
            ) : (
              // Show cumulative revenue view
              <>
                {deployments.map((deployment, index) => (
                  <Area
                    key={deployment}
                    yAxisId="left"
                    dataKey={deployment}
                    name={deployment}
                    fill={colors[(index + 1) % colors.length]}
                    stroke={colors[(index + 1) % colors.length]}
                    stackId="deployments"
                    hide={!visibleLines[deployment]}
                    fillOpacity={0.6}
                  />
                ))}
                <Line 
                  yAxisId="right"
                  type="monotone"
                  dataKey="total_aggregate_revenue"
                  name="Total Aggregate Revenue"
                  stroke={colors[0]}
                  dot={false}
                  strokeWidth={2}
                  hide={!visibleLines['total_aggregate_revenue']}
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
        <button
          onClick={() => setShowDailyRevenue(!showDailyRevenue)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Show {showDailyRevenue ? 'Total' : 'Daily'} Revenue
        </button>
      </div>
    </div>
  );
};

export default DeploymentRevenueChart;