import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Grid,
  Divider,
} from '@mui/material';
import {
  AccountCircle as AccountIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { emailAPI, aiAPI } from '../services/api';
import toast from 'react-hot-toast';

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
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [settings, setSettings] = useState({
    emailSync: true,
    aiCategorization: true,
    slackNotifications: true,
    webhookEnabled: true,
    autoReply: false,
  });

  const queryClient = useQueryClient();

  const { data: accounts, isLoading: accountsLoading } = useQuery(
    'email-accounts',
    () => emailAPI.getAccounts()
  );

  const { data: aiStatus, isLoading: aiStatusLoading } = useQuery(
    'ai-status',
    () => aiAPI.getStatus()
  );

  const addAccountMutation = useMutation(
    (accountData: any) => emailAPI.addAccount(accountData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('email-accounts');
        toast.success('Email account added successfully');
      },
      onError: () => {
        toast.error('Failed to add email account');
      },
    }
  );

  const handleSettingChange = (setting: string) => (event: any) => {
    setSettings(prev => ({
      ...prev,
      [setting]: event.target.checked,
    }));
  };

  const handleAddAccount = (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    const accountData = {
      name: formData.get('name'),
      host: formData.get('host'),
      port: parseInt(formData.get('port') as string),
      secure: formData.get('secure') === 'on',
      username: formData.get('username'),
      password: formData.get('password'),
      folders: ['INBOX', 'SENT'],
      isActive: true,
    };
    addAccountMutation.mutate(accountData);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab icon={<AccountIcon />} label="Email Accounts" />
            <Tab icon={<NotificationsIcon />} label="Notifications" />
            <Tab icon={<SecurityIcon />} label="Security" />
            <Tab icon={<StorageIcon />} label="Storage" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <EmailAccountsTab 
            accounts={accounts?.data || []}
            loading={accountsLoading}
            onAddAccount={handleAddAccount}
            addAccountLoading={addAccountMutation.isLoading}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <NotificationsTab 
            settings={settings}
            onSettingChange={handleSettingChange}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <SecurityTab />
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <StorageTab 
            aiStatus={aiStatus?.data}
            loading={aiStatusLoading}
          />
        </TabPanel>
      </Card>
    </Box>
  );
};

interface EmailAccountsTabProps {
  accounts: any[];
  loading: boolean;
  onAddAccount: (event: React.FormEvent) => void;
  addAccountLoading: boolean;
}

const EmailAccountsTab: React.FC<EmailAccountsTabProps> = ({
  accounts,
  loading,
  onAddAccount,
  addAccountLoading,
}) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Email Accounts
      </Typography>
      
      {accounts.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {accounts.map((account: any, index: number) => (
            <Card key={index} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6">{account.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {account.username} • {account.host}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Status: {account.is_active ? 'Active' : 'Inactive'}
                    </Typography>
                  </Box>
                  <Button variant="outlined" color="error">
                    Remove
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Add New Email Account
          </Typography>
          <form onSubmit={onAddAccount}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Account Name"
                  name="name"
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  name="username"
                  type="email"
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="IMAP Host"
                  name="host"
                  placeholder="imap.gmail.com"
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Port"
                  name="port"
                  type="number"
                  defaultValue={993}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={<Switch name="secure" defaultChecked />}
                  label="Use SSL/TLS"
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={addAccountLoading}
                  startIcon={addAccountLoading ? <CircularProgress size={16} /> : undefined}
                >
                  Add Account
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

interface NotificationsTabProps {
  settings: any;
  onSettingChange: (setting: string) => (event: any) => void;
}

const NotificationsTab: React.FC<NotificationsTabProps> = ({
  settings,
  onSettingChange,
}) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Notification Settings
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.emailSync}
              onChange={onSettingChange('emailSync')}
            />
          }
          label="Enable Real-time Email Sync"
        />
        
        <FormControlLabel
          control={
            <Switch
              checked={settings.aiCategorization}
              onChange={onSettingChange('aiCategorization')}
            />
          }
          label="Enable AI Email Categorization"
        />
        
        <FormControlLabel
          control={
            <Switch
              checked={settings.slackNotifications}
              onChange={onSettingChange('slackNotifications')}
            />
          }
          label="Enable Slack Notifications for Interested Emails"
        />
        
        <FormControlLabel
          control={
            <Switch
              checked={settings.webhookEnabled}
              onChange={onSettingChange('webhookEnabled')}
            />
          }
          label="Enable Webhook Notifications"
        />
        
        <FormControlLabel
          control={
            <Switch
              checked={settings.autoReply}
              onChange={onSettingChange('autoReply')}
            />
          }
          label="Enable AI Auto-Reply Suggestions"
        />
      </Box>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Slack Configuration
      </Typography>
      <TextField
        fullWidth
        label="Slack Webhook URL"
        placeholder="https://hooks.slack.com/services/..."
        sx={{ mb: 2 }}
      />
      <TextField
        fullWidth
        label="Slack Channel"
        placeholder="#email-notifications"
        sx={{ mb: 2 }}
      />
      <Button variant="contained">
        Test Slack Integration
      </Button>
    </Box>
  );
};

const SecurityTab: React.FC = () => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Security Settings
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        Security features are automatically enabled. All email data is encrypted in transit and at rest.
      </Alert>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          fullWidth
          label="API Key"
          value="••••••••••••••••"
          disabled
          helperText="Your API key for external integrations"
        />
        
        <Button variant="outlined" color="warning">
          Regenerate API Key
        </Button>
        
        <Button variant="outlined" color="error">
          Clear All Data
        </Button>
      </Box>
    </Box>
  );
};

interface StorageTabProps {
  aiStatus: any;
  loading: boolean;
}

const StorageTab: React.FC<StorageTabProps> = ({ aiStatus, loading }) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Storage & AI Configuration
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                AI Service Status
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2">
                  Provider: {aiStatus?.provider || 'Not configured'}
                </Typography>
                <Typography variant="body2">
                  OpenAI: {aiStatus?.availableProviders?.openai ? 'Available' : 'Not configured'}
                </Typography>
                <Typography variant="body2">
                  Anthropic: {aiStatus?.availableProviders?.anthropic ? 'Available' : 'Not configured'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Storage Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2">
                  Database: PostgreSQL
                </Typography>
                <Typography variant="body2">
                  Search: Elasticsearch
                </Typography>
                <Typography variant="body2">
                  Vector DB: ChromaDB
                </Typography>
                <Typography variant="body2">
                  Cache: Redis
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Data Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined">
            Export Data
          </Button>
          <Button variant="outlined" color="warning">
            Clear Cache
          </Button>
          <Button variant="outlined" color="error">
            Reset All Data
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
