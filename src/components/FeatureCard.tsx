interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export default function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="glass-card p-8 hover-lift">
      <div className="w-16 h-16 bg-gradient-to-br from-electric-blue/20 to-cyber-purple/20 rounded-xl flex items-center justify-center mb-6 border border-electric-blue/30">
        {icon}
      </div>
      <h3 className="text-2xl font-bold mb-4">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}
