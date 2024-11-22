import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

interface RevenueData {
  day: string;
  todays_revenue: string;
  '7_day_revenue': string;
  '30_day_revenue': string;
  '90_day_revenue': string;
  '180_day_revenue': string;
  target_daily_revenue: string;
}

interface DataCardProps {
  title: string;
  value: string;
  total: number;
  color: string;
}

const api_url = "http://localhost:8000";
const LEND_FILE = 'lend_revenue_data_card.zip';
const OUR_LEND_FILE = 'our_lend_revenue_data_card.zip';

const DataCard: React.FC<DataCardProps> = ({ title, value, total, color }) => {
  const percentage = (parseFloat(value) / total) * 100;

  return (
    <div style={{ 
      width: 200, 
      height: 200, 
      border: '2px solid black', 
      borderRadius: 10, 
      padding: 10,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#b7b7a4'
    }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#000000' }}>{title}</h3>
      <p style={{ fontSize: 24, fontWeight: 'bold', color, margin: '10px 0' }}>
        ${parseFloat(value).toLocaleString()}
      </p>
      <p style={{ margin: '5px 0', color: '#000000' }}>
        out of ${total.toLocaleString()}
      </p>
      <div style={{
        width: '100%',
        height: 10,
        backgroundColor: '#eee',
        borderRadius: 5,
        overflow: 'hidden',
        margin: '10px 0',
        position: 'relative',
        border: '2px solid black', // Added black border
        boxSizing: 'border-box' // Ensures border doesn't increase overall size
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          backgroundColor: color,
          position: 'absolute',
          left: 0,
          top: 0
        }}></div>
        {[25, 50, 75].map((notchPercentage) => (
          <div
            key={notchPercentage}
            style={{
              position: 'absolute',
              left: `${notchPercentage}%`,
              top: 0,
              bottom: 0,
              width: 2,
              backgroundColor: 'black',
              transform: 'skew(-45deg)',
              zIndex: 1
            }}
          ></div>
        ))}
      </div>
    </div>
  );
};

const RevenueCards: React.FC = () => {
  const [lendData, setLendData] = useState<RevenueData | null>(null);
  const [ourLendData, setOurLendData] = useState<RevenueData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBothDataSets = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch both datasets in parallel
        const [lendResponse, ourLendResponse] = await Promise.all([
          axios.get<RevenueData[]>(`${api_url}/api/revenue_card_data`, {
            params: { filename: LEND_FILE }
          }),
          axios.get<RevenueData[]>(`${api_url}/api/revenue_card_data`, {
            params: { filename: OUR_LEND_FILE }
          })
        ]);

        setLendData(lendResponse.data[0]);
        setOurLendData(ourLendResponse.data[0]);
      } catch (error) {
        setError('Error fetching revenue data');
        console.error('Error fetching revenue data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBothDataSets();
  }, []);

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const cardData = [
    { title: "Today's Revenue", key: 'todays_revenue', color: '#386641' },
    { title: '7 Day Revenue', key: '7_day_revenue', color: '#6a4c93' },
    { title: '30 Day Revenue', key: '30_day_revenue', color: '#118ab2' },
    { title: '90 Day Revenue', key: '90_day_revenue', color: '#c9182c' },
    { title: '180 Day Revenue', key: '180_day_revenue', color: '#782832' },
  ];

  return (
    <div>
      {lendData && (
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 20 }}>
            {cardData.map((card) => (
              <DataCard
                key={card.key}
                title={card.title}
                value={lendData[card.key as keyof RevenueData]}
                total={parseFloat(lendData.target_daily_revenue) * 
                  (card.key === 'todays_revenue' ? 1 : parseInt(card.key))}
                color={card.color}
              />
            ))}
          </div>
        </div>
      )}

      {ourLendData && (
        <div>
          <h2>Bottom Line Revenue Goals (30% Rev. Capture)</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 20 }}>
            {cardData.map((card) => (
              <DataCard
                key={`30-percent-${card.key}`}
                title={card.title}
                value={ourLendData[card.key as keyof RevenueData]}
                total={parseFloat(ourLendData.target_daily_revenue) * .3 *
                  (card.key === 'todays_revenue' ? 1 : parseInt(card.key))}
                color={card.color}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueCards;