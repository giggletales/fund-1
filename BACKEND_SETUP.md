# Backend Monitoring System Setup Guide

This guide will help you set up and integrate the complete backend monitoring system with your existing prop firm platform.

## Overview

The backend system provides:
- Real-time MT5/MT4 account monitoring via MetaAPI
- Automated rule violation detection
- Email notification system
- Certificate generation for passed challenges
- Leaderboard and ranking system
- Complete affiliate program with commission tracking
- Copy trading detection

## Prerequisites

1. Node.js 18.x or higher
2. MetaAPI account and API token
3. SMTP email server credentials (Gmail recommended)
4. Supabase database (already configured)

## Installation Steps

### 1. Install Backend Dependencies

Navigate to the backend directory and install packages:

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

The `.env` file in the backend directory is already configured. You need to update these values:

**IMPORTANT: Update these settings:**

```env
# Email Configuration (REQUIRED)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com          # UPDATE THIS
SMTP_PASS=your-gmail-app-password       # UPDATE THIS
COMPANY_NAME=YourPropFirmName            # UPDATE THIS

# Admin Email
ADMIN_EMAIL=admin@yourpropfirm.com      # UPDATE THIS
```

**Note:** The MetaAPI token is already configured in the `.env` file.

### 3. Gmail SMTP Setup (For Email Notifications)

If using Gmail for email notifications:

1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Go to Security > 2-Step Verification > App Passwords
4. Generate an app password for "Mail"
5. Use this app password in the `SMTP_PASS` variable

### 4. Test Connections

Test the database and MetaAPI connections:

```bash
npm test
```

You should see:
```
✅ Supabase connection successful
✅ MetaAPI connection successful
```

### 5. Start the Backend Server

For development:
```bash
npm run dev
```

For production:
```bash
npm start
```

The server will start on port 5000 (configurable via PORT env variable).

## Database Migration

The database migration has been applied automatically. It creates these tables:

- `account_metrics` - Real-time trading metrics
- `rule_violations` - Detected rule violations
- `notifications` - User notifications
- `certificates` - Generated certificates
- `affiliates` - Affiliate program
- `referrals` - Referral tracking
- `commissions` - Commission records
- `payouts` - Payout requests

## Integration with Frontend

### Update API Configuration

Create a new file: `src/lib/api.ts`

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = {
  // Accounts
  getAccounts: (userId?: string) =>
    fetch(`${API_URL}/accounts${userId ? `?user_id=${userId}` : ''}`).then(r => r.json()),

  getAccount: (id: string) =>
    fetch(`${API_URL}/accounts/${id}`).then(r => r.json()),

  startMonitoring: (id: string) =>
    fetch(`${API_URL}/accounts/${id}/start-monitoring`, { method: 'POST' }).then(r => r.json()),

  stopMonitoring: (id: string) =>
    fetch(`${API_URL}/accounts/${id}/stop-monitoring`, { method: 'POST' }).then(r => r.json()),

  getMetrics: (id: string, limit?: number) =>
    fetch(`${API_URL}/accounts/${id}/metrics${limit ? `?limit=${limit}` : ''}`).then(r => r.json()),

  // Leaderboard
  getLeaderboard: (period = 'all', limit = 50) =>
    fetch(`${API_URL}/leaderboard?period=${period}&limit=${limit}`).then(r => r.json()),

  getLeaderboardStats: () =>
    fetch(`${API_URL}/leaderboard/stats`).then(r => r.json()),

  // Notifications
  getNotifications: (userId: string) =>
    fetch(`${API_URL}/notifications?user_id=${userId}`).then(r => r.json()),

  markNotificationRead: (id: string) =>
    fetch(`${API_URL}/notifications/${id}/read`, { method: 'PUT' }).then(r => r.json()),

  // Certificates
  getCertificate: (accountId: string) =>
    `${API_URL}/certificates/${accountId}`,

  // Affiliates
  createAffiliate: (userId: string) =>
    fetch(`${API_URL}/affiliates/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    }).then(r => r.json()),

  getAffiliateStats: (userId: string) =>
    fetch(`${API_URL}/affiliates/stats/${userId}`).then(r => r.json()),

  validateAffiliateCode: (code: string) =>
    fetch(`${API_URL}/affiliates/validate-code/${code}`).then(r => r.json())
};
```

### Add API URL to Environment

Add to your `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

## Using the Monitoring System

### 1. Starting Monitoring for an Account

```typescript
import { api } from './lib/api';

// When a user purchases a challenge and receives MT5 credentials
const startAccountMonitoring = async (accountId: string) => {
  const response = await api.startMonitoring(accountId);
  console.log('Monitoring started:', response);
};
```

### 2. Displaying Real-Time Metrics

```typescript
const AccountMetrics = ({ accountId }: { accountId: string }) => {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      const response = await api.getMetrics(accountId, 1);
      if (response.success && response.data.length > 0) {
        setMetrics(response.data[0]);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [accountId]);

  if (!metrics) return <div>Loading...</div>;

  return (
    <div>
      <h3>Account Metrics</h3>
      <p>Balance: ${metrics.balance}</p>
      <p>Daily Drawdown: {metrics.daily_drawdown.toFixed(2)}%</p>
      <p>Max Drawdown: {metrics.max_drawdown.toFixed(2)}%</p>
      <p>Trading Days: {metrics.trading_days}</p>
      <p>Consistency Score: {metrics.consistency_score.toFixed(1)}/100</p>
    </div>
  );
};
```

### 3. Displaying Leaderboard

```typescript
const Leaderboard = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const response = await api.getLeaderboard('all', 50);
      if (response.success) {
        setData(response.data);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <table>
      <thead>
        <tr>
          <th>Rank</th>
          <th>Trader</th>
          <th>Profit</th>
          <th>Badge</th>
        </tr>
      </thead>
      <tbody>
        {data.map(entry => (
          <tr key={entry.id}>
            <td>{entry.rank}</td>
            <td>{entry.full_name || 'Anonymous'}</td>
            <td>${(entry.balance - entry.initial_balance).toLocaleString()}</td>
            <td>{entry.badge.icon} {entry.badge.name}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

### 4. Affiliate System Integration

```typescript
// Track referral on signup
const handleSignup = async (userData, affiliateCode) => {
  // Create user account first
  const user = await createUser(userData);

  // Track referral if affiliate code exists
  if (affiliateCode) {
    await api.trackReferral(affiliateCode, user.id);
  }
};

// Display affiliate dashboard
const AffiliateDashboard = ({ userId }) => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      const response = await api.getAffiliateStats(userId);
      if (response.success) {
        setStats(response.data);
      }
    };
    fetchStats();
  }, [userId]);

  return (
    <div>
      <h2>Affiliate Dashboard</h2>
      <p>Affiliate Code: {stats?.affiliate.affiliate_code}</p>
      <p>Total Referrals: {stats?.stats.total_referrals}</p>
      <p>Total Earnings: ${stats?.stats.total_earnings.toFixed(2)}</p>
      <p>Pending: ${stats?.stats.pending_earnings.toFixed(2)}</p>
    </div>
  );
};
```

## Production Deployment

### 1. Use Process Manager

Install PM2:
```bash
npm install -g pm2
```

Start the server:
```bash
cd backend
pm2 start server.js --name "propfirm-backend"
pm2 save
pm2 startup
```

### 2. Environment Configuration

Set production environment variables:
```bash
export NODE_ENV=production
export FRONTEND_URL=https://yoursite.com
```

### 3. Security Checklist

- [ ] Update JWT_SECRET to a strong random value
- [ ] Configure CORS for your production domain
- [ ] Enable SSL/TLS certificates
- [ ] Set up firewall rules
- [ ] Enable database backups
- [ ] Configure monitoring and logging
- [ ] Review and test all RLS policies

## Monitoring and Maintenance

### View Server Logs

```bash
pm2 logs propfirm-backend
```

### Monitor Server Status

```bash
pm2 status
```

### Check Health Endpoint

```bash
curl http://localhost:5000/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-10-16T...",
  "activeMonitors": 5
}
```

## Troubleshooting

### MetaAPI Connection Issues

1. Verify your MetaAPI token is valid
2. Check that accounts are deployed in MetaAPI dashboard
3. Ensure accounts are connected and synchronized

### Email Notifications Not Sending

1. Verify SMTP credentials are correct
2. Check Gmail app password is properly set
3. Review email service logs for errors

### Database Connection Issues

1. Verify Supabase URL and keys are correct
2. Check network connectivity
3. Review RLS policies for access issues

## Support

For issues or questions:
1. Check the backend logs: `pm2 logs`
2. Review the API documentation in `backend/README.md`
3. Contact your development team

## Next Steps

1. Test the monitoring system with a demo account
2. Configure email templates to match your branding
3. Set up affiliate program terms and commission rates
4. Integrate leaderboard into your homepage
5. Add real-time notifications to the dashboard
