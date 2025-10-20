# API Configuration Guide

## 🔧 **How to Set the API URL**

The API URL is configured in the `client/lib/config.ts` file and can be set in multiple ways:

### **1. Environment Variable (Recommended)**

Create a `.env.local` file in the `client` directory:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000

# Application Environment
NEXT_PUBLIC_APP_ENV=development
```

**For Production:**
```bash
# Production API URL
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NEXT_PUBLIC_APP_ENV=production
```

### **2. Direct Configuration File**

Edit `client/lib/config.ts` and modify line 9:

```typescript
export const config = {
  // API Configuration
  api: {
    baseUrl: 'http://localhost:5000', // Change this URL
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
  },
  // ... rest of config
}
```

### **3. Environment-Specific Configuration**

#### **Development Environment**
```typescript
baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
```

#### **Production Environment**
```typescript
baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.salini-ams.com'
```

#### **Staging Environment**
```typescript
baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://staging-api.salini-ams.com'
```

## 🌍 **Environment-Specific URLs**

### **Local Development**
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### **Docker Development**
```bash
NEXT_PUBLIC_API_URL=http://backend:5000
```

### **Staging Environment**
```bash
NEXT_PUBLIC_API_URL=https://staging-api.salini-ams.com
```

### **Production Environment**
```bash
NEXT_PUBLIC_API_URL=https://api.salini-ams.com
```

## 📁 **File Structure**

```
client/
├── .env.local                 # Local environment variables (gitignored)
├── .env.development          # Development environment variables
├── .env.production           # Production environment variables
├── .env.staging              # Staging environment variables
├── lib/
│   └── config.ts             # Main configuration file
└── docs/
    └── API_CONFIGURATION_GUIDE.md
```

## 🔄 **How It Works**

1. **Environment Variable**: `NEXT_PUBLIC_API_URL` is read first
2. **Fallback**: If not set, defaults to `http://localhost:5000`
3. **API Client**: Uses the configured URL for all API calls
4. **Authentication**: JWT tokens are sent to the configured API URL

## 🚀 **Deployment Examples**

### **Vercel Deployment**
```bash
# In Vercel dashboard, set environment variables:
NEXT_PUBLIC_API_URL=https://api.salini-ams.com
NEXT_PUBLIC_APP_ENV=production
```

### **Docker Deployment**
```dockerfile
# In Dockerfile or docker-compose.yml
ENV NEXT_PUBLIC_API_URL=http://backend:5000
ENV NEXT_PUBLIC_APP_ENV=production
```

### **Azure App Service**
```bash
# In Azure portal, set application settings:
NEXT_PUBLIC_API_URL=https://salini-ams-api.azurewebsites.net
NEXT_PUBLIC_APP_ENV=production
```

## 🔍 **Verification**

### **Check Current Configuration**
```typescript
import { config } from '@/lib/config';

console.log('API Base URL:', config.api.baseUrl);
console.log('Environment:', config.app.environment);
```

### **Test API Connection**
```bash
# Test if API is accessible
curl http://localhost:5000/health
```

## ⚠️ **Important Notes**

1. **Environment Variables**: Must start with `NEXT_PUBLIC_` to be accessible in the browser
2. **HTTPS**: Use HTTPS URLs in production for security
3. **CORS**: Ensure backend API allows requests from your frontend domain
4. **Ports**: Make sure the API port (5000) is accessible
5. **Firewall**: Check firewall settings for API access

## 🛠️ **Troubleshooting**

### **API Not Accessible**
1. Check if backend API is running
2. Verify the URL is correct
3. Check CORS configuration
4. Verify firewall/network settings

### **Environment Variable Not Working**
1. Ensure variable starts with `NEXT_PUBLIC_`
2. Restart the development server
3. Check `.env.local` file location
4. Verify file syntax (no spaces around `=`)

### **CORS Errors**
1. Update backend CORS configuration
2. Add frontend domain to allowed origins
3. Check if API URL is correct

## 📝 **Example Configurations**

### **Complete .env.local File**
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000

# Application Configuration
NEXT_PUBLIC_APP_ENV=development

# Optional: Custom timeout
NEXT_PUBLIC_API_TIMEOUT=30000
```

### **Production .env.production**
```bash
# Production API Configuration
NEXT_PUBLIC_API_URL=https://api.salini-ams.com
NEXT_PUBLIC_APP_ENV=production
```

This configuration system provides flexibility for different environments while maintaining security and ease of deployment.
