import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Avatar,
} from '@mui/material';
import {
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  MarkEmailRead as ReadIcon,
  MarkEmailUnread as UnreadIcon,
  Reply as ReplyIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface Email {
  id: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  aiCategory: string;
  aiConfidence: number;
  date: string;
  isRead: boolean;
  isImportant: boolean;
  bodyText: string;
  accountName: string;
  folder: string;
}

interface EmailCardProps {
  email: Email;
  onUpdate?: (id: string, updates: Partial<Email>) => void;
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

export const EmailCard: React.FC<EmailCardProps> = ({ email, onUpdate }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/emails/${email.id}`);
  };

  const handleToggleImportant = (event: React.MouseEvent) => {
    event.stopPropagation();
    onUpdate?.(email.id, { isImportant: !email.isImportant });
  };

  const handleToggleRead = (event: React.MouseEvent) => {
    event.stopPropagation();
    onUpdate?.(email.id, { isRead: !email.isRead });
  };

  const handleReply = (event: React.MouseEvent) => {
    event.stopPropagation();
    // TODO: Implement reply functionality
  };

  return (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-2px)',
        },
        opacity: email.isRead ? 0.7 : 1,
        borderLeft: email.isImportant ? '4px solid #f57c00' : 'none',
      }}
      onClick={handleCardClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', mt: 0.5 }}>
            {email.fromName.charAt(0).toUpperCase()}
          </Avatar>
          
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: email.isRead ? 400 : 600,
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
              <Chip
                label={`${(email.aiConfidence * 100).toFixed(0)}%`}
                size="small"
                variant="outlined"
                color="secondary"
              />
            </Box>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              {email.fromName} &lt;{email.fromEmail}&gt;
            </Typography>

            <Typography
              variant="body2"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                mb: 1,
              }}
            >
              {email.bodyText}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {format(new Date(email.date), 'MMM d, yyyy HH:mm')}
                </Typography>
                <Chip
                  label={email.accountName}
                  size="small"
                  variant="outlined"
                  color="info"
                />
                <Chip
                  label={email.folder}
                  size="small"
                  variant="outlined"
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Tooltip title={email.isImportant ? 'Remove from important' : 'Mark as important'}>
                  <IconButton
                    size="small"
                    onClick={handleToggleImportant}
                    color={email.isImportant ? 'warning' : 'default'}
                  >
                    {email.isImportant ? <StarIcon /> : <StarBorderIcon />}
                  </IconButton>
                </Tooltip>

                <Tooltip title={email.isRead ? 'Mark as unread' : 'Mark as read'}>
                  <IconButton
                    size="small"
                    onClick={handleToggleRead}
                    color={email.isRead ? 'default' : 'primary'}
                  >
                    {email.isRead ? <UnreadIcon /> : <ReadIcon />}
                  </IconButton>
                </Tooltip>

                <Tooltip title="Reply">
                  <IconButton
                    size="small"
                    onClick={handleReply}
                    color="primary"
                  >
                    <ReplyIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};


