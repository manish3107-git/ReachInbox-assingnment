import { Router } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { ElasticsearchService } from '../services/ElasticsearchService';
import { VectorDBService } from '../services/VectorDBService';
import { logger } from '../utils/logger';

const router = Router();

// Initialize services (these would be injected in a real app)
let elasticsearchService: ElasticsearchService;
let vectorDBService: VectorDBService;

export const initializeSearchRoutes = (
  es: ElasticsearchService,
  vector: VectorDBService
) => {
  elasticsearchService = es;
  vectorDBService = vector;
};

// Search emails using Elasticsearch
router.get('/', asyncHandler(async (req, res) => {
  const {
    q: searchText,
    accountId,
    folder,
    aiCategory,
    dateFrom,
    dateTo,
    page = 1,
    limit = 20
  } = req.query;

  if (!searchText) {
    throw createError('Search query is required', 400);
  }

  const filters: any = {};
  if (accountId) filters.accountId = Number(accountId);
  if (folder) filters.folder = folder;
  if (aiCategory) filters.aiCategory = aiCategory;
  if (dateFrom || dateTo) {
    filters.dateRange = {
      from: dateFrom,
      to: dateTo
    };
  }

  const offset = (Number(page) - 1) * Number(limit);

  try {
    const searchResult = await elasticsearchService.searchByText(
      searchText as string,
      filters
    );

    const hits = searchResult.hits?.hits || [];
    const totalHits = searchResult.hits?.total?.value || 0;

    const emails = hits.map((hit: any) => ({
      ...hit._source,
      _score: hit._score
    }));

    res.json({
      success: true,
      data: {
        emails,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          totalHits,
          totalPages: Math.ceil(totalHits / Number(limit))
        },
        searchText,
        filters
      }
    });
  } catch (error) {
    logger.error('Search error:', error);
    throw createError('Search failed', 500);
  }
}));

// Advanced search with multiple criteria
router.post('/advanced', asyncHandler(async (req, res) => {
  const {
    query,
    filters = {},
    sort = { date: { order: 'desc' } },
    page = 1,
    limit = 20
  } = req.body;

  if (!query) {
    throw createError('Search query is required', 400);
  }

  const offset = (Number(page) - 1) * Number(limit);

  const searchQuery = {
    query: {
      bool: {
        must: [
          {
            multi_match: {
              query: query.text || '',
              fields: query.fields || ['subject^2', 'bodyText', 'fromName', 'fromEmail'],
              type: query.type || 'best_fields',
              fuzziness: query.fuzziness || 'AUTO'
            }
          }
        ],
        filter: []
      }
    },
    sort: [sort],
    from: offset,
    size: Number(limit)
  };

    // Add filters
    if (filters.accountId) {
      (searchQuery.query.bool.filter as any[]).push({
        term: { accountId: filters.accountId }
      });
    }

    if (filters.folder) {
      (searchQuery.query.bool.filter as any[]).push({
        term: { folder: filters.folder }
      });
    }

    if (filters.aiCategory) {
      (searchQuery.query.bool.filter as any[]).push({
        term: { aiCategory: filters.aiCategory }
      });
    }

    if (filters.dateRange) {
      (searchQuery.query.bool.filter as any[]).push({
        range: {
          date: {
            gte: filters.dateRange.from,
            lte: filters.dateRange.to
          }
        }
      });
    }

    if (filters.isRead !== undefined) {
      (searchQuery.query.bool.filter as any[]).push({
        term: { isRead: filters.isRead }
      });
    }

    if (filters.isImportant !== undefined) {
      (searchQuery.query.bool.filter as any[]).push({
        term: { isImportant: filters.isImportant }
      });
    }

  try {
    const searchResult = await elasticsearchService.searchEmails(searchQuery);
    const hits = searchResult.hits?.hits || [];
    const totalHits = searchResult.hits?.total?.value || 0;

    const emails = hits.map((hit: any) => ({
      ...hit._source,
      _score: hit._score
    }));

    res.json({
      success: true,
      data: {
        emails,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          totalHits,
          totalPages: Math.ceil(totalHits / Number(limit))
        },
        query,
        filters
      }
    });
  } catch (error) {
    logger.error('Advanced search error:', error);
    throw createError('Advanced search failed', 500);
  }
}));

// Semantic search using vector database
router.post('/semantic', asyncHandler(async (req, res) => {
  const {
    query,
    filters = {},
    limit = 10
  } = req.body;

  if (!query) {
    throw createError('Search query is required', 400);
  }

  try {
    const similarEmails = await vectorDBService.searchSimilarEmails(
      query,
      Number(limit),
      filters
    );

    res.json({
      success: true,
      data: {
        emails: similarEmails,
        query,
        filters,
        type: 'semantic'
      }
    });
  } catch (error) {
    logger.error('Semantic search error:', error);
    throw createError('Semantic search failed', 500);
  }
}));

// Get search suggestions/autocomplete
router.get('/suggest', asyncHandler(async (req, res) => {
  const { q: searchText, type = 'subject' } = req.query;

  if (!searchText || searchText.length < 2) {
    return res.json({
      success: true,
      data: {
        suggestions: []
      }
    });
  }

  try {
    // This would typically use Elasticsearch's suggest API
    // For now, we'll do a simple search and extract suggestions
    const searchResult = await elasticsearchService.searchByText(
      searchText as string,
      {}
    );

    const hits = searchResult.hits?.hits || [];
    const suggestions = hits
      .slice(0, 5)
      .map((hit: any) => {
        const source = hit._source;
        return {
          text: source.subject || source.fromName || source.fromEmail,
          type: type,
          score: hit._score
        };
      })
      .filter((suggestion: any) => suggestion.text);

    res.json({
      success: true,
      data: {
        suggestions
      }
    });
  } catch (error) {
    logger.error('Search suggestions error:', error);
    res.json({
      success: true,
      data: {
        suggestions: []
      }
    });
  }
}));

// Get search statistics
router.get('/stats', asyncHandler(async (req, res) => {
  try {
    const stats = await elasticsearchService.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Search stats error:', error);
    throw createError('Failed to get search statistics', 500);
  }
}));

// Search by category
router.get('/category/:category', asyncHandler(async (req, res) => {
  const { category } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const validCategories = ['Interested', 'Meeting Booked', 'Not Interested', 'Spam', 'Out of Office'];
  if (!validCategories.includes(category)) {
    throw createError('Invalid category', 400);
  }

  const offset = (Number(page) - 1) * Number(limit);

  try {
    const searchResult = await elasticsearchService.searchEmails({
      query: {
        term: { aiCategory: category }
      },
      sort: [{ date: { order: 'desc' } }],
      from: offset,
      size: Number(limit)
    });

    const hits = searchResult.hits?.hits || [];
    const totalHits = searchResult.hits?.total?.value || 0;

    const emails = hits.map((hit: any) => hit._source);

    res.json({
      success: true,
      data: {
        emails,
        category,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          totalHits,
          totalPages: Math.ceil(totalHits / Number(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Category search error:', error);
    throw createError('Category search failed', 500);
  }
}));

export { router as searchRoutes };
