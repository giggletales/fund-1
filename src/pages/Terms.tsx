import Footer from '../components/Footer';
import Navbar from '../components/Navbar';

export default function Terms() {
  return (
    <div className="min-h-screen bg-deep-space">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-24">
        <h1 className="text-5xl font-bold mb-4">Terms & Conditions</h1>
        <p className="text-gray-400 mb-12">Last Updated: January 2024</p>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-3xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p className="leading-relaxed">
              By accessing and using Fund8r, you accept and agree to be bound by these Terms
              and Conditions. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">2. Service Description</h2>
            <p className="leading-relaxed mb-4">
              Fund8r provides an evaluation service that assesses traders' skills through a
              structured 2-phase challenge system. Upon successful completion, traders receive
              access to funded trading accounts.
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Phase 1: Demonstrate profitability (8% profit target)</li>
              <li>Phase 2: Confirm consistency (5% profit target)</li>
              <li>Funded Account: Trade with our capital and receive profit splits</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">3. Evaluation Rules</h2>
            <div className="glass-card p-6">
              <h3 className="text-xl font-semibold mb-3">Phase 1 & 2 Rules</h3>
              <ul className="space-y-2">
                <li>Profit Target: 8% (Phase 1), 5% (Phase 2)</li>
                <li>Maximum Drawdown: 6%</li>
                <li>Daily Loss Limit: 3%</li>
                <li>Minimum Trading Days: 5</li>
                <li>All trading strategies allowed except prohibited activities</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">4. Automatic Breach</h2>
            <p className="leading-relaxed">
              Accounts are automatically terminated if rules are violated. This is enforced by
              automated systems monitoring your account in real-time. No manual intervention or
              warnings will be provided once limits are reached.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">5. Fees and Payments</h2>
            <p className="leading-relaxed">
              One-time payment required for Phase 1. Phase 2 is always FREE. No monthly fees or
              hidden charges. Challenge fees are non-refundable upon breach or completion.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">6. Prohibited Activities</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Tick scalping (sub-1-second trades exploiting latency)</li>
              <li>Reverse arbitrage</li>
              <li>Cross-account hedging</li>
              <li>Account management for third parties</li>
              <li>Credential sharing</li>
              <li>Platform exploitation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">7. Profit Splits</h2>
            <p className="leading-relaxed mb-4">
              Funded account profit distributions:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>$5-10K accounts: 80% trader / 20% company</li>
              <li>$25-50K accounts: 85% trader / 15% company</li>
              <li>$100-200K accounts: 90% trader / 10% company</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">8. Limitation of Liability</h2>
            <p className="leading-relaxed">
              Fund8r is not liable for trading losses, platform downtime, third-party service
              failures, or force majeure events. Maximum liability is limited to the amount paid
              for the challenge fee.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">9. Contact</h2>
            <p className="leading-relaxed">
              For questions regarding these terms: legal@fund8r.com
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
