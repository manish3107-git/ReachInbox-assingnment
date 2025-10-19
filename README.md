# ReachInbox - AI-Powered Email Aggregator

A comprehensive email management platform that synchronizes multiple IMAP accounts in real-time, provides AI-powered email categorization, and offers advanced search capabilities with intelligent reply suggestions.

## 🚀 Features

### Core Functionality
- **Real-time Email Synchronization**: Sync multiple IMAP accounts using persistent IDLE connections
- **AI-Powered Categorization**: Automatically categorize emails into Interested, Meeting Booked, Not Interested, Spam, and Out of Office
- **Advanced Search**: Full-text search powered by Elasticsearch with fuzzy matching and semantic search
- **Vector Database & RAG**: AI-powered reply suggestions using Retrieval-Augmented Generation
- **Real-time Notifications**: Slack notifications and webhook integration for interested emails
- **Modern Web Interface**: React-based frontend with Material-UI components

### Technical Features
- **TypeScript & Node.js**: Full-stack TypeScript implementation
- **Microservices Architecture**: Modular service design with clear separation of concerns
- **Docker Support**: Complete containerization with docker-compose
- **Database Support**: PostgreSQL, Redis, Elasticsearch, and ChromaDB
- **Real-time Updates**: WebSocket integration for live email updates
- **RESTful API**: Comprehensive API with proper error handling and validation

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │   Nginx Proxy   │    │   Backend API   │
│   (Port 3001)   │◄──►│   (Port 80)     │◄──►│   (Port 3000)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                       ┌───────────────────────────────┼───────────────────────────────┐
                       │                               │                               │
              ┌────────▼────────┐              ┌──────▼──────┐              ┌────────▼────────┐
              │   PostgreSQL    │              │  Elasticsearch │              │   ChromaDB     │
              │   (Port 5432)   │              │   (Port 9200)  │              │   (Port 8000)  │
              └─────────────────┘              └───────────────┘              └─────────────────┘
                       │
              ┌────────▼────────┐
              │     Redis       │
              │   (Port 6379)   │
              └─────────────────┘
```

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js with Socket.IO
- **Database**: PostgreSQL with connection pooling
- **Cache**: Redis for session management
- **Search**: Elasticsearch for full-text search
- **Vector DB**: ChromaDB for RAG functionality
- **AI**: OpenAI GPT-4 / Anthropic Claude integration
- **Email**: IMAP with IDLE support for real-time sync

### Frontend
- **Framework**: React 18 with TypeScript
- **UI Library**: Material-UI (MUI) v5
- **State Management**: React Query for server state
- **Charts**: Recharts for data visualization
- **Routing**: React Router v6
- **Real-time**: Socket.IO client

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Nginx with load balancing
- **Process Management**: PM2 for production
- **Monitoring**: Winston logging with structured logs

## 📋 Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- Git

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd reachinbox-assignment
```

### 2. Environment Configuration
```bash
cp env.example .env
```

Edit `.env` with your configuration:
```env
# AI Configuration
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
AI_PROVIDER=openai

# Slack Integration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
SLACK_CHANNEL=#email-notifications

# Webhook Configuration
WEBHOOK_URL=https://webhook.site/your-unique-url

# IMAP Accounts (JSON format)
IMAP_ACCOUNTS=[
  {
    "name": "Gmail Account",
    "host": "imap.gmail.com",
    "port": 993,
    "secure": true,
    "username": "your-email@gmail.com",
    "password": "your-app-password",
    "folders": ["INBOX", "SENT", "SPAM"]
  }
]
```

### 3. Start the Application
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 4. Access the Application
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

## 🔧 Development Setup

### Backend Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
npm start
```

### Frontend Development
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## 📚 API Documentation

### Authentication
All API endpoints require proper authentication. Include the API key in the Authorization header:
```
Authorization: Bearer your-api-key
```

### Core Endpoints

#### Emails
- `GET /api/emails` - List emails with pagination and filtering
- `GET /api/emails/:id` - Get specific email details
- `PATCH /api/emails/:id` - Update email (mark as read, important, etc.)
- `DELETE /api/emails/:id` - Delete email
- `GET /api/emails/stats/overview` - Get email statistics

#### Search
- `GET /api/search` - Regular text search
- `POST /api/search/advanced` - Advanced search with filters
- `POST /api/search/semantic` - AI-powered semantic search
- `GET /api/search/suggest` - Search suggestions/autocomplete

#### AI Features
- `POST /api/ai/categorize` - Categorize email with AI
- `POST /api/ai/reply-suggestion` - Generate reply suggestions
- `POST /api/ai/extract-info` - Extract key information from email
- `POST /api/ai/bulk-categorize` - Bulk categorize multiple emails

### WebSocket Events
- `newEmail` - New email received
- `emailCategorized` - Email categorization updated
- `emailUpdated` - Email status changed

## 🔍 Search Features

### Regular Search
- Full-text search across subject, body, sender name, and email
- Fuzzy matching for typos and variations
- Filter by account, folder, category, and date range

### Advanced Search
- Boolean queries with AND/OR operators
- Field-specific searches
- Wildcard and regex support
- Custom scoring and ranking

### Semantic Search
- AI-powered similarity search
- Context-aware results
- Natural language queries
- Vector-based matching

## 🤖 AI Features

### Email Categorization
Automatically categorizes emails into:
- **Interested**: Shows genuine interest or engagement
- **Meeting Booked**: Confirms or schedules meetings
- **Not Interested**: Shows disinterest or rejection
- **Spam**: Unsolicited or promotional content
- **Out of Office**: Automated responses

### Reply Suggestions
- Context-aware reply generation
- Incorporates product information and agenda
- Uses similar email patterns for better suggestions
- Confidence scoring for suggestions

### Key Information Extraction
- Identifies key points and sentiment
- Determines urgency level
- Detects action requirements
- Extracts important details

## 🔔 Notifications

### Slack Integration
- Real-time notifications for interested emails
- Rich message formatting with email details
- Configurable channels and webhooks
- Error notifications for system issues

### Webhook Support
- Custom webhook URLs for external integrations
- JSON payload with email data and metadata
- Event-based triggers (interested emails, categorization)
- Retry logic and error handling

## 📊 Analytics & Monitoring

### Dashboard Metrics
- Total emails processed
- Categorization distribution
- Account performance
- Folder statistics
- Real-time activity feed

### Performance Monitoring
- Email sync status
- AI service health
- Database performance
- Search response times

## 🐳 Docker Configuration

### Services
- **postgres**: PostgreSQL database
- **redis**: Redis cache
- **elasticsearch**: Search engine
- **chromadb**: Vector database
- **backend**: Node.js API server
- **frontend**: React application
- **nginx**: Reverse proxy

### Volumes
- `postgres_data`: Database persistence
- `redis_data`: Cache persistence
- `elasticsearch_data`: Search index persistence
- `chroma_data`: Vector database persistence

## 🔒 Security

### Data Protection
- All data encrypted in transit (TLS)
- Database connections use SSL
- API keys stored securely
- No sensitive data in logs

### Authentication
- JWT-based authentication
- API key management
- Role-based access control
- Session management with Redis

## 🚀 Deployment

### Production Deployment
1. Configure environment variables
2. Set up SSL certificates
3. Configure domain and DNS
4. Deploy with Docker Compose
5. Set up monitoring and logging

### Scaling
- Horizontal scaling with load balancers
- Database read replicas
- Redis clustering
- Elasticsearch cluster setup

## 🧪 Testing

### Backend Tests
```bash
npm test
npm run test:coverage
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Integration Tests
```bash
npm run test:integration
```

## 📈 Performance

### Optimizations
- Database indexing for fast queries
- Redis caching for frequent data
- Elasticsearch optimization
- Connection pooling
- Lazy loading in frontend

### Monitoring
- Application metrics
- Database performance
- Search latency
- Memory usage
- Error rates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API documentation

## 🔮 Future Enhancements

- [ ] Mobile app support
- [ ] Advanced AI models
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Email templates
- [ ] Calendar integration
- [ ] CRM integration
- [ ] Advanced reporting

---

**Built with ❤️ for the ReachInbox assignment**


#   R e a c h I n b o x - a s s i n g n m e n t  
 #   R e a c h I n b o x  
 