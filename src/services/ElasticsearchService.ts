import { Client } from '@elastic/elasticsearch';
import { logger } from '../utils/logger';

export interface EmailDocument {
  id: string;
  messageId: string;
  accountId: number;
  accountName: string;
  folder: string;
  subject: string;
  fromEmail: string;
  fromName: string;
  toEmails: string[];
  ccEmails: string[];
  bccEmails: string[];
  date: string;
  receivedDate: string;
  size: number;
  flags: string[];
  bodyText: string;
  bodyHtml: string;
  attachments: any[];
  aiCategory: string;
  aiConfidence: number;
  isRead: boolean;
  isImportant: boolean;
  createdAt: string;
  updatedAt: string;
}

export class ElasticsearchService {
  private client: Client;
  private indexName: string;
  private isConnectedFlag: boolean = false;

  constructor() {
    this.indexName = process.env.ELASTICSEARCH_INDEX || 'emails';
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    });
  }

  async initialize(): Promise<void> {
    try {
      // Test connection
      await this.client.ping();
      this.isConnectedFlag = true;
      logger.info('Elasticsearch connected successfully');

      // Create index if it doesn't exist
      await this.createIndex();
      
    } catch (error) {
      logger.error('Failed to connect to Elasticsearch:', error);
      throw error;
    }
  }

  private async createIndex(): Promise<void> {
    try {
      const indexExists = await this.client.indices.exists({
        index: this.indexName
      });

      if (!indexExists) {
        await this.client.indices.create({
          index: this.indexName,
          body: {
            settings: {
              number_of_shards: 1,
              number_of_replicas: 0,
              analysis: {
                analyzer: {
                  email_analyzer: {
                    type: 'custom',
                    tokenizer: 'standard',
                    filter: ['lowercase', 'stop', 'snowball']
                  }
                }
              }
            },
            mappings: {
              properties: {
                messageId: { type: 'keyword' },
                accountId: { type: 'integer' },
                accountName: { type: 'keyword' },
                folder: { type: 'keyword' },
                subject: { 
                  type: 'text',
                  analyzer: 'email_analyzer',
                  fields: {
                    keyword: { type: 'keyword' }
                  }
                },
                fromEmail: { type: 'keyword' },
                fromName: { 
                  type: 'text',
                  analyzer: 'email_analyzer'
                },
                toEmails: { type: 'keyword' },
                ccEmails: { type: 'keyword' },
                bccEmails: { type: 'keyword' },
                date: { type: 'date' },
                receivedDate: { type: 'date' },
                size: { type: 'integer' },
                flags: { type: 'keyword' },
                bodyText: { 
                  type: 'text',
                  analyzer: 'email_analyzer'
                },
                bodyHtml: { type: 'text' },
                attachments: { type: 'object' },
                aiCategory: { type: 'keyword' },
                aiConfidence: { type: 'float' },
                isRead: { type: 'boolean' },
                isImportant: { type: 'boolean' },
                createdAt: { type: 'date' },
                updatedAt: { type: 'date' }
              }
            }
          }
        });
        logger.info(`Elasticsearch index '${this.indexName}' created successfully`);
      }
    } catch (error) {
      logger.error('Failed to create Elasticsearch index:', error);
      throw error;
    }
  }

  async indexEmail(email: EmailDocument): Promise<void> {
    try {
      await this.client.index({
        index: this.indexName,
        id: email.id,
        body: email
      });
      logger.debug(`Email indexed: ${email.messageId}`);
    } catch (error) {
      logger.error('Failed to index email:', error);
      throw error;
    }
  }

  async bulkIndexEmails(emails: EmailDocument[]): Promise<void> {
    try {
      const body = emails.flatMap(email => [
        { index: { _index: this.indexName, _id: email.id } },
        email
      ]);

      await this.client.bulk({ body });
      logger.info(`Bulk indexed ${emails.length} emails`);
    } catch (error) {
      logger.error('Failed to bulk index emails:', error);
      throw error;
    }
  }

  async searchEmails(query: any): Promise<any> {
    try {
      const response = await this.client.search({
        index: this.indexName,
        body: query
      });
      return response;
    } catch (error) {
      logger.error('Failed to search emails:', error);
      throw error;
    }
  }

  async searchByText(searchText: string, filters: any = {}): Promise<any> {
    const query: any = {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: searchText,
                fields: ['subject^2', 'bodyText', 'fromName', 'fromEmail'],
                type: 'best_fields',
                fuzziness: 'AUTO'
              }
            }
          ]
        }
      },
      sort: [
        { date: { order: 'desc' } }
      ],
      size: 50
    };

    // Add filters
    if (filters.accountId) {
      query.query.bool.filter = query.query.bool.filter || [];
      query.query.bool.filter.push({
        term: { accountId: filters.accountId }
      });
    }

    if (filters.folder) {
      query.query.bool.filter = query.query.bool.filter || [];
      query.query.bool.filter.push({
        term: { folder: filters.folder }
      });
    }

    if (filters.aiCategory) {
      query.query.bool.filter = query.query.bool.filter || [];
      query.query.bool.filter.push({
        term: { aiCategory: filters.aiCategory }
      });
    }

    if (filters.dateRange) {
      query.query.bool.filter = query.query.bool.filter || [];
      query.query.bool.filter.push({
        range: {
          date: {
            gte: filters.dateRange.from,
            lte: filters.dateRange.to
          }
        }
      });
    }

    return this.searchEmails(query);
  }

  async getEmailById(id: string): Promise<EmailDocument | null> {
    try {
      const response = await this.client.get({
        index: this.indexName,
        id: id
      });
      return (response as any)._source as EmailDocument;
    } catch (error: any) {
      if (error.statusCode === 404) {
        return null;
      }
      logger.error('Failed to get email by ID:', error);
      throw error;
    }
  }

  async updateEmail(id: string, updates: Partial<EmailDocument>): Promise<void> {
    try {
      await this.client.update({
        index: this.indexName,
        id: id,
        body: {
          doc: {
            ...updates,
            updatedAt: new Date().toISOString()
          }
        }
      });
      logger.debug(`Email updated: ${id}`);
    } catch (error) {
      logger.error('Failed to update email:', error);
      throw error;
    }
  }

  async deleteEmail(id: string): Promise<void> {
    try {
      await this.client.delete({
        index: this.indexName,
        id: id
      });
      logger.debug(`Email deleted: ${id}`);
    } catch (error) {
      logger.error('Failed to delete email:', error);
      throw error;
    }
  }

  async getStats(): Promise<any> {
    try {
      const response = await this.client.search({
        index: this.indexName,
        body: {
          size: 0,
          aggs: {
            total_emails: {
              value_count: {
                field: 'messageId'
              }
            },
            by_category: {
              terms: {
                field: 'aiCategory'
              }
            },
            by_account: {
              terms: {
                field: 'accountName'
              }
            },
            by_folder: {
              terms: {
                field: 'folder'
              }
            }
          }
        }
      });
      return (response as any).aggregations;
    } catch (error) {
      logger.error('Failed to get stats:', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.isConnectedFlag;
  }

  async close(): Promise<void> {
    // Elasticsearch client doesn't have a close method
    this.isConnectedFlag = false;
    logger.info('Elasticsearch connection closed');
  }
}