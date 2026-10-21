import React, { useState } from 'react';
import {
  Bus,
  Train,
  Car,
  Footprints,
  Bike,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Check,
  Zap,
  Tag,
  Info,
} from 'lucide-react';
import { RouteOption } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { RouteTimeline } from './RouteTimeline';

interface RouteCardProps {
  route: RouteOption;
  isSelected: boolean;
  onSelect: () => void;
  onSave?: (route: RouteOption) => void;
  isSaved?: boolean;
}

export const RouteCard: React.FC<RouteCardProps> = ({
  route,
  isSelected,
  onSelect,
  onSave,
  isSaved = false,
}) => {
  const { t } = useTranslation();
  const [showTimeline, setShowTimeline] = useState(isSelected);

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'transit_bus':
        return <Bus className="w-5 h-5 text-sky-600" />;
      case 'transit_metro':
      case 'transit_rail':
        return <Train className="w-5 h-5 text-tealbrand-600" />;
      case 'auto':
        return <Car className="w-5 h-5 text-amber-600" />;
      case 'cab':
        return <Car className="w-5 h-5 text-step-600" />;
      case 'bike':
        return <Bike className="w-5 h-5 text-orange-600" />;
      case 'walk':
        return <Footprints className="w-5 h-5 text-emerald-600" />;
      default:
        return <Bus className="w-5 h-5 text-step-600" />;
    }
  };

  const getBadgeClass = (badge?: string) => {
    if (badge === 'Recommended') return 'bg-step-600 text-white';
    if (badge === 'Lowest Cost') return 'bg-emerald-600 text-white';
    if (badge === 'Fastest') return 'bg-amber-500 text-white';
    return 'bg-slate-200 text-slate-700';
  };

  return (
    <div
      className={`card-3d p-4 sm:p-5 mb-4 transition-all border-2 ${
        isSelected
          ? 'border-step-500 ring-2 ring-step-200 bg-white'
          : 'border-slate-200 hover:border-slate-300 bg-white/90'
      }`}
    >
      {/* Top Header: Badge & Mode */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-slate-100 flex items-center justify-center">
            {getModeIcon(route.mode)}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-base font-bold text-slate-800 leading-tight">
                {route.title}
              </h4>
              {route.ranking_badge && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${getBadgeClass(route.ranking_badge)}`}>
                  {route.ranking_badge}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">{route.subtitle}</p>
          </div>
        </div>

        {/* Fare Pill */}
        <div className="text-right">
          <div className="text-base sm:text-lg font-black text-slate-900">
            {route.fare_label}
          </div>
          <span className="text-[10px] font-semibold text-slate-400 block">
            {route.is_fare_estimated ? 'Estimated Fare' : 'Exact Fare'}
          </span>
        </div>
      </div>

      {/* Metrics Row: Duration, Distance, Walking, Transfers */}
      <div className="grid grid-cols-4 gap-2 py-2.5 my-2 border-y border-slate-100 text-center text-xs">
        <div>
          <span className="text-[10px] font-semibold text-slate-400 block uppercase">Duration</span>
          <span className="font-bold text-slate-800">~{route.estimated_duration_min} min</span>
        </div>
        <div>
          <span className="text-[10px] font-semibold text-slate-400 block uppercase">Distance</span>
          <span className="font-bold text-slate-800">{route.distance_km} km</span>
        </div>
        <div>
          <span className="text-[10px] font-semibold text-slate-400 block uppercase">Walking</span>
          <span className="font-bold text-slate-800">{route.walking_distance_m} m</span>
        </div>
        <div>
          <span className="text-[10px] font-semibold text-slate-400 block uppercase">Transfers</span>
          <span className="font-bold text-slate-800">{route.transfers}</span>
        </div>
      </div>

      {/* Breakdown Note if available */}
      {route.fare_breakdown && (
        <div className="text-[11px] text-slate-500 mb-2 flex items-center space-x-1">
          <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{route.fare_breakdown}</span>
        </div>
      )}

      {/* Action Buttons: Select Route / Toggle Timeline / Save Trip */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onSelect}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isSelected
                ? 'bg-step-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {isSelected ? 'Active On Map' : 'Select Route'}
          </button>

          <button
            type="button"
            onClick={() => setShowTimeline(!showTimeline)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold transition-all"
          >
            <span>{showTimeline ? 'Hide Steps' : 'Step-by-Step Guide'}</span>
            {showTimeline ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {onSave && (
          <button
            type="button"
            onClick={() => onSave(route)}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
              isSaved
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
            title="Save this journey option"
          >
            {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Bookmark className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
          </button>
        )}
      </div>

      {/* Expandable Step-by-Step Timeline */}
      {showTimeline && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <RouteTimeline steps={route.steps} limitations={route.limitations} dataSource={route.data_source} />
        </div>
      )}
    </div>
  );
};
