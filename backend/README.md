# Prop Firm Monitoring System - Backend

This is the backend monitoring system for the prop trading firm challenge platform. It provides real-time MT5 account monitoring, rule violation detection, email notifications, certificate generation, and affiliate program management.

## Features

- Real-time MT5/MT4 account monitoring via MetaAPI
- Sophisticated rule validation (drawdown, consistency, trading days)
- Email notification system with HTML templates
- PDF certificate generation for passed challenges
- Leaderboard and ranking system
- Complete affiliate program with tracking and payouts
- Copy trading detection
- RESTful API for frontend integration

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the values in `.env` with your credentials

3. Test connections:
```bash
npm test
```

4. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Accounts
- `GET /api/accounts` - Get all accounts
- `GET /api/accounts/:id` - Get account by ID
- `POST /api/accounts` - Create new account
- `PUT /api/accounts/:id` - Update account
- `POST /api/accounts/:id/start-monitoring` - Start monitoring
- `POST /api/accounts/:id/stop-monitoring` - Stop monitoring
- `GET /api/accounts/:id/metrics` - Get account metrics
- `GET /api/accounts/:id/violations` - Get rule violations

### Leaderboard
- `GET /api/leaderboard` - Get leaderboard (query: period, limit)
- `GET /api/leaderboard/stats` - Get overall statistics

### Affiliates
- `POST /api/affiliates/create` - Create affiliate account
- `POST /api/affiliates/track-referral` - Track referral
- `GET /api/affiliates/stats/:user_id` - Get affiliate statistics
- `GET /api/affiliates/payouts/:user_id` - Get payout history
- `POST /api/affiliates/request-payout` - Request payout
- `GET /api/affiliates/validate-code/:code` - Validate affiliate code

### Certificates
- `GET /api/certificates/:account_id` - Download certificate
- `POST /api/certificates/generate/:account_id` - Generate certificate

### Notifications
- `GET /api/notifications` - Get notifications (query: user_id)
- `POST /api/notifications` - Create notification
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/mark-all-read/:user_id` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

## Monitoring System

The monitoring system runs every 10 seconds and checks:

1. **Balance & Equity**: Real-time account metrics
2. **Daily Drawdown**: Tracks daily loss percentage
3. **Maximum Drawdown**: Tracks total drawdown from peak
4. **Profit Target**: Monitors progress toward profit goals
5. **Trading Days**: Counts active trading days
6. **Consistency Score**: Calculates trading consistency (0-100)
7. **Rule Violations**: Automatically detects and handles violations

## Email Notifications

The system sends automated emails for:

- Welcome email on signup
- Challenge started with credentials
- Rule violations (warnings and critical)
- Challenge passed congratulations
- Daily progress reports

## Environment Variables

Required variables:

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `METAAPI_TOKEN` - MetaAPI authentication token
- `SMTP_HOST` - Email server host
- `SMTP_PORT` - Email server port
- `SMTP_USER` - Email username
- `SMTP_PASS` - Email password
- `PORT` - Server port (default: 5000)
- `FRONTEND_URL` - Frontend application URL
- `JWT_SECRET` - JWT signing secret

## Database Schema

The system uses the following tables:

- `mt5_accounts` - MT5 account information
- `account_metrics` - Real-time trading metrics
- `rule_violations` - Detected violations
- `notifications` - User notifications
- `certificates` - Generated certificates
- `affiliates` - Affiliate accounts
- `referrals` - Referral tracking
- `commissions` - Commission records
- `payouts` - Payout requests

## Security

- All API endpoints should be protected with authentication
- Rate limiting is enabled (100 requests per 15 minutes)
- RLS (Row Level Security) is enabled on all database tables
- JWT tokens used for authentication
- CORS configured for frontend domain

## Development

The backend is built with:

- Node.js + Express
- Supabase for database
- MetaAPI for MT5 integration
- Nodemailer for emails
- PDFKit for certificate generation

## Production Deployment

1. Set `NODE_ENV=production` in environment
2. Use a process manager like PM2
3. Set up SSL/TLS certificates
4. Configure proper CORS origins
5. Enable all security headers
6. Set up monitoring and logging
7. Regular database backups

## Support

For issues or questions, contact support or refer to the documentation.
