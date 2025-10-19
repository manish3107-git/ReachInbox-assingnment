import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Grid,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  MarkEmailRead as ReadIcon,
  MarkEmailUnread as UnreadIcon,
  Reply as ReplyIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { emailAPI, aiAPI } from '../services/api';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';

export const EmailDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showReplySuggestion, setShowReplySuggestion] = useState(false);

  const { data: email, isLoading, error } = useQuery(
    ['email', id],
    () => emailAPI.getEmail(id!),
    {
      enabled: !!id,
    }
  );

  const updateEmailMutation = useMutation(
    (updates: any) => emailAPI.updateEmail(id!, updates),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['email', id]);
        queryClient.invalidateQueries('emails');
        toast.success('Email updated successfully');
      },
      onError: () => {
        toast.error('Failed to update email');
      },
    }
  );

  const categorizeMutation = useMutation(
    (data: any) => aiAPI.categorizeEmail(data),
    {
      onSuccess: (response) => {
        updateEmailMutation.mutate({
          aiCategory: response.data.category,
          aiConfidence: response.data.confidence,
        });
        toast.success('Email categorized successfully');
      },
      onError: () => {
        toast.error('Failed to categorize email');
      },
    }
  );

  const replySuggestionMutation = useMutation(
    (data: any) => aiAPI.generateReplySuggestion(data),
    {
      onSuccess: () => {
        setShowReplySuggestion(true);
        toast.success('Reply suggestion generated');
      },
      onError: () => {
        toast.error('Failed to generate reply suggestion');
      },
    }
  );

  const handleToggleImportant = () => {
    updateEmailMutation.mutate({ isImportant: !email?.data.isImportant });
  };

  const handleToggleRead = () => {
    updateEmailMutation.mutate({ isRead: !email?.data.isRead });
  };

  const handleRecategorize = () => {
    categorizeMutation.mutate({
      subject: email?.data.subject,
      body: email?.data.bodyText,
      fromEmail: email?.data.fromEmail,
    });
  };

  const handleGenerateReply = () => {
    replySuggestionMutation.mutate({
      originalEmail: {
        subject: email?.data.subject,
        body: email?.data.bodyText,
        fromEmail: email?.data.fromEmail,
      },
      productInfo: 'ReachInbox - AI-Powered Email Management Platform',
      agenda: 'Schedule a demo to showcase our email automation features',
    });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !email?.data) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load email. Please try again.
        </Alert>
      </Box>
    );
  }

  const emailData = email.data;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/emails')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ flex: 1 }}>
          Email Details
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title={emailData.isImportant ? 'Remove from important' : 'Mark as important'}>
            <IconButton onClick={handleToggleImportant} color={emailData.isImportant ? 'warning' : 'default'}>
              {emailData.isImportant ? <StarIcon /> : <StarBorderIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title={emailData.isRead ? 'Mark as unread' : 'Mark as read'}>
            <IconButton onClick={handleToggleRead} color={emailData.isRead ? 'default' : 'primary'}>
              {emailData.isRead ? <UnreadIcon /> : <ReadIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Recategorize with AI">
            <IconButton onClick={handleRecategorize} color="secondary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Generate Reply Suggestion">
            <IconButton onClick={handleGenerateReply} color="primary">
              <ReplyIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Email Content */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h5" gutterBottom>
                  {emailData.subject || 'No Subject'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Chip
                    label={emailData.aiCategory}
                    color={emailData.aiCategory === 'Interested' ? 'success' : 'default'}
                    variant="outlined"
                  />
                  <Chip
                    label={`${(emailData.aiConfidence * 100).toFixed(0)}% confidence`}
                    color="secondary"
                    variant="outlined"
                  />
                  {emailData.isImportant && (
                    <Chip label="Important" color="warning" variant="outlined" />
                  )}
                  {!emailData.isRead && (
                    <Chip label="Unread" color="primary" variant="outlined" />
                  )}
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  From: {emailData.fromName} &lt;{emailData.fromEmail}&gt;
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  To: {emailData.toEmails?.join(', ')}
                </Typography>
                {emailData.ccEmails?.length > 0 && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    CC: {emailData.ccEmails.join(', ')}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary">
                  Date: {format(new Date(emailData.date), 'PPP p')}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Message
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  {emailData.bodyHtml ? (
                    <div dangerouslySetInnerHTML={{ __html: emailData.bodyHtml }} />
                  ) : (
                    <ReactMarkdown>{emailData.bodyText || 'No content'}</ReactMarkdown>
                  )}
                </Paper>
              </Box>

              {emailData.attachments?.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Attachments ({emailData.attachments.length})
                  </Typography>
                  {emailData.attachments.map((attachment: any, index: number) => (
                    <Chip
                      key={index}
                      label={attachment.filename}
                      variant="outlined"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Email Information
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Account: {emailData.accountName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Folder: {emailData.folder}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Size: {(emailData.size / 1024).toFixed(1)} KB
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Message ID: {emailData.messageId}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={handleRecategorize}
                  disabled={categorizeMutation.isLoading}
                  startIcon={categorizeMutation.isLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
                >
                  Recategorize with AI
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleGenerateReply}
                  disabled={replySuggestionMutation.isLoading}
                  startIcon={replySuggestionMutation.isLoading ? <CircularProgress size={16} /> : <ReplyIcon />}
                >
                  Generate Reply
                </Button>
              </Box>

              {showReplySuggestion && replySuggestionMutation.data && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    AI Reply Suggestion
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'primary.50' }}>
                    <Typography variant="body2">
                      {replySuggestionMutation.data.data.suggestedReply}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Confidence: {(replySuggestionMutation.data.data.confidence * 100).toFixed(0)}%
                    </Typography>
                  </Paper>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
