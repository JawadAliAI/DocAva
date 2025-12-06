# Render Deployment Checklist Script (PowerShell)
# Run this before deploying to ensure everything is ready

Write-Host ""
Write-Host "🔍 Checking Render Deployment Readiness..." -ForegroundColor Cyan
Write-Host ""

$ChecksPassed = 0
$ChecksFailed = 0

Write-Host "📁 Checking Required Files..." -ForegroundColor Yellow

$requiredFiles = @(
    "render.yaml",
    "render-build.sh",
    "apps\backend\server.js",
    "apps\backend\package.json",
    "apps\backend\requirements.txt",
    "apps\frontend\package.json",
    ".gitignore"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✓ $file exists" -ForegroundColor Green
        $ChecksPassed++
    }
    else {
        Write-Host "✗ $file is missing" -ForegroundColor Red
        $ChecksFailed++
    }
}

Write-Host ""
Write-Host "📂 Checking Required Directories..." -ForegroundColor Yellow

$requiredDirs = @(
    "apps\backend",
    "apps\frontend",
    "apps\backend\modules",
    "apps\frontend\src",
    "apps\frontend\public"
)

foreach ($dir in $requiredDirs) {
    if (Test-Path $dir -PathType Container) {
        Write-Host "✓ $dir directory exists" -ForegroundColor Green
        $ChecksPassed++
    }
    else {
        Write-Host "✗ $dir directory is missing" -ForegroundColor Red
        $ChecksFailed++
    }
}

Write-Host ""
Write-Host "🔧 Checking Configuration..." -ForegroundColor Yellow

if (Test-Path "apps\frontend\.env") {
    Write-Host "⚠ apps\frontend\.env exists (ensure it's in .gitignore)" -ForegroundColor Yellow
}
else {
    Write-Host "✓ No .env file in frontend (good for deployment)" -ForegroundColor Green
    $ChecksPassed++
}

if (Test-Path "apps\backend\.env") {
    Write-Host "⚠ apps\backend\.env exists (ensure it's in .gitignore)" -ForegroundColor Yellow
}
else {
    Write-Host "✓ No .env file in backend (good for deployment)" -ForegroundColor Green
    $ChecksPassed++
}

Write-Host ""
Write-Host "📦 Checking Dependencies..." -ForegroundColor Yellow

if (Test-Path "node_modules") {
    Write-Host "⚠ node_modules exists (will be rebuilt on Render)" -ForegroundColor Yellow
}
else {
    Write-Host "✓ No node_modules (clean deployment)" -ForegroundColor Green
    $ChecksPassed++
}

Write-Host ""
Write-Host "🔍 Checking Git Status..." -ForegroundColor Yellow

if (Test-Path ".git") {
    Write-Host "✓ Git repository initialized" -ForegroundColor Green
    $ChecksPassed++
    
    $gitStatus = git status --porcelain 2>$null
    if ($gitStatus) {
        Write-Host "⚠ You have uncommitted changes" -ForegroundColor Yellow
        Write-Host "   Run: git add . && git commit -m 'Ready for deployment'" -ForegroundColor Gray
    }
    else {
        Write-Host "✓ No uncommitted changes" -ForegroundColor Green
        $ChecksPassed++
    }
    
    $gitRemote = git remote -v 2>$null | Select-String "origin"
    if ($gitRemote) {
        Write-Host "✓ Git remote 'origin' is set" -ForegroundColor Green
        $ChecksPassed++
        Write-Host "   $($gitRemote[0])" -ForegroundColor Gray
    }
    else {
        Write-Host "✗ Git remote 'origin' is not set" -ForegroundColor Red
        Write-Host "   Run: git remote add origin https://github.com/YOUR_USERNAME/ProWellAvatar.git" -ForegroundColor Gray
        $ChecksFailed++
    }
}
else {
    Write-Host "✗ Git repository not initialized" -ForegroundColor Red
    Write-Host "   Run: git init" -ForegroundColor Gray
    $ChecksFailed++
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "   Passed: $ChecksPassed" -ForegroundColor Green
Write-Host "   Failed: $ChecksFailed" -ForegroundColor Red
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

if ($ChecksFailed -eq 0) {
    Write-Host "✅ Ready for Render deployment!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Push to GitHub: git push origin main" -ForegroundColor White
    Write-Host "2. Go to https://dashboard.render.com" -ForegroundColor White
    Write-Host "3. Click 'New +' → 'Blueprint'" -ForegroundColor White
    Write-Host "4. Select your repository" -ForegroundColor White
    Write-Host "5. Click 'Apply'" -ForegroundColor White
    Write-Host ""
}
else {
    Write-Host "❌ Please fix the issues above before deploying" -ForegroundColor Red
    Write-Host ""
}
