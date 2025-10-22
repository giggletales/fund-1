# MT5 Manual Management System - Complete Guide

## Overview

Your Fund8r platform now has a complete MT5 manual management system that connects admin operations with user access. This system allows you to manually create MT5 demo accounts for your initial users and gives them full visibility into their trading credentials and performance.

---

## System Architecture

### Database Tables

1. **mt5_accounts** - Stores MT5 account credentials and metadata
   - `account_id` - Unique identifier
   - `user_id` - Links to Supabase auth user
   - `mt5_login` - MT5 account login number
   - `mt5_password` - MT5 account password
   - `mt5_server` - MT5 server name
   - `account_type` - Challenge type (standard, rapid, scaling, etc.)
   - `account_size` - Account size in dollars
   - `current_balance` - Current account balance
   - `leverage` - Trading leverage (e.g., 100 for 1:100)
   - `status` - Account status (active, suspended, closed)
   - `is_sent` - Whether credentials have been emailed
   - `sent_at` - Timestamp of when credentials were sent

2. **mt5_trades** - Records all trading activity
   - `trade_id` - Unique identifier
   - `account_id` - Links to mt5_accounts
   - `ticket` - MT5 trade ticket number
   - `symbol` - Trading pair (e.g., EURUSD)
   - `trade_type` - Buy or sell
   - `volume` - Trade volume in lots
   - `open_price` - Entry price
   - `close_price` - Exit price
   - `profit` - Trade profit/loss
   - `open_time` - Trade opening time
   - `close_time` - Trade closing time
   - `status` - Trade status (open, closed)

3. **mt5_equity_snapshots** - Daily equity tracking
   - `snapshot_id` - Unique identifier
   - `account_id` - Links to mt5_accounts
   - `balance` - Account balance
   - `equity` - Account equity
   - `recorded_at` - Snapshot timestamp

4. **email_queue** - Email delivery queue
   - `queue_id` - Unique identifier
   - `user_id` - Recipient user ID
   - `account_id` - Related MT5 account
   - `template_name` - Email template
   - `to_email` - Recipient email
   - `subject` - Email subject
   - `html_body` - Email HTML content
   - `status` - Queue status (pending, sent, failed)

---

## Admin Dashboard (`/admin/mt5`)

### Features

1. **Create MT5 Accounts**
   - Select user from dropdown
   - Enter MT5 login credentials from your MT5 server
   - Choose account type (standard, rapid, scaling, professional, swing)
   - Select account size ($5K - $200K)
   - Set leverage (1:50, 1:100, 1:200, 1:500)
   - Auto-generates secure passwords

2. **Manage Accounts**
   - View all created accounts
   - Search by login, email, or account type
   - Copy credentials to clipboard
   - Send credentials via email
   - Track which accounts have been sent

3. **Statistics Dashboard**
   - Total accounts created
   - Active accounts count
   - Pending credential sends
   - Total balance across all accounts

### How to Use

1. Navigate to `/admin/mt5`
2. Click "Create Account" button
3. Select a user from the dropdown
4. Enter the MT5 login number from your MT5 server
5. Use the auto-generated password or create your own
6. Enter your MT5 server name (e.g., "MetaQuotes-Demo")
7. Choose account type and size
8. Click "Create Account"
9. Click "Send Credentials" to email the user their login details

---

## User Dashboard (`/dashboard`)

### Features

Users see their MT5 credentials directly in their main dashboard:

1. **MT5 Account Card** (displayed prominently at top)
   - Account size and type
   - Current balance
   - Login credentials with copy buttons
   - Password toggle (show/hide)
   - Server information
   - Leverage details
   - Download MT5 button
   - Link to full trading details

2. **Credential Management**
   - One-click copy for login, password, and server
   - Password visibility toggle
   - Visual confirmation when copied

3. **Quick Access**
   - Direct download link to MetaTrader 5
   - Link to view full trading history

---

## Full MT5 Page (`/mt5`)

Extended trading dashboard with comprehensive features:

### Statistics
- Total trades count
- Win rate percentage
- Total profit/loss
- Closed trades count

### Equity Curve
- Visual graph showing account performance over time
- Profit/loss tracking
- Historical data points

### Trade History Table
- Symbol, type (buy/sell), volume
- Open/close prices
- Profit/loss per trade
- Trade status and dates
- Color-coded profit indicators

---

## Complete Workflow

### 1. Admin Creates Account

```
Admin Dashboard → Create Account →
  Select User → Enter MT5 Credentials →
  Configure Account → Submit
```

### 2. Send Credentials

```
Admin Dashboard → Find Account →
  Click "Send Credentials" →
  Email Queued & Account Marked as Sent
```

### 3. User Access

```
User Logs In → Dashboard →
  Sees MT5 Credentials →
  Copies Login Details →
  Downloads MT5 →
  Starts Trading
```

### 4. Track Performance

```
User Dashboard → View Trading Stats →
  Click "View Full Details" →
  See Equity Curve & Trade History
```

---

## Email Template

When you send credentials, users receive a professional email with:

- Gradient header with Fund8r branding
- MT5 login credentials in a highlighted box
- Account type and balance information
- Direct download link to MetaTrader 5
- Clean, modern design matching your brand

---

## Database Security (RLS Policies)

### mt5_accounts
- Users can only view their own accounts
- No public access to sensitive credentials
- Admins query without restrictions (handled in app logic)

### mt5_trades
- Users can view trades for their accounts only
- Trade history is private per user

### mt5_equity_snapshots
- Users can view equity data for their accounts only
- Historical performance is private

### email_queue
- Users can view emails sent to them
- Queue management restricted

---

## Integration Points

### 1. Dashboard Integration
- MT5 credentials appear automatically when account is created
- Seamlessly integrated into existing dashboard layout
- No separate navigation needed for basic access

### 2. Separate MT5 Page
- Full trading analytics and history
- Accessed via "View Full Details" link
- Comprehensive performance tracking

### 3. Admin Control
- Centralized management at `/admin/mt5`
- Quick access via navbar "Admin" link
- Complete oversight of all accounts

---

## Next Steps

### For Manual Management Phase

1. **Create Accounts**: Use admin dashboard to create MT5 accounts as users sign up
2. **Send Credentials**: Email credentials to users immediately
3. **Monitor Activity**: Watch the admin dashboard statistics
4. **Track Performance**: Review user trading through the system

### For Future Automation

When ready to scale, you can:

1. Add automatic MT5 account creation via MT5 API
2. Implement real-time trade syncing
3. Add automated email triggers
4. Build rule violation monitoring
5. Create automated payout systems

---

## Technical Details

### Frontend
- React 18 + TypeScript
- Supabase client for data access
- Real-time credential copying
- Responsive design for all devices

### Backend
- Supabase PostgreSQL database
- Row Level Security (RLS) for data privacy
- Custom RPC function for user listing
- Email queue system for credential delivery

### Security
- Passwords can be hidden/shown by users
- Credentials never logged or exposed
- RLS ensures data isolation per user
- Secure database functions with SECURITY DEFINER

---

## Support & Troubleshooting

### Users can't see credentials
- Check that account status is "active"
- Verify account is assigned to correct user_id
- Ensure user is logged in

### Admin can't see users
- Check database function `get_users_for_admin()` is created
- Verify RLS policies allow authenticated access
- Check browser console for errors

### Credentials not sending
- Check email_queue table for queued emails
- Verify to_email is correct
- Review email queue status field

---

## Summary

Your Fund8r platform now has complete connectivity between admin operations and user access:

✅ Admin creates MT5 accounts manually
✅ Credentials automatically appear in user dashboard
✅ Users can copy credentials with one click
✅ Email delivery system for credentials
✅ Full trading history and performance tracking
✅ Professional, integrated user experience
✅ Secure, private data access per user

The system is production-ready for manual management during your startup phase!
