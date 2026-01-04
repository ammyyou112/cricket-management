# 🔍 Network Connectivity Diagnostic Guide

## Quick Start

### Step 1: Run Network Diagnostic Test

**PowerShell (Run as Administrator):**
```powershell
cd backend
.\network-test.ps1
```

This will test:
- ✅ DNS resolution
- ✅ Ping connectivity
- ✅ Port 5432 (PostgreSQL direct)
- ✅ Port 6543 (Connection pooler)
- ✅ Port 443 (HTTPS/REST API)
- ✅ Windows Firewall status
- ✅ VPN connections
- ✅ Proxy settings

### Step 2: Test Supabase REST API

```bash
cd backend
node test-supabase-api.js
```

This tests if your network can reach Supabase at all (via HTTPS).

### Step 3: Add Firewall Rule (If Needed)

**PowerShell (Run as Administrator):**
```powershell
cd backend
.\add-firewall-rule.ps1
```

## Understanding the Results

### Scenario 1: Port 5432 BLOCKED, Port 443 WORKS

**Meaning:** Your network can reach Supabase, but PostgreSQL port is blocked.

**Solution:**
1. Use connection pooler (port 6543) - Update `.env`:
   ```env
   DATABASE_URL="postgresql://postgres.ywufxezickfiaejbvgwl:wR8C8hhmRfYje2Aa@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
   ```

2. Add firewall exception for port 5432:
   ```powershell
   .\add-firewall-rule.ps1
   ```

### Scenario 2: ALL Ports BLOCKED

**Meaning:** Your network/firewall is blocking all Supabase connections.

**Solutions:**
1. **Temporarily disable Windows Firewall:**
   - Windows Settings → Firewall → Turn off (test only)
   - Try `npm run dev`
   - If works, turn firewall back on and add exception

2. **Check Antivirus:**
   - Temporarily disable antivirus
   - Try connection again
   - If works, add exception in antivirus

3. **Try Mobile Hotspot:**
   - Connect to phone hotspot
   - Test connection
   - If works → Your main network is blocking

4. **Check VPN:**
   - Disconnect VPN
   - Try connection again

### Scenario 3: Port 5432 BLOCKED, Port 6543 WORKS

**Meaning:** Your network allows pooler but not direct connection.

**Solution:** Use pooler connection string (see Scenario 1).

## Manual Firewall Configuration

### Windows Firewall (GUI Method)

1. **Open Windows Defender Firewall:**
   - Press `Windows Key + R`
   - Type: `firewall.cpl`
   - Press Enter

2. **Click "Advanced Settings"**

3. **Create Outbound Rule:**
   - Click "Outbound Rules" → "New Rule"
   - Select "Port" → Next
   - Select "TCP" → Specific local ports: `5432, 6543`
   - Select "Allow the connection" → Next
   - Check all profiles (Domain, Private, Public) → Next
   - Name: "Supabase PostgreSQL" → Finish

### PowerShell Method (Recommended)

```powershell
# Run as Administrator
.\add-firewall-rule.ps1
```

## Testing After Fix

1. **Test connection:**
   ```bash
   node test-connection.js
   ```

2. **Start backend:**
   ```bash
   npm run dev
   ```

3. **Expected output:**
   ```
   ✅ Database connected successfully
   🚀 Server running on http://localhost:3000
   ```

## Common Issues

### Issue: "Access Denied" when running PowerShell script

**Solution:** Right-click PowerShell → "Run as Administrator"

### Issue: Antivirus blocking connection

**Common Antivirus:**
- Avast
- AVG
- Norton
- McAfee
- Kaspersky
- Bitdefender

**Solution:**
1. Open antivirus settings
2. Find "Firewall" or "Network Protection"
3. Add exception for:
   - Port 5432
   - Port 6543
   - `db.ywufxezickfiaejbvgwl.supabase.co`
   - `aws-0-ap-southeast-1.pooler.supabase.com`

### Issue: Company/School Network

**If on restricted network:**
- Contact IT department
- Request firewall exception for:
  - `*.supabase.co` (port 5432, 6543)
  - Or use mobile hotspot for development

### Issue: VPN Interfering

**Solution:**
1. Disconnect VPN
2. Test connection
3. If works, configure VPN to allow database connections
4. Or use split tunneling

## Alternative Solutions

### Option 1: Use Connection Pooler

If port 5432 is blocked, use pooler (port 6543):

```env
DATABASE_URL="postgresql://postgres.ywufxezickfiaejbvgwl:wR8C8hhmRfYje2Aa@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
```

### Option 2: Use Supabase REST API

If PostgreSQL ports are completely blocked, use Supabase JS client:

```bash
npm install @supabase/supabase-js
```

Then use Supabase client instead of Prisma for some operations.

### Option 3: Use Mobile Hotspot

For development, use mobile hotspot to bypass network restrictions.

## Getting Help

If none of these solutions work:

1. **Share diagnostic output:**
   - Run `.\network-test.ps1`
   - Copy entire output
   - Share with support

2. **Check Supabase Status:**
   - https://status.supabase.com
   - Verify service is operational

3. **Verify Credentials:**
   - Go to Supabase Dashboard
   - Settings → Database
   - Verify password is correct
   - Reset if needed

## Files Created

- `network-test.ps1` - Comprehensive network diagnostic
- `test-supabase-api.js` - Test HTTPS connectivity
- `add-firewall-rule.ps1` - Add firewall exceptions
- `test-connection.js` - Test database connection

