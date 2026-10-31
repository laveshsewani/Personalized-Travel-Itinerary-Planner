import React from 'react';
import { BedDouble, Utensils, Camera, Navigation, Wallet } from 'lucide-react';
import { formatINR } from '../utils/formatters';

export const CategoryBreakdown = ({ budget = 0, breakdown = {}, totalEstimated = 0 }) => {
  const stay = breakdown.stay || 0;
  const food = breakdown.food || 0;
  const activities = breakdown.activities || 0;
  const transport = breakdown.transport || 0;

  const totalCalculated = (stay + food + activities + transport) || totalEstimated || 1;
  const stayPct = Math.round((stay / totalCalculated) * 100) || 35;
  const foodPct = Math.round((food / totalCalculated) * 100) || 25;
  const actPct = Math.round((activities / totalCalculated) * 100) || 25;
  const transPct = Math.round((transport / totalCalculated) * 100) || 15;

  const isUnderBudget = totalEstimated <= budget;

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Estimated Cost
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
            {formatINR(totalEstimated)}
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-medium text-slate-400">Budget Target</span>
          <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {formatINR(budget)}
          </div>
          <span
            className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full mt-1 ${
              isUnderBudget
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
            }`}
          >
            {isUnderBudget ? 'Within Budget' : 'Exceeds Target'}
          </span>
        </div>
      </div>

      {/* Multi-segment Progress Bar */}
      <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 flex overflow-hidden">
        <div style={{ width: `${stayPct}%` }} className="bg-emerald-500 h-full" title={`Stay: ${stayPct}%`} />
        <div style={{ width: `${foodPct}%` }} className="bg-amber-500 h-full" title={`Food: ${foodPct}%`} />
        <div style={{ width: `${actPct}%` }} className="bg-brand-500 h-full" title={`Activities: ${actPct}%`} />
        <div style={{ width: `${transPct}%` }} className="bg-indigo-500 h-full" title={`Transport: ${transPct}%`} />
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
            <BedDouble className="w-3.5 h-3.5" />
            <span>Stay ({stayPct}%)</span>
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {formatINR(stay)}
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">
            <Utensils className="w-3.5 h-3.5" />
            <span>Food ({foodPct}%)</span>
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {formatINR(food)}
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 mb-1">
            <Camera className="w-3.5 h-3.5" />
            <span>Activities ({actPct}%)</span>
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {formatINR(activities)}
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
            <Navigation className="w-3.5 h-3.5" />
            <span>Transit ({transPct}%)</span>
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {formatINR(transport)}
          </div>
        </div>
      </div>
    </div>
  );
};
