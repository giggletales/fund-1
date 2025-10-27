import { supabase } from '../lib/db';
import { ACCOUNT_SIZES, CHALLENGE_TYPES, getPricing, getProfitSplit } from '../types/challenges';

export interface ChallengeTypeDB {
  type_id: number;
  type_name: string;
  display_name: string;
  marketing_tagline: string;
  description: string;
  number_of_phases: number;
  phase1_profit_target: number;
  phase1_max_drawdown: number;
  phase1_daily_loss_limit: number;
  phase1_min_trading_days: number;
  phase1_time_limit_days: number | null;
  phase2_profit_target: number | null;
  min_consistency_score: number;
  min_sharpe_ratio: number;
  min_profit_factor: number;
  min_risk_reward_ratio: number;
  optimal_win_rate_min: number;
  optimal_win_rate_max: number;
  max_trades_per_day: number;
  challenge_fee: number;
  profit_split_trader_percent: number;
  sort_order: number;
}

export interface PricingOption {
  challengeType: string;
  accountSize: number;
  price: number;
  profitSplit: number;
  displayName: string;
  tagline: string;
  description: string;
  phases: number;
  phase1Target: number;
  phase2Target: number | null;
  maxDrawdown: number;
  dailyLoss: number;
  minTradingDays: number;
  timeLimit: number | null;
  difficulty: string;
  badge?: string;
  recommended: boolean;
  features: string[];
}

export const pricingService = {
  async getChallengeTypes() {
    try {
      const { data, error } = await supabase
        .from('challenge_types')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as ChallengeTypeDB[];
    } catch (error) {
      console.error('Error fetching challenge types:', error);
      return [];
    }
  },

  async getAllPricingOptions(): Promise<PricingOption[]> {
    const options: PricingOption[] = [];

    ACCOUNT_SIZES.forEach(account => {
      CHALLENGE_TYPES.forEach(challenge => {
        const price = getPricing(account.size, challenge.id);
        const profitSplit = getProfitSplit(account.size, challenge.id);

        options.push({
          challengeType: challenge.id,
          accountSize: account.size,
          price,
          profitSplit,
          displayName: challenge.displayName,
          tagline: challenge.tagline,
          description: challenge.description,
          phases: challenge.phases,
          phase1Target: challenge.phase1Target,
          phase2Target: challenge.phase2Target,
          maxDrawdown: challenge.maxDrawdown,
          dailyLoss: challenge.dailyLoss,
          minTradingDays: challenge.minTradingDays,
          timeLimit: challenge.timeLimit,
          difficulty: challenge.difficulty,
          badge: challenge.badge,
          recommended: challenge.recommended,
          features: account.features
        });
      });
    });

    return options;
  },

  getPricingForAccount(accountSize: number) {
    return CHALLENGE_TYPES.map(challenge => ({
      ...challenge,
      price: getPricing(accountSize, challenge.id),
      profitSplit: getProfitSplit(accountSize, challenge.id),
      accountSize
    }));
  },

  getAccountSizes() {
    return ACCOUNT_SIZES;
  },

  getChallengeTypesLocal() {
    return CHALLENGE_TYPES;
  }
};
