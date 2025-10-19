import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Pagination,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  AutoAwesome as AIIcon,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { searchAPI } from '../services/api';
import { EmailCard } from '../components/EmailCard';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`search-tabpanel-${index}`}
      aria-labelledby={`search-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export const Search: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    accountId: '',
    folder: '',
    aiCategory: '',
    dateFrom: '',
    dateTo: '',
  });

  // Regular search
  const { data: searchResults, isLoading: searchLoading, error: searchError } = useQuery(
    ['search', searchText, page, filters],
    () => searchAPI.search({
      q: searchText,
      page,
      limit: 20,
      ...filters,
    }),
    {
      enabled: !!searchText && activeTab === 0,
      keepPreviousData: true,
    }
  );

  // Advanced search
  const { data: advancedResults, isLoading: advancedLoading, error: advancedError } = useQuery(
    ['advanced-search', searchText, page, filters],
    () => searchAPI.advancedSearch({
      query: {
        text: searchText,
        fields: ['subject', 'bodyText', 'fromName', 'fromEmail'],
        type: 'best_fields',
        fuzziness: 'AUTO',
      },
      filters,
      page,
      limit: 20,
    }),
    {
      enabled: !!searchText && activeTab === 1,
      keepPreviousData: true,
    }
  );

  // Semantic search
  const { data: semanticResults, isLoading: semanticLoading, error: semanticError } = useQuery(
    ['semantic-search', searchText, filters],
    () => searchAPI.semanticSearch({
      query: searchText,
      filters,
      limit: 20,
    }),
    {
      enabled: !!searchText && activeTab === 2,
      keepPreviousData: true,
    }
  );

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
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
    setSearchText('');
    setFilters({
      accountId: '',
      folder: '',
      aiCategory: '',
      dateFrom: '',
      dateTo: '',
    });
    setPage(1);
  };

  const getCurrentResults = () => {
    switch (activeTab) {
      case 0:
        return searchResults;
      case 1:
        return advancedResults;
      case 2:
        return semanticResults;
      default:
        return null;
    }
  };

  const getCurrentLoading = () => {
    switch (activeTab) {
      case 0:
        return searchLoading;
      case 1:
        return advancedLoading;
      case 2:
        return semanticLoading;
      default:
        return false;
    }
  };

  const getCurrentError = () => {
    switch (activeTab) {
      case 0:
        return searchError;
      case 1:
        return advancedError;
      case 2:
        return semanticError;
      default:
        return null;
    }
  };

  const currentResults = getCurrentResults();
  const currentLoading = getCurrentLoading();
  const currentError = getCurrentError();
  const emails = currentResults?.data?.emails || [];
  const pagination = currentResults?.data?.pagination || {};

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Search Emails
      </Typography>

      {/* Search Form */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <form onSubmit={handleSearch}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Search emails..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={!searchText}
                >
                  Search
                </Button>
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={clearFilters}
                  fullWidth
                >
                  Clear
                </Button>
              </Grid>
            </Grid>

            {/* Filters */}
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} md={3}>
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
              <Grid item xs={12} md={3}>
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
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="From Date"
                  type="date"
                  value={filters.dateFrom}
                  onChange={handleFilterChange('dateFrom')}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="To Date"
                  type="date"
                  value={filters.dateTo}
                  onChange={handleFilterChange('dateTo')}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      {/* Search Tabs */}
      <Card>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
              <Tab label="Regular Search" />
              <Tab label="Advanced Search" />
              <Tab 
                label="AI Semantic Search" 
                icon={<AIIcon />}
                iconPosition="start"
              />
            </Tabs>
          </Box>

          <TabPanel value={activeTab} index={0}>
            <RegularSearchResults 
              emails={emails}
              loading={currentLoading}
              error={currentError}
              pagination={pagination}
              onPageChange={setPage}
            />
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <AdvancedSearchResults 
              emails={emails}
              loading={currentLoading}
              error={currentError}
              pagination={pagination}
              onPageChange={setPage}
            />
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <SemanticSearchResults 
              emails={emails}
              loading={currentLoading}
              error={currentError}
            />
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
};

interface SearchResultsProps {
  emails: any[];
  loading: boolean;
  error: any;
  pagination?: any;
  onPageChange?: (page: number) => void;
}

const RegularSearchResults: React.FC<SearchResultsProps> = ({ 
  emails, 
  loading, 
  error, 
  pagination, 
  onPageChange 
}) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Search failed. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Found {emails.length} emails using regular search
      </Typography>
      <Grid container spacing={2}>
        {emails.map((email: any) => (
          <Grid item xs={12} key={email.id}>
            <EmailCard email={email} />
          </Grid>
        ))}
      </Grid>
      {pagination?.totalPages > 1 && onPageChange && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={pagination.totalPages}
            page={pagination.page}
            onChange={(_, value) => onPageChange(value)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};

const AdvancedSearchResults: React.FC<SearchResultsProps> = ({ 
  emails, 
  loading, 
  error, 
  pagination, 
  onPageChange 
}) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Advanced search failed. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Found {emails.length} emails using advanced search with fuzzy matching
      </Typography>
      <Grid container spacing={2}>
        {emails.map((email: any) => (
          <Grid item xs={12} key={email.id}>
            <EmailCard email={email} />
          </Grid>
        ))}
      </Grid>
      {pagination?.totalPages > 1 && onPageChange && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={pagination.totalPages}
            page={pagination.page}
            onChange={(_, value) => onPageChange(value)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};

const SemanticSearchResults: React.FC<SearchResultsProps> = ({ 
  emails, 
  loading, 
  error 
}) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Semantic search failed. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Found {emails.length} semantically similar emails using AI
      </Typography>
      <Grid container spacing={2}>
        {emails.map((email: any) => (
          <Grid item xs={12} key={email.id}>
            <EmailCard email={email} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
