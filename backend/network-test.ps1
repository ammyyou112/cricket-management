# =============================================================================
# SUPABASE CONNECTIVITY DIAGNOSTIC TEST
# Run this script in PowerShell (as Administrator for best results)
# =============================================================================

Write-Host "`n🔍 SUPABASE CONNECTIVITY DIAGNOSTIC TEST`n" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray
Write-Host ""

# Test 1: DNS Resolution
Write-Host "TEST 1: DNS Resolution" -ForegroundColor Yellow
Write-Host "-" * 50 -ForegroundColor Gray
try {
    $dns = Resolve-DnsName -Name "db.ywufxezickfiaejbvgwl.supabase.co" -ErrorAction Stop
    Write-Host "✅ DNS Resolution: SUCCESS" -ForegroundColor Green
    Write-Host "   IP Address: $($dns[0].IPAddress)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ DNS Resolution: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Ping
Write-Host "`nTEST 2: Ping Test" -ForegroundColor Yellow
Write-Host "-" * 50 -ForegroundColor Gray
try {
    $ping = Test-Connection -ComputerName "db.ywufxezickfiaejbvgwl.supabase.co" -Count 4 -ErrorAction Stop
    Write-Host "✅ Ping: SUCCESS" -ForegroundColor Green
    Write-Host "   Average Latency: $([math]::Round(($ping | Measure-Object -Property ResponseTime -Average).Average, 2)) ms" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Ping: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Port 5432 (PostgreSQL Direct)
Write-Host "`nTEST 3: PostgreSQL Port (5432) - Direct Connection" -ForegroundColor Yellow
Write-Host "-" * 50 -ForegroundColor Gray
try {
    $test5432 = Test-NetConnection -ComputerName "db.ywufxezickfiaejbvgwl.supabase.co" -Port 5432 -WarningAction SilentlyContinue
    if ($test5432.TcpTestSucceeded) {
        Write-Host "✅ Port 5432: ACCESSIBLE" -ForegroundColor Green
    } else {
        Write-Host "❌ Port 5432: BLOCKED" -ForegroundColor Red
        Write-Host "   This is likely the problem!" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Port 5432: TEST FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Port 6543 (Pooler)
Write-Host "`nTEST 4: Pooler Port (6543) - Transaction Pooler" -ForegroundColor Yellow
Write-Host "-" * 50 -ForegroundColor Gray
try {
    $test6543 = Test-NetConnection -ComputerName "aws-0-ap-southeast-1.pooler.supabase.com" -Port 6543 -WarningAction SilentlyContinue
    if ($test6543.TcpTestSucceeded) {
        Write-Host "✅ Port 6543: ACCESSIBLE" -ForegroundColor Green
        Write-Host "   💡 Try using pooler connection instead!" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Port 6543: BLOCKED" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Port 6543: TEST FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: HTTPS Port (443) - Supabase REST API
Write-Host "`nTEST 5: HTTPS Port (443) - Supabase REST API" -ForegroundColor Yellow
Write-Host "-" * 50 -ForegroundColor Gray
try {
    $test443 = Test-NetConnection -ComputerName "ywufxezickfiaejbvgwl.supabase.co" -Port 443 -WarningAction SilentlyContinue
    if ($test443.TcpTestSucceeded) {
        Write-Host "✅ Port 443: ACCESSIBLE" -ForegroundColor Green
        Write-Host "   💡 Supabase REST API is reachable!" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Port 443: BLOCKED" -ForegroundColor Red
        Write-Host "   ⚠️  Your network is blocking ALL Supabase connections" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Port 443: TEST FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Windows Firewall Status
Write-Host "`nTEST 6: Windows Firewall Status" -ForegroundColor Yellow
Write-Host "-" * 50 -ForegroundColor Gray
try {
    $firewall = Get-NetFirewallProfile | Select-Object Name, Enabled
    foreach ($profile in $firewall) {
        $status = if ($profile.Enabled) { "ENABLED" } else { "DISABLED" }
        $color = if ($profile.Enabled) { "Yellow" } else { "Green" }
        Write-Host "   $($profile.Name): $status" -ForegroundColor $color
    }
    if ($firewall | Where-Object { $_.Enabled -eq $true }) {
        Write-Host "   💡 Firewall is ON - might be blocking connections" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  Could not check firewall status" -ForegroundColor Yellow
}

# Test 7: VPN Check
Write-Host "`nTEST 7: VPN Connections" -ForegroundColor Yellow
Write-Host "-" * 50 -ForegroundColor Gray
try {
    $vpn = Get-VpnConnection -ErrorAction SilentlyContinue
    if ($vpn) {
        Write-Host "   ⚠️  VPN detected: $($vpn.Name -join ', ')" -ForegroundColor Yellow
        Write-Host "   💡 VPN might be interfering with database connections" -ForegroundColor Cyan
    } else {
        Write-Host "   ✅ No VPN connections detected" -ForegroundColor Green
    }
} catch {
    Write-Host "   ✅ No VPN connections detected" -ForegroundColor Green
}

# Test 8: Proxy Settings
Write-Host "`nTEST 8: Proxy Settings" -ForegroundColor Yellow
Write-Host "-" * 50 -ForegroundColor Gray
try {
    $proxy = netsh winhttp show proxy
    if ($proxy -match "Direct access") {
        Write-Host "   ✅ No proxy configured" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Proxy detected:" -ForegroundColor Yellow
        Write-Host "   $proxy" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ⚠️  Could not check proxy settings" -ForegroundColor Yellow
}

# Summary
Write-Host "`n" + ("=" * 70) -ForegroundColor Gray
Write-Host "📊 DIAGNOSTIC SUMMARY" -ForegroundColor Cyan
Write-Host ("=" * 70) -ForegroundColor Gray
Write-Host ""

Write-Host "🔍 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. If Port 5432 is BLOCKED but Port 443 works:" -ForegroundColor White
Write-Host "   → Use Supabase REST API or connection pooler (port 6543)" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. If Port 5432 is BLOCKED and Port 6543 works:" -ForegroundColor White
Write-Host "   → Update .env to use pooler connection string" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. If ALL ports are BLOCKED:" -ForegroundColor White
Write-Host "   → Check firewall/antivirus or try mobile hotspot" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. If Firewall is ENABLED:" -ForegroundColor White
Write-Host "   → Temporarily disable to test, then add exception" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ Diagnostic Complete!`n" -ForegroundColor Green

