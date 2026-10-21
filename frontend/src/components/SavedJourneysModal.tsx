import React from 'react';
import { Bookmark, X, Trash2, ArrowRight, Clock, MapPin, Bus, Train, Car } from 'lucide-react';
import { SavedJourney } from '../types';
import { useTranslation } from '../i18n/LanguageContext';

interface SavedJourneysModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedJourneys: SavedJourney[];
  onLoadJourney: (journey: SavedJourney) => void;
  onDeleteJourney: (id: number) => void;
}

export const SavedJourneysModal: React.FC<SavedJourneysModalProps> = ({
  isOpen,
  onClose,
  savedJourneys,
  onLoadJourney,
  onDeleteJourney,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[82vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <Bookmark className="w-5 h-5 text-step-600" />
            <h3 className="font-bold text-slate-800 text-base">{t('nav.savedTrips')}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
              {savedJourneys.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Journey Cards */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {savedJourneys.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Bookmark className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No saved journeys yet</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Generate a travel plan and click the "Save" icon on any route to bookmark it here for quick access.
              </p>
            </div>
          ) : (
            savedJourneys.map((j) => (
              <div
                key={j.id}
                className="p-4 rounded-xl border border-slate-200/90 hover:border-step-300 bg-white hover:bg-step-50/20 transition-all shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-step-100 text-step-700 uppercase">
                      {j.purpose}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(j.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-800 mb-1">
                    {j.title}
                  </h4>

                  <div className="text-xs text-slate-500 space-y-1 mb-2">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">From: {j.origin_name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate">To: {j.destination_name}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-xs font-bold text-slate-700 pt-1 border-t border-slate-100">
                    <span className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      Arrival: {j.arrival_time}
                    </span>
                    {j.suggested_departure_time && (
                      <span className="text-emerald-700">
                        Dep: {j.suggested_departure_time}
                      </span>
                    )}
                    {j.estimated_fare && (
                      <span className="text-step-700 ml-auto">
                        {j.estimated_fare}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100">
                  <button
                    onClick={() => onDeleteJourney(j.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete saved trip"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      onLoadJourney(j);
                      onClose();
                    }}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-step-600 hover:bg-step-700 text-white text-xs font-bold transition-all"
                  >
                    <span>Load Plan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
