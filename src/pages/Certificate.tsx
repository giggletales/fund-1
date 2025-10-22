import { useParams } from 'react-router-dom';
import { Download, Share2, Award } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { api } from '../lib/api';

export default function Certificate() {
  const { accountId } = useParams();

  const handleDownload = () => {
    if (accountId) {
      window.open(api.getCertificateUrl(accountId), '_blank');
    }
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = 'I successfully passed my trading challenge! Check out my certificate:';

    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    };

    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-6">
            <Award className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Certificate of Achievement
          </h1>
          <p className="text-xl text-gray-300">
            Congratulations on passing your trading challenge!
          </p>
        </div>

        {/* Certificate Preview */}
        <div className="bg-white rounded-2xl shadow-2xl p-12 mb-8">
          <div className="border-8 border-double border-blue-600 p-12 text-center">
            <div className="mb-8">
              <h2 className="text-4xl font-bold text-gray-800 mb-2">
                CERTIFICATE OF ACHIEVEMENT
              </h2>
              <div className="w-32 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto"></div>
            </div>

            <div className="mb-8">
              <p className="text-xl text-gray-600 mb-4">This certifies that</p>
              <h3 className="text-4xl font-bold text-blue-600 mb-4">
                [Trader Name]
              </h3>
              <p className="text-xl text-gray-600 mb-2">has successfully completed the</p>
              <h4 className="text-3xl font-bold text-gray-800 mb-8">
                [Challenge Type]
              </h4>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-8">
              <div>
                <p className="text-sm text-gray-500 mb-1">TOTAL PROFIT</p>
                <p className="text-2xl font-bold text-green-600">$0.00</p>
                <p className="text-sm text-gray-600">0.00%</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">WIN RATE</p>
                <p className="text-2xl font-bold text-blue-600">0.0%</p>
                <p className="text-sm text-gray-600">0 trades</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">PROFIT FACTOR</p>
                <p className="text-2xl font-bold text-purple-600">0.00</p>
              </div>
            </div>

            <div className="mb-8">
              <p className="text-lg font-semibold text-gray-700 mb-2">
                Funded Account Amount
              </p>
              <p className="text-4xl font-bold text-green-600 mb-2">
                $0
              </p>
              <p className="text-sm text-gray-600">
                Profit Split: 80% to Trader
              </p>
            </div>

            <div className="flex justify-between items-end text-sm text-gray-500">
              <div>
                <p>Certificate No: CERT-000000</p>
              </div>
              <div>
                <p>Issued: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t-2 border-gray-300">
              <div className="w-48 h-1 bg-gray-800 mx-auto mb-2"></div>
              <p className="text-sm font-semibold text-gray-700">Authorized Signature</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:scale-105 transition"
          >
            <Download className="w-6 h-6" />
            Download Certificate PDF
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-3 bg-white/10 backdrop-blur-lg text-white px-8 py-4 rounded-xl font-semibold border border-white/20 hover:bg-white/20 transition"
          >
            <Award className="w-6 h-6" />
            Print Certificate
          </button>
        </div>

        {/* Share Buttons */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-center gap-6">
            <p className="text-white font-semibold flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share your achievement:
            </p>
            <button
              onClick={() => handleShare('twitter')}
              className="px-6 py-2 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white rounded-lg transition"
            >
              Twitter
            </button>
            <button
              onClick={() => handleShare('linkedin')}
              className="px-6 py-2 bg-[#0077B5] hover:bg-[#006399] text-white rounded-lg transition"
            >
              LinkedIn
            </button>
            <button
              onClick={() => handleShare('facebook')}
              className="px-6 py-2 bg-[#1877F2] hover:bg-[#1565D8] text-white rounded-lg transition"
            >
              Facebook
            </button>
          </div>
        </div>

        {/* Verification Note */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            Verify this certificate authenticity at: <br />
            <span className="text-blue-400 font-mono">
              {window.location.origin}/verify/CERT-000000
            </span>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
