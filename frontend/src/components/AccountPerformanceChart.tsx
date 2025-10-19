import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Box, Typography } from '@mui/material';

interface AccountPerformanceChartProps {
  data: Array<{
    account_name: string;
    email_count: number;
    interested_count: number;
  }>;
}

export const AccountPerformanceChart: React.FC<AccountPerformanceChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          No account data available
        </Typography>
      </Box>
    );
  }

  const chartData = data.map(account => ({
    name: account.account_name,
    total: account.email_count,
    interested: account.interested_count,
    conversion: account.email_count > 0 ? (account.interested_count / account.email_count * 100).toFixed(1) : 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip 
          formatter={(value, name) => [
            name === 'conversion' ? `${value}%` : value,
            name === 'conversion' ? 'Conversion Rate' : name === 'total' ? 'Total Emails' : 'Interested'
          ]}
        />
        <Bar dataKey="total" fill="#1976d2" name="Total Emails" />
        <Bar dataKey="interested" fill="#2e7d32" name="Interested" />
      </BarChart>
    </ResponsiveContainer>
  );
};
