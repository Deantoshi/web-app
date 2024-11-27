// TokenRevenuePieChart.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Sector, ResponsiveContainer, Cell } from 'recharts';

interface TokenRevenueData {
  token_name: string;
  token_revenue: number;
}

const api_url = 'https://frontend-dot-internal-website-427620.uc.r.appspot.com';

const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

const TOKEN_COLORS: { [key: string]: string } = {
    'USDC': '#2775CA',
    'ETH': '#627EEA',
    'ARB': '#28A0F0',
    'USDT': '#26A17B',
    'WBTC': '#F09242',
    'MODE': '#31C1FF',
    'METIS': '#00DACC',
    'WETH': '#EC68A1',
    'DAI': '#F5AC37',
    'sUSD': '#4943c2',
    'OP': '#FF0420',
    'USDe': '#3366FF',
    'METH': '#9B51E0',
    'wrsETH': '#FF6B6B',
    'WSTETH': '#00A3FF',
    'MNT': '#24BE9E',
    'SNX': '#00D1FF',
    'weETHMode': '#4CAF50',
    'USDY': '#FFA726',
    'MBTC': '#FF4081',
    'CBETH': '#627EEA',
    'ezETH': '#8E44AD',
    'RETH': '#F2994A',
    'BAL': '#7a9244'
};

const DEFAULT_COLOR = '#8884d8';

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
        {payload.token_name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#80ed99">{`Revenue: ${formatCurrency(value)}`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#fcf6bd">
        {`(Rev. Share: ${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

const TokenRevenuePieChart: React.FC = () => {
  const [data, setData] = useState<TokenRevenueData[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get<Record<string, TokenRevenueData[]>>(`${api_url}/api/token_revenue_data`);
      // Assuming we're using the first file's data
      const firstFileData = Object.values(response.data)[0];
      setData(firstFileData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  return (
    <div style={{ width: '100%', height: 275 }}>
    <ResponsiveContainer>
        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={70}
            fill="#8884d8"
            dataKey="token_revenue"
            onMouseEnter={onPieEnter}
        >
            {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={TOKEN_COLORS[entry.token_name] || DEFAULT_COLOR} />
            ))}
        </Pie>
        </PieChart>
    </ResponsiveContainer>
    </div>
  );
};

export default TokenRevenuePieChart;