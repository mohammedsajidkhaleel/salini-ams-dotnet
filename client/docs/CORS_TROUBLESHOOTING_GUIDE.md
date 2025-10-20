# CORS Troubleshooting Guide

## 🚨 **CORS Issue During Login**

If you're experiencing CORS issues during login, here are the steps to resolve them:

## 🔍 **Current CORS Configuration**

### **Backend Configuration** (`backend/salini.api.API/appsettings.json`)
```json
{
  "Cors": {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://localhost:3000"
    ]
  }
}
```

### **Backend CORS Policy** (`backend/salini.api.API/Program.cs`)
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
        policy.WithOrigins(allowedOrigins ?? new[] { "http://localhost:3000" })
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
```

## 🛠️ **Troubleshooting Steps**

### **1. Verify Frontend URL**
Make sure your frontend is running on the correct port:

```bash
# Check if frontend is running on port 3000
netstat -an | findstr :3000
```

**Expected Output:**
```
TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING
```

### **2. Check Backend CORS Logs**
Look at the backend console for CORS-related messages:

```bash
# In backend console, look for:
[INF] CORS policy execution failed.
[INF] Request origin http://localhost:3000 does not have permission to access the resource.
```

### **3. Test CORS with Browser Developer Tools**

1. Open browser Developer Tools (F12)
2. Go to Network tab
3. Try to login
4. Look for the login request
5. Check the response headers for CORS errors

### **4. Manual CORS Test**
Test CORS with a simple request:

```bash
# Test CORS preflight
curl -X OPTIONS \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  http://localhost:5000/api/Auth/login
```

## 🔧 **Common Solutions**

### **Solution 1: Update CORS Configuration**

If your frontend is running on a different port, update the CORS configuration:

**File**: `backend/salini.api.API/appsettings.json`
```json
{
  "Cors": {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://localhost:3000",
      "http://localhost:3001",
      "https://localhost:3001"
    ]
  }
}
```

### **Solution 2: Restart Backend API**

After changing CORS configuration:

```bash
# Stop the backend (Ctrl+C)
# Restart the backend
cd backend
dotnet run --project salini.api.API
```

### **Solution 3: Clear Browser Cache**

1. Open Developer Tools (F12)
2. Right-click on refresh button
3. Select "Empty Cache and Hard Reload"

### **Solution 4: Check API Client Configuration**

Verify the API client is using the correct URL:

**File**: `client/lib/config.ts`
```typescript
export const config = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
    // ... rest of config
  }
}
```

### **Solution 5: Add More Permissive CORS (Development Only)**

**⚠️ WARNING: Only for development!**

**File**: `backend/salini.api.API/Program.cs`
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        if (app.Environment.IsDevelopment())
        {
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
        else
        {
            var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
            policy.WithOrigins(allowedOrigins ?? new[] { "http://localhost:3000" })
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
    });
});
```

## 🔍 **Debugging Steps**

### **Step 1: Check Browser Console**
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for CORS error messages like:
   ```
   Access to fetch at 'http://localhost:5000/api/Auth/login' from origin 'http://localhost:3000' has been blocked by CORS policy
   ```

### **Step 2: Check Network Tab**
1. Go to Network tab in Developer Tools
2. Try to login
3. Look for the login request
4. Check if it shows as "blocked" or returns a CORS error

### **Step 3: Check Backend Logs**
Look for these messages in the backend console:
```
[INF] CORS policy execution failed.
[INF] Request origin http://localhost:3000 does not have permission to access the resource.
```

### **Step 4: Test API Directly**
Test the API endpoint directly:

```bash
# Test login endpoint
curl -X POST http://localhost:5000/api/Auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@salini.com","password":"Admin@123"}'
```

## 🚀 **Quick Fix Commands**

### **Restart Both Services**
```bash
# Terminal 1 - Backend
cd backend
dotnet run --project salini.api.API

# Terminal 2 - Frontend
cd client
npm run dev
```

### **Clear Browser Data**
1. Press Ctrl+Shift+Delete
2. Select "Cached images and files"
3. Click "Clear data"

### **Test with Different Browser**
Try accessing the application in a different browser or incognito mode.

## 📋 **CORS Checklist**

- [ ] Frontend running on `http://localhost:3000`
- [ ] Backend running on `http://localhost:5000`
- [ ] CORS configuration includes `http://localhost:3000`
- [ ] Backend restarted after CORS changes
- [ ] Browser cache cleared
- [ ] No proxy or firewall blocking requests
- [ ] API client using correct base URL

## 🔧 **Advanced CORS Configuration**

### **For Production**
```json
{
  "Cors": {
    "AllowedOrigins": [
      "https://your-frontend-domain.com",
      "https://www.your-frontend-domain.com"
    ]
  }
}
```

### **For Development with Multiple Ports**
```json
{
  "Cors": {
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "https://localhost:3000",
      "https://localhost:3001"
    ]
  }
}
```

## 📞 **Still Having Issues?**

If you're still experiencing CORS issues:

1. **Check the exact error message** in browser console
2. **Verify both services are running** on the correct ports
3. **Try the manual CORS test** with curl
4. **Check if any antivirus or firewall** is blocking the requests
5. **Try accessing the API directly** in browser: `http://localhost:5000`

The most common cause is that the frontend URL doesn't exactly match what's configured in the CORS policy.
