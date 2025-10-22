import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Trophy, CreditCard, Flame, TrendingUp, Crown, CheckCircle, X, ArrowRight, DollarSign } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GradientText from '../components/ui/GradientText';
import { supabase } from '../lib/db';

interface ChallengeType {
  id: string;
  challenge_code: string;
  challenge_name: string;
  description: string;
  is_active: boolean;
  recommended: boolean;
}

interface PricingTier {
  id: string;
  account_size: number;
  regular_price: number;
  discount_price: number;
  platform_cost: number;
  phase_1_price?: number;
  phase_2_price?: number;
  profit_target_pct?: number;
  profit_target_amount?: number;
  phase_1_target_pct?: number;
  phase_2_target_pct?: number;
  phase_1_target_amount?: number;
  phase_2_target_amount?: number;
  daily_dd_pct: number;
  max_dd_pct: number;
  min_trading_days: number;
  time_limit_days?: number;
}

const iconMap: Record<string, any> = {
  RAPID_FIRE: Zap,
  CLASSIC_2STEP: Trophy,
  PAYG_2STEP: CreditCard,
  AGGRESSIVE_2STEP: Flame,
  SWING_PRO: TrendingUp,
  ELITE_ROYAL: Crown,
  ELITE: Crown,
  REGULAR: Trophy
};

const colorMap: Record<string, { border: string; bg: string; accent: string }> = {
  RAPID_FIRE: { border: 'border-orange-500/50', bg: 'bg-orange-500/10', accent: 'text-orange-400' },
  CLASSIC_2STEP: { border: 'border-blue-500/50', bg: 'bg-blue-500/10', accent: 'text-blue-400' },
  PAYG_2STEP: { border: 'border-green-500/50', bg: 'bg-green-500/10', accent: 'text-green-400' },
  AGGRESSIVE_2STEP: { border: 'border-red-500/50', bg: 'bg-red-500/10', accent: 'text-red-400' },
  SWING_PRO: { border: 'border-teal-500/50', bg: 'bg-teal-500/10', accent: 'text-teal-400' },
  ELITE_ROYAL: { border: 'border-yellow-500/50', bg: 'bg-yellow-500/10', accent: 'text-yellow-400' },
  ELITE: { border: 'border-amber-500/50', bg: 'bg-amber-500/10', accent: 'text-amber-400' },
  REGULAR: { border: 'border-slate-500/50', bg: 'bg-slate-500/10', accent: 'text-slate-400' }
};

export default function ChallengeTypes() {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<ChallengeType[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeType | null>(null);
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        // Use fallback data
        setChallenges(getFallbackChallenges());
        setLoading(false);
        return;
      }

      const { data: challengeData, error: challengeError } = await supabase
        .from('challenge_types')
        .select('*')
        .eq('is_active', true)
        .order('recommended', { ascending: false });

      if (challengeError) {
        console.error('Error fetching challenges:', challengeError);
        // Use fallback data on error
        setChallenges(getFallbackChallenges());
      } else if (challengeData && challengeData.length > 0) {
        // Filter out SCALING and REGULAR challenges
        const filteredChallenges = challengeData.filter(
          challenge => challenge.challenge_code !== 'SCALING' && challenge.challenge_code !== 'REGULAR'
        );
        setChallenges(filteredChallenges);
      } else {
        // Use fallback data if no data returned
        setChallenges(getFallbackChallenges());
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
      // Use fallback data on exception
      setChallenges(getFallbackChallenges());
    } finally {
      setLoading(false);
    }
  };

  const getFallbackPricingTiers = (challengeCode: string): any[] => {
    const accountSizes = challengeCode === 'ELITE_ROYAL' 
      ? [300000, 500000, 1000000, 2000000]
      : [5000, 10000, 25000, 50000, 100000, 200000];
    
    return accountSizes.map(size => ({
      id: `fallback-${size}`,
      account_size: size,
      regular_price: 0,
      discount_price: 0,
      platform_cost: 0,
      daily_dd_pct: 5,
      max_dd_pct: 10,
      min_trading_days: 4,
      time_limit_days: 60
    }));
  };

  const getFallbackChallenges = (): ChallengeType[] => [
    {
      id: '1',
      challenge_code: 'CLASSIC_2STEP',
      challenge_name: 'Classic 2-Step',
      description: 'Traditional 2-phase evaluation with balanced rules',
      is_active: true,
      recommended: true
    },
    {
      id: '2',
      challenge_code: 'RAPID_FIRE',
      challenge_name: 'Rapid Fire',
      description: 'Fast-paced 1-step challenge for quick profit targets',
      is_active: true,
      recommended: false
    },
    {
      id: '3',
      challenge_code: 'PAYG_2STEP',
      challenge_name: 'Pay-to-Go 2-Step',
      description: 'Pay for each phase separately as you progress',
      is_active: true,
      recommended: false
    },
    {
      id: '4',
      challenge_code: 'AGGRESSIVE_2STEP',
      challenge_name: 'Aggressive 2-Step',
      description: 'Higher profit targets with more aggressive rules',
      is_active: true,
      recommended: false
    },
    {
      id: '5',
      challenge_code: 'SWING_PRO',
      challenge_name: 'Swing Pro',
      description: 'Designed for swing traders with longer time frames',
      is_active: true,
      recommended: false
    },
    {
      id: '6',
      challenge_code: 'ELITE_ROYAL',
      challenge_name: 'Elite Royal',
      description: 'Premium challenge with best profit split and conditions',
      is_active: true,
      recommended: false
    }
  ].filter(challenge => challenge.challenge_code !== 'SCALING' && challenge.challenge_code !== 'REGULAR');

  const handleChallengeClick = async (challenge: ChallengeType) => {
    setSelectedChallenge(challenge);
    setSelectedTier(null);

    let pricingData: any[] = [];
    
    try {
      const { data, error: pricingError } = await supabase
        .from('challenge_pricing')
        .select('*')
        .eq('challenge_type_id', challenge.id)
        .order('account_size', { ascending: true });

      if (pricingError) {
        console.error('Error fetching pricing:', pricingError);
      }
      
      pricingData = data || [];
    } catch (error) {
      console.error('Error fetching pricing:', error);
    }

    // Use fallback data if database returns empty
    if (pricingData.length === 0) {
      pricingData = getFallbackPricingTiers(challenge.challenge_code);
    }

    if (pricingData) {
      // Remove duplicates by account_size
      const uniquePricing = pricingData.reduce((acc: PricingTier[], current) => {
        const exists = acc.find(item => item.account_size === current.account_size);
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []);

      // Filter tiers based on challenge type
      let filteredPricing = uniquePricing;
      if (challenge.challenge_code === 'ELITE_ROYAL') {
        // Elite Royal only shows 300K to 2M accounts
        filteredPricing = uniquePricing.filter(tier => 
          tier.account_size >= 300000 && tier.account_size <= 2000000
        );
      }

      // Update pricing for all challenges
      const updatedPricing = filteredPricing.map(tier => {
        // Define pricing for each challenge type
        const pricingByChallenge: { [key: string]: { [key: number]: number } } = {
          'CLASSIC_2STEP': {
            5000: 29,
            10000: 49,
            25000: 99,
            50000: 149,
            100000: 249,
            200000: 449
          },
          'RAPID_FIRE': {
            5000: 25,
            10000: 45,
            25000: 90,
            50000: 125,
            100000: 225,
            200000: 400
          },
          'PAYG_2STEP': {
            5000: 25,
            10000: 45,
            25000: 75,
            50000: 125,
            100000: 225,
            200000: 400
          },
          'AGGRESSIVE_2STEP': {
            5000: 25,
            10000: 45,
            25000: 90,
            50000: 125,
            100000: 225,
            200000: 400
          },
          'SWING_PRO': {
            5000: 25,
            10000: 45,
            25000: 90,
            50000: 125,
            100000: 225,
            200000: 400
          },
          'ELITE_ROYAL': {
            300000: 1699,
            500000: 2499,
            1000000: 3999,
            2000000: 6999
          }
        };
        
        const challengePricing = pricingByChallenge[challenge.challenge_code];
        if (challengePricing && challengePricing[tier.account_size]) {
          return {
            ...tier,
            discount_price: challengePricing[tier.account_size],
            regular_price: challengePricing[tier.account_size] * 2
          };
        }
        
        return tier;
      });

      setPricingTiers(updatedPricing);
    }
  };

  const handlePurchase = async (tier: PricingTier) => {
    const navState = {
      returnTo: '/payment',
      accountSize: tier.account_size,
      challengeType: selectedChallenge?.challenge_code,
      regularPrice: tier.regular_price,
      discountPrice: tier.discount_price,
      originalPrice: tier.discount_price // Keep for backward compatibility
    };

    console.log('ChallengeTypes navigating to signup with state:', navState);

    navigate('/signup', { state: navState });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-deep-space flex items-center justify-center">
        <div className="text-2xl">Loading challenges...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-space">
      <Navbar />

      <div className="pt-40 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Choose Your <GradientText>Challenge Type</GradientText>
            </h1>
            <p className="text-xl text-gray-400">
              {challenges.length} unique challenges designed for different trading styles. Find your perfect match.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {challenges.map((challenge) => {
              const Icon = iconMap[challenge.challenge_code] || Trophy;
              const colors = colorMap[challenge.challenge_code] || { border: 'border-gray-500/50', bg: 'bg-gray-500/10', accent: 'text-gray-400' };

              return (
                <div
                  key={challenge.id}
                  onClick={() => handleChallengeClick(challenge)}
                  className={`glass-card p-8 cursor-pointer transition-all hover:scale-105 ${colors.border} hover:shadow-xl relative group`}
                >
                  {challenge.recommended && (
                    <div className="absolute top-4 right-4 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                      RECOMMENDED
                    </div>
                  )}

                  <div className={`${colors.bg} w-20 h-20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon className={colors.accent} size={40} />
                  </div>

                  <h3 className="text-2xl font-bold mb-3">{challenge.challenge_name}</h3>
                  <p className="text-gray-400 mb-6">{challenge.description}</p>

                  <button className={`w-full py-3 ${colors.bg} ${colors.accent} rounded-lg font-semibold hover:bg-opacity-80 transition-all flex items-center justify-center space-x-2`}>
                    <span>View Details</span>
                    <ArrowRight size={20} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Comparison Table */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">
              <GradientText>Compare All Challenges</GradientText>
            </h2>
            <div className="glass-card p-6 overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-4 px-4 font-bold text-lg">Feature</th>
                    <th className="text-center py-4 px-4">
                      <div className="flex flex-col items-center">
                        <Zap className="text-orange-400 mb-2" size={24} />
                        <span className="font-bold text-orange-400">Rapid Fire</span>
                      </div>
                    </th>
                    <th className="text-center py-4 px-4">
                      <div className="flex flex-col items-center">
                        <Trophy className="text-blue-400 mb-2" size={24} />
                        <span className="font-bold text-blue-400">Classic 2-Step</span>
                      </div>
                    </th>
                    <th className="text-center py-4 px-4">
                      <div className="flex flex-col items-center">
                        <CreditCard className="text-green-400 mb-2" size={24} />
                        <span className="font-bold text-green-400">Pay-As-You-Go</span>
                      </div>
                    </th>
                    <th className="text-center py-4 px-4">
                      <div className="flex flex-col items-center">
                        <Flame className="text-red-400 mb-2" size={24} />
                        <span className="font-bold text-red-400">Aggressive</span>
                      </div>
                    </th>
                    <th className="text-center py-4 px-4">
                      <div className="flex flex-col items-center">
                        <TrendingUp className="text-purple-400 mb-2" size={24} />
                        <span className="font-bold text-purple-400">Swing Pro</span>
                      </div>
                    </th>
                    <th className="text-center py-4 px-4">
                      <div className="flex flex-col items-center">
                        <Crown className="text-yellow-400 mb-2" size={24} />
                        <span className="font-bold text-yellow-400">Elite Royal</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4 font-semibold">Starting Price</td>
                    <td className="text-center py-4 px-4">
                      <span className="text-green-400 font-bold">$25</span>
                      <div className="text-xs text-gray-500">(5k account)</div>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="text-green-400 font-bold">$29</span>
                      <div className="text-xs text-gray-500">(5k account)</div>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="text-green-400 font-bold">$25</span>
                      <div className="text-xs text-gray-500">(Phase 1 only)</div>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="text-green-400 font-bold">$25</span>
                      <div className="text-xs text-gray-500">(5k account)</div>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="text-green-400 font-bold">$25</span>
                      <div className="text-xs text-gray-500">(5k account)</div>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="text-green-400 font-bold">$1699</span>
                      <div className="text-xs text-gray-500">(300k account)</div>
                    </td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4 font-semibold">Phases</td>
                    <td className="text-center py-4 px-4">1 Phase</td>
                    <td className="text-center py-4 px-4">2 Phases</td>
                    <td className="text-center py-4 px-4">2 Phases</td>
                    <td className="text-center py-4 px-4">2 Phases</td>
                    <td className="text-center py-4 px-4">2 Phases</td>
                    <td className="text-center py-4 px-4">1 Phase</td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4 font-semibold">Profit Target</td>
                    <td className="text-center py-4 px-4">10%</td>
                    <td className="text-center py-4 px-4">8% → 5%</td>
                    <td className="text-center py-4 px-4">8% → 5%</td>
                    <td className="text-center py-4 px-4">12% → 6%</td>
                    <td className="text-center py-4 px-4">6% → 4%</td>
                    <td className="text-center py-4 px-4">8%</td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4 font-semibold">Max Drawdown</td>
                    <td className="text-center py-4 px-4">5%</td>
                    <td className="text-center py-4 px-4">6%</td>
                    <td className="text-center py-4 px-4">6%</td>
                    <td className="text-center py-4 px-4">8%</td>
                    <td className="text-center py-4 px-4">8%</td>
                    <td className="text-center py-4 px-4">10%</td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4 font-semibold">Daily Loss Limit</td>
                    <td className="text-center py-4 px-4">3%</td>
                    <td className="text-center py-4 px-4">3%</td>
                    <td className="text-center py-4 px-4">3%</td>
                    <td className="text-center py-4 px-4">5%</td>
                    <td className="text-center py-4 px-4">4%</td>
                    <td className="text-center py-4 px-4">5%</td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4 font-semibold">Time Limit</td>
                    <td className="text-center py-4 px-4">10 Days</td>
                    <td className="text-center py-4 px-4">Unlimited</td>
                    <td className="text-center py-4 px-4">Unlimited</td>
                    <td className="text-center py-4 px-4">30 Days</td>
                    <td className="text-center py-4 px-4">60 Days</td>
                    <td className="text-center py-4 px-4">Unlimited</td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4 font-semibold">Min Trading Days</td>
                    <td className="text-center py-4 px-4">3 Days</td>
                    <td className="text-center py-4 px-4">5 Days</td>
                    <td className="text-center py-4 px-4">5 Days</td>
                    <td className="text-center py-4 px-4">4 Days</td>
                    <td className="text-center py-4 px-4">3 Days</td>
                    <td className="text-center py-4 px-4">5 Days</td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4 font-semibold">Profit Split</td>
                    <td className="text-center py-4 px-4">
                      <span className="text-green-400 font-bold">80%</span>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="text-green-400 font-bold">80%</span>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="text-green-400 font-bold">75%</span>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="text-green-400 font-bold">85%</span>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="text-green-400 font-bold">80%</span>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="text-green-400 font-bold">90%</span>
                    </td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4 font-semibold">Max Allocation</td>
                    <td className="text-center py-4 px-4">$400K</td>
                    <td className="text-center py-4 px-4">$600K</td>
                    <td className="text-center py-4 px-4">$400K</td>
                    <td className="text-center py-4 px-4">$300K</td>
                    <td className="text-center py-4 px-4">$500K</td>
                    <td className="text-center py-4 px-4">$1M</td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4 font-semibold">Consistency Rule</td>
                    <td className="text-center py-4 px-4">
                      <span className="text-yellow-400">✓ Required</span>
                      <div className="text-xs text-gray-500">Max 40% per day</div>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="text-yellow-400">✓ Required</span>
                      <div className="text-xs text-gray-500">Max 40% per day</div>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="text-yellow-400">✓ Required</span>
                      <div className="text-xs text-gray-500">Max 40% per day</div>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="text-red-400">✗ Not Required</span>
                      <div className="text-xs text-gray-500">No limit</div>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="text-yellow-400">✓ Required</span>
                      <div className="text-xs text-gray-500">Max 40% per day</div>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="text-red-400">✗ Not Required</span>
                      <div className="text-xs text-gray-500">No limit</div>
                    </td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4 font-semibold">Payment Structure</td>
                    <td className="text-center py-4 px-4">One-time</td>
                    <td className="text-center py-4 px-4">One-time</td>
                    <td className="text-center py-4 px-4">Phase by Phase</td>
                    <td className="text-center py-4 px-4">One-time</td>
                    <td className="text-center py-4 px-4">One-time</td>
                    <td className="text-center py-4 px-4">One-time</td>
                  </tr>
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4 font-semibold">Best For</td>
                    <td className="text-center py-4 px-4 text-sm text-gray-400">Quick traders</td>
                    <td className="text-center py-4 px-4 text-sm text-gray-400">Balanced approach</td>
                    <td className="text-center py-4 px-4 text-sm text-gray-400">Lower entry cost</td>
                    <td className="text-center py-4 px-4 text-sm text-gray-400">Risk takers</td>
                    <td className="text-center py-4 px-4 text-sm text-gray-400">Position traders</td>
                    <td className="text-center py-4 px-4 text-sm text-gray-400">Premium conditions</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {selectedChallenge && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto pt-32">
          <div className="glass-card max-w-6xl w-full my-8 relative">
            <button
              onClick={() => setSelectedChallenge(null)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all z-10"
            >
              <X size={24} />
            </button>

            <div className="p-8">
              <div className="flex items-center space-x-4 mb-8">
                {(() => {
                  const Icon = iconMap[selectedChallenge.challenge_code] || Trophy;
                  const colors = colorMap[selectedChallenge.challenge_code] || { border: 'border-gray-500/50', bg: 'bg-gray-500/10', accent: 'text-gray-400' };
                  return (
                    <>
                      <div className={`${colors.bg} w-16 h-16 rounded-xl flex items-center justify-center`}>
                        <Icon className={colors.accent} size={32} />
                      </div>
                      <div>
                        <h2 className="text-4xl font-bold">{selectedChallenge.challenge_name}</h2>
                        <p className="text-gray-400">{selectedChallenge.description}</p>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-4">Select Account Size</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {pricingTiers.map((tier) => (
                    <div
                      key={tier.id}
                      onClick={() => setSelectedTier(tier)}
                      className={`glass-card p-6 cursor-pointer transition-all hover:scale-105 ${
                        selectedTier?.id === tier.id ? 'border-2 border-electric-blue' : ''
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-3xl font-bold mb-2">
                          ${tier.account_size.toLocaleString()}
                        </div>

                        {selectedChallenge.challenge_code === 'PAYG_2STEP' ? (
                          <div className="space-y-1">
                            <div className="text-sm text-gray-400">Phase 1</div>
                            <div className="text-2xl font-bold text-green-400">
                              ${(tier.phase_1_price! / 2).toFixed(0)}
                            </div>
                            <div className="text-xs text-gray-500 line-through">
                              ${tier.phase_1_price}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-3xl font-bold text-neon-green mb-1">
                              ${tier.discount_price}
                            </div>
                            <div className="text-sm text-gray-500 line-through">
                              ${tier.regular_price}
                            </div>
                            <div className="text-xs text-green-400 font-bold">
                              50% OFF
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedTier && (
                <div className="glass-card p-6 mb-6 bg-blue-500/10 border-blue-500/30">
                  <h4 className="text-xl font-bold mb-4">Challenge Details</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="text-green-400" size={20} />
                      <span>
                        Account Size: <strong>${selectedTier.account_size.toLocaleString()}</strong>
                      </span>
                    </div>

                    {selectedTier.phase_1_target_pct && (
                      <>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="text-green-400" size={20} />
                          <span>
                            Phase 1: {selectedTier.phase_1_target_pct}% (${selectedTier.phase_1_target_amount?.toLocaleString()})
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="text-green-400" size={20} />
                          <span>
                            Phase 2: {selectedTier.phase_2_target_pct}% (${selectedTier.phase_2_target_amount?.toLocaleString()})
                          </span>
                        </div>
                      </>
                    )}

                    {selectedTier.profit_target_pct && (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="text-green-400" size={20} />
                        <span>
                          Profit Target: {selectedTier.profit_target_pct}% (${selectedTier.profit_target_amount?.toLocaleString()})
                        </span>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <CheckCircle className="text-green-400" size={20} />
                      <span>Daily DD: {selectedTier.daily_dd_pct}%</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <CheckCircle className="text-green-400" size={20} />
                      <span>Max DD: {selectedTier.max_dd_pct}%</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <CheckCircle className="text-green-400" size={20} />
                      <span>Min Trading Days: {selectedTier.min_trading_days}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <CheckCircle className="text-green-400" size={20} />
                      <span>
                        Time Limit: {selectedTier.time_limit_days ? `${selectedTier.time_limit_days} days` : 'Unlimited'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePurchase(selectedTier)}
                    className="w-full mt-6 py-4 btn-gradient text-xl font-bold flex items-center justify-center space-x-3 group"
                  >
                    <DollarSign size={24} />
                    <span>Purchase Challenge - ${selectedTier.discount_price}</span>
                    <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}

              <div className="glass-card p-6 bg-yellow-500/10 border-yellow-500/30">
                <h4 className="text-xl font-bold mb-3 flex items-center space-x-2">
                  <Trophy className="text-yellow-400" size={24} />
                  <span>What's Included</span>
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="text-green-400 mt-0.5 flex-shrink-0" size={20} />
                    <span>Unlimited trading time (where applicable)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="text-green-400 mt-0.5 flex-shrink-0" size={20} />
                    <span>Trade all major forex pairs, commodities, indices, and crypto</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="text-green-400 mt-0.5 flex-shrink-0" size={20} />
                    <span>Keep 75-100% of profits based on payout cycle</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="text-green-400 mt-0.5 flex-shrink-0" size={20} />
                    <span>Choose from weekly to bi-monthly payouts</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="text-green-400 mt-0.5 flex-shrink-0" size={20} />
                    <span>No consistency rules or minimum days between trades</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="text-green-400 mt-0.5 flex-shrink-0" size={20} />
                    <span>Real-time tracking dashboard</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
