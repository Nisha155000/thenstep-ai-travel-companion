import { LocationPoint, JourneyPlanRequest, JourneyPlanResponse, NearbyPlace, SavedJourney, UserPreference } from '../types';

const API_BASE = 'http://localhost:8000/api';

export const api = {
  async searchLocations(query: string): Promise<LocationPoint[]> {
    if (!query || query.trim().length === 0) return [];
    try {
      const res = await fetch(`${API_BASE}/locations/search?q=${encodeURIComponent(query)}&limit=8`);
      if (!res.ok) throw new Error('Location search failed');
      const data = await res.json();
      return data.results || [];
    } catch (err) {
      console.warn('Location search error:', err);
      return [];
    }
  },

  async planJourney(payload: JourneyPlanRequest): Promise<JourneyPlanResponse> {
    const res = await fetch(`${API_BASE}/journey/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Unknown journey planning error' }));
      throw new Error(err.detail || 'Failed to plan journey');
    }
    return res.json();
  },

  async getNearbyPlaces(
    lat: number,
    lon: number,
    category: string = 'breakfast',
    radius: number = 1500
  ): Promise<{ places: NearbyPlace[]; limitation_note: string }> {
    const res = await fetch(`${API_BASE}/places/nearby?lat=${lat}&lon=${lon}&category=${category}&radius=${radius}`);
    if (!res.ok) throw new Error('Failed to fetch nearby places');
    const data = await res.json();
    return {
      places: data.places || [],
      limitation_note: data.limitation_note || '',
    };
  },

  async chatWithAssistant(message: string, history: any[] = [], language: string = 'en') {
    const res = await fetch(`${API_BASE}/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, language }),
    });
    if (!res.ok) throw new Error('AI Assistant request failed');
    return res.json();
  },

  async getPreferences(): Promise<UserPreference> {
    const res = await fetch(`${API_BASE}/preferences`);
    if (!res.ok) throw new Error('Failed to load preferences');
    return res.json();
  },

  async updatePreferences(pref: Partial<UserPreference>): Promise<UserPreference> {
    const res = await fetch(`${API_BASE}/preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pref),
    });
    if (!res.ok) throw new Error('Failed to update preferences');
    return res.json();
  },

  async getSavedJourneys(): Promise<SavedJourney[]> {
    const res = await fetch(`${API_BASE}/journeys`);
    if (!res.ok) throw new Error('Failed to load saved journeys');
    return res.json();
  },

  async saveJourney(data: any): Promise<SavedJourney> {
    const res = await fetch(`${API_BASE}/journeys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to save journey');
    return res.json();
  },

  async deleteJourney(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/journeys/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete journey');
  },

  async getWeather(lat: number, lon: number) {
    try {
      const res = await fetch(`${API_BASE}/weather?lat=${lat}&lon=${lon}`);
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },
};
