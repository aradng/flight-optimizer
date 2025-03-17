from pydantic import BaseModel, Field
from datetime import date


class FligtOptimizerInput(BaseModel):
    from_date: date
    to_date: date
    passengers: int = Field(ge=1)
    min_days: int = Field(ge=1)
    max_days: int = Field(ge=1)
    origins: list[str]
    destinations: list[str]


class FlightOptimizerOutput(BaseModel):
    jdate_dep: str
    jdate_arr: str
    trip_info: str
    price_dep: float
    price_arr: float
    total_price: float
