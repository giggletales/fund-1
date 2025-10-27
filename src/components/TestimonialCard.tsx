import { Star } from 'lucide-react';

interface TestimonialCardProps {
  name: string;
  location: string;
  quote: string;
  avatar: string;
}

export default function TestimonialCard({ name, location, quote, avatar }: TestimonialCardProps) {
  return (
    <div className="glass-card p-8 hover-lift">
      <div className="flex items-center space-x-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={16} className="fill-neon-green text-neon-green" />
        ))}
      </div>
      <p className="text-lg mb-6 italic text-gray-300">"{quote}"</p>
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gradient-to-br from-electric-blue to-cyber-purple rounded-full flex items-center justify-center text-xl font-bold border-2 border-electric-blue/50">
          {avatar}
        </div>
        <div>
          <div className="font-semibold">{name}</div>
          <div className="text-sm text-gray-400">{location}</div>
        </div>
      </div>
    </div>
  );
}
