import { useState } from 'react';
import { Check, FileText, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/db';
import GradientText from '../ui/GradientText';

interface ContractAcceptanceProps {
  accountId: string;
  accountSize: number;
  accountType: string;
  onAccepted: () => void;
}

export default function ContractAcceptance({
  accountId,
  accountSize,
  accountType,
  onAccepted,
}: ContractAcceptanceProps) {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleAcceptContract() {
    if (!agreed) {
      setError('You must read and agree to the terms before proceeding');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const { ip } = await response.json();

      const { data, error: dbError } = await supabase.rpc('accept_contract', {
        p_account_id: accountId,
        p_ip_address: ip,
      });

      if (dbError) throw dbError;

      if (data?.success) {
        onAccepted();
      } else {
        setError(data?.error || 'Failed to accept contract');
      }
    } catch (err: any) {
      console.error('Error accepting contract:', err);
      setError(err.message || 'Failed to accept contract');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-gradient-to-br from-electric-blue/10 to-cyber-purple/10 rounded-xl p-8 border border-white/20">
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 bg-electric-blue/20 rounded-lg">
          <FileText className="w-8 h-8 text-electric-blue" />
        </div>
        <div>
          <h3 className="text-2xl font-bold mb-2">
            <GradientText>Contract Acceptance Required</GradientText>
          </h3>
          <p className="text-white/70">
            Please review and accept the trading agreement to proceed with your ${accountSize.toLocaleString()} {accountType.toUpperCase()} challenge.
          </p>
        </div>
      </div>

      <div className="bg-white/5 rounded-lg p-6 mb-6 border border-white/10 max-h-96 overflow-y-auto">
        <h4 className="font-bold text-lg mb-4 text-yellow-400">⚠️ Fund8r Master Service Agreement - LEGALLY BINDING CONTRACT</h4>
        <p className="text-xs text-yellow-400/80 mb-4">Effective Date: {new Date().toLocaleDateString()} | Last Updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-4 text-sm text-white/80">
          <section className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
            <h5 className="font-bold text-yellow-400 mb-2">⚠️ CRITICAL RISK DISCLOSURE</h5>
            <p className="font-semibold text-white">
              TRADING INVOLVES SUBSTANTIAL RISK OF LOSS. The Company provides simulated trading environments for evaluation purposes. Past
              performance is not indicative of future results. Traders should never risk more than they can afford to lose.
            </p>
          </section>

          <section>
            <h5 className="font-semibold text-white mb-2">1. Nature of Service</h5>
            <p>Fund8r ("Company," "we," "us") operates as an evaluation service provider offering simulated trading challenges. This is NOT a live trading account with real funds. All trading is conducted in a demo/simulated environment. No real money is at risk during evaluation phases.</p>
          </section>

          <section>
            <h5 className="font-semibold text-white mb-2">2. Challenge Terms & Account Details</h5>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Challenge Type: ${accountSize.toLocaleString()} {accountType.toUpperCase()}</li>
              <li>Platform: MetaTrader 5 (MT5)</li>
              <li>All trading rules must be strictly followed at all times</li>
              <li>Violation of ANY rule results in immediate disqualification without refund</li>
              <li>Challenge fees are NON-REFUNDABLE except as required by applicable law</li>
            </ul>
          </section>

          <section>
            <h5 className="font-semibold text-white mb-2">3. Trading Rules & Restrictions</h5>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Profit targets, maximum daily loss, and maximum total drawdown limits must be observed</li>
              <li>Minimum trading days requirement must be met before payouts</li>
              <li>High-frequency trading (HFT), arbitrage, and latency-exploiting strategies are PROHIBITED</li>
              <li>Account manipulation, hedging across accounts, and copy trading are strictly FORBIDDEN</li>
              <li>News trading within [specified timeframe] of high-impact events may be restricted</li>
              <li>Weekend/overnight holding rules must be followed as specified in your challenge type</li>
            </ul>
          </section>

          <section>
            <h5 className="font-semibold text-white mb-2">4. Account Security & Credentials</h5>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Login credentials are provided ONCE after contract acceptance and CANNOT be recovered if lost</li>
              <li>You are SOLELY responsible for maintaining credential security</li>
              <li>Sharing, selling, or transferring credentials to third parties is STRICTLY PROHIBITED</li>
              <li>Multiple logins from different IP addresses/locations will be flagged and may result in termination</li>
              <li>Use of VPNs, proxies, or location-masking services is prohibited without prior written approval</li>
            </ul>
          </section>

          <section>
            <h5 className="font-semibold text-white mb-2">5. Payouts & Profit Distribution</h5>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Payouts are available ONLY after successfully completing all challenge phases</li>
              <li>Profit split percentages are as specified in your challenge terms</li>
              <li>Minimum payout threshold: $100 USD</li>
              <li>Payout processing: 1-14 business days upon request</li>
              <li>Company reserves the right to withhold payouts pending compliance review</li>
              <li>Suspicious trading patterns may delay or void payout eligibility</li>
            </ul>
          </section>

          <section>
            <h5 className="font-semibold text-white mb-2">6. Monitoring & Compliance</h5>
            <p>The Company employs automated and manual monitoring systems to ensure compliance. All trading activity is recorded and analyzed. Company reserves the right to review any trade, pattern, or activity at any time without notice.</p>
          </section>

          <section>
            <h5 className="font-semibold text-white mb-2">7. Termination</h5>
            <p>The Company reserves the right to terminate any account that violates trading rules, engages in prohibited practices, or acts in bad faith. Evaluation fees are non-refundable except as required by law.</p>
          </section>

          <section>
            <h5 className="font-semibold text-white mb-2">8. Limitation of Liability</h5>
            <p className="font-semibold text-white">
              THE COMPANY'S LIABILITY IS LIMITED TO THE EVALUATION FEES PAID BY THE TRADER. THE COMPANY IS NOT LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES ARISING FROM THE USE OF ITS SERVICES. TRADER WAIVES ALL CLAIMS BEYOND REFUND OF FEES WHERE APPLICABLE.
            </p>
          </section>

          <section>
            <h5 className="font-semibold text-white mb-2">9. Data & Privacy</h5>
            <p>The Company collects and processes trading data and personal information in accordance with its Privacy Policy. All trading activity is monitored for compliance and risk management purposes. By accepting this agreement, you consent to data collection and analysis.</p>
          </section>

          <section>
            <h5 className="font-semibold text-white mb-2">10. Governing Law & Dispute Resolution</h5>
            <p>This Agreement is governed by applicable laws. Any disputes shall be resolved through binding arbitration. Trader waives right to participate in class action lawsuits against the Company.</p>
          </section>

          <section>
            <h5 className="font-semibold text-white mb-2">11. No Financial Advice</h5>
            <p>The Company does NOT provide investment advice, financial planning, or trading recommendations. All trading decisions are made independently by the Trader.</p>
          </section>

          <section>
            <h5 className="font-semibold text-white mb-2">12. Age & Eligibility</h5>
            <p>Trader must be at least 18 years old and legally capable of entering contracts. Trader is responsible for compliance with local laws and regulations.</p>
          </section>

          <section>
            <h5 className="font-semibold text-white mb-2">13. Modifications</h5>
            <p>Company may modify terms with 30 days notice. Continued use after modifications constitutes acceptance of new terms.</p>
          </section>

          <section className="bg-red-500/10 border border-red-500/30 rounded p-3">
            <h5 className="font-bold text-red-400 mb-2">14. Final Acknowledgment</h5>
            <p className="font-semibold text-white">
              BY ACCEPTING THIS CONTRACT, YOU ACKNOWLEDGE: (a) You have READ and UNDERSTOOD all terms; (b) You AGREE to be legally bound; (c) You WAIVE any claims beyond those expressly permitted; (d) You understand this is a SIMULATION for evaluation; (e) You accept ALL RISKS associated with trading.
            </p>
          </section>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg mb-4">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <label className="flex items-start gap-3 p-4 bg-white/5 rounded-lg border border-white/10 mb-6 cursor-pointer hover:bg-white/10 transition-colors">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => {
            setAgreed(e.target.checked);
            setError('');
          }}
          className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 text-electric-blue focus:ring-electric-blue focus:ring-offset-0"
        />
        <span className="text-sm text-white/80">
          I have read and agree to the Fund8r Proprietary Trading Agreement. I understand the trading rules,
          risk disclosures, and terms outlined above. I acknowledge that my IP address ({' '}
          <span className="text-electric-blue font-mono">will be recorded</span>) for legal verification purposes.
        </span>
      </label>

      <button
        onClick={handleAcceptContract}
        disabled={!agreed || loading}
        className={`w-full py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all ${
          agreed && !loading
            ? 'bg-gradient-to-r from-neon-green to-electric-blue text-black hover:scale-105'
            : 'bg-white/10 text-white/40 cursor-not-allowed'
        }`}
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            Processing...
          </>
        ) : (
          <>
            <Check className="w-6 h-6" />
            Accept Contract & Proceed
          </>
        )}
      </button>

      <p className="text-center text-xs text-white/50 mt-4">
        By clicking Accept, you electronically sign this agreement on {new Date().toLocaleDateString()}
      </p>
    </div>
  );
}
