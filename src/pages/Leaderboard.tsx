import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { api } from '../lib/api';

export default function Leaderboard() {
  const [period, setPeriod] = useState('all');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [leaderboardRes, statsRes] = await Promise.all([
          api.getLeaderboard(period, 50),
          api.getLeaderboardStats()
        ]);

        if (leaderboardRes.success) setLeaderboard(leaderboardRes.data);
        if (statsRes.success) setStats(statsRes.stats);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  const getBadgeIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-400" />;
    return <Award className="w-5 h-5 text-blue-400" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            <TrendingUp className="inline-block w-12 h-12 mr-3 text-yellow-400" />
            Global Leaderboard
          </h1>
          <p className="text-xl text-gray-300">
            Top performing traders from around the world
          </p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <p className="text-gray-300 text-sm mb-2">Total Traders</p>
              <p className="text-3xl font-bold text-white">{stats.total_traders}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <p className="text-gray-300 text-sm mb-2">Passed</p>
              <p className="text-3xl font-bold text-green-400">{stats.passed_traders}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <p className="text-gray-300 text-sm mb-2">Success Rate</p>
              <p className="text-3xl font-bold text-blue-400">{stats.success_rate}%</p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <p className="text-gray-300 text-sm mb-2">Total Profit</p>
              <p className="text-3xl font-bold text-yellow-400">
                ${stats.total_profit?.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Period Selector */}
        <div className="flex justify-center gap-4 mb-8">
          {['daily', 'weekly', 'monthly', 'all'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-6 py-3 rounded-xl font-semibold transition ${
                period === p
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-blue-500"></div>
              <p className="mt-4 text-gray-300">Loading leaderboard...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Rank</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Trader</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Badge</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-200">Initial</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-200">Final</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-200">Profit</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-200">ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, index) => (
                    <tr
                      key={entry.id}
                      className="border-t border-white/10 hover:bg-white/5 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getBadgeIcon(entry.rank)}
                          <span className="font-bold text-white">{entry.rank}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white font-medium">
                        {entry.full_name || 'Anonymous Trader'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold"
                          style={{
                            backgroundColor: entry.badge?.color + '20',
                            color: entry.badge?.color
                          }}
                        >
                          {entry.badge?.icon} {entry.badge?.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-300">
                        ${entry.initial_balance?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-white font-semibold">
                        ${entry.balance?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-green-400 font-bold">
                          +${(entry.balance - entry.initial_balance)?.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-blue-400 font-semibold">
                          {entry.profit_percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && leaderboard.length === 0 && (
            <div className="p-12 text-center">
              <Trophy className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No traders in this period yet</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
