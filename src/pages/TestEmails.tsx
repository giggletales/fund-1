import { useState } from 'react';
import { sendWelcomeEmail, sendPhasePassedEmail, sendCertificateEmail, sendTestEmailToAdmin } from '../services/emailService';

export default function TestEmails() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const testEmail = 'mainhusharm@gmail.com';

  const sendTest = async (type: string) => {
    setLoading(true);
    setStatus(`Sending ${type}...`);

    try {
      let success = false;

      switch(type) {
        case 'welcome':
          success = await sendWelcomeEmail(testEmail, 'Admin');
          break;
        case 'phase1':
          success = await sendPhasePassedEmail(testEmail, 'Admin', 1, 100000);
          break;
        case 'phase2':
          success = await sendPhasePassedEmail(testEmail, 'Admin', 2, 100000);
          break;
        case 'certificate':
          success = await sendCertificateEmail(testEmail, 'Admin', 100000, 'https://fund8r.com/certificate/test-123');
          break;
        case 'all':
          success = await sendTestEmailToAdmin();
          break;
      }

      setStatus(success ? `✅ ${type} sent successfully!` : `❌ Failed to send ${type}`);
    } catch (error) {
      setStatus(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-deep-space p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Email Testing</h1>
        <p className="text-gray-300 mb-8">
          Test emails will be sent to: <strong>{testEmail}</strong>
        </p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => sendTest('welcome')}
            disabled={loading}
            className="p-6 glass-card hover:border-electric-blue/50 transition disabled:opacity-50"
          >
            <h3 className="text-xl font-bold mb-2">Welcome Email</h3>
            <p className="text-sm text-gray-400">Sent after signup</p>
          </button>

          <button
            onClick={() => sendTest('phase1')}
            disabled={loading}
            className="p-6 glass-card hover:border-electric-blue/50 transition disabled:opacity-50"
          >
            <h3 className="text-xl font-bold mb-2">Phase 1 Passed</h3>
            <p className="text-sm text-gray-400">Sent after passing Phase 1</p>
          </button>

          <button
            onClick={() => sendTest('phase2')}
            disabled={loading}
            className="p-6 glass-card hover:border-electric-blue/50 transition disabled:opacity-50"
          >
            <h3 className="text-xl font-bold mb-2">Phase 2 Passed (Funded)</h3>
            <p className="text-sm text-gray-400">Sent after getting funded</p>
          </button>

          <button
            onClick={() => sendTest('certificate')}
            disabled={loading}
            className="p-6 glass-card hover:border-electric-blue/50 transition disabled:opacity-50"
          >
            <h3 className="text-xl font-bold mb-2">Certificate</h3>
            <p className="text-sm text-gray-400">Sent with certificate link</p>
          </button>
        </div>

        <button
          onClick={() => sendTest('all')}
          disabled={loading}
          className="w-full p-6 btn-gradient text-xl font-bold disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send All Test Emails'}
        </button>

        {status && (
          <div className="mt-8 p-6 glass-card">
            <p className="text-lg">{status}</p>
          </div>
        )}

        <div className="mt-8 p-6 glass-card bg-blue-500/10">
          <h3 className="text-xl font-bold mb-4">Email Scenarios Tested:</h3>
          <ul className="space-y-2 text-gray-300">
            <li>✅ Welcome email on signup</li>
            <li>✅ Phase 1 completion notification</li>
            <li>✅ Phase 2 completion + funded account</li>
            <li>✅ Certificate delivery with download link</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
