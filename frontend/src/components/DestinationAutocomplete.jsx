import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Search } from 'lucide-react';
import { INDIAN_DESTINATIONS } from '../utils/formatters';

export const DestinationAutocomplete = ({ value, onChange, placeholder = "e.g., Jaipur, Bhopal, Goa..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filtered, setFiltered] = useState([]);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!value) {
      setFiltered(INDIAN_DESTINATIONS.slice(0, 8));
    } else {
      const q = value.toLowerCase().trim();
      const matches = INDIAN_DESTINATIONS.filter((d) => d.toLowerCase().includes(q));
      setFiltered(matches);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (dest) => {
    onChange(dest);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all shadow-sm"
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto p-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 py-1.5">
            Suggested Indian Destinations
          </div>
          {filtered.length > 0 ? (
            filtered.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => handleSelect(city)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors"
              >
                <span className="font-medium">{city}</span>
                <span className="text-[11px] text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded-full border border-brand-200 dark:border-brand-900">
                  India
                </span>
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-slate-500">
              Press enter to use "{value}" as custom destination.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
