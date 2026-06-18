Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MotoBus Backend Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Clean
Write-Host "`n[1/5] Cleaning old files..." -ForegroundColor Yellow
Remove-Item -Path node_modules -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path prisma\migrations -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path dev.db -Force -ErrorAction SilentlyContinue

# Install
Write-Host "`n[2/5] Installing dependencies..." -ForegroundColor Yellow
npm install

# Generate Prisma
Write-Host "`n[3/5] Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

# Create migration
Write-Host "`n[4/5] Creating database migration..." -ForegroundColor Yellow
npx prisma migrate dev --name init

# Start server
Write-Host "`n[5/5] Starting server..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
npm run dev