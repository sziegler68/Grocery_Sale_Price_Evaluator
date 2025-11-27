/**
 * Quality Selector Component
 * Displays quality checkboxes and radio buttons based on selected category
 */

import React from 'react';
import {
  FRESHNESS_OPTIONS,
  MEAT_GRADES,
  SEAFOOD_SOURCES,
  categorySupports,
  type QualityFlags,
  type Category,
} from '../constants/categories';

interface QualitySelectorProps {
  category: Category | string;
  quality: QualityFlags;
  onChange: (quality: QualityFlags) => void;
  className?: string;
}

export const QualitySelector: React.FC<QualitySelectorProps> = ({
  category,
  quality,
  onChange,
  className = '',
}) => {
  const showMeatOptions = categorySupports.meatGrades(category);
  const showSeafoodOptions = categorySupports.seafoodSource(category);

  const handleOrganicChange = (checked: boolean) => {
    onChange({ ...quality, organic: checked });
  };

  const handleGrassFedChange = (checked: boolean) => {
    onChange({ ...quality, grassFed: checked });
  };

  const handleFreshnessChange = (freshness: typeof FRESHNESS_OPTIONS[number] | null) => {
    onChange({ ...quality, freshness: freshness || undefined });
  };

  const handleMeatGradeChange = (grade: typeof MEAT_GRADES[number] | null) => {
    onChange({ ...quality, meatGrade: grade || undefined });
  };

  const handleSeafoodSourceChange = (source: typeof SEAFOOD_SOURCES[number] | null) => {
    onChange({ ...quality, seafoodSource: source || undefined });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Always Available Options */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-primary">Quality</h4>
        
        {/* Organic Checkbox */}
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={quality.organic || false}
            onChange={(e) => handleOrganicChange(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
          />
          <span className="text-sm text-primary">Organic</span>
        </label>

        {/* Freshness Radio Group */}
        <div className="space-y-2">
          <p className="text-xs text-secondary">Freshness:</p>
          <div className="space-y-1.5 pl-2">
            {FRESHNESS_OPTIONS.map((option) => (
              <label key={option} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="freshness"
                  checked={quality.freshness === option}
                  onChange={() => handleFreshnessChange(option)}
                  className="w-4 h-4 border-gray-300 text-brand focus:ring-brand"
                />
                <span className="text-sm text-primary">{option}</span>
              </label>
            ))}
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="freshness"
                checked={!quality.freshness}
                onChange={() => handleFreshnessChange(null)}
                className="w-4 h-4 border-gray-300 text-brand focus:ring-brand"
              />
              <span className="text-sm text-secondary italic">None</span>
            </label>
          </div>
        </div>
      </div>

      {/* Meat-Specific Options */}
      {showMeatOptions && (
        <div className="space-y-3 pt-3 border-t border-primary">
          <h4 className="text-sm font-medium text-primary">Meat Quality</h4>
          
          {/* Grass-Fed Checkbox */}
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={quality.grassFed || false}
              onChange={(e) => handleGrassFedChange(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
            />
            <span className="text-sm text-primary">Grass-Fed</span>
          </label>

          {/* Meat Grade Radio Group */}
          <div className="space-y-2">
            <p className="text-xs text-secondary">Grade:</p>
            <div className="space-y-1.5 pl-2">
              {MEAT_GRADES.map((grade) => (
                <label key={grade} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="meatGrade"
                    checked={quality.meatGrade === grade}
                    onChange={() => handleMeatGradeChange(grade)}
                    className="w-4 h-4 border-gray-300 text-brand focus:ring-brand"
                  />
                  <span className="text-sm text-primary">{grade}</span>
                </label>
              ))}
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="meatGrade"
                  checked={!quality.meatGrade}
                  onChange={() => handleMeatGradeChange(null)}
                  className="w-4 h-4 border-gray-300 text-brand focus:ring-brand"
                />
                <span className="text-sm text-secondary italic">None</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Seafood-Specific Options */}
      {showSeafoodOptions && (
        <div className="space-y-3 pt-3 border-t border-primary">
          <h4 className="text-sm font-medium text-primary">Seafood Source</h4>
          
          {/* Seafood Source Radio Group */}
          <div className="space-y-1.5 pl-2">
            {SEAFOOD_SOURCES.map((source) => (
              <label key={source} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="seafoodSource"
                  checked={quality.seafoodSource === source}
                  onChange={() => handleSeafoodSourceChange(source)}
                  className="w-4 h-4 border-gray-300 text-brand focus:ring-brand"
                />
                <span className="text-sm text-primary">{source}</span>
              </label>
            ))}
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="seafoodSource"
                checked={!quality.seafoodSource}
                onChange={() => handleSeafoodSourceChange(null)}
                className="w-4 h-4 border-gray-300 text-brand focus:ring-brand"
              />
              <span className="text-sm text-secondary italic">None</span>
            </label>
          </div>
        </div>
      )}

      {/* Helper text when nothing is shown */}
      {!showMeatOptions && !showSeafoodOptions && category !== 'Meat' && category !== 'Seafood' && (
        <p className="text-xs text-secondary italic pt-2">
          Select Meat or Seafood category for additional quality options
        </p>
      )}
    </div>
  );
};
