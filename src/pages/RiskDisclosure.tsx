import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import GradientText from '../components/ui/GradientText';
import { AlertTriangle } from 'lucide-react';

export default function RiskDisclosure() {
  return (
    <div className="min-h-screen bg-deep-space">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-24">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
            <AlertTriangle size={32} />
          </div>
        </div>

        <h1 className="text-5xl font-bold mb-4 text-center">
          <GradientText>Risk Disclosure</GradientText>
        </h1>
        <p className="text-gray-400 mb-12 text-center">Last Updated: October 2025</p>

        <div className="glass-card p-8 mb-8 bg-red-500/10 border-red-500/30">
          <h2 className="text-2xl font-bold mb-4 text-red-400">Important Warning</h2>
          <p className="text-gray-300 leading-relaxed">
            Trading forex, commodities, indices, and cryptocurrencies involves substantial risk of loss
            and is not suitable for all investors. Past performance is not indicative of future results.
            You should carefully consider whether trading is suitable for you in light of your
            circumstances, knowledge, and financial resources.
          </p>
        </div>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-3xl font-bold mb-4">1. High Risk of Loss</h2>
            <p className="leading-relaxed mb-4">
              Trading leveraged products such as forex and CFDs carries a high level of risk since
              leverage can work both in your favor and to your disadvantage. As a result, trading may
              not be suitable for all investors because you could lose all of your invested capital.
            </p>
            <div className="glass-card p-6 bg-orange-500/10 border-orange-500/30">
              <p className="font-semibold text-orange-400">
                You should not risk more than you are prepared to lose and should carefully consider
                your trading objectives, level of experience, and risk appetite.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">2. No Guaranteed Profits</h2>
            <p className="leading-relaxed">
              There are no guarantees of profit in trading. Any testimonials or success stories
              shown on our platform are not typical results and should not be interpreted as a
              representation that all traders will achieve similar results. Individual results will
              vary based on strategy, discipline, and market conditions.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">3. Evaluation Challenge Risks</h2>
            <p className="leading-relaxed mb-4">
              The Fund8r evaluation process is designed to be challenging. Key risks include:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Challenge fees are non-refundable once trading begins</li>
              <li>Automatic account termination upon rule violations</li>
              <li>No discretion or warnings provided before rule enforcement</li>
              <li>Real-time automated monitoring of all accounts</li>
              <li>Majority of participants do not complete the evaluation</li>
              <li>Passing the evaluation does not guarantee profitability</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">4. Platform and Technical Risks</h2>
            <p className="leading-relaxed mb-4">
              Technical issues may impact your trading:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Internet connectivity failures</li>
              <li>Trading platform outages</li>
              <li>Delayed price feeds or execution</li>
              <li>Slippage during volatile market conditions</li>
              <li>System maintenance or downtime</li>
            </ul>
            <p className="leading-relaxed mt-4">
              Fund8r is not responsible for losses resulting from technical issues, whether on our
              systems or third-party platforms.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">5. Market Volatility</h2>
            <p className="leading-relaxed">
              Financial markets can experience extreme volatility, especially during:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
              <li>Economic data releases and news events</li>
              <li>Geopolitical events and crises</li>
              <li>Market opening and closing hours</li>
              <li>Low liquidity periods</li>
              <li>Unexpected market shocks</li>
            </ul>
            <p className="leading-relaxed mt-4">
              Volatility can result in rapid price movements that may trigger rule violations or
              significant losses within minutes.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">6. Leverage Risk</h2>
            <p className="leading-relaxed">
              The accounts provided by Fund8r include leverage. While leverage allows you to control
              larger positions with less capital, it also magnifies both gains and losses. A small
              market movement can have a proportionately larger impact on your account balance.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">7. No Financial Advice</h2>
            <p className="leading-relaxed">
              Fund8r does not provide investment advice, trading signals, or recommendations. All
              trading decisions are made solely by you. We are not financial advisors and our
              educational materials are for informational purposes only.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">8. Psychological Factors</h2>
            <p className="leading-relaxed">
              Trading can be emotionally and psychologically demanding. Common psychological risks
              include:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
              <li>Stress and anxiety from managing positions</li>
              <li>Emotional decision-making after losses</li>
              <li>Overconfidence following winning streaks</li>
              <li>Fear of missing out (FOMO)</li>
              <li>Revenge trading after losses</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">9. Jurisdictional Limitations</h2>
            <p className="leading-relaxed">
              Fund8r services may not be available in all jurisdictions. It is your responsibility
              to ensure that your participation complies with local laws and regulations. We do not
              accept participants from certain countries where prop trading services are restricted.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">10. Past Performance</h2>
            <p className="leading-relaxed">
              Any historical performance data, backtests, or simulated results shown on our platform
              should not be relied upon as an indicator of future performance. Simulated trading
              differs from actual trading in that positions are not actually executed.
            </p>
          </section>

          <section className="glass-card p-8 bg-red-500/10 border-red-500/30">
            <h2 className="text-3xl font-bold mb-4 text-red-400">Your Acknowledgment</h2>
            <p className="leading-relaxed mb-4">
              By using Fund8r's services, you acknowledge that:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>You have read and understood this Risk Disclosure</li>
              <li>You are aware of the risks involved in trading</li>
              <li>You accept full responsibility for all trading decisions</li>
              <li>You understand that losses may exceed your challenge fee</li>
              <li>You are financially capable of bearing such losses</li>
              <li>You have sought independent advice if necessary</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">Questions or Concerns?</h2>
            <p className="leading-relaxed">
              If you have any questions about the risks involved in trading or Fund8r's services,
              please contact us at:{' '}
              <a href="mailto:risk@fund8r.com" className="text-electric-blue hover:text-electric-blue/80">
                risk@fund8r.com
              </a>
            </p>
          </section>

          <section className="pt-8 border-t border-white/10">
            <p className="text-sm text-gray-500 italic text-center">
              This risk disclosure is part of our Terms & Conditions. Trading involves significant
              risk. Only trade with funds you can afford to lose.
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}
