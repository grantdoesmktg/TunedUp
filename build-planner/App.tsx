import React, { useState } from 'react';
import { VehicleSpec, BuildPlanResponse } from './types';
import './styles.css';

const BuildPlannerApp: React.FC = () => {
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

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buildPlan, setBuildPlan] = useState<BuildPlanResponse | null>(null);

  // Check if data came from Performance Calculator
  const fromPerformanceCalc = new URLSearchParams(window.location.search).get('source') === 'performance-calculator';

  const handleGenerate = async () => {
    if (!vehicleSpec.question.trim()) return;

    setIsLoading(true);
    setError(null);
    setBuildPlan(null);

    try {
      const response = await fetch('/api/build-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vehicleSpec
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      setBuildPlan(result);

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
      <div className="app-header">
        <h1>Build Planner</h1>
        <p>Get AI-powered modification recommendations and cost estimates</p>
      </div>

      {fromPerformanceCalc && (
        <div className="notification-banner">
          <div className="notification-content">
            <div className="notification-icon">🔧</div>
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
            <label htmlFor="question">Build Goals & Budget</label>
            <textarea
              id="question"
              className="question-input"
              value={vehicleSpec.question}
              onChange={(e) => setVehicleSpec(prev => ({ ...prev, question: e.target.value }))}
              placeholder="What mods should I do first on a 2018 Infiniti Q50 3.0t Sport with $2,500? Looking for more power and better sound..."
              required
              rows={4}
            />
          </div>
        </div>

        <div className="generate-section">
          <button
            type="submit"
            className="generate-button"
            disabled={isLoading || !vehicleSpec.question.trim()}
          >
            {isLoading ? 'Planning Your Build...' : 'Get Build Plan & Costs'}
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
          <p>🔧 Analyzing your vehicle and planning the perfect build...</p>
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

          <div className="action-buttons">
            <button
              className="action-button"
              onClick={() => setBuildPlan(null)}
            >
              Plan New Build
            </button>
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
    </div>
  );
};

export default BuildPlannerApp;