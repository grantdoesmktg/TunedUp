import React from 'react';

interface TimeOption {
  key: string;
  label: string;
  description: string;
}

interface TimePresetGroupProps {
  title: string;
  options: TimeOption[];
  selectedKey?: string;
  onSelect: (key: string) => void;
}

const TimePresetGroup: React.FC<TimePresetGroupProps> = ({
  title,
  options,
  selectedKey,
  onSelect
}) => {
  return (
    <div className="preset-group">
      <h3 className="preset-title">{title}</h3>
      <div className="time-preset-container">
        <div className="time-preset-grid">
          {options.map((option) => (
            <button
              key={option.key}
              type="button"
              className={`time-preset-button ${selectedKey === option.key ? 'selected' : ''}`}
              onClick={() => onSelect(selectedKey === option.key ? '' : option.key)}
              title={option.description}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimePresetGroup;