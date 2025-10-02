import React from 'react';

interface LocationOption {
  key: string;
  label: string;
  description: string;
}

interface CountryGroup {
  flag: string;
  name: string;
  locations: LocationOption[];
}

interface LocationPresetGroupProps {
  title: string;
  options: LocationOption[];
  selectedKey?: string;
  onSelect: (key: string) => void;
}

const LocationPresetGroup: React.FC<LocationPresetGroupProps> = ({
  title,
  options,
  selectedKey,
  onSelect
}) => {
  // Group locations by country based on flag emoji in label
  const groupedByCountry: CountryGroup[] = [
    {
      flag: '🇯🇵',
      name: 'Japan',
      locations: options.filter(opt => opt.label.includes('🇯🇵'))
    },
    {
      flag: '🇩🇪',
      name: 'Germany',
      locations: options.filter(opt => opt.label.includes('🇩🇪'))
    },
    {
      flag: '🇺🇸',
      name: 'United States',
      locations: options.filter(opt => opt.label.includes('🇺🇸'))
    },
    {
      flag: '🇰🇷',
      name: 'South Korea',
      locations: options.filter(opt => opt.label.includes('🇰🇷'))
    },
    {
      flag: '🇮🇹',
      name: 'Italy',
      locations: options.filter(opt => opt.label.includes('🇮🇹'))
    }
  ].filter(group => group.locations.length > 0);

  return (
    <div className="preset-group">
      <h3 className="preset-title">{title}</h3>
      <div className="location-countries">
        {groupedByCountry.map((country) => (
          <div key={country.name} className="country-group">
            <div className="country-header">
              <span className="country-flag">{country.flag}</span>
              <span className="country-name">{country.name}</span>
            </div>
            <div className="country-locations">
              {country.locations.map((location) => (
                <button
                  key={location.key}
                  type="button"
                  className={`location-button ${selectedKey === location.key ? 'selected' : ''}`}
                  onClick={() => onSelect(selectedKey === location.key ? '' : location.key)}
                  title={location.description}
                >
                  {location.label.replace(/🇯🇵|🇩🇪|🇺🇸|🇰🇷|🇮🇹\s/, '')}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LocationPresetGroup;