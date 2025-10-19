import { Router } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AIService } from '../services/AIService';
import { VectorDBService } from '../services/VectorDBService';
import { DatabaseService } from '../services/DatabaseService';
import { logger } from '../utils/logger';

const router = Router();

// Initialize services (these would be injected in a real app)
let aiService: AIService;
let vectorDBService: VectorDBService;
let databaseService: DatabaseService;

export const initializeAIRoutes = (
  ai: AIService,
  vector: VectorDBService,
  db: DatabaseService
) => {
  aiService = ai;
  vectorDBService = vector;
  databaseService = db;
};

// Categorize email using AI
router.post('/categorize', asyncHandler(async (req, res) => {
  const { subject, body, fromEmail } = req.body;

  if (!subject && !body) {
    throw createError('Subject or body is required', 400);
  }

  try {
    const categorization = await aiService.categorizeEmail(
      subject || '',
      body || '',
      fromEmail || ''
    );

    res.json({
      success: true,
      data: categorization
    });
  } catch (error) {
    logger.error('AI categorization error:', error);
    throw createError('Failed to categorize email', 500);
  }
}));

// Generate reply suggestion using RAG
router.post('/reply-suggestion', asyncHandler(async (req, res) => {
  const {
    emailId,
    originalEmail,
    productInfo,
    agenda
  } = req.body;

  if (!originalEmail || !productInfo || !agenda) {
    throw createError('Original email, product info, and agenda are required', 400);
  }

  try {
    // Get similar emails for context using vector search
    const similarEmails = await vectorDBService.searchSimilarEmails(
      `${originalEmail.subject} ${originalEmail.body}`,
      5,
      { aiCategory: 'Interested' } // Only interested emails for context
    );

    // Build context from similar emails
    const context = similarEmails
      .map(email => `Subject: ${email.metadata.subject}\nBody: ${email.content.substring(0, 200)}...`)
      .join('\n\n');

    const replySuggestion = await aiService.generateReplySuggestion(
      originalEmail,
      context,
      productInfo,
      agenda
    );

    res.json({
      success: true,
      data: {
        ...replySuggestion,
        context: {
          similarEmailsCount: similarEmails.length,
          contextLength: context.length
        }
      }
    });
  } catch (error) {
    logger.error('Reply suggestion error:', error);
    throw createError('Failed to generate reply suggestion', 500);
  }
}));

// Extract key information from email
router.post('/extract-info', asyncHandler(async (req, res) => {
  const { subject, body } = req.body;

  if (!subject && !body) {
    throw createError('Subject or body is required', 400);
  }

  try {
    const keyInfo = await aiService.extractKeyInformation({
      subject: subject || '',
      body: body || ''
    });

    res.json({
      success: true,
      data: keyInfo
    });
  } catch (error) {
    logger.error('Key information extraction error:', error);
    throw createError('Failed to extract key information', 500);
  }
}));

// Bulk categorize emails
router.post('/bulk-categorize', asyncHandler(async (req, res) => {
  const { emailIds } = req.body;

  if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0) {
    throw createError('Email IDs array is required', 400);
  }

  if (emailIds.length > 50) {
    throw createError('Maximum 50 emails can be categorized at once', 400);
  }

  try {
    const results = [];

    for (const emailId of emailIds) {
      try {
        // Get email from database
        const emailResult = await databaseService.query(`
          SELECT subject, body_text, from_email
          FROM emails
          WHERE id = $1
        `, [emailId]);

        if (emailResult.rows.length === 0) {
          results.push({
            emailId,
            success: false,
            error: 'Email not found'
          });
          continue;
        }

        const email = emailResult.rows[0];
        const categorization = await aiService.categorizeEmail(
          email.subject,
          email.body_text,
          email.from_email
        );

        // Update email in database
        await databaseService.query(`
          UPDATE emails
          SET ai_category = $1, ai_confidence = $2, updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `, [categorization.category, categorization.confidence, emailId]);

        results.push({
          emailId,
          success: true,
          categorization
        });
      } catch (error) {
        logger.error(`Error categorizing email ${emailId}:`, error);
        results.push({
          emailId,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      data: {
        results,
        totalProcessed: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });
  } catch (error) {
    logger.error('Bulk categorization error:', error);
    throw createError('Bulk categorization failed', 500);
  }
}));

// Get AI model status and configuration
router.get('/status', asyncHandler(async (req, res) => {
  const provider = process.env.AI_PROVIDER || 'openai';
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

  res.json({
    success: true,
    data: {
      provider,
      availableProviders: {
        openai: hasOpenAI,
        anthropic: hasAnthropic
      },
      features: {
        categorization: true,
        replySuggestion: true,
        keyExtraction: true,
        bulkProcessing: true
      }
    }
  });
}));

// Test AI service
router.post('/test', asyncHandler(async (req, res) => {
  const testEmail = {
    subject: 'Test Email for AI Processing',
    body: 'This is a test email to verify AI functionality.',
    fromEmail: 'test@example.com'
  };

  try {
    const categorization = await aiService.categorizeEmail(
      testEmail.subject,
      testEmail.body,
      testEmail.fromEmail
    );

    const keyInfo = await aiService.extractKeyInformation({
      subject: testEmail.subject,
      body: testEmail.body
    });

    res.json({
      success: true,
      data: {
        testEmail,
        categorization,
        keyInfo,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('AI test error:', error);
    throw createError('AI test failed', 500);
  }
}));

// Get categorization statistics
router.get('/stats/categorization', asyncHandler(async (req, res) => {
  try {
    const stats = await databaseService.query(`
      SELECT 
        ai_category,
        COUNT(*) as count,
        AVG(ai_confidence) as avg_confidence,
        MIN(ai_confidence) as min_confidence,
        MAX(ai_confidence) as max_confidence
      FROM emails
      WHERE ai_category IS NOT NULL
      GROUP BY ai_category
      ORDER BY count DESC
    `);

    const totalEmails = await databaseService.query(`
      SELECT COUNT(*) as total
      FROM emails
    `);

    const categorizedEmails = await databaseService.query(`
      SELECT COUNT(*) as categorized
      FROM emails
      WHERE ai_category IS NOT NULL
    `);

    res.json({
      success: true,
      data: {
        byCategory: stats.rows,
        totalEmails: parseInt(totalEmails.rows[0].total),
        categorizedEmails: parseInt(categorizedEmails.rows[0].categorized),
        categorizationRate: (parseInt(categorizedEmails.rows[0].categorized) / parseInt(totalEmails.rows[0].total)) * 100
      }
    });
  } catch (error) {
    logger.error('Categorization stats error:', error);
    throw createError('Failed to get categorization statistics', 500);
  }
}));

export { router as aiRoutes };


