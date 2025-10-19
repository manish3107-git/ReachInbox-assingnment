@echo off
echo 🚀 Starting ReachInbox Application...

REM Check if .env exists
if not exist .env (
    echo 📝 Creating .env file from template...
    copy env.example .env
    echo ⚠️  Please edit .env file with your configuration before running again.
    pause
    exit /b 1
)

REM Start with Docker Compose
echo 🔨 Starting services with Docker Compose...
docker-compose up -d

echo ⏳ Waiting for services to start...
timeout /t 30 /nobreak >nul

echo 🔍 Checking service status...
docker-compose ps

echo ✅ Application started!
echo.
echo 🌐 Access the application:
echo    Frontend: http://localhost:3001
echo    Backend API: http://localhost:3000
echo    Health Check: http://localhost:3000/health
echo.
echo 📚 To stop the application:
echo    docker-compose down
echo.
echo 📋 To view logs:
echo    docker-compose logs -f

pause


