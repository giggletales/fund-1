import metaapi from '../config/metaapi.js';
import { supabase } from '../config/supabase.js';
import emailService from './emailService.js';

class MonitoringService {
  constructor() {
    this.activeMonitors = new Map();
    this.monitoringInterval = 10000;
  }

  async startMonitoring(mt5AccountId) {
    try {
      const { data: account, error } = await supabase
        .from('mt5_accounts')
        .select('*, challenges(*)')
        .eq('id', mt5AccountId)
        .single();

      if (error || !account) {
        throw new Error('MT5 account not found');
      }

      if (this.activeMonitors.has(mt5AccountId)) {
        console.log(`Monitoring already active for account ${mt5AccountId}`);
        return;
      }

      const metaAccount = await metaapi.metatraderAccountApi.getAccount(account.metaapi_account_id);
      await metaAccount.deploy();
      await metaAccount.waitConnected();

      const connection = metaAccount.getRPCConnection();
      await connection.connect();
      await connection.waitSynchronized();

      const intervalId = setInterval(async () => {
        await this.checkAccountMetrics(mt5AccountId, connection);
      }, this.monitoringInterval);

      this.activeMonitors.set(mt5AccountId, {
        intervalId,
        connection,
        accountId: account.metaapi_account_id
      });

      await supabase
        .from('mt5_accounts')
        .update({ monitoring_status: 'active' })
        .eq('id', mt5AccountId);

      console.log(`Started monitoring for account ${mt5AccountId}`);
    } catch (error) {
      console.error('Error starting monitoring:', error);
      throw error;
    }
  }

  async stopMonitoring(mt5AccountId) {
    const monitor = this.activeMonitors.get(mt5AccountId);
    if (monitor) {
      clearInterval(monitor.intervalId);
      this.activeMonitors.delete(mt5AccountId);

      await supabase
        .from('mt5_accounts')
        .update({ monitoring_status: 'inactive' })
        .eq('id', mt5AccountId);

      console.log(`Stopped monitoring for account ${mt5AccountId}`);
    }
  }

  async checkAccountMetrics(mt5AccountId, connection) {
    try {
      const accountInfo = await connection.getAccountInformation();
      const positions = await connection.getPositions();
      const deals = await connection.getDeals();

      const { data: account } = await supabase
        .from('mt5_accounts')
        .select('*, challenges(*)')
        .eq('id', mt5AccountId)
        .single();

      if (!account) return;

      const metrics = {
        balance: accountInfo.balance,
        equity: accountInfo.equity,
        profit: accountInfo.profit,
        margin_level: accountInfo.marginLevel,
        daily_drawdown: this.calculateDailyDrawdown(account, deals),
        max_drawdown: this.calculateMaxDrawdown(account, deals),
        profit_target_reached: accountInfo.balance >= account.profit_target,
        trading_days: this.calculateTradingDays(deals),
        consistency_score: await this.calculateConsistency(deals),
        total_trades: deals.length
      };

      await supabase
        .from('account_metrics')
        .insert({
          mt5_account_id: mt5AccountId,
          ...metrics,
          timestamp: new Date().toISOString()
        });

      const ruleViolations = await this.checkRuleViolations(account, metrics, deals);

      if (ruleViolations.length > 0) {
        await this.handleRuleViolations(account, ruleViolations);
      }

      if (metrics.profit_target_reached && account.status === 'active') {
        await this.handleProfitTargetReached(account);
      }

    } catch (error) {
      console.error(`Error checking metrics for account ${mt5AccountId}:`, error);
    }
  }

  calculateDailyDrawdown(account, deals) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayDeals = deals.filter(deal => {
      const dealTime = new Date(deal.time);
      return dealTime >= today;
    });

    const todayProfit = todayDeals.reduce((sum, deal) => sum + deal.profit, 0);
    const startBalance = account.balance - todayProfit;

    return Math.max(0, (startBalance - account.equity) / startBalance * 100);
  }

  calculateMaxDrawdown(account, deals) {
    let peak = account.initial_balance;
    let maxDrawdown = 0;

    deals.sort((a, b) => new Date(a.time) - new Date(b.time));

    let runningBalance = account.initial_balance;
    deals.forEach(deal => {
      runningBalance += deal.profit;
      if (runningBalance > peak) {
        peak = runningBalance;
      }
      const drawdown = (peak - runningBalance) / peak * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });

    return maxDrawdown;
  }

  calculateTradingDays(deals) {
    const tradingDates = new Set();
    deals.forEach(deal => {
      const date = new Date(deal.time).toDateString();
      tradingDates.add(date);
    });
    return tradingDates.size;
  }

  async calculateConsistency(deals) {
    if (deals.length < 5) return 0;

    const dailyProfits = {};
    deals.forEach(deal => {
      const date = new Date(deal.time).toDateString();
      dailyProfits[date] = (dailyProfits[date] || 0) + deal.profit;
    });

    const profits = Object.values(dailyProfits);
    const avgProfit = profits.reduce((a, b) => a + b, 0) / profits.length;
    const variance = profits.reduce((sum, profit) => sum + Math.pow(profit - avgProfit, 2), 0) / profits.length;
    const stdDev = Math.sqrt(variance);

    const consistencyScore = Math.max(0, 100 - (stdDev / Math.abs(avgProfit) * 100));
    return Math.min(100, consistencyScore);
  }

  async checkRuleViolations(account, metrics, deals) {
    const violations = [];
    const challenge = account.challenges;

    if (metrics.daily_drawdown > challenge.max_daily_loss) {
      violations.push({
        rule: 'daily_drawdown',
        value: metrics.daily_drawdown,
        limit: challenge.max_daily_loss,
        severity: 'critical'
      });
    }

    if (metrics.max_drawdown > challenge.max_total_loss) {
      violations.push({
        rule: 'max_drawdown',
        value: metrics.max_drawdown,
        limit: challenge.max_total_loss,
        severity: 'critical'
      });
    }

    if (challenge.min_trading_days && metrics.trading_days < challenge.min_trading_days) {
      violations.push({
        rule: 'min_trading_days',
        value: metrics.trading_days,
        limit: challenge.min_trading_days,
        severity: 'warning'
      });
    }

    if (challenge.consistency_threshold && metrics.consistency_score < challenge.consistency_threshold) {
      violations.push({
        rule: 'consistency',
        value: metrics.consistency_score,
        limit: challenge.consistency_threshold,
        severity: 'warning'
      });
    }

    const newsViolation = await this.checkNewsTradingPolicy(deals);
    if (newsViolation) {
      violations.push(newsViolation);
    }

    return violations;
  }

  async checkNewsTradingPolicy(deals) {
    return null;
  }

  async handleRuleViolations(account, violations) {
    for (const violation of violations) {
      await supabase.from('rule_violations').insert({
        mt5_account_id: account.id,
        user_id: account.user_id,
        rule_type: violation.rule,
        current_value: violation.value,
        limit_value: violation.limit,
        severity: violation.severity,
        timestamp: new Date().toISOString()
      });

      await emailService.sendRuleViolationEmail(account, violation);

      if (violation.severity === 'critical') {
        await supabase
          .from('mt5_accounts')
          .update({
            status: 'failed',
            failure_reason: `${violation.rule} violation: ${violation.value.toFixed(2)}% exceeds limit of ${violation.limit}%`
          })
          .eq('id', account.id);

        await this.stopMonitoring(account.id);
      }
    }
  }

  async handleProfitTargetReached(account) {
    await supabase
      .from('mt5_accounts')
      .update({
        status: 'passed',
        passed_at: new Date().toISOString()
      })
      .eq('id', account.id);

    await emailService.sendChallengePassedEmail(account);
    await this.stopMonitoring(account.id);
  }

  async stopAllMonitoring() {
    for (const [accountId] of this.activeMonitors) {
      await this.stopMonitoring(accountId);
    }
  }
}

export default new MonitoringService();
