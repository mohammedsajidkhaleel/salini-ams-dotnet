# Refresh Token Implementation

## Overview

The Salini AMS system now includes a secure refresh token implementation that provides seamless user authentication with automatic token renewal. This feature ensures users stay logged in for extended periods while maintaining security through short-lived access tokens.

## Features

### ✅ Security Features
- **HttpOnly Cookies**: Refresh tokens stored in secure HttpOnly cookies (not accessible via JavaScript)
- **Token Rotation**: New refresh token issued on each refresh, old one revoked
- **Database Storage**: Refresh tokens stored in database for revocation capability
- **Sliding Expiration**: Token expiry extends with each use
- **HTTPS Only**: Secure cookie flag ensures transmission over HTTPS only
- **SameSite Protection**: CSRF protection with SameSite=None for CORS

### ✅ User Experience Features
- **Automatic Renewal**: Access tokens automatically refreshed when expired
- **Seamless Experience**: Users don't see interruptions during token refresh
- **Extended Sessions**: Stay logged in for 30 days with activity
- **Graceful Logout**: Proper token cleanup and revocation

### ✅ Technical Features
- **Retry Logic**: Failed requests automatically retry after token refresh
- **Concurrent Request Handling**: Prevents multiple simultaneous refresh attempts
- **Revocation Support**: Tokens can be revoked for security (logout, password change)
- **Audit Trail**: All token operations logged in database

## Architecture

### Token Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                         Login Flow                              │
└─────────────────────────────────────────────────────────────────┘

User Login
    ↓
POST /api/Auth/login
    ↓
Validate Credentials
    ↓
Generate Access Token (JWT, 1 hour expiry)
    ↓
Generate Refresh Token (Random, 30 days expiry)
    ↓
Save Refresh Token to Database
    ↓
Set Refresh Token as HttpOnly Cookie
    ↓
Return Access Token in Response Body
    ↓
Client stores Access Token in localStorage


┌─────────────────────────────────────────────────────────────────┐
│                      Token Refresh Flow                         │
└─────────────────────────────────────────────────────────────────┘

API Request with Expired Access Token
    ↓
Receive 401 Unauthorized
    ↓
Client detects 401 (not login/refresh endpoint)
    ↓
POST /api/Auth/refresh (with refresh token cookie)
    ↓
Validate Refresh Token from Database
    ↓
Check: Not Revoked? Not Expired? User Active?
    ↓
Generate New Access Token (1 hour)
    ↓
Generate New Refresh Token (30 days - sliding)
    ↓
Revoke Old Refresh Token
    ↓
Save New Refresh Token to Database
    ↓
Set New Refresh Token as HttpOnly Cookie
    ↓
Return New Access Token
    ↓
Client Updates Access Token in localStorage
    ↓
Client Retries Original Request
    ↓
Success!
```

## Implementation Details

### Backend Components

#### 1. RefreshToken Entity

**File**: `backend/salini.api.Domain/Entities/RefreshToken.cs`

```csharp
public class RefreshToken : BaseEntity
{
    public string Token { get; set; }          // Unique refresh token
    public string UserId { get; set; }         // User who owns this token
    public DateTime ExpiresAt { get; set; }    // When token expires
    public bool IsRevoked { get; set; }        // Is token revoked?
    public DateTime? RevokedAt { get; set; }   // When was it revoked?
    public string? ReplacedByToken { get; set; } // New token (for rotation)
    
    public virtual ApplicationUser User { get; set; }
}
```

**Database Indexes**:
- Unique index on `Token` (fast lookup)
- Index on `UserId` (find user's tokens)
- Index on `ExpiresAt` (cleanup expired tokens)
- Composite index on `UserId, IsRevoked` (active tokens)

#### 2. Token Service

**File**: `backend/salini.api.Infrastructure/Services/TokenService.cs`

**Key Methods**:
- `GenerateRefreshToken()` - Creates 64-byte cryptographically secure random token
- `SaveRefreshTokenAsync()` - Saves token to database with expiry
- `ValidateRefreshTokenAsync()` - Validates token and returns user
- `RevokeRefreshTokenAsync()` - Marks token as revoked
- `RevokeUserTokensAsync()` - Revokes all tokens for a user

#### 3. Auth Controller Updates

**File**: `backend/salini.api.API/Controllers/AuthController.cs`

**Login Endpoint (`POST /api/Auth/login`)**:
- Generates JWT access token (1 hour expiry)
- Generates refresh token
- Saves refresh token to database
- Sets refresh token as HttpOnly cookie
- Returns access token in response body

**Refresh Endpoint (`POST /api/Auth/refresh`) - NEW**:
- Reads refresh token from HttpOnly cookie
- Validates token from database
- Generates new access token
- Generates new refresh token (sliding expiration)
- Revokes old refresh token
- Sets new refresh token cookie
- Returns new access token

**Logout Endpoint (`POST /api/Auth/logout`) - UPDATED**:
- Reads refresh token from cookie
- Revokes token in database
- Deletes refresh token cookie
- Signs out user

### Frontend Components

#### 1. API Client Updates

**File**: `client/lib/apiClient.ts`

**Key Features**:
- All requests include `credentials: 'include'` for cookie transmission
- Automatic token refresh on 401 responses
- Request retry after successful refresh
- Prevention of multiple simultaneous refresh calls
- Graceful fallback to login page if refresh fails

**Flow**:
```typescript
API Request → 401 Response → 
  Not login/refresh? → 
    Refresh in progress? Wait : Start Refresh →
      Refresh Success? →
        Yes: Retry Original Request
        No: Clear Auth & Redirect to Login
```

#### 2. Auth Service Updates

**File**: `client/lib/authService.ts`

The auth service works seamlessly with the API client:
- Login method already uses apiClient.post (includes credentials)
- Logout method calls API (revokes refresh token)
- Refresh method calls API (gets new tokens)

## Configuration

### Backend Configuration

**File**: `backend/salini.api.API/appsettings.json`

```json
{
  "JwtSettings": {
    "Secret": "YourSecretKey",
    "Issuer": "SaliniAMS.API",
    "Audience": "SaliniAMS.Client",
    "ExpiryMinutes": 60,
    "RefreshTokenExpiryDays": 30
  },
  "Cors": {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-production-domain.com"
    ]
  }
}
```

**File**: `backend/salini.api.API/Program.cs`

CORS must allow credentials:
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Required for cookies
    });
});
```

### Frontend Configuration

**File**: `client/.env.local`

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
```

**Important**: API URL must match the backend domain for cookies to work.

## API Endpoints

### 1. Login

```http
POST /api/Auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "role": "User",
    "permissions": [...],
    "projectIds": [...]
  }
}
```

**Cookie Set**:
```
Set-Cookie: refreshToken=base64-token; HttpOnly; Secure; SameSite=None; Expires=...
```

### 2. Refresh Token

```http
POST /api/Auth/refresh
Cookie: refreshToken=base64-token
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Cookie Set**:
```
Set-Cookie: refreshToken=new-base64-token; HttpOnly; Secure; SameSite=None; Expires=...
```

### 3. Logout

```http
POST /api/Auth/logout
Cookie: refreshToken=base64-token
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response**:
```json
{
  "message": "Logged out successfully"
}
```

**Cookie Cleared**:
```
Set-Cookie: refreshToken=; Expires=Thu, 01 Jan 1970 00:00:00 GMT
```

## Token Expiration Times

| Token Type | Expiration | Storage | Purpose |
|------------|-----------|---------|---------|
| **Access Token** | 1 hour | localStorage | API authentication |
| **Refresh Token** | 30 days (sliding) | HttpOnly Cookie | Token renewal |

**Sliding Expiration**: Each time you refresh, the refresh token gets a new 30-day expiry.

## Security Considerations

### ✅ What We Did Right

1. **HttpOnly Cookies**: Prevents XSS attacks from stealing refresh tokens
2. **Token Rotation**: Old refresh tokens revoked when new ones issued
3. **Database Storage**: Enables immediate revocation (logout, security breach)
4. **Short Access Tokens**: Limits damage if access token is stolen
5. **Secure Transmission**: Cookies sent only over HTTPS in production
6. **CSRF Protection**: SameSite cookie attribute
7. **User Validation**: Checks if user is still active before refresh

### ⚠️ Security Best Practices

1. **Use HTTPS in Production**: Always use HTTPS for cookie transmission
2. **Rotate Secrets**: Regularly rotate JWT signing secrets
3. **Monitor Failed Attempts**: Track failed refresh attempts for abuse
4. **Token Cleanup**: Periodically clean expired tokens from database
5. **IP Validation**: Consider validating IP address for refresh tokens
6. **Device Tracking**: Consider device fingerprinting for additional security

## Error Handling

### Client-Side Handling

```typescript
try {
  const response = await apiClient.get('/api/Assets');
  // Handle success
} catch (error) {
  const apiError = error as ApiError;
  
  if (apiError.statusCode === 401) {
    // User has been redirected to login
    // Refresh token was invalid or expired
  } else {
    // Handle other errors
  }
}
```

### Automatic Retry Flow

1. **Request with expired access token** → 401 Response
2. **Client detects 401** → Checks if refresh endpoint
3. **Not refresh endpoint** → Calls `/api/Auth/refresh`
4. **Refresh succeeds** → Updates access token
5. **Retries original request** → Success with new token
6. **Refresh fails** → Redirects to login page

## Testing

### Test Scenario 1: Login and Token Creation

```bash
# Login
curl -X POST http://localhost:5000/api/Auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  -c cookies.txt

# Check cookies file - should contain refreshToken
cat cookies.txt
```

### Test Scenario 2: Token Refresh

```bash
# Wait for access token to expire or use expired token
# Make request with refresh token cookie
curl -X POST http://localhost:5000/api/Auth/refresh \
  -b cookies.txt \
  -c cookies.txt

# Should return new access token and set new refresh token cookie
```

### Test Scenario 3: Automatic Refresh in Browser

1. Login to the application
2. Wait 1+ hour (or modify ExpiryMinutes to 1 minute for testing)
3. Make any API request (view assets, employees, etc.)
4. Watch Network tab - should see:
   - Original request returns 401
   - `/api/Auth/refresh` called automatically
   - Original request retried with new token
5. Request succeeds seamlessly

### Test Scenario 4: Logout

```bash
# Logout
curl -X POST http://localhost:5000/api/Auth/logout \
  -b cookies.txt

# Check database - refresh token should be revoked
# Check response - cookie should be cleared
```

## Database Maintenance

### View Active Refresh Tokens

```sql
SELECT 
    rt."Id",
    rt."UserId",
    u."Email",
    rt."CreatedAt",
    rt."ExpiresAt",
    rt."IsRevoked"
FROM "RefreshTokens" rt
JOIN "AspNetUsers" u ON rt."UserId" = u."Id"
WHERE rt."IsRevoked" = false
  AND rt."ExpiresAt" > NOW()
ORDER BY rt."CreatedAt" DESC;
```

### Clean Up Expired Tokens

```sql
-- Delete expired and revoked tokens older than 90 days
DELETE FROM "RefreshTokens"
WHERE ("IsRevoked" = true OR "ExpiresAt" < NOW())
  AND "CreatedAt" < NOW() - INTERVAL '90 days';
```

### Revoke User Tokens (Security)

```sql
-- Revoke all tokens for a specific user
UPDATE "RefreshTokens"
SET "IsRevoked" = true,
    "RevokedAt" = NOW()
WHERE "UserId" = 'user-id-here'
  AND "IsRevoked" = false;
```

## Troubleshooting

### Issue: Cookies Not Being Set

**Symptoms**: Refresh token cookie not appearing in browser

**Solutions**:
1. Check CORS configuration includes `.AllowCredentials()`
2. Verify `credentials: 'include'` in fetch requests
3. Check cookie domain matches API domain
4. Ensure HTTPS in production (Secure flag)
5. Check browser console for CORS errors

### Issue: Token Refresh Fails

**Symptoms**: 401 errors keep occurring, user redirected to login

**Solutions**:
1. Check refresh token exists in database
2. Verify token is not expired
3. Check token is not revoked
4. Verify user account is still active
5. Check cookie is being sent in request headers

### Issue: CORS Errors

**Symptoms**: "Blocked by CORS policy" errors

**Solutions**:
1. Add frontend URL to `Cors:AllowedOrigins` in appsettings.json
2. Ensure `.AllowCredentials()` is set
3. Cannot use wildcard `*` with credentials - specify exact origins
4. Check `Access-Control-Allow-Credentials: true` in response headers

## Production Deployment

### Environment-Specific Settings

**Development** (`appsettings.Development.json`):
```json
{
  "JwtSettings": {
    "ExpiryMinutes": 60
  },
  "Cors": {
    "AllowedOrigins": ["http://localhost:3000"]
  }
}
```

**Production** (`appsettings.Production.json`):
```json
{
  "JwtSettings": {
    "ExpiryMinutes": 60,
    "RefreshTokenExpiryDays": 30
  },
  "Cors": {
    "AllowedOrigins": ["https://your-domain.com"]
  }
}
```

### Cookie Configuration for Production

```csharp
var cookieOptions = new CookieOptions
{
    HttpOnly = true,
    Secure = true,        // HTTPS only
    SameSite = SameSiteMode.Strict, // Use Strict in production if same domain
    Expires = expiresAt,
    Path = "/",
    IsEssential = true
};
```

## Migration from Old System

If users have active sessions in the old system:

1. **Clear existing sessions** - Users will need to re-login once
2. **Update frontend** - Deploy new frontend with refresh token support
3. **Update backend** - Deploy backend with refresh token endpoints
4. **Database migration** - Run `dotnet ef database update`
5. **Verify CORS** - Ensure credentials are allowed

## Monitoring & Analytics

### Key Metrics to Track

1. **Active Refresh Tokens**: Number of currently active tokens
2. **Token Refresh Rate**: How often tokens are refreshed
3. **Failed Refresh Attempts**: Potential security issues
4. **Average Token Lifetime**: How long users stay logged in
5. **Revoked Tokens**: Track logout and security events

### Query for Metrics

```sql
-- Active refresh tokens
SELECT COUNT(*) 
FROM "RefreshTokens" 
WHERE "IsRevoked" = false AND "ExpiresAt" > NOW();

-- Refresh tokens created today
SELECT COUNT(*) 
FROM "RefreshTokens" 
WHERE "CreatedAt" >= CURRENT_DATE;

-- Revoked tokens (logouts) today
SELECT COUNT(*) 
FROM "RefreshTokens" 
WHERE "RevokedAt" >= CURRENT_DATE;
```

## Benefits

| Benefit | Description |
|---------|-------------|
| **Security** | Short-lived access tokens limit exposure if stolen |
| **User Experience** | Users stay logged in for weeks without interruption |
| **Control** | Can revoke tokens immediately for security |
| **Compliance** | Meets security requirements for token management |
| **Scalability** | Database storage enables multi-server deployments |
| **Audit Trail** | Track all token operations for security analysis |

## Summary

The refresh token implementation provides enterprise-grade security with excellent user experience. Access tokens are short-lived (1 hour) to limit security exposure, while refresh tokens (30 days sliding) keep users logged in during active use. HttpOnly cookies prevent XSS attacks, database storage enables immediate revocation, and automatic retry logic ensures seamless operation.

### Key Achievements

✅ **Automatic token refresh** - No user interruption
✅ **Secure cookie storage** - XSS protection
✅ **Token rotation** - Enhanced security
✅ **Database revocation** - Immediate control
✅ **Sliding expiration** - Extended sessions for active users
✅ **Request retry logic** - Seamless experience
✅ **Comprehensive audit trail** - All tokens tracked

**Status**: ✅ COMPLETE  
**Security Level**: Production Ready  
**User Experience**: Seamless  
**Tested**: Yes

