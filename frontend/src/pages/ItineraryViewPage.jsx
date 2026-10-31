import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Compass, Calendar, Wallet, Users, Share2, Printer, Plus, Sparkles, RefreshCw, MapPin, AlertCircle, ArrowLeft } from 'lucide-react';
import { useTripStore } from '../store/tripStore';
import { LeafletMap } from '../components/LeafletMap';
import { ActivityCard } from '../components/ActivityCard';
import { CategoryBreakdown } from '../components/CategoryBreakdown';
import { EditItemModal } from '../components/EditItemModal';
import { RegenerateDayModal } from '../components/RegenerateDayModal';
import { ShareTripModal } from '../components/ShareTripModal';
import { formatINR, formatDate } from '../utils/formatters';

export const ItineraryViewPage = () => {
  const { id } = useParams();
  const {
    currentTrip,
    fetchTripById,
    loading,
    updateItem,
    deleteItem,
    addItem,
    reorderItems,
    regenerateDay,
  } = useTripStore();

  const [activeDayNumber, setActiveDayNumber] = useState(1);
  const [editingItem, setEditingItem] = useState(null);
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTripById(id);
    }
  }, [id]);

  if (loading && !currentTrip) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-brand-500 border-t-transparent animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-500">Loading your tailored itinerary...</p>
      </div>
    );
  }

  if (!currentTrip) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Trip Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested trip may have been removed or you don't have access.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 text-white font-semibold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    );
  }

  const days = currentTrip.days || [];
  const activeDay = days.find((d) => d.day_number === activeDayNumber) || days[0];
  const activeItems = activeDay?.items || [];

  // Calculate day total
  const dayEstimatedTotal = activeItems.reduce((acc, itm) => acc + (itm.cost || 0), 0);
  const tripTotalEstimated = days.reduce(
    (acc, d) => acc + (d.items || []).reduce((sum, i) => sum + (i.cost || 0), 0),
    0
  );

  // Handle reorder
  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newItems = [...activeItems];
    const temp = newItems[index - 1];
    newItems[index - 1] = newItems[index];
    newItems[index] = temp;
    reorderItems(
      currentTrip.id,
      activeDay.day_number,
      newItems.map((i) => i.id)
    );
  };

  const handleMoveDown = (index) => {
    if (index === activeItems.length - 1) return;
    const newItems = [...activeItems];
    const temp = newItems[index + 1];
    newItems[index + 1] = newItems[index];
    newItems[index] = temp;
    reorderItems(
      currentTrip.id,
      activeDay.day_number,
      newItems.map((i) => i.id)
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>{currentTrip.destination}</span>
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {days.length} Days
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>{currentTrip.group_size} Traveler{currentTrip.group_size > 1 ? 's' : ''}</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
            {currentTrip.title}
          </h1>

          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(currentTrip.start_date)} - {formatDate(currentTrip.end_date)}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print / PDF</span>
          </button>

          <Link
            to="/builder"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Trip</span>
          </Link>
        </div>
      </div>

      {/* Notice badge if mock generator used */}
      {currentTrip.llm_provider_used === 'mock' && (
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              Generated using our offline rule engine (LLM_API_KEY is unset). For live Llama-3 AI generation, add your Groq/Together key to <code>backend/.env</code>.
            </span>
          </div>
        </div>
      )}

      {/* Financial & Category Tracker */}
      <CategoryBreakdown
        budget={currentTrip.budget}
        breakdown={currentTrip.cost_breakdown || {}}
        totalEstimated={tripTotalEstimated || currentTrip.total_estimated_cost}
      />

      {/* Day Tabs */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {days.map((day) => {
            const isActive = day.day_number === activeDay?.day_number;
            return (
              <button
                key={day.day_number}
                onClick={() => setActiveDayNumber(day.day_number)}
                className={`px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>Day {day.day_number}</span>
                <span className="text-[11px] font-normal opacity-70 ml-2">
                  {formatDate(day.date)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Day Header & Controls */}
        {activeDay && (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Day {activeDay.day_number} Focus
              </span>
              <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                {activeDay.summary || `Activities in ${currentTrip.destination}`}
              </h3>
              <span className="text-xs text-slate-500 mt-1 block">
                Estimated Day Cost: <strong className="text-emerald-600 dark:text-emerald-400">{formatINR(dayEstimatedTotal)}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsRegenerateModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-brand-500 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-sm transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-brand-500" />
                <span>Regenerate this Day</span>
              </button>

              <button
                onClick={() => setIsNewItemModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Activity</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Split Grid: Left = Timeline, Right = Leaflet Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Timeline Activities Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Schedule & Stops ({activeItems.length})
            </span>
            <span className="text-[11px] text-slate-400">Use arrows to reorder stops</span>
          </div>

          {activeItems.length > 0 ? (
            activeItems.map((item, idx) => (
              <ActivityCard
                key={item.id || idx}
                item={item}
                index={idx}
                totalItems={activeItems.length}
                onEdit={(itm) => setEditingItem(itm)}
                onDelete={(itemId) => deleteItem(currentTrip.id, itemId)}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
              />
            ))
          ) : (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
              <p className="text-xs text-slate-500">No activities on this day yet.</p>
              <button
                onClick={() => setIsNewItemModalOpen(true)}
                className="text-xs font-bold text-brand-600 hover:underline"
              >
                + Add your first activity
              </button>
            </div>
          )}
        </div>

        {/* Leaflet Map Column */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand-500" />
              <span>Day {activeDay?.day_number} Map Overview</span>
            </span>
            <span className="text-[10px] text-slate-400">OpenStreetMap</span>
          </div>

          <div className="h-[420px] w-full">
            <LeafletMap items={activeItems} />
          </div>

          <p className="text-[11px] text-slate-400 text-center">
            Numbered pins correlate to stops in today's itinerary. Click any pin for details.
          </p>
        </div>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <EditItemModal
          isOpen={Boolean(editingItem)}
          onClose={() => setEditingItem(null)}
          initialData={editingItem}
          isNew={false}
          onSave={(updatedFields) => {
            updateItem(currentTrip.id, activeDay.id, editingItem.id, updatedFields);
            setEditingItem(null);
          }}
        />
      )}

      {/* Add Item Modal */}
      {isNewItemModalOpen && (
        <EditItemModal
          isOpen={isNewItemModalOpen}
          onClose={() => setIsNewItemModalOpen(false)}
          isNew={true}
          onSave={(itemData) => {
            addItem(currentTrip.id, activeDay.day_number, itemData);
            setIsNewItemModalOpen(false);
          }}
        />
      )}

      {/* Regenerate Day Modal */}
      {isRegenerateModalOpen && (
        <RegenerateDayModal
          isOpen={isRegenerateModalOpen}
          onClose={() => setIsRegenerateModalOpen(false)}
          dayNumber={activeDay.day_number}
          dateStr={formatDate(activeDay.date)}
          onRegenerate={(dayNum, customPrompt) =>
            regenerateDay(currentTrip.id, dayNum, customPrompt)
          }
        />
      )}

      {/* Share Modal */}
      {isShareModalOpen && (
        <ShareTripModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          trip={currentTrip}
        />
      )}
    </div>
  );
};
