import React, { useState } from 'react';
import type { AIResponse, CarInput } from '../types';
import { GaugeIcon } from './icons/GaugeIcon';
import { ClockIcon } from './icons/ClockIcon';

interface ResultsDisplayProps {
  results: AIResponse;
  carInput: CarInput;
  onGoBack: () => void;
  onSaveCar?: (carName: string) => void;
  isSaving?: boolean;
  saveMessage?: string | null;
  user?: any;
}

const PerformanceCard: React.FC<{ title: string, hp: number, whp: number, zeroToSixty: number, isEstimated?: boolean }> = ({ title, hp, whp, zeroToSixty, isEstimated = false }) => (
  <div className={`w-full p-6 rounded-xl ${isEstimated ? 'bg-primary/20 border-primary/50' : 'bg-secondary border-divider'} border`}>
    <h3 className={`text-xl font-bold mb-4 ${isEstimated ? 'text-primary' : 'text-textPrimary'}`}>{title}</h3>
    <div className="space-y-4">
      <div className="flex items-center">
        <GaugeIcon className="w-8 h-8 mr-4 text-textSecondary" />
        <div>
          <p className="text-sm text-textSecondary">Horsepower</p>
          <p className="text-2xl font-semibold text-textPrimary">{hp} HP <span className="text-lg text-textSecondary font-normal">({whp} WHP)</span></p>
        </div>
      </div>
      <div className="flex items-center">
        <ClockIcon className="w-8 h-8 mr-4 text-textSecondary" />
        <div>
          <p className="text-sm text-textSecondary">0-60 MPH</p>
          <p className="text-2xl font-semibold text-textPrimary">{zeroToSixty.toFixed(2)}s</p>
        </div>
      </div>
    </div>
  </div>
);

const DifferenceIndicator: React.FC<{ value: number, unit: string, positiveIsGood: boolean }> = ({ value, unit, positiveIsGood }) => {
    const isPositive = value > 0;
    const isNegative = value < 0;
    let colorClass = 'text-textSecondary';

    if ((isPositive && positiveIsGood) || (isNegative && !positiveIsGood)) {
        colorClass = 'text-success';
    } else if ((isNegative && positiveIsGood) || (isPositive && !positiveIsGood)) {
        colorClass = 'text-error';
    }

    const formattedValue = value.toFixed(value % 1 === 0 ? 0 : 2);

    return (
        <span className={`font-bold text-lg ${colorClass}`}>
            ({isPositive ? '+' : ''}{formattedValue}{unit})
        </span>
    );
};

const ConfidenceBadge: React.FC<{ confidence: AIResponse['confidence'] | null | undefined }> = ({ confidence }) => {
    const confidenceStyles: { [key in AIResponse['confidence']]: { container: string, circle: string, text: string } } = {
        High: { container: 'bg-success/20 border-success/50', circle: 'bg-success', text: 'text-success' },
        Medium: { container: 'bg-highlight/20 border-highlight/50', circle: 'bg-highlight', text: 'text-highlight' },
        Low: { container: 'bg-error/20 border-error/50', circle: 'bg-error', text: 'text-error' },
    };

    const styleKey = confidence && (confidence.charAt(0).toUpperCase() + confidence.slice(1).toLowerCase()) as AIResponse['confidence'];
    const style = styleKey && confidenceStyles[styleKey] ? confidenceStyles[styleKey] : null;

    if (!style) {
        return (
            <div className="p-4 rounded-lg border border-divider bg-secondary/50 mt-6 text-center">
                <p className="text-textSecondary font-medium">Confidence Level: Unavailable</p>
                 <p className="text-xs text-textSecondary/70 text-center mt-2">
                  Real-world figures may vary. The model is trained to provide conservative estimates.
                </p>
            </div>
        );
    }
    
    return (
      <div className={`p-4 rounded-lg border ${style.container} mt-6`}>
        <div className="flex items-center justify-center mb-2">
          <div className={`w-3 h-3 rounded-full mr-2 ${style.circle}`}></div>
          <p className={`font-semibold ${style.text}`}>Confidence Level: {confidence}</p>
        </div>
        <p className="text-xs text-textSecondary/70 text-center">
          Real-world figures may vary. The model is trained to provide conservative estimates.
        </p>
      </div>
    );
};

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  results,
  carInput,
  onGoBack,
  onSaveCar,
  isSaving = false,
  saveMessage,
  user
}) => {
  const { stockPerformance, estimatedPerformance, explanation, sources, confidence } = results;
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [carName, setCarName] = useState(`${carInput.year} ${carInput.make} ${carInput.model} Build`);

  const hpDiff = estimatedPerformance.horsepower - stockPerformance.horsepower;
  const zeroToSixtyDiff = estimatedPerformance.zeroToSixty - stockPerformance.zeroToSixty;

  const handleSave = () => {
    if (onSaveCar && carName.trim()) {
      onSaveCar(carName.trim());
      setShowSaveModal(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 text-textPrimary">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">{carInput.year} {carInput.make} {carInput.model}</h1>
        <p className="text-textSecondary">{carInput.trim}</p>
      </div>

      <div className="bg-secondary/50 backdrop-blur-sm border border-divider rounded-xl shadow-lg p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <PerformanceCard 
            title="Stock Performance" 
            hp={stockPerformance.horsepower} 
            whp={stockPerformance.whp}
            zeroToSixty={stockPerformance.zeroToSixty} 
          />
          <PerformanceCard 
            title="Estimated Performance" 
            hp={estimatedPerformance.horsepower} 
            whp={estimatedPerformance.whp}
            zeroToSixty={estimatedPerformance.zeroToSixty} 
            isEstimated 
          />
        </div>

        <div className="flex justify-around mt-6 text-textPrimary text-center">
            <div>
                <p className="text-sm text-textSecondary">Horsepower Gain</p>
                <DifferenceIndicator value={hpDiff} unit=" HP" positiveIsGood={true} />
            </div>
            <div>
                <p className="text-sm text-textSecondary">0-60s Improvement</p>
                <DifferenceIndicator value={zeroToSixtyDiff} unit="s" positiveIsGood={false} />
            </div>
        </div>

        <ConfidenceBadge confidence={confidence} />
        
        <div className="mt-8 pt-6 border-t border-divider">
          <h3 className="text-xl font-semibold mb-3 text-primary">Analyst's Explanation</h3>
          <p className="text-textSecondary whitespace-pre-wrap leading-relaxed">{explanation}</p>
        </div>

        {sources && sources.length > 0 && (
          <div className="mt-6 pt-6 border-t border-divider">
            <h3 className="text-xl font-semibold mb-3 text-primary">Sources</h3>
            <ul className="list-disc list-inside space-y-2">
              {sources.map((source, index) => (
                <li key={index}>
                  <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {source.web.title || source.web.uri}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Save message */}
        {saveMessage && (
          <div className={`mt-6 p-4 rounded-lg text-center ${
            saveMessage.includes('Successfully')
              ? 'bg-success/20 border border-success text-success'
              : 'bg-error/20 border border-error text-error'
          }`}>
            {saveMessage}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-divider flex justify-center gap-3 flex-wrap">
          <button
            onClick={onGoBack}
            className="px-6 py-3 bg-secondary text-textPrimary font-semibold rounded-lg shadow-md hover:bg-secondary/80 border border-divider transition-all"
          >
            New Estimate
          </button>

          {/* Save Car Button - only show if user is logged in */}
          {user?.email && onSaveCar && (
            <button
              onClick={() => setShowSaveModal(true)}
              disabled={isSaving}
              className="px-6 py-3 bg-gradient-to-r from-[#07fef7] to-[#d82c83] text-white font-semibold rounded-lg shadow-md hover:opacity-90 transition-all disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Car'}
            </button>
          )}

          <button
            onClick={() => {
              const params = new URLSearchParams({
                year: carInput.year,
                make: carInput.make,
                model: carInput.model,
                trim: carInput.trim,
                source: 'performance-calculator'
              });
              window.open(`/w/on-site/embed?${params.toString()}`, '_blank');
            }}
            className="px-6 py-3 bg-primary text-background font-semibold rounded-lg shadow-md hover:bg-primary/90 transition-all"
          >
            Turn into Image
          </button>
        </div>

        {/* Save Modal */}
        {showSaveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-secondary p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold text-textPrimary mb-4">Save Car to Garage</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-textSecondary mb-2">
                  Car Name
                </label>
                <input
                  type="text"
                  value={carName}
                  onChange={(e) => setCarName(e.target.value)}
                  className="w-full px-3 py-2 border border-divider rounded-md bg-background text-textPrimary focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="My Build Name"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={!carName.trim() || isSaving}
                  className="flex-1 bg-gradient-to-r from-[#07fef7] to-[#d82c83] text-white py-2 px-4 rounded-md font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setShowSaveModal(false)}
                  disabled={isSaving}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};