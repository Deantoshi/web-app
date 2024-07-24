// RevenueChart.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';

interface ChartData {
  day: string;
  total_revenue: string;
  "7_days_ma_revenue": string;
  "30_days_ma_revenue": string;
  "90_days_ma_revenue": string;
  "180_days_ma_revenue": string;
}

const api_url = 'http://localhost:8000';

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip" style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc' }}>
        <p>{`Day: ${label}`}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value !== undefined ? formatCurrency(entry.value) : 'N/A'}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const formatCurrency = (value: number | undefined): string => {
  if (value === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD' 
  }).format(value);
};

const RevenueChart: React.FC = () => {
  const [allData, setAllData] = useState<Record<string, ChartData[]>>({});

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const response = await axios.get<Record<string, ChartData[]>>(`${api_url}/api/all_revenue_data`);
      setAllData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const parseCurrency = (value: string): number => {
    return parseFloat(value.replace(/[$,]/g, ''));
  };

  const lineColors = {
    total_revenue: "#8884d8",
    "7_days_ma_revenue": "#82ca9d",
    "30_days_ma_revenue": "#ffc658",
    "90_days_ma_revenue": "#ff7300",
    "180_days_ma_revenue": "#a4de6c"
  };

  const trimData = (data: ChartData[]) => {
    const validData = data.filter(d => d.total_revenue !== 'NaN');
    return validData.map(item => {
      const result: any = { day: item.day, total_revenue: parseCurrency(item.total_revenue) };
      (Object.keys(lineColors) as Array<keyof typeof lineColors>).forEach(key => {
        if (key !== 'total_revenue') {
          result[key] = item[key] !== 'NaN' ? parseCurrency(item[key]) : null;
        }
      });
      return result;
    });
  };

  return (
    <div className="revenue-charts">
      <h2>Revenue Charts</h2>
      {Object.entries(allData).map(([filename, rawData]) => {
        const data = trimData(rawData);
        return (
          <div key={filename} className="chart-container">
            <h3>{filename}</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="day"
                  type="category"
                  allowDataOverflow={false}
                />
                <YAxis 
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                  domain={['dataMin', 'dataMax']}
                  scale="linear"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {Object.entries(lineColors).map(([key, color]) => (
                  <Line 
                    key={key}
                    type="monotone" 
                    dataKey={key}
                    name={key.replace(/_/g, ' ').replace('ma', 'MA')}
                    stroke={color}
                    dot={false}
                    isAnimationActive={false}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      })}
    </div>
  );
};

export default RevenueChart;