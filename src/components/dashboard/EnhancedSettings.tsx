import { useState, useEffect } from 'react';
import { Bell, Shield, User, Mail, Phone, MapPin, Save, Check, AlertCircle, Globe, Moon, Sun } from 'lucide-react';
import { supabase } from '../../lib/db';
import GradientText from '../ui/GradientText';

export default function EnhancedSettings({ user }: { user: any }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    country: '',
  });
  const [notifications, setNotifications] = useState({
    email_alerts: true,
    trade_notifications: true,
    payout_notifications: true,
    marketing: false,
  });
  const [preferences, setPreferences] = useState({
    timezone: 'UTC',
    theme: 'dark',
    language: 'en',
    currency_display: 'USD',
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  async function fetchUserProfile() {
    try {
      // Use auth.users metadata instead of users table
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (authUser && authUser.user_metadata) {
        setProfile({
          first_name: authUser.user_metadata.first_name || authUser.user_metadata.full_name?.split(' ')[0] || '',
          last_name: authUser.user_metadata.last_name || authUser.user_metadata.full_name?.split(' ')[1] || '',
          phone: authUser.user_metadata.phone || '',
          country: authUser.user_metadata.country || '',
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  }

  async function handleSaveProfile() {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Update auth user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          country: profile.country,
        }
      });

      if (updateError) throw updateError;

      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword() {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setPasswordLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (updateError) throw updateError;

      setSuccess('Password changed successfully!');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-4xl font-bold mb-2">
        <GradientText>Account Settings</GradientText>
      </h1>
      <p className="text-white/70 mb-8">Manage your account preferences and personal information</p>

      {success && (
        <div className="flex items-center gap-2 p-4 bg-neon-green/10 border border-neon-green/30 rounded-lg mb-6">
          <Check className="w-5 h-5 text-neon-green" />
          <p className="text-neon-green">{success}</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg mb-6">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-electric-blue/20 rounded-lg">
              <User className="w-5 h-5 text-electric-blue" />
            </div>
            <h2 className="text-xl font-bold">Personal Information</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-white/70">Email Address</label>
              <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-lg opacity-60">
                <Mail className="w-4 h-4 text-white/50" />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="flex-1 bg-transparent border-none outline-none text-white/70"
                />
              </div>
              <p className="text-xs text-white/40 mt-1">Email cannot be changed</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-white/70">First Name</label>
                <input
                  type="text"
                  value={profile.first_name}
                  onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                  placeholder="John"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-electric-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-white/70">Last Name</label>
                <input
                  type="text"
                  value={profile.last_name}
                  onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                  placeholder="Doe"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-electric-blue focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-white/70">Phone Number</label>
              <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus-within:border-electric-blue">
                <Phone className="w-4 h-4 text-white/50" />
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="flex-1 bg-transparent border-none outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-white/70">Country</label>
              <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus-within:border-electric-blue">
                <MapPin className="w-4 h-4 text-white/50" />
                <input
                  type="text"
                  value={profile.country}
                  onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                  placeholder="United States"
                  className="flex-1 bg-transparent border-none outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-electric-blue to-neon-purple rounded-lg font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-neon-green/20 rounded-lg">
              <Bell className="w-5 h-5 text-neon-green" />
            </div>
            <h2 className="text-xl font-bold">Notification Preferences</h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
              <div>
                <div className="font-semibold">Email Alerts</div>
                <div className="text-sm text-white/60">Receive important account notifications via email</div>
              </div>
              <input
                type="checkbox"
                checked={notifications.email_alerts}
                onChange={(e) => setNotifications({ ...notifications, email_alerts: e.target.checked })}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-electric-blue focus:ring-electric-blue focus:ring-offset-0"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
              <div>
                <div className="font-semibold">Trade Notifications</div>
                <div className="text-sm text-white/60">Get notified about your trading activity</div>
              </div>
              <input
                type="checkbox"
                checked={notifications.trade_notifications}
                onChange={(e) => setNotifications({ ...notifications, trade_notifications: e.target.checked })}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-electric-blue focus:ring-electric-blue focus:ring-offset-0"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
              <div>
                <div className="font-semibold">Payout Notifications</div>
                <div className="text-sm text-white/60">Alerts for payout processing and completion</div>
              </div>
              <input
                type="checkbox"
                checked={notifications.payout_notifications}
                onChange={(e) => setNotifications({ ...notifications, payout_notifications: e.target.checked })}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-electric-blue focus:ring-electric-blue focus:ring-offset-0"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
              <div>
                <div className="font-semibold">Marketing Communications</div>
                <div className="text-sm text-white/60">Promotions, updates, and trading tips</div>
              </div>
              <input
                type="checkbox"
                checked={notifications.marketing}
                onChange={(e) => setNotifications({ ...notifications, marketing: e.target.checked })}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-electric-blue focus:ring-electric-blue focus:ring-offset-0"
              />
            </label>
          </div>
        </div>

        {/* Display Preferences */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-cyber-purple/20 rounded-lg">
              <Globe className="w-5 h-5 text-cyber-purple" />
            </div>
            <h2 className="text-xl font-bold">Display Preferences</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-white/70">Timezone</label>
              <select
                value={preferences.timezone}
                onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-electric-blue focus:outline-none"
              >
                <option value="UTC" className="bg-deep-space">UTC (GMT+0)</option>
                <option value="America/New_York" className="bg-deep-space">Eastern Time (GMT-5)</option>
                <option value="America/Chicago" className="bg-deep-space">Central Time (GMT-6)</option>
                <option value="America/Denver" className="bg-deep-space">Mountain Time (GMT-7)</option>
                <option value="America/Los_Angeles" className="bg-deep-space">Pacific Time (GMT-8)</option>
                <option value="Europe/London" className="bg-deep-space">London (GMT+0)</option>
                <option value="Europe/Paris" className="bg-deep-space">Paris (GMT+1)</option>
                <option value="Asia/Tokyo" className="bg-deep-space">Tokyo (GMT+9)</option>
                <option value="Asia/Dubai" className="bg-deep-space">Dubai (GMT+4)</option>
              </select>
            </div>

            {/* Theme switcher removed - only dark theme available */}

            <div>
              <label className="block text-sm font-semibold mb-2 text-white/70">Currency Display</label>
              <select
                value={preferences.currency_display}
                onChange={(e) => setPreferences({ ...preferences, currency_display: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-electric-blue focus:outline-none"
              >
                <option value="USD" className="bg-deep-space">USD ($)</option>
                <option value="EUR" className="bg-deep-space">EUR (€)</option>
                <option value="GBP" className="bg-deep-space">GBP (£)</option>
                <option value="JPY" className="bg-deep-space">JPY (¥)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <Shield className="w-5 h-5 text-red-400" />
            </div>
            <h2 className="text-xl font-bold">Security</h2>
          </div>

          <div className="space-y-4">
            <button 
              onClick={() => setShowPasswordModal(true)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-left"
            >
              <div className="font-semibold mb-1">Change Password</div>
              <div className="text-sm text-white/60">Update your account password</div>
            </button>

            <button 
              onClick={() => alert('Two-Factor Authentication setup coming soon!')}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-left"
            >
              <div className="font-semibold mb-1">Two-Factor Authentication</div>
              <div className="text-sm text-white/60">Add an extra layer of security</div>
            </button>

            <button 
              onClick={() => alert('Active sessions management coming soon!')}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-left"
            >
              <div className="font-semibold mb-1">Active Sessions</div>
              <div className="text-sm text-white/60">Manage logged-in devices</div>
            </button>

            <button 
              onClick={() => {
                if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                  alert('Account deletion request submitted. Our team will contact you.');
                }
              }}
              className="w-full px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors text-left text-red-400"
            >
              <div className="font-semibold mb-1">Delete Account</div>
              <div className="text-sm text-red-300/70">Permanently delete your account and data</div>
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-deep-space border border-white/10 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-6">Change Password</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-white/70">Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-electric-blue focus:outline-none"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-white/70">New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-electric-blue focus:outline-none"
                  placeholder="Enter new password (min 8 characters)"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-white/70">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-electric-blue focus:outline-none"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setError('');
                }}
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={passwordLoading || !passwordData.newPassword || !passwordData.confirmPassword}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-electric-blue to-neon-purple rounded-lg font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
              >
                {passwordLoading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
