# 🚀 ReachInbox Setup Guide

## Quick Start (Recommended)

### 1. Prerequisites
- **Docker Desktop** installed and running
- **Node.js 18+** (for local development)
- **Git** for cloning the repository

### 2. Clone and Setup
```bash
git clone <repository-url>
cd reachinbox-assignment
```

### 3. Configure Environment
```bash
# Copy environment template
copy env.example .env

# Edit .env file with your configuration
notepad .env
```

### 4. Start the Application
```bash
# Windows - Run the setup script
start.bat

# Or manually with Docker
docker-compose up -d
```

### 5. Access the Application
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

## 🔧 Configuration

### Required Environment Variables

#### AI Configuration (At least one required)
```env
# OpenAI (Recommended)
OPENAI_API_KEY=your-openai-api-key
AI_PROVIDER=openai

# OR Anthropic Claude
ANTHROPIC_API_KEY=your-anthropic-api-key
AI_PROVIDER=anthropic
```

#### Email Accounts (At least one required)
```env
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

#### Optional Integrations
```env
# Slack Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
SLACK_CHANNEL=#email-notifications

# Webhook Testing
WEBHOOK_URL=https://webhook.site/your-unique-url
```

### Gmail Setup
1. Enable 2-Factor Authentication
2. Generate an App Password:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use this password in your .env file

## 🛠️ Development Setup

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
npm install --legacy-peer-deps

# Start development server
npm start

# Build for production
npm run build
```

## 🐳 Docker Commands

### Start Services
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Individual Services
```bash
# Start specific service
docker-compose up -d postgres
docker-compose up -d elasticsearch
docker-compose up -d redis
docker-compose up -d chromadb
docker-compose up -d backend
docker-compose up -d frontend
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the port
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Kill the process
taskkill /PID <process_id> /F
```

#### 2. Docker Issues
```bash
# Restart Docker Desktop
# Or reset Docker
docker system prune -a
```

#### 3. Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres
```

#### 4. Elasticsearch Issues
```bash
# Check Elasticsearch status
curl http://localhost:9200

# View Elasticsearch logs
docker-compose logs elasticsearch
```

#### 5. Frontend Build Issues
```bash
# Clear node_modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Health Checks

#### Backend Health
```bash
curl http://localhost:3000/health
```

#### Database Health
```bash
# PostgreSQL
docker-compose exec postgres psql -U reachinbox_user -d reachinbox -c "SELECT 1;"

# Redis
docker-compose exec redis redis-cli ping
```

#### Elasticsearch Health
```bash
curl http://localhost:9200/_cluster/health
```

## 📊 Monitoring

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Check Service Status
```bash
docker-compose ps
```

### Resource Usage
```bash
docker stats
```

## 🚀 Production Deployment

### 1. Environment Setup
```bash
# Set production environment
export NODE_ENV=production

# Update .env with production values
# - Use production database URLs
# - Set secure JWT secrets
# - Configure production domains
```

### 2. Build and Deploy
```bash
# Build backend
npm run build

# Build frontend
cd frontend
npm run build

# Start with Docker
docker-compose -f docker-compose.prod.yml up -d
```

### 3. SSL Configuration
- Update nginx.conf with SSL certificates
- Configure domain names
- Set up reverse proxy

## 🔧 Advanced Configuration

### Database Configuration
```env
# PostgreSQL
DATABASE_URL=postgresql://username:password@host:port/database

# Redis
REDIS_URL=redis://host:port
```

### Elasticsearch Configuration
```env
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_INDEX=emails
```

### Vector Database
```env
CHROMA_PERSIST_DIRECTORY=./chroma_db
```

## 📚 API Documentation

### Health Check
```bash
GET /health
```

### Email Endpoints
```bash
GET /api/emails              # List emails
GET /api/emails/:id          # Get email details
PATCH /api/emails/:id        # Update email
DELETE /api/emails/:id       # Delete email
```

### Search Endpoints
```bash
GET /api/search              # Search emails
POST /api/search/advanced    # Advanced search
POST /api/search/semantic    # Semantic search
```

### AI Endpoints
```bash
POST /api/ai/categorize      # Categorize email
POST /api/ai/reply-suggestion # Generate reply
POST /api/ai/extract-info    # Extract key info
```

## 🆘 Support

If you encounter issues:

1. **Check the logs**: `docker-compose logs -f`
2. **Verify configuration**: Check your .env file
3. **Test health endpoints**: Visit http://localhost:3000/health
4. **Check service status**: `docker-compose ps`
5. **Restart services**: `docker-compose restart`

## 🎯 Next Steps

1. **Configure your email accounts** in the .env file
2. **Add your AI API keys** (OpenAI or Anthropic)
3. **Set up Slack notifications** (optional)
4. **Test the application** by accessing the frontend
5. **Monitor the logs** to ensure everything is working

---

**Happy coding! 🚀**


