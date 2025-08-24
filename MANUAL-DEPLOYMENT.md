# 🚀 Manual Deployment Guide for Render

If the Blueprint deployment doesn't work, here's how to deploy your Eco-Points System manually on Render.

## 📋 Prerequisites

- Render account (free tier available)
- GitHub repository connected
- All code pushed to main branch

## 🏗️ Step-by-Step Manual Deployment

### 1. **Create PostgreSQL Database**

1. Go to [render.com](https://render.com) dashboard
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `eco-points-db`
   - **Database**: `eco_points`
   - **User**: `eco_points_user`
   - **Plan**: Free
4. Click **"Create Database"**
5. **Copy the connection string** (you'll need this later)

### 2. **Create Redis Service**

1. Click **"New +"** → **"Redis"**
2. Configure:
   - **Name**: `eco-points-redis`
   - **Plan**: Free
3. Click **"Create Redis"**
4. **Copy the connection string**

### 3. **Deploy Backend API**

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `eco-points-backend`
   - **Environment**: Node
   - **Build Command**: `cd backend && npm install && npm run build`
   - **Start Command**: `cd backend && npm run start:prod`
   - **Plan**: Free

4. **Add Environment Variables**:
   ```bash
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=<paste_postgresql_connection_string>
   REDIS_URL=<paste_redis_connection_string>
   JWT_SECRET=<render_will_generate>
   JWT_REFRESH_SECRET=<render_will_generate>
   S3_ENDPOINT=https://eco-points-minio.onrender.com
   S3_ACCESS_KEY=minioadmin
   S3_SECRET_KEY=minioadmin123
   S3_BUCKET=eco-points
   S3_REGION=us-east-1
   S3_FORCE_PATH_STYLE=true
   FRONTEND_URL=https://eco-points-frontend.onrender.com
   ```

5. Click **"Create Web Service"**

### 4. **Deploy MinIO Storage**

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `eco-points-minio`
   - **Environment**: Docker
   - **Dockerfile Path**: `./Dockerfile.minio`
   - **Plan**: Free

4. **Add Environment Variables**:
   ```bash
   PORT=9000
   MINIO_ROOT_USER=minioadmin
   MINIO_ROOT_PASSWORD=minioadmin123
   MINIO_BUCKET=eco-points
   MINIO_CONSOLE_PORT=9001
   ```

5. Click **"Create Web Service"**

### 5. **Deploy Frontend**

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `eco-points-frontend`
   - **Environment**: Node
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Start Command**: `cd frontend && npm start`
   - **Plan**: Free

4. **Add Environment Variables**:
   ```bash
   NODE_ENV=production
   PORT=3000
   NEXT_PUBLIC_API_URL=https://eco-points-backend.onrender.com
   NEXT_PUBLIC_APP_URL=https://eco-points-frontend.onrender.com
   ```

5. Click **"Create Web Service"**

## 🔧 Post-Deployment Setup

### 1. **Initialize Database**

1. Go to your PostgreSQL service
2. Click **"Connect"** → **"External Database"**
3. Use a database client (pgAdmin, DBeaver, or psql) to connect
4. Run the SQL script from `backend/database/init.sql`

### 2. **Test Services**

1. **Backend Health**: `https://eco-points-backend.onrender.com/health`
2. **API Docs**: `https://eco-points-backend.onrender.com/api/docs`
3. **Frontend**: `https://eco-points-frontend.onrender.com`
4. **MinIO Console**: `https://eco-points-minio.onrender.com:9001`

### 3. **Configure Payment Gateways**

Add your actual payment gateway credentials in the backend service environment variables:

```bash
# International Payment Gateways
STRIPE_SECRET_KEY=sk_live_your_real_key
PAYPAL_CLIENT_ID=your_real_paypal_id
PAYPAL_CLIENT_SECRET=your_real_paypal_secret

# Indian Payment Gateways
GOOGLE_PAY_MERCHANT_ID=your_google_pay_merchant_id
PHONEPE_MERCHANT_ID=your_phonepe_merchant_id
PAYTM_MERCHANT_ID=your_paytm_merchant_id
BHIM_UPI_MERCHANT_ID=your_bhim_merchant_id
AMAZON_PAY_MERCHANT_ID=your_amazon_pay_merchant_id
WHATSAPP_PAY_MERCHANT_ID=your_whatsapp_pay_merchant_id
```

## 🚨 Troubleshooting

### **Common Issues**

1. **Build Failures**
   - Check build logs for dependency issues
   - Verify Node.js version compatibility
   - Ensure all environment variables are set

2. **Database Connection Issues**
   - Verify `DATABASE_URL` format
   - Check if database service is running
   - Ensure database initialization script ran successfully

3. **Service Dependencies**
   - Backend needs PostgreSQL and Redis
   - Frontend needs Backend API
   - MinIO needs to be accessible

### **Service Order**

Deploy services in this order:
1. **PostgreSQL** (database)
2. **Redis** (caching)
3. **MinIO** (storage)
4. **Backend** (API)
5. **Frontend** (UI)

## 🎯 **Your System Will Be Live At**

- **Frontend**: `https://eco-points-frontend.onrender.com`
- **Backend API**: `https://eco-points-backend.onrender.com`
- **API Documentation**: `https://eco-points-backend.onrender.com/api/docs`
- **MinIO Console**: `https://eco-points-minio.onrender.com:9001`

## 💡 **Pro Tips**

- **Start with free tier** to test everything
- **Monitor logs** during deployment
- **Test each service** individually
- **Use health check endpoints** to verify status

---

**🎉 Your Eco-Points System will be live and ready for Indian users with all payment methods! 🇮🇳**