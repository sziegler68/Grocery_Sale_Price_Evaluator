import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { formatPrice } from './priceUtils';

interface PriceEntry {
  date: Date;
  price: number;
  unitPrice: number;
  storeName: string;
}

interface PriceChartProps {
  data: PriceEntry[];
  darkMode: boolean;
}

const PriceChart: React.FC<PriceChartProps> = ({ data, darkMode }) => {
  const chartData = data.map(entry => ({
    date: format(entry.date, 'MMM dd'),
    fullDate: entry.date,
    unitPrice: entry.unitPrice,
    price: entry.price,
    store: entry.storeName
  })).sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime());

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={`p-3 rounded-lg shadow-lg border ${
          darkMode ? 'bg-zinc-800 border-zinc-600' : 'bg-white border-gray-200'
        }`}>
          <p className="font-medium">{label}</p>
          <p className="text-purple-600">
            Unit Price: ${formatPrice(payload[0].value)}
          </p>
          <p className="text-sm text-gray-500">
            Total: ${data.price.toFixed(2)} at {data.store}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
          <XAxis 
            dataKey="date" 
            stroke={darkMode ? '#9ca3af' : '#6b7280'}
            fontSize={12}
          />
          <YAxis 
            stroke={darkMode ? '#9ca3af' : '#6b7280'}
            fontSize={12}
            tickFormatter={(value) => `$${value.toFixed(2)}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="unitPrice" 
            stroke="#7c3aed" 
            strokeWidth={2}
            dot={{ fill: '#7c3aed', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#7c3aed', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceChart;