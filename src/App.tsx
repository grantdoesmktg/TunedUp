import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../shared/contexts/AuthContext';
import PerformanceCalculator from '../performance-calculator/AuthenticatedApp';
import OnSiteApp from '../on-site/AuthenticatedApp';
import BuildPlannerApp from '../build-planner/AuthenticatedApp';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AuthVerify from './pages/AuthVerify';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/auth/verify" element={<AuthVerify />} />
          <Route path="/performance-calculator" element={<PerformanceCalculator />} />
          <Route path="/w/on-site/embed" element={<OnSiteApp />} />
          <Route path="/build-planner" element={<BuildPlannerApp />} />
          {/* Future widgets will be added here */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;