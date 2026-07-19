import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { logger } from '@/components/utils/logger';

export default function StrainAutocomplete({ value, onChange }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef(null);
  const strainsLoadedRef = useRef(false);
  const allStrainsRef = useRef([]);

  // Load all unique strain names once on mount
  useEffect(() => {
    const loadStrains = async () => {
      try {
        const sessions = await base44.entities.Session.list('-created_date', 500);
        const unique = [...new Set(sessions.map(s => s.strain).filter(Boolean))];
        allStrainsRef.current = unique;
        strainsLoadedRef.current = true;
      } catch (error) {
        logger.error('[StrainAutocomplete] Error loading strains:', error);
      }
    };
    loadStrains();
  }, []);

  // Filter suggestions based on input
  useEffect(() => {
    if (!value || !value.trim() || !strainsLoadedRef.current) {
      setSuggestions([]);
      return;
    }
    const lower = value.toLowerCase();
    const filtered = allStrainsRef.current
      .filter(s => s.toLowerCase().includes(lower) && s.toLowerCase() !== lower)
      .slice(0, 6);
    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
    setHighlightIndex(-1);
  }, [value]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault();
      onChange(suggestions[highlightIndex]);
      setShowSuggestions(false);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSelect = (strain) => {
    onChange(strain);
    setShowSuggestions(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        type="text"
        placeholder="e.g. Blue Dream"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        className="bg-[#141416] border-gray-800 text-white"
        required
        autoComplete="off"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-[#141416] border border-gray-700 rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto">
          {suggestions.map((strain, idx) => (
            <button
              key={strain}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(strain);
              }}
              onMouseEnter={() => setHighlightIndex(idx)}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                idx === highlightIndex
                  ? 'bg-[#25A55F]/20 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              {strain}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}