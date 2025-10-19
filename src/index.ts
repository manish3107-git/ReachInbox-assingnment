import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { EmailSyncService } from './services/EmailSyncService';
import { ElasticsearchService } from './services/ElasticsearchService';
import { AIService } from './services/AIService';
import { SlackService } from './services/SlackService';
import { WebhookService } from './services/WebhookService';
import { DatabaseService } from './services/DatabaseService';
import { VectorDBService } from './services/VectorDBService';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { emailRoutes, initializeEmailRoutes } from './routes/emailRoutes';
import { searchRoutes, initializeSearchRoutes } from './routes/searchRoutes';
import { aiRoutes, initializeAIRoutes } from './routes/aiRoutes';

// Load environment variables
dotenv.config();

class Application {
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;
  private emailSyncService!: EmailSyncService;
  private elasticsearchService!: ElasticsearchService;
  private aiService!: AIService;
  private slackService!: SlackService;
  private webhookService!: WebhookService;
  private databaseService!: DatabaseService;
  private vectorDBService!: VectorDBService;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3001",
        methods: ["GET", "POST"]
      }
    });

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private async initializeServices() {
    try {
      logger.info('Initializing services...');
      
      // Initialize database
      this.databaseService = new DatabaseService();
      await this.databaseService.initialize();
      
      // Initialize Elasticsearch
      this.elasticsearchService = new ElasticsearchService();
      await this.elasticsearchService.initialize();
      
      // Initialize Vector Database
      this.vectorDBService = new VectorDBService();
      await this.vectorDBService.initialize();
      
      // Initialize AI Service
      this.aiService = new AIService();
      
      // Initialize Slack Service
      this.slackService = new SlackService();
      
      // Initialize Webhook Service
      this.webhookService = new WebhookService();
      
      // Initialize Email Sync Service
      this.emailSyncService = new EmailSyncService(
        this.elasticsearchService,
        this.aiService,
        this.slackService,
        this.webhookService,
        this.vectorDBService,
        this.io
      );
      
      // Initialize route dependencies
      initializeEmailRoutes(this.databaseService, this.elasticsearchService, this.aiService, this.vectorDBService);
      initializeSearchRoutes(this.elasticsearchService, this.vectorDBService);
      initializeAIRoutes(this.aiService, this.vectorDBService, this.databaseService);
      
      logger.info('All services initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize services:', error);
      throw error;
    }
  }

  private setupMiddleware() {
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || "http://localhost:3001",
      credentials: true
    }));
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, { 
        ip: req.ip, 
        userAgent: req.get('User-Agent') 
      });
      next();
    });
  }

  private setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        services: {
          database: this.databaseService?.isConnected() || false,
          elasticsearch: this.elasticsearchService?.isConnected() || false,
          vectorDB: this.vectorDBService?.isConnected() || false
        }
      });
    });

    // API routes
    this.app.use('/api/emails', emailRoutes);
    this.app.use('/api/search', searchRoutes);
    this.app.use('/api/ai', aiRoutes);

    // Serve static files in production
    if (process.env.NODE_ENV === 'production') {
      this.app.use(express.static('frontend/dist'));
      this.app.get('*', (req, res) => {
        res.sendFile('index.html', { root: 'frontend/dist' });
      });
    }
  }

  private setupErrorHandling() {
    this.app.use(errorHandler);
    
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }

  public async start() {
    try {
      const port = process.env.PORT || 3000;
      
      // Initialize services first
      await this.initializeServices();
      
      // Start email synchronization
      await this.emailSyncService.startSync();
      
      // Start server
      this.server.listen(port, () => {
        logger.info(`Server running on port ${port}`);
        logger.info(`Environment: ${process.env.NODE_ENV}`);
        logger.info(`Health check: http://localhost:${port}/health`);
      });

      // Setup Socket.IO
      this.io.on('connection', (socket: any) => {
        logger.info('Client connected:', socket.id);
        
        socket.on('disconnect', () => {
          logger.info('Client disconnected:', socket.id);
        });
      });

    } catch (error) {
      logger.error('Failed to start application:', error);
      process.exit(1);
    }
  }

  public async stop() {
    try {
      logger.info('Shutting down application...');
      
      await this.emailSyncService.stopSync();
      await this.databaseService?.close();
      await this.elasticsearchService?.close();
      await this.vectorDBService?.close();
      
      this.server.close(() => {
        logger.info('Application stopped');
        process.exit(0);
      });
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Start application
const app = new Application();

// Graceful shutdown
process.on('SIGTERM', () => app.stop());
process.on('SIGINT', () => app.stop());

app.start().catch((error) => {
  logger.error('Failed to start application:', error);
  process.exit(1);
});

export default app;
