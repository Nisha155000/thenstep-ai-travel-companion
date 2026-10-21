import math
from typing import Dict, List, Optional, Tuple
import httpx
from app.config import settings


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


class RoutingService:
    @staticmethod
    async def get_route(
        origin_lat: float,
        origin_lon: float,
        dest_lat: float,
        dest_lon: float,
        mode: str = "driving",  # "driving", "walking", "bicycle"
    ) -> Dict:
        """
        Queries OSRM with the exact profile corresponding to the transport mode.
        Profiles:
          - "driving" for cabs, cars, auto-rickshaws
          - "walking" for pedestrian legs and direct walking
          - "bicycle" for two-wheeler / cycle
        """
        valid_profiles = {"driving", "walking", "bicycle"}
        profile = mode if mode in valid_profiles else "driving"

        url = f"{settings.OSRM_BASE_URL}/route/v1/{profile}/{origin_lon},{origin_lat};{dest_lon},{dest_lat}"
        params = {
            "overview": "full",
            "geometries": "geojson",
            "steps": "true",
        }
        headers = {"User-Agent": settings.USER_AGENT}

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(url, params=params, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    routes = data.get("routes", [])
                    if routes:
                        r0 = routes[0]
                        dist_meters = r0.get("distance", 0.0)
                        duration_sec = r0.get("duration", 0.0)
                        geom = r0.get("geometry", {}).get("coordinates", [])
                        # Convert GeoJSON [lon, lat] to Leaflet [lat, lon]
                        lat_lon_coords = [[pt[1], pt[0]] for pt in geom]

                        steps_summary = []
                        legs = r0.get("legs", [])
                        if legs:
                            raw_steps = legs[0].get("steps", [])
                            for idx, s in enumerate(raw_steps):
                                instruction = s.get("maneuver", {}).get("instruction") or s.get("name") or "Continue"
                                s_dist = s.get("distance", 0.0)
                                s_dur = s.get("duration", 0.0)
                                if s_dist > 50 or idx == 0 or idx == len(raw_steps) - 1:
                                    steps_summary.append({
                                        "instruction": instruction,
                                        "distance_m": round(s_dist),
                                        "duration_sec": round(s_dur),
                                    })

                        return {
                            "status": "success",
                            "profile_used": profile,
                            "distance_meters": dist_meters,
                            "distance_km": round(dist_meters / 1000.0, 2),
                            "duration_seconds": duration_sec,
                            "duration_minutes": max(1, round(duration_sec / 60.0)),
                            "coordinates": lat_lon_coords,
                            "steps": steps_summary,
                            "is_fallback": False,
                            "source": f"OSRM Project ({profile} profile)",
                        }
        except Exception as e:
            # Fallback calculation if OSRM public demo server is down or times out
            pass

        # Robust Fallback using Haversine with standard Indian road winding factor
        direct_km = haversine_distance_km(origin_lat, origin_lon, dest_lat, dest_lon)
        road_km = direct_km * 1.35  # ~1.35x winding factor for Indian urban road networks

        speed_kmh = 24.0 if profile == "driving" else (4.5 if profile == "walking" else 15.0)
        dur_min = max(2, round((road_km / speed_kmh) * 60))

        # Generate intermediate interpolated coordinates for map rendering
        interpolated_points = []
        steps_count = 10
        for i in range(steps_count + 1):
            t = i / steps_count
            lat = origin_lat + t * (dest_lat - origin_lat)
            lon = origin_lon + t * (dest_lon - origin_lon)
            interpolated_points.append([round(lat, 6), round(lon, 6)])

        return {
            "status": "fallback",
            "profile_used": profile,
            "distance_meters": road_km * 1000.0,
            "distance_km": round(road_km, 2),
            "duration_seconds": dur_min * 60,
            "duration_minutes": dur_min,
            "coordinates": interpolated_points,
            "steps": [],
            "is_fallback": True,
            "source": f"Geometric Road Approximation ({profile} estimate)",
        }
