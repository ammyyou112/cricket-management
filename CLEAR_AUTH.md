# How to Clear Persisted Auth Data

If you're being redirected to player routes when trying to access admin routes, it's because your browser has persisted the 'player' role from a previous session.

## Quick Fix Options:

### Option 1: Clear Browser Storage (Recommended)
1. Open Browser DevTools (F12)
2. Go to Application/Storage tab
3. Find "Local Storage" → your domain
4. Delete the key: `auth-storage`
5. Refresh the page

### Option 2: Use Role Switcher
1. Look for the floating button in bottom-right corner (Role Switcher)
2. Click it and select "Switch to Admin"
3. This will update your role and save it

### Option 3: Clear via Console
Open browser console and run:
```javascript
localStorage.removeItem('auth-storage');
localStorage.setItem('mock_user_role', 'admin');
location.reload();
```

## Default Behavior

The app now defaults to 'admin' role on first load, but if you previously logged in as 'player', that role is persisted. The RoleSwitcher component allows you to change roles easily.

