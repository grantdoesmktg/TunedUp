import React, { useState } from 'react';
import { CameraOptions, StyleOptions, OutputOptions } from '../types';

interface AdvancedAccordionProps {
  camera: CameraOptions;
  style: StyleOptions;
  output: OutputOptions;
  onCameraChange: (camera: CameraOptions) => void;
  onStyleChange: (style: StyleOptions) => void;
  onOutputChange: (output: OutputOptions) => void;
}

const AdvancedAccordion: React.FC<AdvancedAccordionProps> = ({
  camera,
  style,
  output,
  onCameraChange,
  onStyleChange,
  onOutputChange
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="advanced-accordion">
      <button
        type="button"
        className="accordion-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        Advanced Options
        <span className={`accordion-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>
      
      {isOpen && (
        <div className="accordion-content">
          <div className="accordion-section">
            <h4>Camera</h4>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="angle">Angle</label>
                <select
                  id="angle"
                  value={camera.angle}
                  onChange={(e) => onCameraChange({ ...camera, angle: e.target.value })}
                >
                  <option value="three-quarter front">Three-quarter front</option>
                  <option value="profile">Profile</option>
                  <option value="front">Front</option>
                  <option value="rear">Rear</option>
                  <option value="overhead">Overhead</option>
                  <option value="low angle">Low angle</option>
                  <option value="high angle">High angle</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="focalLength">Focal Length</label>
                <input
                  id="focalLength"
                  type="number"
                  min="24"
                  max="200"
                  value={camera.focalLength}
                  onChange={(e) => onCameraChange({ ...camera, focalLength: Number(e.target.value) })}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="motion">Motion</label>
                <select
                  id="motion"
                  value={camera.motion}
                  onChange={(e) => onCameraChange({ ...camera, motion: e.target.value })}
                >
                  <option value="static">Static</option>
                  <option value="panning">Panning</option>
                  <option value="tracking">Tracking</option>
                  <option value="dolly">Dolly</option>
                </select>
              </div>
            </div>
          </div>

          <div className="accordion-section">
            <h4>Style</h4>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="realism">
                  Realism: {style.realism}%
                </label>
                <input
                  id="realism"
                  type="range"
                  min="0"
                  max="100"
                  value={style.realism}
                  onChange={(e) => onStyleChange({ ...style, realism: Number(e.target.value) })}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="grain">
                  Grain: {style.grain}%
                </label>
                <input
                  id="grain"
                  type="range"
                  min="0"
                  max="50"
                  value={style.grain}
                  onChange={(e) => onStyleChange({ ...style, grain: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <div className="accordion-section">
            <h4>Output</h4>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="width">Width</label>
                <select
                  id="width"
                  value={output.width}
                  onChange={(e) => onOutputChange({ ...output, width: Number(e.target.value) })}
                >
                  <option value="512">512px</option>
                  <option value="768">768px</option>
                  <option value="1024">1024px</option>
                  <option value="1536">1536px</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="height">Height</label>
                <select
                  id="height"
                  value={output.height}
                  onChange={(e) => onOutputChange({ ...output, height: Number(e.target.value) })}
                >
                  <option value="512">512px</option>
                  <option value="768">768px</option>
                  <option value="1024">1024px</option>
                  <option value="1536">1536px</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="seed">Seed (optional)</label>
                <input
                  id="seed"
                  type="number"
                  min="0"
                  max="2147483647"
                  value={output.seed || ''}
                  onChange={(e) => onOutputChange({ 
                    ...output, 
                    seed: e.target.value ? Number(e.target.value) : undefined 
                  })}
                  placeholder="Random if empty"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedAccordion;