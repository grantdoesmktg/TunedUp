import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../shared/contexts/AuthContext';
import { BrowserPrompt } from '../shared/components/BrowserPrompt';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import Home from './pages/Home';
import SimpleLogin from './pages/SimpleLogin';
import Dashboard from './pages/Dashboard';
import Community from './pages/Community';
import AuthVerify from './pages/AuthVerify';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Disclaimer from './pages/Disclaimer';
import AuthenticatedPerformanceCalculator from '../performance-calculator/AuthenticatedApp';
import AuthenticatedBuildPlanner from '../build-planner/AuthenticatedApp';
import AuthenticatedOnSite from '../on-site/AuthenticatedApp';

function App() {
  useEffect(() => {
    // Configure status bar for native apps
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Dark });
      StatusBar.setBackgroundColor({ color: '#0f0f23' });
    }
  }, []);

  return (
    <AuthProvider>
      <BrowserPrompt />
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<SimpleLogin />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/auth/verify/:token" element={<AuthVerify />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/community" element={<Community />} />
          <Route path="/performance-calculator" element={<AuthenticatedPerformanceCalculator />} />
          <Route path="/build-planner" element={<AuthenticatedBuildPlanner />} />
          <Route path="/w/on-site/embed" element={<AuthenticatedOnSite />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;