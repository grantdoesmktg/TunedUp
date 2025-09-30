import React, { useState } from 'react';
import { VehicleSpec, BuildPlanResponse } from './types';
import './styles.css';

interface BuildPlannerAppProps {
  onUseQuota?: () => Promise<void>
  user?: any
}

const BuildPlannerApp: React.FC<BuildPlannerAppProps> = ({ onUseQuota, user }) => {
  const [vehicleSpec, setVehicleSpec] = useState<VehicleSpec>(() => {
    // Check URL parameters for vehicle data from Performance Calculator
    const urlParams = new URLSearchParams(window.location.search);
    
    return {
      year: urlParams.get('year') || '2018',
      make: urlParams.get('make') || 'Infiniti',
      model: urlParams.get('model') || 'Q50',
      trim: urlParams.get('trim') || '3.0t Sport',
      question: ''
    };
  });

  const [budget, setBudget] = useState<string>('$2,500');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buildPlan, setBuildPlan] = useState<BuildPlanResponse | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [carName, setCarName] = useState('');

  // Check if data came from Performance Calculator
  const fromPerformanceCalc = new URLSearchParams(window.location.search).get('source') === 'performance-calculator';

  const buildCategories = [
    {
      id: 'power-focused',
      title: 'Power-Focused',
      icon: '⚡',
      description: 'Intake, exhaust, tune, fueling, turbo upgrades',
      metrics: 'HP/TQ gains, 0–60, ¼ mile'
    },
    {
      id: 'handling-track',
      title: 'Handling & Track',
      icon: '🏁',
      description: 'Suspension, coilovers, sway bars, brake upgrades',
      metrics: 'Lap times, grip, braking distance'
    },
    {
      id: 'visual-aesthetic',
      title: 'Visual / Aesthetic',
      icon: '✨',
      description: 'Body kits, wraps/paint, aero, wheels, lighting',
      metrics: 'Looks, stance, personalization'
    },
    {
      id: 'daily-reliability',
      title: 'Daily Driver / Reliability',
      icon: '🛡️',
      description: 'OEM+ mods, cooling, conservative tunes',
      metrics: 'Drivability, NVH, reliability'
    },
    {
      id: 'show-flex',
      title: 'Show & Flex',
      icon: '💎',
      description: 'High-end visual mods, audio, flashy renders',
      metrics: 'Shareability, "My Garage" clout'
    },
    {
      id: 'balanced-build',
      title: 'Balanced Build',
      icon: '⚖️',
      description: 'Mix of performance + handling + reliability',
      metrics: 'Best value-for-money, jack of all trades'
    }
  ];

  const handleSaveBuildPlan = async (carName: string) => {
    if (!user?.email || !buildPlan) {
      setSaveMessage('Please log in to save your build plan');
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
          make: vehicleSpec.make,
          model: vehicleSpec.model,
          year: vehicleSpec.year,
          trim: vehicleSpec.trim,
          buildPlanData: buildPlan,
          setAsActive: true // Make this the active car
        })
      });

      if (response.ok) {
        setSaveMessage(`Successfully saved "${carName}" to your garage!`);
        setShowSaveModal(false);
      } else {
        const data = await response.json();
        setSaveMessage(data.error || 'Failed to save build plan');
      }
    } catch (error) {
      setSaveMessage('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    if (carName.trim()) {
      handleSaveBuildPlan(carName.trim());
    }
  };

  const handleGenerate = async () => {
    if (!selectedCategory) return;

    setIsLoading(true);
    setError(null);
    setBuildPlan(null);

    try {
      // Use quota if authenticated
      if (onUseQuota) {
        await onUseQuota();
      }
      const response = await fetch('/api/build-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vehicleSpec: {
            ...vehicleSpec,
            question: `${buildCategories.find(cat => cat.id === selectedCategory)?.title} build for my ${vehicleSpec.year} ${vehicleSpec.make} ${vehicleSpec.model} with a ${budget} budget`
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      setBuildPlan(result);

      // Initialize car name for potential saving
      const selectedCategoryTitle = buildCategories.find(cat => cat.id === selectedCategory)?.title || 'Custom';
      setCarName(`${vehicleSpec.year} ${vehicleSpec.make} ${vehicleSpec.model} ${selectedCategoryTitle} Build`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate build plan';
      setError(errorMessage);
      console.error('Build planning error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckPerformance = () => {
    if (!buildPlan) return;

    // Create modifications string from recommendations
    const modifications = buildPlan.recommendations.map(rec => rec.name).join(', ');
    
    const params = new URLSearchParams({
      year: vehicleSpec.year,
      make: vehicleSpec.make,
      model: vehicleSpec.model,
      trim: vehicleSpec.trim,
      modifications: modifications,
      source: 'build-planner'
    });

    window.open(`/performance-calculator?${params.toString()}`, '_blank');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="build-planner-app">

      {fromPerformanceCalc && (
        <div className="notification-banner">
          <div className="notification-content">
            <div className="notification-text">
              <strong>Vehicle details imported from Performance Calculator!</strong>
              <p>Your {vehicleSpec.year} {vehicleSpec.make} {vehicleSpec.model} is ready for build planning.</p>
            </div>
          </div>
        </div>
      )}

      <form className="planner-form" onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}>
        <div className="form-section">
          <h2>Vehicle Information</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="year">Year</label>
              <input
                id="year"
                type="text"
                value={vehicleSpec.year}
                onChange={(e) => setVehicleSpec(prev => ({ ...prev, year: e.target.value }))}
                placeholder="e.g., 2018, 2020, 2022"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="make">Make</label>
              <input
                id="make"
                type="text"
                value={vehicleSpec.make}
                onChange={(e) => setVehicleSpec(prev => ({ ...prev, make: e.target.value }))}
                placeholder="e.g., BMW, Toyota, Honda"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="model">Model</label>
              <input
                id="model"
                type="text"
                value={vehicleSpec.model}
                onChange={(e) => setVehicleSpec(prev => ({ ...prev, model: e.target.value }))}
                placeholder="e.g., M3, Civic, Q50"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="trim">Trim</label>
              <input
                id="trim"
                type="text"
                value={vehicleSpec.trim}
                onChange={(e) => setVehicleSpec(prev => ({ ...prev, trim: e.target.value }))}
                placeholder="e.g., 3.0t Sport, Si, Type-R"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="budget">Budget</label>
            <select
              id="budget"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="budget-select"
            >
              <option value="$1,000">$1,000</option>
              <option value="$1,500">$1,500</option>
              <option value="$2,000">$2,000</option>
              <option value="$2,500">$2,500</option>
              <option value="$3,000">$3,000</option>
              <option value="$3,500">$3,500</option>
              <option value="$4,000">$4,000</option>
              <option value="$4,500">$4,500</option>
              <option value="$5,000">$5,000</option>
              <option value="$6,000">$6,000</option>
              <option value="$7,000">$7,000</option>
              <option value="$8,000">$8,000</option>
              <option value="$9,000">$9,000</option>
              <option value="$10,000">$10,000</option>
              <option value="$15,000">$15,000</option>
              <option value="$20,000">$20,000</option>
            </select>
          </div>
        </div>

        <div className="form-section">
          <h2>Build Category</h2>
          <div className="category-grid">
            {buildCategories.map((category) => (
              <div
                key={category.id}
                className={`category-card ${selectedCategory === category.id ? 'selected' : ''}`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <div className="category-title">{category.title}</div>
                <div className="category-description">{category.description}</div>
                <div className="category-metrics">{category.metrics}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="generate-section">
          <button
            type="submit"
            className="generate-button"
            disabled={isLoading || !selectedCategory}
          >
            Get Build Plan & Costs
          </button>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>
      </form>

      {isLoading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      )}

      {buildPlan && (
        <div className="results-section">
          <div className="results-header">
            <h2 className="results-title">
              {vehicleSpec.year} {vehicleSpec.make} {vehicleSpec.model} Build Plan
            </h2>
            <div className="stage-badge">{buildPlan.stage}</div>
          </div>

          <div className="cost-summary">
            <div className="cost-card">
              <h3>Parts Only</h3>
              <div className="amount">{formatCurrency(buildPlan.totalPartsCost)}</div>
            </div>
            <div className="cost-card">
              <h3>+ DIY Shop</h3>
              <div className="amount">{formatCurrency(buildPlan.totalDIYCost)}</div>
            </div>
            <div className="cost-card">
              <h3>+ Professional</h3>
              <div className="amount">{formatCurrency(buildPlan.totalProfessionalCost)}</div>
            </div>
          </div>

          <div className="build-info">
            <div className="build-info-item">
              <span className="label">Timeframe</span>
              <span className="value">{buildPlan.timeframe}</span>
            </div>
            <div className="build-info-item">
              <span className="label">Difficulty</span>
              <span className="value">{buildPlan.difficulty}</span>
            </div>
          </div>

          <div className="recommendations-list">
            <h3>Recommended Modifications</h3>
            {buildPlan.recommendations.map((rec, index) => (
              <div key={index} className="recommendation-item">
                <div className="recommendation-header">
                  <div className="recommendation-name">{rec.name}</div>
                  <div className="recommendation-costs">
                    <div className="part-cost">Parts: {formatCurrency(rec.partPrice)}</div>
                    <div className="labor-cost">DIY Shop: {formatCurrency(rec.diyShopCost)}</div>
                    <div className="labor-cost">Professional: {formatCurrency(rec.professionalShopCost)}</div>
                  </div>
                </div>
                <div className="recommendation-description">{rec.description}</div>
              </div>
            ))}
          </div>

          <div className="explanation-section">
            <h3>Build Strategy</h3>
            <div className="explanation-text">{buildPlan.explanation}</div>
          </div>

          {buildPlan.warnings && buildPlan.warnings.length > 0 && (
            <div className="warnings-section">
              <h4>⚠️ Important Considerations</h4>
              <ul>
                {buildPlan.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Save message */}
          {saveMessage && (
            <div className={`save-message ${saveMessage.includes('Successfully') ? 'success' : 'error'}`}>
              {saveMessage}
            </div>
          )}

          <div className="action-buttons">
            <button
              className="action-button"
              onClick={() => setBuildPlan(null)}
            >
              Plan New Build
            </button>

            {/* Save Build Plan Button - only show if user is logged in */}
            {user?.email && (
              <button
                onClick={() => setShowSaveModal(true)}
                disabled={isSaving}
                className="action-button save-button"
              >
                {isSaving ? 'Saving...' : 'Save Build Plan'}
              </button>
            )}

            <button
              className="action-button primary"
              onClick={handleCheckPerformance}
            >
              Check Performance Stats →
            </button>
          </div>

          <div className="disclaimer">
            * Prices are estimates and may vary by location, shop rates, and part availability. 
            Always get quotes from local shops before starting work.
          </div>
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Save Build Plan to Garage</h3>
            <div className="form-group">
              <label htmlFor="car-name" className="form-label">
                Build Plan Name
              </label>
              <input
                id="car-name"
                type="text"
                value={carName}
                onChange={(e) => setCarName(e.target.value)}
                className="form-input"
                placeholder="My Build Plan"
              />
            </div>
            <div className="modal-buttons">
              <button
                onClick={handleSave}
                disabled={!carName.trim() || isSaving}
                className="modal-button save"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setShowSaveModal(false)}
                disabled={isSaving}
                className="modal-button cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuildPlannerApp;