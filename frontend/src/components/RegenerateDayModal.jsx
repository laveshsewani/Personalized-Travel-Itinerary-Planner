import React, { useState } from 'react';
import { X, Sparkles, RefreshCw } from 'lucide-react';

export const RegenerateDayModal = ({ isOpen, onClose, onRegenerate, dayNumber, dateStr }) => {
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleRegenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onRegenerate(dayNumber, instruction);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const sampleIdeas = [
    'Focus on local street food & evening market walks',
    'More relaxed afternoon with scenic lake sunset',
    'Include ancient temples & spiritual rituals',
    'Budget-friendly hidden gems and artisan workshops',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Regenerate Day {dayNumber}
              </h3>
              <p className="text-xs text-slate-500">{dateStr}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleRegenerate} className="mt-4 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Tell the AI planner what you'd like to adjust for this day, or leave blank to discover an alternate curated plan.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Custom Instruction / Tweak
            </label>
            <textarea
              rows={3}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              placeholder="e.g. Include vegetarian food stalls and an evening heritage stroll..."
            />
          </div>

          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Quick Suggestions:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {sampleIdeas.map((idea) => (
                <button
                  key={idea}
                  type="button"
                  onClick={() => setInstruction(idea)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-brand-950/40 hover:text-brand-600 dark:hover:text-brand-400 border border-slate-200 dark:border-slate-700 transition-colors text-left"
                >
                  {idea}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Regenerating...' : 'Regenerate Day'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
