# Video-Based Eco-Points System

A comprehensive system for managing eco-points through video submissions, verification, and cash-out processing.

## 🎯 MVP Scope

### Tourist Role
- Sign up/login (email, social, OTP)
- Profile + wallet balance
- Upload video (with auto metadata: GPS, timestamp, duration, device hash)
- See submission status (Queued → Auto‑Verified → Human‑Review → Approved/Rejected)
- Cash‑out request (balance → payout method)
- Notifications (push/email/SMS) for decisions & payouts

### Moderator Admin Role
- Review queue with video player, map, metadata, auto‑checks
- Approve/Reject with reason; override auto‑decision
- Fraud tools: duplicate‑video hash match, GPS radius check vs bin locations, rate limits, user flags
- Audit log of actions

### Payment / Finance Role
- Trigger payouts from approved cash‑out requests
- View payout statuses (Initiated → Success/Failed/Needs‑Info)
- Reconcile via gateway webhooks

### City Council Role
- Read‑only dashboards & exports: participation, verified submissions by area/time, payout totals, cost per kg/item

## 🏗️ System Architecture

- **Frontend**: Next.js (React), TypeScript, Tailwind
- **Backend API**: Node.js (Express), TypeScript
- **DB**: PostgreSQL (row‑level security + audit)
- **Object storage**: S3 (videos, thumbnails)
- **Processing**: Worker queue (BullMQ) for video processing
- **Caching/Queues**: Redis
- **Payments**: Stripe/PayPal Payouts + webhook handler
- **Maps**: OpenStreetMap/Mapbox for bin locations & radius checks
- **Auth**: JWT + Refresh tokens
- **Observability**: Winston logging + structured logs

## 🗄️ Data Model

Core tables:
- `users` - User accounts and roles
- `user_wallets` - Points and cash balances
- `bin_locations` - Geographic bin locations
- `video_submissions` - Video uploads and metadata
- `submission_events` - Audit trail
- `cashout_requests` - Cash-out requests
- `payout_transactions` - Payment processing
- `reports_cache` - Cached reports

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- AWS S3 account
- Stripe account (for payments)

### Environment Setup
```bash
cp .env.example .env
# Edit .env with your configuration
```

### Installation
```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

### API Endpoints

#### Public (auth required)
- `POST /auth/:provider/callback` - Authentication
- `GET /me` - Profile & wallet
- `POST /submissions` - Create submission
- `GET /submissions` - List submissions
- `POST /cashouts` - Create cash-out request
- `GET /cashouts` - List cash-outs

#### Admin
- `GET /admin/submissions` - Review queue
- `POST /admin/submissions/:id/approve` - Approve submission
- `POST /admin/submissions/:id/reject` - Reject submission
- `GET /admin/cashouts` - Cash-out management
- `GET /admin/reports/summary` - Reports

#### Integrations
- `POST /webhooks/payments` - Payment status updates
- `POST /webhooks/storage` - Upload completion

## 🔒 Security & Compliance

- Signed URLs for uploads
- Virus scanning on ingest
- PII minimization
- Role‑based access control
- Audit logs for all admin actions
- GDPR compliance for location & camera use
- Webhook signature verification

## 📊 Rules & Scoring

- **Geo rule**: Within bin radius of known locations
- **Time rule**: Recorded within last N hours of upload
- **Length rule**: Minimum video duration (≥10s)
- **Duplicate detection**: Perceptual hash matching
- **Rate limiting**: Max submissions per day per user
- **Auto-scoring**: Weighted sum for approval decisions

## 📅 Delivery Plan (8-10 weeks)

- **Week 1-2**: Auth, DB, S3 upload, basic UI skeleton
- **Week 3-4**: Submission pipeline, user dashboard
- **Week 5**: Moderation queue & decisions, points crediting
- **Week 6**: Cash-out flow, gateway integration, webhooks
- **Week 7**: Dashboards & exports, notifications
- **Week 8**: Hardening, rate limits, audits, E2E tests
- **Stretch**: ML/liveness, mobile PWA, KYC for high-value payouts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details