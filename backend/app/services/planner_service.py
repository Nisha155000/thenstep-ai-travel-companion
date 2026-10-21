import datetime
import math
import uuid
from typing import Dict, List, Optional, Tuple
from app.schemas.journey import JourneyPlanRequest, JourneyPlanResponse, InterviewBufferSummary
from app.schemas.route import RouteOption, RouteStep
from app.services.routing_service import RoutingService, haversine_distance_km
from app.services.transit_service import TransitService
from app.services.places_service import PlacesService


def parse_time_str(time_str: str) -> Optional[datetime.time]:
    """Parses various arrival time strings: '10:00', '10:00 AM', '10:00:00', '2026-10-18T10:00'."""
    clean = time_str.strip().upper()
    # Check ISO format
    if "T" in clean:
        try:
            dt = datetime.datetime.fromisoformat(clean)
            return dt.time()
        except Exception:
            pass

    formats = ["%I:%M %p", "%I:%M%p", "%H:%M", "%H:%M:%S"]
    for fmt in formats:
        try:
            return datetime.datetime.strptime(clean, fmt).time()
        except Exception:
            pass
    return None


def calculate_departure_time(arrival_time_str: str, duration_min: int, buffer_min: int) -> Tuple[str, Optional[str]]:
    t = parse_time_str(arrival_time_str)
    if not t:
        return ("Estimated 1 hour before arrival", None)

    today = datetime.date.today()
    arrival_dt = datetime.datetime.combine(today, t)
    total_lead_min = duration_min + buffer_min
    departure_dt = arrival_dt - datetime.timedelta(minutes=total_lead_min)

    # Check peak traffic window in Indian cities
    dep_hour = departure_dt.hour + departure_dt.minute / 60.0
    traffic_warning = None
    if (8.5 <= dep_hour <= 10.5) or (17.5 <= dep_hour <= 20.0):
        traffic_warning = "⚠️ Peak Traffic Alert: Indian urban corridors (e.g., ORR, Silk Board, BKC, Connaught Place) experience 25-40 mins additional delays during this window. Maintain buffer."

    dep_formatted = departure_dt.strftime("%I:%M %p").lstrip("0")
    return (dep_formatted, traffic_warning)


class PlannerService:
    @staticmethod
    async def plan_journey(req: JourneyPlanRequest) -> JourneyPlanResponse:
        origin_lat, origin_lon = req.origin_lat, req.origin_lon
        dest_lat, dest_lon = req.destination_lat, req.destination_lon
        direct_dist_km = haversine_distance_km(origin_lat, origin_lon, dest_lat, dest_lon)

        # 1. Fetch real OSRM driving route for road geometry and baseline
        driving_route = await RoutingService.get_route(origin_lat, origin_lon, dest_lat, dest_lon, mode="driving")
        actual_dist_km = driving_route["distance_km"]
        driving_duration_min = driving_route["duration_minutes"]

        # Fetch walking route if feasible (< 5 km)
        walking_route = None
        if direct_dist_km <= 5.0:
            walking_route = await RoutingService.get_route(origin_lat, origin_lon, dest_lat, dest_lon, mode="walking")

        # 2. Build multi-modal options
        options: List[RouteOption] = []

        # Check metro coverage
        metro_origin = TransitService.detect_metro_coverage(origin_lat, origin_lon)
        metro_dest = TransitService.detect_metro_coverage(dest_lat, dest_lon)
        same_metro_city = metro_origin and metro_dest and (metro_origin["city_key"] == metro_dest["city_key"])

        # Determine Intercity vs Intracity
        is_intercity = actual_dist_km > 60.0

        if is_intercity:
            # Option A: Indian Railways Intercity Train
            train_fare, train_label, train_breakdown = TransitService.calculate_transit_fare(actual_dist_km, "train")
            train_dur_min = max(45, round((actual_dist_km / 55.0) * 60))
            options.append(
                RouteOption(
                    id="train_intercity",
                    mode="transit_rail",
                    title="Indian Railways Intercity Express",
                    subtitle="Rail Network • Economical & Predictable",
                    estimated_duration_min=train_dur_min,
                    distance_km=actual_dist_km,
                    walking_distance_m=800,
                    transfers=1,
                    estimated_fare_inr=train_fare,
                    fare_label=train_label,
                    is_fare_estimated=True,
                    fare_breakdown=train_breakdown,
                    data_source="Indian Railways Public Timetable & Fare Slabs",
                    limitations=[
                        "Station check-in required 20-30 mins prior to departure",
                        "Ticket availability should be checked on IRCTC / PRS counter",
                    ],
                    coordinates=driving_route["coordinates"],
                    steps=[
                        RouteStep(
                            step_number=1,
                            mode="walk",
                            instruction=f"Reach the nearest railway junction from {req.origin_name}",
                            instruction_hi=f"{req.origin_name} से नजदीकी रेलवे स्टेशन पहुंचें",
                            instruction_kn=f"{req.origin_name} ನಿಂದ ಹತ್ತಿರದ ರೈಲ್ವೆ ನಿಲ್ದಾಣಕ್ಕೆ ತಲುಪಿ",
                            distance_meters=400,
                            duration_minutes=6,
                            from_name=req.origin_name,
                            to_name="Origin Railway Station",
                        ),
                        RouteStep(
                            step_number=2,
                            mode="train",
                            instruction=f"Board Express / Intercity train towards {req.destination_name}",
                            instruction_hi=f"{req.destination_name} की दिशा में एक्सप्रेस ट्रेन पकड़ें",
                            instruction_kn=f"{req.destination_name} ದಿಕ್ಕಿಗೆ ಎಕ್ಸ್‌ಪ್ರೆಸ್ ರೈಲು ಹತ್ತಿರಿ",
                            distance_meters=round(actual_dist_km * 1000),
                            duration_minutes=train_dur_min - 20,
                            from_name="Origin Station",
                            to_name="Destination Station",
                            frequency_notes="Multiple scheduled daily departures",
                        ),
                        RouteStep(
                            step_number=3,
                            mode="walk",
                            instruction=f"Exit station and proceed to {req.destination_name}",
                            instruction_hi=f"स्टेशन से बाहर निकलकर {req.destination_name} की ओर जाएं",
                            instruction_kn=f"ನಿಲ್ದಾಣದಿಂದ ಹೊರಬಂದು {req.destination_name} ಕಡೆಗೆ ಮುಂದುವರಿಯಿರಿ",
                            distance_meters=400,
                            duration_minutes=6,
                            from_name="Destination Station",
                            to_name=req.destination_name,
                        ),
                    ],
                )
            )

            # Option B: State RTC Intercity Bus
            bus_fare, bus_label, bus_breakdown = TransitService.calculate_transit_fare(actual_dist_km, "bus_ac")
            bus_dur_min = max(60, round((actual_dist_km / 42.0) * 60))
            options.append(
                RouteOption(
                    id="bus_intercity",
                    mode="transit_bus",
                    title="State RTC Intercity Express Bus",
                    subtitle="Express / Airavat / Shivneri Highway Service",
                    estimated_duration_min=bus_dur_min,
                    distance_km=actual_dist_km,
                    walking_distance_m=500,
                    transfers=1,
                    estimated_fare_inr=bus_fare,
                    fare_label=bus_label,
                    is_fare_estimated=True,
                    fare_breakdown=bus_breakdown,
                    data_source="State RTC Published Highway Schedules",
                    limitations=[
                        "Highway toll stops and city entry traffic may extend duration by 15-30 mins",
                        "Confirm platform number at bus terminus",
                    ],
                    coordinates=driving_route["coordinates"],
                    steps=[
                        RouteStep(
                            step_number=1,
                            mode="walk",
                            instruction=f"Head to Central Bus Stand from {req.origin_name}",
                            instruction_hi=f"{req.origin_name} से बस स्टैंड जाएं",
                            instruction_kn=f"{req.origin_name} ನಿಂದ ಮುಖ್ಯ ಬಸ್ ನಿಲ್ದಾಣಕ್ಕೆ ಹೋಗಿ",
                            distance_meters=300,
                            duration_minutes=5,
                            from_name=req.origin_name,
                            to_name="Bus Terminus",
                        ),
                        RouteStep(
                            step_number=2,
                            mode="bus",
                            instruction=f"Board State RTC Express Bus to {req.destination_name}",
                            instruction_hi=f"{req.destination_name} के लिए एक्सप्रेस बस लें",
                            instruction_kn=f"{req.destination_name} ಗಾಗಿ ಎಕ್ಸ್‌ಪ್ರೆಸ್ ಬಸ್ ಹತ್ತಿರಿ",
                            distance_meters=round(actual_dist_km * 1000),
                            duration_minutes=bus_dur_min - 15,
                            from_name="Bus Terminus",
                            to_name="Destination Drop Point",
                        ),
                    ],
                )
            )

            # Option C: Outstation Cab
            cab_fare, cab_label, cab_breakdown = TransitService.calculate_transit_fare(actual_dist_km, "cab")
            options.append(
                RouteOption(
                    id="cab_intercity",
                    mode="cab",
                    title="Outstation / Highway Taxi",
                    subtitle="Direct Highway Drive • Point to Point",
                    estimated_duration_min=driving_duration_min,
                    distance_km=actual_dist_km,
                    walking_distance_m=50,
                    transfers=0,
                    estimated_fare_inr=cab_fare,
                    fare_label=cab_label,
                    is_fare_estimated=True,
                    fare_breakdown=cab_breakdown,
                    data_source=driving_route["source"],
                    limitations=["Highway toll charges may be extra", "Subject to driver availability"],
                    coordinates=driving_route["coordinates"],
                    steps=[
                        RouteStep(
                            step_number=1,
                            mode="cab",
                            instruction=f"Board taxi at {req.origin_name} and drive directly to {req.destination_name}",
                            instruction_hi=f"{req.origin_name} पर टैक्सी लें और सीधे {req.destination_name} जाएं",
                            instruction_kn=f"{req.origin_name} ನಲ್ಲಿ ಟ್ಯಾಕ್ಸಿ ಹತ್ತಿ ನೇರವಾಗಿ {req.destination_name} ಗೆ ತೆರಳಿ",
                            distance_meters=round(actual_dist_km * 1000),
                            duration_minutes=driving_duration_min,
                            from_name=req.origin_name,
                            to_name=req.destination_name,
                        )
                    ],
                )
            )

        else:
            # Intracity City Routes

            # 1. City Bus / Public Transit
            bus_dur = max(20, round(driving_duration_min * 1.45) + 10)  # bus takes ~1.45x driving + stop delays
            bus_fare, bus_label, bus_breakdown = TransitService.calculate_transit_fare(actual_dist_km, "bus_ordinary")
            options.append(
                RouteOption(
                    id="city_bus",
                    mode="transit_bus",
                    title="Public City Bus",
                    subtitle="State / Municipal City Bus Service",
                    estimated_duration_min=bus_dur,
                    distance_km=actual_dist_km,
                    walking_distance_m=450,
                    transfers=1 if actual_dist_km > 15 else 0,
                    estimated_fare_inr=bus_fare,
                    fare_label=bus_label,
                    is_fare_estimated=True,
                    fare_breakdown=bus_breakdown,
                    data_source="Published City Transit Network Tariff",
                    limitations=[
                        "Schedule based on typical frequency (10-15 mins interval)",
                        "Real-time GPS bus tracking is not active without live transit agency feed",
                    ],
                    coordinates=driving_route["coordinates"],
                    steps=[
                        RouteStep(
                            step_number=1,
                            mode="walk",
                            instruction=f"Walk to the nearest bus stop near {req.origin_name}",
                            instruction_hi=f"{req.origin_name} के पास बस स्टॉप तक पैदल चलें",
                            instruction_kn=f"{req.origin_name} ಹತ್ತಿರದ ಬಸ್ ನಿಲ್ದಾಣಕ್ಕೆ ನಡೆದುಕೊಂಡು ಹೋಗಿ",
                            distance_meters=250,
                            duration_minutes=4,
                            from_name=req.origin_name,
                            to_name="Origin Bus Stop",
                        ),
                        RouteStep(
                            step_number=2,
                            mode="bus",
                            instruction=f"Board city bus connecting towards {req.destination_name}",
                            instruction_hi=f"{req.destination_name} की ओर जाने वाली सिटी बस पकड़ें",
                            instruction_kn=f"{req.destination_name} ಕಡೆಗೆ ಹೋಗುವ ಸಿಟಿ ಬಸ್ ಹತ್ತಿರಿ",
                            distance_meters=round(actual_dist_km * 1000 - 450),
                            duration_minutes=bus_dur - 8,
                            from_name="Origin Bus Stop",
                            to_name="Destination Bus Stop",
                            frequency_notes="Approx every 10-15 minutes",
                        ),
                        RouteStep(
                            step_number=3,
                            mode="walk",
                            instruction=f"Walk from stop to {req.destination_name}",
                            instruction_hi=f"स्टॉप से {req.destination_name} तक पैदल चलें",
                            instruction_kn=f"ಬಸ್ ನಿಲ್ದಾಣದಿಂದ {req.destination_name} ಗೆ ನಡೆದುಕೊಂಡು ಹೋಗಿ",
                            distance_meters=200,
                            duration_minutes=4,
                            from_name="Destination Bus Stop",
                            to_name=req.destination_name,
                        ),
                    ],
                )
            )

            # 2. Metro (if available in this city)
            if same_metro_city:
                metro_dur = max(15, round(actual_dist_km * 2.2) + 12)
                m_fare, m_label, m_breakdown = TransitService.calculate_transit_fare(actual_dist_km, "metro")
                options.append(
                    RouteOption(
                        id="metro_transit",
                        mode="transit_metro",
                        title=f"{metro_origin['name']} (Metro Rail)",
                        subtitle="Rapid Transit • Bypasses Road Traffic",
                        estimated_duration_min=metro_dur,
                        distance_km=actual_dist_km,
                        walking_distance_m=600,
                        transfers=0 if actual_dist_km < 14 else 1,
                        estimated_fare_inr=m_fare,
                        fare_label=m_label,
                        is_fare_estimated=True,
                        fare_breakdown=m_breakdown,
                        data_source=f"{metro_origin['name']} Published Timetable & Fare Slabs",
                        limitations=[
                            "Security baggage screening at station entrances (allow 5 mins)",
                            "Last mile to destination may require auto or short walk",
                        ],
                        coordinates=driving_route["coordinates"],
                        steps=[
                            RouteStep(
                                step_number=1,
                                mode="walk",
                                instruction=f"Proceed to the nearest Metro Station concourse",
                                instruction_hi=f"नजदीकी मेट्रो स्टेशन पर जाएं",
                                instruction_kn=f"ಹತ್ತಿರದ ಮೆಟ್ರೋ ನಿಲ್ದಾಣಕ್ಕೆ ಹೋಗಿ",
                                distance_meters=350,
                                duration_minutes=5,
                                from_name=req.origin_name,
                                to_name="Metro Station Entry",
                            ),
                            RouteStep(
                                step_number=2,
                                mode="metro",
                                instruction=f"Board Metro train towards destination alignment",
                                instruction_hi=f"गंतव्य दिशा की ओर मेट्रो ट्रेन लें",
                                instruction_kn=f"ಗಮ್ಯಸ್ಥಾನದ ದಿಕ್ಕಿನಲ್ಲಿ ಮೆಟ್ರೋ ರೈಲು ಹತ್ತಿರಿ",
                                distance_meters=round(actual_dist_km * 1000 - 600),
                                duration_minutes=metro_dur - 9,
                                from_name="Origin Metro Station",
                                to_name="Destination Nearest Metro Station",
                                frequency_notes="Trains run every 5-7 minutes during peak hours",
                            ),
                            RouteStep(
                                step_number=3,
                                mode="walk",
                                instruction=f"Exit gate and walk to {req.destination_name}",
                                instruction_hi=f"गेट से बाहर निकलकर {req.destination_name} तक जाएं",
                                instruction_kn=f"ಗೇಟ್‌ನಿಂದ ಹೊರಬಂದು {req.destination_name} ಗೆ ತೆರಳಿ",
                                distance_meters=250,
                                duration_minutes=4,
                                from_name="Metro Exit",
                                to_name=req.destination_name,
                            ),
                        ],
                    )
                )

            # 3. Auto-Rickshaw
            auto_dur = max(8, round(driving_duration_min * 1.15))
            auto_fare, auto_label, auto_breakdown = TransitService.calculate_transit_fare(actual_dist_km, "auto")
            options.append(
                RouteOption(
                    id="auto_rickshaw",
                    mode="auto",
                    title="Auto-Rickshaw (Three-Wheeler)",
                    subtitle="Flexible • Ideal for City Traffic & Last Mile",
                    estimated_duration_min=auto_dur,
                    distance_km=actual_dist_km,
                    walking_distance_m=60,
                    transfers=0,
                    estimated_fare_inr=auto_fare,
                    fare_label=auto_label,
                    is_fare_estimated=True,
                    fare_breakdown=auto_breakdown,
                    data_source="Regional Transport Authority (RTA) Meter Tariff",
                    limitations=[
                        "Drivers may ask 1.5x night fare after 10:00 PM",
                        "Meter adherence can vary; request meter or agree upfront",
                    ],
                    coordinates=driving_route["coordinates"],
                    steps=[
                        RouteStep(
                            step_number=1,
                            mode="auto",
                            instruction=f"Hail an auto or book via app from {req.origin_name} to {req.destination_name}",
                            instruction_hi=f"{req.origin_name} से {req.destination_name} के लिए ऑटो लें",
                            instruction_kn=f"{req.origin_name} ನಿಂದ {req.destination_name} ಗೆ ಆಟೋ ಹತ್ತಿರಿ",
                            distance_meters=round(actual_dist_km * 1000),
                            duration_minutes=auto_dur,
                            from_name=req.origin_name,
                            to_name=req.destination_name,
                        )
                    ],
                )
            )

            # 4. Cab / Taxi
            cab_fare, cab_label, cab_breakdown = TransitService.calculate_transit_fare(actual_dist_km, "cab")
            options.append(
                RouteOption(
                    id="cab_taxi",
                    mode="cab",
                    title="Cab / Taxi (AC Sedan/Hatchback)",
                    subtitle="Comfortable & Private • Direct Route",
                    estimated_duration_min=driving_duration_min,
                    distance_km=actual_dist_km,
                    walking_distance_m=30,
                    transfers=0,
                    estimated_fare_inr=cab_fare,
                    fare_label=cab_label,
                    is_fare_estimated=True,
                    fare_breakdown=cab_breakdown,
                    data_source=driving_route["source"],
                    limitations=[
                        "Fare does not include peak surge or toll booths",
                        "Pickup waiting time typically 4-8 mins",
                    ],
                    coordinates=driving_route["coordinates"],
                    steps=[
                        RouteStep(
                            step_number=1,
                            mode="cab",
                            instruction=f"Board cab at {req.origin_name} and travel directly to {req.destination_name}",
                            instruction_hi=f"{req.origin_name} पर कैब लें और सीधे {req.destination_name} पहुंचें",
                            instruction_kn=f"{req.origin_name} ನಲ್ಲಿ ಕ್ಯಾಬ್ ಹತ್ತಿ ನೇರವಾಗಿ {req.destination_name} ತಲುಪಿ",
                            distance_meters=round(actual_dist_km * 1000),
                            duration_minutes=driving_duration_min,
                            from_name=req.origin_name,
                            to_name=req.destination_name,
                        )
                    ],
                )
            )

            # 5. Bike Taxi
            bike_dur = max(6, round(driving_duration_min * 0.85))
            bike_fare, bike_label, bike_breakdown = TransitService.calculate_transit_fare(actual_dist_km, "bike")
            options.append(
                RouteOption(
                    id="bike_taxi",
                    mode="bike",
                    title="Bike Taxi / Two-Wheeler",
                    subtitle="Quickest in Peak Traffic • Single Rider",
                    estimated_duration_min=bike_dur,
                    distance_km=actual_dist_km,
                    walking_distance_m=20,
                    transfers=0,
                    estimated_fare_inr=bike_fare,
                    fare_label=bike_label,
                    is_fare_estimated=True,
                    fare_breakdown=bike_breakdown,
                    data_source="Aggregator Bike Tariff Model",
                    limitations=["Single passenger only", "Helmet mandatory", "Not suitable during rain"],
                    coordinates=driving_route["coordinates"],
                    steps=[
                        RouteStep(
                            step_number=1,
                            mode="bike",
                            instruction=f"Meet bike rider at {req.origin_name} and ride to {req.destination_name}",
                            instruction_hi=f"{req.origin_name} पर बाइक टैक्सी लें और {req.destination_name} पहुंचें",
                            instruction_kn=f"{req.origin_name} ನಲ್ಲಿ ಬೈಕ್ ಟ್ಯಾಕ್ಸಿ ತೆಗೆದುಕೊಂಡು {req.destination_name} ತಲುಪಿ",
                            distance_meters=round(actual_dist_km * 1000),
                            duration_minutes=bike_dur,
                            from_name=req.origin_name,
                            to_name=req.destination_name,
                        )
                    ],
                )
            )

            # 6. Walking (only for short distances < 3.5 km)
            if walking_route and walking_route["distance_km"] <= 3.5:
                options.append(
                    RouteOption(
                        id="pedestrian_walk",
                        mode="walk",
                        title="Direct Walking Route",
                        subtitle="Zero Cost • Pedestrian Footpath",
                        estimated_duration_min=walking_route["duration_minutes"],
                        distance_km=walking_route["distance_km"],
                        walking_distance_m=round(walking_route["distance_meters"]),
                        transfers=0,
                        estimated_fare_inr=0.0,
                        fare_label="₹0 (Free)",
                        is_fare_estimated=False,
                        fare_breakdown="Pedestrian footpath route",
                        data_source=walking_route["source"],
                        limitations=["Watch for unpaved footpaths and road crossings"],
                        coordinates=walking_route["coordinates"],
                        steps=[
                            RouteStep(
                                step_number=1,
                                mode="walk",
                                instruction=f"Walk along designated footpaths from {req.origin_name} to {req.destination_name}",
                                instruction_hi=f"{req.origin_name} से {req.destination_name} तक पैदल चलें",
                                instruction_kn=f"{req.origin_name} ನಿಂದ {req.destination_name} ವರೆಗೆ ನಡೆದುಕೊಂಡು ಹೋಗಿ",
                                distance_meters=round(walking_route["distance_meters"]),
                                duration_minutes=walking_route["duration_minutes"],
                                from_name=req.origin_name,
                                to_name=req.destination_name,
                            )
                        ],
                    )
                )

        # 3. Ranking Algorithm based on User's chosen priority
        # Priorities: "lowest_cost", "shortest_time", "less_walking", "fewer_transfers"
        for opt in options:
            cost = opt.estimated_fare_inr or 0.0
            dur = opt.estimated_duration_min
            walk = opt.walking_distance_m
            transfers = opt.transfers

            if req.priority == "lowest_cost":
                score = cost * 1.0 + dur * 0.15 + walk * 0.02 + transfers * 15.0
            elif req.priority == "shortest_time":
                score = dur * 1.5 + cost * 0.1 + walk * 0.03 + transfers * 20.0
            elif req.priority == "less_walking":
                score = walk * 0.15 + dur * 0.6 + cost * 0.2 + transfers * 30.0
            elif req.priority == "fewer_transfers":
                score = transfers * 50.0 + dur * 0.8 + cost * 0.2 + walk * 0.02
            else:
                score = cost * 0.5 + dur * 0.5

            # If user has a hard budget limit, penalize options exceeding it
            if req.budget_limit_inr and cost > req.budget_limit_inr:
                score += 500.0

            opt.ranking_score = round(score, 2)

        options.sort(key=lambda o: o.ranking_score)

        # Assign friendly badges
        cheapest_opt = min(options, key=lambda o: o.estimated_fare_inr if o.estimated_fare_inr is not None else 9999)
        fastest_opt = min(options, key=lambda o: o.estimated_duration_min)

        for opt in options:
            if opt.id == cheapest_opt.id and (opt.estimated_fare_inr or 0) <= 50:
                opt.ranking_badge = "Lowest Cost"
            elif opt.id == fastest_opt.id:
                opt.ranking_badge = "Fastest"

        # The top ranked option becomes Recommended
        if options:
            options[0].ranking_badge = "Recommended"

        chosen_option = options[0]

        # 4. Interview & Appointment Departure Calculator
        purpose_buffers = {
            "interview": 35,  # 35 min buffer for interview security, docs, freshening up
            "exam": 45,       # 45 min buffer for exam hall gate closure
            "appointment": 25,
            "work": 15,
            "other": 20,
        }
        chosen_buffer = req.custom_buffer_minutes or purpose_buffers.get(req.purpose.lower(), 30)

        # Add extra time if user explicitly requested breakfast or freshening up
        if req.needs_breakfast:
            chosen_buffer += 20
        if req.needs_freshen_up:
            chosen_buffer += 15

        dep_time, traffic_warning = calculate_departure_time(
            req.arrival_time,
            chosen_option.estimated_duration_min,
            chosen_buffer,
        )

        buffer_rationale = (
            f"{chosen_buffer} mins safety buffer includes {purpose_buffers.get(req.purpose.lower(), 25)} mins for "
            f"{req.purpose.title()} arrival protocol"
        )
        if req.needs_breakfast:
            buffer_rationale += ", 20 mins for breakfast/tiffin"
        if req.needs_freshen_up:
            buffer_rationale += ", 15 mins to freshen up"

        arrival_summary = InterviewBufferSummary(
            required_arrival_time=req.arrival_time,
            suggested_departure_time=dep_time,
            estimated_journey_duration_min=chosen_option.estimated_duration_min,
            safety_buffer_min=chosen_buffer,
            buffer_rationale=buffer_rationale,
            traffic_peak_warning=traffic_warning,
            data_limitation_warning=(
                "Travel times are calculated from road network models and typical transit frequencies. "
                "Unexpected traffic gridlock, weather, or train delays are not included. Plan departure accordingly."
            ),
        )

        # 5. Nearby recommendations summary based on destination
        nearby_summary = {
            "destination_name": req.destination_name,
            "has_breakfast_needed": req.needs_breakfast,
            "has_freshen_up_needed": req.needs_freshen_up,
            "has_waiting_needed": req.needs_waiting_place,
            "note": "Click 'Nearby Facilities' tab to view verified toilets, tiffin centres, and waiting spots.",
        }

        return JourneyPlanResponse(
            plan_id=str(uuid.uuid4())[:8],
            purpose=req.purpose,
            arrival_calculator=arrival_summary,
            ranked_routes=options,
            selected_route=chosen_option,
            nearby_recommendations_summary=nearby_summary,
            honest_disclaimer=(
                "ThenStep Honest Data Notice: All transit fares and arrival times are transparent estimates. "
                "No live GPS tracking is simulated. Facilities distinguish between verified public and commercial access."
            ),
        )
