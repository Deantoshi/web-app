import React, { useState, useEffect } from 'react';

interface RewarderData {
  protocol: string;
  rewarder_type: string;
  rewarder_address: string;
  rewarder_balance: number;
  reward_token_symbol: string;
  reward_token_address: string;
  timestamp: string;
  rewarder_link: string;
  reward_token_link: string;
}

interface GroupedRewarderData {
  [protocol: string]: RewarderData[];
}

const api_url = 'http://localhost:8000';

const RewarderDataDisplay: React.FC = () => {
  const [data, setData] = useState<GroupedRewarderData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${api_url}/api/rewarder_data`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        setData(jsonData);
      } catch (err) {
        setError('Failed to fetch data: ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No data available</div>;

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getBalanceColor = (rewarderType: string, balance: number) => {
    switch (rewarderType) {
      case 'lending_pool':
        return balance < 150000 ? '#fed700' : 'inherit';
      case 'stability_pool':
        return balance < 10000 ? '#fed700' : 'inherit';
      case 'reliquary_mrp_token':
        return balance < 150000 ? '#fed700' : 'inherit';
      case 'reliquary_other_token':
        return balance < 1.25 ? '#fed700' : 'inherit';
      case 'discount_exercise':
        return balance < 300000 ? '#fed700' : 'inherit';
      default:
        return 'inherit';
    }
  };

  return (
    <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>MRP Hub</h1>
      <h2>Rewarder Data</h2>
      {Object.entries(data).map(([protocol, rewarders]) => (
        <div key={protocol} style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>{capitalizeFirstLetter(protocol)}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {rewarders.map((rewarder, index) => (
              <div key={index} style={{ 
                border: '1px solid #ccc', 
                borderRadius: '0.5rem', 
                padding: '1rem',
                backgroundColor: '#1e1e24',
                color: '#fff8f0'
              }}>
                <h4 style={{ marginTop: 0 }}>Rewarder Type: {rewarder.rewarder_type}</h4>
                <p style={{ color: getBalanceColor(rewarder.rewarder_type, rewarder.rewarder_balance) }}>
                  Balance: {formatNumber(rewarder.rewarder_balance)} {rewarder.reward_token_symbol}
                </p>
                <p>Token: <a href={rewarder.reward_token_link} target="_blank" rel="noopener noreferrer" style={{ color: '#66b3ff' }}>{rewarder.reward_token_address}</a></p>
                <p>Rewarder: <a href={rewarder.rewarder_link} target="_blank" rel="noopener noreferrer" style={{ color: '#66b3ff' }}>{rewarder.rewarder_address}</a></p>
                <p>Last Checked: {rewarder.timestamp}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RewarderDataDisplay;