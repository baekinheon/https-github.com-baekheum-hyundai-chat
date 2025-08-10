@echo off
cd /d %~dp0
echo [*] Building frontend...
npm run build
echo [*] Starting API+Web on http://localhost:5174
node server.js
