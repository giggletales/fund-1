import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../lib/auth';
import { supabase } from '../lib/db';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GradientText from '../components/ui/GradientText';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import { TrendingUp, TrendingDown, Download, Eye, EyeOff, Copy, Check, Activity, DollarSign, BarChart3 } from 'lucide-react';

interface MT5Account {
  account_id: string;
  mt5_login: string;
  mt5_password: string;
  mt5_server: string;
  account_type: string;
  account_size: number;
  current_balance: number;
  leverage: number;
  status: string;
  created_at: string;
}

interface Trade {
  trade_id: string;
  ticket: number;
  symbol: string;
  trade_type: string;
  volume: number;
  open_price: number;
  close_price: number | null;
  profit: number;
  open_time: string;
  close_time: string | null;
  status: string;
}

interface EquitySnapshot {
  balance: number;
  equity: number;
  recorded_at: string;
}

export default function UserMT5() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<MT5Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [equityData, setEquityData] = useState<EquitySnapshot[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      loadAccountDetails(selectedAccount);
    }
  }, [selectedAccount]);

  const loadUserData = async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const { data: accountsData } = await supabase
      .from('mt5_accounts')
      .select('*')
      .eq('user_id', currentUser.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (accountsData && accountsData.length > 0) {
      setAccounts(accountsData);
      setSelectedAccount(accountsData[0].account_id);
    }

    setLoading(false);
  };

  const loadAccountDetails = async (accountId: string) => {
    const { data: tradesData } = await supabase
      .from('mt5_trades')
      .select('*')
      .eq('account_id', accountId)
      .order('open_time', { ascending: false })
      .limit(50);

    const { data: equitySnapshots } = await supabase
      .from('mt5_equity_snapshots')
      .select('*')
      .eq('account_id', accountId)
      .order('recorded_at', { ascending: true })
      .limit(30);

    setTrades(tradesData || []);
    setEquityData(equitySnapshots || []);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const currentAccount = accounts.find(a => a.account_id === selectedAccount);

  const stats = {
    totalTrades: trades.length,
    closedTrades: trades.filter(t => t.status === 'closed').length,
    winningTrades: trades.filter(t => t.status === 'closed' && t.profit > 0).length,
    losingTrades: trades.filter(t => t.status === 'closed' && t.profit < 0).length,
    totalProfit: trades.filter(t => t.status === 'closed').reduce((sum, t) => sum + Number(t.profit), 0),
    winRate: trades.filter(t => t.status === 'closed').length > 0
      ? (trades.filter(t => t.status === 'closed' && t.profit > 0).length / trades.filter(t => t.status === 'closed').length) * 100
      : 0
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-deep-space flex items-center justify-center">
        <div className="loader-spinner"></div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="min-h-screen bg-deep-space">
        <Navbar />
        <div className="pt-40 pb-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">
              <GradientText>No MT5 Account Yet</GradientText>
            </h1>
            <p className="text-gray-400 mb-8">
              You don't have an MT5 account assigned yet. Contact support or wait for your account to be created.
            </p>
            <a href="/contact" className="btn-gradient">
              Contact Support
            </a>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-space">
      <Navbar />

      <div className="pt-40 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                <GradientText>My MT5 Account</GradientText>
              </h1>
              <p className="text-gray-400">Track your trading performance and access credentials</p>
            </div>
            <a
              href="https://www.metatrader5.com/en/download"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gradient flex items-center space-x-2"
            >
              <Download size={20} />
              <span>Download MT5</span>
            </a>
          </div>

          {accounts.length > 1 && (
            <div className="glass-card p-6 mb-8">
              <label className="block text-sm font-semibold mb-3">Select Account</label>
              <select
                value={selectedAccount || ''}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-electric-blue focus:outline-none"
              >
                {accounts.map(acc => (
                  <option key={acc.account_id} value={acc.account_id} className="bg-deep-space">
                    {acc.mt5_login} - {acc.account_type} - ${acc.account_size.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
          )}

          {currentAccount && (
            <>
              <div className="glass-card p-8 mb-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">
                      <GradientText>${currentAccount.account_size.toLocaleString()}</GradientText>
                    </h2>
                    <p className="text-gray-400 capitalize">{currentAccount.account_type} Challenge</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400 mb-1">Current Balance</p>
                    <p className="text-2xl font-bold">
                      ${currentAccount.current_balance.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="bg-white/5 p-6 rounded-lg border border-white/10">
                  <h3 className="text-lg font-semibold mb-4">MT5 Login Credentials</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <CredentialField
                      label="Login"
                      value={currentAccount.mt5_login}
                      onCopy={() => copyToClipboard(currentAccount.mt5_login, 'login')}
                      copied={copied === 'login'}
                    />
                    <CredentialField
                      label="Password"
                      value={currentAccount.mt5_password}
                      onCopy={() => copyToClipboard(currentAccount.mt5_password, 'password')}
                      copied={copied === 'password'}
                      showPassword={showPassword}
                      onTogglePassword={() => setShowPassword(!showPassword)}
                    />
                    <CredentialField
                      label="Server"
                      value={currentAccount.mt5_server}
                      onCopy={() => copyToClipboard(currentAccount.mt5_server, 'server')}
                      copied={copied === 'server'}
                    />
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/10 text-sm text-gray-400">
                    <p>
                      <strong className="text-white">Leverage:</strong> 1:{currentAccount.leverage}
                      <span className="mx-4">|</span>
                      <strong className="text-white">Created:</strong> {new Date(currentAccount.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatCard
                  icon={<Activity className="text-electric-blue" size={28} />}
                  label="Total Trades"
                  value={<AnimatedCounter target={stats.totalTrades} />}
                  color="blue"
                />
                <StatCard
                  icon={<TrendingUp className="text-neon-green" size={28} />}
                  label="Win Rate"
                  value={<AnimatedCounter target={stats.winRate} suffix="%" />}
                  color="green"
                />
                <StatCard
                  icon={<DollarSign className="text-orange-500" size={28} />}
                  label="Total Profit"
                  value={<AnimatedCounter target={stats.totalProfit} prefix="$" />}
                  color={stats.totalProfit >= 0 ? 'green' : 'red'}
                />
                <StatCard
                  icon={<BarChart3 className="text-cyber-purple" size={28} />}
                  label="Closed Trades"
                  value={<AnimatedCounter target={stats.closedTrades} />}
                  color="purple"
                />
              </div>

              {equityData.length > 0 && (
                <div className="glass-card p-8 mb-8">
                  <h2 className="text-2xl font-bold mb-6">Equity Curve</h2>
                  <EquityCurve data={equityData} initialBalance={currentAccount.account_size} />
                </div>
              )}

              <div className="glass-card p-8">
                <h2 className="text-2xl font-bold mb-6">Recent Trades</h2>
                {trades.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="mx-auto mb-4 text-gray-600" size={48} />
                    <p className="text-gray-400">No trades recorded yet</p>
                    <p className="text-sm text-gray-500 mt-2">Start trading on your MT5 account to see your trades here</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-2 text-sm text-gray-400 font-semibold">Symbol</th>
                          <th className="text-left py-3 px-2 text-sm text-gray-400 font-semibold">Type</th>
                          <th className="text-right py-3 px-2 text-sm text-gray-400 font-semibold">Volume</th>
                          <th className="text-right py-3 px-2 text-sm text-gray-400 font-semibold">Open Price</th>
                          <th className="text-right py-3 px-2 text-sm text-gray-400 font-semibold">Close Price</th>
                          <th className="text-right py-3 px-2 text-sm text-gray-400 font-semibold">Profit</th>
                          <th className="text-left py-3 px-2 text-sm text-gray-400 font-semibold">Status</th>
                          <th className="text-left py-3 px-2 text-sm text-gray-400 font-semibold">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trades.map((trade) => (
                          <tr key={trade.trade_id} className="border-b border-white/5 hover:bg-white/5">
                            <td className="py-3 px-2 font-semibold">{trade.symbol}</td>
                            <td className="py-3 px-2">
                              <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-bold ${
                                trade.trade_type === 'buy'
                                  ? 'bg-neon-green/20 text-neon-green'
                                  : 'bg-red-500/20 text-red-500'
                              }`}>
                                {trade.trade_type === 'buy' ? (
                                  <TrendingUp size={12} />
                                ) : (
                                  <TrendingDown size={12} />
                                )}
                                <span>{trade.trade_type.toUpperCase()}</span>
                              </span>
                            </td>
                            <td className="py-3 px-2 text-right">{trade.volume.toFixed(2)}</td>
                            <td className="py-3 px-2 text-right">{trade.open_price.toFixed(5)}</td>
                            <td className="py-3 px-2 text-right">
                              {trade.close_price ? trade.close_price.toFixed(5) : '-'}
                            </td>
                            <td className={`py-3 px-2 text-right font-semibold ${
                              trade.profit > 0 ? 'text-neon-green' : trade.profit < 0 ? 'text-red-500' : ''
                            }`}>
                              {trade.profit > 0 ? '+' : ''}${trade.profit.toFixed(2)}
                            </td>
                            <td className="py-3 px-2">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                trade.status === 'closed'
                                  ? 'bg-gray-500/20 text-gray-400'
                                  : 'bg-electric-blue/20 text-electric-blue'
                              }`}>
                                {trade.status}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-sm text-gray-400">
                              {new Date(trade.open_time).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

function StatCard({ icon, label, value, color }: any) {
  const colors = {
    blue: 'bg-electric-blue/20 border-electric-blue/30',
    green: 'bg-neon-green/20 border-neon-green/30',
    red: 'bg-red-500/20 border-red-500/30',
    purple: 'bg-cyber-purple/20 border-cyber-purple/30',
    orange: 'bg-orange-500/20 border-orange-500/30'
  };

  return (
    <div className={`glass-card p-6 border ${colors[color as keyof typeof colors]} hover-lift`}>
      <div className="mb-3">{icon}</div>
      <div className="text-sm text-gray-400 mb-1">{label}</div>
      <div className="text-2xl font-bold">
        <GradientText>{value}</GradientText>
      </div>
    </div>
  );
}

function CredentialField({ label, value, onCopy, copied, showPassword, onTogglePassword }: any) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-2 font-semibold">{label}</label>
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
        <button
          onClick={onCopy}
          className="p-2 bg-white/5 rounded hover:bg-white/10 transition-all"
        >
          {copied ? <Check size={16} className="text-neon-green" /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  );
}

function EquityCurve({ data, initialBalance }: { data: EquitySnapshot[]; initialBalance: number }) {
  const maxEquity = Math.max(...data.map(d => d.equity), initialBalance);
  const minEquity = Math.min(...data.map(d => d.equity), initialBalance);
  const range = maxEquity - minEquity;

  const getYPosition = (equity: number) => {
    if (range === 0) return 50;
    return 90 - ((equity - minEquity) / range) * 80;
  };

  const pathData = data.map((point, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = getYPosition(point.equity);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const currentEquity = data[data.length - 1]?.equity || initialBalance;
  const profitLoss = currentEquity - initialBalance;
  const profitLossPercent = ((profitLoss / initialBalance) * 100).toFixed(2);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-sm text-gray-400 mb-1">Current Equity</p>
          <p className="text-3xl font-bold">${currentEquity.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400 mb-1">Profit/Loss</p>
          <p className={`text-2xl font-bold ${profitLoss >= 0 ? 'text-neon-green' : 'text-red-500'}`}>
            {profitLoss >= 0 ? '+' : ''}${profitLoss.toFixed(2)} ({profitLossPercent}%)
          </p>
        </div>
      </div>

      <div className="bg-white/5 p-4 rounded-lg border border-white/10">
        {data.length < 2 ? (
          <div className="text-center py-12 text-gray-400">
            <p>Not enough data points to show equity curve</p>
            <p className="text-sm mt-2">Equity is tracked daily as you trade</p>
          </div>
        ) : (
          <svg viewBox="0 0 100 100" className="w-full h-64" preserveAspectRatio="none">
            <defs>
              <linearGradient id="equityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={profitLoss >= 0 ? '#00ff88' : '#ff4444'} stopOpacity="0.3" />
                <stop offset="100%" stopColor={profitLoss >= 0 ? '#00ff88' : '#ff4444'} stopOpacity="0" />
              </linearGradient>
            </defs>

            <path
              d={`${pathData} L 100 100 L 0 100 Z`}
              fill="url(#equityGradient)"
            />

            <path
              d={pathData}
              fill="none"
              stroke={profitLoss >= 0 ? '#00ff88' : '#ff4444'}
              strokeWidth="0.5"
              vectorEffect="non-scaling-stroke"
            />

            {data.map((point, index) => {
              const x = (index / (data.length - 1)) * 100;
              const y = getYPosition(point.equity);
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="0.8"
                  fill={profitLoss >= 0 ? '#00ff88' : '#ff4444'}
                />
              );
            })}
          </svg>
        )}
      </div>

      <div className="flex justify-between items-center mt-4 text-xs text-gray-400">
        <span>{data.length > 0 ? new Date(data[0].recorded_at).toLocaleDateString() : 'Start'}</span>
        <span>{data.length} data points</span>
        <span>{data.length > 0 ? new Date(data[data.length - 1].recorded_at).toLocaleDateString() : 'Today'}</span>
      </div>
    </div>
  );
}
