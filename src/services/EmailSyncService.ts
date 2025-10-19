import Imap from 'imap';
import { simpleParser, ParsedMail } from 'mailparser';
import { EventEmitter } from 'events';
import { Server as SocketIOServer } from 'socket.io';
import { ElasticsearchService, EmailDocument } from './ElasticsearchService';
import { AIService, EmailCategorization } from './AIService';
import { SlackService } from './SlackService';
import { WebhookService } from './WebhookService';
import { VectorDBService } from './VectorDBService';
import { DatabaseService } from './DatabaseService';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface IMAPAccount {
  id: number;
  name: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  folders: string[];
  isActive: boolean;
}

export class EmailSyncService extends EventEmitter {
  private elasticsearchService: ElasticsearchService;
  private aiService: AIService;
  private slackService: SlackService;
  private webhookService: WebhookService;
  private vectorDBService: VectorDBService;
  private databaseService!: DatabaseService;
  private io: SocketIOServer;
  private accounts: Map<number, IMAPAccount> = new Map();
  private connections: Map<number, Imap> = new Map();
  private isRunning: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor(
    elasticsearchService: ElasticsearchService,
    aiService: AIService,
    slackService: SlackService,
    webhookService: WebhookService,
    vectorDBService: VectorDBService,
    io: SocketIOServer
  ) {
    super();
    this.elasticsearchService = elasticsearchService;
    this.aiService = aiService;
    this.slackService = slackService;
    this.webhookService = webhookService;
    this.vectorDBService = vectorDBService;
    this.io = io;
    this.databaseService = new DatabaseService();
  }

  async startSync(): Promise<void> {
    try {
      logger.info('Starting email synchronization...');
      
      // Load accounts from database
      await this.loadAccounts();
      
      // Start IDLE connections for each account
      for (const [accountId, account] of this.accounts) {
        if (account.isActive) {
          await this.startIDLEConnection(accountId, account);
        }
      }

      // Start periodic sync for missed emails
      this.startPeriodicSync();
      
      this.isRunning = true;
      logger.info('Email synchronization started successfully');
      
    } catch (error) {
      logger.error('Failed to start email synchronization:', error);
      throw error;
    }
  }

  async stopSync(): Promise<void> {
    try {
      logger.info('Stopping email synchronization...');
      
      this.isRunning = false;
      
      // Stop periodic sync
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
      }
      
      // Close all IMAP connections
      for (const [accountId, connection] of this.connections) {
        try {
          connection.end();
          logger.info(`Closed IMAP connection for account ${accountId}`);
        } catch (error) {
          logger.error(`Error closing connection for account ${accountId}:`, error);
        }
      }
      
      this.connections.clear();
      logger.info('Email synchronization stopped');
      
    } catch (error) {
      logger.error('Error stopping email synchronization:', error);
    }
  }

  private async loadAccounts(): Promise<void> {
    try {
      const result = await this.databaseService.query(`
        SELECT id, name, host, port, secure, username, password, folders, is_active
        FROM email_accounts
        WHERE is_active = true
      `);

      this.accounts.clear();
      for (const row of result.rows) {
        this.accounts.set(row.id, {
          id: row.id,
          name: row.name,
          host: row.host,
          port: row.port,
          secure: row.secure,
          username: row.username,
          password: row.password,
          folders: row.folders,
          isActive: row.is_active
        });
      }

      logger.info(`Loaded ${this.accounts.size} active email accounts`);
    } catch (error) {
      logger.error('Failed to load email accounts:', error);
      throw error;
    }
  }

  private async startIDLEConnection(accountId: number, account: IMAPAccount): Promise<void> {
    try {
      const imap = new Imap({
        user: account.username,
        password: account.password,
        host: account.host,
        port: account.port,
        tls: account.secure,
        tlsOptions: { rejectUnauthorized: false },
        connTimeout: 60000,
        authTimeout: 30000,
        keepalive: {
          interval: 10000,
          idleInterval: 300000,
          forceNoop: true
        }
      });

      imap.once('ready', () => {
        logger.info(`IMAP connection ready for account: ${account.name}`);
        this.connections.set(accountId, imap);
        this.startIDLE(accountId, imap, account);
      });

      imap.once('error', (err: any) => {
        logger.error(`IMAP error for account ${account.name}:`, err);
        this.connections.delete(accountId);
        // Attempt to reconnect after delay
        setTimeout(() => {
          if (this.isRunning) {
            this.startIDLEConnection(accountId, account);
          }
        }, 30000);
      });

      imap.once('end', () => {
        logger.info(`IMAP connection ended for account: ${account.name}`);
        this.connections.delete(accountId);
      });

      imap.connect();
      
    } catch (error) {
      logger.error(`Failed to start IDLE connection for account ${account.name}:`, error);
    }
  }

  private startIDLE(accountId: number, imap: Imap, account: IMAPAccount): void {
    const processFolder = (folderName: string) => {
      imap.openBox(folderName, true, (err, box) => {
        if (err) {
          logger.error(`Error opening folder ${folderName}:`, err);
          return;
        }

        // Get recent emails (last 30 days)
        const since = new Date();
        since.setDate(since.getDate() - 30);

        const searchCriteria = ['SINCE', since];
        imap.search(searchCriteria, (err, results) => {
          if (err) {
            logger.error(`Error searching folder ${folderName}:`, err);
            return;
          }

          if (results && results.length > 0) {
            this.fetchEmails(accountId, imap, folderName, results.slice(-50)); // Limit to last 50 emails
          }
        });

        // Start IDLE for real-time updates
        (imap as any).idle((err: any) => {
          if (err) {
            logger.error(`IDLE error for folder ${folderName}:`, err);
            return;
          }
        });

        imap.on('mail', () => {
          logger.info(`New mail detected in ${folderName} for account ${account.name}`);
          this.handleNewMail(accountId, imap, folderName);
        });
      });
    };

    // Process each folder
    account.folders.forEach(folderName => {
      processFolder(folderName);
    });
  }

  private async handleNewMail(accountId: number, imap: Imap, folderName: string): Promise<void> {
    try {
      // Stop IDLE to perform search
      (imap as any).idle.stop();
      
      // Search for unseen emails
      imap.search(['UNSEEN'], async (err, results) => {
        if (err) {
          logger.error('Error searching for new mail:', err);
          return;
        }

        if (results && results.length > 0) {
          await this.fetchEmails(accountId, imap, folderName, results);
        }

        // Resume IDLE
        (imap as any).idle((err: any) => {
          if (err) {
            logger.error('Error resuming IDLE:', err);
          }
        });
      });
    } catch (error) {
      logger.error('Error handling new mail:', error);
    }
  }

  private async fetchEmails(accountId: number, imap: Imap, folderName: string, uids: number[]): Promise<void> {
    if (uids.length === 0) return;

    const fetch = imap.fetch(uids, { bodies: '', struct: true });
    const emails: EmailDocument[] = [];

    fetch.on('message', (msg) => {
      let buffer = '';

      msg.on('body', (stream) => {
        stream.on('data', (chunk) => {
          buffer += chunk.toString('utf8');
        });
      });

      msg.once('end', async () => {
        try {
          const parsed = await simpleParser(buffer);
          const emailDoc = await this.parseEmail(parsed, accountId, folderName);
          if (emailDoc) {
            emails.push(emailDoc);
          }
        } catch (error) {
          logger.error('Error parsing email:', error);
        }
      });
    });

    fetch.once('end', async () => {
      if (emails.length > 0) {
        await this.processEmails(emails);
        logger.info(`Processed ${emails.length} emails from ${folderName}`);
      }
    });

    fetch.once('error', (err) => {
      logger.error('Error fetching emails:', err);
    });
  }

  private async parseEmail(parsed: ParsedMail, accountId: number, folderName: string): Promise<EmailDocument | null> {
    try {
      const account = this.accounts.get(accountId);
      if (!account) return null;

      const emailId = uuidv4();
      const messageId = parsed.messageId || emailId;
      
      // Extract email addresses
      const fromEmail = (parsed.from as any)?.value?.[0]?.address || '';
      const fromName = (parsed.from as any)?.value?.[0]?.name || '';
      const toEmails = (parsed.to as any)?.value?.map((addr: any) => addr.address) || [];
      const ccEmails = (parsed.cc as any)?.value?.map((addr: any) => addr.address) || [];
      const bccEmails = (parsed.bcc as any)?.value?.map((addr: any) => addr.address) || [];

      // Extract attachments
      const attachments = parsed.attachments?.map((att: any) => ({
        filename: att.filename || 'unknown',
        contentType: att.contentType,
        size: att.size,
        cid: att.cid
      })) || [];

      const emailDoc: EmailDocument = {
        id: emailId,
        messageId: messageId,
        accountId: accountId,
        accountName: account.name,
        folder: folderName,
        subject: parsed.subject || '',
        fromEmail: fromEmail,
        fromName: fromName,
        toEmails: toEmails,
        ccEmails: ccEmails,
        bccEmails: bccEmails,
        date: parsed.date?.toISOString() || new Date().toISOString(),
        receivedDate: (parsed as any).receivedDate?.toISOString() || new Date().toISOString(),
        size: parsed.text?.length || 0,
        flags: (parsed as any).flags || [],
        bodyText: parsed.text || '',
        bodyHtml: parsed.html || '',
        attachments: attachments,
        aiCategory: 'Not Interested', // Will be updated by AI
        aiConfidence: 0.5,
        isRead: false,
        isImportant: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return emailDoc;
    } catch (error) {
      logger.error('Error parsing email:', error);
      return null;
    }
  }

  private async processEmails(emails: EmailDocument[]): Promise<void> {
    try {
      for (const email of emails) {
        // Check if email already exists
        const existing = await this.elasticsearchService.getEmailById(email.id);
        if (existing) continue;

        // AI categorization
        const categorization = await this.aiService.categorizeEmail(
          email.subject,
          email.bodyText,
          email.fromEmail
        );

        email.aiCategory = categorization.category;
        email.aiConfidence = categorization.confidence;

        // Store in database
        await this.storeEmailInDatabase(email);

        // Index in Elasticsearch
        await this.elasticsearchService.indexEmail(email);

        // Store in vector database for RAG
        await this.vectorDBService.storeEmail(email);

        // Handle interested emails
        if (categorization.category === 'Interested') {
          await this.handleInterestedEmail(email);
        }

        // Emit real-time update
        this.io.emit('newEmail', {
          id: email.id,
          subject: email.subject,
          fromEmail: email.fromEmail,
          fromName: email.fromName,
          aiCategory: email.aiCategory,
          aiConfidence: email.aiConfidence,
          date: email.date
        });
      }
    } catch (error) {
      logger.error('Error processing emails:', error);
    }
  }

  private async storeEmailInDatabase(email: EmailDocument): Promise<void> {
    try {
      await this.databaseService.query(`
        INSERT INTO emails (
          message_id, account_id, folder, subject, from_email, from_name,
          to_emails, cc_emails, bcc_emails, date, received_date, size,
          flags, body_text, body_html, attachments, ai_category, ai_confidence,
          is_read, is_important, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
        ON CONFLICT (message_id) DO UPDATE SET
          updated_at = $22,
          ai_category = $17,
          ai_confidence = $18
      `, [
        email.messageId, email.accountId, email.folder, email.subject,
        email.fromEmail, email.fromName, email.toEmails, email.ccEmails,
        email.bccEmails, email.date, email.receivedDate, email.size,
        email.flags, email.bodyText, email.bodyHtml, JSON.stringify(email.attachments),
        email.aiCategory, email.aiConfidence, email.isRead, email.isImportant,
        email.createdAt, email.updatedAt
      ]);
    } catch (error) {
      logger.error('Error storing email in database:', error);
    }
  }

  private async handleInterestedEmail(email: EmailDocument): Promise<void> {
    try {
      // Send Slack notification
      await this.slackService.sendInterestedEmailNotification(email);
      
      // Trigger webhook
      await this.webhookService.triggerInterestedEmailWebhook(email);
      
      logger.info(`Handled interested email: ${email.messageId}`);
    } catch (error) {
      logger.error('Error handling interested email:', error);
    }
  }

  private startPeriodicSync(): void {
    const intervalMinutes = parseInt(process.env.SYNC_INTERVAL_MINUTES || '5');
    
    this.syncInterval = setInterval(async () => {
      if (this.isRunning) {
        logger.info('Running periodic email sync...');
        await this.syncAllAccounts();
      }
    }, intervalMinutes * 60 * 1000);
  }

  private async syncAllAccounts(): Promise<void> {
    for (const [accountId, account] of this.accounts) {
      if (account.isActive) {
        try {
          await this.syncAccount(accountId, account);
        } catch (error) {
          logger.error(`Error syncing account ${account.name}:`, error);
        }
      }
    }
  }

  private async syncAccount(accountId: number, account: IMAPAccount): Promise<void> {
    // This would implement a full sync for each account
    // For now, we rely on IDLE connections for real-time updates
    logger.debug(`Syncing account: ${account.name}`);
  }

  async addAccount(accountData: Omit<IMAPAccount, 'id'>): Promise<number> {
    try {
      const result = await this.databaseService.query(`
        INSERT INTO email_accounts (name, host, port, secure, username, password, folders, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [
        accountData.name, accountData.host, accountData.port, accountData.secure,
        accountData.username, accountData.password, accountData.folders, accountData.isActive
      ]);

      const accountId = result.rows[0].id;
      
      // Add to in-memory accounts
      this.accounts.set(accountId, { ...accountData, id: accountId });
      
      // Start IDLE connection if active
      if (accountData.isActive) {
        await this.startIDLEConnection(accountId, { ...accountData, id: accountId });
      }

      logger.info(`Added new email account: ${accountData.name}`);
      return accountId;
    } catch (error) {
      logger.error('Error adding email account:', error);
      throw error;
    }
  }
}
