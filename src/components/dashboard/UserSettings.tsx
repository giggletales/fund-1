import { useState } from 'react';
import { Settings, User, Bell, Lock, Mail, Globe } from 'lucide-react';
import { supabase } from '../../lib/db';

interface UserSettingsProps {
  user: any;
  onClose: () => void;
}

export default function UserSettings({ user, onClose }: UserSettingsProps) {
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [profileData, setProfileData] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    country: user?.country || '',
    phone: user?.phone || ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    tradeAlerts: true,
    weeklyReports: true,
    marketingEmails: false
  });

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('users')
        .update({
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          country: profileData.country,
          phone: profileData.phone
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-electric-blue/20">
              <Settings className="text-electric-blue" size={24} />
            </div>
            <h2 className="text-2xl font-bold">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-64 border-r border-white/10 p-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all mb-2 ${
                    activeTab === tab.id
                      ? 'bg-electric-blue/20 text-electric-blue'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            {message && (
              <div className={`mb-4 p-4 rounded-lg ${
                message.includes('success')
                  ? 'bg-neon-green/10 border border-neon-green/30 text-neon-green'
                  : 'bg-red-500/10 border border-red-500/30 text-red-500'
              }`}>
                {message}
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-4">Profile Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">First Name</label>
                      <input
                        type="text"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-electric-blue focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Last Name</label>
                      <input
                        type="text"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-electric-blue focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center">
                    <Mail className="mr-2" size={16} />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg opacity-50 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center">
                    <Globe className="mr-2" size={16} />
                    Country
                  </label>
                  <input
                    type="text"
                    value={profileData.country}
                    onChange={(e) => setProfileData({...profileData, country: e.target.value})}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-electric-blue focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-electric-blue focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="btn-gradient px-8 py-3 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold mb-4">Notification Preferences</h3>

                {[
                  { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive email updates about your account' },
                  { key: 'tradeAlerts', label: 'Trade Alerts', desc: 'Get notified when trades are opened or closed' },
                  { key: 'weeklyReports', label: 'Weekly Reports', desc: 'Receive weekly performance summaries' },
                  { key: 'marketingEmails', label: 'Marketing Emails', desc: 'Receive news and promotional offers' }
                ].map((setting) => (
                  <div key={setting.key} className="flex items-start justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <h4 className="font-semibold mb-1">{setting.label}</h4>
                      <p className="text-sm text-gray-400">{setting.desc}</p>
                    </div>
                    <button
                      onClick={() => setNotificationSettings({
                        ...notificationSettings,
                        [setting.key]: !notificationSettings[setting.key as keyof typeof notificationSettings]
                      })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationSettings[setting.key as keyof typeof notificationSettings]
                          ? 'bg-electric-blue'
                          : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationSettings[setting.key as keyof typeof notificationSettings]
                            ? 'translate-x-6'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold mb-4">Security Settings</h3>

                <div className="bg-electric-blue/10 border border-electric-blue/30 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center text-electric-blue">
                    <Lock className="mr-2" size={18} />
                    Password Change
                  </h4>
                  <p className="text-sm text-gray-400 mb-4">
                    To change your password, please contact support or use the password reset feature on the login page.
                  </p>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Active Sessions</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div>
                        <p className="font-medium">Current Session</p>
                        <p className="text-sm text-gray-400">Last active: Just now</p>
                      </div>
                      <span className="text-neon-green text-sm">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
