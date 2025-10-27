import Footer from '../components/Footer';
import Navbar from '../components/Navbar';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-deep-space">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-24">
        <h1 className="text-5xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-gray-400 mb-12">Last Updated: January 2024</p>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-3xl font-bold mb-4">1. Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">Personal Information</h3>
                <p className="leading-relaxed">
                  Name, email address, phone number, date of birth, address, and government-issued
                  ID (for KYC verification).
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Trading Information</h3>
                <p className="leading-relaxed">
                  Account balances, trades, profit/loss, trading statistics, and performance metrics.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Technical Information</h3>
                <p className="leading-relaxed">
                  IP address, browser type, device information, cookies, and tracking technologies.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">2. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide and improve our services</li>
              <li>Process payments and payouts</li>
              <li>Comply with KYC/AML regulations</li>
              <li>Send service-related communications</li>
              <li>Prevent fraud and abuse</li>
              <li>Analytics and research</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">3. Information Sharing</h2>
            <p className="leading-relaxed mb-4">
              We do NOT sell your personal information.
            </p>
            <p className="leading-relaxed">
              We may share information with:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
              <li>Payment processors (Stripe, PayPal)</li>
              <li>KYC verification providers</li>
              <li>Legal authorities (when required by law)</li>
              <li>Service providers (hosting, email)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">4. Data Security</h2>
            <p className="leading-relaxed mb-4">
              We implement industry-standard security measures:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>256-bit SSL encryption</li>
              <li>Secure database storage</li>
              <li>Regular security audits</li>
              <li>Access controls</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">5. Your Rights</h2>
            <p className="leading-relaxed mb-4">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Access your personal data</li>
              <li>Request data correction</li>
              <li>Request data deletion</li>
              <li>Opt-out of marketing emails</li>
              <li>Export your data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">6. Cookies</h2>
            <p className="leading-relaxed">
              We use cookies for authentication, preferences, analytics (Google Analytics), and
              advertising (optional). You can disable cookies in your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">7. Data Retention</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Active accounts: Indefinitely</li>
              <li>Inactive accounts: 7 years (compliance)</li>
              <li>Marketing data: Until opt-out</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">8. Contact Us</h2>
            <p className="leading-relaxed">
              For privacy inquiries: privacy@fund8r.com
            </p>
          </section>

          <section>
            <p className="text-sm text-gray-400 italic">
              This policy complies with GDPR, CCPA, and international privacy regulations.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
