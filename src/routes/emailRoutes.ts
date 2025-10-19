import { Router } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { DatabaseService } from '../services/DatabaseService';
import { ElasticsearchService } from '../services/ElasticsearchService';
import { AIService } from '../services/AIService';
import { VectorDBService } from '../services/VectorDBService';
import { logger } from '../utils/logger';

const router = Router();

// Initialize services (these would be injected in a real app)
let databaseService: DatabaseService;
let elasticsearchService: ElasticsearchService;
let aiService: AIService;
let vectorDBService: VectorDBService;

// This would be handled by dependency injection in a real app
export const initializeEmailRoutes = (
  db: DatabaseService,
  es: ElasticsearchService,
  ai: AIService,
  vector: VectorDBService
) => {
  databaseService = db;
  elasticsearchService = es;
  aiService = ai;
  vectorDBService = vector;
};

// Get all emails with pagination and filtering
router.get('/', asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    accountId,
    folder,
    aiCategory,
    search,
    dateFrom,
    dateTo,
    isRead,
    isImportant
  } = req.query;

  const offset = (Number(page) - 1) * Number(limit);

  let whereConditions = [];
  let queryParams = [];
  let paramCount = 0;

  if (accountId) {
    whereConditions.push(`account_id = $${++paramCount}`);
    queryParams.push(accountId);
  }

  if (folder) {
    whereConditions.push(`folder = $${++paramCount}`);
    queryParams.push(folder);
  }

  if (aiCategory) {
    whereConditions.push(`ai_category = $${++paramCount}`);
    queryParams.push(aiCategory);
  }

  if (isRead !== undefined) {
    whereConditions.push(`is_read = $${++paramCount}`);
    queryParams.push(isRead === 'true');
  }

  if (isImportant !== undefined) {
    whereConditions.push(`is_important = $${++paramCount}`);
    queryParams.push(isImportant === 'true');
  }

  if (dateFrom) {
    whereConditions.push(`date >= $${++paramCount}`);
    queryParams.push(dateFrom);
  }

  if (dateTo) {
    whereConditions.push(`date <= $${++paramCount}`);
    queryParams.push(dateTo);
  }

  if (search) {
    whereConditions.push(`(subject ILIKE $${++paramCount} OR body_text ILIKE $${++paramCount} OR from_name ILIKE $${++paramCount})`);
    const searchTerm = `%${search}%`;
    queryParams.push(searchTerm, searchTerm, searchTerm);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const countQuery = `SELECT COUNT(*) FROM emails ${whereClause}`;
  const countResult = await databaseService.query(countQuery, queryParams);
  const totalCount = parseInt(countResult.rows[0].count);

  const emailsQuery = `
    SELECT e.*, ea.name as account_name
    FROM emails e
    LEFT JOIN email_accounts ea ON e.account_id = ea.id
    ${whereClause}
    ORDER BY e.date DESC
    LIMIT $${++paramCount} OFFSET $${++paramCount}
  `;
  queryParams.push(Number(limit), offset);

  const emailsResult = await databaseService.query(emailsQuery, queryParams);

  res.json({
    success: true,
    data: {
      emails: emailsResult.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / Number(limit))
      }
    }
  });
}));

// Get email by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await databaseService.query(`
    SELECT e.*, ea.name as account_name
    FROM emails e
    LEFT JOIN email_accounts ea ON e.account_id = ea.id
    WHERE e.id = $1
  `, [id]);

  if (result.rows.length === 0) {
    throw createError('Email not found', 404);
  }

  res.json({
    success: true,
    data: result.rows[0]
  });
}));

// Update email (mark as read, important, etc.)
router.patch('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isRead, isImportant, aiCategory } = req.body;

  const updates = [];
  const params = [];
  let paramCount = 0;

  if (isRead !== undefined) {
    updates.push(`is_read = $${++paramCount}`);
    params.push(isRead);
  }

  if (isImportant !== undefined) {
    updates.push(`is_important = $${++paramCount}`);
    params.push(isImportant);
  }

  if (aiCategory) {
    updates.push(`ai_category = $${++paramCount}`);
    params.push(aiCategory);
  }

  if (updates.length === 0) {
    throw createError('No valid updates provided', 400);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  params.push(id);

  const query = `
    UPDATE emails 
    SET ${updates.join(', ')}
    WHERE id = $${++paramCount}
    RETURNING *
  `;

  const result = await databaseService.query(query, params);

  if (result.rows.length === 0) {
    throw createError('Email not found', 404);
  }

  // Update in Elasticsearch
  try {
    await elasticsearchService.updateEmail(id, {
      isRead,
      isImportant,
      aiCategory
    });
  } catch (error) {
    logger.error('Failed to update email in Elasticsearch:', error);
  }

  res.json({
    success: true,
    data: result.rows[0]
  });
}));

// Delete email
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await databaseService.query(`
    DELETE FROM emails 
    WHERE id = $1
    RETURNING *
  `, [id]);

  if (result.rows.length === 0) {
    throw createError('Email not found', 404);
  }

  // Delete from Elasticsearch
  try {
    await elasticsearchService.deleteEmail(id);
  } catch (error) {
    logger.error('Failed to delete email from Elasticsearch:', error);
  }

  // Delete from vector database
  try {
    await vectorDBService.deleteEmail(id);
  } catch (error) {
    logger.error('Failed to delete email from vector database:', error);
  }

  res.json({
    success: true,
    message: 'Email deleted successfully'
  });
}));

// Get email accounts
router.get('/accounts/list', asyncHandler(async (req, res) => {
  const result = await databaseService.query(`
    SELECT id, name, host, username, folders, is_active, created_at
    FROM email_accounts
    ORDER BY created_at DESC
  `);

  res.json({
    success: true,
    data: result.rows
  });
}));

// Add email account
router.post('/accounts', asyncHandler(async (req, res) => {
  const { name, host, port, secure, username, password, folders, isActive = true } = req.body;

  if (!name || !host || !username || !password) {
    throw createError('Missing required fields', 400);
  }

  const result = await databaseService.query(`
    INSERT INTO email_accounts (name, host, port, secure, username, password, folders, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id, name, host, username, folders, is_active, created_at
  `, [name, host, port, secure, username, password, folders || ['INBOX'], isActive]);

  res.status(201).json({
    success: true,
    data: result.rows[0]
  });
}));

// Get email statistics
router.get('/stats/overview', asyncHandler(async (req, res) => {
  const stats = await databaseService.query(`
    SELECT 
      COUNT(*) as total_emails,
      COUNT(CASE WHEN is_read = true THEN 1 END) as read_emails,
      COUNT(CASE WHEN is_important = true THEN 1 END) as important_emails,
      COUNT(CASE WHEN ai_category = 'Interested' THEN 1 END) as interested_emails,
      COUNT(CASE WHEN ai_category = 'Meeting Booked' THEN 1 END) as meeting_emails,
      COUNT(CASE WHEN ai_category = 'Not Interested' THEN 1 END) as not_interested_emails,
      COUNT(CASE WHEN ai_category = 'Spam' THEN 1 END) as spam_emails,
      COUNT(CASE WHEN ai_category = 'Out of Office' THEN 1 END) as ooo_emails
    FROM emails
  `);

  const accountStats = await databaseService.query(`
    SELECT 
      ea.name as account_name,
      COUNT(e.id) as email_count,
      COUNT(CASE WHEN e.ai_category = 'Interested' THEN 1 END) as interested_count
    FROM email_accounts ea
    LEFT JOIN emails e ON ea.id = e.account_id
    GROUP BY ea.id, ea.name
    ORDER BY email_count DESC
  `);

  const folderStats = await databaseService.query(`
    SELECT 
      folder,
      COUNT(*) as email_count,
      COUNT(CASE WHEN ai_category = 'Interested' THEN 1 END) as interested_count
    FROM emails
    GROUP BY folder
    ORDER BY email_count DESC
  `);

  res.json({
    success: true,
    data: {
      overview: stats.rows[0],
      byAccount: accountStats.rows,
      byFolder: folderStats.rows
    }
  });
}));

export { router as emailRoutes };


