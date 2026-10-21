import math
from typing import Dict, List, Optional
from app.services.routing_service import haversine_distance_km

# Verified major Indian transit corridors & metro line bounds
METRO_CITIES = {
    "bengaluru": {
        "name": "Namma Metro",
        "center": (12.9716, 77.5946),
        "radius_km": 28,
        "base_fare": 10.0,
        "max_fare": 60.0,
        "lines": ["Purple Line (Whitefield to Challaghatta)", "Green Line (Nagasandra to Silk Institute)"],
    },
    "delhi": {
        "name": "Delhi Metro (DMRC)",
        "center": (28.6139, 77.2090),
        "radius_km": 38,
        "base_fare": 10.0,
        "max_fare": 64.0,
        "lines": ["Yellow Line (Samaypur Badli - Millennium City Centre)", "Blue Line (Dwarka - Noida/Vaishali)", "Airport Express"],
    },
    "mumbai": {
        "name": "Mumbai Metro & Suburban Rail",
        "center": (19.0760, 72.8777),
        "radius_km": 35,
        "base_fare": 10.0,
        "max_fare": 50.0,
        "lines": ["Western Line Suburban", "Central Line Suburban", "Metro Line 1 (Versova-Ghatkopar)"],
    },
    "hyderabad": {
        "name": "Hyderabad Metro",
        "center": (17.3850, 78.4867),
        "radius_km": 25,
        "base_fare": 10.0,
        "max_fare": 60.0,
        "lines": ["Red Line (Miyapur - LB Nagar)", "Blue Line (Nagole - Raidurg)", "Green Line (JBS - MGBS)"],
    },
    "chennai": {
        "name": "Chennai Metro (CMRL)",
        "center": (13.0827, 80.2707),
        "radius_km": 25,
        "base_fare": 10.0,
        "max_fare": 50.0,
        "lines": ["Blue Line (Wimco Nagar - Airport)", "Green Line (Central - St. Thomas Mount)"],
    },
    "kolkata": {
        "name": "Kolkata Metro",
        "center": (22.5726, 88.3639),
        "radius_km": 22,
        "base_fare": 5.0,
        "max_fare": 30.0,
        "lines": ["Blue Line (Dakshineswar - Kavi Subhash)", "Green Line (Howrah Maidan - Sector V)"],
    },
    "pune": {
        "name": "Pune Metro",
        "center": (18.5204, 73.8567),
        "radius_km": 20,
        "base_fare": 10.0,
        "max_fare": 35.0,
        "lines": ["Purple Line (PCMC - Civil Court)", "Aqua Line (Vanaz - Ramwadi)"],
    },
}


class TransitService:
    @staticmethod
    def detect_metro_coverage(lat: float, lon: float) -> Optional[dict]:
        for city_key, data in METRO_CITIES.items():
            dist = haversine_distance_km(lat, lon, data["center"][0], data["center"][1])
            if dist <= data["radius_km"]:
                return {**data, "city_key": city_key}
        return None

    @staticmethod
    def calculate_transit_fare(distance_km: float, mode: str, city_name: Optional[str] = None) -> tuple[float, str, str]:
        """
        Returns: (estimated_fare_inr, fare_label, fare_breakdown)
        All fares are labeled clearly as estimates with formulas.
        """
        if mode == "bus_ordinary":
            # Standard State RTC stage pricing (BMTC/DTC/BEST/MTC/KSRTC)
            if distance_km <= 2:
                fare = 5.0
            elif distance_km <= 5:
                fare = 10.0
            elif distance_km <= 10:
                fare = 15.0
            elif distance_km <= 15:
                fare = 20.0
            elif distance_km <= 20:
                fare = 25.0
            else:
                fare = min(60.0, 25.0 + math.ceil((distance_km - 20) / 4) * 5.0)
            return (
                fare,
                f"₹{int(fare)} (Stage Fare)",
                f"State RTC stage tariff: ₹5 for 0-2 km up to ₹{int(fare)} for {round(distance_km, 1)} km",
            )

        elif mode == "bus_ac":
            # AC City Bus (e.g., BMTC Vajra, DTC AC, BEST AC)
            base = 20.0
            fare = min(120.0, base + max(0, distance_km - 3) * 3.5)
            fare_rounded = round(fare / 5.0) * 5.0
            return (
                fare_rounded,
                f"₹{int(fare_rounded)} (AC Bus)",
                f"AC Volvo/Express tariff: Base ₹20 + ₹3.50/km beyond 3 km",
            )

        elif mode == "metro":
            # Urban Metro stage tariff
            if distance_km <= 2:
                fare = 10.0
            elif distance_km <= 5:
                fare = 20.0
            elif distance_km <= 12:
                fare = 30.0
            elif distance_km <= 21:
                fare = 40.0
            else:
                fare = min(65.0, 50.0 + max(0, distance_km - 25) * 1.5)
            fare_rounded = round(fare / 5.0) * 5.0
            return (
                fare_rounded,
                f"₹{int(fare_rounded)} (Metro Token/Card)",
                f"Metro distance slab: ₹10 base up to ₹{int(fare_rounded)} for {round(distance_km, 1)} km",
            )

        elif mode == "auto":
            # Auto-rickshaw meter fare: ₹30 for first 2 km, then ₹15/km
            if distance_km <= 2.0:
                fare = 30.0
            else:
                fare = 30.0 + (distance_km - 2.0) * 15.0
            fare_rounded = round(fare)
            return (
                fare_rounded,
                f"₹{fare_rounded} - ₹{fare_rounded + 20} (Meter)",
                f"Standard Indian Auto Meter: ₹30 min (first 2 km) + ₹15/km",
            )

        elif mode == "cab":
            # App Cab (Hatchback/Sedan)
            base = 100.0
            if distance_km <= 4.0:
                fare = base
            else:
                fare = base + (distance_km - 4.0) * 18.0
            fare_rounded = round(fare)
            return (
                fare_rounded,
                f"₹{fare_rounded} - ₹{fare_rounded + 50} (Cab)",
                f"Cab Estimate: ₹100 base (first 4 km) + ₹18/km standard rate (excluding surge)",
            )

        elif mode == "bike":
            # Bike Taxi (Rapido-style)
            base = 25.0
            if distance_km <= 2.0:
                fare = base
            else:
                fare = base + (distance_km - 2.0) * 8.0
            fare_rounded = round(fare)
            return (
                fare_rounded,
                f"₹{fare_rounded} - ₹{fare_rounded + 15} (Bike Taxi)",
                f"Bike Taxi Estimate: ₹25 base (first 2 km) + ₹8/km",
            )

        elif mode == "train":
            # Indian Railways Intercity / Suburban Unreserved & 2S
            if distance_km <= 20:
                fare = 10.0
            elif distance_km <= 50:
                fare = 25.0
            elif distance_km <= 100:
                fare = 50.0
            else:
                fare = 50.0 + math.ceil((distance_km - 100) / 25) * 10.0
            return (
                fare,
                f"₹{int(fare)} (Unreserved/2S)",
                f"Indian Railways distance slab fare: ₹{int(fare)} for {round(distance_km, 1)} km",
            )

        return (0.0, "Free", "Walking / No vehicle fare")
