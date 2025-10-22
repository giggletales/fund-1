import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../lib/auth';
import { supabase } from '../lib/db';
import { Copy, Check, Loader, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import GradientText from '../components/ui/GradientText';

const WALLETS = {
  ETH: '0x461bBf1B66978fE97B1A2bcEc52FbaB6aEDDF256',
  SOL: 'GZGsfmqx6bAYdXiVQs3QYfPFPjyfQggaMtBp5qm5R7r3'
};

const API_KEYS = {
  ETHERSCAN: 'R4ME8GMBMNT47DYT6E8E3ZQWA9NYXISBHR',
  SOLSCAN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjcmVhdGVkQXQiOjE3NTU4NjQ1OTM3MDYsImVtYWlsIjoidHJhZGVycmVkZ2Vwcm9AZ21haWwuY29tIiwiYWN0aW9uIjoidG9rZW4tYXBpIiwiYXBpVmVyc2lvbiI6InYyIiwiaWF0IjoxNzU1ODY0NTkzfQ.r01wCcgg5IHtPqyFVyllfo2YZcyP55Cc6szaQuHre9c'
};

export default function CryptoPayment() {
  const navigate = useNavigate();
  const location = useLocation();

  // Try to get data from location.state first, then fall back to URL params
  const urlParams = new URLSearchParams(location.search);
  const accountSize = location.state?.accountSize || Number(urlParams.get('accountSize'));
  const challengeType = location.state?.challengeType || urlParams.get('challengeType');
  const regularPrice = location.state?.regularPrice || Number(urlParams.get('regularPrice'));
  const discountPrice = location.state?.discountPrice || Number(urlParams.get('discountPrice'));
  const originalPrice = location.state?.originalPrice !== undefined
    ? location.state.originalPrice
    : Number(urlParams.get('originalPrice'));
  const isPayAsYouGo = location.state?.isPayAsYouGo || urlParams.get('isPayAsYouGo') === 'true';
  const phase2Price = location.state?.phase2Price || Number(urlParams.get('phase2Price'));

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedCrypto, setSelectedCrypto] = useState<'ETH' | 'SOL'>('ETH');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [copied, setCopied] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'checking' | 'success' | 'failed'>('idle');
  const [cryptoPrices, setCryptoPrices] = useState({ ETH: 0, SOL: 0 });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!accountSize || !challengeType) {
      navigate('/pricing');
    }
  }, [accountSize, challengeType]);

  const loadData = async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setUser(currentUser);
    await fetchCryptoPrices();
    setLoading(false);
  };

  const fetchCryptoPrices = async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,solana&vs_currencies=usd'
      );
      const data = await response.json();
      setCryptoPrices({
        ETH: data.ethereum.usd,
        SOL: data.solana.usd
      });
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
    }
  };

  const applyCoupon = async () => {
    setCouponError('');
    if (!couponCode.trim()) return;

    try {
      const { data, error } = await supabase.rpc('validate_coupon', {
        coupon_code: couponCode.toUpperCase(),
        challenge_type: challengeType
      });

      if (error) throw error;

      if (data.valid) {
        setAppliedCoupon(data);
        setCouponError('');
      } else {
        setCouponError(data.message || 'Invalid coupon');
        setAppliedCoupon(null);
      }
    } catch (error: any) {
      setCouponError('Error validating coupon');
      setAppliedCoupon(null);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  // Use regularPrice if available, otherwise calculate from discountPrice
  const fullPrice = regularPrice || (discountPrice ? discountPrice * 2 : originalPrice * 2);
  const basePrice = discountPrice || originalPrice;
  
  // Apply additional coupon discount if available
  const couponDiscountedPrice = appliedCoupon
    ? basePrice * (1 - appliedCoupon.discount_percent / 100)
    : basePrice;

  const finalPrice = couponDiscountedPrice;

  const cryptoAmount = selectedCrypto === 'ETH'
    ? (finalPrice / cryptoPrices.ETH).toFixed(6)
    : (finalPrice / cryptoPrices.SOL).toFixed(4);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const verifyPayment = async () => {
    if (!transactionHash.trim() && appliedCoupon?.discount_percent !== 100) {
      setVerificationStatus('failed');
      return;
    }

    setVerifying(true);
    setVerificationStatus('checking');

    try {
      let isValid = false;

      if (appliedCoupon?.discount_percent === 100) {
        isValid = true;
      } else {
        isValid = selectedCrypto === 'ETH'
          ? await verifyEthereumTransaction(transactionHash)
          : await verifySolanaTransaction(transactionHash);
      }

      if (isValid) {
        const paymentNotes = `Account: $${accountSize?.toLocaleString()}, Challenge: ${challengeType}${
          appliedCoupon ? `, Coupon: ${couponCode.toUpperCase()} (${appliedCoupon.discount_percent}% off)` : ''
        }${finalPrice > 0 ? `, Crypto: ${cryptoAmount} ${selectedCrypto}` : ', Free Access'}`;

        const { data: payment, error } = await supabase
          .from('payments')
          .insert({
            user_id: user.id,
            amount: finalPrice,
            currency: 'USD',
            payment_method: finalPrice > 0 ? `crypto_${selectedCrypto.toLowerCase()}` : 'coupon',
            transaction_id: transactionHash || 'FREE_' + Date.now(),
            status: 'completed',
            completed_at: new Date().toISOString(),
            notes: paymentNotes
          })
          .select()
          .maybeSingle();

        if (error) throw error;

        if (appliedCoupon) {
          await supabase.rpc('increment_coupon_usage', {
            coupon_code: couponCode.toUpperCase()
          });
        }

        // Get challenge type ID
        const { data: challengeTypeData, error: challengeTypeError } = await supabase
          .from('challenge_types')
          .select('id')
          .eq('challenge_code', challengeType)
          .maybeSingle();

        console.log('Challenge type lookup:', { challengeType, challengeTypeData, challengeTypeError });

        // Create user challenge record
        if (challengeTypeData) {
          const { data: userChallenge, error: userChallengeError } = await supabase
            .from('user_challenges')
            .insert({
              user_id: user.id,
              challenge_type_id: challengeTypeData.id,
              account_size: accountSize,
              amount_paid: finalPrice,
              payment_id: payment?.id,
              discount_applied: appliedCoupon ? true : false,
              status: 'pending_credentials',
              current_phase: isPayAsYouGo ? 1 : null,
              phase_2_paid: false,
              phase_2_price: isPayAsYouGo ? phase2Price : null
            })
            .select()
            .maybeSingle();

          console.log('User challenge creation:', { userChallenge, userChallengeError });

          if (userChallengeError) {
            console.error('Failed to create user challenge:', userChallengeError);
          } else if (userChallenge) {
            // Generate purchase congratulations certificate
            try {
              const { error: certError } = await supabase
                .from('downloads')
                .insert({
                  user_id: user.id,
                  challenge_id: userChallenge.id,
                  document_type: 'certificate',
                  title: 'Purchase Congratulations Certificate',
                  description: `Congratulations on purchasing your ${challengeType} challenge!`,
                  document_number: `PURCHASE-${Date.now()}`,
                  issue_date: new Date().toISOString(),
                  challenge_type: challengeType,
                  account_size: accountSize,
                  status: 'generated',
                  auto_generated: true,
                  generated_at: new Date().toISOString(),
                  download_count: 0
                });

              if (certError) {
                console.error('Failed to generate purchase certificate:', certError);
              }
            } catch (certError) {
              console.error('Certificate generation error:', certError);
            }

            // Generate purchase invoice
            try {
              const invoiceNumber = `INV-${Date.now()}-${userChallenge.id.slice(0, 8)}`;
              const { error: invoiceError } = await supabase
                .from('downloads')
                .insert({
                  user_id: user.id,
                  challenge_id: userChallenge.id,
                  document_type: 'invoice',
                  title: 'Purchase Invoice',
                  description: `Invoice for ${challengeType} challenge purchase`,
                  document_number: invoiceNumber,
                  issue_date: new Date().toISOString(),
                  challenge_type: challengeType,
                  account_size: accountSize,
                  amount: finalPrice,
                  status: 'generated',
                  auto_generated: true,
                  generated_at: new Date().toISOString(),
                  download_count: 0
                });

              if (invoiceError) {
                console.error('Failed to generate invoice:', invoiceError);
              }
            } catch (invoiceError) {
              console.error('Invoice generation error:', invoiceError);
            }

            // Generate payment receipt
            try {
              const receiptNumber = `RCPT-${Date.now()}-${userChallenge.id.slice(0, 8)}`;
              const { error: receiptError } = await supabase
                .from('downloads')
                .insert({
                  user_id: user.id,
                  challenge_id: userChallenge.id,
                  document_type: 'receipt',
                  title: 'Payment Receipt',
                  description: `Payment receipt for ${challengeType} challenge`,
                  document_number: receiptNumber,
                  issue_date: new Date().toISOString(),
                  challenge_type: challengeType,
                  account_size: accountSize,
                  amount: finalPrice,
                  payment_method: finalPrice > 0 ? `crypto_${selectedCrypto.toLowerCase()}` : 'coupon',
                  transaction_id: transactionHash || 'FREE_' + Date.now(),
                  status: 'generated',
                  auto_generated: true,
                  generated_at: new Date().toISOString(),
                  download_count: 0
                });

              if (receiptError) {
                console.error('Failed to generate receipt:', receiptError);
              }
            } catch (receiptError) {
              console.error('Receipt generation error:', receiptError);
            }
          }
        } else {
          console.error('Challenge type not found for code:', challengeType);
        }

        setVerificationStatus('success');

        setTimeout(() => {
          navigate('/dashboard', {
            state: {
              showWelcome: true,
              accountSize,
              challengeType,
              paymentId: payment.id
            }
          });
        }, 2000);
      } else {
        setVerificationStatus('failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationStatus('failed');
    } finally {
      setVerifying(false);
    }
  };

  const verifyEthereumTransaction = async (txHash: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${API_KEYS.ETHERSCAN}`
      );
      const data = await response.json();

      if (data.result) {
        const tx = data.result;
        const toAddress = tx.to?.toLowerCase();
        const valueInEth = parseInt(tx.value, 16) / 1e18;
        const expectedAmount = parseFloat(cryptoAmount);
        const tolerance = expectedAmount * 0.02;

        return (
          toAddress === WALLETS.ETH.toLowerCase() &&
          Math.abs(valueInEth - expectedAmount) <= tolerance
        );
      }
      return false;
    } catch (error) {
      console.error('Ethereum verification error:', error);
      return false;
    }
  };

  const verifySolanaTransaction = async (txHash: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `https://pro-api.solscan.io/v2.0/transaction/${txHash}`,
        {
          headers: {
            'token': API_KEYS.SOLSCAN
          }
        }
      );
      const data = await response.json();

      if (data.data) {
        const tx = data.data;
        const expectedAmount = parseFloat(cryptoAmount);
        const tolerance = expectedAmount * 0.02;

        const transfer = tx.tokenTransfers?.find((t: any) =>
          t.destination === WALLETS.SOL
        );

        if (transfer) {
          const amount = transfer.amount / 1e9;
          return Math.abs(amount - expectedAmount) <= tolerance;
        }
      }
      return false;
    } catch (error) {
      console.error('Solana verification error:', error);
      return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-deep-space flex items-center justify-center">
        <Loader className="animate-spin text-electric-blue" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-space relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-electric-blue/5 via-transparent to-cyber-purple/5"></div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4">
            <GradientText>Complete Your Payment</GradientText>
          </h1>
          <p className="text-xl text-gray-400">Secure crypto payment with instant verification</p>
        </div>

        <div className="glass-card p-8 mb-6 border-2 border-electric-blue/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">Account Size</p>
              <p className="text-2xl font-bold">
                <GradientText>${accountSize?.toLocaleString()}</GradientText>
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">Challenge Type</p>
              <p className="text-2xl font-bold capitalize">
                <GradientText>{challengeType}</GradientText>
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">Total Amount</p>
              {!appliedCoupon && (
                <>
                  <p className="text-sm text-gray-400 line-through">${fullPrice}</p>
                  <p className="text-2xl font-bold">
                    <GradientText>${basePrice}</GradientText>
                  </p>
                  <p className="text-xs text-neon-green mt-1">
                    50% OFF (Base Discount)
                  </p>
                </>
              )}
              {appliedCoupon && (
                <>
                  <p className="text-sm text-gray-400 line-through">${fullPrice}</p>
                  <p className="text-lg text-gray-300 line-through">${basePrice}</p>
                  <p className="text-2xl font-bold">
                    <GradientText>${finalPrice.toFixed(2)}</GradientText>
                  </p>
                  <p className="text-xs text-neon-green mt-1">
                    50% Base + {appliedCoupon.discount_percent}% Coupon = {Math.round(50 + (appliedCoupon.discount_percent * 0.5))}% Total OFF!
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="bg-neon-green/10 border border-neon-green/30 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-neon-green mb-2 flex items-center">
              <CheckCircle2 size={18} className="mr-2" />
              Apply Coupon Code
            </h3>
            <div className="flex space-x-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-electric-blue focus:outline-none uppercase"
                disabled={!!appliedCoupon}
              />
              {!appliedCoupon ? (
                <button
                  onClick={applyCoupon}
                  className="btn-gradient px-6"
                  disabled={!couponCode.trim()}
                >
                  Apply
                </button>
              ) : (
                <button
                  onClick={removeCoupon}
                  className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 px-6 py-2 rounded-lg transition-all"
                >
                  Remove
                </button>
              )}
            </div>
            {couponError && (
              <p className="text-red-500 text-sm mt-2">{couponError}</p>
            )}
            {appliedCoupon && (
              <p className="text-neon-green text-sm mt-2">
                ✓ {appliedCoupon.discount_percent}% discount applied! Only one coupon can be used per purchase.
              </p>
            )}
            {!appliedCoupon && (
              <p className="text-xs text-gray-500 mt-2">
                Try: LAUNCH50 for 50% off
              </p>
            )}
          </div>

          {finalPrice === 0 && appliedCoupon && (
            <div className="bg-neon-green/10 border border-neon-green/30 rounded-lg p-6 mb-6 text-center">
              <CheckCircle2 className="mx-auto mb-3 text-neon-green" size={48} />
              <h3 className="text-2xl font-bold mb-2 text-neon-green">Free Access Granted!</h3>
              <p className="text-gray-300">Your special coupon gives you 100% discount. Click below to continue to your dashboard.</p>
            </div>
          )}

          {finalPrice > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-4">Select Cryptocurrency</h3>
            <div className="grid grid-cols-2 gap-4">
              {(['ETH', 'SOL'] as const).map((crypto) => (
                <button
                  key={crypto}
                  onClick={() => setSelectedCrypto(crypto)}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    selectedCrypto === crypto
                      ? 'border-electric-blue bg-electric-blue/20'
                      : 'border-white/10 bg-white/5 hover:border-white/30'
                  }`}
                >
                  <div className="text-2xl font-bold mb-2">{crypto}</div>
                  <div className="text-sm text-gray-400">
                    {crypto === 'ETH' ? 'Ethereum' : 'Solana'}
                  </div>
                  <div className="text-lg font-semibold mt-2">
                    ${cryptoPrices[crypto].toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
            </div>
          )}

          {finalPrice > 0 && (
            <div className="bg-black/50 p-6 rounded-lg border border-white/10 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Send Payment To</h3>
              <span className="text-xs text-gray-400">{selectedCrypto} Network</span>
            </div>

            <div className="bg-white/5 p-4 rounded-lg mb-4">
              <p className="text-xs text-gray-400 mb-2">Wallet Address</p>
              <div className="flex items-center space-x-2">
                <code className="flex-1 text-sm break-all">{WALLETS[selectedCrypto]}</code>
                <button
                  onClick={() => copyToClipboard(WALLETS[selectedCrypto])}
                  className="p-2 bg-white/5 rounded hover:bg-white/10 transition-all"
                >
                  {copied ? (
                    <Check size={18} className="text-neon-green" />
                  ) : (
                    <Copy size={18} />
                  )}
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-r from-electric-blue/20 to-cyber-purple/20 p-6 rounded-lg border border-electric-blue/30">
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-2">Amount to Send</p>
                <p className="text-4xl font-bold mb-1">
                  <GradientText>{cryptoAmount} {selectedCrypto}</GradientText>
                </p>
                <p className="text-xs text-gray-400">≈ ${finalPrice} USD</p>
              </div>
            </div>
            </div>
          )}

          {finalPrice > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">
                Transaction Hash
              </label>
              <input
                type="text"
              value={transactionHash}
              onChange={(e) => setTransactionHash(e.target.value)}
              placeholder="Paste your transaction hash here"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-electric-blue focus:outline-none"
              disabled={verifying}
            />
            <p className="text-xs text-gray-500 mt-2">
              After sending the payment, paste the transaction hash here to verify
            </p>
            </div>
          )}

          {verificationStatus === 'failed' && finalPrice > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 flex items-start">
              <AlertCircle className="text-red-500 mr-3 flex-shrink-0" size={20} />
              <div>
                <p className="font-semibold text-red-500">Verification Failed</p>
                <p className="text-sm text-gray-400 mt-1">
                  Please check your transaction hash and ensure the correct amount was sent to the correct address.
                </p>
              </div>
            </div>
          )}

          {verificationStatus === 'success' && (
            <div className="bg-neon-green/10 border border-neon-green/30 rounded-lg p-4 mb-6 flex items-start">
              <CheckCircle2 className="text-neon-green mr-3 flex-shrink-0" size={20} />
              <div>
                <p className="font-semibold text-neon-green">Payment Verified!</p>
                <p className="text-sm text-gray-400 mt-1">
                  Redirecting to your dashboard...
                </p>
              </div>
            </div>
          )}

          <button
            onClick={verifyPayment}
            disabled={(finalPrice > 0 && !transactionHash.trim()) || verifying || verificationStatus === 'success'}
            className="w-full btn-gradient py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {verifying ? (
              <>
                <Loader className="animate-spin mr-2" size={20} />
                {finalPrice > 0 ? 'Verifying Payment...' : 'Processing...'}
              </>
            ) : verificationStatus === 'success' ? (
              <>
                <CheckCircle2 className="mr-2" size={20} />
                {finalPrice > 0 ? 'Payment Verified' : 'Access Granted'}
              </>
            ) : (
              finalPrice > 0 ? 'Verify Payment' : 'Continue to Dashboard'
            )}
          </button>

          <div className="mt-4 flex items-center justify-center space-x-4 text-sm text-gray-400">
            <a
              href={selectedCrypto === 'ETH'
                ? `https://etherscan.io/address/${WALLETS.ETH}`
                : `https://solscan.io/account/${WALLETS.SOL}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center hover:text-electric-blue transition-colors"
            >
              <ExternalLink size={14} className="mr-1" />
              View Wallet on Explorer
            </a>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>Payments are verified in real-time using blockchain APIs</p>
          <p className="mt-1">Your challenge account will be activated immediately after verification</p>
        </div>
      </div>
    </div>
  );
}
