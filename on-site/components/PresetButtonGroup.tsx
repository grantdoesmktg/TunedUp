import React from 'react';

interface PresetOption {
  key: string;
  label: string;
  description: string;
}

interface PresetButtonGroupProps {
  title: string;
  options: PresetOption[];
  selectedKey?: string;
  onSelect: (key: string) => void;
}

const PresetButtonGroup: React.FC<PresetButtonGroupProps> = ({ 
  title, 
  options, 
  selectedKey, 
  onSelect 
}) => {
  return (
    <div className="preset-group">
      <h3 className="preset-title">{title}</h3>
      <div className="preset-buttons">
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            className={`preset-button ${selectedKey === option.key ? 'selected' : ''}`}
            onClick={() => onSelect(selectedKey === option.key ? '' : option.key)}
            title={option.description}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PresetButtonGroup;