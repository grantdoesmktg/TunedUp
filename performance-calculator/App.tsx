import React, { useState, useEffect } from 'react';
import type { CarInput, AIResponse } from './types';
import { InputForm } from './components/InputForm';
import { LoadingScreen } from './components/LoadingScreen';
import { ResultsDisplay } from './components/ResultsDisplay';
import { UpgradePopup } from '../shared/components/UpgradePopup';
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

interface AppProps {
  onUseQuota?: () => Promise<void>
  user?: any
}

const App: React.FC<AppProps> = ({ onUseQuota, user }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [quotaData, setQuotaData] = useState<{
    plan: string;
    used: number;
    limit: number;
    message: string;
  } | null>(null);

  // Send height updates to parent window for iframe resizing
  useEffect(() => {
    const sendHeightToParent = () => {
      if (window.parent !== window) {
        // Use a small delay to ensure DOM has rendered
        setTimeout(() => {
          const height = Math.max(
            document.body.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.clientHeight,
            document.documentElement.scrollHeight,
            document.documentElement.offsetHeight
          );
          window.parent.postMessage({ type: 'resize', height: height + 20 }, '*');
        }, 100);
      }
    };

    // Send initial height
    sendHeightToParent();

    // Send height after state changes
    const timeoutId = setTimeout(sendHeightToParent, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isLoading, showResults, error]);
  
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
      // Use quota if authenticated
      if (onUseQuota) {
        await onUseQuota();
      }

      const response = await estimatePerformance(carInput, user);
      setAiResponse(response);
      setShowResults(true);
    } catch (err: any) {
      // Check if it's a quota exceeded error with upgrade popup data
      if (err.quotaData && err.quotaData.plan && err.quotaData.used !== undefined && err.quotaData.limit !== undefined) {
        setQuotaData({
          plan: err.quotaData.plan,
          used: err.quotaData.used,
          limit: err.quotaData.limit,
          message: err.quotaData.message || 'Quota exceeded'
        });
        setShowUpgradePopup(true);
        return; // Don't show generic error
      } else if (err.message === 'Quota exceeded') {
        setError('You have exceeded your monthly quota. Please upgrade your plan to continue.');
      } else {
        setError(err.message || 'An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    setCarInput(INITIAL_CAR_INPUT);
    setAiResponse(null);
    setShowResults(false);
    setError(null);
    setSaveMessage(null);
  };

  const handleSaveCar = async (carName: string) => {
    if (!user?.email || !aiResponse) {
      setSaveMessage('Please log in to save your car');
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch('/api/saved-cars', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user.email
        },
        body: JSON.stringify({
          name: carName,
          make: carInput.make,
          model: carInput.model,
          year: carInput.year,
          trim: carInput.trim,
          performanceData: aiResponse,
          setAsActive: true // Make this the active car
        })
      });

      if (response.ok) {
        setSaveMessage(`Successfully saved "${carName}" to your garage!`);
      } else {
        const data = await response.json();
        setSaveMessage(data.error || 'Failed to save car');
      }
    } catch (error) {
      setSaveMessage('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
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
          onSaveCar={handleSaveCar}
          isSaving={isSaving}
          saveMessage={saveMessage}
          user={user}
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
    <div className="bg-background text-textPrimary font-sans">
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

      {/* Upgrade Popup */}
      {showUpgradePopup && quotaData && (
        <UpgradePopup
          isOpen={showUpgradePopup}
          onClose={() => setShowUpgradePopup(false)}
          plan={quotaData.plan}
          used={quotaData.used}
          limit={quotaData.limit}
          toolType="performance"
          message={quotaData.message}
        />
      )}
    </div>
  );
};

export default App;