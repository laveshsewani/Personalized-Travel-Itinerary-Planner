import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Compass, Calendar, Wallet, Users, Sparkles, Check, ArrowRight, ArrowLeft, Heart, Utensils, Shield, Info } from 'lucide-react';
import { useTripStore } from '../store/tripStore';
import { DestinationAutocomplete } from '../components/DestinationAutocomplete';
import { formatINR } from '../utils/formatters';
import { apiClient } from '../api/client';

export const TripBuilderPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const destQuery = searchParams.get('destination');

  const {
    builderStep,
    setBuilderStep,
    builderData,
    updateBuilderData,
    generateItinerary,
    fetchRecommendations,
    recommendations,
    generating,
    setToast,
  } = useTripStore();

  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (destQuery) {
      updateBuilderData({ destination: destQuery });
    }
  }, [destQuery]);

  // Load saved preferences if available
  const handleAutofillPreferences = async () => {
    try {
      const res = await apiClient.get('/preferences');
      if (res.data) {
        updateBuilderData({
          interests: res.data.interests || builderData.interests,
          travelStyle: res.data.travel_style || builderData.travelStyle,
          pace: res.data.pace || builderData.pace,
          dietaryPrefs: res.data.dietary_prefs || builderData.dietaryPrefs,
        });
        setToast({ type: 'success', message: 'Autofilled saved travel preferences!' });
      }
    } catch (e) {
      setToast({ type: 'info', message: 'No saved preferences found. Customizing now.' });
    }
  };

  // Step 1 Validation
  const validateStep1 = () => {
    if (!builderData.destination.trim()) {
      setValidationError('Please select or type a destination.');
      return false;
    }
    if (!builderData.startDate || !builderData.endDate) {
      setValidationError('Please choose valid travel dates.');
      return false;
    }
    if (new Date(builderData.endDate) < new Date(builderData.startDate)) {
      setValidationError('End date cannot be before start date.');
      return false;
    }
    setValidationError('');
    return true;
  };

  // Step 3 Validation
  const validateStep3 = () => {
    if (!builderData.interests || builderData.interests.length === 0) {
      setValidationError('Please select at least one interest.');
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleNext = () => {
    if (builderStep === 1 && !validateStep1()) return;
    if (builderStep === 3 && !validateStep3()) return;

    if (builderStep === 4) {
      // Fetch recommendations preview before moving to review step
      fetchRecommendations();
    }

    setValidationError('');
    setBuilderStep(Math.min(builderStep + 1, 5));
  };

  const handleBack = () => {
    setValidationError('');
    setBuilderStep(Math.max(builderStep - 1, 1));
  };

  const handleGenerate = async () => {
    try {
      await generateItinerary(navigate);
    } catch (err) {
      // Error handled in store
    }
  };

  const interestOptions = [
    { id: 'sightseeing', label: 'Sightseeing', icon: '🏛️' },
    { id: 'food', label: 'Food & Street Food', icon: '🍲' },
    { id: 'culture', label: 'Culture & Heritage', icon: '🪔' },
    { id: 'nature', label: 'Nature & Lakes', icon: '🌿' },
    { id: 'adventure', label: 'Adventure & Treks', icon: '🧗' },
    { id: 'relaxation', label: 'Relaxation & Wellness', icon: '🧘' },
    { id: 'nightlife', label: 'Nightlife & Markets', icon: '✨' },
    { id: 'shopping', label: 'Local Bazaars & Shopping', icon: '🛍️' },
  ];

  const travelStyles = [
    { id: 'relaxed', label: 'Relaxed', desc: 'Slow mornings, scenic viewpoints, minimal rushing.' },
    { id: 'balanced', label: 'Balanced', desc: '2-3 key stops daily, culinary tasting, great photo stops.' },
    { id: 'packed', label: 'Packed & Fast', desc: 'Early start, maximum monuments, vibrant evening markets.' },
  ];

  const dietaryOptions = [
    { id: 'vegetarian', label: 'Pure Vegetarian' },
    { id: 'jain', label: 'Jain / Satvik (No onion/garlic)' },
    { id: 'non-veg', label: 'Non-Vegetarian' },
    { id: 'any', label: 'No Dietary Restriction' },
  ];

  // Days count calculation
  const startD = new Date(builderData.startDate);
  const endD = new Date(builderData.endDate);
  const daysDiff = Math.max(Math.round((endD - startD) / (1000 * 60 * 60 * 24)) + 1, 1);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Step Progress Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>Step {builderStep} of 5</span>
          <button
            type="button"
            onClick={handleAutofillPreferences}
            className="text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autofill saved preferences</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-amber-500 transition-all duration-300"
            style={{ width: `${(builderStep / 5) * 100}%` }}
          />
        </div>

        <div className="flex justify-between text-[11px] font-medium text-slate-400 px-1 hidden sm:flex">
          <span className={builderStep >= 1 ? 'text-brand-600 font-bold' : ''}>1. Destination</span>
          <span className={builderStep >= 2 ? 'text-brand-600 font-bold' : ''}>2. Budget</span>
          <span className={builderStep >= 3 ? 'text-brand-600 font-bold' : ''}>3. Interests</span>
          <span className={builderStep >= 4 ? 'text-brand-600 font-bold' : ''}>4. Style</span>
          <span className={builderStep >= 5 ? 'text-brand-600 font-bold' : ''}>5. Generate</span>
        </div>
      </div>

      {validationError && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-600 dark:text-rose-300 animate-shake">
          {validationError}
        </div>
      )}

      {/* STEP 1: Destination, Dates, Group Size */}
      {builderStep === 1 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Where & When are you traveling?
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select any Indian destination or type a custom city.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Destination City *
              </label>
              <DestinationAutocomplete
                value={builderData.destination}
                onChange={(dest) => updateBuilderData({ destination: dest })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Start Date *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    required
                    value={builderData.startDate}
                    onChange={(e) => updateBuilderData({ startDate: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  End Date *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    required
                    value={builderData.endDate}
                    onChange={(e) => updateBuilderData({ endDate: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
              <span>Trip Duration:</span>
              <span className="font-bold text-slate-900 dark:text-white">{daysDiff} Days</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Number of Travelers
              </label>
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 4, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => updateBuilderData({ groupSize: num })}
                    className={`py-3 rounded-xl border text-center font-bold text-sm transition-all ${
                      builderData.groupSize === num
                        ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {num === 1 ? 'Solo' : num === 2 ? 'Couple (2)' : `${num} People`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Budget Slider in ₹ */}
      {builderStep === 2 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              What is your estimated total budget?
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              All costs are calculated in Indian Rupees (₹) across stays, food, monuments, and cabs.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-brand-50/50 dark:bg-brand-950/20 border border-brand-100 dark:border-brand-900/40 text-center space-y-2">
            <span className="text-xs uppercase font-bold text-brand-600 dark:text-brand-400 tracking-wider">
              Selected Budget Target
            </span>
            <div className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white">
              {formatINR(builderData.budget)}
            </div>
            <p className="text-xs text-slate-500">
              Approx. {formatINR(Math.round(builderData.budget / daysDiff))} per day for {builderData.groupSize} traveler{builderData.groupSize > 1 ? 's' : ''}
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <input
              type="range"
              min="5000"
              max="250000"
              step="2500"
              value={builderData.budget}
              onChange={(e) => updateBuilderData({ budget: Number(e.target.value) })}
              className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
            />
            <div className="flex justify-between text-xs text-slate-400 font-semibold">
              <span>Budget (₹5,000)</span>
              <span>Mid-range (₹50,000)</span>
              <span>Luxury (₹2,50,000+)</span>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Interests */}
      {builderStep === 3 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              What experiences inspire you most?
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select at least one theme to guide our recommendation and prompt engine.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {interestOptions.map((opt) => {
              const selected = builderData.interests.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    const current = builderData.interests;
                    const next = selected
                      ? current.filter((x) => x !== opt.id)
                      : [...current, opt.id];
                    updateBuilderData({ interests: next });
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between h-28 ${
                    selected
                      ? 'bg-brand-500 text-white border-brand-500 shadow-md scale-102'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/40 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold leading-tight">{opt.label}</span>
                    {selected && <Check className="w-4 h-4 shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 4: Travel Style, Pace & Dietary */}
      {builderStep === 4 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Pacing & Dietary Preferences
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Customize how fast you explore and any dining constraints.
            </p>
          </div>

          {/* Pace selection */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Trip Pace & Style
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {travelStyles.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => updateBuilderData({ travelStyle: st.id })}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    builderData.travelStyle === st.id
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 ring-2 ring-brand-500'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{st.label}</h4>
                  <p className="text-xs text-slate-500 mt-1">{st.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Dietary selection */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Food & Dietary Preference
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {dietaryOptions.map((opt) => {
                const isSelected = builderData.dietaryPrefs.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateBuilderData({ dietaryPrefs: [opt.id] })}
                    className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: Review & Generate */}
      {builderStep === 5 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                Review & Confirm Details
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Everything is set. Ready to prompt Llama-3 and our scoring service.
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          {/* Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Destination</span>
              <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                {builderData.destination}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Duration & Dates</span>
              <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                {daysDiff} Days
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Budget</span>
              <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">
                {formatINR(builderData.budget)}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Travel Style</span>
              <p className="font-bold text-slate-900 dark:text-white text-sm capitalize mt-0.5">
                {builderData.travelStyle}
              </p>
            </div>
          </div>

          {/* Live ML Recommendations Preview */}
          {recommendations && (
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                <span>Scored Candidates for {builderData.destination}</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recommendations.ranked_attractions?.slice(0, 2).map((a, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">{a.name}</span>
                      <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-1.5 py-0.5 rounded">
                        Score: {Math.round(a.recommendation_score * 100)}%
                      </span>
                    </div>
                    <p className="text-slate-500 line-clamp-1">{a.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Generate Button */}
          <div className="pt-4">
            <button
              type="button"
              disabled={generating}
              onClick={handleGenerate}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 hover:to-amber-600 text-white font-black text-base shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
            >
              <Sparkles className={`w-5 h-5 ${generating ? 'animate-spin' : ''}`} />
              <span>{generating ? 'Crafting Itinerary with AI...' : 'Generate Itinerary Now'}</span>
            </button>
            <p className="text-center text-[11px] text-slate-400 mt-2">
              All prices shown will be labeled "estimated" in INR (₹).
            </p>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        {builderStep > 1 ? (
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        ) : (
          <div />
        )}

        {builderStep < 5 && (
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm hover:bg-brand-500 dark:hover:bg-brand-400 hover:text-white dark:hover:text-slate-900 shadow-md transition-all active:scale-95"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
