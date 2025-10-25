# Refresh Token Testing Guide

## Quick Testing Steps

### Prerequisites

1. Backend API running on `http://localhost:5000`
2. Frontend client running on `http://localhost:3000`
3. Database migration applied (`RefreshTokens` table created)

---

## Test 1: Login Creates Refresh Token

### Steps

1. **Open browser DevTools** (F12) → Go to Application/Storage → Cookies
2. **Login to the application**
3. **Check Cookies tab** - Should see `refreshToken` cookie:
   - Name: `refreshToken`
   - HttpOnly: ✓ Yes
   - Secure: ✓ Yes
   - SameSite: None
   - Expires: ~30 days from now

4. **Check localStorage** - Should see `auth_token`:
   - Key: `auth_token`
   - Value: JWT token (eyJhbGc...)

5. **Check database**:
```sql
SELECT * FROM "RefreshTokens" 
WHERE "IsRevoked" = false 
ORDER BY "CreatedAt" DESC LIMIT 1;
```

**Expected**:
- One new refresh token record
- `IsRevoked` = false
- `ExpiresAt` = ~30 days from now

---

## Test 2: Automatic Token Refresh

### Option A: Test with Modified Expiry (Quick Test)

1. **Temporarily change token expiry** in `appsettings.json`:
```json
"JwtSettings": {
  "ExpiryMinutes": 1,  // Changed from 60 to 1
  "RefreshTokenExpiryDays": 30
}
```

2. **Restart backend API**

3. **Login to application**

4. **Wait 2 minutes** (let access token expire)

5. **Click on any menu** (Assets, Employees, etc.)

6. **Watch Network tab** in DevTools:
   - First request to `/api/Assets` → Returns 401
   - Automatic call to `/api/Auth/refresh` → Returns 200 with new token
   - Retry of `/api/Assets` → Returns 200 with data

7. **Check Cookies** - `refreshToken` should be updated (new value)

8. **Check database**:
```sql
SELECT * FROM "RefreshTokens" 
WHERE "UserId" = 'your-user-id'
ORDER BY "CreatedAt" DESC;
```

**Expected**:
- Two refresh token records
- Older one: `IsRevoked` = true
- Newer one: `IsRevoked` = false

9. **Don't forget to change expiry back to 60 minutes!**

### Option B: Test with Browser DevTools (Advanced)

1. **Login to application**

2. **Open DevTools** → Application → localStorage

3. **Copy the `auth_token` value**

4. **Go to** https://jwt.io

5. **Paste the token** and modify the `exp` (expiration) claim to a past time

6. **Copy the modified token** and replace `auth_token` in localStorage

7. **Make any API request** (click on Assets, etc.)

8. **Watch Network tab** - should see automatic refresh flow

---

## Test 3: Logout Revokes Token

### Steps

1. **Login to application**

2. **Note the refresh token** from cookies (copy the value)

3. **Check database** - token should be active:
```sql
SELECT * FROM "RefreshTokens" 
WHERE "Token" = 'your-token-value';
```

4. **Click Logout**

5. **Check cookies** - `refreshToken` should be gone

6. **Check localStorage** - `auth_token` should be gone

7. **Check database** - token should be revoked:
```sql
SELECT * FROM "RefreshTokens" 
WHERE "Token" = 'your-token-value';
```

**Expected**:
- `IsRevoked` = true
- `RevokedAt` = timestamp of logout

---

## Test 4: Expired Refresh Token Redirects to Login

### Steps

1. **Login to application**

2. **Open database** and manually expire the refresh token:
```sql
UPDATE "RefreshTokens"
SET "ExpiresAt" = NOW() - INTERVAL '1 day'
WHERE "UserId" = 'your-user-id'
  AND "IsRevoked" = false;
```

3. **In browser**, modify `auth_token` in localStorage to trigger 401:
   - Go to Application → localStorage
   - Edit `auth_token` - add some random characters to invalidate it

4. **Click on any menu** (Assets, Employees, etc.)

5. **Observe behavior**:
   - API request returns 401
   - Automatic refresh attempt
   - Refresh fails (token expired)
   - **User redirected to login page**

---

## Test 5: Multiple Simultaneous 401s

### Steps

1. **Login with 1-minute expiry** (see Test 2, Option A)

2. **Wait for token to expire**

3. **Quickly click multiple menu items** (Assets, then Employees, then SIM Cards)

4. **Watch Network tab**:
   - Multiple 401 responses
   - **Only ONE call** to `/api/Auth/refresh`
   - All requests retry after refresh succeeds

**Expected**: 
- `isRefreshing` flag prevents multiple simultaneous refreshes
- All requests succeed after single refresh

---

## Test 6: Refresh Token Sliding Expiration

### Steps

1. **Login to application**

2. **Check initial expiry**:
```sql
SELECT "ExpiresAt" FROM "RefreshTokens" 
WHERE "UserId" = 'your-user-id' AND "IsRevoked" = false;
```
Note the expiry time (should be 30 days from now)

3. **Wait a few minutes**

4. **Make the access token expire** (use Test 2, Option B)

5. **Trigger token refresh** by clicking on any menu

6. **Check new expiry**:
```sql
SELECT "ExpiresAt" FROM "RefreshTokens" 
WHERE "UserId" = 'your-user-id' AND "IsRevoked" = false
ORDER BY "CreatedAt" DESC LIMIT 1;
```

**Expected**: New expiry is 30 days from the refresh time (not original login time)

This proves sliding expiration is working.

---

## Test 7: Revoke All User Tokens

### Steps

1. **Login from multiple browsers/devices** (or just login, logout, login again multiple times)

2. **Check database** - should have multiple refresh tokens:
```sql
SELECT COUNT(*) FROM "RefreshTokens" 
WHERE "UserId" = 'your-user-id';
```

3. **Revoke all tokens**:
```sql
UPDATE "RefreshTokens"
SET "IsRevoked" = true, "RevokedAt" = NOW()
WHERE "UserId" = 'your-user-id' AND "IsRevoked" = false;
```

4. **In browser**, try to make any request

5. **Observe**: User should be immediately logged out and redirected to login

---

## Common Issues & Solutions

### Issue: "Blocked by CORS policy"

**Solution**:
- Check `AllowedOrigins` in `appsettings.json` includes your frontend URL
- Verify `.AllowCredentials()` is in CORS policy
- Restart backend after changes

### Issue: Refresh token cookie not being set

**Solution**:
- Check Network tab → Response Headers for `Set-Cookie`
- Verify browser allows third-party cookies
- Check cookie domain matches API domain
- For localhost testing, both frontend and backend should be `localhost`

### Issue: Token refresh happens but original request doesn't retry

**Solution**:
- Check browser console for errors
- Verify access token is updated in localStorage after refresh
- Check Network tab - should see retry of original request

### Issue: User keeps getting logged out

**Solution**:
- Check refresh token is being sent (Request Headers → Cookie)
- Verify refresh token exists in database and is not revoked
- Check refresh token expiry date
- Verify user account is active

---

## Automated Test Script

You can also test the refresh flow programmatically:

```javascript
// Run in browser console
async function testRefreshFlow() {
  // 1. Login
  const loginRes = await fetch('http://localhost:5000/api/Auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'password123'
    })
  });
  
  const loginData = await loginRes.json();
  console.log('Login success:', loginData);
  localStorage.setItem('auth_token', loginData.token);
  
  // 2. Make authenticated request
  const assetsRes = await fetch('http://localhost:5000/api/Assets', {
    headers: { 'Authorization': `Bearer ${loginData.token}` },
    credentials: 'include'
  });
  console.log('Assets request:', assetsRes.status);
  
  // 3. Test refresh
  const refreshRes = await fetch('http://localhost:5000/api/Auth/refresh', {
    method: 'POST',
    credentials: 'include'
  });
  
  const refreshData = await refreshRes.json();
  console.log('Refresh success:', refreshData);
  
  // 4. Logout
  await fetch('http://localhost:5000/api/Auth/logout', {
    method: 'POST',
    credentials: 'include'
  });
  console.log('Logout complete');
}

testRefreshFlow();
```

---

## Success Criteria

All tests should pass:
- ✅ Login creates refresh token in database and cookie
- ✅ Access token expires after configured time
- ✅ 401 triggers automatic token refresh
- ✅ Original request retries after refresh
- ✅ Refresh token has sliding expiration
- ✅ Logout revokes token and clears cookie
- ✅ Multiple concurrent 401s handled gracefully
- ✅ Expired/invalid refresh token redirects to login

---

## Cleanup After Testing

```sql
-- Delete test refresh tokens
DELETE FROM "RefreshTokens" WHERE "UserId" IN (
  SELECT "Id" FROM "AspNetUsers" WHERE "Email" LIKE '%test%'
);

-- Or delete all expired/revoked tokens
DELETE FROM "RefreshTokens" 
WHERE "IsRevoked" = true OR "ExpiresAt" < NOW();
```

---

## Production Checklist

Before deploying to production:

- [ ] Change `ExpiryMinutes` back to 60 (if changed for testing)
- [ ] Verify CORS `AllowedOrigins` includes production domain
- [ ] Ensure HTTPS is enabled (Secure cookie flag)
- [ ] Test with production-like environment
- [ ] Set up automated cleanup of expired tokens
- [ ] Monitor refresh token usage in production
- [ ] Set up alerts for unusual refresh patterns

---

**Status**: Ready for Testing  
**Recommended Test Duration**: 30 minutes  
**Required**: Backend + Frontend running

