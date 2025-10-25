import { useState, useEffect, useMemo } from 'react';
import { supabase, oldSupabase } from '../lib/db';
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading data from BOTH databases...');
      
      // ========== NEW DATABASE ==========
      if (!supabase) {
        console.error('Supabase client is not initialized');
        setLoading(false);
        return;
      }
      // FIX: Reverted to RPC call which is the intended way for admins to fetch users.
      const { data: rpcData, error: newProfilesError } = await supabase.rpc('get_users_for_admin');

      if (newProfilesError) {
        console.error('❌ Error fetching NEW DB user profiles via RPC:', newProfilesError);
      }

      // Adapt the RPC data to the structure the component expects
      const newProfilesData = rpcData?.map((user: any) => {
        const [firstName, ...lastNameParts] = (user.full_name || '').split(' ');
        const lastName = lastNameParts.join(' ');
        return {
          user_id: user.id,
          id: user.id,
          email: user.email,
          first_name: firstName || user.email.split('@')[0],
          last_name: lastName || '',
          full_name: user.full_name || '',
          friendly_id: user.friendly_id,
          created_at: user.created_at,
          source: 'NEW DB',
        };
      });

      const { data: newChallengesData, error: newChallengesError } = await supabase
        .from('user_challenges')
        .select('*')
        .order('purchase_date', { ascending: false });

      if (newChallengesError) {
        console.error('❌ Error fetching NEW DB challenges:', newChallengesError);
      }

      console.log('✅ NEW Database: Found', newChallengesData?.length || 0, 'challenges');

      // ========== OLD DATABASE ==========
      let oldProfilesData = null;
      let oldChallengesData = null;
      
      try {
        if (oldSupabase) {
          const { data: profiles, error: oldProfilesError } = await oldSupabase
            .from('user_profiles')
            .select('user_id, first_name, last_name, friendly_id, email');
          
          if (oldProfilesError) {
            console.warn('⚠️ Error fetching OLD DB user profiles:', oldProfilesError.message);
          } else {
            oldProfilesData = profiles.map((p: any) => ({ ...p, source: 'OLD DB' }));
          }

          const { data: challenges, error: oldChallengesError } = await oldSupabase
            .from('user_challenges')
            .select('*')
            .order('purchase_date', { ascending: false });

          if (oldChallengesError) {
            console.warn('⚠️ Error fetching OLD DB challenges:', oldChallengesError.message);
          } else {
            oldChallengesData = challenges;
          }

          console.log('✅ OLD Database: Found', oldChallengesData?.length || 0, 'challenges');
        }
      } catch (oldDbError: any) {
        console.warn('⚠️ OLD Database unavailable:', oldDbError.message || 'Connection failed');
        console.log('📊 Continuing with NEW database only...');
      }

      // ========== MERGE DATA ==========
      // Merge profiles from both databases
      const allProfilesData = [...(newProfilesData || []), ...(oldProfilesData || [])];
      
      // Create a map of user info by user_id
      const profilesMap = new Map(allProfilesData.map((p: any) => [
        p.user_id, 
        {
          user_id: p.user_id,
          email: p.email || `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.friendly_id || 'User',
          first_name: p.first_name,
          last_name: p.last_name,
          friendly_id: p.friendly_id,
          full_name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
          source: p.source,
        }
      ]));

      // Merge challenges from both databases and add source tracking
      const newChallengesWithSource = (newChallengesData || []).map((c: any) => ({ ...c, _db_source: 'NEW' }));
      const oldChallengesWithSource = (oldChallengesData || []).map((c: any) => ({ ...c, _db_source: 'OLD' }));
      const challengesData = [...newChallengesWithSource, ...oldChallengesWithSource];

      console.log('📊 MERGED: Total challenges:', challengesData.length);
      console.log('   - From NEW DB:', newChallengesData?.length || 0);
      console.log('   - From OLD DB:', oldChallengesData?.length || 0);

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
        const profile = profilesMap.get(c.user_id);
        const email = profile?.email || 'Unknown';
        const name = profile?.full_name || email.split('@')[0] || 'N/A';
        
        return {
          id: c.id,
          user_id: c.user_id,
          user_email: email,
          user_name: name,
          friendly_id: profile?.friendly_id || 'N/A',
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
        const profile = profilesMap.get(c.user_id);
        const email = profile?.email || 'Unknown';
        const name = profile?.full_name || email.split('@')[0] || 'N/A';
        
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
          user_email: email,
          user_name: name,
          unique_user_id: c.trading_account_id
        };
      }) || [];

      setAccounts(formattedAccounts);

      // Create users list from all unique user_ids in profiles
      const usersData = allProfilesData.map(p => ({
        id: p.user_id,
        user_id: p.user_id,
        email: p.email,
        full_name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
        friendly_id: p.friendly_id,
        source: p.source,
        created_at: p.created_at,
      }));
      setUsers(usersData);
      
      setLoading(false);
      setError(null);
      
      console.log('✅ Data loaded successfully:', {
        users: usersData.length,
        accounts: formattedAccounts.length,
        pendingChallenges: pending.length,
        totalChallenges: challengesData.length
      });
    } catch (error: any) {
      console.error('❌ Error loading data:', error);
      setError(error.message || 'Failed to load data. Please check console for details.');
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

function AccountsTab({ accounts, pendingChallenges, searchTerm, setSearchTerm, setShowCreateModal, loadData }: { accounts: MT5Account[], pendingChallenges: any[], searchTerm: string, setSearchTerm: (term: string) => void, setShowCreateModal: (show: boolean) => void, loadData: () => void }) {
  const filteredAccounts = accounts.filter((acc: MT5Account) =>
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
              value={accounts.filter((a: MT5Account) => a.status === 'active').length}
              icon="✅"
              color="green"
            />
            <StatCard
              label="Total Balance"
              value={`$${accounts.reduce((sum: number, a: MT5Account) => sum + Number(a.current_balance), 0).toLocaleString()}`}
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
                {pendingChallenges.map((challenge: any) => (
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
                {filteredAccounts.map((account: MT5Account) => (
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

function StatCard({ label, value, icon, color }: { label: string, value: string | number, icon: string, color: string }) {
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
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
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
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { data: existingMT5, error: checkError } = await supabase
        .from('mt5_accounts')
        .select('id')
        .eq('user_id', account.user_id)
        .eq('account_number', account.mt5_login)
        .single();

      if (!existingMT5) {
        // Create new MT5 account entry
        if (!supabase) {
          throw new Error('Supabase client is not initialized');
        }
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

function CredentialField({ label, value, onCopy, copied, showPassword, onTogglePassword }: { label: string, value: string, onCopy?: () => void, copied?: boolean, showPassword?: boolean, onTogglePassword?: () => void }) {
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

function CreateAccountModal({ users, onClose, onSuccess }: { users: any[], onClose: () => void, onSuccess: () => void }) {
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
      console.log('🔄 Loading pending challenges from BOTH databases...');
      
      // NEW DATABASE
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { data: newChallenges, error: newChallengesError } = await supabase
        .from('user_challenges')
        .select('*')
        .is('trading_account_id', null)
        .neq('status', 'pending_payment')
        .order('purchase_date', { ascending: false });

      if (newChallengesError) {
        console.error('Error loading NEW DB challenges:', newChallengesError);
      }

      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { data: rpcData, error: newProfilesError } = await supabase.rpc('get_users_for_admin');

      if (newProfilesError) {
        console.warn('Could not load NEW DB user profiles via RPC:', newProfilesError);
      }
      
      const newProfilesData = rpcData?.map((user: any) => {
        const [firstName, ...lastNameParts] = (user.full_name || '').split(' ');
        const lastName = lastNameParts.join(' ');
        return {
          user_id: user.id,
          email: user.email,
          first_name: firstName || user.email.split('@')[0],
          last_name: lastName || '',
          friendly_id: null,
          ...user,
        };
      });

      // OLD DATABASE
      let oldChallenges = null;
      let oldProfilesData = null;
      
      try {
        if (oldSupabase) {
          const { data: challenges, error: oldChallengesError } = await oldSupabase
            .from('user_challenges')
            .select('*')
            .is('trading_account_id', null)
            .neq('status', 'pending_payment')
            .order('purchase_date', { ascending: false });

          if (oldChallengesError) {
            console.warn('Error loading OLD DB challenges:', oldChallengesError.message);
          } else {
            oldChallenges = challenges;
          }

          const { data: profiles, error: oldProfilesError } = await oldSupabase
            .from('user_profiles')
            .select('user_id, first_name, last_name, friendly_id');

          if (oldProfilesError) {
            console.warn('Could not load OLD DB user profiles:', oldProfilesError.message);
          } else {
            oldProfilesData = profiles;
          }
        }
      } catch (oldDbError: any) {
        console.warn('⚠️ OLD Database unavailable for pending challenges:', oldDbError.message || 'Connection failed');
      }

      // Merge profiles
      const allProfilesData = [...(newProfilesData || []), ...(oldProfilesData || [])];
      const usersMap = new Map(allProfilesData.map((p: any) => [
        p.user_id,
        {
          id: p.user_id,
          email: p.email || `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.friendly_id || 'Unknown',
          full_name: `${p.first_name || ''} ${p.last_name || ''}`.trim()
        }
      ]));

      // Merge challenges and add source tracking
      const newChallengesWithSource = (newChallenges || []).map((c: any) => ({ ...c, _db_source: 'NEW' }));
      const oldChallengesWithSource = (oldChallenges || []).map((c: any) => ({ ...c, _db_source: 'OLD' }));
      const allChallenges = [...newChallengesWithSource, ...oldChallengesWithSource];

      console.log('✅ Pending challenges - NEW DB:', newChallenges?.length || 0, '| OLD DB:', oldChallenges?.length || 0);

      // Merge user data with challenges
      const enrichedChallenges = allChallenges.map(challenge => {
        const user = usersMap.get(challenge.user_id);
        return {
          ...challenge,
          users: {
            email: user?.email || 'Unknown',
            full_name: user?.full_name || 'N/A'
          }
        };
      });

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
      // Determine which database to use based on challenge source
      const dbClient = selectedChallenge._db_source === 'OLD' ? oldSupabase : supabase;
      const dbName = selectedChallenge._db_source === 'OLD' ? 'OLD DB' : 'NEW DB';
      
      if (!dbClient) {
        throw new Error('Database client is not initialized');
      }

      console.log(`💾 Assigning credentials to ${dbName}...`);

      // Update the selected challenge with MT5 credentials
      const { error: updateError } = await dbClient
        .from('user_challenges')
        .update({
          trading_account_id: formData.mt5_login,
          trading_account_password: formData.mt5_password,
          trading_account_server: formData.mt5_server,
          status: 'active',  // Valid statuses: 'active', 'passed', 'failed', 'funded', 'breached'
          credentials_sent: false
        })
        .eq('id', selectedChallenge.id);

      if (updateError) {
        console.error(`❌ Error updating ${dbName}:`, updateError);
        throw updateError;
      }

      console.log(`✅ Credentials assigned successfully in ${dbName}`);

      // Generate purchase certificate when credentials are assigned
      try {
        if (!dbClient) {
          throw new Error('Database client is not initialized');
        }
        const { error: certError } = await dbClient
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

        if (certError) {
          console.warn('Error generating certificate:', certError);
        } else {
          console.log('✅ Certificate generated');
        }
      } catch (certError) {
        console.error('Certificate generation error:', certError);
      }

      alert(`✅ MT5 credentials assigned successfully in ${dbName}!`);
      onSuccess();
    } catch (error: any) {
      console.error('Error assigning credentials:', error);
      alert(`❌ Failed to assign credentials: ${error.message || 'Unknown error'}`);
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
                    [{challenge._db_source}] {challenge.users?.email} - ${parseFloat(challenge.account_size).toLocaleString()} - {challenge.challenge_type_id}
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

// Reusable Searchable User Dropdown Component
function SearchableUserDropdown({ onSelect, selectedUser, users: propUsers }: { onSelect: (user: any) => void; selectedUser: any; users?: any[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Use users from props if available, otherwise empty array
  const users = propUsers || [];

  const filteredUsers = useMemo(() => {
    if (searchTerm.length === 0) {
      return users;
    }
    return users.filter((u: any) =>
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.friendly_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, users]);

  return (
    <div className="relative">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:border-electric-blue transition-colors flex items-center justify-between"
      >
        <span className={selectedUser ? 'text-white' : 'text-white/50'}>
          {selectedUser ? `${selectedUser.email} (${selectedUser.friendly_id})` : 'Select a user...'}
        </span>
        <Search size={20} className="text-white/40" />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-deep-space border border-white/20 rounded-lg max-h-96 overflow-hidden z-50 shadow-2xl">
          <div className="p-3 border-b border-white/10 sticky top-0 bg-deep-space">
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-electric-blue focus:outline-none text-sm"
              autoFocus
            />
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-white/60">Loading users...</div>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user: any) => (
                <button
                  key={user.user_id}
                  onClick={() => {
                    onSelect(user);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-white/10 transition-all border-b border-white/5 last:border-0"
                >
                 <div className="flex items-center justify-between">
 <div className="font-semibold text-white">{user.email}</div>
 <span className={`px-2 py-0.5 rounded text-xs font-bold ${
 user.source === 'NEW DB'
 ? 'bg-neon-green/20 text-neon-green'
 : 'bg-electric-blue/20 text-electric-blue'
 }`}>
 {user.source}
 </span>
 </div>
                  <div className="text-sm text-white/60 flex items-center gap-2">
                    <span>{user.full_name || 'N/A'}</span>
                    <span>•</span>
                    <span className="font-mono text-xs">ID: {user.friendly_id}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-white/60">No users found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CertificateCard({ icon, title, description, userId }: { icon: string, title: string, description: string, userId: string }) {
  const [sending, setSending] = useState(false);

  const sendCertificate = async () => {
    setSending(true);
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
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
  const [selectedUser, setSelectedUser] = useState<any>(null);
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
      
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
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
            user_name: user.full_name || user.email,
            type: 'welcome',
            title: 'Welcome Certificate',
            reason: 'New user - needs welcome certificate',
            priority: 'high',
            icon: '🎉'
          });
        }

        // Check for active challenges
        if (!supabase) {
          throw new Error('Supabase client is not initialized');
        }
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
                  user_name: user.full_name || user.email,
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
                  user_name: user.full_name || user.email,
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

  
  

  async function handleSendCertificate(pendingItem: any) {
    try {
      const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api';
      let endpoint = `${API_URL}/certificates/welcome`;
      let body: any = { user_id: pendingItem.user_id };

      if (pendingItem.type === 'challenge_started' || pendingItem.type === 'challenge_passed') {
        endpoint = `${API_URL}/certificates/challenge-started`;
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
              {pendingCertificates.map((item) => (
                <div key={item.user_id + item.type} className="glass-card p-6 border-l-4 border-yellow-500">
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
            <h3 className="text-xl font-bold mb-4">Select User</h3>
            <SearchableUserDropdown 
              onSelect={setSelectedUser}
              selectedUser={selectedUser}
              users={users}
            />
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
                <div className="font-bold">{selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : 'N/A'}</div>
              </div>
            </div>
          </div>

          <h4 className="text-lg font-bold mb-4">Send Certificate</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CertificateCard
              key="welcome-cert"
              icon="🎉"
              title="Welcome Certificate"
              description="Send official welcome certificate"
              userId={selectedUser.id}
            />
            <CertificateCard
              key="passed-cert"
              icon="🏆"
              title="Challenge Passed"
              description="Certificate for passing challenge"
              userId={selectedUser.id}
            />
            <CertificateCard
              key="funded-cert"
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
 const [selectedUser, setSelectedUser] = useState<any>(null);

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">
        <GradientText>User Profile 360°</GradientText>
      </h2>
      <p className="text-white/70 mb-8">Complete user information and trading history</p>

      <div className="glass-card p-8 mb-6">
        <h3 className="text-xl font-bold mb-4">Select User</h3>
        <SearchableUserDropdown 
          onSelect={setSelectedUser}
          selectedUser={selectedUser}
          users={users}
        />
      </div>

      {selectedUser && (
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
     
      )}
    </div>
  );
}

function ManualBreachTab({ users, accounts }: { users: any[]; accounts: any[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const searchAccounts = (query: string) => {
    if (!selectedUser) {
      setSearchResults([]);
      return;
    }

    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    // Filter accounts for the selected user only
    const userAccounts = accounts?.filter((acc: any) => acc.user_id === selectedUser.id) || [];
    
    const filtered = userAccounts.filter((acc: any) =>
      acc.mt5_login?.toLowerCase().includes(query.toLowerCase()) ||
      acc.user_email?.toLowerCase().includes(query.toLowerCase()) ||
      acc.account_type?.toLowerCase().includes(query.toLowerCase())
    );

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
        <h3 className="text-xl font-bold mb-4">Select User First</h3>
        <SearchableUserDropdown
          onSelect={setSelectedUser}
          selectedUser={selectedUser}
          users={users}
        />
      </div>
      {selectedUser && (
        <div className="glass-card p-8 mb-6">
          <h3 className="text-xl font-bold mb-4">Search Account for {selectedUser.email}</h3>
          
          {accounts?.filter(acc => acc.user_id === selectedUser.id).length === 0 ? (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 text-center">
              <AlertTriangle size={48} className="mx-auto mb-3 text-yellow-500" />
              <h4 className="font-bold text-yellow-500 mb-2">No Accounts Found</h4>
              <p className="text-white/60 text-sm">This user has no MT5 accounts to breach.</p>
            </div>
          ) : (
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
          )}
        </div>
      )}

      {selectedUser && (
        selectedAccount ? (
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
        )
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
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      // Fetch affiliates
      const { data: affiliatesData, error: affiliatesError } = await supabase
        .from('affiliates')
        .select('*')
        .order('created_at', { ascending: false });

      if (affiliatesError) throw affiliatesError;

      // Fetch payouts
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      // FIX: Fetch payouts and affiliates separately and join them manually
      const { data: payoutsData, error: payoutsError } = await supabase
        .from('payouts')
        .select('*')
        .order('requested_at', { ascending: false });

      if (payoutsError) throw payoutsError;

      // Manually join affiliate data into payouts
      const enrichedPayouts = payoutsData?.map(payout => {
        const affiliate = affiliatesData?.find(aff => aff.id === payout.affiliate_id);
        return {
          ...payout,
          affiliates: affiliate || null, // Nest affiliate data like the original query
        };
      });

      setAffiliates(affiliatesData || []);
      setPayouts(enrichedPayouts || []);
    } catch (error) {
      console.error('Error loading affiliate data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handlePayoutAction(payoutId: string, action: 'approve' | 'reject') {
    try {
      const newStatus = action === 'approve' ? 'processing' : 'rejected';
      
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
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
