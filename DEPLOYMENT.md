# Zero Trust Access Platform - Deployment Guide

## Project Overview
A Next.js full-stack application with:
- **Frontend**: React components with Tailwind CSS
- **Backend**: Next.js API routes (Node.js)
- **Features**: Role-based access, blockchain audit logs, ML risk classification, workflow engine

---

## Prerequisites
- Node.js 18+ 
- npm, yarn, or **pnpm** (recommended)

---

## Local Development

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Run Development Server
```bash
pnpm dev
```
Access at `http://localhost:3000`

---

## Production Deployment

### 1. Build the Project
```bash
pnpm build
```
This creates an optimized `.next` folder with compiled code.

### 2. Start Production Server
```bash
pnpm start
```
Runs on port 3000 by default.

### 3. Custom Port (Optional)
```bash
PORT=8080 pnpm start
```

---

## Deploy to Your Server

### Option A: Deploy via Node.js (Recommended for Resume)

1. **Upload to Server**
   ```bash
   scp -r zero-trust-access-platform/ user@your-server:/opt/
   ```

2. **SSH into Server**
   ```bash
   ssh user@your-server
   cd /opt/zero-trust-access-platform
   ```

3. **Install & Build**
   ```bash
   pnpm install
   pnpm build
   ```

4. **Run with Process Manager (pm2)**
   ```bash
   npm install -g pm2
   pm2 start "pnpm start" --name "access-platform"
   pm2 save
   pm2 startup
   ```

5. **Setup Nginx Reverse Proxy**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
       }
   }
   ```

---

### Option B: Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
RUN pnpm build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["npm", "start"]
```

Build & Run:
```bash
docker build -t access-platform .
docker run -p 3000:3000 access-platform
```

---

## Backend API Endpoints

All endpoints are in `app/api/`:

### Access Requests
- **POST** `/api/access-request` - Create access request
- **GET** `/api/access-request` - List requests

### Blockchain
- **GET** `/api/blockchain` - Get blockchain status
- **POST** `/api/blockchain` - Add audit entry

### ML Risk Classification
- **POST** `/api/ml/classify-risk` - Classify risk level

### Workflows
- **GET** `/api/workflows` - Get available workflows
- **POST** `/api/workflows` - Execute workflow

---

## Environment Variables
Create `.env.local` in root:
```
NODE_ENV=production
# Add your variables here
```

---

## Monitoring & Logs

### With PM2
```bash
pm2 logs access-platform
pm2 status
pm2 restart access-platform
```

### Docker Logs
```bash
docker logs -f <container-id>
```

---

## Project Structure
```
├── app/
│   ├── api/          ← Backend endpoints
│   ├── page.tsx      ← Main page
│   └── layout.tsx    ← Root layout
├── components/
│   ├── ui/           ← Reusable UI components
│   └── *.tsx         ← Feature components
├── lib/
│   ├── blockchain.ts ← Blockchain implementation
│   ├── workflow.ts   ← Workflow engine
│   └── zeroTrust.ts  ← Zero Trust logic
└── public/           ← Static assets
```

---

## For Your Resume

**You can mention:**
- Full-stack Next.js web application
- Backend API design & development
- Blockchain implementation for audit logs
- ML-based risk classification
- Role-based access control (RBAC)
- Workflow automation engine
- Deployed on personal server with Node.js + Nginx

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port already in use | `lsof -i :3000` then kill, or use different port |
| Build fails | Delete `.next` folder and rebuild |
| Module not found | Run `pnpm install` again |
| Out of memory | Increase Node memory: `NODE_OPTIONS=--max-old-space-size=4096 pnpm build` |

---

## Performance Tips
- Use `pnpm` instead of npm (faster)
- Enable gzip compression in Nginx
- Use CDN for static assets
- Monitor with PM2 or Docker stats
- Cache API responses where appropriate

---

**Good luck with your deployment! 🚀**
