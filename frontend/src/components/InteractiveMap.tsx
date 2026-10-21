import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { RouteOption, NearbyPlace } from '../types';

interface InteractiveMapProps {
  origin: { name: string; lat: number; lon: number };
  destination: { name: string; lat: number; lon: number };
  selectedRoute?: RouteOption;
  focusedPlace?: NearbyPlace | null;
}

// Custom 3D SVG-based Leaflet DivIcons to avoid Vite asset resolution issues
const createPinIcon = (color: string, label: string) => {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: ${color};
        color: white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        border: 2px solid white;
      ">
        <span style="
          transform: rotate(45deg);
          font-weight: 800;
          font-size: 11px;
          font-family: sans-serif;
        ">${label}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const createFacilityIcon = (category: string) => {
  let color = '#f59e0b';
  let emoji = '📍';
  if (category === 'breakfast' || category === 'restaurant') {
    color = '#f97316';
    emoji = '🍲';
  } else if (category === 'toilets' || category === 'freshen_up') {
    color = '#0284c7';
    emoji = '🚻';
  } else if (category === 'waiting_place') {
    color = '#8b5cf6';
    emoji = '🛋️';
  }

  return L.divIcon({
    className: 'custom-facility-pin',
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 26px;
        height: 26px;
        background: white;
        border: 2px solid ${color};
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        font-size: 13px;
      ">
        ${emoji}
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
  });
};

const originIcon = createPinIcon('#10b981', 'A');
const destIcon = createPinIcon('#ef4444', 'B');

// Helper component to auto-fit map view to route bounds
const MapBoundsAdjuster: React.FC<{
  origin: { lat: number; lon: number };
  destination: { lat: number; lon: number };
  coords?: [number, number][];
  focusedPlace?: NearbyPlace | null;
}> = ({ origin, destination, coords, focusedPlace }) => {
  const map = useMap();

  useEffect(() => {
    if (focusedPlace) {
      map.flyTo([focusedPlace.lat, focusedPlace.lon], 16, { duration: 1.2 });
      return;
    }

    if (coords && coords.length > 1) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } else if (origin.lat && destination.lat) {
      const bounds = L.latLngBounds([
        [origin.lat, origin.lon],
        [destination.lat, destination.lon],
      ]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [map, coords, origin, destination, focusedPlace]);

  return null;
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  origin,
  destination,
  selectedRoute,
  focusedPlace,
}) => {
  const centerLat = (origin.lat + destination.lat) / 2 || 12.9716;
  const centerLon = (origin.lon + destination.lon) / 2 || 77.5946;

  const polylineCoords = selectedRoute?.coordinates || [];

  return (
    <div className="relative w-full h-full min-h-[360px] lg:min-h-[580px] rounded-2xl overflow-hidden shadow-3d-card border border-slate-200 bg-slate-100">
      <MapContainer
        center={[centerLat, centerLon]}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBoundsAdjuster
          origin={origin}
          destination={destination}
          coords={polylineCoords}
          focusedPlace={focusedPlace}
        />

        {/* Origin Pin */}
        {origin.lat && origin.lon && (
          <Marker position={[origin.lat, origin.lon]} icon={originIcon}>
            <Popup>
              <div className="p-1">
                <span className="text-[10px] font-bold text-emerald-600 uppercase block">Start Point</span>
                <div className="text-xs font-bold text-slate-800">{origin.name}</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Pin */}
        {destination.lat && destination.lon && (
          <Marker position={[destination.lat, destination.lon]} icon={destIcon}>
            <Popup>
              <div className="p-1">
                <span className="text-[10px] font-bold text-rose-600 uppercase block">Destination</span>
                <div className="text-xs font-bold text-slate-800">{destination.name}</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route Geometry Polyline */}
        {polylineCoords.length > 0 && (
          <>
            {/* Outline Polyline */}
            <Polyline
              positions={polylineCoords}
              pathOptions={{ color: '#0369a1', weight: 6, opacity: 0.8 }}
            />
            {/* Core Polyline */}
            <Polyline
              positions={polylineCoords}
              pathOptions={{ color: '#38bdf8', weight: 4, opacity: 1 }}
            />
          </>
        )}

        {/* Focused Facility Pin */}
        {focusedPlace && (
          <Marker
            position={[focusedPlace.lat, focusedPlace.lon]}
            icon={createFacilityIcon(focusedPlace.category)}
          >
            <Popup autoPan={true}>
              <div className="p-1">
                <span className="text-[10px] font-bold text-step-600 uppercase block">
                  {focusedPlace.category_label}
                </span>
                <div className="text-xs font-bold text-slate-900">{focusedPlace.name}</div>
                <div className="text-[11px] text-slate-600 mt-0.5">{focusedPlace.access_label}</div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Floating Map Legend */}
      <div className="absolute bottom-3 left-3 z-30 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/90 shadow-md text-[11px] font-semibold text-slate-700 flex items-center space-x-3">
        <span className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
          <span>Start (A)</span>
        </span>
        <span className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
          <span>End (B)</span>
        </span>
        {selectedRoute && (
          <span className="flex items-center space-x-1 text-step-700 font-bold">
            <span className="w-3 h-1 bg-step-500 inline-block rounded-xs"></span>
            <span>{selectedRoute.mode.toUpperCase()} ({selectedRoute.distance_km} km)</span>
          </span>
        )}
      </div>
    </div>
  );
};
