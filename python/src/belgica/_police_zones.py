"""Police zones and the municipalities they cover"""

from functools import cache

from ._data import load
from ._territory import municipalities
from ._time import Day, applying_on, pick_version, versions_by_id
from .types import Municipality, PoliceZone

POLICE_ZONES_COVERAGE_FROM = '2026-11-02'
"""The police zones describe the situation from the day FOD Financiën's dataset was first read.
A zone that disappears in a merger keeps its number and gets a `validTo`; a new one gets a
`validFrom`. Lookups for an earlier day raise a `ValueError`."""

_DATASET = 'police zones'


@cache
def police_zones() -> tuple[PoliceZone, ...]:
    """Every record, every version"""
    return tuple(load('police-zones'))


@cache
def _indexes() -> tuple[
    dict[str, list[PoliceZone]],
    dict[str, list[PoliceZone]],
    dict[str, list[Municipality]],
]:
    by_municipality: dict[str, list[PoliceZone]] = {}
    for zone in police_zones():
        for municipality in zone['municipalities']:
            by_municipality.setdefault(municipality, []).append(zone)
    return versions_by_id(police_zones()), by_municipality, versions_by_id(municipalities())


def get_police_zone(id: str, on: Day | None = None) -> PoliceZone | None:
    """A police zone by its number, e.g. '5415' (Gent): today's version, or the one of a given
    day. `None` for an unknown number or one not in force that day."""
    return pick_version(_indexes()[0].get(id), on, POLICE_ZONES_COVERAGE_FROM, _DATASET)


def find_police_zone(municipality_id: str, on: Day | None = None) -> PoliceZone | None:
    """The police zone of a municipality on a day (today by default), by REFNIS code, e.g.
    '44021' for Gent. Every municipality is in exactly one zone; `None` for an unknown code."""
    zones = applying_on(
        _indexes()[1].get(municipality_id, []), on, POLICE_ZONES_COVERAGE_FROM, _DATASET
    )
    return zones[0] if zones else None


def get_police_zone_municipalities(id: str, on: Day | None = None) -> list[Municipality]:
    """The municipalities a police zone covers on a day (today by default), in REFNIS order"""
    zone = get_police_zone(id, on)
    found = []
    for code in zone['municipalities'] if zone else []:
        # Every zone links to municipalities of the same day (tests/test_data.py)
        municipality = pick_version(
            _indexes()[2].get(code), on, POLICE_ZONES_COVERAGE_FROM, _DATASET
        )
        if municipality:
            found.append(municipality)
    return found
