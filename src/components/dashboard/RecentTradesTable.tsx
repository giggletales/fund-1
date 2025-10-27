import { Clock, TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface Trade {
  trade_id: string;
  symbol: string;
  trade_type: string;
  lot_size: number;
  open_price: number;
  close_price?: number;
  profit?: number;
  status: string;
  open_time: string;
  close_time?: string;
}

interface RecentTradesTableProps {
  trades: Trade[];
}

export default function RecentTradesTable({ trades }: RecentTradesTableProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (trades.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
          <Activity className="text-gray-400" size={32} />
        </div>
        <p className="text-gray-400 text-lg">No trades yet</p>
        <p className="text-gray-500 text-sm mt-2">Your trading activity will appear here</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <h3 className="text-xl font-bold mb-6 flex items-center">
        <Clock className="mr-2 text-electric-blue" size={24} />
        Recent Trades
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Symbol</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Type</th>
              <th className="text-right py-3 px-4 text-gray-400 font-medium text-sm">Lot Size</th>
              <th className="text-right py-3 px-4 text-gray-400 font-medium text-sm">Entry</th>
              <th className="text-right py-3 px-4 text-gray-400 font-medium text-sm">Exit</th>
              <th className="text-right py-3 px-4 text-gray-400 font-medium text-sm">Profit/Loss</th>
              <th className="text-center py-3 px-4 text-gray-400 font-medium text-sm">Status</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Time</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => (
              <tr
                key={trade.trade_id}
                className="border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                <td className="py-4 px-4 font-semibold">{trade.symbol}</td>
                <td className="py-4 px-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                    trade.trade_type.includes('BUY')
                      ? 'bg-neon-green/20 text-neon-green'
                      : 'bg-red-500/20 text-red-500'
                  }`}>
                    {trade.trade_type}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">{trade.lot_size}</td>
                <td className="py-4 px-4 text-right">{trade.open_price.toFixed(5)}</td>
                <td className="py-4 px-4 text-right">
                  {trade.close_price ? trade.close_price.toFixed(5) : '-'}
                </td>
                <td className="py-4 px-4 text-right">
                  {trade.profit !== undefined && trade.profit !== null ? (
                    <span className={`font-bold flex items-center justify-end ${
                      trade.profit >= 0 ? 'text-neon-green' : 'text-red-500'
                    }`}>
                      {trade.profit >= 0 ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
                      ${Math.abs(trade.profit).toFixed(2)}
                    </span>
                  ) : '-'}
                </td>
                <td className="py-4 px-4 text-center">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                    trade.status === 'open'
                      ? 'bg-electric-blue/20 text-electric-blue'
                      : trade.status === 'closed'
                      ? 'bg-gray-500/20 text-gray-400'
                      : 'bg-red-500/20 text-red-500'
                  }`}>
                    {trade.status}
                  </span>
                </td>
                <td className="py-4 px-4 text-sm text-gray-400">
                  {formatDate(trade.open_time)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
