import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, Sparkles, MapPin, Calendar, Wallet, Users, ArrowRight, ShieldCheck, Heart, Coffee, Sun } from 'lucide-react';
import { useTripStore } from '../store/tripStore';

export const LandingPage = () => {
  const navigate = useNavigate();
  const updateBuilderData = useTripStore((state) => state.updateBuilderData);
  const setBuilderStep = useTripStore((state) => state.setBuilderStep);

  const launchScenario = (scenario) => {
    updateBuilderData(scenario);
    setBuilderStep(5); // Go directly to review step
    navigate('/builder');
  };

  const scenarios = [
    {
      id: 'solo',
      title: 'Solo Weekend Explorer',
      destination: 'Indore',
      tagline: 'Culinary Night Trails & Heritage Forts',
      duration: '3 Days',
      budget: 12000,
      groupSize: 1,
      style: 'balanced',
      interests: ['food', 'culture', 'sightseeing'],
      img: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=600&auto=format&fit=crop&q=80',
      highlights: ['Sarafa Night Food Market', 'Rajwada Palace', 'Chappan Dukan street walk'],
    },
    {
      id: 'couple',
      title: 'Romantic Couple Vacation',
      destination: 'Jaipur',
      tagline: 'Royal Palaces, Rooftop Sunsets & Fine Dining',
      duration: '4 Days',
      budget: 45000,
      groupSize: 2,
      style: 'relaxed',
      interests: ['culture', 'sightseeing', 'relaxation', 'food'],
      img: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600&auto=format&fit=crop&q=80',
      highlights: ['Amber Fort & Sheesh Mahal', 'Sunset at Nahargarh', 'Heritage dining at 1135 AD'],
    },
    {
      id: 'group',
      title: 'Friends Coastal Getaway',
      destination: 'Goa',
      tagline: 'Sun-drenched Shores, Waterfalls & Nightlife',
      duration: '5 Days',
      budget: 65000,
      groupSize: 4,
      style: 'packed',
      interests: ['adventure', 'nightlife', 'nature', 'food'],
      img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&auto=format&fit=crop&q=80',
      highlights: ['Dudhsagar Trek', 'Palolem Beach Shacks', 'Fontainhas Heritage Quarter'],
    },
  ];

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 md:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-semibold mb-6 animate-fade-in">
            <Sparkles className="w-4 h-4 text-brand-500" />
            <span>AI-Powered Itinerary Intelligence Tailored for India</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-[1.1]">
            Plan Your Perfect <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-amber-500 to-brand-500">Bharat Yatra</span> in Seconds.
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            From Indore's night food streets to Jaipur's royal forts and Goa's serene shores — generate bespoke, budget-aligned itineraries with transit logistics and interactive maps.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/builder"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-base shadow-lg shadow-brand-500/25 transition-all hover:scale-105 active:scale-95"
            >
              <Compass className="w-5 h-5" />
              <span>Build My Itinerary Free</span>
            </Link>

            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold text-base transition-colors"
            >
              <span>Explore Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Quick Metrics */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800/80 pt-8">
            <div className="p-3">
              <div className="text-2xl sm:text-3xl font-black text-brand-600 dark:text-brand-400">100%</div>
              <div className="text-xs font-medium text-slate-500 mt-1">₹ INR Native Pricing</div>
            </div>
            <div className="p-3">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">25+</div>
              <div className="text-xs font-medium text-slate-500 mt-1">Curated Indian Hubs</div>
            </div>
            <div className="p-3">
              <div className="text-2xl sm:text-3xl font-black text-brand-600 dark:text-brand-400">Llama-3</div>
              <div className="text-xs font-medium text-slate-500 mt-1">Intelligent Reasoning</div>
            </div>
            <div className="p-3">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">&lt; 3s</div>
              <div className="text-xs font-medium text-slate-500 mt-1">Generation Speed</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Interactive Scenarios */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Real-World Ready
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-1">
            Choose Your Travel Persona
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Click any scenario to pre-fill your trip builder with curated preferences, dates, and budget.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {scenarios.map((sc) => (
            <div
              key={sc.id}
              className="rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl transition-all flex flex-col group"
            >
              <div className="h-48 overflow-hidden relative">
                <img
                  src={sc.img}
                  alt={sc.destination}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-brand-400" />
                  <span>{sc.destination}</span>
                </div>
                <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-brand-500 text-white text-xs font-bold">
                  {sc.duration}
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{sc.title}</h3>
                  <p className="text-xs text-brand-600 dark:text-brand-400 font-medium mt-1">{sc.tagline}</p>
                  
                  <div className="mt-4 space-y-2">
                    <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Highlights:</span>
                    {sc.highlights.map((h, i) => (
                      <div key={i} className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Est. Budget</span>
                    <span className="text-base font-extrabold text-slate-900 dark:text-white">
                      ₹{sc.budget.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      launchScenario({
                        destination: sc.destination,
                        budget: sc.budget,
                        groupSize: sc.groupSize,
                        travelStyle: sc.style,
                        interests: sc.interests,
                        startDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
                        endDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-brand-500 dark:hover:bg-brand-400 hover:text-white dark:hover:text-slate-900 text-xs font-bold transition-all shadow-sm active:scale-95"
                  >
                    <span>Launch Plan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="bg-slate-100/60 dark:bg-slate-900/40 py-16 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">India-First Cost Guard</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Accurate budget distribution in ₹ INR across budget stays, auto-rickshaws, entry monuments, and regional thalis.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Interactive OpenStreetMap</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Visualize daily stops on Leaflet maps with numbered pins. No cross-city zig-zagging or unrealistic routing.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Single-Day Regeneration</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Don't like Day 2? Regenerate just that day with specific tweaks like "more lakes" or "vegetarian thalis" without losing your other edits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="max-w-5xl mx-auto px-4 text-center">
        <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-tr from-brand-600 via-amber-600 to-brand-500 text-white shadow-2xl relative overflow-hidden">
          <h2 className="text-3xl sm:text-4xl font-black">Ready to Craft Your Next Adventure?</h2>
          <p className="mt-3 text-white/90 text-sm sm:text-base max-w-xl mx-auto">
            Build your personalized day-by-day travel plan with real recommendations and transparent costs in less than a minute.
          </p>
          <div className="mt-8">
            <Link
              to="/builder"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-sm shadow-md transition-all active:scale-95"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
