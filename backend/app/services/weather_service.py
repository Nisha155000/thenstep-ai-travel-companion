from typing import Optional, Dict
import httpx
from app.config import settings


class WeatherService:
    @staticmethod
    async def get_weather(lat: float, lon: float) -> Optional[Dict]:
        """Fetches current weather if OPENWEATHER_API_KEY is configured. Non-blocking."""
        if not settings.OPENWEATHER_API_KEY:
            return {
                "available": False,
                "message": "OpenWeather API key not configured. Weather data is optional.",
            }

        url = "https://api.openweathermap.org/data/2.5/weather"
        params = {
            "lat": lat,
            "lon": lon,
            "appid": settings.OPENWEATHER_API_KEY,
            "units": "metric",
        }

        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(url, params=params)
                if res.status_code == 200:
                    data = res.json()
                    return {
                        "available": True,
                        "temperature_c": data.get("main", {}).get("temp"),
                        "feels_like_c": data.get("main", {}).get("feels_like"),
                        "condition": data.get("weather", [{}])[0].get("main"),
                        "description": data.get("weather", [{}])[0].get("description"),
                        "humidity_percent": data.get("main", {}).get("humidity"),
                    }
        except Exception:
            pass

        return {
            "available": False,
            "message": "Weather service temporarily unavailable.",
        }
