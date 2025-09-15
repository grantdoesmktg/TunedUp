import React from 'react';
import type { CarInput } from '../types';
import { DRIVETRAIN_OPTIONS, TRANSMISSION_OPTIONS, TIRE_TYPE_OPTIONS, FUEL_TYPE_OPTIONS, LAUNCH_TECHNIQUE_OPTIONS } from '../constants';

interface InputFormProps {
  carInput: CarInput;
  setCarInput: React.Dispatch<React.SetStateAction<CarInput>>;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

const QUICK_ADD_MODS = [
    "Catback Exhaust", 
    "ECU Tune Stage 1", 
    "Cold Air Intake", 
    "Muffler Delete",
    "High-Flow air filter",
    "Axle-Back Exhaust",
    "Downpipes Catted",
    "Downpipes Catless",
    "Upgraded Intercooler",
    "Upgraded Fuel Pump",
    "Ported Intake Manifold",
    "Coilovers",
    "Lowering Springs",
];

// Reusable UI components defined outside the main component
const FormRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</div>
);

const InputField: React.FC<{ label: string, name: keyof CarInput, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder: string, required?: boolean }> = ({ label, name, value, onChange, placeholder, required = false }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-textSecondary mb-1">{label}</label>
    <input
      type="text"
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full px-4 py-2 bg-secondary border border-divider text-textPrimary rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition"
    />
  </div>
);

const SelectField: React.FC<{ label: string, name: keyof CarInput, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: string[] }> = ({ label, name, value, onChange, options }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-textSecondary mb-1">{label}</label>
    <select
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full px-4 py-2 bg-secondary border border-divider text-textPrimary rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition appearance-none"
    >
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);


export const InputForm: React.FC<InputFormProps> = ({ carInput, setCarInput, onSubmit, isLoading }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCarInput(prev => ({ ...prev, [name]: value }));
  };

  const handleQuickAdd = (mod: string) => {
    setCarInput(prev => {
      const existingMods = prev.modifications.trim();
      // Prevent adding duplicates
      if (existingMods.toLowerCase().includes(mod.toLowerCase())) {
        return prev;
      }
      const newMods = existingMods ? `${existingMods}, ${mod}` : mod;
      return { ...prev, modifications: newMods };
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-secondary/50 backdrop-blur-sm border border-divider rounded-xl shadow-lg p-8">

        <form onSubmit={onSubmit} className="space-y-8">
          
          <fieldset>
            <legend className="text-xl font-semibold text-textPrimary border-b border-divider pb-2 mb-6 w-full">Vehicle Details</legend>
            <div className="space-y-6">
              <FormRow>
                <InputField label="Make" name="make" value={carInput.make} onChange={handleChange} placeholder="e.g., Honda" required />
                <InputField label="Model" name="model" value={carInput.model} onChange={handleChange} placeholder="e.g., Civic" required />
              </FormRow>
              <FormRow>
                <InputField label="Year" name="year" value={carInput.year} onChange={handleChange} placeholder="e.g., 2022" required />
                <InputField label="Trim (Optional)" name="trim" value={carInput.trim} onChange={handleChange} placeholder="e.g., Type R" />
              </FormRow>
              <FormRow>
                <SelectField label="Drivetrain" name="drivetrain" value={carInput.drivetrain} onChange={handleChange} options={DRIVETRAIN_OPTIONS} />
                <SelectField label="Transmission" name="transmission" value={carInput.transmission} onChange={handleChange} options={TRANSMISSION_OPTIONS} />
              </FormRow>
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xl font-semibold text-textPrimary border-b border-divider pb-2 mb-6 w-full">Modifications & Setup</legend>
            <div className="space-y-6">
              <div>
                <label htmlFor="modifications" className="block text-sm font-medium text-textSecondary mb-1">Performance Modifications</label>
                <textarea
                  id="modifications"
                  name="modifications"
                  value={carInput.modifications}
                  onChange={handleChange}
                  rows={5}
                  placeholder="List all performance mods, e.g., cold air intake, cat-back exhaust, ECU tune..."
                  required
                  className="w-full px-4 py-2 bg-secondary border border-divider text-textPrimary rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition"
                />
                 <div className="mt-3">
                  <label className="block text-xs font-medium text-textSecondary mb-2">Quick Add:</label>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_ADD_MODS.map(mod => (
                      <button
                        key={mod}
                        type="button"
                        onClick={() => handleQuickAdd(mod)}
                        className="px-3 py-1 bg-divider text-textSecondary text-sm rounded-full hover:bg-primary hover:text-background transition-colors"
                      >
                        + {mod}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <FormRow>
                <SelectField label="Tire Type" name="tireType" value={carInput.tireType} onChange={handleChange} options={TIRE_TYPE_OPTIONS} />
                <SelectField label="Fuel Type" name="fuelType" value={carInput.fuelType} onChange={handleChange} options={FUEL_TYPE_OPTIONS} />
              </FormRow>
              <div>
                <SelectField label="Launch Technique" name="launchTechnique" value={carInput.launchTechnique} onChange={handleChange} options={LAUNCH_TECHNIQUE_OPTIONS} />
              </div>
            </div>
          </fieldset>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center px-6 py-3 bg-highlight text-textPrimary font-semibold rounded-lg shadow-md hover:bg-highlight/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-highlight transition-all duration-300 disabled:bg-divider disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </>
              ) : 'Estimate Performance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};