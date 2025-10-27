import GradientText from './ui/GradientText';

interface StatCardProps {
  value: string;
  label: string;
  icon: string;
}

export default function StatCard({ value, label, icon }: StatCardProps) {
  return (
    <div className="glass-card p-6 text-center hover-lift">
      <div className="text-4xl mb-2">{icon}</div>
      <div className="text-3xl font-bold font-mono mb-1"><GradientText>{value}</GradientText></div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
}
