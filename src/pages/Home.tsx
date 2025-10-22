import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AnimatedBackground from '../components/AnimatedBackground';
import Hero3DBackground from '../components/Hero3DBackground';
import PricingCard from '../components/PricingCard';
import StatCard from '../components/StatCard';
import FeatureCard from '../components/FeatureCard';
import TestimonialCard from '../components/TestimonialCard';
import GradientText from '../components/ui/GradientText';
import {
  Zap,
  DollarSign,
  RefreshCw,
  TrendingUp,
  Headphones,
  Target,
  ArrowRight,
  Check,
  X,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('phase1');

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <Navbar />

      <div className="relative z-10">
        <section className="pt-40 pb-20 px-4 relative overflow-hidden">
          <Hero3DBackground />
          <div className="glow-orb glow-orb-1" />
          <div className="glow-orb glow-orb-2" />
          <div className="floating-card floating-card-1">
            💰 $2.4M+ Paid to Traders
          </div>
          <div className="floating-card floating-card-2">
            ⚡ 48hr Payout Processing
          </div>
          <div className="max-w-7xl mx-auto text-center relative z-10">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
              Get Funded Up to{' '}
              <GradientText>$200,000</GradientText>
              <br />
              Without Risking Your Own Capital
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Pass our 2-phase challenge, prove your skills, and trade with our capital. Keep up to 100% of profits with bi-monthly payouts.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-16">
              <a href="/signup" className="btn-gradient flex items-center space-x-2 group">
                <span>Start Your Challenge</span>
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
              </a>
              <a href="#how-it-works" className="px-8 py-4 glass-card rounded-lg font-semibold text-lg hover:border-electric-blue/50 transition-all">
                See How It Works
              </a>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <StatCard value="$2.4M+" label="Paid to Traders" icon="💰" />
              <StatCard value="12,847" label="Active Traders" icon="👥" />
              <StatCard value="48hr" label="Payout Processing" icon="⚡" />
              <StatCard value="140+" label="Countries" icon="🌍" />
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-20 px-4 bg-black/20">
          <div className="max-w-7xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4"><GradientText>How It Works</GradientText></h2>
            <p className="text-xl text-gray-400">Simple 3-step process to get funded</p>
          </div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-electric-blue to-cyber-purple rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-2xl font-bold mb-4">Choose Your Account</h3>
              <p className="text-gray-400">
                Select from $5K to $200K account sizes starting at just $34
              </p>
            </div>

            <div className="glass-card p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-electric-blue to-cyber-purple rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-2xl font-bold mb-4">Pass 2 Evaluation Phases</h3>
              <p className="text-gray-400">
                Hit profit targets while managing risk. No time limits available.
              </p>
            </div>

            <div className="glass-card p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-electric-blue to-cyber-purple rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-2xl font-bold mb-4">Get Funded & Trade</h3>
              <p className="text-gray-400">
                Keep 75-100% of profits based on your payout cycle. Choose from weekly to bi-monthly payouts.
              </p>
            </div>
          </div>
        </section>

        <section id="challenges" className="py-20 px-4">
          <div className="max-w-7xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Choose Your <GradientText>Challenge Type</GradientText>
            </h2>
            <p className="text-xl text-gray-400">6 unique challenge types designed for different trading styles. Find your perfect match.</p>
          </div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="glass-card p-8 hover:border-orange-500/50 transition-all cursor-pointer group" onClick={() => window.location.href = '/challenge-types'}>
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-2xl font-bold mb-2">Rapid Fire</h3>
              <p className="text-gray-400 mb-4">1-Step instant funding for aggressive traders</p>
              <p className="text-sm text-orange-400">Starting from $25</p>
            </div>

            <div className="glass-card p-8 border-2 border-blue-500/50 hover:border-blue-500 transition-all cursor-pointer group relative" onClick={() => window.location.href = '/challenge-types'}>
              <div className="absolute top-4 right-4 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">RECOMMENDED</div>
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-2xl font-bold mb-2">Classic 2-Step</h3>
              <p className="text-gray-400 mb-4">Industry standard evaluation</p>
              <p className="text-sm text-blue-400">Starting from $29</p>
            </div>

            <div className="glass-card p-8 hover:border-green-500/50 transition-all cursor-pointer group" onClick={() => window.location.href = '/challenge-types'}>
              <div className="text-4xl mb-4">💳</div>
              <h3 className="text-2xl font-bold mb-2">Pay-As-You-Go</h3>
              <p className="text-gray-400 mb-4">Split payment, pay Phase 2 after passing Phase 1</p>
              <p className="text-sm text-green-400">Phase 1 from $50</p>
            </div>

            <div className="glass-card p-8 hover:border-red-500/50 transition-all cursor-pointer group" onClick={() => window.location.href = '/challenge-types'}>
              <div className="text-4xl mb-4">🔥</div>
              <h3 className="text-2xl font-bold mb-2">Aggressive 2-Step</h3>
              <p className="text-gray-400 mb-4">High risk, high reward for scalpers</p>
              <p className="text-sm text-red-400">Starting from $25</p>
            </div>

            <div className="glass-card p-8 hover:border-purple-500/50 transition-all cursor-pointer group" onClick={() => window.location.href = '/challenge-types'}>
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-2xl font-bold mb-2">Swing Trader Pro</h3>
              <p className="text-gray-400 mb-4">Weekend holds allowed for position traders</p>
              <p className="text-sm text-purple-400">Starting from $25</p>
            </div>

            <div className="glass-card p-8 hover:border-yellow-500/50 transition-all cursor-pointer group" onClick={() => window.location.href = '/challenge-types'}>
              <div className="text-4xl mb-4">👑</div>
              <h3 className="text-2xl font-bold mb-2">Elite Royal</h3>
              <p className="text-gray-400 mb-4">High stakes $300K-$2M with 90/10 split</p>
              <p className="text-sm text-yellow-400">Starting from $1699</p>
            </div>
          </div>

          <div className="text-center mt-12">
            <a
              href="/challenge-types"
              className="inline-flex items-center space-x-2 px-8 py-4 btn-gradient font-semibold text-lg"
            >
              <span>View All Challenge Types</span>
              <ArrowRight size={20} />
            </a>
          </div>
        </section>

        <section className="py-20 px-4 bg-black/20">
          <div className="max-w-7xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Why Fund8r?</h2>
            <p className="text-xl text-gray-400">Industry-leading features for serious traders</p>
          </div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Zap size={32} className="text-electric-blue" />}
              title="Instant Demo Access"
              description="Start trading immediately after payment. No waiting."
            />
            <FeatureCard
              icon={<DollarSign size={32} className="text-neon-green" />}
              title="Industry-Leading Splits"
              description="Keep up to 100% of your profits. Choose your payout frequency and split."
            />
            <FeatureCard
              icon={<RefreshCw size={32} className="text-cyber-purple" />}
              title="Unlimited Retakes"
              description="Failed? Reset for 50% off. We want you to succeed."
            />
            <FeatureCard
              icon={<TrendingUp size={32} className="text-electric-blue" />}
              title="Trade Your Way"
              description="All strategies allowed: scalping, news trading, EAs, overnight holds."
            />
            <FeatureCard
              icon={<Headphones size={32} className="text-neon-green" />}
              title="Real Support"
              description="Live chat 24/5. Real traders helping traders."
            />
            <FeatureCard
              icon={<Target size={32} className="text-cyber-purple" />}
              title="Scale Your Account"
              description="Grow your funded account up to $2M based on performance."
            />
          </div>
        </section>

        <section id="rules" className="py-20 px-4">
          <div className="max-w-7xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Trading Rules</h2>
            <p className="text-xl text-gray-400">Clear, fair rules designed for trader success</p>
          </div>

          <div className="max-w-4xl mx-auto mb-8">
            <div className="flex flex-wrap gap-4 border-b border-white/10 pb-4">
              {['phase1', 'phase2', 'funded', 'allowed'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-4 px-6 font-semibold transition-colors ${
                    activeTab === tab
                      ? 'text-electric-blue border-b-2 border-electric-blue'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab === 'phase1' && 'Phase 1'}
                  {tab === 'phase2' && 'Phase 2'}
                  {tab === 'funded' && 'Funded Account'}
                  {tab === 'allowed' && "What's Allowed"}
                </button>
              ))}
            </div>
          </div>

          <div className="max-w-4xl mx-auto glass-card p-8">
            {activeTab === 'phase1' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Phase 1 Evaluation</h3>
                  <p className="text-gray-400">Demonstrate profitability and risk management</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="font-semibold mb-2">Profit Target</div>
                    <div className="text-3xl font-bold text-neon-green">8%</div>
                  </div>
                  <div>
                    <div className="font-semibold mb-2">Max Drawdown</div>
                    <div className="text-3xl font-bold text-electric-blue">6%</div>
                  </div>
                  <div>
                    <div className="font-semibold mb-2">Daily Loss Limit</div>
                    <div className="text-3xl font-bold">3%</div>
                  </div>
                  <div>
                    <div className="font-semibold mb-2">Min Trading Days</div>
                    <div className="text-3xl font-bold">5</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'phase2' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Phase 2 Verification</h3>
                  <p className="text-gray-400">Confirm consistency - 100% FREE</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="font-semibold mb-2">Profit Target</div>
                    <div className="text-3xl font-bold text-neon-green">5%</div>
                  </div>
                  <div>
                    <div className="font-semibold mb-2">Max Drawdown</div>
                    <div className="text-3xl font-bold text-electric-blue">6%</div>
                  </div>
                  <div>
                    <div className="font-semibold mb-2">Daily Loss Limit</div>
                    <div className="text-3xl font-bold">3%</div>
                  </div>
                  <div>
                    <div className="font-semibold mb-2">Min Trading Days</div>
                    <div className="text-3xl font-bold">5</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'funded' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Funded Account Rules</h3>
                  <p className="text-gray-400">Trade and profit with increased flexibility</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="font-semibold mb-2">Profit Target</div>
                    <div className="text-3xl font-bold text-neon-green">None!</div>
                  </div>
                  <div>
                    <div className="font-semibold mb-2">Max Drawdown</div>
                    <div className="text-3xl font-bold text-electric-blue">8%</div>
                  </div>
                  <div>
                    <div className="font-semibold mb-2">Daily Loss Limit</div>
                    <div className="text-3xl font-bold">3%</div>
                  </div>
                  <div>
                    <div className="font-semibold mb-2">Min Trading Days</div>
                    <div className="text-3xl font-bold">None</div>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <div className="font-semibold mb-2">Profit Split</div>
                  <div className="text-lg">75-100% based on payout cycle</div>
                  <div className="text-sm text-gray-400 mt-1">
                    Bi-Monthly: 100% | Monthly: 95% | Bi-Weekly: 85% | Weekly: 75%
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'allowed' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">What's Allowed</h3>
                  <p className="text-gray-400">Trade your way with full flexibility</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    'Scalping (any timeframe)',
                    'News trading',
                    'Expert Advisors (EAs)',
                    'Automated trading bots',
                    'Hold overnight positions',
                    'Hold over weekends',
                    'Hedging strategies',
                    'Grid trading',
                    'All indicators',
                    'Copy trading software',
                  ].map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Check size={20} className="text-neon-green flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-white/10">
                  <div className="font-semibold mb-4 flex items-center space-x-2">
                    <X size={20} className="text-red-500" />
                    <span>Not Allowed</span>
                  </div>
                  <ul className="space-y-2 text-gray-400">
                    <li>• Tick scalping (sub-1-second trades)</li>
                    <li>• Reverse arbitrage</li>
                    <li>• Hedging with external accounts</li>
                    <li>• Account sharing</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="py-20 px-4 bg-black/20">
          <div className="max-w-7xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Success Stories</h2>
            <p className="text-xl text-gray-400">Real traders, real results</p>
          </div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <TestimonialCard
              name="Marcus Chen"
              location="Singapore"
              quote="Made $12,450 in my first month. Fund8r's rules are fair and payouts are fast. Got my first withdrawal in 11 days."
              avatar="M"
            />
            <TestimonialCard
              name="Sarah Martinez"
              location="USA"
              quote="Finally found a legit prop firm. Tried 3 others. Fund8r has the best pricing and actually pays on time."
              avatar="S"
            />
            <TestimonialCard
              name="Ahmed Hassan"
              location="UAE"
              quote="Passed Phase 1 in 6 days. The no-time-limit option removed all pressure. Trading at my own pace was key."
              avatar="A"
            />
          </div>
        </section>

        <section id="faq" className="py-20 px-4">
          <div className="max-w-7xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-400">Everything you need to know</p>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            {[
              {
                q: 'What platforms can I use?',
                a: 'MT4, MT5, cTrader, or DXtrade - your choice.',
              },
              {
                q: 'Can I trade during news?',
                a: 'Yes! All strategies allowed including news trading.',
              },
              {
                q: 'How fast are payouts?',
                a: 'Requested on-demand every 14 days. Processed within 48hrs.',
              },
              {
                q: 'Can I use Expert Advisors?',
                a: 'Yes! Fully automated trading is allowed across all phases.',
              },
              {
                q: 'What if I fail the challenge?',
                a: 'You can reset your account for 50% off the original fee and try again.',
              },
              {
                q: 'Is Phase 2 really free?',
                a: 'Yes! 100% free. You only pay once for Phase 1.',
              },
            ].map((faq, index) => (
              <details key={index} className="glass-card p-6 group">
                <summary className="font-semibold text-lg cursor-pointer flex items-center justify-between">
                  {faq.q}
                  <ChevronDown className="group-open:rotate-180 transition-transform" />
                </summary>
                <p className="mt-4 text-gray-400">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto glass-card p-12 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Join 12,847 Traders Getting Funded Daily
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Your trading career starts here. Choose your challenge size and begin in 60 seconds.
            </p>
            <a href="/signup" className="px-12 py-4 bg-gradient-to-r from-electric-blue to-cyber-purple rounded-lg font-semibold text-lg hover:shadow-lg hover:shadow-electric-blue/50 transition-all inline-flex items-center space-x-2 group">
              <span>Get Started for $34</span>
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </a>
            <p className="text-sm text-gray-400 mt-6">
              No credit card required for demo • Cancel anytime • 14-day money-back guarantee
            </p>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}
