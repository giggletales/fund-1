import { useState, useEffect } from 'react';
import { supabase } from '../lib/db';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GradientText from '../components/ui/GradientText';
import { Search, Send, Check, X, Edit } from 'lucide-react';

interface Challenge {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  unique_user_id: string;
  account_size: number;
  challenge_fee: number;
  phase: string;
  status: string;
  platform: string;
  login_id: string | null;
  has_credentials: boolean;
  current_balance: number;
  created_at: string;
}

export default function AdminChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      const { data, error } = await supabase.rpc('get_all_challenges_for_admin');

      if (error) throw error;

      setChallenges(data || []);
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredChallenges = challenges.filter(c =>
    c.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.unique_user_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingChallenges = filteredChallenges.filter(c => !c.has_credentials);
  const activeChallenges = filteredChallenges.filter(c => c.has_credentials);

  if (loading) {
    return (
      <div className="min-h-screen bg-deep-space flex items-center justify-center">
        <div className="loader-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-space">
      <Navbar />

      <div className="pt-40 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">
              <GradientText>Challenge Account Management</GradientText>
            </h1>
            <p className="text-gray-400">Assign MT5 credentials to user challenges</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="glass-card p-6 border border-orange-500/30">
              <div className="text-3xl mb-2">⏳</div>
              <div className="text-sm text-gray-400 mb-1">Pending Setup</div>
              <div className="text-3xl font-bold">
                <GradientText>{pendingChallenges.length}</GradientText>
              </div>
            </div>
            <div className="glass-card p-6 border border-neon-green/30">
              <div className="text-3xl mb-2">✅</div>
              <div className="text-sm text-gray-400 mb-1">Active Challenges</div>
              <div className="text-3xl font-bold">
                <GradientText>{activeChallenges.length}</GradientText>
              </div>
            </div>
            <div className="glass-card p-6 border border-electric-blue/30">
              <div className="text-3xl mb-2">👥</div>
              <div className="text-sm text-gray-400 mb-1">Total Challenges</div>
              <div className="text-3xl font-bold">
                <GradientText>{challenges.length}</GradientText>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by email, user ID, or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-electric-blue focus:outline-none"
              />
            </div>
          </div>

          {pendingChallenges.length > 0 && (
            <div className="glass-card p-6 mb-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <span className="w-3 h-3 bg-orange-500 rounded-full mr-3 animate-pulse"></span>
                Pending Credential Assignment
              </h2>
              <div className="space-y-4">
                {pendingChallenges.map(challenge => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    onAssign={() => {
                      setSelectedChallenge(challenge);
                      setShowAssignModal(true);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {activeChallenges.length > 0 && (
            <div className="glass-card p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <span className="w-3 h-3 bg-neon-green rounded-full mr-3"></span>
                Active Challenges
              </h2>
              <div className="space-y-4">
                {activeChallenges.map(challenge => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    onAssign={() => {
                      setSelectedChallenge(challenge);
                      setShowAssignModal(true);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredChallenges.length === 0 && (
            <div className="glass-card p-12 text-center">
              <p className="text-gray-400">No challenges found</p>
            </div>
          )}
        </div>
      </div>

      {showAssignModal && selectedChallenge && (
        <AssignCredentialsModal
          challenge={selectedChallenge}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedChallenge(null);
          }}
          onSuccess={() => {
            setShowAssignModal(false);
            setSelectedChallenge(null);
            loadChallenges();
          }}
        />
      )}

      <Footer />
    </div>
  );
}

function ChallengeCard({ challenge, onAssign }: { challenge: Challenge; onAssign: () => void }) {
  return (
    <div className="bg-white/5 p-6 rounded-lg border border-white/10 hover:border-white/20 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-xl font-bold">{challenge.user_email}</h3>
            <span className="px-3 py-1 bg-electric-blue/20 text-electric-blue rounded-full text-xs font-bold border border-electric-blue/30">
              ID: {challenge.unique_user_id}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              challenge.has_credentials
                ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                : 'bg-orange-500/20 text-orange-500 border border-orange-500/30'
            }`}>
              {challenge.has_credentials ? 'Active' : 'Pending Setup'}
            </span>
          </div>
          <p className="text-sm text-gray-400">{challenge.user_name || 'No name provided'}</p>
        </div>
        <button
          onClick={onAssign}
          className="flex items-center space-x-2 px-4 py-2 bg-electric-blue/20 text-electric-blue border border-electric-blue/30 rounded-lg hover:bg-electric-blue/30 transition-all"
        >
          {challenge.has_credentials ? <Edit size={16} /> : <Send size={16} />}
          <span>{challenge.has_credentials ? 'Edit' : 'Assign'}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Account Size</label>
          <p className="font-bold">${challenge.account_size?.toLocaleString()}</p>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Fee Paid</label>
          <p className="font-bold">${challenge.challenge_fee?.toLocaleString()}</p>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Platform</label>
          <p className="font-bold">{challenge.platform}</p>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Created</label>
          <p className="font-bold">{new Date(challenge.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      {challenge.login_id && (
        <div className="mt-4 p-3 bg-neon-green/10 rounded border border-neon-green/30">
          <p className="text-sm text-neon-green font-mono">
            <strong>Login:</strong> {challenge.login_id}
          </p>
        </div>
      )}
    </div>
  );
}

function AssignCredentialsModal({ challenge, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    login_id: challenge.login_id || '',
    password: generatePassword(),
    server_name: challenge.server_name || 'MetaQuotes-Demo',
    investor_password: generatePassword()
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('challenges')
        .update({
          login_id: formData.login_id,
          password: formData.password,
          server_name: formData.server_name,
          investor_password: formData.investor_password,
          status: 'active',
          phase: 'phase_1',
          start_date: new Date().toISOString()
        })
        .eq('id', challenge.id);

      if (error) throw error;

      alert('Credentials assigned successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error assigning credentials:', error);
      alert('Failed to assign credentials');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="glass-card p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">
              <GradientText>Assign MT5 Credentials</GradientText>
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              User: {challenge.user_email} | ID: {challenge.unique_user_id}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2">MT5 Login ID *</label>
            <input
              type="text"
              value={formData.login_id}
              onChange={(e) => setFormData({ ...formData, login_id: e.target.value })}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-electric-blue focus:outline-none"
              placeholder="e.g., 1234567"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Password *</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-electric-blue focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, password: generatePassword() })}
                className="px-4 py-3 bg-white/10 rounded-lg hover:bg-white/20"
              >
                🎲
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Server *</label>
            <input
              type="text"
              value={formData.server_name}
              onChange={(e) => setFormData({ ...formData, server_name: e.target.value })}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-electric-blue focus:outline-none"
              placeholder="e.g., MetaQuotes-Demo"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Investor Password (Read-only) *</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={formData.investor_password}
                onChange={(e) => setFormData({ ...formData, investor_password: e.target.value })}
                required
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-electric-blue focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, investor_password: generatePassword() })}
                className="px-4 py-3 bg-white/10 rounded-lg hover:bg-white/20"
              >
                🎲
              </button>
            </div>
          </div>

          <div className="bg-electric-blue/10 p-4 rounded-lg border border-electric-blue/30">
            <p className="text-sm text-gray-300">
              <strong>Account Details:</strong>
              <br />
              Size: ${challenge.account_size?.toLocaleString()}
              <br />
              User ID: {challenge.unique_user_id}
            </p>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 btn-gradient py-3 rounded-lg font-semibold disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Assign Credentials'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 bg-white/10 rounded-lg hover:bg-white/20 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function generatePassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
