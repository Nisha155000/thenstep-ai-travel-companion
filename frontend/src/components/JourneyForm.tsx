import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Navigation,
  Clock,
  Briefcase,
  Wallet,
  Sliders,
  Utensils,
  Bath,
  Armchair,
  ArrowUpDown,
  Search,
  Sparkles,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { LocationPoint, JourneyPlanRequest } from '../types';
import { api } from '../services/api';

interface JourneyFormProps {
  onSubmit: (req: JourneyPlanRequest) => void;
  isLoading: boolean;
  initialValues?: Partial<JourneyPlanRequest>;
}

const QUICK_HUBS = [
  { name: 'Majestic, Bengaluru', lat: 12.9781, lon: 77.5696 },
  { name: 'Sarjapur Road, Bengaluru', lat: 12.9081, lon: 77.6974 },
  { name: 'Whitefield ITPL, Bengaluru', lat: 12.9866, lon: 77.7381 },
  { name: 'NDLS New Delhi', lat: 28.6431, lon: 77.2197 },
  { name: 'Cyber City, Gurugram', lat: 28.4950, lon: 77.0895 },
  { name: 'CSMT Mumbai', lat: 18.9401, lon: 72.8354 },
  { name: 'BKC, Mumbai', lat: 19.0664, lon: 72.8687 },
  { name: 'Secunderabad / HITEC City', lat: 17.4504, lon: 78.3808 },
];

export const JourneyForm: React.FC<JourneyFormProps> = ({ onSubmit, isLoading, initialValues }) => {
  const { t } = useTranslation();

  // Form States
  const [originText, setOriginText] = useState(initialValues?.origin_name || 'KSR Bengaluru (Majestic)');
  const [originPoint, setOriginPoint] = useState<LocationPoint | null>({
    name: 'KSR Bengaluru (Majestic)',
    lat: 12.9781,
    lon: 77.5696,
  });

  const [destText, setDestText] = useState(initialValues?.destination_name || 'Sarjapur Road (RGA Tech Park)');
  const [destPoint, setDestPoint] = useState<LocationPoint | null>({
    name: 'Sarjapur Road (RGA Tech Park)',
    lat: 12.9081,
    lon: 77.6974,
  });

  const [purpose, setPurpose] = useState(initialValues?.purpose || 'interview');
  const [arrivalTime, setArrivalTime] = useState(initialValues?.arrival_time || '10:00 AM');
  const [budgetLevel, setBudgetLevel] = useState(initialValues?.budget_level || 'low');
  const [priority, setPriority] = useState(initialValues?.priority || 'lowest_cost');
  const [needsBreakfast, setNeedsBreakfast] = useState(initialValues?.needs_breakfast ?? true);
  const [needsFreshenUp, setNeedsFreshenUp] = useState(initialValues?.needs_freshen_up ?? true);
  const [needsWaiting, setNeedsWaiting] = useState(initialValues?.needs_waiting_place ?? false);

  // Auto-complete suggestion state
  const [originSuggestions, setOriginSuggestions] = useState<LocationPoint[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<LocationPoint[]>([]);
  const [isSearchingOrigin, setIsSearchingOrigin] = useState(false);
  const [isSearchingDest, setIsSearchingDest] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'origin' | 'dest' | null>(null);

  // Sync when initialValues change from AI Assistant or Saved Journeys
  useEffect(() => {
    if (initialValues) {
      if (initialValues.origin_name) setOriginText(initialValues.origin_name);
      if (initialValues.origin_lat && initialValues.origin_lon) {
        setOriginPoint({
          name: initialValues.origin_name || '',
          lat: initialValues.origin_lat,
          lon: initialValues.origin_lon,
        });
      }
      if (initialValues.destination_name) setDestText(initialValues.destination_name);
      if (initialValues.destination_lat && initialValues.destination_lon) {
        setDestPoint({
          name: initialValues.destination_name || '',
          lat: initialValues.destination_lat,
          lon: initialValues.destination_lon,
        });
      }
      if (initialValues.purpose) setPurpose(initialValues.purpose);
      if (initialValues.arrival_time) setArrivalTime(initialValues.arrival_time);
      if (initialValues.budget_level) setBudgetLevel(initialValues.budget_level);
      if (initialValues.priority) setPriority(initialValues.priority);
      if (initialValues.needs_breakfast !== undefined) setNeedsBreakfast(initialValues.needs_breakfast);
      if (initialValues.needs_freshen_up !== undefined) setNeedsFreshenUp(initialValues.needs_freshen_up);
      if (initialValues.needs_waiting_place !== undefined) setNeedsWaiting(initialValues.needs_waiting_place);
    }
  }, [initialValues]);

  // Debounced search for Origin
  useEffect(() => {
    if (!originText || originText.length < 2 || (originPoint && originPoint.name === originText)) {
      setOriginSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingOrigin(true);
      const res = await api.searchLocations(originText);
      setOriginSuggestions(res);
      setIsSearchingOrigin(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [originText, originPoint]);

  // Debounced search for Destination
  useEffect(() => {
    if (!destText || destText.length < 2 || (destPoint && destPoint.name === destText)) {
      setDestSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingDest(true);
      const res = await api.searchLocations(destText);
      setDestSuggestions(res);
      setIsSearchingDest(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [destText, destPoint]);

  const handleSwap = () => {
    const tempText = originText;
    const tempPoint = originPoint;
    setOriginText(destText);
    setOriginPoint(destPoint);
    setDestText(tempText);
    setDestPoint(tempPoint);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!originPoint || !destPoint) {
      alert('Please select both starting point and destination from the suggestions or popular hubs.');
      return;
    }

    const payload: JourneyPlanRequest = {
      origin_name: originPoint.name,
      origin_lat: originPoint.lat,
      origin_lon: originPoint.lon,
      destination_name: destPoint.name,
      destination_lat: destPoint.lat,
      destination_lon: destPoint.lon,
      purpose,
      arrival_time: arrivalTime,
      budget_level: budgetLevel,
      priority,
      needs_breakfast: needsBreakfast,
      needs_freshen_up: needsFreshenUp,
      needs_waiting_place: needsWaiting,
    };

    onSubmit(payload);
  };

  return (
    <div className="card-3d p-5 sm:p-6 mb-6">
      <div className="mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
          {t('form.title')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {t('form.subtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Origin & Destination with Swap Button */}
        <div className="relative space-y-3">
          {/* Origin Input */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 mr-1" />
              {t('form.originLabel')}
            </label>
            <div className="relative">
              <input
                type="text"
                value={originText}
                onChange={(e) => {
                  setOriginText(e.target.value);
                  setOriginPoint(null);
                  setActiveDropdown('origin');
                }}
                onFocus={() => setActiveDropdown('origin')}
                placeholder={t('form.originPlaceholder')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-step-500 focus:ring-2 focus:ring-step-200 text-sm font-medium transition-all pr-9 bg-slate-50/50"
                required
              />
              <div className="absolute right-3 top-3 text-slate-400">
                {isSearchingOrigin ? <Loader2 className="w-4 h-4 animate-spin text-step-500" /> : <Navigation className="w-4 h-4" />}
              </div>
            </div>

            {/* Suggestions Dropdown */}
            {activeDropdown === 'origin' && originSuggestions.length > 0 && (
              <div className="absolute z-30 mt-1 w-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto">
                {originSuggestions.map((pt, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setOriginText(pt.name);
                      setOriginPoint(pt);
                      setActiveDropdown(null);
                    }}
                    className="p-2.5 hover:bg-step-50 cursor-pointer text-xs transition-colors flex items-start space-x-2"
                  >
                    <MapPin className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-800">{pt.name}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-sm">{pt.display_name}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Swap Button */}
          <div className="absolute right-3 top-[38px] z-10">
            <button
              type="button"
              onClick={handleSwap}
              className="p-1.5 rounded-full bg-white hover:bg-slate-100 border border-slate-300 shadow-xs text-slate-600 hover:text-step-600 transition-transform active:rotate-180"
              title="Swap Start & Destination"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Destination Input */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center">
              <MapPin className="w-3.5 h-3.5 text-rose-500 mr-1" />
              {t('form.destinationLabel')}
            </label>
            <div className="relative">
              <input
                type="text"
                value={destText}
                onChange={(e) => {
                  setDestText(e.target.value);
                  setDestPoint(null);
                  setActiveDropdown('dest');
                }}
                onFocus={() => setActiveDropdown('dest')}
                placeholder={t('form.destinationPlaceholder')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-step-500 focus:ring-2 focus:ring-step-200 text-sm font-medium transition-all pr-9 bg-slate-50/50"
                required
              />
              <div className="absolute right-3 top-3 text-slate-400">
                {isSearchingDest ? <Loader2 className="w-4 h-4 animate-spin text-step-500" /> : <Search className="w-4 h-4" />}
              </div>
            </div>

            {/* Suggestions Dropdown */}
            {activeDropdown === 'dest' && destSuggestions.length > 0 && (
              <div className="absolute z-30 mt-1 w-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto">
                {destSuggestions.map((pt, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setDestText(pt.name);
                      setDestPoint(pt);
                      setActiveDropdown(null);
                    }}
                    className="p-2.5 hover:bg-step-50 cursor-pointer text-xs transition-colors flex items-start space-x-2"
                  >
                    <MapPin className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-800">{pt.name}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-sm">{pt.display_name}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Hub Chips */}
        <div>
          <span className="text-[11px] font-semibold text-slate-500 mr-2">Popular Hubs:</span>
          <div className="inline-flex flex-wrap gap-1.5 mt-1">
            {QUICK_HUBS.slice(0, 4).map((hub, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setDestText(hub.name);
                  setDestPoint(hub);
                }}
                className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-step-100 hover:text-step-700 text-slate-600 transition-colors border border-slate-200"
              >
                + {hub.name.split(',')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Purpose, Arrival Time & Budget Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Journey Purpose */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center">
              <Briefcase className="w-3.5 h-3.5 text-step-600 mr-1" />
              {t('form.purposeLabel')}
            </label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-step-200"
            >
              <option value="interview">{t('form.purposes.interview')}</option>
              <option value="exam">{t('form.purposes.exam')}</option>
              <option value="appointment">{t('form.purposes.appointment')}</option>
              <option value="work">{t('form.purposes.work')}</option>
              <option value="other">{t('form.purposes.other')}</option>
            </select>
          </div>

          {/* Arrival Deadline Time */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center">
              <Clock className="w-3.5 h-3.5 text-amber-600 mr-1" />
              {t('form.arrivalTimeLabel')}
            </label>
            <input
              type="text"
              value={arrivalTime}
              onChange={(e) => setArrivalTime(e.target.value)}
              placeholder="10:00 AM"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-step-200"
              required
            />
          </div>

          {/* Budget */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center">
              <Wallet className="w-3.5 h-3.5 text-emerald-600 mr-1" />
              {t('form.budgetLabel')}
            </label>
            <select
              value={budgetLevel}
              onChange={(e) => setBudgetLevel(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-step-200"
            >
              <option value="low">{t('form.budgets.low')}</option>
              <option value="moderate">{t('form.budgets.moderate')}</option>
              <option value="flexible">{t('form.budgets.flexible')}</option>
            </select>
          </div>
        </div>

        {/* Priority & Special Facilities */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Priority */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center">
              <Sliders className="w-3.5 h-3.5 text-accentpurple-500 mr-1" />
              {t('form.priorityLabel')}
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-step-200"
            >
              <option value="lowest_cost">{t('form.priorities.lowest_cost')}</option>
              <option value="shortest_time">{t('form.priorities.shortest_time')}</option>
              <option value="less_walking">{t('form.priorities.less_walking')}</option>
              <option value="fewer_transfers">{t('form.priorities.fewer_transfers')}</option>
            </select>
          </div>

          {/* Checkboxes: Facilities */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              {t('form.facilitiesNeeded')}
            </label>
            <div className="flex flex-wrap gap-2 pt-0.5">
              <label className={`cursor-pointer px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center space-x-1.5 transition-all ${
                needsBreakfast ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <input
                  type="checkbox"
                  checked={needsBreakfast}
                  onChange={(e) => setNeedsBreakfast(e.target.checked)}
                  className="sr-only"
                />
                <Utensils className="w-3.5 h-3.5 text-amber-600" />
                <span>Breakfast / Tiffin</span>
              </label>

              <label className={`cursor-pointer px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center space-x-1.5 transition-all ${
                needsFreshenUp ? 'bg-sky-50 border-sky-300 text-sky-800' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <input
                  type="checkbox"
                  checked={needsFreshenUp}
                  onChange={(e) => setNeedsFreshenUp(e.target.checked)}
                  className="sr-only"
                />
                <Bath className="w-3.5 h-3.5 text-sky-600" />
                <span>Washroom</span>
              </label>

              <label className={`cursor-pointer px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center space-x-1.5 transition-all ${
                needsWaiting ? 'bg-purple-50 border-purple-300 text-purple-800' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <input
                  type="checkbox"
                  checked={needsWaiting}
                  onChange={(e) => setNeedsWaiting(e.target.checked)}
                  className="sr-only"
                />
                <Armchair className="w-3.5 h-3.5 text-purple-600" />
                <span>Waiting Spot</span>
              </label>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-step-600 via-step-500 to-tealbrand-500 text-white font-bold text-sm sm:text-base btn-3d flex items-center justify-center space-x-2 disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Planning verified route across India...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>{t('form.btnGenerate')}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
