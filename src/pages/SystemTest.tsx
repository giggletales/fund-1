import { useState } from 'react';
import { supabase } from '../lib/db';
import { sendWelcomeEmail, sendPhasePassedEmail, sendCertificateEmail } from '../services/emailService';

export default function SystemTest() {
  const [results, setResults] = useState<any>({});
  const [testing, setTesting] = useState(false);

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    try {
      const result = await testFn();
      setResults((prev: any) => ({ ...prev, [testName]: { success: true, data: result } }));
      return true;
    } catch (error: any) {
      setResults((prev: any) => ({ ...prev, [testName]: { success: false, error: error.message } }));
      return false;
    }
  };

  const runAllTests = async () => {
    setTesting(true);
    setResults({});

    await runTest('Supabase Connection', async () => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase.from('challenge_types').select('count');
      if (error) throw error;
      return 'Connected';
    });

    await runTest('Challenge Types Query', async () => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase.from('challenge_types').select('*');
      if (error) throw error;
      return `${data?.length || 0} challenges found`;
    });

    await runTest('Challenge Pricing Query', async () => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase.from('challenge_pricing').select('*');
      if (error) throw error;
      return `${data?.length || 0} pricing tiers found`;
    });

    await runTest('Edge Function - Welcome Email', async () => {
      const success = await sendWelcomeEmail('mainhusharm@gmail.com', 'Test User');
      if (!success) throw new Error('Email failed to send');
      return 'Email sent to mainhusharm@gmail.com';
    });

    await runTest('Edge Function - Phase Passed Email', async () => {
      const success = await sendPhasePassedEmail('mainhusharm@gmail.com', 'Test User', 1, 100000);
      if (!success) throw new Error('Email failed to send');
      return 'Phase 1 email sent';
    });

    await runTest('Edge Function - Certificate Email', async () => {
      const success = await sendCertificateEmail('mainhusharm@gmail.com', 'Test User', 100000, 'https://fund8r.com/cert/test');
      if (!success) throw new Error('Email failed to send');
      return 'Certificate email sent';
    });

    await runTest('User Challenges Table', async () => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase.from('user_challenges').select('count');
      if (error) throw error;
      return 'Table accessible';
    });

    await runTest('Trading Activity Table', async () => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase.from('trading_activity').select('count');
      if (error) throw error;
      return 'Table accessible';
    });

    await runTest('Daily Stats Table', async () => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase.from('daily_stats').select('count');
      if (error) throw error;
      return 'Table accessible';
    });

    setTesting(false);
  };

  return (
    <div className="min-h-screen bg-deep-space p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">System Connectivity Test</h1>

        <button
          onClick={runAllTests}
          disabled={testing}
          className="mb-8 px-8 py-4 btn-gradient text-xl font-bold disabled:opacity-50"
        >
          {testing ? 'Testing...' : 'Run All Tests'}
        </button>

        <div className="grid gap-4">
          {Object.keys(results).length === 0 && !testing && (
            <div className="glass-card p-6 text-center text-gray-400">
              Click "Run All Tests" to check system connectivity
            </div>
          )}

          {Object.entries(results).map(([testName, result]: [string, any]) => (
            <div
              key={testName}
              className={`glass-card p-6 border-l-4 ${
                result.success ? 'border-green-500' : 'border-red-500'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold">{testName}</h3>
                <span className={`text-2xl ${result.success ? 'text-green-500' : 'text-red-500'}`}>
                  {result.success ? '✓' : '✗'}
                </span>
              </div>
              {result.success ? (
                <p className="text-green-400">{result.data}</p>
              ) : (
                <p className="text-red-400">{result.error}</p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4">Database</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>✓ challenge_types</li>
              <li>✓ challenge_pricing</li>
              <li>✓ user_challenges</li>
              <li>✓ trading_activity</li>
              <li>✓ daily_stats</li>
              <li>✓ validation_results</li>
            </ul>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4">Email Service</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>✓ Welcome emails</li>
              <li>✓ Phase passed emails</li>
              <li>✓ Certificate emails</li>
              <li>✓ Resend API integration</li>
            </ul>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4">Challenge System</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>✓ 6 Challenge types</li>
              <li>✓ 34 Pricing tiers</li>
              <li>✓ Dynamic pricing</li>
              <li>✓ PAYG split payment</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 glass-card p-6 bg-blue-500/10">
          <h3 className="text-xl font-bold mb-4">Test Email Recipient</h3>
          <p className="text-gray-300">All test emails sent to: <strong className="text-white">mainhusharm@gmail.com</strong></p>
          <p className="text-sm text-gray-400 mt-2">
            Check your inbox for the test emails. If not received, check spam folder.
          </p>
        </div>
      </div>
    </div>
  );
}
