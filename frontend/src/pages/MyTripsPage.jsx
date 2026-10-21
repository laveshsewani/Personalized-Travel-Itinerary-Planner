import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Search, Calendar, Wallet, Trash2, ArrowRight, Plus, MapPin, Share2 } from 'lucide-react';
import { useTripStore } from '../store/tripStore';
import { formatINR, formatDate } from '../utils/formatters';
import { ShareTripModal } from '../components/ShareTripModal';

export const MyTripsPage = () => {
  const { trips, fetchTrips, deleteTrip, loading } = useTripStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sharingTrip, setSharingTrip] = useState(null);

  useEffect(() => {
    fetchTrips();
  }, []);

  const filteredTrips = trips.filter((t) => {
    const matchesSearch =
      t.destination.toLowerCase().includes(search.toLowerCase()) ||
      t.title.toLowerCase().includes(search.toLowerCase());
    if (filter === 'all') return matchesSearch;
    return matchesSearch && (t.status || 'planned') === filter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            My Travel Itineraries
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage, edit, export, or share all your customized trips across India.
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

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by city, title, or state..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto overflow-x-auto pb-1">
          {['all', 'planned', 'active', 'completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all border ${
                filter === tab
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Trips Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-60 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filteredTrips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map((trip) => (
            <div
              key={trip.id}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-brand-500/40 transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{trip.destination}</span>
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 capitalize">
                    {trip.status || 'planned'}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2">
                  {trip.title}
                </h3>

                <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatDate(trip.start_date)} - {formatDate(trip.end_date)} ({trip.days?.length || 0} Days)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wallet className="w-3.5 h-3.5 text-slate-400" />
                    <span>Est. Budget: <strong className="text-emerald-600 dark:text-emerald-400">{formatINR(trip.budget)}</strong></span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSharingTrip(trip)}
                    className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Share trip"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete ${trip.title}?`)) {
                        deleteTrip(trip.id);
                      }
                    }}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title="Delete trip"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <Link
                  to={`/trips/${trip.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-brand-500 dark:hover:bg-brand-400 hover:text-white dark:hover:text-slate-900 text-xs font-bold transition-all shadow-sm active:scale-95"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-4">
          <Compass className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {search ? 'No matching trips found' : 'No trips saved yet'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search ? 'Try clearing your search query or filters.' : 'Use our Smart Trip Builder to design your first custom Indian travel itinerary.'}
          </p>
          <Link
            to="/builder"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-500 text-white text-xs font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Trip</span>
          </Link>
        </div>
      )}

      {/* Share Modal */}
      {sharingTrip && (
        <ShareTripModal
          isOpen={Boolean(sharingTrip)}
          onClose={() => setSharingTrip(null)}
          trip={sharingTrip}
        />
      )}
    </div>
  );
};
