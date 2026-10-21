import React, { useState, useEffect } from 'react';
import {
  Utensils,
  Coffee,
  Bath,
  Armchair,
  Bus,
  MapPin,
  Clock,
  ShieldCheck,
  Store,
  HelpCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { NearbyPlace } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { api } from '../services/api';

interface NearbyPlacesProps {
  destLat: number;
  destLon: number;
  originLat: number;
  originLon: number;
  destName: string;
  originName: string;
  onSelectPlaceOnMap?: (place: NearbyPlace) => void;
}

export const NearbyPlaces: React.FC<NearbyPlacesProps> = ({
  destLat,
  destLon,
  originLat,
  originLon,
  destName,
  originName,
  onSelectPlaceOnMap,
}) => {
  const { t } = useTranslation();

  const [searchTarget, setSearchTarget] = useState<'destination' | 'origin'>('destination');
  const [activeCategory, setActiveCategory] = useState<string>('breakfast');
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [limitationNote, setLimitationNote] = useState('');

  const currentLat = searchTarget === 'destination' ? destLat : originLat;
  const currentLon = searchTarget === 'destination' ? destLon : originLon;
  const currentTargetName = searchTarget === 'destination' ? destName : originName;

  const categories = [
    { key: 'breakfast', label: t('places.tabs.breakfast'), icon: <Coffee className="w-4 h-4" /> },
    { key: 'toilets', label: t('places.tabs.toilets'), icon: <Bath className="w-4 h-4" /> },
    { key: 'waiting_place', label: t('places.tabs.waiting_place'), icon: <Armchair className="w-4 h-4" /> },
    { key: 'restaurant', label: t('places.tabs.restaurant'), icon: <Utensils className="w-4 h-4" /> },
    { key: 'transit_stop', label: t('places.tabs.transit_stop'), icon: <Bus className="w-4 h-4" /> },
  ];

  const fetchPlaces = async () => {
    if (!currentLat || !currentLon) return;
    setIsLoading(true);
    try {
      const res = await api.getNearbyPlaces(currentLat, currentLon, activeCategory, 1800);
      setPlaces(res.places);
      setLimitationNote(res.limitation_note);
    } catch (err) {
      console.warn('Failed to load places:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, [currentLat, currentLon, activeCategory, searchTarget]);

  const getAccessBadge = (accessType: string) => {
    switch (accessType) {
      case 'verified_public':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <ShieldCheck className="w-3 h-3 mr-1" />
            Verified Public
          </span>
        );
      case 'commercial_customer_only':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Store className="w-3 h-3 mr-1" />
            Customer Access (Purchase Required)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <HelpCircle className="w-3 h-3 mr-1" />
            Unconfirmed Access
          </span>
        );
    }
  };

  return (
    <div className="card-3d p-5 sm:p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 tracking-tight">
            {t('places.title')}
          </h3>
          <p className="text-xs text-slate-500">
            Amenities near <span className="font-semibold text-slate-700">{currentTargetName.split(',')[0]}</span>
          </p>
        </div>

        {/* Location toggle: Destination vs Origin */}
        <div className="flex items-center bg-slate-100 rounded-xl p-1 text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setSearchTarget('destination')}
            className={`px-3 py-1 rounded-lg transition-all ${
              searchTarget === 'destination' ? 'bg-white text-step-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            Near Destination
          </button>
          <button
            onClick={() => setSearchTarget('origin')}
            className={`px-3 py-1 rounded-lg transition-all ${
              searchTarget === 'origin' ? 'bg-white text-step-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            Near Origin
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-none mb-4">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              activeCategory === cat.key
                ? 'bg-step-600 text-white border-step-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Places List */}
      {isLoading ? (
        <div className="py-8 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-step-500 mb-2" />
          <span className="text-xs">Querying OpenStreetMap Overpass amenities...</span>
        </div>
      ) : places.length === 0 ? (
        <div className="py-6 text-center text-slate-400 text-xs">
          No mapped facilities found within 1.8 km.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {places.map((place) => (
            <div
              key={place.id}
              className="p-3.5 rounded-xl border border-slate-200/90 hover:border-step-300 bg-slate-50/50 hover:bg-white transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
                    {place.name}
                  </h4>
                  <span className="text-[11px] font-bold text-step-700 shrink-0">
                    {place.distance_meters > 1000
                      ? `${(place.distance_meters / 1000).toFixed(1)} km`
                      : `${place.distance_meters} m`}
                  </span>
                </div>

                <div className="mb-2">{getAccessBadge(place.access_type)}</div>

                {place.cuisine && (
                  <p className="text-[11px] text-slate-600 mb-1">
                    🍲 <span className="font-semibold">{place.cuisine}</span>
                  </p>
                )}

                {place.opening_hours && (
                  <p className="text-[11px] text-slate-500 mb-1 flex items-center">
                    <Clock className="w-3 h-3 mr-1 text-slate-400" />
                    <span>{place.opening_hours}</span>
                  </p>
                )}

                <p className="text-[11px] text-slate-500 italic mt-1">
                  {place.confirmation_note}
                </p>
              </div>

              {onSelectPlaceOnMap && (
                <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => onSelectPlaceOnMap(place)}
                    className="flex items-center space-x-1 text-xs font-bold text-step-600 hover:text-step-700"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Focus on Map</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Honest Limitation Note */}
      {limitationNote && (
        <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
          * {limitationNote}
        </div>
      )}
    </div>
  );
};
