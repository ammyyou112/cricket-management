# PowerShell script to update DATABASE_URL in .env file
# This script helps you switch from pooler (6543) to direct connection (5432)

Write-Host "`n🔧 DATABASE_URL Update Helper`n" -ForegroundColor Cyan

$envFile = ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ .env file not found in current directory" -ForegroundColor Red
    exit 1
}

Write-Host "Current DATABASE_URL:" -ForegroundColor Yellow
$currentLine = Get-Content $envFile | Select-String -Pattern "DATABASE_URL"
if ($currentLine) {
    $masked = $currentLine.Line -replace ':[^:@]+@', ':****@'
    Write-Host $masked -ForegroundColor Gray
} else {
    Write-Host "   DATABASE_URL not found in .env" -ForegroundColor Red
    exit 1
}

Write-Host "`n⚠️  You need to manually update DATABASE_URL in .env file`n" -ForegroundColor Yellow
Write-Host "Steps:" -ForegroundColor Cyan
Write-Host "1. Go to https://app.supabase.com → Your Project → Settings → Database" -ForegroundColor White
Write-Host "2. Copy the 'URI' connection string (NOT Transaction Pooler)" -ForegroundColor White
Write-Host "3. It should use port 5432 and host: db.[PROJECT].supabase.co" -ForegroundColor White
Write-Host "4. Replace DATABASE_URL in backend/.env with the new connection string" -ForegroundColor White
Write-Host "5. Remove ?pgbouncer=true if present" -ForegroundColor White
Write-Host "`nExample format:" -ForegroundColor Cyan
Write-Host "   postgresql://postgres.[PROJECT]:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres" -ForegroundColor Green
Write-Host "`nAfter updating, restart your server with: npm run dev`n" -ForegroundColor Yellow

