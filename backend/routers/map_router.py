from fastapi import APIRouter, Depends
from api import models

router = APIRouter()

# Uzbek cities coordinates for job locations
UZBEK_CITIES = {
    "tashkent": {"lat": 41.2995, "lng": 69.2401, "name": "Toshkent"},
    "samarkand": {"lat": 39.6542, "lng": 66.9597, "name": "Samarqand"},
    "bukhara": {"lat": 39.7681, "lng": 64.4556, "name": "Buxoro"},
    "fergana": {"lat": 40.3863, "lng": 71.7868, "name": "Farg'ona"},
    "nukus": {"lat": 42.4531, "lng": 59.6101, "name": "Nukus"},
    "navoi": {"lat": 40.0846, "lng": 65.3488, "name": "Navoi"},
    "andijan": {"lat": 40.7831, "lng": 72.2397, "name": "Andijon"},
    "termiz": {"lat": 37.2241, "lng": 67.2820, "name": "Termiz"},
    "gulistan": {"lat": 40.4897, "lng": 68.7868, "name": "Guliston"},
    "karakalpakstan": {"lat": 43.0, "lng": 59.0, "name": "Qoraqalpog'iston"},
}

# Common location mappings
LOCATION_ALIASES = {
    "toshkent": "tashkent",
    "tashkent city": "tashkent",
    "samarkand": "samarkand",
    "samarqand": "samarkand",
    "bukhara": "bukhara",
    "buxoro": "bukhara",
    "fergana": "fergana",
    "fargona": "fergana",
    "nukus": "nukus",
    "navoi": "navoi",
    "andijan": "andijan",
    "andijon": "andijan",
    "termez": "termiz",
    "termiz": "termiz",
}


def get_coordinates(location: str):
    """Get coordinates for a location string"""
    if not location:
        return None

    location_lower = location.lower().strip()

    # Check direct match
    if location_lower in UZBEK_CITIES:
        return UZBEK_CITIES[location_lower]

    # Check aliases
    if location_lower in LOCATION_ALIASES:
        key = LOCATION_ALIASES[location_lower]
        return UZBEK_CITIES[key]

    # Partial match
    for key, data in UZBEK_CITIES.items():
        if key in location_lower or location_lower in key:
            return data

    return None


def get_all_cities():
    """Get list of all available cities"""
    return list(UZBEK_CITIES.values())


# Map endpoint for jobs with location
@router.get("/map-jobs")
async def get_jobs_for_map(
    location: str = None,
    job_type: str = None,
    radius_km: int = 50,
):
    """Get jobs formatted for map view"""
    # This will be combined with jobs router
    # For now return available cities
    return {
        "cities": get_all_cities(),
        "location_aliases": LOCATION_ALIASES,
        "message": "Vakansiyalarni xarita ko'rinishida ko'rish uchun Jobs API bilan integratsiya qiling",
    }
