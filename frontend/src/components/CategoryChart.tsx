import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Box, Typography } from '@mui/material';

interface CategoryChartProps {
  data: {
    interested_emails?: number;
    meeting_emails?: number;
    not_interested_emails?: number;
    spam_emails?: number;
    ooo_emails?: number;
  };
}

const COLORS = {
  interested: '#2e7d32',
  meeting: '#1976d2',
  not_interested: '#d32f2f',
  spam: '#7b1fa2',
  ooo: '#f57c00',
};

export const CategoryChart: React.FC<CategoryChartProps> = ({ data }) => {
  const chartData = [
    {
      name: 'Interested',
      value: data.interested_emails || 0,
      color: COLORS.interested,
    },
    {
      name: 'Meeting Booked',
      value: data.meeting_emails || 0,
      color: COLORS.meeting,
    },
    {
      name: 'Not Interested',
      value: data.not_interested_emails || 0,
      color: COLORS.not_interested,
    },
    {
      name: 'Spam',
      value: data.spam_emails || 0,
      color: COLORS.spam,
    },
    {
      name: 'Out of Office',
      value: data.ooo_emails || 0,
      color: COLORS.ooo,
    },
  ].filter(item => item.value > 0);

  if (chartData.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          No data available
        </Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};
