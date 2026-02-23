#!/bin/bash
# Quick start script for Zero Trust Access Platform

echo "🚀 Zero Trust Access Platform - Quick Start"
echo "==========================================="

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "📦 pnpm not found. Installing..."
    npm install -g pnpm
fi

echo ""
echo "📦 Installing dependencies..."
pnpm install

echo ""
echo "🔨 Building for production..."
pnpm build

echo ""
echo "✅ Build complete!"
echo ""
echo "To run the server, use:"
echo "  pnpm start"
echo ""
echo "Access at: http://localhost:3000"
echo ""
