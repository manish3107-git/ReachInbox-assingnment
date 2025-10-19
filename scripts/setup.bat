@echo off
REM ReachInbox Setup Script for Windows

echo 🚀 Setting up ReachInbox...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

REM Create necessary directories
echo 📁 Creating directories...
if not exist logs mkdir logs
if not exist chroma_db mkdir chroma_db
if not exist ssl mkdir ssl

REM Copy environment file if it doesn't exist
if not exist .env (
    echo 📝 Creating environment file...
    copy env.example .env
    echo ⚠️  Please edit .env file with your configuration before starting the application.
)

REM Build and start services
echo 🔨 Building and starting services...
docker-compose up -d --build

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 30 /nobreak >nul

REM Check if services are running
echo 🔍 Checking service status...
docker-compose ps

REM Test health endpoint
echo 🏥 Testing health endpoint...
curl -f http://localhost:3000/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Backend health check failed
) else (
    echo ✅ Backend is healthy
)

echo ✅ Setup complete!
echo.
echo 🌐 Access the application:
echo    Frontend: http://localhost:3001
echo    Backend API: http://localhost:3000
echo    Health Check: http://localhost:3000/health
echo.
echo 📚 Next steps:
echo    1. Edit .env file with your API keys and email accounts
echo    2. Restart services: docker-compose restart
echo    3. Check logs: docker-compose logs -f
echo.
echo 🔧 Useful commands:
echo    Stop services: docker-compose down
echo    View logs: docker-compose logs -f
echo    Restart: docker-compose restart

pause


