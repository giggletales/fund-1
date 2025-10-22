import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { period = 'all', limit = 50 } = req.query;

    let dateFilter = '';
    if (period === 'daily') {
      dateFilter = `AND passed_at > NOW() - INTERVAL '1 day'`;
    } else if (period === 'weekly') {
      dateFilter = `AND passed_at > NOW() - INTERVAL '7 days'`;
    } else if (period === 'monthly') {
      dateFilter = `AND passed_at > NOW() - INTERVAL '30 days'`;
    }

    const { data, error } = await supabase.rpc('get_leaderboard', {
      period_filter: period,
      result_limit: limit
    });

    if (error) throw error;

    const enrichedData = data.map((entry, index) => ({
      ...entry,
      rank: index + 1,
      badge: this.getBadge(index + 1),
      profit_percentage: ((entry.balance - entry.initial_balance) / entry.initial_balance * 100).toFixed(2)
    }));

    res.json({ success: true, data: enrichedData });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const { data: totalTraders } = await supabase
      .from('mt5_accounts')
      .select('id', { count: 'exact' });

    const { data: passedTraders } = await supabase
      .from('mt5_accounts')
      .select('id', { count: 'exact' })
      .eq('status', 'passed');

    const { data: activeTraders } = await supabase
      .from('mt5_accounts')
      .select('id', { count: 'exact' })
      .eq('status', 'active');

    const { data: totalProfitData } = await supabase
      .from('mt5_accounts')
      .select('balance, initial_balance')
      .eq('status', 'passed');

    const totalProfit = totalProfitData.reduce((sum, account) =>
      sum + (account.balance - account.initial_balance), 0
    );

    const successRate = totalTraders.length > 0
      ? (passedTraders.length / totalTraders.length * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      stats: {
        total_traders: totalTraders.length,
        passed_traders: passedTraders.length,
        active_traders: activeTraders.length,
        total_profit: totalProfit,
        success_rate: successRate
      }
    });
  } catch (error) {
    console.error('Error fetching leaderboard stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

function getBadge(rank) {
  if (rank === 1) return { name: 'Champion', color: '#FFD700', icon: '👑' };
  if (rank === 2) return { name: 'Master', color: '#C0C0C0', icon: '🥈' };
  if (rank === 3) return { name: 'Expert', color: '#CD7F32', icon: '🥉' };
  if (rank <= 10) return { name: 'Elite', color: '#667eea', icon: '⭐' };
  if (rank <= 50) return { name: 'Pro', color: '#38ef7d', icon: '💎' };
  return { name: 'Trader', color: '#6c757d', icon: '📊' };
}

export default router;
