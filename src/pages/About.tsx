import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import GradientText from '../components/ui/GradientText';
import AnimatedBackground from '../components/AnimatedBackground';
import { Target, Users, TrendingUp, Shield, Award, Globe } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <Navbar />

      <div className="relative z-10">
        <section className="pt-40 pb-20 px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              About <GradientText>Fund8r</GradientText>
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed">
              We're building the most transparent, trader-friendly prop firm in the industry.
              No hidden fees. No predatory practices. Just fair evaluation and real funding.
            </p>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="glass-card p-12 mb-16">
              <h2 className="text-3xl font-bold mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>
                  Fund8r was founded in 2024 by a team of professional traders who were frustrated
                  with the predatory practices plaguing the prop trading industry. We saw firms
                  charging exorbitant fees, hiding rules in fine print, and designing challenges
                  to maximize failure rates rather than identify genuine talent.
                </p>
                <p>
                  We decided to build something different: a prop firm that actually wants its
                  traders to succeed. Every rule we've created, every system we've designed, and
                  every decision we make is guided by one principle: <strong>transparency and fairness</strong>.
                </p>
                <p>
                  Today, Fund8r serves thousands of traders worldwide, paying out millions in
                  profits to skilled traders who pass our fair evaluation process. We're proud
                  to offer some of the industry's best profit splits (up to 90%) and fastest
                  payout times (48 hours).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              <div className="glass-card p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-electric-blue to-cyber-purple rounded-full flex items-center justify-center mb-6">
                  <Target size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                <p className="text-gray-300 leading-relaxed">
                  To democratize access to trading capital by providing transparent, fair
                  evaluations that identify skilled traders and empower them with the funding
                  they need to succeed.
                </p>
              </div>

              <div className="glass-card p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-neon-green to-electric-blue rounded-full flex items-center justify-center mb-6">
                  <TrendingUp size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
                <p className="text-gray-300 leading-relaxed">
                  To become the most trusted name in proprietary trading by maintaining the
                  highest standards of transparency, delivering exceptional trader support, and
                  creating a community where talent thrives.
                </p>
              </div>
            </div>

            <div className="mb-16">
              <h2 className="text-3xl font-bold mb-8 text-center">
                Why <GradientText>Traders Choose Us</GradientText>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-electric-blue to-cyber-purple rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">100% Transparent</h3>
                  <p className="text-gray-400">
                    All rules visible upfront. No hidden fees. No surprise violations.
                  </p>
                </div>

                <div className="glass-card p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-neon-green to-electric-blue rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Fair Evaluation</h3>
                  <p className="text-gray-400">
                    Realistic targets. No time pressure. Designed for trader success.
                  </p>
                </div>

                <div className="glass-card p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyber-purple to-neon-green rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Real Support</h3>
                  <p className="text-gray-400">
                    24/5 live chat. Real traders helping traders. Not bots.
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card p-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-electric-blue to-cyber-purple rounded-full flex items-center justify-center mx-auto mb-6">
                <Globe size={32} />
              </div>
              <h2 className="text-3xl font-bold mb-4">
                Join Our Growing <GradientText>Global Community</GradientText>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto mt-8">
                <div>
                  <div className="text-4xl font-bold text-electric-blue mb-2">12,847</div>
                  <div className="text-gray-400">Active Traders</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-neon-green mb-2">$2.4M+</div>
                  <div className="text-gray-400">Paid Out</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-cyber-purple mb-2">140+</div>
                  <div className="text-gray-400">Countries</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-electric-blue mb-2">48hr</div>
                  <div className="text-gray-400">Avg Payout</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}
