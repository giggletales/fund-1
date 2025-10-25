import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/db';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

interface MT5Account {
  login: string;
  name: string;
  server: string;
  balance: number;
  equity: number;
  // Add other relevant fields
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  // Add other relevant fields
}

interface Challenge {
  id: string;
  user_id: string;
  status: string;
  challenge_type: string;
  account_size: number;
  created_at: string;
  // Add other relevant fields
}

interface Certificate {
  id: string;
  user_id: string;
  challenge_id: string;
  certificate_url: string;
  created_at: string;
  // Add other relevant fields
}

const AdminMT5: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setError("Supabase client is not initialized. Check your environment variables.");
      setLoading(false);
      return;
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setSession(session);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchUserProfiles = async () => {
      if (!supabase) return;
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_users_for_admin');
        if (error) {
          throw error;
        }
        setUserProfiles(data || []);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchUserProfiles();
    } else if (!session) {
      // Using window.location.href for redirection
      window.location.href = '/login';
    }
  }, [session]);

  const filteredUsers = useMemo(() => {
    return userProfiles.filter(user =>
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [userProfiles, searchTerm]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">User Profile 360°</h1>
      <div className="mb-4">
        <label htmlFor="user-search" className="block text-sm font-medium text-gray-700">
          Select User
        </label>
        <input
          type="text"
          id="user-search"
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          placeholder="Search by name, email, or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="mt-2 border border-gray-300 rounded-md max-h-60 overflow-y-auto">
          {filteredUsers.map(user => (
            <div
              key={user.id}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => setSelectedUserId(user.id)}
            >
              {user.full_name} - {user.email}
            </div>
          ))}
        </div>
      </div>

      {selectedUserId && <UserDetails userId={selectedUserId} />}
    </div>
  );
};

const UserDetails: React.FC<{ userId: string }> = ({ userId }) => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">User Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MT5AccountsTab userId={userId} />
        <ChallengesTab userId={userId} />
        <CertificatesTab userId={userId} />
      </div>
    </div>
  );
};

const MT5AccountsTab: React.FC<{ userId: string }> = ({ userId }) => {
  const [accounts, setAccounts] = useState<MT5Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAccountData = async () => {
      if (!supabase) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('mt5_accounts')
          .select('*')
          .eq('user_id', userId);

        if (error) throw error;
        setAccounts(data || []);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    loadAccountData();
  }, [userId]);

  if (loading) return <div>Loading MT5 Accounts...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold">MT5 Accounts</h3>
      {accounts.length > 0 ? (
        <ul>
          {accounts.map(acc => (
            <li key={acc.login}>
              {acc.name} ({acc.login}) - Balance: {acc.balance}
            </li>
          ))}
        </ul>
      ) : (
        <p>No MT5 accounts found.</p>
      )}
    </div>
  );
};

const ChallengesTab: React.FC<{ userId: string }> = ({ userId }) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadChallengeData = async () => {
      if (!supabase) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('challenges')
          .select('*')
          .eq('user_id', userId);

        if (error) throw error;
        setChallenges(data || []);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    loadChallengeData();
  }, [userId]);

  if (loading) return <div>Loading Challenges...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold">Challenges</h3>
      {challenges.length > 0 ? (
        <ul>
          {challenges.map(ch => (
            <li key={ch.id}>
              {ch.challenge_type} - {ch.status}
            </li>
          ))}
        </ul>
      ) : (
        <p>No challenges found.</p>
      )}
    </div>
  );
};

const CertificatesTab: React.FC<{ userId: string }> = ({ userId }) => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCertificateData() {
      if (!supabase) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('certificates')
          .select('*')
          .eq('user_id', userId);

        if (error) throw error;
        setCertificates(data || []);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
    loadCertificateData();
  }, [userId]);

  if (loading) return <div>Loading Certificates...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold">Certificates</h3>
      {certificates.length > 0 ? (
        <ul>
          {certificates.map(cert => (
            <li key={cert.id}>
              <a href={cert.certificate_url} target="_blank" rel="noopener noreferrer">
                Certificate {cert.id}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p>No certificates found.</p>
      )}
    </div>
  );
};

export default AdminMT5;
