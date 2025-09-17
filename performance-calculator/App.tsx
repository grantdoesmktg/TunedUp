import React, { useState } from 'react';
import type { CarInput, AIResponse } from './types';
import { InputForm } from './components/InputForm';
import { LoadingScreen } from './components/LoadingScreen';
import { ResultsDisplay } from './components/ResultsDisplay';
import { estimatePerformance } from './services/openaiService';
import { DRIVETRAIN_OPTIONS, TRANSMISSION_OPTIONS, TIRE_TYPE_OPTIONS, FUEL_TYPE_OPTIONS, LAUNCH_TECHNIQUE_OPTIONS } from './constants';

const INITIAL_CAR_INPUT: CarInput = {
  make: '',
  model: '',
  year: '',
  trim: '',
  drivetrain: DRIVETRAIN_OPTIONS[0],
  transmission: TRANSMISSION_OPTIONS[0],
  modifications: '',
  tireType: TIRE_TYPE_OPTIONS[0],
  fuelType: FUEL_TYPE_OPTIONS[0],
  launchTechnique: LAUNCH_TECHNIQUE_OPTIONS[0],
};

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState<boolean>(false);
  
  const [carInput, setCarInput] = useState<CarInput>(() => {
    // Check URL parameters for data from Build Planner or other widgets
    const urlParams = new URLSearchParams(window.location.search);
    
    return {
      make: urlParams.get('make') || '',
      model: urlParams.get('model') || '',
      year: urlParams.get('year') || '',
      trim: urlParams.get('trim') || '',
      drivetrain: DRIVETRAIN_OPTIONS[0],
      transmission: TRANSMISSION_OPTIONS[0],
      modifications: urlParams.get('modifications') || '',
      tireType: TIRE_TYPE_OPTIONS[0],
      fuelType: FUEL_TYPE_OPTIONS[0],
      launchTechnique: LAUNCH_TECHNIQUE_OPTIONS[0],
    };
  });
  
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await estimatePerformance(carInput);
      setAiResponse(response);
      setShowResults(true);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    setCarInput(INITIAL_CAR_INPUT);
    setAiResponse(null);
    setShowResults(false);
    setError(null);
  };

  const renderContent = () => {
    if (isLoading) {
      return <LoadingScreen />;
    }
    
    if (showResults && aiResponse) {
      return (
        <ResultsDisplay 
          results={aiResponse} 
          carInput={carInput} 
          onGoBack={handleGoBack}
        />
      );
    }

    return (
      <InputForm 
        carInput={carInput} 
        setCarInput={setCarInput} 
        onSubmit={handleSubmit} 
        isLoading={isLoading} 
      />
    );
  };

  return (
    <div className="min-h-screen bg-background text-textPrimary font-sans">
      <main>
        {error && !showResults && (
          <div className="max-w-4xl mx-auto mt-4 p-4 bg-error/20 border border-error/50 text-error rounded-md">
            <strong>Error:</strong> {error}
          </div>
        )}
        {renderContent()}
      </main>
      <footer className="text-center py-4 text-textSecondary text-sm">
        <p>Powered by Gemini AI. Estimates are for entertainment purposes only.</p>
      </footer>
    </div>
  );
};

export default App;