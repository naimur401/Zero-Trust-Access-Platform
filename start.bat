@echo off
REM Quick start script for Zero Trust Access Platform (Windows)

echo.
echo 🚀 Zero Trust Access Platform - Quick Start
echo ===========================================
echo.

echo 📦 Installing dependencies...
pnpm install

echo.
echo 🔨 Building for production...
pnpm build

echo.
echo ✅ Build complete!
echo.
echo To run the server, use:
echo   pnpm start
echo.
echo Access at: http://localhost:3000
echo.
pause
