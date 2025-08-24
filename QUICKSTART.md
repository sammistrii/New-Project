# 🚀 Quick Start Guide

Get the Eco-Points System up and running in minutes!

## Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Docker & Docker Compose** - [Download here](https://docs.docker.com/get-docker/)
- **Git** - [Download here](https://git-scm.com/)

## 🏃‍♂️ Quick Setup (5 minutes)

### 1. Clone and Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd eco-points-system

# Run the automated setup script
chmod +x scripts/dev-setup.sh
./scripts/dev-setup.sh
```

### 2. Start the Application
```bash
# Start the backend server
npm run dev
```

### 3. Test the System
```bash
# In a new terminal, test the API
node test-api.js
```

## 🐳 Manual Docker Setup

If you prefer manual setup:

```bash
# Start database and Redis
docker-compose up -d postgres redis

# Wait for services to be ready
sleep 10

# Install dependencies
npm install

# Start the app
npm run dev
```

## 🌐 Access Points

Once running, you can access:

- **API Server**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health
- **Database Admin**: http://localhost:8080
- **Redis Manager**: http://localhost:8081

## 📱 Test the API

### 1. Health Check
```bash
curl http://localhost:3000/api/health
```

### 2. Register a User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "name": "Test User"
  }'
```

### 3. Create a Video Submission
```bash
# First get your access token from registration
curl -X POST http://localhost:3000/api/submissions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "s3_key": "test-video.mp4",
    "gps_lat": 40.7829,
    "gps_lng": -73.9654,
    "recorded_at": "2024-01-15T10:00:00Z",
    "duration_s": 15
  }'
```

## 🗄️ Database Schema

The system automatically creates these tables:

- `users` - User accounts and roles
- `user_wallets` - Points and cash balances  
- `bin_locations` - Geographic bin locations
- `video_submissions` - Video uploads and metadata
- `submission_events` - Audit trail
- `cashout_requests` - Cash-out requests
- `payout_transactions` - Payment processing

## 🔧 Configuration

Edit `.env` file to configure:

- Database credentials
- JWT secrets
- AWS S3 settings
- Stripe payment keys
- Email/SMS settings
- Scoring thresholds

## 🧪 Development Workflow

1. **Start services**: `docker-compose up -d`
2. **Run app**: `npm run dev`
3. **Make changes** to code
4. **Test endpoints** with `test-api.js`
5. **Check logs** in `logs/` directory
6. **Stop services**: `docker-compose down`

## 🐛 Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Find what's using the port
lsof -i :3000
# Kill the process or change port in .env
```

**Database connection failed:**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres
# Restart if needed
docker-compose restart postgres
```

**Redis connection failed:**
```bash
# Check Redis status
docker-compose ps redis
# Restart if needed
docker-compose restart redis
```

### Logs

Check logs for detailed error information:
```bash
# Application logs
tail -f logs/combined.log

# Error logs
tail -f logs/error.log

# Docker logs
docker-compose logs app
```

## 📚 Next Steps

1. **Review the README.md** for comprehensive documentation
2. **Explore the API endpoints** in the routes directory
3. **Customize the scoring system** in environment variables
4. **Add your own bin locations** to the database
5. **Implement the frontend** using Next.js/React
6. **Set up production deployment** with proper security

## 🆘 Need Help?

- Check the logs in the `logs/` directory
- Review the error handling in `src/middleware/errorHandler.js`
- Verify your `.env` configuration
- Ensure all Docker services are running: `docker-compose ps`

## 🎯 Success Indicators

You'll know everything is working when:

✅ Health check returns `"status": "healthy"`  
✅ User registration creates account and wallet  
✅ Video submission validates GPS and creates record  
✅ Database shows new records in Adminer  
✅ Redis shows active connections in Redis Commander  

Happy coding! 🚀