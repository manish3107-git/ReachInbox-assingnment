import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  Email as EmailIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { emailAPI } from '../services/api';
// import { EmailList } from '../components/EmailList'; // This is a page, not a component
import { CategoryChart } from '../components/CategoryChart';
import { RecentActivity } from '../components/RecentActivity';

export const Dashboard: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useQuery(
    'dashboard-stats',
    () => emailAPI.getStats(),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  const { data: recentEmails, isLoading: emailsLoading } = useQuery(
    'recent-emails',
    () => emailAPI.getEmails({ limit: 10, page: 1 }),
    {
      refetchInterval: 10000, // Refetch every 10 seconds
    }
  );

  if (statsLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  const overview = stats?.data?.overview || {};
  const byAccount = stats?.data?.byAccount || [];
  const byFolder = stats?.data?.byFolder || [];

  const statCards = [
    {
      title: 'Total Emails',
      value: overview.total_emails || 0,
      icon: <EmailIcon />,
      color: '#1976d2',
    },
    {
      title: 'Interested',
      value: overview.interested_emails || 0,
      icon: <StarIcon />,
      color: '#2e7d32',
    },
    {
      title: 'Meetings Booked',
      value: overview.meeting_emails || 0,
      icon: <ScheduleIcon />,
      color: '#1976d2',
    },
    {
      title: 'Read Emails',
      value: overview.read_emails || 0,
      icon: <TrendingUpIcon />,
      color: '#f57c00',
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      backgroundColor: `${card.color}20`,
                      color: card.color,
                      mr: 2,
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Typography variant="h6" component="div">
                    {card.title}
                  </Typography>
                </Box>
                <Typography variant="h3" color="primary">
                  {card.value.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Category Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Email Categories
              </Typography>
              <CategoryChart data={overview} />
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Emails */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Emails
              </Typography>
              <RecentActivity emails={recentEmails?.data?.emails || []} />
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
              <Box sx={{ mt: 2 }}>
                {byAccount.map((account: any, index: number) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 1,
                      borderBottom: index < byAccount.length - 1 ? '1px solid #e0e0e0' : 'none',
                    }}
                  >
                    <Typography variant="body2">{account.account_name}</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        label={`${account.email_count} emails`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={`${account.interested_count} interested`}
                        size="small"
                        color="success"
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
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
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        label={`${folder.email_count} emails`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={`${folder.interested_count} interested`}
                        size="small"
                        color="success"
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
