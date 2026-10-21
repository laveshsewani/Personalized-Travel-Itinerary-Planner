import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, Calendar, Wallet, MapPin, Plus, ArrowRight, Clock, Users, Sparkles } from 'lucide-react';
import { useTripStore } from '../store/tripStore';
import { useAuthStore } from '../store/authStore';
import { formatINR, formatDate } from '../utils/formatters';

export const DashboardPage = () => {
  const { trips, fetchTrips, loading } = useTripStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrips();
  }, []);

  const totalTrips = trips.length;
  const totalBudgetPlanned = trips.reduce((sum, t) => sum + (t.budget || 0), 0);
  const upcomingTrips = trips.filter((t) => new Date(t.start_date) >= new Date()).length;

  const popularDestinations = [
    { city: 'Jaipur', state: 'Rajasthan', img: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400&q=80', tag: 'Royal Heritage' },
    { city: 'Indore', state: 'Madhya Pradesh', img: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=400&q=80', tag: 'Food Capital' },
    { city: 'Goa', state: 'Goa', img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&q=80', tag: 'Coastal Bliss' },
    { city: 'Bhopal', state: 'Madhya Pradesh', img: 'https://images.unsplash.com/photo-1626014303757-656c12143fef?w=400&q=80', tag: 'City of Lakes' },
    { city: 'Varanasi', state: 'Uttar Pradesh', img: 'https://images.unsplash.com/photo-1561359313-0639aad49ca6?w=400&q=80', tag: 'Spiritual Heart' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Namaste, {user?.name || 'Traveler'}!
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Welcome to your personal Indian travel command center.
          </p>
        </div>

        <Link
          to="/builder"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-md transition-all self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Plan New Trip</span>
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0">
            <Compass className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Itineraries
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-0.5">
              {totalTrips}
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Upcoming Trips
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-0.5">
              {upcomingTrips}
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Wallet className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Planned Budget
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-0.5">
              {formatINR(totalBudgetPlanned)}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Trips Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Your Recent Trips</h2>
          <Link
            to="/trips"
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
          >
            <span>View all trips</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : trips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.slice(0, 3).map((trip) => (
              <div
                key={trip.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-brand-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
                      {trip.destination}
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      {trip.days?.length || 0} Days
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                    {trip.title}
                  </h3>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDate(trip.start_date)} - {formatDate(trip.end_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wallet className="w-3.5 h-3.5 text-slate-400" />
                      <span>Est. Budget: {formatINR(trip.budget)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-semibold capitalize text-slate-600 dark:text-slate-400">
                    {trip.travel_style || 'Balanced'} pace
                  </span>

                  <Link
                    to={`/trips/${trip.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700"
                  >
                    <span>View Itinerary</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3">
            <Compass className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No trips planned yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Start building your first bespoke Indian itinerary with tailored budget, dates, and AI suggestions.
            </p>
            <Link
              to="/builder"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 text-white text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Trip</span>
            </Link>
          </div>
        )}
      </div>

      {/* Popular Indian Destinations Carousel / Cards */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Explore Trending Indian Hubs
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {popularDestinations.map((d) => (
            <button
              key={d.city}
              type="button"
              onClick={() => {
                navigate(`/builder?destination=${d.city}`);
              }}
              className="group rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left hover:border-brand-500/50 transition-all shadow-sm flex flex-col"
            >
              <div className="h-28 overflow-hidden relative">
                <img
                  src={d.img}
                  alt={d.city}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/80 text-white backdrop-blur-sm">
                  {d.tag}
                </span>
              </div>
              <div className="p-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors">
                  {d.city}
                </h4>
                <p className="text-[11px] text-slate-400">{d.state}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
