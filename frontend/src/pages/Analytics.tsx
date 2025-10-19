import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useQuery } from 'react-query';
import { emailAPI, searchAPI } from '../services/api';
import { CategoryChart } from '../components/CategoryChart';
import { EmailTrendsChart } from '../components/EmailTrendsChart';
import { AccountPerformanceChart } from '../components/AccountPerformanceChart';

export const Analytics: React.FC = () => {
  const { data: emailStats, isLoading: emailStatsLoading, error: emailStatsError } = useQuery(
    'email-analytics',
    () => emailAPI.getStats(),
    {
      refetchInterval: 60000, // Refetch every minute
    }
  );

  const { data: searchStats, isLoading: searchStatsLoading, error: searchStatsError } = useQuery(
    'search-analytics',
    () => searchAPI.getStats(),
    {
      refetchInterval: 60000,
    }
  );

  if (emailStatsLoading || searchStatsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (emailStatsError || searchStatsError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load analytics data. Please try again.
        </Alert>
      </Box>
    );
  }

  const overview = emailStats?.data?.overview || {};
  const byAccount = emailStats?.data?.byAccount || [];
  const byFolder = emailStats?.data?.byFolder || [];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Analytics Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Email Categories Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Email Categories Distribution
              </Typography>
              <CategoryChart data={overview} />
            </CardContent>
          </Card>
        </Grid>

        {/* Email Trends Over Time */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Email Trends (Last 30 Days)
              </Typography>
              <EmailTrendsChart />
            </CardContent>
          </Card>
        </Grid>

        {/* Account Performance */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Performance
              </Typography>
              <AccountPerformanceChart data={byAccount} />
            </CardContent>
          </Card>
        </Grid>

        {/* Folder Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Folder Distribution
              </Typography>
              <Box sx={{ mt: 2 }}>
                {byFolder.map((folder: any, index: number) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 1,
                      borderBottom: index < byFolder.length - 1 ? '1px solid #e0e0e0' : 'none',
                    }}
                  >
                    <Typography variant="body2">{folder.folder}</Typography>
                    <Typography variant="body2" color="primary">
                      {folder.email_count} emails
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Key Metrics */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Key Metrics
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="primary">
                      {overview.total_emails || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Emails
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="success.main">
                      {overview.interested_emails || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Interested Emails
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="info.main">
                      {overview.meeting_emails || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Meetings Booked
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="warning.main">
                      {overview.read_emails || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Read Emails
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
