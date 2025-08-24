# Eco-Points System

A comprehensive Video-Based Eco-Points System for sustainable waste management, built with modern web technologies.

## 🚀 Overview

The Eco-Points System incentivizes environmentally friendly actions by allowing users to upload videos of their sustainable activities, earn points through AI-powered verification, and cash out for real money. The system includes automated fraud detection, human moderation, and comprehensive analytics.

## ✨ Features

### For Tourists
- **Video Upload**: Record and submit eco-friendly actions with GPS metadata
- **Auto-Verification**: AI-powered content analysis and scoring
- **Points System**: Earn eco-points for verified submissions
- **Cash-Out**: Convert points to real money through secure payment gateways
- **Real-time Notifications**: Get updates on submission status and payouts

### For Moderators
- **Review Queue**: Efficient moderation interface with video player and metadata
- **Fraud Detection**: Advanced tools for duplicate detection and GPS validation
- **Decision Management**: Approve/reject submissions with detailed reasoning
- **Audit Trail**: Complete logging of all moderation actions

### For City Council
- **Analytics Dashboard**: Comprehensive reports on participation and impact
- **Geographic Insights**: Heat maps and location-based analytics
- **Financial Tracking**: Monitor payout totals and cost per action
- **Export Capabilities**: CSV downloads and scheduled reports

## 🏗️ Architecture

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **State Management**: Zustand + React Query
- **UI Components**: Headless UI + Heroicons
- **Maps**: Leaflet for interactive location features

### Backend
- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **Database**: PostgreSQL with PostGIS extensions
- **ORM**: TypeORM with migrations
- **Authentication**: JWT + Passport.js
- **File Storage**: S3-compatible (MinIO for development)
- **Queue System**: BullMQ with Redis
- **Video Processing**: FFmpeg for transcoding and thumbnails

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Caching**: Redis for sessions and queues
- **Monitoring**: Sentry + structured logging
- **Payments**: Stripe/PayPal integration
- **Security**: Rate limiting, CORS, input validation

## 📊 Data Model

### Core Entities
- **Users**: Tourists, moderators, and council members
- **User Wallets**: Points and cash balance management
- **Video Submissions**: Content with metadata and verification status
- **Bin Locations**: Geographic data for validation
- **Cash-out Requests**: Point-to-cash conversion
- **Payout Transactions**: Payment processing records
- **Submission Events**: Comprehensive audit trail

### Key Relationships
- Users have one wallet and many submissions
- Submissions are linked to bin locations and users
- Cash-out requests create payout transactions
- All actions are logged in submission events

## 🔄 Workflows

### 1. Submission Workflow
1. Tourist uploads video with GPS metadata
2. System processes video (transcode, thumbnail, hash)
3. AI performs automated verification checks
4. High-scoring submissions auto-approve
5. Low-scoring submissions queue for human review
6. Approved submissions credit points to user wallet

### 2. Cash-Out Workflow
1. User requests cash-out with points amount
2. System locks points and calculates cash value
3. Payment gateway processes payout
4. Webhook updates transaction status
5. Success: points deducted, cash transferred
6. Failure: points unlocked, user notified

### 3. Moderation Workflow
1. Queue sorted by risk score and age
2. Moderator reviews with full context
3. One-click approve/reject with reasoning
4. Escalation system for complex cases
5. User management (bans, suspensions)
6. Complete audit logging

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ and npm 9+
- Docker and Docker Compose
- PostgreSQL 15+ (if running locally)
- Redis 7+ (if running locally)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd eco-points-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd frontend && npm install
   cd ../backend && npm install
   cd ..
   ```

3. **Start the development environment**
   ```bash
   npm run docker:up
   npm run dev
   ```

4. **Access the applications**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Docs: http://localhost:3001/api/docs
   - MinIO Console: http://localhost:9001 (minioadmin/minioadmin123)

### Environment Configuration

Create `.env.local` files in both `frontend/` and `backend/` directories:

```bash
# Backend (.env.local)
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=eco_user
DB_PASSWORD=eco_password
DB_NAME=eco_points

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# S3/MinIO
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin123
S3_BUCKET=eco-points-videos
S3_BASE_URL=http://localhost:9000/eco-points-videos

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 📁 Project Structure

```
eco-points-system/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utility functions
│   │   └── types/           # TypeScript type definitions
│   ├── public/              # Static assets
│   └── package.json
├── backend/                  # NestJS backend application
│   ├── src/
│   │   ├── modules/         # Feature modules
│   │   ├── common/          # Shared utilities
│   │   ├── database/        # Database configuration
│   │   └── main.ts          # Application entry point
│   └── package.json
├── docker-compose.yml        # Development infrastructure
├── package.json              # Root package.json with workspaces
└── README.md
```

## 🚀 Available Scripts

### Root Level
- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build both applications for production
- `npm run docker:up` - Start development infrastructure
- `npm run docker:down` - Stop development infrastructure

### Backend
- `npm run start:dev` - Start backend in development mode
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data
- `npm run test` - Run backend tests

### Frontend
- `npm run dev` - Start frontend development server
- `npm run build` - Build frontend for production
- `npm run type-check` - Run TypeScript type checking

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm run test              # Unit tests
npm run test:e2e          # End-to-end tests
npm run test:cov          # Coverage report
```

### Frontend Testing
```bash
cd frontend
npm run test              # Unit tests
npm run type-check        # TypeScript validation
```

## 📈 Deployment

### Production Environment
1. Set `NODE_ENV=production`
2. Configure production database and Redis
3. Set up S3 or compatible storage
4. Configure payment gateway credentials
5. Set secure JWT secrets
6. Enable SSL/TLS encryption

### Docker Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🔒 Security Features

- **Authentication**: JWT with refresh tokens
- **Authorization**: Role-based access control
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: Configurable request throttling
- **CORS**: Cross-origin resource sharing protection
- **Audit Logging**: Complete action tracking
- **Data Encryption**: Sensitive data encryption at rest
- **Webhook Security**: Signature verification for integrations

## 📚 API Documentation

The API documentation is automatically generated using Swagger and available at:
- Development: http://localhost:3001/api/docs
- Production: https://your-domain.com/api/docs

### Key Endpoints
- `POST /api/auth/:provider/callback` - Authentication
- `GET /api/me` - User profile and wallet
- `POST /api/submissions` - Create video submission
- `GET /api/admin/submissions` - Moderation queue
- `POST /api/cashouts` - Request cash-out
- `GET /api/admin/reports` - Analytics and reporting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Use conventional commit messages
- Update documentation as needed
- Follow the established code style

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the API docs and this README
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Discussions**: Join community discussions in GitHub Discussions
- **Email**: Contact the development team at dev@ecopoints.com

## 🗺️ Roadmap

### Phase 1 (Weeks 1-2)
- [x] Project setup and architecture
- [x] Database design and entities
- [x] Basic authentication system
- [x] Frontend landing page

### Phase 2 (Weeks 3-4)
- [ ] Video upload and processing pipeline
- [ ] GPS validation and bin location system
- [ ] User dashboard and submission management
- [ ] Basic moderation interface

### Phase 3 (Weeks 5-6)
- [ ] Points system and wallet management
- [ ] Cash-out flow and payment integration
- [ ] Advanced fraud detection
- [ ] Notification system

### Phase 4 (Weeks 7-8)
- [ ] Analytics dashboard and reporting
- [ ] Performance optimization
- [ ] Security hardening
- [ ] End-to-end testing

### Future Enhancements
- [ ] Mobile PWA application
- [ ] Machine learning improvements
- [ ] Social features and gamification
- [ ] Multi-language support
- [ ] Advanced KYC integration

---

**Built with ❤️ for a sustainable future**