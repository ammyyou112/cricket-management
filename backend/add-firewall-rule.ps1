# =============================================================================
# ADD WINDOWS FIREWALL RULE FOR SUPABASE POSTGRESQL
# Run this script in PowerShell AS ADMINISTRATOR
# =============================================================================

Write-Host "`n🔧 Adding Windows Firewall Rule for Supabase PostgreSQL`n" -ForegroundColor Cyan

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "   Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "✅ Running as Administrator" -ForegroundColor Green
Write-Host ""

# Rule 1: Outbound rule for port 5432 (PostgreSQL Direct)
Write-Host "Adding rule for PostgreSQL Direct (Port 5432)..." -ForegroundColor Yellow
try {
    $rule1 = New-NetFirewallRule -DisplayName "Supabase PostgreSQL (Port 5432)" `
        -Direction Outbound `
        -Protocol TCP `
        -RemotePort 5432 `
        -Action Allow `
        -Description "Allow outbound connections to Supabase PostgreSQL database" `
        -ErrorAction Stop
    
    Write-Host "✅ Rule added successfully!" -ForegroundColor Green
    Write-Host "   Name: $($rule1.DisplayName)" -ForegroundColor Cyan
} catch {
    if ($_.Exception.Message -match "already exists") {
        Write-Host "⚠️  Rule already exists" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Failed to add rule: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Rule 2: Outbound rule for port 6543 (Pooler)
Write-Host "`nAdding rule for PostgreSQL Pooler (Port 6543)..." -ForegroundColor Yellow
try {
    $rule2 = New-NetFirewallRule -DisplayName "Supabase PostgreSQL Pooler (Port 6543)" `
        -Direction Outbound `
        -Protocol TCP `
        -RemotePort 6543 `
        -Action Allow `
        -Description "Allow outbound connections to Supabase PostgreSQL connection pooler" `
        -ErrorAction Stop
    
    Write-Host "✅ Rule added successfully!" -ForegroundColor Green
    Write-Host "   Name: $($rule2.DisplayName)" -ForegroundColor Cyan
} catch {
    if ($_.Exception.Message -match "already exists") {
        Write-Host "⚠️  Rule already exists" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Failed to add rule: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Verify rules
Write-Host "`nVerifying firewall rules..." -ForegroundColor Yellow
$rules = Get-NetFirewallRule -DisplayName "*Supabase*" | Select-Object DisplayName, Enabled, Direction, Action
if ($rules) {
    Write-Host "`n✅ Firewall Rules:" -ForegroundColor Green
    $rules | Format-Table -AutoSize
} else {
    Write-Host "⚠️  No Supabase firewall rules found" -ForegroundColor Yellow
}

Write-Host "`n✅ Firewall configuration complete!`n" -ForegroundColor Green
Write-Host "💡 Try running 'npm run dev' again" -ForegroundColor Cyan
Write-Host ""

