#!/usr/bin/env bash

# Navigate to the project root directory where this script is located
cd "$(dirname "$0")" || exit 1

echo "=========================================="
echo "  🎹 Starting HarmonyLab Development Server"
echo "  URL: http://localhost:3000"
echo "=========================================="

# If port 3000 is already in use by another process, kill it gracefully
PID=$(lsof -ti :3000 2>/dev/null)
if [ -n "$PID" ]; then
  echo "Freeing up port 3000 (PID $PID)..."
  kill -9 $PID 2>/dev/null
  sleep 0.5
fi

# Run Next.js development server explicitly on port 3000
npm run dev -- -p 3000
