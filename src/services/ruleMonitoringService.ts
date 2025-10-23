import { supabase } from '../lib/db';
import { sendEmail } from '../lib/email';

class RuleMonitoringService {
  async monitorAllActiveChallenges() {
    try {
      const { data: challenges, error } = await supabase
        .from('challenges')
        .select(`
          *,
          users!inner(email, first_name)
        `)
        .eq('status', 'active');

      if (error) throw error;

      for (const challenge of challenges || []) {
        await this.checkChallengeRules(challenge);
      }
    } catch (error) {
      console.error('Monitoring error:', error);
    }
  }

  async checkChallengeRules(challenge: any) {
    const checks = [
      this.checkMaxDrawdown(challenge),
      this.checkDailyLoss(challenge),
      this.checkLotSize(challenge),
    ];

    const results = await Promise.all(checks);
    const breach = results.find(r => r.breached);

    if (breach) {
      await this.breachAccount(challenge, breach.reason || 'Unknown', breach.details);
    }
  }

  async checkMaxDrawdown(challenge: any) {
    const { id, account_size, current_balance, highest_balance, max_drawdown_percent, phase } = challenge;

    let drawdownPoint;
    if (phase === 'funded') {
      drawdownPoint = (highest_balance || account_size) * (1 - max_drawdown_percent / 100);
    } else {
      drawdownPoint = account_size * (1 - max_drawdown_percent / 100);
    }

    const currentDrawdown = ((account_size - current_balance) / account_size) * 100;

    await supabase
      .from('challenges')
      .update({ current_drawdown_percent: currentDrawdown })
      .eq('id', id);

    if (current_balance <= drawdownPoint) {
      return {
        breached: true,
        reason: 'Maximum Drawdown Exceeded',
        details: `Account balance ($${current_balance.toFixed(2)}) fell below drawdown limit ($${drawdownPoint.toFixed(2)}). Max: ${max_drawdown_percent}%, Current: ${currentDrawdown.toFixed(2)}%`
      };
    }

    const warningThresholds = [50, 75, 90];
    for (const threshold of warningThresholds) {
      const thresholdValue = max_drawdown_percent * (threshold / 100);
      if (currentDrawdown >= thresholdValue) {
        const warningSent = await this.checkWarningSent(id, `drawdown_${threshold}`);
        if (!warningSent) {
          await this.sendWarningEmail(challenge, 'Maximum Drawdown', currentDrawdown, max_drawdown_percent, threshold);
          await this.markWarningSent(id, `drawdown_${threshold}`);
        }
      }
    }

    return { breached: false };
  }

  async checkDailyLoss(challenge: any) {
    const { id, max_daily_loss_percent } = challenge;
    const today = new Date().toISOString().split('T')[0];

    let { data: dailyStats } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('challenge_id', id)
      .eq('date', today)
      .maybeSingle();

    if (!dailyStats) {
      const startBalance = await this.getStartOfDayBalance(id);
      await supabase.from('daily_stats').insert({
        challenge_id: id,
        date: today,
        starting_balance: startBalance,
        ending_balance: startBalance,
        daily_profit_loss: 0
      });

      const result = await supabase
        .from('daily_stats')
        .select('*')
        .eq('challenge_id', id)
        .eq('date', today)
        .single();

      dailyStats = result.data;
    }

    if (!dailyStats) return { breached: false };

    const dailyLoss = ((dailyStats.starting_balance - dailyStats.ending_balance) / dailyStats.starting_balance) * 100;

    await supabase
      .from('daily_stats')
      .update({ daily_loss_percent: dailyLoss })
      .eq('challenge_id', id)
      .eq('date', today);

    if (dailyLoss >= max_daily_loss_percent) {
      return {
        breached: true,
        reason: 'Daily Loss Limit Exceeded',
        details: `Daily loss (${dailyLoss.toFixed(2)}%) exceeded ${max_daily_loss_percent}% limit.`
      };
    }

    const warningThresholds = [50, 75, 90];
    for (const threshold of warningThresholds) {
      const thresholdValue = max_daily_loss_percent * (threshold / 100);
      if (dailyLoss >= thresholdValue) {
        const warningSent = await this.checkWarningSent(id, `daily_loss_${threshold}_${today}`);
        if (!warningSent) {
          await this.sendWarningEmail(challenge, 'Daily Loss Limit', dailyLoss, max_daily_loss_percent, threshold);
          await this.markWarningSent(id, `daily_loss_${threshold}_${today}`);
        }
      }
    }

    return { breached: false };
  }

  async checkLotSize(challenge: any) {
    const { id, account_size } = challenge;
    const maxLotSize = this.calculateMaxLotSize(account_size);

    const { data: openPositions } = await supabase
      .from('orders')
      .select('*')
      .eq('challenge_id', id)
      .is('close_time', null);

    for (const position of openPositions || []) {
      if (position.lot_size > maxLotSize) {
        return {
          breached: true,
          reason: 'Lot Size Limit Exceeded',
          details: `Position ${position.ticket_number} lot size ${position.lot_size} exceeds max ${maxLotSize}`
        };
      }
    }

    return { breached: false };
  }

  async breachAccount(challenge: any, reason: string, details: string) {
    const { id, user_id, users, account_size, current_balance } = challenge;
    const email = users?.email || '';
    const first_name = users?.first_name || '';

    try {
      await supabase
        .from('challenges')
        .update({
          status: 'breached',
          end_date: new Date().toISOString(),
          notes: `Breached: ${reason}. ${details}`
        })
        .eq('id', id);

      const today = new Date().toISOString().split('T')[0];
      await supabase
        .from('daily_stats')
        .update({
          breached: true,
          breach_reason: reason
        })
        .eq('challenge_id', id)
        .eq('date', today);

      await supabase.from('notifications').insert({
        user_id,
        type: 'challenge_status',
        title: 'Account Breached',
        message: `Your $${account_size.toLocaleString()} account breached: ${reason}`,
        action_url: `/dashboard/challenges/${id}`
      });

      await sendEmail(email, 'accountBreached', {
        firstName: first_name,
        accountSize: account_size,
        breachReason: reason,
        breachDetails: details,
        finalBalance: current_balance,
        totalPL: current_balance - account_size,
        maxDrawdownReached: challenge.current_drawdown_percent,
        tradingDays: challenge.trading_days_completed,
        resetLink: `https://fluxfunded.com/dashboard/reset/${id}`
      });

      console.log(`Account ${id} breached: ${reason}`);
    } catch (error) {
      console.error('Breach error:', error);
    }
  }

  async sendWarningEmail(challenge: any, warningType: string, currentValue: number, limitValue: number, thresholdPercent: number) {
    const { user_id, users, account_size } = challenge;
    const email = users?.email || '';
    const first_name = users?.first_name || '';

    await sendEmail(email, 'ruleWarning', {
      firstName: first_name,
      warningType,
      currentValue: currentValue.toFixed(2),
      limitValue,
      accountSize: account_size,
      dangerLevel: thresholdPercent >= 90 ? 'high' : thresholdPercent >= 75 ? 'medium' : 'low',
      thresholdPercent
    });

    await supabase.from('notifications').insert({
      user_id,
      type: 'rule_warning',
      title: `${warningType} Warning (${thresholdPercent}%)`,
      message: `Your ${warningType} is at ${currentValue.toFixed(2)}% of ${limitValue}% limit`,
      action_url: '/dashboard'
    });
  }

  calculateMaxLotSize(accountSize: number): number {
    const sizes: {[key: number]: number} = {
      5000: 0.5,
      10000: 1.0,
      25000: 2.5,
      50000: 5.0,
      100000: 10.0,
      200000: 20.0
    };
    return sizes[accountSize] || 1.0;
  }

  async getStartOfDayBalance(challengeId: string): Promise<number> {
    const { data } = await supabase
      .from('daily_stats')
      .select('ending_balance')
      .eq('challenge_id', challengeId)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) return data.ending_balance;

    const { data: challenge } = await supabase
      .from('challenges')
      .select('account_size')
      .eq('id', challengeId)
      .single();

    return challenge?.account_size || 0;
  }

  async checkWarningSent(challengeId: string, warningKey: string): Promise<boolean> {
    const { data } = await supabase
      .from('warning_log')
      .select('*')
      .eq('challenge_id', challengeId)
      .eq('warning_key', warningKey)
      .maybeSingle();

    return !!data;
  }

  async markWarningSent(challengeId: string, warningKey: string) {
    await supabase.from('warning_log').insert({
      challenge_id: challengeId,
      warning_key: warningKey
    });
  }
}

export const ruleMonitoringService = new RuleMonitoringService();
