@echo off
setlocal

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 20 or newer is required.
  echo Download it from https://nodejs.org/
  pause
  exit /b 1
)

if not exist node_modules (
  call npm install
  if errorlevel 1 exit /b 1
)

echo Starting MKN AI City at http://localhost:4173
call npm start
