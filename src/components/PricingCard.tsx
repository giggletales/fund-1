import { Check, ArrowRight } from 'lucide-react';
import GradientText from './ui/GradientText';

interface PricingCardProps {
  size: string;
  price: string;
  badge?: string;
  profitSplit: string;
  phase1Target: string;
  phase2Target: string;
  highlighted?: boolean;
}

export default function PricingCard({
  size,
  price,
  badge,
  profitSplit,
  phase1Target,
  phase2Target,
  highlighted = false
}: PricingCardProps) {
  return (
    <div
      className={`glass-card p-8 relative transition-all duration-300 hover-lift ${
        highlighted ? 'glow-border' : ''
      }`}
    >
      {badge && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-neon-green to-electric-blue px-4 py-1 rounded-full text-sm font-semibold">
          {badge}
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-4xl font-bold mb-2">{size}</h3>
        <div className="text-5xl font-bold mb-2"><GradientText>{price}</GradientText></div>
        <p className="text-gray-400">One-time payment</p>
      </div>

      <div className="space-y-4 mb-8">
        <div className="flex items-center justify-between py-2 border-b border-white/10">
          <span className="text-gray-400">Profit Split</span>
          <span className="font-bold text-neon-green">{profitSplit}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-white/10">
          <span className="text-gray-400">Phase 1 Target</span>
          <span className="font-bold">{phase1Target}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-white/10">
          <span className="text-gray-400">Phase 2 Target</span>
          <span className="font-bold">{phase2Target}</span>
        </div>
      </div>

      <ul className="space-y-3 mb-8">
        {[
          'Free Phase 2',
          'Unlimited time',
          'All trading styles',
          'Flexible payout cycles',
          '6% max drawdown',
          'Scale to $200K+',
        ].map((feature, index) => (
          <li key={index} className="flex items-center space-x-2">
            <Check size={20} className="text-neon-green flex-shrink-0" />
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>

      <a href="/challenge-types" className="w-full btn-gradient flex items-center justify-center space-x-2 group">
        <span>Get Started</span>
        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
      </a>
    </div>
  );
}
