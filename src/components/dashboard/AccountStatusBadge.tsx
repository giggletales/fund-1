import { Clock, FileText, Check, Key, TrendingUp, Trophy, XCircle } from 'lucide-react';

interface AccountStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function AccountStatusBadge({ status, size = 'md' }: AccountStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    const statusLower = status?.toLowerCase() || '';

    switch (statusLower) {
      case 'awaiting_contract':
        return {
          label: 'Awaiting Contract',
          icon: FileText,
          bgColor: 'bg-yellow-500/20',
          textColor: 'text-yellow-400',
          borderColor: 'border-yellow-500/30',
          description: 'Please sign the contract to proceed',
        };
      case 'contract_signed':
        return {
          label: 'Contract Signed',
          icon: Check,
          bgColor: 'bg-blue-500/20',
          textColor: 'text-blue-400',
          borderColor: 'border-blue-500/30',
          description: 'Waiting for admin to send credentials',
        };
      case 'credentials_given':
        return {
          label: 'Credentials Provided',
          icon: Key,
          bgColor: 'bg-neon-green/20',
          textColor: 'text-neon-green',
          borderColor: 'border-neon-green/30',
          description: 'MT5 credentials have been sent',
        };
      case 'active':
        return {
          label: 'Active Trading',
          icon: TrendingUp,
          bgColor: 'bg-electric-blue/20',
          textColor: 'text-electric-blue',
          borderColor: 'border-electric-blue/30',
          description: 'Challenge is active',
        };
      case 'completed':
        return {
          label: 'Completed',
          icon: Trophy,
          bgColor: 'bg-neon-green/20',
          textColor: 'text-neon-green',
          borderColor: 'border-neon-green/30',
          description: 'Challenge successfully completed',
        };
      case 'failed':
        return {
          label: 'Failed',
          icon: XCircle,
          bgColor: 'bg-red-500/20',
          textColor: 'text-red-400',
          borderColor: 'border-red-500/30',
          description: 'Challenge rules violated',
        };
      default:
        return {
          label: 'Pending',
          icon: Clock,
          bgColor: 'bg-gray-500/20',
          textColor: 'text-gray-400',
          borderColor: 'border-gray-500/30',
          description: 'Processing',
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  const sizeClasses = {
    sm: {
      container: 'px-2 py-1 text-xs',
      icon: 'w-3 h-3',
    },
    md: {
      container: 'px-3 py-1.5 text-sm',
      icon: 'w-4 h-4',
    },
    lg: {
      container: 'px-4 py-2 text-base',
      icon: 'w-5 h-5',
    },
  };

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg font-semibold border ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeClasses[size].container}`}
      title={config.description}
    >
      <Icon className={sizeClasses[size].icon} />
      <span>{config.label}</span>
    </div>
  );
}
