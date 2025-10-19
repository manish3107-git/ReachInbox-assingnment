import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Divider,
} from '@mui/material';
import { Email as EmailIcon } from '@mui/icons-material';
import { format } from 'date-fns';

interface Email {
  id: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  aiCategory: string;
  date: string;
}

interface RecentActivityProps {
  emails: Email[];
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Interested':
      return 'success';
    case 'Meeting Booked':
      return 'primary';
    case 'Not Interested':
      return 'error';
    case 'Spam':
      return 'default';
    case 'Out of Office':
      return 'warning';
    default:
      return 'default';
  }
};

export const RecentActivity: React.FC<RecentActivityProps> = ({ emails }) => {
  if (emails.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          No recent emails
        </Typography>
      </Box>
    );
  }

  return (
    <List sx={{ maxHeight: 400, overflow: 'auto' }}>
      {emails.map((email, index) => (
        <React.Fragment key={email.id}>
          <ListItem
            sx={{
              py: 1,
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <EmailIcon />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                    }}
                  >
                    {email.subject || 'No Subject'}
                  </Typography>
                  <Chip
                    label={email.aiCategory}
                    size="small"
                    color={getCategoryColor(email.aiCategory) as any}
                    variant="outlined"
                  />
                </Box>
              }
              secondary={
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {email.fromName} &lt;{email.fromEmail}&gt;
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    • {format(new Date(email.date), 'MMM d, HH:mm')}
                  </Typography>
                </Box>
              }
            />
          </ListItem>
          {index < emails.length - 1 && <Divider variant="inset" component="li" />}
        </React.Fragment>
      ))}
    </List>
  );
};


