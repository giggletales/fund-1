import { Twitter, MessageCircle, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-black/50 border-t border-white/10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-electric-blue to-cyber-purple rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold">F8</span>
              </div>
              <span className="text-xl font-heading font-bold">Fund8r</span>
            </div>
            <p className="text-gray-400 text-sm">
              Transparent Evaluation. Real Funding.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/about" className="hover:text-electric-blue transition-colors">About Us</a></li>
              <li><a href="/#how-it-works" className="hover:text-electric-blue transition-colors">How It Works</a></li>
              <li><a href="/contact" className="hover:text-electric-blue transition-colors">Contact</a></li>
              <li><a href="/faq" className="hover:text-electric-blue transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/challenge-types" className="hover:text-electric-blue transition-colors">Challenges</a></li>
              <li><a href="/#rules" className="hover:text-electric-blue transition-colors">Trading Rules</a></li>
              <li><a href="/dashboard" className="hover:text-electric-blue transition-colors">Dashboard</a></li>
              <li><a href="/contact" className="hover:text-electric-blue transition-colors">Support</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/terms" className="hover:text-electric-blue transition-colors">Terms & Conditions</a></li>
              <li><a href="/privacy" className="hover:text-electric-blue transition-colors">Privacy Policy</a></li>
              <li><a href="/risk-disclosure" className="hover:text-electric-blue transition-colors">Risk Disclosure</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm text-gray-400 mb-4 md:mb-0">
            © 2024 Fund8r. All rights reserved.
          </p>
          <div className="flex items-center space-x-6">
            <a href="#" className="text-gray-400 hover:text-electric-blue transition-colors">
              <Twitter size={20} />
            </a>
            <a href="#" className="text-gray-400 hover:text-electric-blue transition-colors">
              <MessageCircle size={20} />
            </a>
            <a href="#" className="text-gray-400 hover:text-electric-blue transition-colors">
              <Mail size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
