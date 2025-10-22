# FluxFunded - Complete Prop Trading Platform

**Trade Without Limits. Get Funded Instantly.**

A production-ready prop trading evaluation platform with automatic breach detection, built-in email system, user authentication, and complete dashboard functionality.

## ✨ Features Implemented

### Core Platform
- Beautiful 3D cyberpunk-themed landing page
- 6 pricing tiers from $5K to $200K
- Comprehensive trading rules section
- FAQ system with expandable questions
- Success stories and testimonials
- Legal pages (Terms & Privacy)

### Backend Systems
- **Database**: Complete 13-table schema on Supabase
- **Authentication**: JWT-based auth with bcrypt password hashing
- **Email System**: Built-in email templates (no 3rd party required)
- **Automatic Breach Detection**: Real-time rule monitoring service
- **User Dashboard**: Full-featured trader dashboard
- **API Services**: Registration, login, challenges, trades, payouts

### Security
- Row-level security (RLS) on all database tables
- Password hashing with bcrypt
- JWT token-based authentication
- Input validation and sanitization
- Secure environment variable handling

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env

# 3. Add your Supabase credentials to .env
# VITE_SUPABASE_URL=your-url
# VITE_SUPABASE_ANON_KEY=your-key

# 4. Run development server
npm run dev
```

Visit http://localhost:5173

## 📊 Database Schema

13 tables implemented on Supabase:
1. users - User accounts
2. challenges - Trading evaluations
3. orders - Trade history
4. daily_stats - Daily performance tracking
5. payments - Payment records
6. payouts - Payout requests
7. notifications - User alerts
8. support_tickets - Support system
9. ticket_messages - Support conversations
10. certificates - Achievement certificates
11. warning_log - Rule warning tracking
12. email_log - Email delivery logs
13. platform_settings - System configuration

All tables have RLS enabled with proper policies.

## 🎯 Key Features

### Automatic Breach Detection

The monitoring service automatically checks:
- Maximum drawdown violations (6% for evaluations, 8% for funded)
- Daily loss limit violations (3%)
- Lot size violations
- Prohibited trading activities

When breached:
1. Account terminated automatically
2. Email notification sent
3. Dashboard updated real-time
4. Notification created

### Email Templates

6 pre-built templates:
- welcome
- challengePurchase
- accountBreached
- ruleWarning
- phase1Complete
- phase2Complete

### User Dashboard

- Overview stats (challenges, profit, accounts)
- Real-time challenge progress
- Rule compliance indicators
- Profit/loss tracking
- Notifications feed

## 🛠️ Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router
- Supabase (PostgreSQL)
- JWT + bcrypt
- Lucide React icons

## 📁 Project Structure

```
src/
├── components/       # UI components
├── pages/           # Route pages
├── lib/             # Core utilities
├── services/        # Business logic
└── App.tsx          # Router
```

## 🔐 Environment Variables

Create `.env` file:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_JWT_SECRET=your-secret-min-32-chars
```

## 📋 Trading Rules

### Phase 1
- Profit Target: 8%
- Max Drawdown: 6%
- Daily Loss: 3%
- Min Days: 5

### Phase 2 (FREE)
- Profit Target: 5%
- Max Drawdown: 6%
- Daily Loss: 3%
- Min Days: 5

### Funded
- Profit Target: None
- Max Drawdown: 8%
- Profit Split: 80-90%

## 💰 Pricing

| Size     | Fee  | Split |
|----------|------|-------|
| $5K      | $49  | 80%   |
| $10K     | $79  | 80%   |
| $25K     | $129 | 85%   |
| $50K     | $199 | 85%   |
| $100K    | $349 | 90%   |
| $200K    | $599 | 90%   |

## 🚢 Deployment

### Frontend (Vercel)
1. Connect GitHub repo
2. Add environment variables
3. Deploy automatically

### Database (Supabase)
- Already migrated
- RLS policies active
- Ready for production

## ✅ Testing

Test these workflows:
- User registration
- Login
- Dashboard access
- Challenge data display
- Rule monitoring (automatic)
- Email logging

## 🔮 Future Enhancements

**Phase 2:**
- Stripe payment integration
- Real SMTP email sending
- MT4/MT5 API connection
- Payout processing
- KYC verification

**Phase 3:**
- Admin panel
- Analytics dashboard
- Mobile app
- Copy trading
- Multi-language

## 📝 License

All rights reserved - FluxFunded 2024

---

**Built with ❤️ for traders worldwide**
