import React, { useState } from 'react';
import {
  Clock,
  AlertTriangle,
  ShieldAlert,
  CalendarCheck,
  Coffee,
  CheckCircle,
  SlidersHorizontal,
  Info,
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { InterviewBufferSummary } from '../types';

interface InterviewPlannerProps {
  summary: InterviewBufferSummary;
  purpose: string;
  onBufferChange?: (newBufferMinutes: number) => void;
}

export const InterviewPlanner: React.FC<InterviewPlannerProps> = ({ summary, purpose, onBufferChange }) => {
  const { t } = useTranslation();
  const [currentBuffer, setCurrentBuffer] = useState(summary.safety_buffer_min);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setCurrentBuffer(val);
    if (onBufferChange) {
      onBufferChange(val);
    }
  };

  return (
    <div className="card-3d p-5 sm:p-6 mb-6 border-l-4 border-l-amber-500 bg-gradient-to-br from-white via-amber-50/20 to-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
              {purpose.charAt(0).toUpperCase() + purpose.slice(1)} Arrival & Departure Guard
            </h3>
            <p className="text-xs text-slate-500">
              Precise buffer calculation for guaranteed on-time arrival
            </p>
          </div>
        </div>
      </div>

      {/* 4-Stat Metric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {/* Required Arrival */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
            {t('planner.requiredArrival')}
          </span>
          <span className="text-base sm:text-lg font-black text-slate-800">
            {summary.required_arrival_time}
          </span>
        </div>

        {/* Travel Duration */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
            {t('planner.estimatedTravel')}
          </span>
          <span className="text-base sm:text-lg font-black text-step-700">
            ~{summary.estimated_journey_duration_min} mins
          </span>
        </div>

        {/* Safety Buffer */}
        <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200">
          <span className="text-[11px] font-bold text-amber-700 block uppercase tracking-wider">
            {t('planner.safetyBuffer')}
          </span>
          <span className="text-base sm:text-lg font-black text-amber-800">
            +{currentBuffer} mins
          </span>
        </div>

        {/* Suggested Departure Time */}
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300">
          <span className="text-[11px] font-bold text-emerald-700 block uppercase tracking-wider">
            {t('planner.suggestedDeparture')}
          </span>
          <span className="text-base sm:text-lg font-black text-emerald-800">
            {summary.suggested_departure_time}
          </span>
        </div>
      </div>

      {/* Buffer Breakdown Rationale */}
      <div className="p-3 rounded-xl bg-slate-100/70 border border-slate-200 text-xs text-slate-700 flex items-start space-x-2 mb-3">
        <Info className="w-4 h-4 text-step-600 mt-0.5 shrink-0" />
        <div>
          <span className="font-bold text-slate-800">Buffer Rationale: </span>
          {summary.buffer_rationale}
        </div>
      </div>

      {/* Peak Indian Traffic Alert if applicable */}
      {summary.traffic_peak_warning && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start space-x-2 mb-3">
          <ShieldAlert className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
          <div>
            <span className="font-bold">Indian Peak Traffic Warning: </span>
            {summary.traffic_peak_warning}
          </div>
        </div>
      )}

      {/* Buffer Slider */}
      <div className="mt-3 pt-3 border-t border-slate-200">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
          <span className="flex items-center">
            <SlidersHorizontal className="w-3.5 h-3.5 mr-1 text-slate-500" />
            Adjust Safety Buffer ({currentBuffer} mins)
          </span>
          <span className="text-[11px] text-slate-400">15 min - 75 min</span>
        </div>
        <input
          type="range"
          min="15"
          max="75"
          step="5"
          value={currentBuffer}
          onChange={handleSliderChange}
          className="w-full accent-step-600 cursor-pointer"
        />
      </div>

      {/* Honest Data Notice */}
      <div className="mt-2 text-[11px] text-slate-400 italic">
        {summary.data_limitation_warning}
      </div>
    </div>
  );
};
