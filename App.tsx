import React, { useState, useEffect } from 'react';
import type { CarInput, AIResponse, View, Build, User } from './types';
import { Header } from './components/Header';
import { InputForm } from './components/InputForm';
import { LoadingScreen } from './components/LoadingScreen';
import { ResultsDisplay } from './components/ResultsDisplay';
import { Profile } from './components/Profile';
import { estimatePerformance } from './services/geminiService';
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
  const [view, setView] = useState<View>('form');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [carInput, setCarInput] = useState<CarInput>(INITIAL_CAR_INPUT);
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [builds, setBuilds] = useState<Build[]>([]);
  const [whatsNextText, setWhatsNextText] = useState<string>('');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Effect to load user and their data on initial app load
  useEffect(() => {
    const userData = localStorage.getItem('car_builds_user');
    if (userData) {
      try {
        const loggedInUser: User = JSON.parse(userData);
        setUser(loggedInUser);
        // Load builds
        const savedBuilds = localStorage.getItem(`${loggedInUser.email}_builds`);
        if (savedBuilds) setBuilds(JSON.parse(savedBuilds));
        // Load "What's Next" text
        const savedWhatsNext = localStorage.getItem(`${loggedInUser.email}_whatsNext`);
        if (savedWhatsNext) setWhatsNextText(savedWhatsNext);

      } catch (e) {
        console.error("Failed to parse user data from localStorage", e);
        localStorage.removeItem('car_builds_user');
      }
    }
  }, []);

  // Effect to persist builds to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(`${user.email}_builds`, JSON.stringify(builds));
    }
  }, [builds, user]);

  // Effect to persist "What's Next" text to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(`${user.email}_whatsNext`, whatsNextText);
    }
  }, [whatsNextText, user]);


  const handleLogin = (newUser: User) => {
    // Check if user already exists to preserve their data
    const existingUserData = localStorage.getItem('car_builds_user');
    let finalUser = newUser;
    if(existingUserData) {
        const existingUser = JSON.parse(existingUserData);
        if(existingUser.email === newUser.email) {
            finalUser = { ...existingUser, ...newUser };
        }
    }

    setUser(finalUser);
    localStorage.setItem('car_builds_user', JSON.stringify(finalUser));
    // Load data for new user
    const savedBuilds = localStorage.getItem(`${finalUser.email}_builds`);
    setBuilds(savedBuilds ? JSON.parse(savedBuilds) : []);
    const savedWhatsNext = localStorage.getItem(`${finalUser.email}_whatsNext`);
    setWhatsNextText(savedWhatsNext || '');
    
    setIsLoginModalOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
    setBuilds([]);
    setWhatsNextText('');
    localStorage.removeItem('car_builds_user');
    setView('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setView('loading');
    try {
      const response = await estimatePerformance(carInput);
      setAiResponse(response);
      setView('results');
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
      setView('form'); // Go back to form on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    setCarInput(INITIAL_CAR_INPUT);
    setAiResponse(null);
    setView('form');
  };
  
  const handleNavigate = (targetView: View) => {
    setError(null);
    if (targetView === 'form' && view !== 'form') {
      handleGoBack();
    } else {
      setView(targetView);
    }
  }

  const handleSaveBuild = () => {
    if (user && carInput && aiResponse) {
        const newBuild: Build = {
            id: new Date().toISOString(),
            carInput,
            aiResponse
        };
        setBuilds(prevBuilds => [...prevBuilds, newBuild]);
        alert('Build saved successfully!');
    } else {
        setIsLoginModalOpen(true);
    }
  };
  
  const handleLoadBuild = (build: Build) => {
    const loadedCarInput: CarInput = {
      ...INITIAL_CAR_INPUT,
      ...build.carInput,
    };
    setCarInput(loadedCarInput);
    setAiResponse(build.aiResponse);
    setView('form');
  };

  const handleDeleteBuild = (id: string) => {
    if (window.confirm("Are you sure you want to delete this build?")) {
        setBuilds(prevBuilds => prevBuilds.filter(b => b.id !== id));
    }
  };
  
  const handleProfileUpdate = (updatedFields: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updatedFields };
      setUser(updatedUser);
      localStorage.setItem('car_builds_user', JSON.stringify(updatedUser));
    }
  };

  const renderContent = () => {
    switch (view) {
      case 'loading':
        return <LoadingScreen />;
      case 'results':
        return aiResponse && <ResultsDisplay results={aiResponse} carInput={carInput} onSaveBuild={handleSaveBuild} onGoBack={handleGoBack} />;
      case 'profile':
        return user && <Profile 
                        user={user} 
                        builds={builds} 
                        onLoadBuild={handleLoadBuild} 
                        onDeleteBuild={handleDeleteBuild} 
                        onNavigateToForm={() => handleNavigate('form')}
                        whatsNextText={whatsNextText}
                        onWhatsNextChange={setWhatsNextText}
                        onProfileUpdate={handleProfileUpdate}
                        />;
      case 'form':
      default:
        return <InputForm carInput={carInput} setCarInput={setCarInput} onSubmit={handleSubmit} isLoading={isLoading} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-textPrimary font-sans">
      <Header 
        user={user} 
        onLogin={handleLogin} 
        onLogout={handleLogout} 
        onNavigate={handleNavigate} 
        currentView={view}
        isLoginOpen={isLoginModalOpen}
        setIsLoginOpen={setIsLoginModalOpen}
       />
      <main>
        {error && view === 'form' && (
          <div className="max-w-4xl mx-auto mt-4 p-4 bg-error/20 border border-error/50 text-error rounded-md">
            <strong>Error:</strong> {error}
          </div>
        )}
        {renderContent()}
      </main>
      <footer className="text-center py-4 text-textSecondary text-sm">
        {/* FIX: Updated attribution from OpenAI to Google AI. */}
        <p>Powered by Google AI. Estimates are for entertainment purposes only.</p>
      </footer>
    </div>
  );
};

export default App;
