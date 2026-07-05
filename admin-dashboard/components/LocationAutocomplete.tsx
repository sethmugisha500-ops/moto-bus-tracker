// components/LocationAutocomplete.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { GOOGLE_MAPS_API_KEY, loadGoogleMapsScript } from '@/lib/maps';

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string, place?: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  className?: string;
  country?: string;
}

export default function LocationAutocomplete({
  value,
  onChange,
  placeholder = 'Search location...',
  className = '',
  country = 'rw',
}: LocationAutocompleteProps) {
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ─── Load Google Maps ──────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        await loadGoogleMapsScript();
        setLoaded(true);
      } catch (error) {
        console.error('Failed to load Google Maps:', error);
      }
    };
    init();
  }, []);

  // ─── Handle Input Change ──────────────────────────────────────
  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    onChange(input);
    setShowPredictions(true);

    if (!loaded || input.length < 2) {
      setPredictions([]);
      return;
    }

    setLoading(true);
    try {
      const autocompleteService = new google.maps.places.AutocompleteService();
      autocompleteService.getPlacePredictions(
        {
          input,
          componentRestrictions: { country },
          types: ['geocode', 'establishment'],
        },
        (results, status) => {
          setLoading(false);
          if (status === 'OK' && results) {
            setPredictions(results);
          } else {
            setPredictions([]);
          }
        }
      );
    } catch (error) {
      console.error('Autocomplete error:', error);
      setLoading(false);
    }
  };

  // ─── Select Prediction ────────────────────────────────────────
  const handleSelectPrediction = async (prediction: google.maps.places.AutocompletePrediction) => {
    setShowPredictions(false);
    setPredictions([]);

    try {
      const service = new google.maps.places.PlacesService(document.createElement('div'));
      service.getDetails(
        { placeId: prediction.place_id },
        (result, status) => {
          if (status === 'OK' && result) {
            onChange(prediction.description, result);
          } else {
            onChange(prediction.description);
          }
        }
      );
    } catch (error) {
      console.error('Place details error:', error);
      onChange(prediction.description);
    }
  };

  // ─── Click Outside ─────────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowPredictions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => setShowPredictions(true)}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-[#0A0E0B] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500 transition placeholder-gray-500"
        autoComplete="off"
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {showPredictions && predictions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#111714] border border-gray-800 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              onClick={() => handleSelectPrediction(prediction)}
              className="w-full px-4 py-3 text-left hover:bg-[#1A1E1C] transition flex items-center gap-3 border-b border-gray-800 last:border-0"
            >
              <span className="text-gray-500">📍</span>
              <div>
                <p className="text-sm text-white">{prediction.structured_formatting?.main_text || prediction.description}</p>
                <p className="text-xs text-gray-500">{prediction.structured_formatting?.secondary_text || ''}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}