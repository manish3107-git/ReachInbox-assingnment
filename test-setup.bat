@echo off
echo 🧪 Testing ReachInbox Setup...

echo.
echo 📦 Checking Backend Build...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Backend build failed
    pause
    exit /b 1
)
echo ✅ Backend build successful

echo.
echo 📦 Checking Frontend Dependencies...
cd frontend
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo ❌ Frontend dependencies failed
    pause
    exit /b 1
)
echo ✅ Frontend dependencies installed

echo.
echo 🔍 Checking TypeScript compilation...
call npx tsc --noEmit
if %errorlevel% neq 0 (
    echo ❌ TypeScript compilation failed
    pause
    exit /b 1
)
echo ✅ TypeScript compilation successful

cd ..

echo.
echo 🐳 Checking Docker availability...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Docker not found - you'll need Docker Desktop for full functionality
) else (
    echo ✅ Docker is available
)

echo.
echo 📋 Checking configuration files...
if exist .env (
    echo ✅ .env file exists
) else (
    echo ⚠️  .env file missing - copying from template
    copy env.example .env
)

echo.
echo 🎉 Setup test completed!
echo.
echo 📚 Next steps:
echo 1. Edit .env file with your configuration
echo 2. Run: start.bat
echo 3. Or manually: docker-compose up -d
echo.
pause


