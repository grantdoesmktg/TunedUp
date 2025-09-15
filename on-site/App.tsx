import React, { useState, useEffect } from 'react';
import { CarSpec, PromptSpec, GeneratedImage, CameraOptions, StyleOptions, OutputOptions } from './types';
import { 
  LOCATION_PRESETS, 
  TIME_PRESETS, 
  PALETTE_PRESETS,
  WHEEL_COLORS,
  DEFAULT_CAMERA,
  DEFAULT_STYLE,
  DEFAULT_OUTPUT
} from './constants';
import { parseThemeFromUrl, applyTheme, postResizeMessage, generateImageId } from './utils';
import PresetButtonGroup from './components/PresetButtonGroup';
import AdvancedAccordion from './components/AdvancedAccordion';
import ImageGallery from './components/ImageGallery';
import './styles.css';

const OnSiteApp: React.FC = () => {
  const [carSpec, setCarSpec] = useState<CarSpec>(() => {
    // Check URL parameters for car data from Performance Calculator
    const urlParams = new URLSearchParams(window.location.search);
    
    return {
      year: urlParams.get('year') || '2018',
      make: urlParams.get('make') || 'Infiniti',
      model: urlParams.get('model') || 'Q50',
      color: urlParams.get('color') || 'Liquid Platinum',
      wheelsColor: 'Black',
      addModel: false,
      deBadged: false,
      chromeDelete: false,
      position: 'front',
      details: ''
    };
  });

  // Check if data came from Performance Calculator
  const fromPerformanceCalc = new URLSearchParams(window.location.search).get('source') === 'performance-calculator';

  const [selectedPresets, setSelectedPresets] = useState<{
    location?: string;
    time?: string;
    palette?: string;
  }>({});

  const [camera, setCamera] = useState<CameraOptions>(DEFAULT_CAMERA);
  const [style, setStyle] = useState<StyleOptions>(DEFAULT_STYLE);
  const [output, setOutput] = useState<OutputOptions>(DEFAULT_OUTPUT);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | undefined>();
  const [imageHistory, setImageHistory] = useState<GeneratedImage[]>([]);

  useEffect(() => {
    // Apply theme from URL params
    const theme = parseThemeFromUrl();
    if (theme) {
      applyTheme(theme);
    }

    // Post initial resize message
    postResizeMessage();

    // Set up resize observer for dynamic resizing
    const resizeObserver = new ResizeObserver(() => {
      postResizeMessage();
    });
    resizeObserver.observe(document.body);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    postResizeMessage();
  }, [isLoading, currentImage, imageHistory.length]);

  const buildPromptSpec = (): PromptSpec => ({
    car: carSpec,
    scene: {
      locationKey: selectedPresets.location,
      timeKey: selectedPresets.time,
      paletteKey: selectedPresets.palette
    },
    camera,
    style
  });

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const promptSpec = buildPromptSpec();
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          promptSpec,
          imageParams: output
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.image) {
        throw new Error('No image data received');
      }

      const newImage: GeneratedImage = {
        id: generateImageId(),
        blob: result.image,
        timestamp: result.timestamp || Date.now(),
        promptSpec
      };

      setCurrentImage(result.image);
      setImageHistory(prev => [...prev, newImage].slice(-3)); // Keep only last 3

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate image';
      setError(errorMessage);
      console.error('Generation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetSelect = (category: 'location' | 'time' | 'palette', key: string) => {
    setSelectedPresets(prev => ({
      ...prev,
      [category]: prev[category] === key ? undefined : key
    }));
  };

  const handleRandomize = () => {
    const randomLocation = LOCATION_PRESETS[Math.floor(Math.random() * LOCATION_PRESETS.length)].key;
    const randomTime = TIME_PRESETS[Math.floor(Math.random() * TIME_PRESETS.length)].key;
    const randomPalette = PALETTE_PRESETS[Math.floor(Math.random() * PALETTE_PRESETS.length)].key;
    
    setSelectedPresets({
      location: randomLocation,
      time: randomTime,
      palette: randomPalette
    });
  };

  return (
    <div className="onsite-app">

      {fromPerformanceCalc && (
        <div className="notification-banner">
          <div className="notification-content">
            <div className="notification-text">
              <strong>Car details imported from Performance Calculator!</strong>
              <p>Your {carSpec.year} {carSpec.make} {carSpec.model} is ready for image generation.</p>
            </div>
          </div>
        </div>
      )}

      <form className="car-form" onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}>
        <div className="form-section">
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="year">Year</label>
              <input
                id="year"
                type="text"
                value={carSpec.year}
                onChange={(e) => setCarSpec(prev => ({ ...prev, year: e.target.value }))}
                placeholder="e.g., 2024, 2023, 2022"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="make">Make</label>
              <input
                id="make"
                type="text"
                value={carSpec.make}
                onChange={(e) => setCarSpec(prev => ({ ...prev, make: e.target.value }))}
                placeholder="e.g., BMW, Toyota, Ford"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="model">Model</label>
              <input
                id="model"
                type="text"
                value={carSpec.model}
                onChange={(e) => setCarSpec(prev => ({ ...prev, model: e.target.value }))}
                placeholder="e.g., M3, Camaro, GT-R"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="color">Color</label>
              <input
                id="color"
                type="text"
                value={carSpec.color}
                onChange={(e) => setCarSpec(prev => ({ ...prev, color: e.target.value }))}
                placeholder="e.g., Red, Blue, Black"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="wheelsColor">Wheels Color</label>
              <select
                id="wheelsColor"
                value={carSpec.wheelsColor}
                onChange={(e) => setCarSpec(prev => ({ ...prev, wheelsColor: e.target.value }))}
              >
                {WHEEL_COLORS.map(color => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="position">Position</label>
              <select
                id="position"
                value={carSpec.position}
                onChange={(e) => setCarSpec(prev => ({ ...prev, position: e.target.value as 'front' | 'quarter' | 'three-quarter' | 'back' }))}
              >
                <option value="front">Front - Direct front view</option>
                <option value="quarter">1/4 - Front corner angle</option>
                <option value="three-quarter">3/4 - Rear corner angle</option>
                <option value="back">Back - Direct rear view</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={carSpec.addModel}
                  onChange={(e) => setCarSpec(prev => ({ ...prev, addModel: e.target.checked }))}
                />
                Add Model
              </label>
            </div>
            
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={carSpec.deBadged}
                  onChange={(e) => setCarSpec(prev => ({ ...prev, deBadged: e.target.checked }))}
                />
                De-Badged
              </label>
            </div>
            
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={carSpec.chromeDelete}
                  onChange={(e) => setCarSpec(prev => ({ ...prev, chromeDelete: e.target.checked }))}
                />
                Chrome Delete
              </label>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="details">Additional Details</label>
              <input
                id="details"
                type="text"
                value={carSpec.details}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 50) {
                    setCarSpec(prev => ({ ...prev, details: value }));
                  }
                }}
                placeholder="e.g., lowered, custom rims, spoiler"
                maxLength={50}
              />
              <small className="character-count">
                {carSpec.details.length}/50 characters
              </small>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="scene-header">
            <button
              type="button"
              onClick={handleRandomize}
              className="randomize-button"
              title="Randomize all scene presets"
            >
Randomize
            </button>
          </div>
          
          <PresetButtonGroup
            title="Location"
            options={LOCATION_PRESETS}
            selectedKey={selectedPresets.location}
            onSelect={(key) => handlePresetSelect('location', key)}
          />

          <PresetButtonGroup
            title="Time"
            options={TIME_PRESETS}
            selectedKey={selectedPresets.time}
            onSelect={(key) => handlePresetSelect('time', key)}
          />

          <PresetButtonGroup
            title="Palette"
            options={PALETTE_PRESETS}
            selectedKey={selectedPresets.palette}
            onSelect={(key) => handlePresetSelect('palette', key)}
          />
        </div>

        <AdvancedAccordion
          camera={camera}
          style={style}
          output={output}
          onCameraChange={setCamera}
          onStyleChange={setStyle}
          onOutputChange={setOutput}
        />

        <div className="generate-section">
          <button
            type="submit"
            className="generate-button"
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Generate Image'}
          </button>
          
          {error && (
            <div className="error-message">
              {error}
              <button
                type="button"
                className="retry-button"
                onClick={handleGenerate}
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </form>

      <ImageGallery
        images={imageHistory}
        isLoading={isLoading}
        currentImage={currentImage}
      />
    </div>
  );
};

export default OnSiteApp;