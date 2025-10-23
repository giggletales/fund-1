import { useState } from 'react';
import { CHALLENGE_TYPES, getPricing, getProfitSplit } from '../types/challenges';
import GradientText from './ui/GradientText';

export function PricingCalculator() {
  const [accountSize, setAccountSize] = useState(10000);
  const [challengeType, setChallengeType] = useState('standard');

  const price = getPricing(accountSize, challengeType);
  const profitSplit = getProfitSplit(accountSize, challengeType);
  const challenge = CHALLENGE_TYPES.find(c => c.id === challengeType);

  const phase1Target = challenge ? (accountSize * challenge.phase1Target / 100) : 0;
  const potentialMonthly = accountSize * 0.10;
  const yourShare = potentialMonthly * (profitSplit / 100);

  return (
    <div className="glass-card p-8">
      <h2 className="text-2xl font-bold mb-6 text-center">
        <GradientText>Pricing Calculator</GradientText>
      </h2>

      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">
          Account Size: ${(accountSize / 1000)}K
        </label>
        <input
          type="range"
          min="5000"
          max="200000"
          step="5000"
          value={accountSize}
          onChange={(e) => setAccountSize(Number(e.target.value))}
          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #0066FF 0%, #0066FF ${((accountSize - 5000) / 195000) * 100}%, rgba(255,255,255,0.1) ${((accountSize - 5000) / 195000) * 100}%, rgba(255,255,255,0.1) 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>$5K</span>
          <span>$50K</span>
          <span>$100K</span>
          <span>$200K</span>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">
          Challenge Type
        </label>
        <select
          value={challengeType}
          onChange={(e) => setChallengeType(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:border-electric-blue focus:outline-none transition-colors"
        >
          {CHALLENGE_TYPES.map(c => (
            <option key={c.id} value={c.id} className="bg-deep-space">
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white/5 rounded-lg p-6 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Challenge Fee:</span>
          <span className="text-2xl font-bold">
            <GradientText>${price}</GradientText>
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-400">Profit Split:</span>
          <span className="text-xl font-bold text-neon-green">{profitSplit}%</span>
        </div>

        <div className="border-t border-white/10 pt-4">
          <div className="text-sm text-gray-400 mb-2">Potential Earnings:</div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Phase 1 Target:</span>
            <span className="font-semibold">${phase1Target.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-gray-400">Monthly (10% avg):</span>
            <span className="font-semibold text-neon-green">${yourShare.toLocaleString()}</span>
          </div>
        </div>

        <div className="text-xs text-gray-400 text-center pt-4 border-t border-white/10">
          ROI: {((yourShare / price) * 100).toFixed(0)}% in first month*
        </div>
      </div>

      <a
        href="/signup"
        className="w-full btn-gradient py-3 rounded-lg font-semibold mt-6 flex items-center justify-center"
      >
        Get This Challenge - ${price}
      </a>

      <p className="text-xs text-gray-500 text-center mt-4">
        *Estimated based on 10% monthly return. Actual results may vary.
      </p>
    </div>
  );
}
