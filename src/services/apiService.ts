import { supabase } from '../lib/db';
import { sendEmail } from '../lib/email';
import { ruleMonitoringService } from './ruleMonitoringService';

export const apiService = {
  async register(email: string, password: string, firstName: string, lastName: string, country: string) {
    try {
      const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            country,
            referral_code: referralCode
          }
        }
      });

      if (error) throw error;

      await sendEmail(email, 'welcome', { firstName, email });

      return {
        success: true,
        user: data.user,
        session: data.session
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async login(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      return {
        success: true,
        user: data.user,
        session: data.session
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getDashboard(userId: string) {
    try {
      const { data: challenges } = await supabase
        .from('challenges')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const { data: stats } = await supabase
        .from('challenges')
        .select('status, phase, current_profit')
        .eq('user_id', userId);

      const active_challenges = stats?.filter(s => s.status === 'active').length || 0;
      const passed_challenges = stats?.filter(s => s.status === 'passed').length || 0;
      const funded_accounts = stats?.filter(s => s.phase === 'funded').length || 0;
      const total_profit = stats?.filter(s => s.phase === 'funded').reduce((sum, s) => sum + parseFloat(s.current_profit || '0'), 0) || 0;

      const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10);

      return {
        challenges: challenges || [],
        stats: {
          active_challenges,
          passed_challenges,
          funded_accounts,
          total_profit
        },
        notifications: notifications || []
      };
    } catch (error: any) {
      console.error('Dashboard error:', error);
      return { error: error.message };
    }
  },

  async purchaseChallenge(userId: string, accountSize: number, platform: string) {
    try {
      const pricing: {[key: number]: number} = {
        5000: 49, 10000: 79, 25000: 129,
        50000: 199, 100000: 349, 200000: 599
      };

      const fee = pricing[accountSize];
      if (!fee) throw new Error('Invalid account size');

      const { data: challenge, error } = await supabase
        .from('challenges')
        .insert({
          user_id: userId,
          account_size: accountSize,
          challenge_fee: fee,
          phase: 'phase1',
          platform: platform,
          profit_target: accountSize * 0.08,
          current_balance: accountSize,
          highest_balance: accountSize
        })
        .select()
        .single();

      if (error) throw error;

      const credentials = {
        platform: platform,
        server: 'Fund8r-Demo',
        login: `F8${challenge.id.substring(0, 8)}${Math.floor(Math.random() * 1000)}`,
        password: Math.random().toString(36).substring(2, 12),
        investorPassword: Math.random().toString(36).substring(2, 12)
      };

      await supabase
        .from('challenges')
        .update({
          server_name: credentials.server,
          login_id: credentials.login,
          password: credentials.password,
          investor_password: credentials.investorPassword
        })
        .eq('id', challenge.id);

      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (user) {
        await sendEmail(user.email, 'challengePurchase', {
          firstName: user.first_name,
          accountSize,
          credentials,
          challengeId: challenge.id
        });
      }

      return {
        success: true,
        challenge,
        credentials
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async submitTrade(userId: string, challengeId: string, tradeData: any) {
    try {
      const { data: challenge } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', challengeId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (!challenge) throw new Error('Challenge not found or not active');

      const { symbol, orderType, lotSize, openPrice, closePrice, openTime, closeTime } = tradeData;

      const pipValue = 10;
      const pips = orderType === 'buy' ?
        (closePrice - openPrice) * 10000 :
        (openPrice - closePrice) * 10000;
      const profitLoss = pips * pipValue * lotSize;

      const { data: trade, error } = await supabase
        .from('orders')
        .insert({
          challenge_id: challengeId,
          symbol,
          order_type: orderType,
          lot_size: lotSize,
          open_price: openPrice,
          close_price: closePrice,
          open_time: openTime,
          close_time: closeTime,
          profit_loss: profitLoss,
          net_profit: profitLoss
        })
        .select()
        .single();

      if (error) throw error;

      const newBalance = challenge.current_balance + profitLoss;
      const newProfit = challenge.current_profit + profitLoss;
      const newHighest = Math.max(challenge.highest_balance, newBalance);

      await supabase
        .from('challenges')
        .update({
          current_balance: newBalance,
          current_profit: newProfit,
          highest_balance: newHighest
        })
        .eq('id', challengeId);

      const today = new Date().toISOString().split('T')[0];
      const { data: dailyStats } = await supabase
        .from('daily_stats')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('date', today)
        .maybeSingle();

      if (dailyStats) {
        await supabase
          .from('daily_stats')
          .update({
            ending_balance: newBalance,
            daily_profit_loss: dailyStats.daily_profit_loss + profitLoss,
            trades_closed: dailyStats.trades_closed + 1,
            is_trading_day: true
          })
          .eq('challenge_id', challengeId)
          .eq('date', today);
      } else {
        await supabase
          .from('daily_stats')
          .insert({
            challenge_id: challengeId,
            date: today,
            starting_balance: challenge.current_balance,
            ending_balance: newBalance,
            daily_profit_loss: profitLoss,
            trades_closed: 1,
            is_trading_day: true
          });
      }

      const { data: updatedChallenge } = await supabase
        .from('challenges')
        .select(`
          *,
          users!inner(email, first_name)
        `)
        .eq('id', challengeId)
        .single();

      if (updatedChallenge) {
        await ruleMonitoringService.checkChallengeRules(updatedChallenge);
      }

      return {
        success: true,
        trade,
        newBalance,
        newProfit
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};
