# Zero Trust Access Platform - Backend API Documentation

## Overview
Complete REST API for Zero Trust Access Control with MongoDB persistence.

---

## API Endpoints

### 1. Access Requests
**POST** `/api/access-request`
- Create a new access request
- **Body:**
```json
{
  "userId": "john_doe",
  "resourceId": "database_prod",
  "action": "READ",
  "context": {
    "ipAddress": "192.168.1.1",
    "deviceId": "device-123",
    "location": "New York",
    "userAgent": "Mozilla/5.0..."
  }
}
```
- **Response:** Access request with risk assessment and blockchain audit entry

**GET** `/api/access-request`
- Get all access requests and blockchain status
- **Response:** List of requests with pagination

---

### 2. Blockchain & Audit Logs
**GET** `/api/blockchain`
- Get blockchain status
- **Query params:**
  - `action=status` - Blockchain status only
  - `action=chain` - Full blockchain
  - `action=audit-log` - Audit log entries

**POST** `/api/blockchain`
- Mine current block (combine pending entries)
- **Body:**
```json
{
  "action": "mine"
}
```

---

### 3. ML Risk Classification
**POST** `/api/ml/classify-risk`
- Classify request as high/medium/low risk using ML models
- **Body:**
```json
{
  "userId": "john_doe",
  "resourceId": "database_prod",
  "action": "READ",
  "context": {
    "ipAddress": "192.168.1.1",
    "location": "New York"
  }
}
```
- **Response:** ML risk scores, behavioral anomalies, federated learning results

**GET** `/api/ml/classify-risk`
- Get recent ML classification results
- **Query params:**
  - `limit=50` - Number of results

---

### 4. Workflows
**GET** `/api/workflows`
- Get all available workflows
- **Query params:**
  - `id=workflow-id` - Get specific workflow

**POST** `/api/workflows`
- Create or execute workflow
- **Body (Create):**
```json
{
  "name": "approval-workflow",
  "steps": ["validate", "check-risk", "approve"]
}
```
- **Body (Execute):**
```json
{
  "action": "execute",
  "workflowId": "workflow-123",
  "input": {
    "requestId": "request-456"
  }
}
```

---

### 5. Analytics & Statistics
**GET** `/api/statistics`
- Get comprehensive analytics
- **Query params:**
  - `stat=access-requests` - Access request stats
  - `stat=audit-logs` - Audit log statistics
  - `stat=high-risk-users` - High-risk user detection
  - `stat=ml-insights` - ML model insights
  - `timeRange=day|week|month` - Time range for analysis
  - `threshold=70` - Risk score threshold

**Example Responses:**

Access Requests Stats:
```json
{
  "success": true,
  "data": {
    "total": 156,
    "approved": 142,
    "denied": 8,
    "approvalRate": 91
  }
}
```

Audit Logs Stats:
```json
{
  "success": true,
  "data": {
    "totalEvents": 248,
    "timeRange": "week",
    "byDecision": {
      "ALLOW": 220,
      "DENY": 20,
      "REQUIRE_MFA": 8
    },
    "avgRiskScore": 35.42
  }
}
```

High-Risk Users:
```json
{
  "success": true,
  "data": [
    {
      "userId": "user_456",
      "count": 15,
      "avgRisk": 78.5,
      "maxRisk": 92.3
    }
  ]
}
```

ML Insights:
```json
{
  "success": true,
  "data": {
    "totalAnalyzed": 500,
    "averageScores": {
      "mlRisk": 35.2,
      "behavioral": 42.1,
      "federated": 38.9
    }
  }
}
```

---

### 6. User Profile & Audit History
**GET** `/api/users/{userId}`
- Get user profile and audit history
- **Response:**
```json
{
  "success": true,
  "userId": "john_doe",
  "stats": {
    "totalRequests": 42,
    "approvedRequests": 38,
    "deniedRequests": 2,
    "pendingRequests": 2,
    "approvalRate": 90,
    "avgRiskScore": 32.5
  },
  "recentRequests": [...],
  "auditHistory": [...]
}
```

---

### 7. Resource Monitoring
**GET** `/api/resources`
- Get all resources and their access stats
- **Query params:**
  - `resourceId=db_prod` - Get specific resource stats

**All Resources Response:**
```json
{
  "success": true,
  "resources": [
    {
      "resourceId": "database_prod",
      "totalRequests": 156,
      "approved": 142,
      "denied": 8,
      "avgRiskScore": 32.1
    }
  ]
}
```

**Specific Resource Response:**
```json
{
  "success": true,
  "resourceId": "database_prod",
  "stats": {
    "totalRequests": 156,
    "approved": 142,
    "denied": 8,
    "pending": 6,
    "approvalRate": 91
  },
  "recentRequests": [...],
  "accessByUser": [
    {
      "userId": "john_doe",
      "count": 25
    }
  ]
}
```

---

## Database Schema

### AccessRequest
```typescript
{
  _id: ObjectId
  userId: string (required)
  resourceId: string (required)
  action: 'READ' | 'WRITE' | 'DELETE' | 'ADMIN'
  timestamp: number
  status: 'PENDING' | 'APPROVED' | 'DENIED'
  context: {
    ipAddress: string
    deviceId: string
    location: string
    userAgent: string
  }
  riskScore: number
  decision: 'ALLOW' | 'DENY' | 'REQUIRE_MFA'
  createdAt: Date
  updatedAt: Date
}
```

### AuditLog
```typescript
{
  _id: ObjectId
  timestamp: number (required)
  userId: string (required)
  action: string (required)
  resourceId: string
  decision: 'ALLOW' | 'DENY' | 'REQUIRE_MFA'
  riskScore: number
  blockHash: string (blockchain reference)
  createdAt: Date
  updatedAt: Date
}
```

### MLResult
```typescript
{
  _id: ObjectId
  userId: string (required)
  resourceId: string
  mlRiskScore: number (required)
  behavioralScore: number
  federatedScore: number
  timestamp: number (required)
  features: object
  createdAt: Date
  updatedAt: Date
}
```

### Workflow
```typescript
{
  _id: ObjectId
  workflowId: string (required)
  accessRequestId: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  steps: Array<{
    stepId: string
    name: string
    status: string
    timestamp: number
  }>
  result: object
  timestamp: number (required)
  createdAt: Date
  updatedAt: Date
}
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "status": 400
}
```

Common error codes:
- `400` - Validation error
- `404` - Resource not found
- `500` - Internal server error
- `503` - Database connection failed

---

## Authentication & Security

Currently using:
- ✅ Request validation with Zod
- ✅ MongoDB connection pooling
- ✅ Error handling & logging
- ✅ Input sanitization

Future enhancements:
- [ ] JWT token authentication
- [ ] API rate limiting
- [ ] Role-based access control (RBAC)
- [ ] API key management

---

## Testing API Endpoints

### Using curl
```bash
# Create access request
curl -X POST http://localhost:3000/api/access-request \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user",
    "resourceId": "db_prod",
    "action": "READ"
  }'

# Get statistics
curl http://localhost:3000/api/statistics?stat=access-requests

# Get user profile
curl http://localhost:3000/api/users/test_user
```

### Using Postman
1. Import this API specification
2. Set base URL: `http://localhost:3000`
3. Test each endpoint

---

## Performance Tips

1. **Pagination** - Use limit/skip for large datasets
2. **Indexing** - Ensure MongoDB indexes on userId, resourceId
3. **Caching** - Consider Redis for frequently accessed stats
4. **Connection Pooling** - MongoDB connection reused automatically

---

## Deployment Checklist

- [ ] MongoDB Atlas cluster configured
- [ ] MONGODB_URI set in environment variables
- [ ] NODE_ENV set to 'production'
- [ ] All endpoints tested
- [ ] Error logging in place
- [ ] Rate limiting configured (recommended)
- [ ] CORS configured for your domain

---

## Support

For issues or questions:
1. Check MongoDB connection in `.env.local`
2. Review server logs for error messages
3. Verify request format matches schema
4. Test with provided curl examples

---

**API is production-ready!** 🚀
