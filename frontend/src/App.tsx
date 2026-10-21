import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  MapPin,
  Route as RouteIcon,
  Coffee,
  CalendarCheck,
  AlertTriangle,
  RefreshCw,
  Sun,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { JourneyForm } from './components/JourneyForm';
import { InterviewPlanner } from './components/InterviewPlanner';
import { RouteCard } from './components/RouteCard';
import { NearbyPlaces } from './components/NearbyPlaces';
import { InteractiveMap } from './components/InteractiveMap';
import { AIAssistantModal } from './components/AIAssistantModal';
import { SavedJourneysModal } from './components/SavedJourneysModal';
import { JourneyPlanRequest, JourneyPlanResponse, RouteOption, SavedJourney, NearbyPlace } from './types';
import { api } from './services/api';
import { useTranslation } from './i18n/LanguageContext';

export const AppContent: React.FC = () => {
  const { t } = useTranslation();

  // Active Journey Plan
  const [currentPlan, setCurrentPlan] = useState<JourneyPlanResponse | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Origin & Destination
  const [origin, setOrigin] = useState({
    name: 'KSR Bengaluru (Majestic)',
    lat: 12.9781,
    lon: 77.5696,
  });
  const [destination, setDestination] = useState({
    name: 'Sarjapur Road (RGA Tech Park)',
    lat: 12.9081,
    lon: 77.6974,
  });

  // Current Form Inputs for AI Assistant syncing
  const [formInputs, setFormInputs] = useState<Partial<JourneyPlanRequest>>({
    origin_name: 'KSR Bengaluru (Majestic)',
    origin_lat: 12.9781,
    origin_lon: 77.5696,
    destination_name: 'Sarjapur Road (RGA Tech Park)',
    destination_lat: 12.9081,
    destination_lon: 77.6974,
    purpose: 'interview',
    arrival_time: '10:00 AM',
    budget_level: 'low',
    priority: 'lowest_cost',
    needs_breakfast: true,
    needs_freshen_up: true,
  });

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'routes' | 'places'>('routes');

  // Modals
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isSavedOpen, setIsSavedOpen] = useState(false);
  const [savedJourneys, setSavedJourneys] = useState<SavedJourney[]>([]);
  const [savedSuccessAlert, setSavedSuccessAlert] = useState(false);

  // Map focused place
  const [focusedPlace, setFocusedPlace] = useState<NearbyPlace | null>(null);

  // Load Saved Journeys on Mount
  const loadSavedJourneys = async () => {
    try {
      const data = await api.getSavedJourneys();
      setSavedJourneys(data);
    } catch {
      // Fallback to localStorage if backend DB is not yet populated
      const local = localStorage.getItem('thenstep_saved_trips');
      if (local) setSavedJourneys(JSON.parse(local));
    }
  };

  useEffect(() => {
    loadSavedJourneys();
  }, []);

  // Execute initial journey plan on mount (Inspiring Bengaluru interview benchmark)
  useEffect(() => {
    handlePlanJourney({
      origin_name: origin.name,
      origin_lat: origin.lat,
      origin_lon: origin.lon,
      destination_name: destination.name,
      destination_lat: destination.lat,
      destination_lon: destination.lon,
      purpose: 'interview',
      arrival_time: '10:00 AM',
      budget_level: 'low',
      priority: 'lowest_cost',
      needs_breakfast: true,
      needs_freshen_up: true,
      needs_waiting_place: false,
    });
  }, []);

  const handlePlanJourney = async (req: JourneyPlanRequest) => {
    setIsLoading(true);
    setErrorMessage(null);
    setFocusedPlace(null);

    setOrigin({ name: req.origin_name, lat: req.origin_lat, lon: req.origin_lon });
    setDestination({ name: req.destination_name, lat: req.destination_lat, lon: req.destination_lon });
    setFormInputs(req);

    try {
      const plan = await api.planJourney(req);
      setCurrentPlan(plan);
      setSelectedRoute(plan.selected_route);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to calculate journey plan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Adjust safety buffer dynamically from InterviewPlanner slider
  const handleBufferAdjustment = (newBufferMinutes: number) => {
    if (!currentPlan) return;
    // Recalculate with updated custom buffer
    handlePlanJourney({
      origin_name: origin.name,
      origin_lat: origin.lat,
      origin_lon: origin.lon,
      destination_name: destination.name,
      destination_lat: destination.lat,
      destination_lon: destination.lon,
      purpose: currentPlan.purpose,
      arrival_time: currentPlan.arrival_calculator.required_arrival_time,
      budget_level: formInputs.budget_level || 'moderate',
      priority: formInputs.priority || 'lowest_cost',
      custom_buffer_minutes: newBufferMinutes,
      needs_breakfast: formInputs.needs_breakfast || false,
      needs_freshen_up: formInputs.needs_freshen_up || false,
      needs_waiting_place: formInputs.needs_waiting_place || false,
    });
  };

  // Save journey to database and localStorage
  const handleSaveRoute = async (route: RouteOption) => {
    if (!currentPlan) return;
    const journeyData = {
      title: `${origin.name.split(',')[0]} to ${destination.name.split(',')[0]} (${route.title})`,
      origin_name: origin.name,
      origin_lat: origin.lat,
      origin_lon: origin.lon,
      destination_name: destination.name,
      destination_lat: destination.lat,
      destination_lon: destination.lon,
      purpose: currentPlan.purpose,
      arrival_time: currentPlan.arrival_calculator.required_arrival_time,
      suggested_departure_time: currentPlan.arrival_calculator.suggested_departure_time,
      buffer_minutes: currentPlan.arrival_calculator.safety_buffer_min,
      selected_mode: route.mode,
      estimated_duration_min: route.estimated_duration_min,
      estimated_fare: route.fare_label,
      itinerary_data: {
        route,
        plan_id: currentPlan.plan_id,
        disclaimer: currentPlan.honest_disclaimer,
      },
    };

    try {
      const saved = await api.saveJourney(journeyData);
      setSavedJourneys((prev) => [saved, ...prev]);
    } catch {
      // Local fallback
      const localItem: SavedJourney = {
        id: Date.now(),
        ...journeyData,
        created_at: new Date().toISOString(),
      };
      const updated = [localItem, ...savedJourneys];
      setSavedJourneys(updated);
      localStorage.setItem('thenstep_saved_trips', JSON.stringify(updated));
    }

    setSavedSuccessAlert(true);
    setTimeout(() => setSavedSuccessAlert(false), 3000);
  };

  const handleDeleteJourney = async (id: number) => {
    try {
      await api.deleteJourney(id);
    } catch {
      // Local removal
    }
    const updated = savedJourneys.filter((j) => j.id !== id);
    setSavedJourneys(updated);
    localStorage.setItem('thenstep_saved_trips', JSON.stringify(updated));
  };

  const handleLoadSavedJourney = (saved: SavedJourney) => {
    handlePlanJourney({
      origin_name: saved.origin_name,
      origin_lat: saved.origin_lat,
      origin_lon: saved.origin_lon,
      destination_name: saved.destination_name,
      destination_lat: saved.destination_lat,
      destination_lon: saved.destination_lon,
      purpose: saved.purpose,
      arrival_time: saved.arrival_time,
      budget_level: 'moderate',
      priority: 'lowest_cost',
      needs_breakfast: true,
      needs_freshen_up: true,
      needs_waiting_place: false,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-step-200">
      {/* Navbar */}
      <Navbar
        onOpenAssistant={() => setIsAssistantOpen(true)}
        onOpenSaved={() => setIsSavedOpen(true)}
        savedCount={savedJourneys.length}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Saved Alert Toast */}
        {savedSuccessAlert && (
          <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center space-x-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle className="w-5 h-5 text-white" />
            <span className="text-sm font-bold">{t('routes.tripSaved')}</span>
          </div>
        )}

        {/* Global Error Banner if any */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => handlePlanJourney(formInputs as JourneyPlanRequest)}
              className="ml-4 font-bold text-rose-700 underline hover:text-rose-900"
            >
              Retry
            </button>
          </div>
        )}

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form, Buffer Calculator, Routes, Nearby Places (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Journey Input Form */}
            <JourneyForm
              onSubmit={handlePlanJourney}
              isLoading={isLoading}
              initialValues={formInputs}
            />

            {/* Interview Buffer Planner */}
            {currentPlan && (
              <InterviewPlanner
                summary={currentPlan.arrival_calculator}
                purpose={currentPlan.purpose}
                onBufferChange={handleBufferAdjustment}
              />
            )}

            {/* View Switcher Tabs: Routes vs Nearby Places */}
            {currentPlan && (
              <div className="flex border-b border-slate-200 mb-2">
                <button
                  onClick={() => setActiveTab('routes')}
                  className={`flex items-center space-x-2 py-3 px-4 font-bold text-sm border-b-2 transition-all ${
                    activeTab === 'routes'
                      ? 'border-step-600 text-step-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <RouteIcon className="w-4 h-4" />
                  <span>{t('routes.title')} ({currentPlan.ranked_routes.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('places')}
                  className={`flex items-center space-x-2 py-3 px-4 font-bold text-sm border-b-2 transition-all ${
                    activeTab === 'places'
                      ? 'border-step-600 text-step-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Coffee className="w-4 h-4" />
                  <span>Nearby Facilities (Tiffin & Washrooms)</span>
                </button>
              </div>
            )}

            {/* Active Tab 1: Route Options Comparison */}
            {activeTab === 'routes' && currentPlan && (
              <div className="space-y-4">
                {currentPlan.ranked_routes.map((route) => (
                  <RouteCard
                    key={route.id}
                    route={route}
                    isSelected={selectedRoute?.id === route.id}
                    onSelect={() => setSelectedRoute(route)}
                    onSave={handleSaveRoute}
                    isSaved={savedJourneys.some((j) => j.selected_mode === route.mode && j.title.includes(origin.name.split(',')[0]))}
                  />
                ))}

                {/* Honest Notice */}
                <div className="p-3 rounded-xl bg-slate-100 text-[11px] text-slate-500 flex items-start space-x-2">
                  <ShieldCheck className="w-4 h-4 text-step-600 mt-0.5 shrink-0" />
                  <div>{currentPlan.honest_disclaimer}</div>
                </div>
              </div>
            )}

            {/* Active Tab 2: Nearby Facilities Discovery */}
            {activeTab === 'places' && currentPlan && (
              <NearbyPlaces
                destLat={destination.lat}
                destLon={destination.lon}
                originLat={origin.lat}
                originLon={origin.lon}
                destName={destination.name}
                originName={origin.name}
                onSelectPlaceOnMap={(place) => setFocusedPlace(place)}
              />
            )}
          </div>

          {/* Right Column: Sticky Interactive Leaflet Map (5 cols on lg) */}
          <div className="lg:col-span-5 sticky top-20 self-start space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center">
                <MapPin className="w-3.5 h-3.5 text-step-600 mr-1" />
                Interactive Route Map
              </span>
              <span className="text-[11px] text-slate-400">OpenStreetMap & OSRM</span>
            </div>

            <InteractiveMap
              origin={origin}
              destination={destination}
              selectedRoute={selectedRoute || undefined}
              focusedPlace={focusedPlace}
            />

            {/* Selected Route Quick Summary Pill */}
            {selectedRoute && (
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500">Active Map Route: </span>
                  <span className="font-bold text-slate-800">{selectedRoute.title}</span>
                </div>
                <span className="font-black text-step-700">{selectedRoute.fare_label}</span>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-700">ThenStep</span>
            <span>•</span>
            <span>All-India Smart Travel Companion</span>
          </div>
          <div>
            Open data powered by OpenStreetMap, OSRM, Overpass & Local Ollama AI.
          </div>
        </div>
      </footer>

      {/* AI Assistant Modal */}
      <AIAssistantModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onApplyPlan={(plan) => {
          setCurrentPlan(plan);
          setSelectedRoute(plan.selected_route);
          if (plan.selected_route.steps.length > 0) {
            setOrigin({
              name: plan.selected_route.steps[0].from_name,
              lat: formInputs.origin_lat || 12.9781,
              lon: formInputs.origin_lon || 77.5696,
            });
          }
        }}
      />

      {/* Saved Journeys Modal */}
      <SavedJourneysModal
        isOpen={isSavedOpen}
        onClose={() => setIsSavedOpen(false)}
        savedJourneys={savedJourneys}
        onLoadJourney={handleLoadSavedJourney}
        onDeleteJourney={handleDeleteJourney}
      />
    </div>
  );
};
