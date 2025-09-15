import React, { useState, useEffect } from 'react';
import { CAR_FACTS } from '../constants';

export const LoadingScreen: React.FC = () => {
  const [fact, setFact] = useState(CAR_FACTS[Math.floor(Math.random() * CAR_FACTS.length)]);

  useEffect(() => {
    const interval = setInterval(() => {
      let newFact;
      do {
        newFact = CAR_FACTS[Math.floor(Math.random() * CAR_FACTS.length)];
      } while (newFact === fact);
      setFact(newFact);
    }, 4000);

    return () => clearInterval(interval);
  }, [fact]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-textPrimary text-center p-4">
      <svg className="animate-spin h-12 w-12 text-primary mb-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="text-textSecondary mb-8">Analyzing your build... This may take a moment. Please wait.</p>
      <div className="max-w-2xl bg-secondary/50 border border-divider rounded-lg p-6">
        <p className="text-primary font-semibold mb-2">Car Fact:</p>
        <p className="text-textSecondary transition-opacity duration-500">{fact}</p>
      </div>
    </div>
  );
};