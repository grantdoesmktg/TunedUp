import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PerformanceCalculator from '../performance-calculator/App';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/performance-calculator" replace />} />
        <Route path="/performance-calculator" element={<PerformanceCalculator />} />
        {/* Future widgets will be added here */}
      </Routes>
    </Router>
  );
}

export default App;