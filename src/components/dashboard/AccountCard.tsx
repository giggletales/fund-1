import { TrendingDown, TrendingUp } from 'lucide-react';

interface AccountCardProps {
  account: {
    account_id: string;
    mt5_login: string;
    account_type: string;
    account_size: number;
    current_balance: number;
    status: string;
    challenge_info?: any;
  };
  onClick: () => void;
}

export default function AccountCard({ account, onClick }: AccountCardProps) {
  const accountSize = parseFloat(account.account_size as any) || 0;
  const currentBalance = parseFloat(account.current_balance as any) || accountSize;
  const profitLoss = currentBalance - accountSize;
  const profitPercent = accountSize > 0 ? ((profitLoss / accountSize) * 100) : 0;
  const isProfit = profitLoss >= 0;

  // Determine account phase/step
  const accountPhase = account.challenge_info?.challenge_name || account.account_type || 'Standard';

  // Status badge
  const getStatusBadge = () => {
    if (account.status === 'passed') {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">Passed</span>;
    } else if (account.status === 'failed') {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">Not Passed</span>;
    } else {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">Active</span>;
    }
  };

  // Extract profit target from challenge type (assuming it's in the name like "8% Target")
  const profitTarget = 8; // Default 8%

  return (
    <button
      onClick={onClick}
      className="w-full bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:border-electric-blue/50 transition-all duration-300 hover:shadow-lg hover:shadow-electric-blue/10 text-left group"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-electric-blue/20 flex items-center justify-center border border-electric-blue/30">
            <span className="text-electric-blue font-bold text-sm">#{account.mt5_login.slice(-4)}</span>
          </div>
          <div>
            <h3 className="font-bold text-white">#  {account.mt5_login}</h3>
            <p className="text-xs text-white/50">
              ${(accountSize / 1000).toFixed(0)}K • {accountPhase}
            </p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Balance & Profit Target */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-xs text-white/50 mb-1">Balance</div>
          <div className="text-2xl font-bold text-white">
            ${currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div>
          <div className="text-xs text-white/50 mb-1">Profit Target ({profitTarget}%)</div>
          <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${Math.min(Math.max((profitPercent / profitTarget) * 100, 0), 100)}%` }}
            />
          </div>
          <div className="text-xs text-white/70 mt-1">{Math.max(profitPercent, 0).toFixed(1)}%</div>
        </div>
      </div>

      {/* P&L */}
      <div className="pt-4 border-t border-white/5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/50">P&L</span>
          <div className={`flex items-center space-x-1 font-semibold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
            {isProfit ? (
              <TrendingUp size={14} />
            ) : (
              <TrendingDown size={14} />
            )}
            <span>
              {isProfit ? '+' : ''}${Math.abs(profitLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-white/50">Profit %</span>
          <span className={`text-sm font-semibold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
            {isProfit ? '+' : ''}{profitPercent.toFixed(2)}%
          </span>
        </div>
      </div>
    </button>
  );
}
