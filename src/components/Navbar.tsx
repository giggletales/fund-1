import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import GradientText from './ui/GradientText';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/10 transition-all duration-300 ${scrolled ? 'py-2' : 'py-0'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <a href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-electric-blue to-cyber-purple rounded-lg flex items-center justify-center">
              <span className="text-xl font-bold">F8</span>
            </div>
            <span className="text-2xl font-heading font-bold"><GradientText>Fund8r</GradientText></span>
          </a>

          <div className="hidden md:flex items-center space-x-8">
            <a href="/#how-it-works" className="hover:text-electric-blue transition-colors">How It Works</a>
            <a href="/challenge-types" className="hover:text-electric-blue transition-colors">Challenges</a>
            <a href="/faq" className="hover:text-electric-blue transition-colors">FAQ</a>
            <a href="/about" className="hover:text-electric-blue transition-colors">About</a>
            <a href="/contact" className="hover:text-electric-blue transition-colors">Contact</a>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <a href="/login" className="px-6 py-2 text-white hover:text-electric-blue transition-colors relative group">
              Login
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-electric-blue transition-all group-hover:w-full"></span>
            </a>
            <a href="/signup" className="btn-gradient">
              Get Started
            </a>
          </div>

          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden glass-card border-t border-white/10">
          <div className="px-4 pt-2 pb-4 space-y-3">
            <a href="/#how-it-works" className="block py-2 hover:text-electric-blue transition-colors">How It Works</a>
            <a href="/challenge-types" className="block py-2 hover:text-electric-blue transition-colors">Challenges</a>
            <a href="/faq" className="block py-2 hover:text-electric-blue transition-colors">FAQ</a>
            <a href="/about" className="block py-2 hover:text-electric-blue transition-colors">About</a>
            <a href="/contact" className="block py-2 hover:text-electric-blue transition-colors">Contact</a>
            <div className="pt-4 space-y-2">
              <a href="/login" className="block w-full px-6 py-2 text-white hover:text-electric-blue transition-colors text-center">
                Login
              </a>
              <a href="/signup" className="block w-full text-center btn-gradient">
                Get Started
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
