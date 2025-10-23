import { useState, useEffect } from 'react';
import { Link2, Users, DollarSign, TrendingUp, Copy, Check } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { api } from '../lib/api';

export default function Affiliate() {
  const [stats, setStats] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock user ID - replace with actual auth
  const userId = 'current-user-id';

  useEffect(() => {
    fetchAffiliateData();
  }, []);

  const fetchAffiliateData = async () => {
    setLoading(true);
    try {
      const response = await api.getAffiliateStats(userId);
      if (response.success) {
        setStats(response.data);
      } else {
        // Create affiliate account if doesn't exist
        await api.createAffiliate(userId);
        fetchAffiliateData();
      }
    } catch (error) {
      console.error('Error fetching affiliate data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const affiliateLink = stats?.affiliate?.affiliate_code
    ? `${window.location.origin}/signup?ref=${stats.affiliate.affiliate_code}`
    : '';

  const tierInfo = {
    bronze: { name: 'Bronze', rate: 20, color: '#CD7F32', minRevenue: 0 },
    silver: { name: 'Silver', rate: 25, color: '#C0C0C0', minRevenue: 5000 },
    gold: { name: 'Gold', rate: 30, color: '#FFD700', minRevenue: 20000 },
    platinum: { name: 'Platinum', rate: 35, color: '#E5E4E2', minRevenue: 50000 }
  };

  const currentTier = stats?.affiliate?.tier || 'bronze';
  const currentTierInfo = tierInfo[currentTier as keyof typeof tierInfo];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            <Users className="inline-block w-12 h-12 mr-3 text-blue-400" />
            Affiliate Dashboard
          </h1>
          <p className="text-xl text-gray-300">
            Earn commission by referring traders to our platform
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-blue-500"></div>
            <p className="mt-4 text-gray-300">Loading affiliate data...</p>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-8 h-8 text-blue-400" />
                  <p className="text-gray-300">Total Referrals</p>
                </div>
                <p className="text-4xl font-bold text-white">{stats?.stats?.total_referrals || 0}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-8 h-8 text-green-400" />
                  <p className="text-gray-300">Total Earnings</p>
                </div>
                <p className="text-4xl font-bold text-green-400">
                  ${stats?.stats?.total_earnings?.toFixed(2) || '0.00'}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-8 h-8 text-yellow-400" />
                  <p className="text-gray-300">Pending</p>
                </div>
                <p className="text-4xl font-bold text-yellow-400">
                  ${stats?.stats?.pending_earnings?.toFixed(2) || '0.00'}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-2">
                  <Check className="w-8 h-8 text-purple-400" />
                  <p className="text-gray-300">Paid Out</p>
                </div>
                <p className="text-4xl font-bold text-purple-400">
                  ${stats?.stats?.paid_earnings?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>

            {/* Commission Tier */}
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-600/20 backdrop-blur-lg rounded-xl p-8 border border-white/20 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Current Tier: <span style={{ color: currentTierInfo.color }}>{currentTierInfo.name}</span>
                  </h3>
                  <p className="text-gray-300">Commission Rate: {currentTierInfo.rate}%</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-300 mb-1">Next Tier Progress</p>
                  <p className="text-2xl font-bold text-white">
                    ${stats?.affiliate?.total_earnings?.toFixed(0) || 0} / $5,000
                  </p>
                </div>
              </div>

              <div className="w-full bg-white/10 rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      ((stats?.affiliate?.total_earnings || 0) / 5000) * 100,
                      100
                    )}%`
                  }}
                ></div>
              </div>
            </div>

            {/* Affiliate Link */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 mb-8">
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Link2 className="w-6 h-6 text-blue-400" />
                Your Affiliate Link
              </h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={affiliateLink}
                  readOnly
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white font-mono"
                />
                <button
                  onClick={() => copyToClipboard(affiliateLink)}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition flex items-center gap-2"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-sm text-gray-400 mt-3">
                Share this link with traders. You'll earn {currentTierInfo.rate}% commission on their purchases.
              </p>
            </div>

            {/* Recent Referrals */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h3 className="text-2xl font-bold text-white">Recent Referrals</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">User</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">Date</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-200">Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats?.referrals && stats.referrals.length > 0 ? (
                      stats.referrals.map((referral: any) => (
                        <tr key={referral.id} className="border-t border-white/10">
                          <td className="px-6 py-4 text-white">{referral.users?.email || 'Anonymous'}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                referral.status === 'completed'
                                  ? 'bg-green-500/20 text-green-300'
                                  : 'bg-yellow-500/20 text-yellow-300'
                              }`}
                            >
                              {referral.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-300">
                            {new Date(referral.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right text-green-400 font-semibold">
                            ${referral.commission_amount?.toFixed(2) || '0.00'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                          No referrals yet. Start sharing your link to earn commissions!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Request Payout Button */}
            {(stats?.stats?.pending_earnings || 0) >= 100 && (
              <div className="mt-8 text-center">
                <button
                  onClick={async () => {
                    try {
                      await api.requestPayout(userId, stats.stats.pending_earnings);
                      alert('Payout requested successfully!');
                      fetchAffiliateData();
                    } catch (error) {
                      alert('Error requesting payout');
                    }
                  }}
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg hover:scale-105 transition"
                >
                  Request Payout (${stats.stats.pending_earnings.toFixed(2)})
                </button>
                <p className="text-sm text-gray-400 mt-2">
                  Minimum payout: $100.00
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
