import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Email API
export const emailAPI = {
  getEmails: (params?: any) => api.get('/emails', { params }),
  getEmail: (id: string) => api.get(`/emails/${id}`),
  updateEmail: (id: string, data: any) => api.patch(`/emails/${id}`, data),
  deleteEmail: (id: string) => api.delete(`/emails/${id}`),
  getAccounts: () => api.get('/emails/accounts/list'),
  addAccount: (data: any) => api.post('/emails/accounts', data),
  getStats: () => api.get('/emails/stats/overview'),
};

// Search API
export const searchAPI = {
  search: (params: any) => api.get('/search', { params }),
  advancedSearch: (data: any) => api.post('/search/advanced', data),
  semanticSearch: (data: any) => api.post('/search/semantic', data),
  getSuggestions: (params: any) => api.get('/search/suggest', { params }),
  getStats: () => api.get('/search/stats'),
  searchByCategory: (category: string, params?: any) => 
    api.get(`/search/category/${category}`, { params }),
};

// AI API
export const aiAPI = {
  categorizeEmail: (data: any) => api.post('/ai/categorize', data),
  generateReplySuggestion: (data: any) => api.post('/ai/reply-suggestion', data),
  extractKeyInfo: (data: any) => api.post('/ai/extract-info', data),
  bulkCategorize: (data: any) => api.post('/ai/bulk-categorize', data),
  getStatus: () => api.get('/ai/status'),
  test: () => api.post('/ai/test'),
  getCategorizationStats: () => api.get('/ai/stats/categorization'),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;


