import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import AnimatedCounter from '../ui/AnimatedCounter';
import GradientText from '../ui/GradientText';

interface TradingStatsCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  trend?: number;
  icon: React.ReactNode;
  decimals?: number;
}

export default function TradingStatsCard({
  label,
  value,
  prefix = '',
  suffix = '',
  trend,
  icon,
  decimals = 0
}: TradingStatsCardProps) {
  return (
    <div className="glass-card p-6 hover-lift group">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-electric-blue/20 to-cyber-purple/20 group-hover:from-electric-blue/30 group-hover:to-cyber-purple/30 transition-all">
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center space-x-1 text-sm ${trend >= 0 ? 'text-neon-green' : 'text-red-500'}`}>
            {trend >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>{Math.abs(trend).toFixed(1)}%</span>
          </div>
        )}
      </div>
      <h3 className="text-gray-400 text-sm font-medium mb-2">{label}</h3>
      <div className="text-3xl font-bold">
        <GradientText>
          {prefix}
          <AnimatedCounter end={value} decimals={decimals} duration={2000} />
          {suffix}
        </GradientText>
      </div>
    </div>
  );
}
