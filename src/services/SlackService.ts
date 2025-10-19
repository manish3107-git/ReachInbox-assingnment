import axios from 'axios';
import { logger } from '../utils/logger';
import { EmailDocument } from './ElasticsearchService';

export class SlackService {
  private webhookUrl: string;
  private channel: string;

  constructor() {
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL || '';
    this.channel = process.env.SLACK_CHANNEL || '#email-notifications';
  }

  async sendInterestedEmailNotification(email: EmailDocument): Promise<void> {
    if (!this.webhookUrl) {
      logger.warn('Slack webhook URL not configured');
      return;
    }

    try {
      const message = {
        channel: this.channel,
        username: 'ReachInbox Bot',
        icon_emoji: ':email:',
        attachments: [
          {
            color: 'good',
            title: 'New Interested Email',
            title_link: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/emails/${email.id}`,
            fields: [
              {
                title: 'From',
                value: `${email.fromName} <${email.fromEmail}>`,
                short: true
              },
              {
                title: 'Subject',
                value: email.subject || 'No Subject',
                short: true
              },
              {
                title: 'Account',
                value: email.accountName,
                short: true
              },
              {
                title: 'Folder',
                value: email.folder,
                short: true
              },
              {
                title: 'AI Confidence',
                value: `${(email.aiConfidence * 100).toFixed(1)}%`,
                short: true
              },
              {
                title: 'Date',
                value: new Date(email.date).toLocaleString(),
                short: true
              }
            ],
            text: email.bodyText?.substring(0, 200) + (email.bodyText?.length > 200 ? '...' : ''),
            footer: 'ReachInbox',
            ts: Math.floor(new Date(email.date).getTime() / 1000)
          }
        ]
      };

      await axios.post(this.webhookUrl, message);
      logger.info(`Slack notification sent for email: ${email.messageId}`);
      
    } catch (error) {
      logger.error('Failed to send Slack notification:', error);
    }
  }

  async sendCustomNotification(message: string, channel?: string): Promise<void> {
    if (!this.webhookUrl) {
      logger.warn('Slack webhook URL not configured');
      return;
    }

    try {
      const payload = {
        channel: channel || this.channel,
        username: 'ReachInbox Bot',
        icon_emoji: ':robot_face:',
        text: message
      };

      await axios.post(this.webhookUrl, payload);
      logger.info('Custom Slack notification sent');
      
    } catch (error) {
      logger.error('Failed to send custom Slack notification:', error);
    }
  }

  async sendErrorNotification(error: string, context?: string): Promise<void> {
    if (!this.webhookUrl) {
      logger.warn('Slack webhook URL not configured');
      return;
    }

    try {
      const message = {
        channel: this.channel,
        username: 'ReachInbox Error Bot',
        icon_emoji: ':warning:',
        attachments: [
          {
            color: 'danger',
            title: 'System Error',
            fields: [
              {
                title: 'Error',
                value: error,
                short: false
              },
              {
                title: 'Context',
                value: context || 'No context provided',
                short: false
              },
              {
                title: 'Time',
                value: new Date().toLocaleString(),
                short: true
              }
            ],
            footer: 'ReachInbox Error Monitoring',
            ts: Math.floor(Date.now() / 1000)
          }
        ]
      };

      await axios.post(this.webhookUrl, message);
      logger.info('Error Slack notification sent');
      
    } catch (error) {
      logger.error('Failed to send error Slack notification:', error);
    }
  }
}


