# MongoDB Setup Guide for Zero Trust Access Platform

## Quick Start with MongoDB Atlas (Recommended)

### Step 1: Create MongoDB Atlas Account
1. Go to: https://www.mongodb.com/cloud/atlas
2. Click "Try Free"
3. Create an account with your email
4. Verify your email

### Step 2: Create a Free Cluster
1. Click "Create a new cluster"
2. Select "Free Tier" (M0)
3. Choose your cloud provider (AWS, Google Cloud, or Azure)
4. Select a region closest to you
5. Click "Create"
6. Wait for cluster to deploy (usually 1-3 minutes)

### Step 3: Set Up Network Access
1. In the left sidebar, go to **Network Access**
2. Click **Add IP Address**
3. Select **Allow access from anywhere** (for development)
4. Click **Confirm**

### Step 4: Create Database User
1. In the left sidebar, go to **Database Access**
2. Click **Add New Database User**
3. Choose **Password** authentication
4. Create username: `zerotrust` (or any name)
5. Create password: (strong password - copy it!)
6. Set permissions to **Built-in Role > Read and write to any database**
7. Click **Add User**

### Step 5: Get Connection String
1. Go to **Clusters** in the left sidebar
2. Click **Connect** button on your cluster
3. Select **Drivers** option
4. Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/zero-trust-db`)
5. Replace `<username>` and `<password>` with your database user credentials
6. Paste it in `.env.local` as `MONGODB_URI`

### Example:
```
MONGODB_URI=mongodb+srv://zerotrust:MySecurePassword123@cluster0.mongodb.net/zero-trust-db
```

---

## Setup with Local MongoDB (Alternative)

### Windows
1. Download MongoDB Community: https://www.mongodb.com/try/download/community
2. Run the installer (.msi file)
3. Select all default options
4. MongoDB will start automatically

### Mac
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Linux (Ubuntu)
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

### Connection String (Local):
```
MONGODB_URI=mongodb://localhost:27017/zero-trust-db
```

---

## Update .env.local

```bash
# Replace YOUR_CONNECTION_STRING with actual connection
MONGODB_URI=YOUR_CONNECTION_STRING
NODE_ENV=production
```

---

## Rebuild and Run

```bash
# Install dependencies
pnpm install

# Build for production
pnpm build

# Start server
pnpm start
```

Your app will now use MongoDB instead of in-memory storage!

---

## Verify MongoDB Connection

Once the server is running, check the logs for:
```
✓ MongoDB connected
```

---

## What Gets Stored in MongoDB?

✅ **Access Requests** - All user access requests  
✅ **Audit Logs** - Complete audit trail  
✅ **ML Results** - Risk classification results  
✅ **Workflows** - Workflow executions  

---

## Database Schema

### Collections:
- `accessrequests` - User access requests
- `auditlogs` - Audit trail for compliance
- `mlresults` - ML classifications
- `workflows` - Workflow executions

---

## Troubleshooting

### Connection Refused
- Check MONGODB_URI is correct
- Verify MongoDB server is running
- Check Atlas network access settings

### Authentication Failed
- Verify username and password in connection string
- Make sure @ and special characters are URL encoded

### Still Getting In-Memory Data
- Clear `.next` folder and rebuild
- Restart the server
- Check logs for MongoDB connection status

---

## For Deployment

When deploying to your server, make sure to:
1. Set MONGODB_URI as environment variable
2. Use MongoDB Atlas (easiest for remote servers)
3. Update network access rules if using local MongoDB

---

**MongoDB is now integrated! Your data persists across server restarts.** ✨
