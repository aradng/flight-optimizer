from typing import Any
import httpx
from datetime import date
import pandas as pd
from itertools import product

from flight_optimizer.schemas import FligtOptimizerInput

headers = {
    "User-Agent": "PostMan",
}


async def fetch_airport_code(query: str) -> list[dict[str, Any]]:
    async with httpx.AsyncClient() as client:
        r = await client.get(
            "https://ws.alibaba.ir/api/v1/basic-info/airports/international",
            headers=headers,
            params={"filter": f"q={{ct: '{query}'}}"},
        )
        r.raise_for_status()
    return list(
        map(
            lambda x: {
                "code": x["iataCode"],
                "name": x["name"],
                "city": x["city"]["name"],
                "country": x["city"]["country"]["name"],
            },
            r.json()["result"]["items"],
        )
    )


class FlightOptimizer:
    from_date: date
    to_date: date
    passengers: int
    min_days: int
    max_days: int
    origins: list[str]
    destinations: list[str]

    def __init__(self, flight_input: FligtOptimizerInput):
        self.from_date = flight_input.from_date
        self.to_date = flight_input.to_date
        self.passengers = flight_input.passengers
        self.min_days = flight_input.min_days
        self.max_days = flight_input.max_days
        self.origins = flight_input.origins
        self.destinations = flight_input.destinations

    async def fetch_proposal(self, origin: str, destination: str) -> str:
        url = "https://ws.alibaba.ir/api/v1/flights/international/proposal-requests"
        body = {
            "infant": 0,
            "child": 0,
            "adult": self.passengers,
            "departureDate": self.from_date.isoformat(),
            "origin": origin,
            "destination": destination,
            "flightClass": "economy",
            "userVariant": "MARGIN-CONTROL-V2",
            "isReIssueRequest": False,
        }
        async with httpx.AsyncClient() as client:
            r = await client.post(
                url,
                json=body,
                headers=headers,
            )
            r.raise_for_status()
            return r.json()["result"]["requestId"]

    async def fetch_calendar(
        self, proposal_id: str, offset: int = 0
    ) -> list[dict]:
        url = f"https://ws.alibaba.ir/api/v1/flights/international/proposal/{proposal_id}/calender"
        body = {
            "offset": offset,
            "limit": 10,
        }
        async with httpx.AsyncClient() as client:

            r = await client.post(
                url,
                json=body,
                headers=headers,
            )
            r.raise_for_status()
            return r.json()["result"]["calenderDataLists"]

    def filter_calendar(self, flights: list[dict]) -> list[dict[str, Any]]:
        df = pd.DataFrame(
            map(
                lambda x: {
                    "price": x["price"],
                    "jdate": x["departurePersianDate"],
                    "date": x["departureDate"],
                    "unavailable": x["isEmpty"]
                    or x["isDisabled"]
                    or "empty" in x["class"],
                },
                flights,
            )
        )
        df["date"] = pd.to_datetime(df["date"])
        df.set_index("date", inplace=True)
        df.sort_index(ascending=True, inplace=True)
        df = df[~df["unavailable"]]
        df["price"] = df["price"]
        return df.loc[
            pd.Timestamp(self.from_date) : pd.Timestamp(self.to_date)
        ]

    async def fetch_flights(
        self, destinations: list[str], origins: list[str]
    ) -> pd.DataFrame:
        records_count = ((self.to_date - self.from_date).days + 9) // 10
        flights = []
        for destination, origin in product(destinations, origins):
            porposal_id = await self.fetch_proposal(origin, destination)
            dep_flights = pd.concat(
                [
                    self.filter_calendar(
                        await self.fetch_calendar(porposal_id, offset)
                    )
                    for offset in range(records_count)
                ]
            )
            dep_flights["origin"] = origin
            dep_flights["destination"] = destination
            flights.append(dep_flights)
        return pd.concat(flights)

    def generate_round_trips(
        self, departures: pd.DataFrame, arrivals: pd.DataFrame
    ) -> pd.DataFrame:
        departures = (
            departures.groupby("date")[
                ["price", "origin", "destination", "jdate"]
            ]
            .min()
            .reset_index()
        )
        arrivals = (
            arrivals.groupby("date")[
                ["price", "origin", "destination", "jdate"]
            ]
            .min()
            .reset_index()
        )
        round_trips = departures.merge(
            arrivals, how="cross", suffixes=("_departure", "_arrival")
        )
        round_trips = round_trips[
            round_trips["date_arrival"] - round_trips["date_departure"]
            >= pd.Timedelta(days=self.min_days)
        ]
        round_trips = round_trips[
            round_trips["date_arrival"] - round_trips["date_departure"]
            <= pd.Timedelta(days=self.max_days)
        ]
        round_trips["total_price"] = (
            round_trips["price_departure"] + round_trips["price_arrival"]
        )
        return round_trips[
            [
                "origin_departure",
                "destination_departure",
                "origin_arrival",
                "destination_arrival",
                "jdate_departure",
                "jdate_arrival",
                "date_departure",
                "date_arrival",
                "price_departure",
                "price_arrival",
                "total_price",
            ]
        ].sort_values(by=["total_price"], ascending=[True])

    async def calculate_flights(self) -> pd.DataFrame:
        departures = await self.fetch_flights(self.origins, self.destinations)
        arrivals = await self.fetch_flights(self.destinations, self.origins)
        return self.generate_round_trips(
            departures=departures,
            arrivals=arrivals,
        ).to_dict(orient="records")
