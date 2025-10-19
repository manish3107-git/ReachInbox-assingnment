import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock data - in a real app, this would come from the API
const mockData = [
  { date: '2024-01-01', emails: 45, interested: 12 },
  { date: '2024-01-02', emails: 52, interested: 15 },
  { date: '2024-01-03', emails: 38, interested: 8 },
  { date: '2024-01-04', emails: 61, interested: 18 },
  { date: '2024-01-05', emails: 47, interested: 11 },
  { date: '2024-01-06', emails: 55, interested: 16 },
  { date: '2024-01-07', emails: 42, interested: 9 },
];

export const EmailTrendsChart: React.FC = () => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={mockData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line 
          type="monotone" 
          dataKey="emails" 
          stroke="#1976d2" 
          strokeWidth={2}
          name="Total Emails"
        />
        <Line 
          type="monotone" 
          dataKey="interested" 
          stroke="#2e7d32" 
          strokeWidth={2}
          name="Interested"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};


