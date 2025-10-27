import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Pricing from './pages/Pricing';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import About from './pages/About';
import Contact from './pages/Contact';
import FAQ from './pages/FAQ';
import RiskDisclosure from './pages/RiskDisclosure';
import UserMT5 from './pages/UserMT5';
import AdminMT5 from './pages/AdminMT5';
import AdminChallenges from './pages/AdminChallenges';
import CryptoPayment from './pages/CryptoPayment';
import ChallengeTypes from './pages/ChallengeTypes';
import Leaderboard from './pages/Leaderboard';
import Notifications from './pages/Notifications';
import Certificate from './pages/Certificate';
import Affiliate from './pages/Affiliate';
import Support from './pages/Support';
import TestEmails from './pages/TestEmails';
import SystemTest from './pages/SystemTest';
import EmailVerification from './pages/EmailVerification';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/challenge-types" element={<ChallengeTypes />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/risk-disclosure" element={<RiskDisclosure />} />
        <Route path="/mt5" element={<UserMT5 />} />
        <Route path="/admin/mt5" element={<AdminMT5 />} />
        <Route path="/admin/challenges" element={<AdminChallenges />} />
        <Route path="/payment" element={<CryptoPayment />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/certificate/:accountId" element={<Certificate />} />
        <Route path="/affiliate" element={<Affiliate />} />
        <Route path="/support" element={<Support />} />
        <Route path="/test-emails" element={<TestEmails />} />
        <Route path="/system-test" element={<SystemTest />} />
        <Route path="/email-verification" element={<EmailVerification />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
