import React from 'react';
import { Camera, Utensils, BedDouble, Navigation, Clock, MapPin, Edit3, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { formatINR } from '../utils/formatters';

export const ActivityCard = ({
  item,
  index,
  totalItems,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}) => {
  const getTypeConfig = (type) => {
    switch (type) {
      case 'dining':
        return {
          icon: Utensils,
          bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          label: 'Dining',
        };
      case 'stay':
        return {
          icon: BedDouble,
          bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          label: 'Stay',
        };
      case 'transport':
        return {
          icon: Navigation,
          bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
          label: 'Transport',
        };
      case 'attraction':
      default:
        return {
          icon: Camera,
          bg: 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/20',
          label: 'Attraction',
        };
    }
  };

  const config = getTypeConfig(item.type);
  const IconComponent = config.icon;

  return (
    <div className="group relative flex items-start gap-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm transition-all">
      {/* Icon badge */}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${config.bg}`}>
        <IconComponent className="w-6 h-6" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {item.time_slot}
          </span>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${config.bg}`}>
            {config.label}
          </span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {item.duration_min} min
          </span>
        </div>

        <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
          {item.title}
        </h4>

        {item.description && (
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
            {item.description}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate max-w-[200px]">{item.location || 'Central Area'}</span>
          </div>

          <div className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
            Est. {formatINR(item.cost || 0)}
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex flex-col items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity ml-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onMoveUp && onMoveUp(index)}
            disabled={index === 0}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-20 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Move earlier"
            aria-label="Move earlier"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => onMoveDown && onMoveDown(index)}
            disabled={index === totalItems - 1}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-20 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Move later"
            aria-label="Move later"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit && onEdit(item)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40"
            title="Edit Activity"
            aria-label="Edit Activity"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete && onDelete(item.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            title="Remove from day"
            aria-label="Remove Activity"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
