import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PerformanceCalculator from '../performance-calculator/App';
import OnSiteApp from '../on-site/App';
import BuildPlannerApp from '../build-planner/App';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/performance-calculator" replace />} />
        <Route path="/performance-calculator" element={<PerformanceCalculator />} />
        <Route path="/w/on-site/embed" element={<OnSiteApp />} />
        <Route path="/build-planner" element={<BuildPlannerApp />} />
        {/* Future widgets will be added here */}
      </Routes>
    </Router>
  );
}

export default App;