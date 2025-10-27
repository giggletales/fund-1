# Frontend Integration Examples

This guide shows you exactly how to integrate the backend monitoring system with your existing React frontend.

## Setup API Client

Create `/src/lib/api.ts`:

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const monitoringAPI = {
  // Account Management
  async getAccounts(userId?: string) {
    const url = userId ? `${API_URL}/accounts?user_id=${userId}` : `${API_URL}/accounts`;
    const res = await fetch(url);
    return res.json();
  },

  async getAccount(id: string) {
    const res = await fetch(`${API_URL}/accounts/${id}`);
    return res.json();
  },

  async startMonitoring(accountId: string) {
    const res = await fetch(`${API_URL}/accounts/${accountId}/start-monitoring`, {
      method: 'POST'
    });
    return res.json();
  },

  async stopMonitoring(accountId: string) {
    const res = await fetch(`${API_URL}/accounts/${accountId}/stop-monitoring`, {
      method: 'POST'
    });
    return res.json();
  },

  async getMetrics(accountId: string, limit = 100) {
    const res = await fetch(`${API_URL}/accounts/${accountId}/metrics?limit=${limit}`);
    return res.json();
  },

  async getViolations(accountId: string) {
    const res = await fetch(`${API_URL}/accounts/${accountId}/violations`);
    return res.json();
  },

  // Leaderboard
  async getLeaderboard(period = 'all', limit = 50) {
    const res = await fetch(`${API_URL}/leaderboard?period=${period}&limit=${limit}`);
    return res.json();
  },

  async getLeaderboardStats() {
    const res = await fetch(`${API_URL}/leaderboard/stats`);
    return res.json();
  },

  // Notifications
  async getNotifications(userId: string) {
    const res = await fetch(`${API_URL}/notifications?user_id=${userId}`);
    return res.json();
  },

  async markNotificationRead(id: string) {
    const res = await fetch(`${API_URL}/notifications/${id}/read`, {
      method: 'PUT'
    });
    return res.json();
  },

  async markAllNotificationsRead(userId: string) {
    const res = await fetch(`${API_URL}/notifications/mark-all-read/${userId}`, {
      method: 'PUT'
    });
    return res.json();
  },

  // Certificates
  getCertificateUrl(accountId: string) {
    return `${API_URL}/certificates/${accountId}`;
  },

  async generateCertificate(accountId: string) {
    const res = await fetch(`${API_URL}/certificates/generate/${accountId}`, {
      method: 'POST'
    });
    return res.json();
  },

  // Affiliates
  async createAffiliate(userId: string) {
    const res = await fetch(`${API_URL}/affiliates/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });
    return res.json();
  },

  async getAffiliateStats(userId: string) {
    const res = await fetch(`${API_URL}/affiliates/stats/${userId}`);
    return res.json();
  },

  async validateAffiliateCode(code: string) {
    const res = await fetch(`${API_URL}/affiliates/validate-code/${code}`);
    return res.json();
  },

  async trackReferral(affiliateCode: string, referredUserId: string) {
    const res = await fetch(`${API_URL}/affiliates/track-referral`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ affiliate_code: affiliateCode, referred_user_id: referredUserId })
    });
    return res.json();
  }
};
```

## Example 1: Real-Time Account Metrics Dashboard

Add this to your Dashboard component:

```typescript
import { useState, useEffect } from 'react';
import { monitoringAPI } from '../lib/api';

function AccountMetricsDashboard({ accountId }: { accountId: string }) {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await monitoringAPI.getMetrics(accountId, 1);
        if (response.success && response.data.length > 0) {
          setMetrics(response.data[0]);
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchMetrics();

    // Update every 10 seconds
    const interval = setInterval(fetchMetrics, 10000);

    return () => clearInterval(interval);
  }, [accountId]);

  if (loading) return <div>Loading metrics...</div>;
  if (!metrics) return <div>No metrics available</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard
        title="Current Balance"
        value={`$${metrics.balance.toLocaleString()}`}
        trend={metrics.profit >= 0 ? 'up' : 'down'}
      />
      <MetricCard
        title="Daily Drawdown"
        value={`${metrics.daily_drawdown.toFixed(2)}%`}
        warning={metrics.daily_drawdown > 2}
      />
      <MetricCard
        title="Max Drawdown"
        value={`${metrics.max_drawdown.toFixed(2)}%`}
        warning={metrics.max_drawdown > 4}
      />
      <MetricCard
        title="Trading Days"
        value={metrics.trading_days}
      />
      <MetricCard
        title="Consistency Score"
        value={`${metrics.consistency_score.toFixed(1)}/100`}
      />
      <MetricCard
        title="Total Trades"
        value={metrics.total_trades}
      />
    </div>
  );
}

function MetricCard({ title, value, trend, warning }: any) {
  return (
    <div className={`bg-white p-6 rounded-lg shadow ${warning ? 'border-l-4 border-red-500' : ''}`}>
      <h3 className="text-gray-500 text-sm mb-2">{title}</h3>
      <p className={`text-2xl font-bold ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : ''}`}>
        {value}
      </p>
    </div>
  );
}
```

## Example 2: Leaderboard Component

```typescript
import { useState, useEffect } from 'react';
import { monitoringAPI } from '../lib/api';

function Leaderboard() {
  const [period, setPeriod] = useState('all');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [leaderboardRes, statsRes] = await Promise.all([
        monitoringAPI.getLeaderboard(period, 50),
        monitoringAPI.getLeaderboardStats()
      ]);

      if (leaderboardRes.success) setLeaderboard(leaderboardRes.data);
      if (statsRes.success) setStats(statsRes.stats);
    };

    fetchData();
  }, [period]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Leaderboard</h1>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-500 text-sm">Total Traders</p>
            <p className="text-2xl font-bold">{stats.total_traders}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-500 text-sm">Passed</p>
            <p className="text-2xl font-bold text-green-500">{stats.passed_traders}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-500 text-sm">Success Rate</p>
            <p className="text-2xl font-bold">{stats.success_rate}%</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-500 text-sm">Total Profit</p>
            <p className="text-2xl font-bold">${stats.total_profit.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Period Selector */}
      <div className="mb-6">
        {['daily', 'weekly', 'monthly', 'all'].map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 mr-2 rounded ${period === p ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">Rank</th>
              <th className="px-6 py-3 text-left">Trader</th>
              <th className="px-6 py-3 text-left">Badge</th>
              <th className="px-6 py-3 text-right">Initial</th>
              <th className="px-6 py-3 text-right">Final</th>
              <th className="px-6 py-3 text-right">Profit</th>
              <th className="px-6 py-3 text-right">ROI</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, index) => (
              <tr key={entry.id} className="border-t hover:bg-gray-50">
                <td className="px-6 py-4 font-bold">{entry.rank}</td>
                <td className="px-6 py-4">{entry.full_name || 'Anonymous Trader'}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm" style={{ backgroundColor: entry.badge.color + '20', color: entry.badge.color }}>
                    {entry.badge.icon} {entry.badge.name}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">${entry.initial_balance.toLocaleString()}</td>
                <td className="px-6 py-4 text-right">${entry.balance.toLocaleString()}</td>
                <td className="px-6 py-4 text-right text-green-500 font-bold">
                  ${(entry.balance - entry.initial_balance).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right">{entry.profit_percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

## Example 3: Affiliate Dashboard

```typescript
import { useState, useEffect } from 'react';
import { monitoringAPI } from '../lib/api';

function AffiliateDashboard({ userId }: { userId: string }) {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const response = await monitoringAPI.getAffiliateStats(userId);
      if (response.success) {
        setStats(response.data);
      }
    };
    fetchStats();
  }, [userId]);

  if (!stats) return <div>Loading...</div>;

  const affiliateLink = `${window.location.origin}/signup?ref=${stats.affiliate.affiliate_code}`;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Affiliate Dashboard</h1>

      {/* Affiliate Link */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold mb-4">Your Affiliate Link</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={affiliateLink}
            readOnly
            className="flex-1 px-4 py-2 border rounded"
          />
          <button
            onClick={() => navigator.clipboard.writeText(affiliateLink)}
            className="px-6 py-2 bg-blue-500 text-white rounded"
          >
            Copy
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Code: <strong>{stats.affiliate.affiliate_code}</strong>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500 text-sm mb-2">Total Referrals</p>
          <p className="text-3xl font-bold">{stats.stats.total_referrals}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500 text-sm mb-2">Total Earnings</p>
          <p className="text-3xl font-bold text-green-500">
            ${stats.stats.total_earnings.toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500 text-sm mb-2">Pending Payout</p>
          <p className="text-3xl font-bold text-yellow-500">
            ${stats.stats.pending_earnings.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Referrals List */}
      <div className="bg-white rounded-lg shadow">
        <h2 className="text-xl font-bold p-6 border-b">Your Referrals</h2>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">User</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {stats.referrals.map((referral: any) => (
              <tr key={referral.id} className="border-t">
                <td className="px-6 py-4">{referral.users.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    referral.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {referral.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {new Date(referral.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

## Example 4: Tracking Referrals on Signup

```typescript
// In your Signup component
import { useEffect } from 'react';
import { monitoringAPI } from '../lib/api';

function Signup() {
  useEffect(() => {
    // Check for affiliate code in URL
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');

    if (refCode) {
      // Store in localStorage for after signup
      localStorage.setItem('affiliate_ref', refCode);
    }
  }, []);

  const handleSignup = async (userData: any) => {
    // Create user account first with Supabase
    const { data: user, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password
    });

    if (user) {
      // Check for stored affiliate code
      const refCode = localStorage.getItem('affiliate_ref');

      if (refCode) {
        // Track the referral
        await monitoringAPI.trackReferral(refCode, user.user.id);
        localStorage.removeItem('affiliate_ref');
      }
    }
  };

  // ... rest of signup component
}
```

## Example 5: Certificate Download

```typescript
function CertificateDownload({ accountId }: { accountId: string }) {
  const certificateUrl = monitoringAPI.getCertificateUrl(accountId);

  return (
    <a
      href={certificateUrl}
      download
      className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
    >
      Download Certificate
    </a>
  );
}
```

## Example 6: Notification Bell

```typescript
import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { monitoringAPI } from '../lib/api';

function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      const response = await monitoringAPI.getNotifications(userId);
      if (response.success) {
        setNotifications(response.data);
        setUnreadCount(response.data.filter((n: any) => !n.read).length);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [userId]);

  const markAsRead = async (id: string) => {
    await monitoringAPI.markNotificationRead(id);
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
    setUnreadCount(unreadCount - 1);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="p-4 text-gray-500 text-center">No notifications</p>
          ) : (
            notifications.map(notification => (
              <div
                key={notification.id}
                className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <h4 className="font-bold text-sm">{notification.title}</h4>
                <p className="text-sm text-gray-600">{notification.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
```

## Environment Setup

Add to your `.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

For production:
```env
VITE_API_URL=https://api.yoursite.com/api
```

## That's It!

These examples show you exactly how to integrate all the backend features into your React frontend. Copy and paste these components and adjust styling to match your design!
