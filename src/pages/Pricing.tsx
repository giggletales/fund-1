import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Pricing() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/challenge-types', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-deep-space flex items-center justify-center">
      <p className="text-xl">Redirecting to challenge types...</p>
    </div>
  );
}
