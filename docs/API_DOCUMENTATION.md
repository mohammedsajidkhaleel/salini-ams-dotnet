# Salini AMS - API Documentation

## Overview

The Salini AMS API is a RESTful web service built with ASP.NET Core 8.0, providing comprehensive IT asset management functionality. The API follows REST principles and uses JWT Bearer tokens for authentication.

## Base URL

- **Development**: `http://localhost:5000`
- **Production**: `https://api.salini-ams.com`

## Authentication

The API uses JWT Bearer token authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Getting a Token

```http
POST /api/Auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "data": <response-data>,
  "message": "Success",
  "success": true
}
```

### Error Response
```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.6.1",
  "title": "An error occurred while processing your request.",
  "status": 400,
  "detail": "Validation error details",
  "errors": {
    "field": ["Error message"]
  }
}
```

## Pagination

List endpoints support pagination with the following query parameters:

- `pageNumber` (int): Page number (default: 1)
- `pageSize` (int): Items per page (default: 10, max: 100)

### Paginated Response
```json
{
  "items": [...],
  "totalCount": 100,
  "pageNumber": 1,
  "pageSize": 10,
  "totalPages": 10,
  "hasPreviousPage": false,
  "hasNextPage": true
}
```

## Project Filtering

Most endpoints automatically filter data based on the authenticated user's assigned projects. SuperAdmins and Admins can see all data.

## Endpoints

### Authentication

#### Login
```http
POST /api/Auth/login
```

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "data": {
    "token": "string",
    "refreshToken": "string",
    "expiresAt": "2024-01-01T00:00:00Z",
    "user": {
      "id": "string",
      "email": "string",
      "firstName": "string",
      "lastName": "string",
      "role": "string",
      "projectIds": ["string"]
    }
  }
}
```

#### Refresh Token
```http
POST /api/Auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "string"
}
```

### User Management

#### Get Users
```http
GET /api/UserManagement?pageNumber=1&pageSize=10
```

#### Get User by ID
```http
GET /api/UserManagement/{id}
```

#### Create User
```http
POST /api/UserManagement
```

**Request Body:**
```json
{
  "userName": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "password": "string",
  "role": "User|Manager|Admin|SuperAdmin",
  "isActive": true,
  "department": "string",
  "permissions": ["string"],
  "projectIds": ["string"]
}
```

#### Update User
```http
PUT /api/UserManagement/{id}
```

#### Delete User
```http
DELETE /api/UserManagement/{id}
```

#### Toggle User Status
```http
PATCH /api/UserManagement/{id}/status
```

**Request Body:**
```json
{
  "isActive": true
}
```

#### Get User Permissions
```http
GET /api/UserManagement/{id}/permissions
```

#### Get User Projects
```http
GET /api/UserManagement/{id}/projects
```

### Assets

#### Get Assets
```http
GET /api/Assets?pageNumber=1&pageSize=10&projectId={id}
```

#### Get Asset by ID
```http
GET /api/Assets/{id}
```

#### Create Asset
```http
POST /api/Assets
```

**Request Body:**
```json
{
  "itemId": "string",
  "serialNumber": "string",
  "purchaseOrderId": "string",
  "purchaseDate": "2024-01-01T00:00:00Z",
  "warrantyExpiry": "2024-01-01T00:00:00Z",
  "cost": 1000.00,
  "status": 1,
  "projectId": "string",
  "assignedEmployeeId": "string",
  "notes": "string"
}
```

#### Update Asset
```http
PUT /api/Assets/{id}
```

#### Delete Asset
```http
DELETE /api/Assets/{id}
```

#### Assign Asset
```http
POST /api/Assets/{id}/assign
```

**Request Body:**
```json
{
  "employeeId": "string",
  "notes": "string"
}
```

#### Unassign Asset
```http
POST /api/Assets/{id}/unassign
```

**Request Body:**
```json
{
  "notes": "string"
}
```

### Employees

#### Get Employees
```http
GET /api/Employees?pageNumber=1&pageSize=10&projectId={id}
```

#### Get Employee by ID
```http
GET /api/Employees/{id}
```

#### Create Employee
```http
POST /api/Employees
```

**Request Body:**
```json
{
  "employeeId": "string",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "department": "string",
  "subDepartment": "string",
  "position": "string",
  "category": "string",
  "nationality": "string",
  "company": "string",
  "projectId": "string",
  "costCenter": "string",
  "isActive": true
}
```

#### Update Employee
```http
PUT /api/Employees/{id}
```

#### Delete Employee
```http
DELETE /api/Employees/{id}
```

### Purchase Orders

#### Get Purchase Orders
```http
GET /api/PurchaseOrders?pageNumber=1&pageSize=10&projectId={id}
```

#### Get Purchase Order by ID
```http
GET /api/PurchaseOrders/{id}
```

#### Create Purchase Order
```http
POST /api/PurchaseOrders
```

**Request Body:**
```json
{
  "poNumber": "string",
  "poDate": "2024-01-01T00:00:00Z",
  "vendor": "string",
  "totalAmount": 10000.00,
  "status": 1,
  "projectId": "string",
  "requestedById": "string",
  "items": [
    {
      "itemId": "string",
      "quantity": 10,
      "unitPrice": 100.00,
      "totalPrice": 1000.00
    }
  ]
}
```

#### Update Purchase Order
```http
PUT /api/PurchaseOrders/{id}
```

#### Delete Purchase Order
```http
DELETE /api/PurchaseOrders/{id}
```

### Inventory

#### Get Inventory Summary
```http
GET /api/Inventory/Summary
```

**Response:**
```json
{
  "data": [
    {
      "itemId": "string",
      "itemName": "string",
      "category": "string",
      "totalPurchased": 100,
      "totalAllocated": 80,
      "availableCount": 20,
      "status": 1,
      "lastPurchaseDate": "2024-01-01T00:00:00Z",
      "vendor": "string",
      "projectName": "string"
    }
  ]
}
```

### SIM Cards

#### Get SIM Cards
```http
GET /api/SimCards?pageNumber=1&pageSize=10&projectId={id}
```

#### Get SIM Card by ID
```http
GET /api/SimCards/{id}
```

#### Create SIM Card
```http
POST /api/SimCards
```

**Request Body:**
```json
{
  "phoneNumber": "string",
  "iccid": "string",
  "simTypeId": "string",
  "providerId": "string",
  "planId": "string",
  "status": 1,
  "projectId": "string",
  "assignedEmployeeId": "string",
  "activationDate": "2024-01-01T00:00:00Z",
  "expiryDate": "2024-01-01T00:00:00Z"
}
```

#### Update SIM Card
```http
PUT /api/SimCards/{id}
```

#### Delete SIM Card
```http
DELETE /api/SimCards/{id}
```

### Software Licenses

#### Get Software Licenses
```http
GET /api/SoftwareLicenses?pageNumber=1&pageSize=10&projectId={id}
```

#### Get Software License by ID
```http
GET /api/SoftwareLicenses/{id}
```

#### Create Software License
```http
POST /api/SoftwareLicenses
```

**Request Body:**
```json
{
  "name": "string",
  "vendor": "string",
  "licenseKey": "string",
  "licenseType": "string",
  "totalSeats": 10,
  "assignedSeats": 5,
  "purchaseDate": "2024-01-01T00:00:00Z",
  "expiryDate": "2024-01-01T00:00:00Z",
  "cost": 1000.00,
  "status": 1,
  "projectId": "string"
}
```

#### Update Software License
```http
PUT /api/SoftwareLicenses/{id}
```

#### Delete Software License
```http
DELETE /api/SoftwareLicenses/{id}
```

### Master Data

#### Companies
```http
GET /api/Companies
POST /api/Companies
PUT /api/Companies/{id}
DELETE /api/Companies/{id}
```

#### Departments
```http
GET /api/Departments
POST /api/Departments
PUT /api/Departments/{id}
DELETE /api/Departments/{id}
```

#### Projects
```http
GET /api/Projects
POST /api/Projects
PUT /api/Projects/{id}
DELETE /api/Projects/{id}
```

#### Items
```http
GET /api/Items
POST /api/Items
PUT /api/Items/{id}
DELETE /api/Items/{id}
```

#### Bulk Master Data Creation
```http
POST /api/MasterData/bulk-create
```

**Request Body:**
```json
{
  "companies": [
    {
      "name": "string",
      "description": "string",
      "code": "string"
    }
  ],
  "departments": [
    {
      "name": "string",
      "description": "string"
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "code": "string",
      "costCenterId": "string",
      "companyId": "string",
      "nationalityId": "string"
    }
  ]
}
```

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Validation errors |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation failed |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Authenticated users**: 1000 requests per hour
- **Unauthenticated users**: 100 requests per hour

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit per hour
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Time when limit resets

## Webhooks

The API supports webhooks for real-time notifications:

### Available Events
- `user.created`
- `user.updated`
- `user.deleted`
- `asset.assigned`
- `asset.unassigned`
- `purchase_order.created`
- `purchase_order.updated`

### Webhook Payload
```json
{
  "event": "user.created",
  "timestamp": "2024-01-01T00:00:00Z",
  "data": {
    "id": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string"
  }
}
```

## SDKs and Libraries

### JavaScript/TypeScript
```bash
npm install @salini/ams-api-client
```

```typescript
import { SaliniAMSClient } from '@salini/ams-api-client';

const client = new SaliniAMSClient({
  baseUrl: 'http://localhost:5000',
  apiKey: 'your-api-key'
});

const users = await client.users.list();
```

### .NET
```bash
dotnet add package Salini.AMS.Api.Client
```

```csharp
using Salini.AMS.Api.Client;

var client = new SaliniAMSClient("http://localhost:5000", "your-api-key");
var users = await client.Users.ListAsync();
```

## Testing

### Postman Collection
A Postman collection is available for testing the API:
- Import: `docs/postman/Salini-AMS-API.postman_collection.json`
- Environment: `docs/postman/Salini-AMS-API.postman_environment.json`

### API Testing
```bash
# Test authentication
curl -X POST http://localhost:5000/api/Auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@salini.com","password":"Admin@123"}'

# Test protected endpoint
curl -X GET http://localhost:5000/api/Users \
  -H "Authorization: Bearer <your-token>"
```

## Support

For API support and questions:
- **Email**: api-support@salini.com
- **Documentation**: https://docs.salini-ams.com
- **Status Page**: https://status.salini-ams.com
