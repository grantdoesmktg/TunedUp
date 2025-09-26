import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SimpleLogin from './pages/SimpleLogin';
import TestDashboard from './pages/TestDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<SimpleLogin />} />
        <Route path="/dashboard" element={<TestDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;