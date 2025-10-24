import { useState, useEffect } from 'react';
import { supabase } from '../lib/db';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GradientText from '../components/ui/GradientText';
import { Plus, Send, Eye, EyeOff, Copy, Check, X, Search, Award, Trophy, User, AlertTriangle, FileText, Users, Target, Calendar, DollarSign } from 'lucide-react';

interface MT5Account {
  account_id: string;
  user_id: string;
  mt5_login: string;
  mt5_password: string;
  mt5_server: string;
  account_type: string;
  account_size: number;
  current_balance: number;
  status: string;
  is_sent: boolean;
  created_at: string;
  user_email?: string;
  user_name?: string;
  unique_user_id?: string;
}

export default function AdminMT5() {
  const [accounts, setAccounts] = useState<MT5Account[]>([]);
  const [pendingChallenges, setPendingChallenges] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'accounts' | 'certificates' | 'competitions' | 'profiles' | 'breach' | 'affiliates'>('accounts');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Fetch user data
      const { data: usersData, error: usersError } = await supabase.rpc('get_users_for_admin');
      if (usersError) {
        console.error('❌ Admin access error:', usersError);
        if (usersError.message?.includes('Admin privileges required') || usersError.message?.includes('Access denied')) {
          alert('⚠️ Admin Access Required\n\nYou do not have admin privileges. Please ensure your account is added to the admin_roles table in the database.');
          setLoading(false);
          return;
        }
        throw usersError;
      }

      const usersMap = new Map(usersData?.map((u: any) => [u.id, u]) || []);

      // Fetch user profiles to get friendly_id
      const { data: profilesData } = await supabase
        .from('user_profiles')
        .select('user_id, friendly_id');

      const profilesMap = new Map(profilesData?.map((p: any) => [p.user_id, p.friendly_id]) || []);

      // Fetch ALL user challenges
      const { data: challengesData, error: challengesError } = await supabase
        .from('user_challenges')
        .select('*')
        .order('purchase_date', { ascending: false });

      if (challengesError) {
        console.error('❌ Error fetching challenges:', challengesError);
        if (challengesError.message?.includes('row-level security') || challengesError.code === 'PGRST301') {
          alert('⚠️ Admin Access Issue\n\nUnable to fetch all challenges. This usually means:\n1. Your account is not in the admin_roles table\n2. RLS policies are blocking access\n\nPlease contact a database administrator.');
          setLoading(false);
          return;
        }
        throw challengesError;
      }

      console.log('✅ Admin: Total challenges fetched:', challengesData?.length);
      console.log('📊 Admin: Challenges without trading_account_id:', challengesData?.filter(c => !c.trading_account_id).length);
      console.log('📊 Admin: Challenge statuses breakdown:', {
        total: challengesData?.length || 0,
        with_credentials: challengesData?.filter(c => c.trading_account_id).length || 0,
        without_credentials: challengesData?.filter(c => !c.trading_account_id).length || 0,
        active: challengesData?.filter(c => c.status === 'active').length || 0,
        pending_payment: challengesData?.filter(c => c.status === 'pending_payment').length || 0,
      });

      // Separate pending challenges (no trading_account_id yet)
      // Include all statuses except 'pending_payment' (which means payment not completed)
      const pending = challengesData?.filter(c => {
        const needsCredentials = !c.trading_account_id && c.status !== 'pending_payment';
        if (needsCredentials) {
          console.log('🔍 Pending challenge found:', {
            id: c.id,
            user_id: c.user_id,
            status: c.status,
            account_size: c.account_size,
            challenge_type: c.challenge_type,
            purchase_date: c.purchase_date
          });
        }
        return needsCredentials;
      }).map((c: any) => {
        const user = usersMap.get(c.user_id);
        const friendlyId = profilesMap.get(c.user_id) || 'N/A';
        return {
          id: c.id,
          user_id: c.user_id,
          user_email: user?.email || 'Unknown',
          user_name: user?.full_name || user?.email?.split('@')[0] || 'N/A',
          friendly_id: friendlyId,
          account_size: c.account_size,
          challenge_type: c.challenge_type || 'Unknown',
          challenge_type_id: c.challenge_type_id,
          status: c.status,
          phase: 'pending_credentials',
          created_at: c.purchase_date || c.created_at,
          amount_paid: c.amount_paid
        };
      }) || [];

      console.log('✅ Admin: Pending challenges (need MT5 credentials):', pending.length);
      if (pending.length > 0) {
        console.table(pending.map(p => ({
          email: p.user_email,
          account_size: p.account_size,
          challenge_type: p.challenge_type,
          status: p.status,
          created: new Date(p.created_at).toLocaleDateString()
        })));
      }

      setPendingChallenges(pending);
      
      // Show detailed info if no pending challenges found
      if (pending.length === 0 && challengesData && challengesData.length > 0) {
        console.warn('⚠️ No pending challenges found, but there are', challengesData.length, 'total challenges');
        console.log('📋 All challenge statuses:');
        console.table(challengesData.map(c => ({ 
          id: c.id.slice(0, 8), 
          status: c.status, 
          has_trading_id: !!c.trading_account_id,
          account_size: c.account_size,
          purchase_date: c.purchase_date ? new Date(c.purchase_date).toLocaleDateString() : 'N/A'
        })));
      }

      if (challengesData && challengesData.length === 0) {
        console.info('ℹ️ No challenges found in database. This could mean:\n  1. No users have purchased any challenges yet\n  2. Admin RLS policy is not working (check admin_roles table)');
      }

      // Format challenges as "accounts" for display
      const formattedAccounts = challengesData?.filter(c => c.trading_account_id).map((c: any) => {
        const user = usersMap.get(c.user_id);
        return {
          account_id: c.id,
          user_id: c.user_id,
          mt5_login: c.trading_account_id || 'Not Assigned',
          mt5_password: c.trading_account_password || 'Not Set',
          mt5_server: c.trading_account_server || 'MetaQuotes-Demo',
          account_type: c.challenge_type_id || 'Standard',
          account_size: c.account_size,
          current_balance: 0,
          status: c.status,
          is_sent: c.credentials_sent || false,
          created_at: c.purchase_date,
          user_email: user?.email || 'Unknown',
          user_name: user?.full_name || 'N/A',
          unique_user_id: c.trading_account_id
        };
      }) || [];

      setAccounts(formattedAccounts);

      // Set users from the already loaded data
      if (usersData) {
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = accounts.filter(acc =>
    acc.mt5_login.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.account_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-deep-space flex items-center justify-center">
        <div className="loader-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-space">
      <Navbar />

      <div className="pt-40 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">
              <GradientText>Admin MT5 Management Panel</GradientText>
            </h1>
            <p className="text-gray-400">Complete admin control center for certificates, competitions, user profiles, and account management</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 mb-8 glass-card p-2">
            <TabButton
              active={activeTab === 'accounts'}
              onClick={() => setActiveTab('accounts')}
              icon={<Users size={18} />}
              label="MT5 Accounts"
            />
            <TabButton
              active={activeTab === 'certificates'}
              onClick={() => setActiveTab('certificates')}
              icon={<Award size={18} />}
              label="Manual Certificates"
            />
            <TabButton
              active={activeTab === 'competitions'}
              onClick={() => setActiveTab('competitions')}
              icon={<Trophy size={18} />}
              label="Competitions"
            />
            <TabButton
              active={activeTab === 'profiles'}
              onClick={() => setActiveTab('profiles')}
              icon={<User size={18} />}
              label="User Profile 360°"
            />
            <TabButton
              active={activeTab === 'breach'}
              onClick={() => setActiveTab('breach')}
              icon={<AlertTriangle size={18} />}
              label="Manual Breach"
            />
            <TabButton
              active={activeTab === 'affiliates'}
              onClick={() => setActiveTab('affiliates')}
              icon={<DollarSign size={18} />}
              label="Affiliate Management"
            />
          </div>

          {/* Tab Content */}
          {activeTab === 'accounts' && (
            <AccountsTab
              accounts={accounts}
              pendingChallenges={pendingChallenges}
              users={users}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              setShowCreateModal={setShowCreateModal}
              loadData={loadData}
            />
          )}

          {activeTab === 'certificates' && <CertificatesTab users={users} />}
          {activeTab === 'competitions' && <CompetitionsTab users={users} />}
          {activeTab === 'profiles' && <UserProfilesTab users={users} />}
          {activeTab === 'breach' && <ManualBreachTab users={users} accounts={accounts} />}
          {activeTab === 'affiliates' && <AffiliatesManagementTab />}
        </div>
      </div>

      {showCreateModal && (
        <CreateAccountModal
          users={users}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadData();
          }}
        />
      )}

      <Footer />
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${
        active
          ? 'bg-gradient-to-r from-electric-blue to-neon-purple text-white'
          : 'bg-white/5 hover:bg-white/10 text-white/70'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function AccountsTab({ accounts, pendingChallenges, searchTerm, setSearchTerm, setShowCreateModal, loadData }: any) {
  const filteredAccounts = accounts.filter((acc: any) =>
    acc.mt5_login.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.account_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">MT5 Account Management</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-gradient flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Create Account</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard
              label="Pending Setup"
              value={pendingChallenges.length}
              icon="⏳"
              color="orange"
            />
            <StatCard
              label="Total Accounts"
              value={accounts.length}
              icon="👥"
              color="blue"
            />
            <StatCard
              label="Active"
              value={accounts.filter(a => a.status === 'active').length}
              icon="✅"
              color="green"
            />
            <StatCard
              label="Total Balance"
              value={`$${accounts.reduce((sum, a) => sum + Number(a.current_balance), 0).toLocaleString()}`}
              icon="💰"
              color="purple"
            />
      </div>

      {/* Pending Challenges Section */}
          {pendingChallenges.length > 0 && (
            <div className="glass-card p-6 mb-8 border-2 border-yellow-500/50">
              <h2 className="text-2xl font-bold mb-2 text-yellow-400">⏳ Pending Challenges - Needs MT5 Credentials</h2>
              <p className="text-gray-400 mb-6">These users have purchased challenges and are waiting for MT5 account setup</p>

              <div className="space-y-4">
                {pendingChallenges.map(challenge => (
                  <div key={challenge.id} className="bg-white/5 rounded-lg p-4 border border-yellow-500/30">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="font-bold text-lg">User ID: {challenge.friendly_id || 'N/A'}</div>
                          <div className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm font-semibold">
                            Awaiting Setup
                          </div>
                        </div>
                         <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <div className="text-gray-400">Email</div>
                            <div className="font-semibold">{challenge.user_email}</div>
                          </div>
                          <div>
                            <div className="text-gray-400">Account Size</div>
                            <div className="font-semibold">${parseFloat(challenge.account_size).toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-gray-400">Challenge Type</div>
 <div className="font-semibold">{challenge.challenge_type}</div>
 </div>
 <div>
 <div className="text-gray-400">Amount Paid</div>
 <div className="font-semibold">${parseFloat(challenge.amount_paid || 0).toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-gray-400">Created</div>
                            <div className="font-semibold">{new Date(challenge.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="ml-4 px-4 py-2 bg-gradient-to-r from-electric-blue to-neon-purple rounded-lg font-semibold hover:scale-105 transition-transform whitespace-nowrap"
                      >
                        Assign MT5
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

      {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-electric-blue focus:outline-none"
              />
            </div>
      </div>

      {/* Accounts List */}
          <div className="glass-card p-6">
            <h2 className="text-2xl font-bold mb-6">All MT5 Accounts</h2>

            {filteredAccounts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-4">No MT5 accounts found</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-gradient"
                >
                  Create First Account
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAccounts.map(account => (
                  <AccountCard
                    key={account.account_id}
                    account={account}
                    onUpdate={loadData}
                  />
                ))}
              </div>
            )}
      </div>
    </>
  );
}

function StatCard({ label, value, icon, color }: any) {
  const colors = {
    blue: 'bg-electric-blue/20 border-electric-blue/30',
    green: 'bg-neon-green/20 border-neon-green/30',
    orange: 'bg-orange-500/20 border-orange-500/30',
    purple: 'bg-cyber-purple/20 border-cyber-purple/30'
  };

  return (
    <div className={`glass-card p-6 border ${colors[color as keyof typeof colors]}`}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-sm text-gray-400 mb-1">{label}</div>
      <div className="text-2xl font-bold">
        <GradientText>{value}</GradientText>
      </div>
    </div>
  );
}

function AccountCard({ account, onUpdate }: { account: MT5Account; onUpdate: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const sendCredentials = async () => {
    setSending(true);
    try {
      // Mark as sent and visible (this will make credentials visible to user)
      const { error: updateError } = await supabase
        .from('user_challenges')
        .update({
          credentials_sent: true,
          credentials_sent_at: new Date().toISOString(),
          credentials_visible: true,
          credentials_released_at: new Date().toISOString(),
          status: 'active'
        })
        .eq('id', account.account_id);

      if (updateError) throw updateError;

      // Automatically create mt5_accounts entry for analytics
      const { data: existingMT5, error: checkError } = await supabase
        .from('mt5_accounts')
        .select('id')
        .eq('user_id', account.user_id)
        .eq('account_number', account.mt5_login)
        .single();

      if (!existingMT5) {
        // Create new MT5 account entry
        const { error: mt5Error } = await supabase
          .from('mt5_accounts')
          .insert({
            id: account.account_id, // Use challenge ID as MT5 account ID
            user_id: account.user_id,
            account_number: account.mt5_login,
            password: account.mt5_password,
            server: account.mt5_server,
            account_type: account.account_type,
            initial_balance: account.account_size,
            balance: account.account_size,
            equity: account.account_size,
            status: 'active',
            platform: 'mt5',
            created_at: new Date().toISOString()
          });

        if (mt5Error) {
          console.error('Error creating MT5 account entry:', mt5Error);
          // Don't fail the whole operation if MT5 account creation fails
        } else {
          console.log('✅ MT5 account entry created for analytics');
        }
      }

      alert('✅ Credentials sent! User can now see them and analytics are enabled.');
      onUpdate();
    } catch (error) {
      console.error('Error sending credentials:', error);
      alert('Failed to mark credentials as sent');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white/5 p-6 rounded-lg border border-white/10 hover:border-white/20 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-xl font-bold">{account.user_email}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              account.is_sent
                ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                : 'bg-orange-500/20 text-orange-500 border border-orange-500/30'
            }`}>
              {account.is_sent ? 'Sent' : 'Pending'}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-electric-blue/20 text-electric-blue border border-electric-blue/30">
              {account.account_type}
            </span>
            {account.unique_user_id && account.unique_user_id !== 'N/A' && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/30">
                ID: {account.unique_user_id}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400">{account.user_name}</p>
        </div>
        {!account.is_sent && (
          <button
            onClick={sendCredentials}
            disabled={sending}
            className="flex items-center space-x-2 px-4 py-2 bg-neon-green/20 text-neon-green border border-neon-green/30 rounded-lg hover:bg-neon-green/30 transition-all disabled:opacity-50"
          >
            <Send size={16} />
            <span>{sending ? 'Sending...' : 'Send Credentials'}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <CredentialField
          label="MT5 Login"
          value={account.mt5_login}
          onCopy={() => copyToClipboard(account.mt5_login, 'login')}
          copied={copied === 'login'}
        />
        <CredentialField
          label="Password"
          value={account.mt5_password}
          onCopy={() => copyToClipboard(account.mt5_password, 'password')}
          copied={copied === 'password'}
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
        />
        <CredentialField
          label="Server"
          value={account.mt5_server}
          onCopy={() => copyToClipboard(account.mt5_server, 'server')}
          copied={copied === 'server'}
        />
        <CredentialField
          label="Balance"
          value={`$${Number(account.current_balance).toLocaleString()}`}
        />
      </div>

      <div className="flex items-center justify-between text-sm text-gray-400 pt-4 border-t border-white/10">
        <span>Created: {new Date(account.created_at).toLocaleDateString()}</span>
        <span>Account Size: ${Number(account.account_size).toLocaleString()}</span>
      </div>
    </div>
  );
}

function CredentialField({ label, value, onCopy, copied, showPassword, onTogglePassword }: any) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-black/50 px-3 py-2 rounded border border-white/10 font-mono text-sm">
          {showPassword !== undefined && !showPassword ? '••••••••' : value}
        </div>
        {showPassword !== undefined && (
          <button
            onClick={onTogglePassword}
            className="p-2 bg-white/5 rounded hover:bg-white/10 transition-all"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
        {onCopy && (
          <button
            onClick={onCopy}
            className="p-2 bg-white/5 rounded hover:bg-white/10 transition-all"
          >
            {copied ? <Check size={16} className="text-neon-green" /> : <Copy size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}

function CreateAccountModal({ users, onClose, onSuccess }: any) {
  const [pendingChallenges, setPendingChallenges] = useState<any[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [formData, setFormData] = useState({
    mt5_login: '',
    mt5_password: generatePassword(),
    mt5_server: 'MetaQuotes-Demo',
    leverage: 100
  });
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingChallenges();
  }, []);

  async function loadPendingChallenges() {
    try {
      const { data: challenges, error: challengesError } = await supabase
        .from('user_challenges')
        .select('*')
        .is('trading_account_id', null)
        .neq('status', 'pending_payment')
        .order('purchase_date', { ascending: false });

      if (challengesError) throw challengesError;

      // Get user data separately
      const { data: usersData, error: usersError } = await supabase.rpc('get_users_for_admin');
      if (usersError) throw usersError;

      const usersMap = new Map(usersData?.map((u: any) => [u.id, u]) || []);

      // Merge user data with challenges
      const enrichedChallenges = challenges?.map(challenge => {
        const user = usersMap.get(challenge.user_id);
        return {
          ...challenge,
          users: {
            email: user?.email || 'Unknown',
            full_name: user?.full_name || 'N/A'
          }
        };
      }) || [];

      setPendingChallenges(enrichedChallenges);
    } catch (error) {
      console.error('Error loading pending challenges:', error);
      setPendingChallenges([]);
    } finally {
      setLoading(false);
    }
  }

  const handleChallengeSelect = (challengeId: string) => {
    if (!challengeId) {
      setSelectedChallenge(null);
      return;
    }

    const challenge = pendingChallenges.find(c => c.id === challengeId);
    setSelectedChallenge(challenge);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedChallenge) {
      alert('Please select a challenge');
      return;
    }

    if (!formData.mt5_login) {
      alert('Please enter MT5 login ID');
      return;
    }

    setCreating(true);

    try {
      // Update the selected challenge with MT5 credentials
      const { error: updateError } = await supabase
        .from('user_challenges')
        .update({
          trading_account_id: formData.mt5_login,
          trading_account_password: formData.mt5_password,
          trading_account_server: formData.mt5_server,
          status: 'credentials_given',
          credentials_sent: false
        })
        .eq('id', selectedChallenge.id);

      if (updateError) throw updateError;

      // Generate purchase certificate when credentials are assigned
      try {
        const { error: certError } = await supabase
          .from('downloads')
          .insert({
            user_id: selectedChallenge.user_id,
            challenge_id: selectedChallenge.id,
            document_type: 'certificate',
            title: 'Challenge Purchase Certificate',
            description: 'Certificate for purchasing challenge',
            document_number: `CERT-${Date.now()}`,
            issue_date: new Date().toISOString(),
            account_size: selectedChallenge.account_size,
            status: 'generated',
            auto_generated: true,
            generated_at: new Date().toISOString(),
            download_count: 0
          });

        if (certError) console.error('Error generating certificate:', certError);
      } catch (certError) {
        console.error('Certificate generation error:', certError);
      }

      alert('MT5 credentials assigned successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error assigning credentials:', error);
      alert('Failed to assign credentials');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="glass-card p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            <GradientText>Create MT5 Account</GradientText>
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded">
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-white/60">Loading...</div>
        ) : pendingChallenges.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-white/60 mb-4">No pending challenges found</p>
            <p className="text-sm text-white/50">All purchased challenges have been assigned MT5 credentials</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Select Pending Challenge *</label>
              <select
                value={selectedChallenge?.id || ''}
                onChange={(e) => handleChallengeSelect(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-electric-blue focus:outline-none"
              >
                <option value="">-- Select Challenge --</option>
                {pendingChallenges.map((challenge: any) => (
                  <option key={challenge.id} value={challenge.id} className="bg-deep-space">
                    {challenge.users?.email} - ${parseFloat(challenge.account_size).toLocaleString()} - {challenge.challenge_type_id}
                  </option>
                ))}
              </select>
            </div>

            {selectedChallenge && (
              <div className="p-4 bg-electric-blue/10 border border-electric-blue/30 rounded-lg">
                <h4 className="font-bold mb-2">Selected Challenge Details:</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-white/60">User:</span>
                    <div className="font-semibold">{selectedChallenge.users?.email}</div>
                  </div>
                  <div>
                    <span className="text-white/60">Account Size:</span>
                    <div className="font-semibold">${parseFloat(selectedChallenge.account_size).toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-white/60">Challenge Type:</span>
                    <div className="font-semibold">{selectedChallenge.challenge_type_id}</div>
                  </div>
                  <div>
                    <span className="text-white/60">Purchased:</span>
                    <div className="font-semibold">{new Date(selectedChallenge.purchase_date).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">MT5 Login *</label>
              <input
                type="text"
                value={formData.mt5_login}
                onChange={(e) => setFormData({ ...formData, mt5_login: e.target.value })}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-electric-blue focus:outline-none"
                placeholder="e.g., 1234567"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Password *</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={formData.mt5_password}
                  onChange={(e) => setFormData({ ...formData, mt5_password: e.target.value })}
                  required
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-electric-blue focus:outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, mt5_password: generatePassword() })}
                  className="px-4 py-3 bg-white/10 rounded-lg hover:bg-white/20"
                >
                  🎲
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">MT5 Server *</label>
            <input
              type="text"
              value={formData.mt5_server}
              onChange={(e) => setFormData({ ...formData, mt5_server: e.target.value })}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-electric-blue focus:outline-none"
              placeholder="e.g., MetaQuotes-Demo"
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-white/10 rounded-lg hover:bg-white/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedChallenge || creating}
              className="px-6 py-3 bg-gradient-to-r from-neon-green to-electric-blue rounded-lg font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {creating ? 'Assigning...' : 'Assign MT5 Credentials'}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}

function generatePassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function CertificateCard({ icon, title, description, userId }: any) {
  const [sending, setSending] = useState(false);

  const sendCertificate = async () => {
    setSending(true);
    try {
      const { error } = await supabase
        .from('downloads')
        .insert({
          user_id: userId,
          document_type: 'certificate',
          title,
          description,
          document_number: `MANUAL-${Date.now()}`,
          issue_date: new Date().toISOString(),
          status: 'generated',
          auto_generated: false,
          generated_at: new Date().toISOString(),
          download_count: 0
        });

      if (error) throw error;
      alert('Certificate sent successfully!');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to send certificate');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-xl p-6 border border-white/10 hover:border-electric-blue/50 transition-all">
      <div className="text-6xl mb-4 text-center">{icon}</div>
      <h4 className="text-lg font-bold mb-2 text-center">{title}</h4>
      <p className="text-white/60 text-sm mb-4 text-center">{description}</p>
      <button
        onClick={sendCertificate}
        disabled={sending}
        className="w-full btn-gradient disabled:opacity-50"
      >
        {sending ? 'Sending...' : 'Send Certificate'}
      </button>
    </div>
  );
}

function CertificatesTab({ users }: { users: any[] }) {
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [pendingCertificates, setPendingCertificates] = useState<any[]>([]);
  const [sentHistory, setSentHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'manual' | 'history'>('pending');

  useEffect(() => {
    loadCertificateData();
  }, [users]);

  async function loadCertificateData() {
    try {
      setLoading(true);
      
      // Get all sent certificates
      const { data: allCerts, error: certsError } = await supabase
        .from('downloads')
        .select('*')
        .eq('document_type', 'certificate')
        .order('created_at', { ascending: false });

      if (certsError) throw certsError;

      setSentHistory(allCerts || []);

      // Detect pending certificates
      const pending: any[] = [];

      for (const user of users) {
        // Check welcome certificate
        const hasWelcome = allCerts?.some(
          cert => cert.user_id === user.id && cert.title?.includes('Welcome')
        );

        if (!hasWelcome) {
          pending.push({
            user_id: user.id,
            user_email: user.email,
            user_name: user.user_metadata?.full_name || user.email,
            type: 'welcome',
            title: 'Welcome Certificate',
            reason: 'New user - needs welcome certificate',
            priority: 'high',
            icon: '🎉'
          });
        }

        // Check for active challenges
        const { data: userAccounts } = await supabase
          .from('mt5_accounts')
          .select('*')
          .eq('user_id', user.id);

        if (userAccounts && userAccounts.length > 0) {
          for (const account of userAccounts) {
            // Challenge started certificate
            if (account.status === 'active') {
              const hasStarted = allCerts?.some(
                cert => cert.user_id === user.id && 
                cert.certificate_data?.account_id === account.id &&
                cert.title?.includes('Challenge Started')
              );

              if (!hasStarted) {
                pending.push({
                  user_id: user.id,
                  user_email: user.email,
                  user_name: user.user_metadata?.full_name || user.email,
                  type: 'challenge_started',
                  title: 'Challenge Started',
                  reason: `Started ${account.account_type} - $${account.initial_balance}`,
                  priority: 'medium',
                  icon: '🚀',
                  account_id: account.id,
                  account_type: account.account_type,
                  account_size: account.initial_balance
                });
              }
            }

            // Challenge passed certificate
            if (account.status === 'passed') {
              const hasPassed = allCerts?.some(
                cert => cert.user_id === user.id && 
                cert.certificate_data?.account_id === account.id &&
                cert.title?.includes('Passed')
              );

              if (!hasPassed) {
                pending.push({
                  user_id: user.id,
                  user_email: user.email,
                  user_name: user.user_metadata?.full_name || user.email,
                  type: 'challenge_passed',
                  title: 'Challenge Passed',
                  reason: `Passed ${account.account_type} - $${account.initial_balance} 🎉`,
                  priority: 'high',
                  icon: '🏆',
                  account_id: account.id,
                  account_type: account.account_type,
                  account_size: account.initial_balance
                });
              }
            }
          }
        }
      }

      setPendingCertificates(pending);
    } catch (error) {
      console.error('Error loading certificate data:', error);
    } finally {
      setLoading(false);
    }
  }

  const searchUsers = (email: string) => {
    if (email.length < 3) {
      setSearchResults([]);
      return;
    }

    const filtered = users?.filter((u: any) =>
      u.email.toLowerCase().includes(email.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(email.toLowerCase())
    ) || [];

    setSearchResults(filtered.slice(0, 10));
  };

  async function handleSendCertificate(pendingItem: any) {
    try {
      let endpoint = 'http://localhost:5000/api/certificates/welcome';
      let body: any = { user_id: pendingItem.user_id };

      if (pendingItem.type === 'challenge_started' || pendingItem.type === 'challenge_passed') {
        endpoint = 'http://localhost:5000/api/certificates/challenge-started';
        body = {
          user_id: pendingItem.user_id,
          account_id: pendingItem.account_id,
          challenge_type: pendingItem.account_type,
          account_size: pendingItem.account_size
        };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (data.success) {
        alert(`✅ Certificate sent successfully to ${pendingItem.user_email}!`);
        loadCertificateData();
      } else {
        alert('❌ Failed: ' + data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Failed to send certificate');
    }
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">
        <GradientText>Smart Certificate Management</GradientText>
      </h2>
      <p className="text-white/70 mb-8">Automatically detects who needs certificates and tracks sent status</p>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'pending'
              ? 'bg-gradient-to-r from-electric-blue to-neon-purple'
              : 'bg-white/10 hover:bg-white/20'
          }`}
        >
          🔔 Pending ({pendingCertificates.length})
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'manual'
              ? 'bg-gradient-to-r from-electric-blue to-neon-purple'
              : 'bg-white/10 hover:bg-white/20'
          }`}
        >
          ✋ Manual Send
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'history'
              ? 'bg-gradient-to-r from-electric-blue to-neon-purple'
              : 'bg-white/10 hover:bg-white/20'
          }`}
        >
          📋 History ({sentHistory.length})
        </button>
      </div>

      {/* Pending Certificates Tab */}
      {activeTab === 'pending' && (
        <div>
          {loading ? (
            <div className="glass-card p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric-blue mx-auto mb-4"></div>
              <p className="text-white/60">Analyzing certificate requirements...</p>
            </div>
          ) : pendingCertificates.length > 0 ? (
            <div className="space-y-4">
              {pendingCertificates.map((item, idx) => (
                <div key={idx} className="glass-card p-6 border-l-4 border-yellow-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">{item.icon}</div>
                      <div>
                        <h4 className="text-lg font-bold">{item.title}</h4>
                        <p className="text-white/60 text-sm">{item.user_name} ({item.user_email})</p>
                        <p className="text-white/80 text-sm mt-1">{item.reason}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        item.priority === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {item.priority === 'high' ? '🔥 HIGH PRIORITY' : '⚡ MEDIUM'}
                      </span>
                      <button
                        onClick={() => handleSendCertificate(item)}
                        className="px-6 py-2 bg-gradient-to-r from-neon-green to-electric-blue rounded-lg font-semibold hover:scale-105 transition-transform"
                      >
                        📤 Send Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-12 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-xl font-bold mb-2">All Caught Up!</h3>
              <p className="text-white/60">No pending certificates to send</p>
            </div>
          )}
        </div>
      )}

      {/* Manual Send Tab */}
      {activeTab === 'manual' && (
        <div>
          <div className="glass-card p-8 mb-6">
        <h3 className="text-xl font-bold mb-4">Search User</h3>
        <div className="relative">
          <input
            type="text"
            placeholder="Search by email or name..."
            value={searchEmail}
            onChange={(e) => {
              setSearchEmail(e.target.value);
              searchUsers(e.target.value);
            }}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-electric-blue focus:outline-none"
          />

          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-deep-space border border-white/20 rounded-lg max-h-64 overflow-y-auto z-10">
              {searchResults.map(user => (
                <button
                  key={user.id}
                  onClick={() => {
                    setSelectedUser(user);
                    setSearchEmail(user.email);
                    setSearchResults([]);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-white/10 transition-all border-b border-white/5 last:border-0"
                >
                  <div className="font-semibold">{user.email}</div>
                  <div className="text-sm text-white/60">{user.full_name || 'N/A'} - ID: {user.id.slice(0, 8)}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedUser && (
        <div className="glass-card p-8 mb-6">
          <h3 className="text-xl font-bold mb-4">Selected User</h3>
          <div className="bg-white/5 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-white/60 text-sm">Email</div>
                <div className="font-bold">{selectedUser.email}</div>
              </div>
              <div>
                <div className="text-white/60 text-sm">Name</div>
                <div className="font-bold">{selectedUser.full_name || 'N/A'}</div>
              </div>
              <div>
                <div className="text-white/60 text-sm">User ID</div>
                <div className="font-mono text-sm">{selectedUser.id}</div>
              </div>
              <div>
                <div className="text-white/60 text-sm">Registered</div>
                <div className="font-bold">{new Date(selectedUser.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          <h4 className="text-lg font-bold mb-4">Send Certificate</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CertificateCard
              icon="🎉"
              title="Welcome Certificate"
              description="Send official welcome certificate"
              userId={selectedUser.id}
            />
            <CertificateCard
              icon="🏆"
              title="Challenge Passed"
              description="Certificate for passing challenge"
              userId={selectedUser.id}
            />
            <CertificateCard
              icon="💎"
              title="Funded Trader"
              description="Official funded trader certificate"
              userId={selectedUser.id}
            />
          </div>
        </div>
      )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="glass-card p-8">
          <h3 className="text-xl font-bold mb-6">Certificate History</h3>
          {sentHistory.length > 0 ? (
            <div className="space-y-3">
              {sentHistory.map((cert) => (
                <div key={cert.id} className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-neon-green/50 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">
                        {cert.title?.includes('Welcome') ? '🎉' : cert.title?.includes('Passed') ? '🏆' : '📄'}
                      </div>
                      <div>
                        <h4 className="font-bold">{cert.title}</h4>
                        <p className="text-sm text-white/60">{cert.description || 'No description'}</p>
                        <p className="text-xs text-white/40 mt-1">
                          Sent: {new Date(cert.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-neon-green/20 text-neon-green">
                        ✅ SENT
                      </span>
                      <span className="text-sm text-white/60">
                        Downloads: {cert.download_count || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">💭</div>
              <p className="text-white/60">No certificates sent yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


function CompetitionsTab({ users }: { users: any[] }) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreateCompetition = () => {
    setShowCreateModal(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold mb-2">
            <GradientText>Trading Competitions</GradientText>
          </h2>
          <p className="text-white/70">Create and manage trading competitions</p>
        </div>
        <button
          onClick={handleCreateCompetition}
          className="btn-gradient flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Create Competition</span>
        </button>
      </div>

      <div className="glass-card p-8 text-center">
        <Trophy size={64} className="mx-auto mb-4 text-white/30" />
        <h3 className="text-xl font-bold mb-2">No Competitions Yet</h3>
        <p className="text-white/60 mb-6">Create your first trading competition to engage your traders</p>
        <button
          onClick={handleCreateCompetition}
          className="btn-gradient"
        >
          Create First Competition
        </button>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="glass-card max-w-2xl w-full p-8 relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
            >
              <X size={24} />
            </button>

            <h3 className="text-2xl font-bold mb-6">
              <GradientText>Create Trading Competition</GradientText>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Competition Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-electric-blue focus:outline-none"
                  placeholder="e.g., Monthly Trading Championship"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-electric-blue focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-electric-blue focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Prize Pool</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-electric-blue focus:outline-none"
                  placeholder="10000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-electric-blue focus:outline-none resize-none"
                  placeholder="Enter competition details and rules..."
                />
              </div>

              <div className="flex items-center space-x-4 pt-4">
                <button
                  onClick={() => {
                    alert('Competition creation functionality will be implemented with backend integration');
                    setShowCreateModal(false);
                  }}
                  className="flex-1 btn-gradient py-3"
                >
                  Create Competition
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserProfilesTab({ users }: { users: any[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const searchUsers = (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    const filtered = users?.filter((u: any) =>
      u.email.toLowerCase().includes(query.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(query.toLowerCase())
    ) || [];

    setSearchResults(filtered.slice(0, 10));
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">
        <GradientText>User Profile 360°</GradientText>
      </h2>
      <p className="text-white/70 mb-8">Complete user information and trading history</p>

      <div className="glass-card p-8 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by email, name, or user ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              searchUsers(e.target.value);
            }}
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-electric-blue focus:outline-none"
          />

          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-deep-space border border-white/20 rounded-lg max-h-64 overflow-y-auto z-10">
              {searchResults.map(user => (
                <button
                  key={user.id}
                  onClick={() => {
                    setSelectedUser(user);
                    setSearchTerm(user.email);
                    setSearchResults([]);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-white/10 transition-all border-b border-white/5 last:border-0"
                >
                  <div className="font-semibold">{user.email}</div>
                  <div className="text-sm text-white/60">{user.full_name || 'N/A'} - ID: {user.id.slice(0, 8)}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedUser ? (
        <div className="glass-card p-8">
          <h3 className="text-2xl font-bold mb-6">{selectedUser.email}</h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-white/60 text-sm mb-1">Full Name</div>
              <div className="font-bold">{selectedUser.full_name || 'N/A'}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-white/60 text-sm mb-1">User ID</div>
              <div className="font-mono text-sm">{selectedUser.id.slice(0, 16)}...</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-white/60 text-sm mb-1">Registered</div>
              <div className="font-bold">{new Date(selectedUser.created_at).toLocaleDateString()}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-white/60 text-sm mb-1">Status</div>
              <div className="font-bold text-neon-green">Active</div>
            </div>
          </div>

          <p className="text-white/60 text-center py-8">Full user profile details coming soon</p>
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <User size={64} className="mx-auto mb-4 text-white/30" />
          <h3 className="text-xl font-bold mb-2">No User Selected</h3>
          <p className="text-white/60">Search for a user to view their complete profile</p>
        </div>
      )}
    </div>
  );
}

function ManualBreachTab({ users, accounts }: { users: any[]; accounts: any[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  const searchAccounts = (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    const filtered = accounts?.filter((acc: any) =>
      acc.mt5_login?.toLowerCase().includes(query.toLowerCase()) ||
      acc.user_email?.toLowerCase().includes(query.toLowerCase()) ||
      acc.unique_user_id?.toLowerCase().includes(query.toLowerCase())
    ) || [];

    setSearchResults(filtered.slice(0, 10));
  };

  return (
    <div>
      <div className="bg-red-500/10 border-2 border-red-500/50 rounded-xl p-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle size={24} className="text-red-500" />
          <h2 className="text-2xl font-bold text-red-500">Manual Account Breach</h2>
        </div>
        <p className="text-white/70">Use with caution - This action is irreversible</p>
      </div>

      <div className="glass-card p-8 mb-6">
        <h3 className="text-xl font-bold mb-4">Search Account</h3>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by Account ID, User email, or MT5 Login..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              searchAccounts(e.target.value);
            }}
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-red-500 focus:outline-none"
          />

          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-deep-space border border-white/20 rounded-lg max-h-64 overflow-y-auto z-10">
              {searchResults.map((account: any) => (
                <button
                  key={account.account_id}
                  onClick={() => {
                    setSelectedAccount(account);
                    setSearchTerm(`${account.user_email} - ${account.mt5_login}`);
                    setSearchResults([]);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-white/10 transition-all border-b border-white/5 last:border-0"
                >
                  <div className="font-semibold">{account.user_email}</div>
                  <div className="text-sm text-white/60">
                    MT5: {account.mt5_login} - ${parseFloat(account.account_size).toLocaleString()} - {account.account_type}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedAccount ? (
        <div className="glass-card p-8">
          <h3 className="text-xl font-bold mb-6">Selected Account</h3>

          <div className="bg-white/5 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-white/60 text-sm">User</div>
                <div className="font-bold">{selectedAccount.user_email}</div>
              </div>
              <div>
                <div className="text-white/60 text-sm">MT5 Login</div>
                <div className="font-bold">{selectedAccount.mt5_login}</div>
              </div>
              <div>
                <div className="text-white/60 text-sm">Account Size</div>
                <div className="font-bold">${parseFloat(selectedAccount.account_size).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-white/60 text-sm">Status</div>
                <div className={`font-bold ${selectedAccount.status === 'active' ? 'text-neon-green' : 'text-white/70'}`}>
                  {selectedAccount.status.toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
            <h4 className="text-lg font-bold mb-4 text-red-500">Breach This Account</h4>
            <p className="text-white/60 mb-4">Select a breach reason:</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {['Daily Loss Limit', 'Max Loss Limit', 'Consistency Rule', 'Copy Trading', 'Admin Decision', 'Other'].map(reason => (
                <button
                  key={reason}
                  className="px-4 py-3 bg-red-500/20 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all text-left"
                >
                  {reason}
                </button>
              ))}
            </div>
            <button className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-bold transition-all">
              Breach Account
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <AlertTriangle size={64} className="mx-auto mb-4 text-white/30" />
          <h3 className="text-xl font-bold mb-2">No Account Selected</h3>
          <p className="text-white/60">Search for an account to manually breach it</p>
        </div>
      )}
    </div>
  );
}

function AffiliatesManagementTab() {
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAffiliateData();
  }, []);

  async function loadAffiliateData() {
    try {
      // Fetch affiliates
      const { data: affiliatesData, error: affiliatesError } = await supabase
        .from('affiliates')
        .select('*')
        .order('created_at', { ascending: false });

      if (affiliatesError) throw affiliatesError;

      // Fetch payouts
      const { data: payoutsData, error: payoutsError } = await supabase
        .from('payouts')
        .select('*, affiliates(*)')
        .order('requested_at', { ascending: false });

      if (payoutsError) throw payoutsError;

      setAffiliates(affiliatesData || []);
      setPayouts(payoutsData || []);
    } catch (error) {
      console.error('Error loading affiliate data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handlePayoutAction(payoutId: string, action: 'approve' | 'reject') {
    try {
      const newStatus = action === 'approve' ? 'processing' : 'rejected';
      
      const { error } = await supabase
        .from('payouts')
        .update({ 
          status: newStatus,
          processed_at: new Date().toISOString()
        })
        .eq('id', payoutId);

      if (error) throw error;

      alert(`Payout ${action}d successfully!`);
      loadAffiliateData();
    } catch (error) {
      console.error('Error updating payout:', error);
      alert('Failed to update payout');
    }
  }

  const filteredAffiliates = affiliates.filter(aff => 
    aff.affiliate_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aff.user_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingPayouts = payouts.filter(p => p.status === 'pending');
  const totalEarnings = affiliates.reduce((sum, aff) => sum + (aff.total_earnings || 0), 0);
  const totalPaid = payouts
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">
            <GradientText>Affiliate Management</GradientText>
          </h2>
          <p className="text-white/60">Manage affiliates and payout requests</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="glass-card p-6">
          <div className="text-sm text-white/60 mb-2">Total Affiliates</div>
          <div className="text-3xl font-bold text-electric-blue">{affiliates.length}</div>
        </div>
        <div className="glass-card p-6">
          <div className="text-sm text-white/60 mb-2">Pending Payouts</div>
          <div className="text-3xl font-bold text-yellow-400">{pendingPayouts.length}</div>
        </div>
        <div className="glass-card p-6">
          <div className="text-sm text-white/60 mb-2">Total Earnings</div>
          <div className="text-3xl font-bold text-neon-green">${totalEarnings.toFixed(2)}</div>
        </div>
        <div className="glass-card p-6">
          <div className="text-sm text-white/60 mb-2">Total Paid</div>
          <div className="text-3xl font-bold text-neon-purple">${totalPaid.toFixed(2)}</div>
        </div>
      </div>

      {/* Pending Payouts */}
      {pendingPayouts.length > 0 && (
        <div className="glass-card p-6 mb-8">
          <h3 className="text-xl font-bold mb-4">Pending Payout Requests</h3>
          <div className="space-y-4">
            {pendingPayouts.map((payout) => (
              <div key={payout.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-yellow-500/30">
                <div>
                  <div className="font-semibold">${payout.amount.toFixed(2)}</div>
                  <div className="text-sm text-white/60">
                    Affiliate: {payout.affiliates?.affiliate_code || 'Unknown'}
                  </div>
                  <div className="text-xs text-white/40">
                    Requested: {new Date(payout.requested_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePayoutAction(payout.id, 'approve')}
                    className="px-4 py-2 bg-neon-green/20 text-neon-green rounded-lg hover:bg-neon-green/30 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handlePayoutAction(payout.id, 'reject')}
                    className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Affiliates List */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">All Affiliates</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" size={18} />
            <input
              type="text"
              placeholder="Search by code or user ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-electric-blue focus:outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-white/60">Loading affiliates...</div>
        ) : filteredAffiliates.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-white/60 font-semibold">Affiliate Code</th>
                  <th className="text-left py-3 px-4 text-white/60 font-semibold">Status</th>
                  <th className="text-right py-3 px-4 text-white/60 font-semibold">Referrals</th>
                  <th className="text-right py-3 px-4 text-white/60 font-semibold">Total Earnings</th>
                  <th className="text-right py-3 px-4 text-white/60 font-semibold">Available</th>
                  <th className="text-left py-3 px-4 text-white/60 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filteredAffiliates.map((affiliate) => (
                  <tr key={affiliate.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-4 font-mono text-sm">{affiliate.affiliate_code}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        affiliate.status === 'active' ? 'bg-neon-green/20 text-neon-green' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {affiliate.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">{affiliate.total_referrals || 0}</td>
                    <td className="py-3 px-4 text-right font-semibold text-neon-green">
                      ${(affiliate.total_earnings || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-electric-blue">
                      ${(affiliate.available_balance || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-sm text-white/60">
                      {new Date(affiliate.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-white/60">
            <Users size={64} className="mx-auto mb-4 opacity-30" />
            <p>No affiliates found</p>
          </div>
        )}
      </div>
    </div>
  );
}

function generateEmailHTML(account: MT5Account) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #0066FF, #7B2EFF); padding: 40px 20px; text-align: center; color: white;">
        <h1>Your MT5 Account is Ready!</h1>
      </div>
      <div style="padding: 40px 20px; background: #f9f9f9;">
        <h2>Account Details:</h2>
        <div style="background: white; padding: 20px; border-left: 4px solid #0066FF;">
          <p><strong>Login:</strong> ${account.mt5_login}</p>
          <p><strong>Password:</strong> ${account.mt5_password}</p>
          <p><strong>Server:</strong> ${account.mt5_server}</p>
          <p><strong>Account Type:</strong> ${account.account_type}</p>
          <p><strong>Balance:</strong> $${account.current_balance}</p>
        </div>
        <p style="margin-top: 20px;">Download MT5: <a href="https://www.metatrader5.com/en/download">Click Here</a></p>
      </div>
    </div>
  `;
}
