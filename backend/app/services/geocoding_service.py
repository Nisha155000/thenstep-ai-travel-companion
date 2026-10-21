import time
from typing import List, Optional, Dict
import httpx
from app.config import settings
from app.schemas.location import LocationPoint

# In-memory LRU-like cache: query -> (timestamp, List[LocationPoint])
_GEOCODE_CACHE: Dict[str, tuple[float, List[LocationPoint]]] = {}
CACHE_TTL_SECONDS = 3600  # 1 hour cache

# Pre-populated All-India key travel and transit hubs for instant search & offline resilience
INDIA_POPULAR_HUBS: List[Dict] = [
    # Bengaluru
    {
        "name": "KSR Bengaluru City Junction (Majestic)",
        "lat": 12.9781,
        "lon": 77.5696,
        "display_name": "KSR Bengaluru Railway Station / Kempegowda Bus Station, Majestic, Bengaluru, Karnataka",
        "city": "Bengaluru",
        "state": "Karnataka",
        "category": "transit_hub",
    },
    {
        "name": "Sarjapur Road (RGA Tech Park)",
        "lat": 12.9081,
        "lon": 77.6974,
        "display_name": "RGA Tech Park, Sarjapur Road, Carmelaram, Bengaluru, Karnataka",
        "city": "Bengaluru",
        "state": "Karnataka",
        "category": "destination",
    },
    {
        "name": "Indiranagar Metro Station",
        "lat": 12.9784,
        "lon": 77.6408,
        "display_name": "Indiranagar Namma Metro Station, CMH Road, Bengaluru, Karnataka",
        "city": "Bengaluru",
        "state": "Karnataka",
        "category": "transit_hub",
    },
    {
        "name": "Silk Board Junction",
        "lat": 12.9172,
        "lon": 77.6228,
        "display_name": "Central Silk Board Junction, Hosur Road, Bengaluru, Karnataka",
        "city": "Bengaluru",
        "state": "Karnataka",
        "category": "transit_hub",
    },
    {
        "name": "Electronic City Phase 1",
        "lat": 12.8452,
        "lon": 77.6602,
        "display_name": "Electronic City Phase 1, Hosur Road, Bengaluru, Karnataka",
        "city": "Bengaluru",
        "state": "Karnataka",
        "category": "destination",
    },
    {
        "name": "Whitefield (ITPL)",
        "lat": 12.9866,
        "lon": 77.7381,
        "display_name": "International Tech Park Bangalore (ITPL), Whitefield, Bengaluru, Karnataka",
        "city": "Bengaluru",
        "state": "Karnataka",
        "category": "destination",
    },
    {
        "name": "Kempegowda International Airport (BLR)",
        "lat": 13.1986,
        "lon": 77.7066,
        "display_name": "Kempegowda International Airport, Devanahalli, Bengaluru, Karnataka",
        "city": "Bengaluru",
        "state": "Karnataka",
        "category": "transit_hub",
    },
    # Delhi-NCR
    {
        "name": "New Delhi Railway Station (NDLS)",
        "lat": 28.6431,
        "lon": 77.2197,
        "display_name": "New Delhi Railway Station, Paharganj, New Delhi, Delhi",
        "city": "New Delhi",
        "state": "Delhi",
        "category": "transit_hub",
    },
    {
        "name": "Rajiv Chowk Metro Station (Connaught Place)",
        "lat": 28.6328,
        "lon": 77.2195,
        "display_name": "Rajiv Chowk Metro Station, Connaught Place, New Delhi, Delhi",
        "city": "New Delhi",
        "state": "Delhi",
        "category": "transit_hub",
    },
    {
        "name": "Cyber City Gurgaon (DLF)",
        "lat": 28.4950,
        "lon": 77.0895,
        "display_name": "DLF Cyber City, Sector 24, Gurugram, Haryana",
        "city": "Gurugram",
        "state": "Haryana",
        "category": "destination",
    },
    {
        "name": "Kashmere Gate ISBT",
        "lat": 28.6675,
        "lon": 77.2285,
        "display_name": "Maharana Pratap Inter-State Bus Terminus, Kashmere Gate, Delhi",
        "city": "Delhi",
        "state": "Delhi",
        "category": "transit_hub",
    },
    # Mumbai
    {
        "name": "Chhatrapati Shivaji Maharaj Terminus (CSMT)",
        "lat": 18.9401,
        "lon": 72.8354,
        "display_name": "CSMT Railway Station, Fort, Mumbai, Maharashtra",
        "city": "Mumbai",
        "state": "Maharashtra",
        "category": "transit_hub",
    },
    {
        "name": "Bandra Kurla Complex (BKC)",
        "lat": 19.0664,
        "lon": 72.8687,
        "display_name": "Bandra Kurla Complex, Bandra East, Mumbai, Maharashtra",
        "city": "Mumbai",
        "state": "Maharashtra",
        "category": "destination",
    },
    {
        "name": "Dadar Central Railway Station",
        "lat": 19.0178,
        "lon": 72.8478,
        "display_name": "Dadar Railway Station, Dadar, Mumbai, Maharashtra",
        "city": "Mumbai",
        "state": "Maharashtra",
        "category": "transit_hub",
    },
    # Hyderabad
    {
        "name": "Secunderabad Railway Station",
        "lat": 17.4334,
        "lon": 78.5045,
        "display_name": "Secunderabad Junction Railway Station, Secunderabad, Telangana",
        "city": "Hyderabad",
        "state": "Telangana",
        "category": "transit_hub",
    },
    {
        "name": "HITEC City / Cyber Towers",
        "lat": 17.4504,
        "lon": 78.3808,
        "display_name": "Cyber Towers, HITEC City, Madhapur, Hyderabad, Telangana",
        "city": "Hyderabad",
        "state": "Telangana",
        "category": "destination",
    },
    # Chennai
    {
        "name": "Puratchi Thalaivar Dr. MGR Central (Chennai Central)",
        "lat": 13.0827,
        "lon": 80.2755,
        "display_name": "Chennai Central Railway Station, Kannappar Thidal, Chennai, Tamil Nadu",
        "city": "Chennai",
        "state": "Tamil Nadu",
        "category": "transit_hub",
    },
    {
        "name": "Tidel Park / OMR Tharamani",
        "lat": 12.9892,
        "lon": 80.2483,
        "display_name": "Tidel Park, Rajiv Gandhi Salai (OMR), Tharamani, Chennai, Tamil Nadu",
        "city": "Chennai",
        "state": "Tamil Nadu",
        "category": "destination",
    },
    # Kolkata
    {
        "name": "Howrah Railway Station",
        "lat": 22.5850,
        "lon": 88.3426,
        "display_name": "Howrah Junction Railway Station, Howrah, West Bengal",
        "city": "Kolkata",
        "state": "West Bengal",
        "category": "transit_hub",
    },
    {
        "name": "Salt Lake Sector V",
        "lat": 22.5735,
        "lon": 88.4331,
        "display_name": "Salt Lake Sector V, Bidhannagar, Kolkata, West Bengal",
        "city": "Kolkata",
        "state": "West Bengal",
        "category": "destination",
    },
    # Pune
    {
        "name": "Pune Railway Junction",
        "lat": 18.5284,
        "lon": 73.8744,
        "display_name": "Pune Junction Railway Station, Agarkar Nagar, Pune, Maharashtra",
        "city": "Pune",
        "state": "Maharashtra",
        "category": "transit_hub",
    },
    {
        "name": "Hinjawadi IT Park (Phase 1)",
        "lat": 18.5913,
        "lon": 73.7389,
        "display_name": "Rajiv Gandhi Infotech Park, Hinjawadi Phase 1, Pune, Maharashtra",
        "city": "Pune",
        "state": "Maharashtra",
        "category": "destination",
    },
]


class GeocodingService:
    @staticmethod
    async def search_locations(query: str, limit: int = 7) -> List[LocationPoint]:
        q_clean = query.strip()
        if not q_clean:
            return []

        cache_key = q_clean.lower()
        now = time.time()
        if cache_key in _GEOCODE_CACHE:
            cached_time, cached_results = _GEOCODE_CACHE[cache_key]
            if now - cached_time < CACHE_TTL_SECONDS:
                return cached_results

        # 1. First check matching internal curated hubs for instant matching
        local_matches: List[LocationPoint] = []
        for hub in INDIA_POPULAR_HUBS:
            if (
                q_clean.lower() in hub["name"].lower()
                or q_clean.lower() in hub["display_name"].lower()
                or q_clean.lower() in hub["city"].lower()
            ):
                local_matches.append(
                    LocationPoint(
                        name=hub["name"],
                        lat=hub["lat"],
                        lon=hub["lon"],
                        display_name=hub["display_name"],
                        city=hub["city"],
                        state=hub["state"],
                        category=hub.get("category", "place"),
                    )
                )

        # 2. Query Nominatim OpenStreetMap
        api_results: List[LocationPoint] = []
        try:
            url = f"{settings.NOMINATIM_BASE_URL}/search"
            params = {
                "q": q_clean,
                "format": "json",
                "addressdetails": "1",
                "countrycodes": "in",
                "limit": str(limit),
            }
            headers = {"User-Agent": settings.USER_AGENT}

            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.get(url, params=params, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    for item in data:
                        addr = item.get("address", {})
                        city = (
                            addr.get("city")
                            or addr.get("town")
                            or addr.get("suburb")
                            or addr.get("state_district")
                            or addr.get("county")
                        )
                        state = addr.get("state")
                        raw_name = item.get("name") or item.get("display_name", "").split(",")[0]
                        api_results.append(
                            LocationPoint(
                                name=raw_name,
                                lat=float(item["lat"]),
                                lon=float(item["lon"]),
                                display_name=item.get("display_name"),
                                city=city,
                                state=state,
                                category=item.get("type", "place"),
                            )
                        )
        except Exception as e:
            # On network timeout or rate limit, fallback cleanly to curated hubs
            pass

        # Combine results, ensuring unique points by approximate coordinates
        combined: List[LocationPoint] = []
        seen = set()

        # Prioritize exact local matches if any, then API results
        for pt in local_matches + api_results:
            coord_key = (round(pt.lat, 3), round(pt.lon, 3))
            if coord_key not in seen:
                seen.add(coord_key)
                combined.append(pt)
            if len(combined) >= limit:
                break

        _GEOCODE_CACHE[cache_key] = (now, combined)
        return combined
