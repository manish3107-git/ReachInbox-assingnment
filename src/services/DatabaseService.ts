import { Pool, PoolClient } from 'pg';
import { logger } from '../utils/logger';

export class DatabaseService {
  private pool: Pool;
  private isConnectedFlag: boolean = false;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      logger.error('Unexpected error on idle client', err);
      this.isConnectedFlag = false;
    });
  }

  async initialize(): Promise<void> {
    try {
      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      this.isConnectedFlag = true;
      logger.info('Database connected successfully');
      
      // Create tables if they don't exist
      await this.createTables();
      
    } catch (error) {
      logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      // Email accounts table
      await client.query(`
        CREATE TABLE IF NOT EXISTS email_accounts (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          host VARCHAR(255) NOT NULL,
          port INTEGER NOT NULL,
          secure BOOLEAN NOT NULL,
          username VARCHAR(255) NOT NULL,
          password VARCHAR(255) NOT NULL,
          folders TEXT[] NOT NULL,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Emails table
      await client.query(`
        CREATE TABLE IF NOT EXISTS emails (
          id SERIAL PRIMARY KEY,
          message_id VARCHAR(255) UNIQUE NOT NULL,
          account_id INTEGER REFERENCES email_accounts(id),
          folder VARCHAR(100) NOT NULL,
          subject TEXT,
          from_email VARCHAR(255),
          from_name VARCHAR(255),
          to_emails TEXT[],
          cc_emails TEXT[],
          bcc_emails TEXT[],
          date TIMESTAMP NOT NULL,
          received_date TIMESTAMP,
          size INTEGER,
          flags TEXT[],
          body_text TEXT,
          body_html TEXT,
          attachments JSONB,
          ai_category VARCHAR(50),
          ai_confidence DECIMAL(3,2),
          is_read BOOLEAN DEFAULT false,
          is_important BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // AI categories table
      await client.query(`
        CREATE TABLE IF NOT EXISTS ai_categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(50) UNIQUE NOT NULL,
          description TEXT,
          color VARCHAR(7),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Insert default categories
      await client.query(`
        INSERT INTO ai_categories (name, description, color) VALUES
        ('Interested', 'Emails showing interest or positive engagement', '#28a745'),
        ('Meeting Booked', 'Emails confirming or scheduling meetings', '#007bff'),
        ('Not Interested', 'Emails showing disinterest or rejection', '#dc3545'),
        ('Spam', 'Unsolicited or promotional emails', '#6c757d'),
        ('Out of Office', 'Automated out-of-office responses', '#ffc107')
        ON CONFLICT (name) DO NOTHING
      `);

      // Vector embeddings table for RAG
      await client.query(`
        CREATE TABLE IF NOT EXISTS vector_embeddings (
          id SERIAL PRIMARY KEY,
          content TEXT NOT NULL,
          embedding VECTOR(1536),
          metadata JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_emails_message_id ON emails(message_id);
        CREATE INDEX IF NOT EXISTS idx_emails_account_id ON emails(account_id);
        CREATE INDEX IF NOT EXISTS idx_emails_date ON emails(date);
        CREATE INDEX IF NOT EXISTS idx_emails_ai_category ON emails(ai_category);
        CREATE INDEX IF NOT EXISTS idx_emails_from_email ON emails(from_email);
        CREATE INDEX IF NOT EXISTS idx_emails_subject ON emails USING gin(to_tsvector('english', subject));
        CREATE INDEX IF NOT EXISTS idx_emails_body_text ON emails USING gin(to_tsvector('english', body_text));
      `);

      logger.info('Database tables created successfully');
      
    } catch (error) {
      logger.error('Failed to create database tables:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async query(text: string, params?: any[]): Promise<any> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  isConnected(): boolean {
    return this.isConnectedFlag;
  }

  async close(): Promise<void> {
    await this.pool.end();
    this.isConnectedFlag = false;
    logger.info('Database connection closed');
  }
}
