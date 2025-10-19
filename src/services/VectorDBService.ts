import { ChromaClient } from 'chromadb';
import { logger } from '../utils/logger';
import { EmailDocument } from './ElasticsearchService';

export interface VectorDocument {
  id: string;
  content: string;
  metadata: {
    emailId: string;
    messageId: string;
    subject: string;
    fromEmail: string;
    fromName: string;
    date: string;
    aiCategory: string;
    accountName: string;
    folder: string;
  };
}

export class VectorDBService {
  private client: ChromaClient;
  private collection: any;
  private isConnectedFlag: boolean = false;
  private collectionName: string = 'reachinbox_emails';

  constructor() {
    this.client = new ChromaClient({
      path: process.env.CHROMA_PERSIST_DIRECTORY || './chroma_db'
    });
  }

  async initialize(): Promise<void> {
    try {
      // Test connection
      await this.client.heartbeat();
      this.isConnectedFlag = true;
      logger.info('ChromaDB connected successfully');

      // Get or create collection
      try {
        this.collection = await this.client.getCollection({
          name: this.collectionName,
          embeddingFunction: undefined as any
        });
        logger.info(`Using existing collection: ${this.collectionName}`);
      } catch (error) {
        // Collection doesn't exist, create it
        this.collection = await this.client.createCollection({
          name: this.collectionName,
          metadata: {
            description: 'ReachInbox email collection for RAG',
            created_at: new Date().toISOString()
          }
        });
        logger.info(`Created new collection: ${this.collectionName}`);
      }
      
    } catch (error) {
      logger.error('Failed to connect to ChromaDB:', error);
      throw error;
    }
  }

  async storeEmail(email: EmailDocument): Promise<void> {
    try {
      if (!this.collection) {
        throw new Error('Collection not initialized');
      }

      // Create content for embedding (subject + body)
      const content = `${email.subject}\n\n${email.bodyText}`.trim();
      
      // Create metadata
      const metadata = {
        emailId: email.id,
        messageId: email.messageId,
        subject: email.subject,
        fromEmail: email.fromEmail,
        fromName: email.fromName,
        date: email.date,
        aiCategory: email.aiCategory,
        accountName: email.accountName,
        folder: email.folder
      };

      // Add document to collection
      await this.collection.add({
        ids: [email.id],
        documents: [content],
        metadatas: [metadata]
      });

      logger.debug(`Email stored in vector database: ${email.messageId}`);
      
    } catch (error) {
      logger.error('Failed to store email in vector database:', error);
    }
  }

  async searchSimilarEmails(query: string, limit: number = 10, filters?: any): Promise<VectorDocument[]> {
    try {
      if (!this.collection) {
        throw new Error('Collection not initialized');
      }

      const searchParams: any = {
        queryTexts: [query],
        nResults: limit
      };

      // Add filters if provided
      if (filters) {
        searchParams.where = this.buildWhereClause(filters);
      }

      const results = await this.collection.query(searchParams);
      
      if (!results.documents || results.documents.length === 0) {
        return [];
      }

      // Transform results to VectorDocument format
      const documents: VectorDocument[] = [];
      for (let i = 0; i < results.documents[0].length; i++) {
        documents.push({
          id: results.ids[0][i],
          content: results.documents[0][i],
          metadata: results.metadatas[0][i]
        });
      }

      return documents;
      
    } catch (error) {
      logger.error('Failed to search similar emails:', error);
      return [];
    }
  }

  private buildWhereClause(filters: any): any {
    const where: any = {};

    if (filters.aiCategory) {
      where.aiCategory = filters.aiCategory;
    }

    if (filters.accountName) {
      where.accountName = filters.accountName;
    }

    if (filters.folder) {
      where.folder = filters.folder;
    }

    if (filters.fromEmail) {
      where.fromEmail = filters.fromEmail;
    }

    if (filters.dateRange) {
      where.date = {
        $gte: filters.dateRange.from,
        $lte: filters.dateRange.to
      };
    }

    return where;
  }

  async getEmailById(id: string): Promise<VectorDocument | null> {
    try {
      if (!this.collection) {
        throw new Error('Collection not initialized');
      }

      const results = await this.collection.get({
        ids: [id]
      });

      if (!results.documents || results.documents.length === 0) {
        return null;
      }

      return {
        id: results.ids[0],
        content: results.documents[0],
        metadata: results.metadatas[0]
      };
      
    } catch (error) {
      logger.error('Failed to get email by ID from vector database:', error);
      return null;
    }
  }

  async updateEmail(id: string, updates: Partial<VectorDocument>): Promise<void> {
    try {
      if (!this.collection) {
        throw new Error('Collection not initialized');
      }

      const updateData: any = {};

      if (updates.content) {
        updateData.documents = [updates.content];
      }

      if (updates.metadata) {
        updateData.metadatas = [updates.metadata];
      }

      await this.collection.update({
        ids: [id],
        ...updateData
      });

      logger.debug(`Email updated in vector database: ${id}`);
      
    } catch (error) {
      logger.error('Failed to update email in vector database:', error);
    }
  }

  async deleteEmail(id: string): Promise<void> {
    try {
      if (!this.collection) {
        throw new Error('Collection not initialized');
      }

      await this.collection.delete({
        ids: [id]
      });

      logger.debug(`Email deleted from vector database: ${id}`);
      
    } catch (error) {
      logger.error('Failed to delete email from vector database:', error);
    }
  }

  async getCollectionStats(): Promise<any> {
    try {
      if (!this.collection) {
        throw new Error('Collection not initialized');
      }

      const count = await this.collection.count();
      
      return {
        totalDocuments: count,
        collectionName: this.collectionName,
        isConnected: this.isConnectedFlag
      };
      
    } catch (error) {
      logger.error('Failed to get collection stats:', error);
      return {
        totalDocuments: 0,
        collectionName: this.collectionName,
        isConnected: false
      };
    }
  }

  async clearCollection(): Promise<void> {
    try {
      if (!this.collection) {
        throw new Error('Collection not initialized');
      }

      await this.collection.delete({
        where: {} // Delete all documents
      });

      logger.info('Vector database collection cleared');
      
    } catch (error) {
      logger.error('Failed to clear collection:', error);
    }
  }

  isConnected(): boolean {
    return this.isConnectedFlag;
  }

  async close(): Promise<void> {
    // ChromaDB client doesn't have a close method
    this.isConnectedFlag = false;
    logger.info('Vector database connection closed');
  }
}
