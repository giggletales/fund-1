# Quick Start Guide - Monitoring System

## What Was Built

A complete backend monitoring system for your prop firm with:
- Real-time MT5 account monitoring
- Automated email notifications
- Certificate generation
- Leaderboard system
- Full affiliate program

## Setup in 5 Minutes

### Step 1: Configure Email (Required)

Edit `/backend/.env` and update these lines:

```env
SMTP_USER=your-email@gmail.com          # Your Gmail address
SMTP_PASS=your-app-password             # Gmail app password
COMPANY_NAME=Your Prop Firm Name         # Your company name
ADMIN_EMAIL=admin@yourfirm.com          # Your admin email
```

**Get Gmail App Password:**
1. Go to Google Account → Security
2. Enable 2-Factor Authentication
3. Go to App Passwords
4. Create password for "Mail"
5. Copy the 16-character password

### Step 2: Install and Test

```bash
cd backend
npm install
npm test
```

You should see:
```
✅ Supabase connection successful
✅ MetaAPI connection successful
```

### Step 3: Start the Server

```bash
npm run dev
```

Server will start on http://localhost:5000

### Step 4: Verify It's Working

Open http://localhost:5000/health in your browser.

You should see:
```json
{
  "status": "ok",
  "timestamp": "2024-10-16T...",
  "activeMonitors": 0
}
```

## That's It!

The backend is now running and ready to:
- Monitor MT5 accounts in real-time
- Send email notifications
- Generate certificates
- Track affiliates
- Update leaderboards

## Next Steps

1. **Test Email**: The system will send emails automatically when accounts are created
2. **Create Test Account**: Add an MT5 account to see monitoring in action
3. **Check Logs**: Watch the console for real-time monitoring updates
4. **Integrate Frontend**: Add API calls to your React components

## Common Issues

### Emails Not Sending
- Verify Gmail app password is correct
- Check SMTP credentials in `.env`
- Ensure 2FA is enabled on Google Account

### Connection Errors
- Verify Supabase URL and keys in `.env`
- Check MetaAPI token is valid
- Ensure network connectivity

### Port Already in Use
Change the port in `.env`:
```env
PORT=5001
```

## Documentation

- **Complete Setup**: `BACKEND_SETUP.md`
- **Full Documentation**: `backend/README.md`
- **Implementation Details**: `MONITORING_SYSTEM_COMPLETE.md`

## Support

Check the health endpoint: http://localhost:5000/health

View logs in the terminal where you ran `npm run dev`

## Production Deployment

```bash
npm install -g pm2
cd backend
pm2 start server.js --name "propfirm-backend"
```

Done! Your monitoring system is live.
