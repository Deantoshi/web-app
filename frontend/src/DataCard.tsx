import React from 'react';

interface DataCardProps {
  title: string;
  value: string;
  total: number;
  color: string;
}

const DataCard: React.FC<DataCardProps> = ({ title, value, total, color }) => {
  const percentage = (parseFloat(value) / total) * 100;

  return (
    <div className="bg-gray-100 rounded-lg p-4 w-48 h-48 flex flex-col items-center justify-center">
      <h3 className="text-lg font-semibold mb-2 text-gray-800">{title}</h3>
      <p className="text-2xl font-bold mb-1" style={{ color }}>
        ${parseFloat(value).toLocaleString()}
      </p>
      <p className="text-sm text-gray-600 mb-2">
        out of ${total.toLocaleString()}
      </p>
      <div className="w-full h-4 bg-gray-200 rounded-full relative overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        ></div>
        {[25, 50, 75].map((notch) => (
          <div
            key={notch}
            className="absolute top-0 bottom-0 w-0.5 bg-gray-300"
            style={{ left: `${notch}%` }}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default DataCard;