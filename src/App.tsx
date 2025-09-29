import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../shared/contexts/AuthContext';
import SimpleLogin from './pages/SimpleLogin';
import Dashboard from './pages/Dashboard';
import AuthVerify from './pages/AuthVerify';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<SimpleLogin />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/auth/verify/:token" element={<AuthVerify />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;