# ThenStep — AI-Powered Smart Travel Companion

> **One journey. One smart plan. Every next step made easier.**

**ThenStep** is a full-stack, responsive web application engineered to help travellers navigate unfamiliar cities and transit networks across **India**. Inspired by the real-world challenge of traveling to Bengaluru for an interview in Sarjapur (navigating from Majestic through Silk Board and Outer Ring Road congestion while managing tight deadlines, finding clean washrooms, and locating affordable breakfast), ThenStep solves this challenge nationwide for any Indian city, town, or transit corridor.

---

## Key Features

1. **All-India Multi-Modal Route Planning**:
   - **Indian Railways & Suburban Trains**: Intercity express & commuter rail between major junctions.
   - **Urban Metro Networks**: Proximity detection and stage tariffs for Delhi-NCR, Mumbai, Bengaluru (Namma Metro), Hyderabad, Chennai, Kolkata, Pune, Kochi, Ahmedabad, Lucknow.
   - **City & Intercity Buses**: Stage-based tariffs for State RTCs (KSRTC, MSRTC, UPSRTC, DTC, BMTC, etc.).
   - **Auto-Rickshaws & Taxis**: Meter calculations calibrated for Indian Tier 1 metros and Tier 2/3 cities.
   - **Bike Taxis (Rapido-style) & Walking**: Last-mile connectivity.

2. **Honest Data Guarantee**:
   - **No Fabricated Data**: Fares, schedules, and durations are calculated using documented road networks and published transit stage models, explicitly labeled as **Estimates**.
   - **Live GPS Disclosure**: Clearly displays that real-time bus tracking is not active without live transit agency feeds.
   - **OSRM Exact Profile Match**: Uses `driving` for cars/autos, `walking` for pedestrians, and `bicycle` for two-wheelers. Driving routes are never disguised as pedestrian routes.

3. **Interview & Appointment Arrival Guard**:
   - Calculate suggested departure time: `Departure Time = Arrival Time - (Estimated Travel Duration + Safety Buffer)`.
   - Purpose-driven safety buffers (Interview: 35m default, Exam: 45m, Appointment: 25m, Work: 15m).
   - Dynamic buffer adjustment slider (15 to 75 minutes).
   - Peak Indian traffic advisories (highlighting 8:30–10:30 AM and 5:30–8:00 PM congestion windows).

4. **Nearby Facilities Explorer (Overpass API)**:
   - Discovers affordable South Indian breakfast/tiffin, restaurants, clean washrooms, freshening-up spots, and quiet waiting spaces.
   - **Transparent Access Level Tagging**:
     - 🟢 **Verified Public Facility**: Municipal washrooms, Sulabh complexes, transit station restrooms.
     - 🟡 **Customer Access (Purchase Required)**: Commercial cafes and restaurants.
     - ⚪ **Unconfirmed Access**: General POIs requiring confirmation upon arrival.
   - Direct "Focus on Map" pins on the interactive map.

5. **AI Travel Assistant (Dual-Engine)**:
   - Understands conversational requests (e.g. *"I have an interview in Sarjapur at 10 AM starting from Majestic. Limited budget. Find breakfast."*).
   - Automatically extracts slots (origin, destination, time, budget, purpose, facility requirements) and asks for missing essentials.
   - Connects to local **Ollama LLM** (`llama3`, `mistral`, etc.) when running.
   - Gracefully falls back to a deterministic **Rule-Based NLP Engine** if Ollama is offline.
   - **Untrusted Output Guardrail**: Validates extracted locations and routes against the real backend APIs before display.

6. **Interactive Leaflet Map**:
   - OpenStreetMap tiles with full attribution.
   - Visual route polyline, origin/destination pins, and facility markers with auto-bounding.

7. **Multilingual Interface**:
   - Instant language switching between **English**, **Kannada (ಕನ್ನಡ)**, and **Hindi (हिंदी)**.

8. **Saved Journeys & Preferences**:
   - Bookmark journeys to the database (with localStorage backup) for one-click reload.

---

## Technology Stack

- **Frontend**:
  - React 18 with TypeScript
  - Vite
  - Tailwind CSS (with 3D visual shadows & card elevations)
  - Leaflet & React-Leaflet
  - Lucide React Icons
- **Backend**:
  - Python 3.10+ (FastAPI)
  - Pydantic v2 & Pydantic-Settings
  - HTTPX (Async HTTP client with timeout & custom user-agent)
  - SQLAlchemy (SQLite fallback / PostgreSQL + PostGIS ready)
  - Pytest (15 automated unit & integration tests)

---

## Free External API Integrations

| Service | Endpoint | Usage |
|---|---|---|
| **OpenStreetMap** | `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` | Interactive Map Tiles |
| **Nominatim** | `https://nominatim.openstreetmap.org/search` | Geocoding & Place Autocomplete (Cached & Debounced) |
| **OSRM** | `https://router.project-osrm.org/route/v1/` | Road Network Routing (driving, walking, bicycle) |
| **Overpass API** | `https://overpass-api.de/api/interpreter` | Nearby Amenities (Food, Toilets, Parks, Transit) |
| **Ollama (Optional)** | `http://localhost:11434` | Local LLM Assistant (Non-blocking) |
| **OpenWeather (Optional)** | `https://api.openweathermap.org` | Weather conditions (Non-blocking) |

---

## Quickstart & Installation (Windows PowerShell)

### Prerequisites
- Python 3.10+ installed
- Node.js v18+ and npm installed

---

### Step 1: Start the Backend (Terminal 1)

Open a Windows PowerShell terminal in the project directory:

```powershell
cd "backend"

# (Optional) Create and activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r requirements.txt

# Run automated tests to verify backend integrity
python -m pytest tests -v

# Start FastAPI development server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend will be live at: `http://localhost:8000`  
Swagger Interactive API Documentation: `http://localhost:8000/docs`

---

### Step 2: Start the Frontend (Terminal 2)

Open a second Windows PowerShell terminal:

```powershell
cd "frontend"

# Install frontend dependencies
npm install

# Start Vite React development server
npm run dev
```

Frontend will be live at: `http://localhost:5173`

---

## Backend API Endpoints

- `GET  /api/health` — Health check & integration diagnostics
- `GET  /api/locations/search?q={query}` — Nominatim geocoding with caching & Indian hub catalog
- `POST /api/routes/compare` — Compare multi-modal options with fare estimates
- `POST /api/journey/plan` — Comprehensive plan with interview buffer & route ranking
- `GET  /api/places/nearby?lat={lat}&lon={lon}&category={cat}` — Overpass POI explorer
- `POST /api/assistant/chat` — AI Travel Assistant (Ollama LLM + rule-based NLP)
- `GET  /api/preferences` & `PUT /api/preferences` — User preferences
- `GET  /api/journeys` & `POST /api/journeys` — Saved journeys management
- `GET  /api/weather?lat={lat}&lon={lon}` — Optional weather lookup

---

## License & Attribution

- Geographic map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.
- Routing powered by the [OSRM Project](http://project-osrm.org/).
- Points of interest provided by the [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API).
