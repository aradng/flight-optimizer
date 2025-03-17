from fastapi import APIRouter

from flight_optimizer.repository import (
    FlightOptimizer,
    fetch_airport_code,
)
from flight_optimizer.schemas import FligtOptimizerInput

router = APIRouter()


@router.get("/airports")
async def get_airports(q: str):
    return await fetch_airport_code(q)


@router.post("/flights")
async def get_flights(flight_input: FligtOptimizerInput):
    return await FlightOptimizer(flight_input).calculate_flights()
