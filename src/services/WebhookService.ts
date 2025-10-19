import axios from 'axios';
import { logger } from '../utils/logger';
import { EmailDocument } from './ElasticsearchService';

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: {
    email: EmailDocument;
    metadata: {
      source: string;
      version: string;
      [key: string]: any;
    };
  };
}

export class WebhookService {
  private webhookUrl: string;
  private timeout: number;

  constructor() {
    this.webhookUrl = process.env.WEBHOOK_URL || '';
    this.timeout = 10000; // 10 seconds
  }

  async triggerInterestedEmailWebhook(email: EmailDocument): Promise<void> {
    if (!this.webhookUrl) {
      logger.warn('Webhook URL not configured');
      return;
    }

    try {
      const payload: WebhookPayload = {
        event: 'email.interested',
        timestamp: new Date().toISOString(),
        data: {
          email: email,
          metadata: {
            source: 'reachinbox',
            version: '1.0.0'
          }
        }
      };

      await axios.post(this.webhookUrl, payload, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ReachInbox/1.0.0',
          'X-Event-Type': 'email.interested'
        }
      });

      logger.info(`Webhook triggered for interested email: ${email.messageId}`);
      
    } catch (error) {
      logger.error('Failed to trigger webhook:', error);
    }
  }

  async triggerEmailCategorizedWebhook(email: EmailDocument, oldCategory: string): Promise<void> {
    if (!this.webhookUrl) {
      logger.warn('Webhook URL not configured');
      return;
    }

    try {
      const payload: WebhookPayload = {
        event: 'email.categorized',
        timestamp: new Date().toISOString(),
        data: {
          email: email,
          metadata: {
            source: 'reachinbox',
            version: '1.0.0',
            oldCategory: oldCategory
          }
        }
      };

      await axios.post(this.webhookUrl, payload, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ReachInbox/1.0.0',
          'X-Event-Type': 'email.categorized'
        }
      });

      logger.info(`Webhook triggered for categorized email: ${email.messageId}`);
      
    } catch (error) {
      logger.error('Failed to trigger categorization webhook:', error);
    }
  }

  async triggerEmailReceivedWebhook(email: EmailDocument): Promise<void> {
    if (!this.webhookUrl) {
      logger.warn('Webhook URL not configured');
      return;
    }

    try {
      const payload: WebhookPayload = {
        event: 'email.received',
        timestamp: new Date().toISOString(),
        data: {
          email: email,
          metadata: {
            source: 'reachinbox',
            version: '1.0.0'
          }
        }
      };

      await axios.post(this.webhookUrl, payload, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ReachInbox/1.0.0',
          'X-Event-Type': 'email.received'
        }
      });

      logger.info(`Webhook triggered for received email: ${email.messageId}`);
      
    } catch (error) {
      logger.error('Failed to trigger received webhook:', error);
    }
  }

  async triggerCustomWebhook(event: string, data: any): Promise<void> {
    if (!this.webhookUrl) {
      logger.warn('Webhook URL not configured');
      return;
    }

    try {
      const payload = {
        event: event,
        timestamp: new Date().toISOString(),
        data: data,
        metadata: {
          source: 'reachinbox',
          version: '1.0.0'
        }
      };

      await axios.post(this.webhookUrl, payload, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ReachInbox/1.0.0',
          'X-Event-Type': event
        }
      });

      logger.info(`Custom webhook triggered: ${event}`);
      
    } catch (error) {
      logger.error('Failed to trigger custom webhook:', error);
    }
  }

  async testWebhook(): Promise<boolean> {
    if (!this.webhookUrl) {
      logger.warn('Webhook URL not configured');
      return false;
    }

    try {
      const payload = {
        event: 'test',
        timestamp: new Date().toISOString(),
        data: {
          message: 'This is a test webhook from ReachInbox',
          status: 'success'
        },
        metadata: {
          source: 'reachinbox',
          version: '1.0.0'
        }
      };

      await axios.post(this.webhookUrl, payload, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ReachInbox/1.0.0',
          'X-Event-Type': 'test'
        }
      });

      logger.info('Webhook test successful');
      return true;
      
    } catch (error) {
      logger.error('Webhook test failed:', error);
      return false;
    }
  }
}
