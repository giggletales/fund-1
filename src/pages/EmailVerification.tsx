import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://fund-backend-pbde.onrender.com/api';

export default function EmailVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || localStorage.getItem('verificationEmail');
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) {
      navigate('/signup');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (timeLeft > 0 && !success) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, success]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    if (!/^[0-9]*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^[0-9]{6}$/.test(pastedData)) return;

    const newCode = pastedData.split('');
    setCode(newCode);
    inputRefs.current[5]?.focus();
    handleVerify(pastedData);
  };

  const handleVerify = async (verificationCode?: string) => {
    const codeToVerify = verificationCode || code.join('');
    
    if (codeToVerify.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Signup state:', { email, code: codeToVerify });
      console.log('Sending verification to:', `${API_URL}/verification/verify-code`);
      
      const response = await fetch(`${API_URL}/verification/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: codeToVerify })
      });

      console.log('State check:', { status: response.status, ok: response.ok });
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Error sending verification code:', 'Response is not JSON');
        throw new Error('Server returned invalid response. Please try again.');
      }

      const data = await response.json();
      console.log('Signup result:', data);

      if (data.success) {
        setSuccess(true);
        localStorage.removeItem('verificationEmail');
        
        // Check if there's a pending payment
        const pendingPayment = localStorage.getItem('pendingPayment');
        
        setTimeout(() => {
          if (pendingPayment) {
            const paymentData = JSON.parse(pendingPayment);
            localStorage.removeItem('pendingPayment');
            
            // Redirect to payment page with stored data
            const paymentUrl = `/payment?accountSize=${paymentData.accountSize}&challengeType=${encodeURIComponent(paymentData.challengeType)}&originalPrice=${paymentData.originalPrice}${paymentData.isPayAsYouGo ? `&isPayAsYouGo=true&phase2Price=${paymentData.phase2Price}` : ''}`;
            window.location.href = paymentUrl;
          } else {
            // No pending payment, go to dashboard
            navigate('/dashboard', { state: { emailVerified: true, email } });
          }
        }, 2000);
      } else {
        setError(data.message || 'Invalid verification code');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      console.error('Error sending verification code:', err);
      setError(err.message || 'Failed to verify code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/verification/resend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned invalid response. Please try again.');
      }

      const data = await response.json();

      if (data.success) {
        setTimeLeft(600);
        setResendCooldown(60);
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        alert('New verification code sent to your email!');
      } else {
        setError(data.message || 'Failed to resend code');
      }
    } catch (err: any) {
      console.error('Error resending code:', err);
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!email) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              {success ? (
                <CheckCircle className="w-10 h-10 text-white" />
              ) : (
                <Mail className="w-10 h-10 text-white" />
              )}
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
            {success ? 'Email Verified!' : 'Verify Your Email'}
          </h1>
          <p className="text-center text-gray-600 mb-8">
            {success
              ? 'Redirecting to payment page...'
              : `We sent a 6-digit code to ${email}`}
          </p>

          {!success && (
            <>
              <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                      error
                        ? 'border-red-500'
                        : digit
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-300'
                    }`}
                    disabled={loading || success}
                  />
                ))}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg mb-4">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="text-sm text-gray-600">
                  {timeLeft > 0 ? (
                    <span>Code expires in <strong className="text-purple-600">{formatTime(timeLeft)}</strong></span>
                  ) : (
                    <span className="text-red-600">Code expired</span>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleVerify()}
                disabled={loading || code.some(d => !d)}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all mb-4"
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>

              <button
                onClick={handleResend}
                disabled={resendCooldown > 0 || loading}
                className="w-full flex items-center justify-center gap-2 text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                {resendCooldown > 0
                  ? `Resend code in ${resendCooldown}s`
                  : 'Resend verification code'}
              </button>
            </>
          )}

          {success && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-green-600 bg-green-50 px-6 py-3 rounded-lg">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Email verified successfully!</span>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-gray-300 text-sm mt-6">
          Didn't receive the code? Check your spam folder or{' '}
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className="text-purple-300 hover:text-purple-200 underline disabled:opacity-50"
          >
            resend
          </button>
        </p>
      </div>
    </div>
  );
}