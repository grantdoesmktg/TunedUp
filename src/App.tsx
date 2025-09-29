import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../shared/contexts/AuthContext';
import SimpleLogin from './pages/SimpleLogin';
import Dashboard from './pages/Dashboard';
import AuthVerify from './pages/AuthVerify';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Disclaimer from './pages/Disclaimer';
import AuthenticatedPerformanceCalculator from '../performance-calculator/AuthenticatedApp';
import AuthenticatedBuildPlanner from '../build-planner/AuthenticatedApp';
import AuthenticatedOnSite from '../on-site/AuthenticatedApp';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<SimpleLogin />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/auth/verify/:token" element={<AuthVerify />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/performance-calculator" element={<AuthenticatedPerformanceCalculator />} />
          <Route path="/build-planner" element={<AuthenticatedBuildPlanner />} />
          <Route path="/w/on-site/embed" element={<AuthenticatedOnSite />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;