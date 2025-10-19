import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Card,
  CardContent,
  Grid,
  Pagination,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Search as SearchIcon, FilterList as FilterIcon } from '@mui/icons-material';
import { useQuery } from 'react-query';
import { emailAPI } from '../services/api';
import { EmailCard } from '../components/EmailCard';

export const EmailList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    accountId: '',
    folder: '',
    aiCategory: '',
    isRead: '',
    isImportant: '',
  });

  const { data, isLoading, error, refetch } = useQuery(
    ['emails', page, search, filters],
    () => emailAPI.getEmails({
      page,
      limit: 20,
      search: search || undefined,
      ...filters,
    }),
    {
      keepPreviousData: true,
    }
  );

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleFilterChange = (field: string) => (event: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setFilters({
      accountId: '',
      folder: '',
      aiCategory: '',
      isRead: '',
      isImportant: '',
    });
    setPage(1);
  };

  const emails = data?.data?.emails || [];
  const pagination = data?.data?.pagination || {};

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load emails. Please try again.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Emails
      </Typography>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search emails..."
                value={search}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={filters.aiCategory}
                  onChange={handleFilterChange('aiCategory')}
                  label="Category"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Interested">Interested</MenuItem>
                  <MenuItem value="Meeting Booked">Meeting Booked</MenuItem>
                  <MenuItem value="Not Interested">Not Interested</MenuItem>
                  <MenuItem value="Spam">Spam</MenuItem>
                  <MenuItem value="Out of Office">Out of Office</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Folder</InputLabel>
                <Select
                  value={filters.folder}
                  onChange={handleFilterChange('folder')}
                  label="Folder"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="INBOX">Inbox</MenuItem>
                  <MenuItem value="SENT">Sent</MenuItem>
                  <MenuItem value="SPAM">Spam</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.isRead}
                  onChange={handleFilterChange('isRead')}
                  label="Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="true">Read</MenuItem>
                  <MenuItem value="false">Unread</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={clearFilters}
                fullWidth
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Showing {emails.length} of {pagination.totalCount} emails
            </Typography>
          </Box>

          <Grid container spacing={2}>
            {emails.map((email: any) => (
              <Grid item xs={12} key={email.id}>
                <EmailCard email={email} />
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={pagination.totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};
