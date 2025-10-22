import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  DollarSign,
  Award,
  FileText,
  Trophy,
  Users,
  CreditCard,
  UserPlus,
  Calendar,
  Download,
  Clock,
  HelpCircle,
  CheckCircle,
  Settings,
  LogOut,
  Eye,
  EyeOff,
  Copy,
  Check,
  BarChart3,
  TrendingUp,
  Activity
} from 'lucide-react';
import GradientText from '../components/ui/GradientText';
import { supabase } from '../lib/db';
import { signOut } from '../lib/auth';
import ContractAcceptance from '../components/dashboard/ContractAcceptance';
import AccountStatusBadge from '../components/dashboard/AccountStatusBadge';
import EnhancedSettings from '../components/dashboard/EnhancedSettings';
import Analytics3DBackground from '../components/dashboard/Analytics3DBackground';
import AccountCard from '../components/dashboard/AccountCard';
import { generateContractText } from '../config/contractText';

type Section =
  | 'overview'
  | 'analytics'
  | 'payouts'
  | 'certificates'
  | 'contracts'
  | 'competitions'
  | 'leaderboard'
  | 'billing'
  | 'affiliates'
  | 'calendar'
  | 'downloads'
  | 'faq'
  | 'settings';

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate('/login');
        return;
      }

      setUser(user);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      navigate('/login');
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white text-xl">Loading...</p>
      </div>
    );
  }

  const navItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Account Overview' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'payouts', icon: DollarSign, label: 'Payouts' },
    { id: 'certificates', icon: Award, label: 'Certificates' },
    { id: 'contracts', icon: FileText, label: 'Contracts' },
    { id: 'competitions', icon: Trophy, label: 'Competitions' },
    { id: 'leaderboard', icon: Users, label: 'Leaderboard' },
    { id: 'billing', icon: CreditCard, label: 'Billing' },
    { id: 'affiliates', icon: UserPlus, label: 'Affiliates' },
    { id: 'calendar', icon: Calendar, label: 'Economic Calendar' },
    { id: 'downloads', icon: Download, label: 'Downloads' },
    { id: 'faq', icon: HelpCircle, label: 'FAQ' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen pt-20 px-4 pb-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="grid lg:grid-cols-[280px,1fr] gap-6">
          <aside className="glass-card p-6 h-fit sticky top-24">
            <div className="text-center mb-6 pb-6 border-b border-white/10">
              <div className="w-20 h-20 bg-gradient-to-br from-electric-blue to-neon-purple rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm text-white/70">{user?.email}</p>
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id as Section)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      activeSection === item.id
                        ? 'bg-gradient-to-r from-electric-blue to-neon-purple text-white'
                        : 'text-white/70 hover:bg-white/5'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
              <button
                onClick={() => navigate('/challenge-types')}
                className="w-full px-4 py-3 bg-gradient-to-r from-neon-green to-electric-blue rounded-lg font-semibold text-sm hover:scale-105 transition-transform"
              >
                Purchase New Challenge
              </button>

              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 rounded-lg font-semibold text-sm hover:bg-white/20 transition-colors"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </aside>

          <main className="glass-card p-8">
            {activeSection === 'overview' && <OverviewSection user={user} />}
            {activeSection === 'analytics' && <AnalyticsSection user={user} />}
            {activeSection === 'payouts' && <PayoutsSection user={user} />}
            {activeSection === 'certificates' && <CertificatesSection user={user} />}
            {activeSection === 'contracts' && <ContractsSection user={user} />}
            {activeSection === 'competitions' && <CompetitionsSection user={user} />}
            {activeSection === 'leaderboard' && <LeaderboardSection user={user} />}
            {activeSection === 'billing' && <BillingSection user={user} />}
            {activeSection === 'affiliates' && <AffiliatesSection user={user} />}
            {activeSection === 'calendar' && <CalendarSection />}
            {activeSection === 'downloads' && <DownloadsSection />}
            {activeSection === 'faq' && <FAQSection />}
            {activeSection === 'settings' && <SettingsSection user={user} />}
          </main>
        </div>
      </div>
    </div>
  );
}

function OverviewSection({ user }: { user: any }) {
  const [stats, setStats] = useState<any>(null);
  const [mt5Accounts, setMt5Accounts] = useState<any[]>([]);
  const [pendingChallenges, setPendingChallenges] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [showContractModal, setShowContractModal] = useState(false);
  const [unsignedChallenge, setUnsignedChallenge] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const { data: challenges } = await supabase
        .from('user_challenges')
        .select(`
          *,
          challenge_type:challenge_types(challenge_name, challenge_code)
        `)
        .eq('user_id', user.id)
        .order('purchase_date', { ascending: false });

      // Check for unsigned contracts on first visit
      const unsigned = challenges?.find(c => !c.contract_signed && c.trading_account_id);
      if (unsigned) {
        setUnsignedChallenge(unsigned);
        setShowContractModal(true);
      }

      // Separate challenges into pending (no credentials) and active (has credentials)
      const pending = challenges?.filter(c =>
        !c.trading_account_id ||
        c.status === 'pending_payment' ||
        c.status === 'pending_credentials'
      ) || [];

      const active = challenges?.filter(c =>
        c.trading_account_id &&
        c.status !== 'pending_payment' &&
        c.status !== 'pending_credentials'
      ).map(c => ({
        account_id: c.id,
        user_id: c.user_id,
        mt5_login: c.trading_account_id,
        mt5_password: c.trading_account_password || 'Not Set',
        mt5_server: c.trading_account_server || 'MetaQuotes-Demo',
        account_type: c.challenge_type?.challenge_name || c.challenge_type_id || 'Standard',
        account_size: c.account_size,
        leverage: '1:100',
        current_balance: c.account_size,
        status: c.status,
        created_at: c.purchase_date,
        challenge_info: c.challenge_type,
        credentials_visible: c.credentials_visible || c.credentials_sent || false,
        contract_signed: c.contract_signed || false
      })) || [];

      setPendingChallenges(pending);
      setMt5Accounts(active);

      // Set first active account as selected by default
      if (active.length > 0 && !selectedAccountId) {
        setSelectedAccountId(active[0].account_id);
      }

      // Calculate real stats from active accounts
      const totalBalance = active.reduce((sum, acc) => sum + parseFloat(acc.current_balance || acc.account_size), 0);
      const totalAccountSize = active.reduce((sum, acc) => sum + parseFloat(acc.account_size), 0);
      const totalProfit = totalBalance - totalAccountSize;

      setStats({
        balance: totalBalance,
        profit: totalProfit,
        accounts: active.length,
        pending: pending.length,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const selectedAccount = mt5Accounts.find(acc => acc.account_id === selectedAccountId);

  const handleContractAccept = async () => {
    if (!unsignedChallenge) return;

    try {
      const contractText = generateContractText({
        fullName: user.user_metadata?.full_name || user.email || 'Trader',
        email: user.email || '',
        country: 'N/A',
        challengeType: unsignedChallenge.challenge_type?.challenge_name || 'Standard',
        accountSize: unsignedChallenge.account_size,
        purchasePrice: unsignedChallenge.amount_paid || 0,
        profitTarget: 10,
        maxDailyLoss: 5,
        maxTotalLoss: 10
      });

      // Create contract record
      const { error: contractError } = await supabase
        .from('contracts')
        .insert({
          user_id: user.id,
          challenge_id: unsignedChallenge.id,
          contract_text: contractText,
          contract_version: '1.0',
          signed_at: new Date().toISOString(),
          ip_address: 'N/A',
          user_agent: navigator.userAgent,
          full_name: user.user_metadata?.full_name || user.email || 'Trader',
          email: user.email
        });

      if (contractError) {
        console.error('Contract creation error:', contractError);
      }

      // Update user_challenges
      const { error } = await supabase
        .from('user_challenges')
        .update({
          contract_signed: true,
          credentials_visible: true,
          credentials_released_at: new Date().toISOString()
        })
        .eq('id', unsignedChallenge.id);

      if (error) throw error;

      // Generate purchase certificate
      await generatePurchaseCertificate(unsignedChallenge);

      setShowContractModal(false);
      fetchData();

      // Show success message
      alert('Contract signed successfully! Your MT5 credentials are now visible.');
    } catch (error) {
      console.error('Error accepting contract:', error);
      alert('Failed to accept contract. Please try again.');
    }
  };

  const generatePurchaseCertificate = async (challenge: any) => {
    try {
      const { error } = await supabase
        .from('downloads')
        .insert({
          user_id: user.id,
          challenge_id: challenge.id,
          document_type: 'certificate',
          title: 'Challenge Purchase Certificate',
          description: `Certificate for purchasing ${challenge.challenge_type?.challenge_name || 'Challenge'}`,
          document_number: `CERT-${Date.now()}`,
          issue_date: new Date().toISOString(),
          challenge_type: challenge.challenge_type?.challenge_name,
          account_size: challenge.account_size,
          status: 'generated',
          auto_generated: true,
          generated_at: new Date().toISOString(),
          download_count: 0
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error generating certificate:', error);
    }
  };

  return (
    <div>
      {showContractModal && unsignedChallenge && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 max-w-4xl w-full border border-white/10 shadow-2xl my-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-3xl font-bold mb-2">
                  <GradientText>Trading Challenge Agreement</GradientText>
                </h2>
                <p className="text-white/60 text-sm">Please read carefully and accept to activate your account</p>
              </div>
              <button
                onClick={() => setShowContractModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Check size={24} />
              </button>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-yellow-400">
                <Activity size={20} />
                <span className="font-semibold">Legal Binding Contract</span>
              </div>
              <p className="text-white/70 text-sm mt-1">
                Your MT5 credentials will be released immediately after signing this agreement
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-6 mb-6 max-h-[500px] overflow-y-auto border border-white/10 font-mono text-xs leading-relaxed">
              <pre className="whitespace-pre-wrap text-white/80">
                {generateContractText({
                  fullName: user.user_metadata?.full_name || user.email || 'Trader',
                  email: user.email || '',
                  country: 'N/A',
                  challengeType: unsignedChallenge.challenge_type?.challenge_name || 'Standard',
                  accountSize: unsignedChallenge.account_size,
                  purchasePrice: unsignedChallenge.amount_paid || 0,
                  profitTarget: 10,
                  maxDailyLoss: 5,
                  maxTotalLoss: 10
                })}
              </pre>
            </div>

            <div className="bg-white/5 rounded-lg p-6 mb-6 border border-white/10">
              <h3 className="text-xl font-bold mb-4 text-white">Electronic Acknowledgment</h3>
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="mt-1">
                    <CheckCircle size={20} className="text-neon-green" />
                  </div>
                  <span className="text-white/70 text-sm">
                    I have READ and UNDERSTAND this entire Agreement
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="mt-1">
                    <CheckCircle size={20} className="text-neon-green" />
                  </div>
                  <span className="text-white/70 text-sm">
                    I AGREE to all Terms and Conditions
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="mt-1">
                    <CheckCircle size={20} className="text-neon-green" />
                  </div>
                  <span className="text-white/70 text-sm">
                    I am OVER 18 years of age
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="mt-1">
                    <CheckCircle size={20} className="text-neon-green" />
                  </div>
                  <span className="text-white/70 text-sm">
                    I understand the Challenge Fee is NON-REFUNDABLE
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="mt-1">
                    <CheckCircle size={20} className="text-neon-green" />
                  </div>
                  <span className="text-white/70 text-sm">
                    This is a LEGALLY BINDING electronic contract
                  </span>
                </label>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleContractAccept}
                className="flex-1 px-8 py-4 bg-gradient-to-r from-electric-blue to-neon-purple rounded-lg font-bold text-lg hover:scale-105 transition-transform shadow-lg"
              >
                I Accept and Sign Contract
              </button>
              <button
                onClick={() => setShowContractModal(false)}
                className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-lg font-semibold transition-colors"
              >
                Review Later
              </button>
            </div>

            <p className="text-center text-white/50 text-xs mt-4">
              By clicking "I Accept and Sign Contract", you electronically sign this agreement
            </p>
          </div>
        </div>
      )}

      <h1 className="text-4xl font-bold mb-2">
        <GradientText>Account Overview</GradientText>
      </h1>
      <p className="text-white/70 mb-8">Welcome back! Here's your trading performance summary</p>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-electric-blue/20 to-neon-purple/20 rounded-xl p-6 border border-white/10">
          <div className="text-sm text-white/60 mb-2">Total Balance</div>
          <div className="text-3xl font-bold mb-2">${stats?.balance.toLocaleString() || '0.00'}</div>
          <div className="text-sm text-neon-green">Active Accounts: {stats?.accounts || 0}</div>
        </div>

        <div className="bg-gradient-to-br from-neon-green/20 to-electric-blue/20 rounded-xl p-6 border border-white/10">
          <div className="text-sm text-white/60 mb-2">Total Profit</div>
          <div className="text-3xl font-bold mb-2">
            ${Math.abs(stats?.profit || 0).toLocaleString()}
          </div>
          <div className={`text-sm ${stats?.profit >= 0 ? 'text-neon-green' : 'text-red-400'}`}>
            {stats?.profit >= 0 ? '+' : '-'}
            {stats?.balance && stats?.balance !== stats?.profit
              ? ((Math.abs(stats?.profit || 0) / (stats?.balance - (stats?.profit || 0))) * 100).toFixed(2)
              : '0.00'}%
          </div>
        </div>

        <div className="bg-gradient-to-br from-neon-purple/20 to-electric-blue/20 rounded-xl p-6 border border-white/10">
          <div className="text-sm text-white/60 mb-2">Challenge Status</div>
          <div className="text-3xl font-bold mb-2">
            {mt5Accounts.length > 0 ? 'Active' : 'Pending'}
          </div>
          <div className="text-sm text-white/60">
            {mt5Accounts.length > 0 ? 'MT5 Accounts Ready' : 'Awaiting Setup'}
          </div>
        </div>
      </div>

      {pendingChallenges.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 mb-6">
          <h3 className="text-2xl font-bold mb-2 text-yellow-400">⏳ Pending Challenges</h3>
          <p className="text-white/70 mb-4">Your challenges are being set up. Admin will assign MT5 credentials soon.</p>
          <div className="space-y-3">
            {pendingChallenges.map((challenge) => (
              <div key={challenge.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-lg">User ID: {challenge.unique_user_id}</div>
                    <div className="text-sm text-white/60">
                      ${parseFloat(challenge.account_size).toLocaleString()} Account
                    </div>
                    <div className="text-xs text-white/50 mt-1">
                      Created: {new Date(challenge.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm font-semibold">
                      Awaiting Credentials
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {mt5Accounts.length > 0 ? (
        <>
          {/* Accounts Grid */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">My Trading Accounts</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mt5Accounts.map(acc => (
                <AccountCard
                  key={acc.account_id}
                  account={acc}
                  onClick={() => setSelectedAccountId(acc.account_id)}
                />
              ))}
            </div>
          </div>

          {selectedAccount && selectedAccount.status && (
            <div className="mb-6">
              <AccountStatusBadge status={selectedAccount.status} size="lg" />
            </div>
          )}

          {selectedAccount && selectedAccount.status === 'awaiting_contract' && (
            <ContractAcceptance
              accountId={selectedAccount.account_id}
              accountSize={parseFloat(selectedAccount.account_size)}
              accountType={selectedAccount.account_type}
              onAccepted={() => fetchData()}
            />
          )}

          {selectedAccount && selectedAccount.status === 'contract_signed' && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-8 mb-6 text-center">
              <Clock size={64} className="mx-auto mb-4 text-blue-400" />
              <h3 className="text-2xl font-bold mb-2">Contract Accepted!</h3>
              <p className="text-white/70 mb-4">
                Your contract has been signed. Our admin team is preparing your MT5 credentials.
              </p>
              <p className="text-sm text-white/50">
                You will receive your login details within 24 hours. Check back soon!
              </p>
            </div>
          )}

          {selectedAccount && (selectedAccount.status === 'credentials_given' || selectedAccount.status === 'active') && selectedAccount.mt5_login && !selectedAccount.credentials_visible && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-8 mb-6 text-center">
              <Clock size={64} className="mx-auto mb-4 text-yellow-400" />
              <h3 className="text-2xl font-bold mb-2">Credentials Pending Release</h3>
              <p className="text-white/70 mb-4">
                Your MT5 credentials have been assigned but not yet released by admin.
              </p>
              <p className="text-sm text-white/50">
                Please sign your contract or wait for admin to release your credentials.
              </p>
            </div>
          )}

          {selectedAccount && (selectedAccount.status === 'credentials_given' || selectedAccount.status === 'active') && selectedAccount.mt5_login && selectedAccount.credentials_visible && (
            <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold">MT5 Account Credentials</h3>
                  <p className="text-white/60 text-sm mt-1">Use these credentials to login to MetaTrader 5</p>
                </div>
                <a
                  href="https://www.metatrader5.com/en/download"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gradient-to-r from-electric-blue to-neon-purple rounded-lg font-semibold hover:scale-105 transition-transform flex items-center gap-2"
                >
                  <Download size={16} />
                  Download MT5
                </a>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-white/70">Account Type</label>
                  <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg font-mono">
                    {selectedAccount.account_type.toUpperCase()}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-white/70">Account Size</label>
                  <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg font-mono">
                    ${parseFloat(selectedAccount.account_size).toLocaleString()}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-white/70">Login ID</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg font-mono">
                      {selectedAccount.mt5_login}
                    </div>
                    <button
                      onClick={() => copyToClipboard(selectedAccount.mt5_login, 'login')}
                      className="px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg transition-colors"
                    >
                      {copied === 'login' ? <Check size={20} className="text-neon-green" /> : <Copy size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-white/70">Password</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg font-mono">
                      {showPassword ? selectedAccount.mt5_password : '••••••••'}
                    </div>
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(selectedAccount.mt5_password, 'password')}
                      className="px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg transition-colors"
                    >
                      {copied === 'password' ? <Check size={20} className="text-neon-green" /> : <Copy size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-white/70">Server</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg font-mono">
                      {selectedAccount.mt5_server}
                    </div>
                    <button
                      onClick={() => copyToClipboard(selectedAccount.mt5_server, 'server')}
                      className="px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg transition-colors"
                    >
                      {copied === 'server' ? <Check size={20} className="text-neon-green" /> : <Copy size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-white/70">Leverage</label>
                  <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg font-mono">
                    1:{selectedAccount.leverage}
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-electric-blue/10 border border-electric-blue/30 rounded-lg">
                <p className="text-sm text-white/80">
                  <strong>Important:</strong> Keep your credentials secure. Download MT5, use the server address, login ID, and password above to access your trading account.
                </p>
              </div>
            </div>
          )}

          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-xl font-bold mb-4">All Your MT5 Accounts</h3>
            <div className="space-y-4">
              {mt5Accounts.map((account) => (
                <div
                  key={account.account_id}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                    account.account_id === selectedAccountId
                      ? 'bg-electric-blue/10 border-electric-blue/50'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div>
                    <div className="font-bold text-lg">MT5 #{account.mt5_login}</div>
                    <div className="text-sm text-white/60">
                      {account.account_type.toUpperCase()} - ${parseFloat(account.account_size).toLocaleString()} - {account.mt5_server}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xl">
                      ${parseFloat(account.current_balance).toLocaleString()}
                    </div>
                    <div
                      className={`text-sm ${
                        parseFloat(account.current_balance) >= parseFloat(account.initial_balance)
                          ? 'text-neon-green'
                          : 'text-red-400'
                      }`}
                    >
                      {parseFloat(account.current_balance) >= parseFloat(account.initial_balance)
                        ? '+'
                        : ''}
                      $
                      {(parseFloat(account.current_balance) - parseFloat(account.initial_balance)).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white/5 rounded-xl p-12 border border-white/10 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-2xl font-bold mb-2">No MT5 Accounts Yet</h3>
          <p className="text-white/60 mb-6">
            Your MT5 account will be created after purchasing a challenge. Contact support if you need assistance.
          </p>
          <button
            onClick={() => navigate('/challenge-types')}
            className="px-6 py-3 bg-gradient-to-r from-neon-green to-electric-blue rounded-lg font-semibold hover:scale-105 transition-transform"
          >
            Purchase Challenge
          </button>
        </div>
      )}
    </div>
  );
}

function AnalyticsSection({ user }: { user: any }) {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [mt5Accounts, setMt5Accounts] = useState<any[]>([]);
  const [realTimeData, setRealTimeData] = useState<any>(null);
  const [allTrades, setAllTrades] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | 'ALL'>('ALL');
  const [activeView, setActiveView] = useState<'overview' | 'trades' | 'positions'>('overview');

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccountId) {
      fetchRealTimeData();
      const interval = setInterval(fetchRealTimeData, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedAccountId]);

  async function fetchAccounts() {
    try {
      const { data: challenges } = await supabase
        .from('user_challenges')
        .select('*')
        .eq('user_id', user.id)
        .not('trading_account_id', 'is', null)
        .eq('credentials_sent', true);

      const accounts = challenges?.map(c => ({
        id: c.id,
        login: c.trading_account_id,
        accountSize: c.account_size,
        accountType: c.challenge_type_id
      })) || [];

      setMt5Accounts(accounts);
      if (accounts.length > 0) {
        setSelectedAccountId(accounts[0].id);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  }

  async function fetchRealTimeData() {
    if (!selectedAccountId) return;

    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      // Fetch real-time data
      const [dataRes, tradesRes, positionsRes] = await Promise.all([
        fetch(`${apiUrl}/api/analytics/mt5-data/${user.id}`),
        fetch(`${apiUrl}/api/analytics/all-trades/${user.id}`),
        fetch(`${apiUrl}/api/analytics/positions/${user.id}`)
      ]);

      if (dataRes.ok) {
        const result = await dataRes.json();
        if (result.success && result.data) {
          setRealTimeData({
            ...result.data,
            isLiveData: true
          });
        }
      }

      if (tradesRes.ok) {
        const tradesResult = await tradesRes.json();
        if (tradesResult.success) {
          setAllTrades(tradesResult.data || []);
        }
      }

      if (positionsRes.ok) {
        const positionsResult = await positionsRes.json();
        if (positionsResult.success) {
          setPositions(positionsResult.data || []);
        }
      }
    } catch (error) {
      console.warn('Analytics not available:', error);
      setRealTimeData(null);
    } finally {
      setLoading(false);
    }
  }

  const selectedAccount = mt5Accounts.find(a => a.account_id === selectedAccountId);

  return (
    <div className="relative min-h-screen">
      {/* Animated 3D Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-deep-space via-deep-space/95 to-deep-space"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-electric-blue/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-neon-green/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header with 3D effect */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-2">
              <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-electric-blue via-neon-purple to-neon-green animate-gradient">
                Trading Analytics
              </h1>
              <p className="text-white/60 text-lg">Real-time performance metrics powered by MetaAPI</p>
            </div>
            {realTimeData && (
              <div className="flex flex-col items-end space-y-3">
                <div className={`flex items-center space-x-3 px-6 py-3 rounded-2xl backdrop-blur-xl border-2 ${
                  realTimeData.isLiveData ? 
                  'bg-neon-green/10 border-neon-green/30 shadow-lg shadow-neon-green/20' : 
                  'bg-yellow-500/10 border-yellow-500/30 shadow-lg shadow-yellow-500/20'
                }`}>
                  <div className={`w-3 h-3 rounded-full ${
                    realTimeData.isLiveData ? 'bg-neon-green animate-pulse' : 'bg-yellow-500'
                  }`}></div>
                  <span className="font-semibold">{realTimeData.isLiveData ? '🟢 Live Data' : '🟡 Static Data'}</span>
                </div>
                <div className="text-sm text-white/50">
                  Last update: {new Date(realTimeData.lastUpdate).toLocaleTimeString()}
                </div>
              </div>
            )}
          </div>

          {/* View Switcher with 3D tabs */}
          <div className="flex space-x-2 p-2 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
            {[
              { id: 'overview', label: '📊 Overview', icon: BarChart3 },
              { id: 'trades', label: '💹 All Trades', icon: TrendingUp, badge: allTrades.length },
              { id: 'positions', label: '🎯 Open Positions', icon: Target, badge: positions.length }
            ].map((view) => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 rounded-xl font-semibold transition-all duration-300 ${
                  activeView === view.id
                    ? 'bg-gradient-to-r from-electric-blue to-neon-purple text-white shadow-lg shadow-electric-blue/50 scale-105'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-xl">{view.label.split(' ')[0]}</span>
                <span>{view.label.split(' ').slice(1).join(' ')}</span>
                {view.badge !== undefined && (
                  <span className="px-2 py-1 bg-neon-green/20 text-neon-green rounded-full text-xs font-bold">
                    {view.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {mt5Accounts.length === 0 ? (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-8 text-center">
          <BarChart3 size={64} className="mx-auto mb-4 text-yellow-500" />
          <h3 className="text-2xl font-bold mb-2">No Active Accounts</h3>
          <p className="text-white/70">Purchase a challenge to start tracking your trading analytics</p>
        </div>
      ) : (
        <>
          {mt5Accounts.length > 1 && (
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-3">Select Account</label>
              <select
                value={selectedAccountId || ''}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full max-w-md px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-electric-blue focus:outline-none"
              >
                {mt5Accounts.map(acc => (
                  <option key={acc.account_id} value={acc.account_id} className="bg-deep-space">
                    MT5 #{acc.mt5_login} - ${parseFloat(acc.account_size).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
          )}

          {loading && !realTimeData ? (
            <div className="text-center py-12">
              <Activity size={48} className="animate-spin mx-auto mb-4 text-electric-blue" />
              <p className="text-white/70">Loading analytics data...</p>
            </div>
          ) : realTimeData ? (
            <>
              {/* Overview Section */}
              {activeView === 'overview' && (
                <div className="space-y-6">
                  {/* 3D Stat Cards */}
                  <div className="grid md:grid-cols-4 gap-6">
                    {/* Balance Card */}
                    <div className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-electric-blue to-neon-purple rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                      <div className="relative bg-gradient-to-br from-electric-blue/10 to-neon-purple/10 backdrop-blur-2xl rounded-2xl p-6 border border-white/20 hover:border-electric-blue/50 transition-all duration-500 hover:scale-105 hover:-translate-y-2 hover:shadow-2xl hover:shadow-electric-blue/30">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 bg-electric-blue/20 rounded-xl">
                            <DollarSign className="text-electric-blue" size={24} />
                          </div>
                          <div className="text-xs px-3 py-1 bg-white/10 rounded-full">Initial</div>
                        </div>
                        <div className="text-sm text-white/60 mb-2">Account Balance</div>
                        <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-electric-blue to-white">
                          ${parseFloat(realTimeData.balance).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Equity Card */}
                    <div className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-neon-green to-electric-blue rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                      <div className="relative bg-gradient-to-br from-neon-green/10 to-electric-blue/10 backdrop-blur-2xl rounded-2xl p-6 border border-white/20 hover:border-neon-green/50 transition-all duration-500 hover:scale-105 hover:-translate-y-2 hover:shadow-2xl hover:shadow-neon-green/30">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 bg-neon-green/20 rounded-xl">
                            <TrendingUp className="text-neon-green" size={24} />
                          </div>
                          <div className={`text-xs px-3 py-1 rounded-full ${
                            parseFloat(realTimeData.profitPercentage) >= 0 ? 'bg-neon-green/20 text-neon-green' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {realTimeData.profitPercentage}%
                          </div>
                        </div>
                        <div className="text-sm text-white/60 mb-2">Current Equity</div>
                        <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-green to-white">
                          ${parseFloat(realTimeData.equity).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* P&L Card */}
                    <div className="group relative">
                      <div className={`absolute inset-0 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity ${
                        parseFloat(realTimeData.profit) >= 0 ? 'bg-gradient-to-r from-neon-green to-electric-blue' : 'bg-gradient-to-r from-red-500 to-orange-500'
                      }`}></div>
                      <div className={`relative backdrop-blur-2xl rounded-2xl p-6 border border-white/20 transition-all duration-500 hover:scale-105 hover:-translate-y-2 hover:shadow-2xl ${
                        parseFloat(realTimeData.profit) >= 0 
                          ? 'bg-gradient-to-br from-neon-green/10 to-electric-blue/10 hover:border-neon-green/50 hover:shadow-neon-green/30' 
                          : 'bg-gradient-to-br from-red-500/10 to-orange-500/10 hover:border-red-500/50 hover:shadow-red-500/30'
                      }`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 rounded-xl ${
                            parseFloat(realTimeData.profit) >= 0 ? 'bg-neon-green/20' : 'bg-red-500/20'
                          }`}>
                            <Activity className={parseFloat(realTimeData.profit) >= 0 ? 'text-neon-green' : 'text-red-400'} size={24} />
                          </div>
                          <div className="text-xs px-3 py-1 bg-white/10 rounded-full">
                            {parseFloat(realTimeData.profit) >= 0 ? 'Profit' : 'Loss'}
                          </div>
                        </div>
                        <div className="text-sm text-white/60 mb-2">Total P&L</div>
                        <div className={`text-4xl font-bold ${
                          parseFloat(realTimeData.profit) >= 0 ? 'text-neon-green' : 'text-red-400'
                        }`}>
                          {parseFloat(realTimeData.profit) >= 0 ? '+' : '-'}${Math.abs(parseFloat(realTimeData.profit)).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Open Trades Card */}
                    <div className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-neon-purple rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                      <div className="relative bg-gradient-to-br from-orange-500/10 to-neon-purple/10 backdrop-blur-2xl rounded-2xl p-6 border border-white/20 hover:border-orange-500/50 transition-all duration-500 hover:scale-105 hover:-translate-y-2 hover:shadow-2xl hover:shadow-orange-500/30">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 bg-orange-500/20 rounded-xl">
                            <Target className="text-orange-500" size={24} />
                          </div>
                          <div className="text-xs px-3 py-1 bg-white/10 rounded-full">Active</div>
                        </div>
                        <div className="text-sm text-white/60 mb-2 group-hover:text-white/80 transition-colors">Open Positions</div>
                        <div className="text-3xl font-bold mb-2">{realTimeData.openTrades}</div>
                        <div className="text-xs text-white/50">Active Trades</div>
                      </div>
                    </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-xl font-bold mb-4 flex items-center">
                    <Activity className="mr-2 text-electric-blue" size={20} />
                    Account Metrics
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-white/10">
                      <span className="text-white/70">Margin Used</span>
                      <span className="font-bold">${parseFloat(realTimeData.margin).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-white/10">
                      <span className="text-white/70">Free Margin</span>
                      <span className="font-bold text-neon-green">${parseFloat(realTimeData.freeMargin).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-white/10">
                      <span className="text-white/70">Margin Level</span>
                      <span className="font-bold">{realTimeData.marginLevel}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Max Drawdown</span>
                      <span className="font-bold text-red-400">{realTimeData.maxDrawdown}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-xl font-bold mb-4 flex items-center">
                    <TrendingUp className="mr-2 text-neon-green" size={20} />
                    Performance Stats
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-white/10">
                      <span className="text-white/70">Total Trades</span>
                      <span className="font-bold">{realTimeData.totalTrades}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-white/10">
                      <span className="text-white/70">Win Rate</span>
                      <span className="font-bold text-neon-green">{realTimeData.winRate}%</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-white/10">
                      <span className="text-white/70">Profit Factor</span>
                      <span className="font-bold">{realTimeData.profitFactor}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Sharpe Ratio</span>
                      <span className="font-bold text-electric-blue">{realTimeData.sharpeRatio}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-6">
                <h3 className="text-xl font-bold mb-4">Trade Statistics</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-sm text-white/60 mb-2">Average Win</div>
                    <div className="text-2xl font-bold text-neon-green">${parseFloat(realTimeData.averageWin).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-white/60 mb-2">Average Loss</div>
                    <div className="text-2xl font-bold text-red-400">${parseFloat(realTimeData.averageLoss).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-white/60 mb-2">Risk/Reward Ratio</div>
                    <div className="text-2xl font-bold text-electric-blue">
                      {(parseFloat(realTimeData.averageWin) / parseFloat(realTimeData.averageLoss)).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              <div className={`rounded-xl p-6 border ${realTimeData?.isLiveData === false ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30' : 'bg-gradient-to-r from-electric-blue/10 to-neon-purple/10 border-electric-blue/30'}`}>
                <div className="flex items-start space-x-4">
                  <Activity className={`mt-1 ${realTimeData?.isLiveData === false ? 'text-yellow-500' : 'text-electric-blue'}`} size={24} />
                  <div>
                    <h4 className="font-bold text-lg mb-2">
                      {realTimeData?.isLiveData === false ? 'Account Information' : 'Real-Time Data Integration'}
                    </h4>
                    <p className="text-white/70 text-sm">
                      {realTimeData?.isLiveData === false
                        ? 'Currently displaying simulated trading data. Once your MT5 credentials are activated, this will show real-time trading metrics from MetaTrader 5.'
                        : 'This analytics dashboard displays real-time data from your MT5 trading account via Supabase Edge Function. Data is refreshed every 5 seconds to provide you with up-to-the-minute trading insights.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}
        </>
      ) : (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 text-center backdrop-blur-sm">
          <Activity size={64} className="mx-auto mb-4 text-red-500" />
              <h3 className="text-2xl font-bold mb-2">Unable to Load Real-Time Data</h3>
              <p className="text-white/70 mb-4">Failed to fetch MT5 data. Please ensure:</p>
              <ul className="text-left max-w-md mx-auto text-white/60 space-y-2">
                <li>• MT5 account credentials have been assigned by admin</li>
                <li>• Your account is active and properly configured</li>
                <li>• You have a stable internet connection</li>
            </ul>
            <button
              onClick={() => fetchRealTimeData()}
              className="mt-6 px-6 py-3 bg-gradient-to-r from-electric-blue to-neon-purple rounded-lg font-semibold hover:scale-105 transition-transform"
            >
              Retry Connection
            </button>
          </div>
        )}
        </>
      )}
      </div>
    </div>
  );
}

function PayoutsSection({ user }: { user: any }) {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-2">
        <GradientText>Payouts</GradientText>
      </h1>
      <p className="text-white/70 mb-8">Manage your withdrawal requests and payout history</p>

      <div className="bg-gradient-to-r from-neon-green/20 to-electric-blue/20 rounded-xl p-8 mb-8 border border-white/10">
        <div className="text-sm text-white/60 mb-2">Available for Withdrawal</div>
        <div className="text-4xl font-bold text-neon-green mb-6">$0.00</div>
        <button className="px-6 py-3 bg-gradient-to-r from-neon-green to-electric-blue rounded-lg font-semibold hover:scale-105 transition-transform">
          Request Withdrawal
        </button>
      </div>

      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <h3 className="text-xl font-bold mb-4">Payout History</h3>
        <div className="text-center py-8 text-white/60">
          <p>No payout history yet</p>
        </div>
      </div>
    </div>
  );
}

function CertificatesSection({ user }: { user: any }) {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-2">
        <GradientText>Certificates</GradientText>
      </h1>
      <p className="text-white/70 mb-8">Your achievements and certifications</p>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white/5 rounded-xl p-6 border border-white/10 text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-xl font-bold mb-2">Funded Trader Certificate</h3>
          <p className="text-white/60 text-sm mb-4">Available after funding</p>
          <button className="px-6 py-2 bg-white/10 rounded-lg text-sm opacity-50 cursor-not-allowed">
            Not Available
          </button>
        </div>

        <div className="bg-white/5 rounded-xl p-6 border border-white/10 text-center">
          <div className="text-6xl mb-4">📜</div>
          <h3 className="text-xl font-bold mb-2">Challenge Completion</h3>
          <p className="text-white/60 text-sm mb-4">Complete challenge to unlock</p>
          <button className="px-6 py-2 bg-white/10 rounded-lg text-sm opacity-50 cursor-not-allowed">
            Not Available
          </button>
        </div>
      </div>
    </div>
  );
}

function ContractsSection({ user }: { user: any }) {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContracts();
  }, []);

  async function fetchContracts() {
    try {
      const { data: challenges, error: challengesError } = await supabase
        .from('user_challenges')
        .select('*')
        .eq('user_id', user.id)
        .eq('contract_signed', true)
        .order('purchase_date', { ascending: false });

      if (challengesError) throw challengesError;

      // Get challenge types separately
      const { data: challengeTypes, error: typesError } = await supabase
        .from('challenge_types')
        .select('*');

      if (typesError) throw typesError;

      const typesMap = new Map(challengeTypes?.map((t: any) => [t.id, t]) || []);

      // Merge challenge type data
      const enrichedContracts = challenges?.map(challenge => {
        const challengeType = typesMap.get(challenge.challenge_type_id);
        return {
          ...challenge,
          challenge_type: {
            challenge_name: challengeType?.challenge_name || 'Unknown Challenge'
          }
        };
      }) || [];

      setContracts(enrichedContracts);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-4xl font-bold mb-2">
        <GradientText>Contracts & Agreements</GradientText>
      </h1>
      <p className="text-white/70 mb-8">Your signed contracts and legal agreements</p>

      {loading ? (
        <div className="text-center py-12 text-white/60">Loading contracts...</div>
      ) : contracts.length > 0 ? (
        <div className="space-y-6">
          {contracts.map((contract) => (
            <div key={contract.id} className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-2">
                    {contract.challenge_type?.challenge_name || 'Trading Challenge'} Agreement
                  </h3>
                  <p className="text-white/60 text-sm">
                    Account Size: ${parseFloat(contract.account_size).toLocaleString()}
                  </p>
                  <p className="text-white/60 text-sm">
                    Signed: {contract.contract_signed_at ? new Date(contract.contract_signed_at).toLocaleString() : new Date(contract.purchase_date).toLocaleString()}
                  </p>
                  <p className="text-white/50 text-xs mt-1">Challenge ID: {contract.id.slice(0, 8)}...</p>
                </div>
                <span className={`px-4 py-2 rounded-lg text-sm font-semibold bg-neon-green/20 text-neon-green`}>
                  Signed
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-sm text-white/60 mb-1">Full Name</div>
                  <div className="font-semibold">{contract.full_name}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-sm text-white/60 mb-1">Email</div>
                  <div className="font-semibold">{contract.email}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-sm text-white/60 mb-1">Signed From IP</div>
                  <div className="font-mono text-sm">{contract.signature_ip_address}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-sm text-white/60 mb-1">Electronic Signature</div>
                  <div className="font-semibold italic">{contract.electronic_signature}</div>
                </div>
              </div>

              {contract.pdf_url && (
                <button className="px-6 py-3 bg-gradient-to-r from-electric-blue to-neon-purple rounded-lg font-semibold hover:scale-105 transition-transform flex items-center gap-2">
                  <Download size={16} />
                  Download Contract PDF
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/5 rounded-xl p-12 border border-white/10 text-center">
          <FileText size={64} className="mx-auto mb-4 text-white/30" />
          <h3 className="text-2xl font-bold mb-2">No Contracts Yet</h3>
          <p className="text-white/60">You haven't signed any contracts yet. Complete a challenge purchase to sign your first contract.</p>
        </div>
      )}
    </div>
  );
}

function CompetitionsSection({ user }: { user: any }) {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-2">
        <GradientText>Competitions</GradientText>
      </h1>
      <p className="text-white/70 mb-8">Join trading competitions and win prizes</p>

      <div className="text-center py-12 text-white/60">
        <Trophy size={64} className="mx-auto mb-4 opacity-50" />
        <p>No active competitions at this time</p>
        <p className="text-sm mt-2">Check back soon for upcoming trading competitions!</p>
      </div>
    </div>
  );
}

function LeaderboardSection({ user }: { user: any }) {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  async function fetchLeaderboard() {
    try {
      const { data, error } = await supabase.rpc('get_leaderboard');

      if (error) {
        console.warn('Leaderboard not available:', error.message);
        setLeaderboard([]);
        setLoading(false);
        return;
      }
      setLeaderboard(data || []);
    } catch (error) {
      console.warn('Leaderboard feature not available');
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-4xl font-bold mb-2">
        <GradientText>Leaderboard</GradientText>
      </h1>
      <p className="text-white/70 mb-8">Top performing traders this month</p>

      {loading ? (
        <div className="text-center py-12 text-white/60">Loading...</div>
      ) : leaderboard.length > 0 ? (
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-electric-blue to-neon-purple">
              <tr>
                <th className="px-6 py-4 text-left">Rank</th>
                <th className="px-6 py-4 text-left">Trader</th>
                <th className="px-6 py-4 text-right">Balance</th>
                <th className="px-6 py-4 text-right">Profit</th>
                <th className="px-6 py-4 text-right">ROI</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((trader, index) => (
                <tr
                  key={trader.user_id}
                  className={`border-t border-white/10 ${
                    trader.user_id === user.id ? 'bg-neon-green/10' : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                        index === 0
                          ? 'bg-yellow-500 text-black'
                          : index === 1
                          ? 'bg-gray-300 text-black'
                          : index === 2
                          ? 'bg-orange-600 text-white'
                          : 'bg-white/10'
                      }`}
                    >
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold">
                      {trader.user_id === user.id ? 'You' : trader.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-bold">
                    ${parseFloat(trader.total_balance).toLocaleString()}
                  </td>
                  <td
                    className={`px-6 py-4 text-right font-bold ${
                      parseFloat(trader.total_profit) >= 0 ? 'text-neon-green' : 'text-red-400'
                    }`}
                  >
                    {parseFloat(trader.total_profit) >= 0 ? '+' : ''}$
                    {parseFloat(trader.total_profit).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-electric-blue">
                    {trader.roi}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-white/60">
          <p>No leaderboard data available yet</p>
        </div>
      )}
    </div>
  );
}

function BillingSection({ user }: { user: any }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'purchase' | 'payout' | 'refund'>('all');

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  async function fetchTransactions() {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  }

  const totals = transactions.reduce((acc, txn) => {
    if (txn.status === 'completed') {
      acc.spent += parseFloat(txn.amount) || 0;
    }
    return acc;
  }, { spent: 0, earned: 0 });

  return (
    <div>
      <h1 className="text-4xl font-bold mb-2">
        <GradientText>Billing & Transactions</GradientText>
      </h1>
      <p className="text-white/70 mb-8">View your complete payment history and invoices</p>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-xl p-6 border border-white/10">
          <div className="text-sm text-white/60 mb-2">Total Spent</div>
          <div className="text-3xl font-bold mb-2">${totals.spent.toLocaleString()}</div>
          <div className="text-sm text-white/60">Challenge Purchases</div>
        </div>

        <div className="bg-gradient-to-br from-neon-green/20 to-electric-blue/20 rounded-xl p-6 border border-white/10">
          <div className="text-sm text-white/60 mb-2">Total Earned</div>
          <div className="text-3xl font-bold text-neon-green mb-2">${totals.earned.toLocaleString()}</div>
          <div className="text-sm text-white/60">Payouts Received</div>
        </div>

        <div className="bg-gradient-to-br from-electric-blue/20 to-neon-purple/20 rounded-xl p-6 border border-white/10">
          <div className="text-sm text-white/60 mb-2">Total Transactions</div>
          <div className="text-3xl font-bold mb-2">{transactions.length}</div>
          <div className="text-sm text-white/60">All Time</div>
        </div>
      </div>

      <div className="mb-6 flex gap-2">
        {['all', 'purchase', 'payout', 'refund'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              filter === f
                ? 'bg-gradient-to-r from-electric-blue to-neon-purple'
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-white/60">Loading transactions...</div>
      ) : transactions.length > 0 ? (
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-electric-blue to-neon-purple">
                <tr>
                  <th className="px-6 py-4 text-left">Transaction ID</th>
                  <th className="px-6 py-4 text-left">Type</th>
                  <th className="px-6 py-4 text-left">Description</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => (
                  <tr key={txn.id} className="border-t border-white/10 hover:bg-white/5">
                    <td className="px-6 py-4 font-mono text-sm text-electric-blue">
                      {txn.transaction_id || txn.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-semibold bg-neon-purple/20 text-neon-purple`}>
                        Purchase
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {txn.notes || 'Challenge Purchase'}
                    </td>
                    <td className={`px-6 py-4 text-right font-bold text-lg text-white`}>
                      ${parseFloat(txn.amount || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                        txn.status === 'completed' ? 'bg-neon-green/20 text-neon-green' :
                        txn.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {txn.status || 'Completed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-white/70">
                      {new Date(txn.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white/5 rounded-xl p-12 border border-white/10 text-center">
          <CreditCard size={64} className="mx-auto mb-4 text-white/30" />
          <h3 className="text-2xl font-bold mb-2">No Transactions Yet</h3>
          <p className="text-white/60">Your transaction history will appear here once you make a purchase.</p>
        </div>
      )}
    </div>
  );
}

function AffiliatesSection({ user }: { user: any }) {
  const [affiliateData, setAffiliateData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutHistory, setPayoutHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchAffiliateData();
    fetchPayoutHistory();
  }, []);

  async function fetchAffiliateData() {
    try {
      // First, create affiliate account if doesn't exist
      const createRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/affiliates/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      });
      
      const createData = await createRes.json();
      
      // Then fetch stats
      const statsRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/affiliates/stats/${user.id}`);
      const statsData = await statsRes.json();
      
      if (statsData.success) {
        setAffiliateData(statsData.data);
      }
    } catch (error) {
      console.error('Error fetching affiliate data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPayoutHistory() {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/affiliates/payouts/${user.id}`);
      const data = await res.json();
      if (data.success) {
        setPayoutHistory(data.data);
      }
    } catch (error) {
      console.error('Error fetching payout history:', error);
    }
  }

  async function handleCopyLink() {
    const referralLink = `${window.location.origin}?ref=${affiliateData?.affiliate_code}`;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRequestPayout() {
    if (!payoutAmount || parseFloat(payoutAmount) < 100) {
      alert('Minimum payout amount is $100');
      return;
    }

    setPayoutLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/affiliates/request-payout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          amount: parseFloat(payoutAmount)
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('Payout request submitted successfully!');
        setPayoutAmount('');
        fetchAffiliateData();
        fetchPayoutHistory();
      } else {
        alert(data.error || 'Failed to request payout');
      }
    } catch (error) {
      console.error('Error requesting payout:', error);
      alert('Failed to request payout');
    } finally {
      setPayoutLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-electric-blue/20 border-t-electric-blue rounded-full animate-spin mx-auto"></div>
        <p className="text-white/60 mt-4">Loading affiliate data...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-4xl font-bold mb-2">
        <GradientText>Affiliate Program</GradientText>
      </h1>
      <p className="text-white/70 mb-8">Earn 10% commission by referring new traders</p>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-neon-green/20 to-electric-blue/20 rounded-xl p-6 border border-white/10">
          <div className="text-sm text-white/60 mb-2">Total Referrals</div>
          <div className="text-3xl font-bold text-neon-green">{affiliateData?.total_referrals || 0}</div>
        </div>

        <div className="bg-gradient-to-br from-electric-blue/20 to-neon-purple/20 rounded-xl p-6 border border-white/10">
          <div className="text-sm text-white/60 mb-2">Active Referrals</div>
          <div className="text-3xl font-bold text-electric-blue">{affiliateData?.active_referrals || 0}</div>
        </div>

        <div className="bg-gradient-to-br from-neon-purple/20 to-cyber-purple/20 rounded-xl p-6 border border-white/10">
          <div className="text-sm text-white/60 mb-2">Total Earnings</div>
          <div className="text-3xl font-bold text-neon-purple">${(affiliateData?.total_earnings || 0).toFixed(2)}</div>
        </div>

        <div className="bg-gradient-to-br from-cyber-purple/20 to-neon-green/20 rounded-xl p-6 border border-white/10">
          <div className="text-sm text-white/60 mb-2">Available Balance</div>
          <div className="text-3xl font-bold text-cyber-purple">${(affiliateData?.available_balance || 0).toFixed(2)}</div>
        </div>
      </div>

      {/* Referral Link */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-8">
        <h3 className="text-xl font-bold mb-4">Your Referral Link</h3>
        <div className="flex gap-4">
          <input
            type="text"
            value={`${window.location.origin}?ref=${affiliateData?.affiliate_code || 'LOADING'}`}
            readOnly
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg"
          />
          <button
            onClick={handleCopyLink}
            className="px-6 py-3 bg-gradient-to-r from-electric-blue to-neon-purple rounded-lg font-semibold hover:scale-105 transition-transform flex items-center gap-2"
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="text-sm text-white/60 mt-4">
          Share this link with traders. You'll earn 10% commission on their first purchase!
        </p>
      </div>

      {/* Request Payout */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-8">
        <h3 className="text-xl font-bold mb-4">Request Payout</h3>
        <div className="flex gap-4">
          <input
            type="number"
            value={payoutAmount}
            onChange={(e) => setPayoutAmount(e.target.value)}
            placeholder="Enter amount (min $100)"
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg"
          />
          <button
            onClick={handleRequestPayout}
            disabled={payoutLoading || !payoutAmount || parseFloat(payoutAmount) < 100}
            className="px-6 py-3 bg-gradient-to-r from-neon-green to-electric-blue rounded-lg font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
          >
            {payoutLoading ? 'Processing...' : 'Request Payout'}
          </button>
        </div>
        <p className="text-sm text-white/60 mt-4">
          Available balance: ${(affiliateData?.available_balance || 0).toFixed(2)} • Minimum payout: $100
        </p>
      </div>

      {/* Payout History */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <h3 className="text-xl font-bold mb-4">Payout History</h3>
        {payoutHistory.length > 0 ? (
          <div className="space-y-4">
            {payoutHistory.map((payout) => (
              <div key={payout.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div>
                  <div className="font-semibold">${payout.amount.toFixed(2)}</div>
                  <div className="text-sm text-white/60">
                    {new Date(payout.requested_at).toLocaleDateString()}
                  </div>
                </div>
                <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                  payout.status === 'completed' ? 'bg-neon-green/20 text-neon-green' :
                  payout.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                  payout.status === 'processing' ? 'bg-electric-blue/20 text-electric-blue' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-white/60">
            <p>No payout history yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CalendarSection() {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-2">
        <GradientText>Economic Calendar</GradientText>
      </h1>
      <p className="text-white/70 mb-8">Important economic events and announcements</p>

      <div className="text-center py-12 text-white/60">
        <Calendar size={64} className="mx-auto mb-4 opacity-50" />
        <p>Economic calendar integration coming soon!</p>
      </div>
    </div>
  );
}

function DownloadsSection() {
  const [downloads, setDownloads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchDownloads();
  }, [filter]);

  async function fetchDownloads() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('downloads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('document_type', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setDownloads(data || []);
    } catch (error) {
      console.error('Error fetching downloads:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(doc: any) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const certificateHTML = generateCertificateHTML(doc, user);
      const blob = new Blob([certificateHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${doc.document_type}_${doc.document_number || Date.now()}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      await supabase
        .from('downloads')
        .update({ download_count: (doc.download_count || 0) + 1 })
        .eq('id', doc.id);

      fetchDownloads();
    } catch (error) {
      console.error('Error downloading:', error);
      alert('Failed to download document');
    }
  }

  const documentTypes = [
    { value: 'all', label: 'All Documents' },
    { value: 'certificate', label: 'Certificates' },
    { value: 'contract', label: 'Contracts' },
    { value: 'invoice', label: 'Invoices' },
    { value: 'receipt', label: 'Receipts' },
  ];

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'certificate': return '🏆';
      case 'contract': return '📜';
      case 'invoice': return '🧾';
      case 'receipt': return '💰';
      default: return '📄';
    }
  };

  async function generateTestCertificate() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/certificates/welcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      });

      const data = await res.json();
      if (data.success) {
        alert('Test certificate generated successfully!');
        fetchDownloads();
      } else {
        alert('Failed to generate certificate: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error generating test certificate:', error);
      alert('Failed to generate certificate');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-4xl font-bold">
          <GradientText>Downloads & Certificates</GradientText>
        </h1>
        <button
          onClick={generateTestCertificate}
          className="px-4 py-2 bg-gradient-to-r from-neon-green to-electric-blue rounded-lg font-semibold hover:scale-105 transition-transform text-sm flex items-center gap-2"
        >
          <Award size={16} />
          Generate Test Certificate
        </button>
      </div>
      <p className="text-white/70 mb-8">Your certificates, receipts, and important documents</p>

      <div className="mb-6 flex gap-2 flex-wrap">
        {documentTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => setFilter(type.value)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              filter === type.value
                ? 'bg-gradient-to-r from-electric-blue to-neon-purple'
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-white/60">Loading documents...</div>
      ) : downloads.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {downloads.map((doc) => (
            <div
              key={doc.id}
              className="bg-gradient-to-br from-white/5 to-white/10 rounded-xl p-6 border border-white/10 hover:border-electric-blue/50 transition-all hover:scale-105"
            >
              <div className="text-6xl mb-4 text-center">{getDocumentIcon(doc.document_type)}</div>
              <h3 className="text-xl font-bold mb-2 text-center">{doc.title || 'Document'}</h3>
              <p className="text-white/60 text-sm mb-4 text-center">
                {doc.description || doc.document_type}
              </p>

              {doc.document_number && (
                <div className="bg-white/5 rounded-lg p-3 mb-4">
                  <div className="text-xs text-white/60">Document Number</div>
                  <div className="font-mono text-sm">{doc.document_number}</div>
                </div>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Issue Date</span>
                  <span>{new Date(doc.issue_date || doc.created_at).toLocaleDateString()}</span>
                </div>
                {doc.download_count > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Downloads</span>
                    <span>{doc.download_count}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(doc)}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-electric-blue to-neon-purple rounded-lg font-semibold hover:scale-105 transition-transform flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          <div className="bg-white/5 rounded-xl p-12 border border-white/10 text-center">
            <Award size={64} className="mx-auto mb-4 text-white/30" />
            <h3 className="text-2xl font-bold mb-2">No Documents Yet</h3>
            <p className="text-white/60 mb-6">
              Your certificates and documents will appear here once generated.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">Download Trading Platforms</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/5 rounded-xl p-6 border border-white/10 text-center">
                <div className="text-6xl mb-4">💻</div>
                <h3 className="text-xl font-bold mb-2">MetaTrader 5</h3>
                <p className="text-white/60 text-sm mb-4">Windows Desktop</p>
                <a
                  href="https://download.mql5.com/cdn/web/metaquotes.software.corp/mt5/mt5setup.exe"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-2 bg-gradient-to-r from-electric-blue to-neon-purple rounded-lg font-semibold hover:scale-105 transition-transform"
                >
                  Download
                </a>
              </div>

              <div className="bg-white/5 rounded-xl p-6 border border-white/10 text-center">
                <div className="text-6xl mb-4">📱</div>
                <h3 className="text-xl font-bold mb-2">MT5 Mobile</h3>
                <p className="text-white/60 text-sm mb-4">iOS & Android</p>
                <a
                  href="https://www.metatrader5.com/en/mobile-trading"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-2 bg-gradient-to-r from-electric-blue to-neon-purple rounded-lg font-semibold hover:scale-105 transition-transform"
                >
                  Get App
                </a>
              </div>

              <div className="bg-white/5 rounded-xl p-6 border border-white/10 text-center">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-bold mb-2">Trading Guide</h3>
                <p className="text-white/60 text-sm mb-4">PDF Documentation</p>
                <button className="px-6 py-2 bg-gradient-to-r from-electric-blue to-neon-purple rounded-lg font-semibold hover:scale-105 transition-transform">
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function generateCertificateHTML(doc: any, user: any) {
  const issueDate = new Date(doc.issue_date || doc.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${doc.title || 'Fund8r Certificate'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Georgia', serif;
      background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .certificate {
      background: white;
      max-width: 1000px;
      width: 100%;
      padding: 60px;
      border: 20px solid #0066FF;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      position: relative;
    }
    .certificate::before {
      content: '';
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      bottom: 10px;
      border: 2px solid #7B2EFF;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .logo {
      font-size: 48px;
      font-weight: bold;
      background: linear-gradient(135deg, #0066FF, #7B2EFF);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 10px;
    }
    .subtitle {
      color: #666;
      font-size: 18px;
      font-style: italic;
    }
    .title {
      font-size: 42px;
      color: #0066FF;
      text-align: center;
      margin: 40px 0;
      text-transform: uppercase;
      letter-spacing: 3px;
    }
    .content {
      text-align: center;
      font-size: 20px;
      line-height: 1.8;
      color: #333;
      margin: 30px 0;
    }
    .recipient {
      font-size: 36px;
      font-weight: bold;
      color: #7B2EFF;
      margin: 20px 0;
      text-decoration: underline;
    }
    .details {
      margin: 40px 0;
      padding: 20px;
      background: #f8f9fa;
      border-left: 4px solid #0066FF;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      margin: 10px 0;
      font-size: 16px;
    }
    .detail-label {
      font-weight: bold;
      color: #666;
    }
    .detail-value {
      color: #333;
    }
    .signature-section {
      display: flex;
      justify-content: space-around;
      margin-top: 60px;
      padding-top: 40px;
    }
    .signature {
      text-align: center;
    }
    .signature-line {
      width: 250px;
      height: 2px;
      background: #333;
      margin: 20px auto 10px;
    }
    .signature-name {
      font-weight: bold;
      font-size: 18px;
      color: #333;
    }
    .signature-title {
      color: #666;
      font-size: 14px;
    }
    .seal {
      position: absolute;
      bottom: 40px;
      right: 40px;
      width: 100px;
      height: 100px;
      border: 3px solid #0066FF;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: #0066FF;
      font-size: 12px;
      text-align: center;
      transform: rotate(-15deg);
    }
    @media print {
      body {
        background: white;
      }
      .certificate {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <div class="logo">Fund8r</div>
      <div class="subtitle">Premier Proprietary Trading Firm</div>
    </div>

    <div class="title">Certificate of ${doc.document_type === 'certificate' ? 'Achievement' : doc.document_type}</div>

    <div class="content">
      <p>This certifies that</p>
      <div class="recipient">${user.email}</div>
      <p>${doc.description || 'has successfully completed the requirements'}</p>
    </div>

    <div class="details">
      <div class="detail-row">
        <span class="detail-label">Document Number:</span>
        <span class="detail-value">${doc.document_number || 'N/A'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Issue Date:</span>
        <span class="detail-value">${issueDate}</span>
      </div>
      ${doc.account_size ? `
      <div class="detail-row">
        <span class="detail-label">Account Size:</span>
        <span class="detail-value">$${parseFloat(doc.account_size).toLocaleString()}</span>
      </div>
      ` : ''}
    </div>

    <div class="signature-section">
      <div class="signature">
        <div class="signature-line"></div>
        <div class="signature-name">Michael Johnson</div>
        <div class="signature-title">Chief Executive Officer</div>
      </div>
      <div class="signature">
        <div class="signature-line"></div>
        <div class="signature-name">Sarah Williams</div>
        <div class="signature-title">Director of Operations</div>
      </div>
    </div>

    <div class="seal">
      OFFICIAL<br>SEAL
    </div>
  </div>
</body>
</html>
  `;
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: 'How do I withdraw my profits?',
      a: 'You can request withdrawals through the Payouts section once you meet the minimum payout threshold and have completed the required trading days. Payouts are processed within 24-48 hours.',
    },
    {
      q: 'What is the minimum withdrawal amount?',
      a: 'The minimum withdrawal amount is $100. There are no maximum limits on withdrawals.',
    },
    {
      q: 'How does the profit split work?',
      a: 'Your profit split percentage is determined by your challenge type (ranging from 80% to 90%). You keep your percentage of all profits generated.',
    },
    {
      q: 'Can I trade during news events?',
      a: 'Yes, you can trade during news events. However, we recommend proper risk management during high-impact news releases.',
    },
    {
      q: 'What happens if I violate a trading rule?',
      a: 'Violations of trading rules may result in account termination. Minor violations may receive warnings first. Serious violations (like exceeding max drawdown) result in immediate account closure.',
    },
  ];

  return (
    <div>
      <h1 className="text-4xl font-bold mb-2">
        <GradientText>Frequently Asked Questions</GradientText>
      </h1>
      <p className="text-white/70 mb-8">Find answers to common questions</p>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div key={index} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <span className="font-semibold">{faq.q}</span>
              <span className="text-2xl">{openIndex === index ? '−' : '+'}</span>
            </button>
            {openIndex === index && (
              <div className="px-6 py-4 bg-white/5 border-t border-white/10 text-white/70">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsSection({ user }: { user: any }) {
  return <EnhancedSettings user={user} />;
}
