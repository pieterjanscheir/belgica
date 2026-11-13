"""The same answers as the TypeScript package, for every municipality, postal code, canton and
court, a grid of points and a run of days. The cases come from `pnpm build:cases`, which runs the
built TypeScript helpers; CI makes them before these tests run, and locally they're skipped until
you do."""

import json
import os
from collections.abc import Sequence
from datetime import date
from pathlib import Path
from typing import Any

import pytest

import belgica

CASES = Path(__file__).parent / '.cases' / 'parity.json'

if not CASES.exists():
    if os.environ.get('CI'):
        raise RuntimeError(f'{CASES} is missing: run `pnpm build && pnpm build:cases` first')
    pytest.skip(
        'run `pnpm build && pnpm build:cases` for the parity cases', allow_module_level=True
    )

cases: dict[str, Any] = json.loads(CASES.read_text(encoding='utf-8'))


def ids(records: Sequence[Any]) -> list[str]:
    return [record['id'] for record in records]


def test_the_cases_are_from_today() -> None:
    # The cases answer for the data of the day they were made, as the helpers do without `on`
    assert cases['today'] == date.today().isoformat()


def test_coverage() -> None:
    assert cases['coverage'] == {
        'territory': belgica.TERRITORY_COVERAGE_FROM,
        'courts': belgica.COURTS_COVERAGE_FROM,
        'postalCodes': belgica.POSTAL_CODES_COVERAGE_FROM,
        'prisons': belgica.PRISONS_COVERAGE_FROM,
        'housesOfJustice': belgica.HOUSES_OF_JUSTICE_COVERAGE_FROM,
        'cantonBoundaries': belgica.CANTON_BOUNDARIES_COVERAGE_FROM,
        'arrondissementBoundaries': belgica.ARRONDISSEMENT_BOUNDARIES_COVERAGE_FROM,
        'courtLocations': belgica.COURT_LOCATIONS_COVERAGE_FROM,
        'policeZones': belgica.POLICE_ZONES_COVERAGE_FROM,
    }


def test_municipalities() -> None:
    for case in cases['municipalities']:
        id, on = case['id'], case['on']

        def entity(record: Any) -> str | None:
            return record['id'] if record else None

        actual = {
            'id': id,
            'on': on,
            'cantons': ids(belgica.get_cantons_for_municipality(id, on)),
            'arrondissement': entity(belgica.get_arrondissement_for_municipality(id, on)),
            'province': entity(belgica.get_province_for_municipality(id, on)),
            'region': entity(belgica.get_region_for_municipality(id, on)),
            'postalCodes': ids(belgica.get_postal_codes(id, on)),
            'justicesOfThePeace': [
                {'canton': c.canton['id'], 'court': c.court['id'], 'partial': c.partial}
                for c in belgica.find_justices_of_the_peace(id, on)
            ],
            'competentCourts': {
                type: ids(belgica.find_courts_with_jurisdiction(id, type, on))
                for type in case['competentCourts']
            },
            'divisions': {
                type: ids(belgica.find_divisions_with_jurisdiction(id, type, on))
                for type in case['divisions']
            },
        }
        assert actual == case


def test_police_zones() -> None:
    for case in cases['policeZones']:
        zone = belgica.find_police_zone(case['municipality'], cases['today'])
        assert (zone['id'] if zone else None) == case['zone']


def test_postal_codes() -> None:
    for case in cases['postalCodes']:
        code, on = case['postalCode'], case['on']
        assert ids(belgica.get_municipalities_for_postal_code(code, on)) == case['municipalities']
        assert [
            {
                'municipality': entry.municipality['id'],
                'justicesOfThePeace': [c.court['id'] for c in entry.justices_of_the_peace],
                'courts': ids(entry.courts),
            }
            for entry in belgica.find_courts_for_postal_code(code, 'police-court', on)
        ] == case['courts'], code


def test_cantons() -> None:
    for case in cases['cantons']:
        assert ids(belgica.get_courts_for_canton(case['id'], case['on'])) == case['courts']


def test_courts() -> None:
    for case in cases['courts']:
        court = belgica.get_court(case['id'])
        assert court is not None
        assert ids(belgica.get_divisions(case['id'], cases['today'])) == case['divisions']
        for key, name in case['names'].items():
            locale, style = key.split('/')
            assert belgica.format_court_name(court, locale, style) == name, (case['id'], key)


def test_find_courts() -> None:
    for case in cases['findCourts']:
        f = case['filter']
        found = belgica.find_courts(
            type=f.get('type'),
            kind=f.get('kind'),
            arrondissement=f.get('arrondissement'),
            judicial_area=f.get('judicialArea'),
            on=case['on'],
        )
        assert ids(found) == case['courts'], f


def test_interest_rates() -> None:
    for case in cases['interestRates']:
        result = belgica.get_interest_rate(
            case['date'], case['type'], contract_after_20130316=case['contractAfter20130316']
        )
        expected = case['result']
        actual = result and {
            'rate': result.rate,
            'period': {'from': result.period_from, 'to': result.period_to},
        }
        assert actual == expected, case
    for type, day in cases['latestKnownRateDate'].items():
        assert belgica.get_latest_known_rate_date(type) == day


def test_phone_numbers() -> None:
    for case in cases['phoneNumbers']:
        assert belgica.format_phone_number(case['e164']) == case['national']


def test_points() -> None:
    for case in cases['points']:
        lon, lat, on = case['longitude'], case['latitude'], case['on']
        assert ids(belgica.find_cantons_at(lon, lat, on)) == case['cantons'], case
        assert ids(belgica.find_arrondissements_at(lon, lat, on)) == case['arrondissements'], case


def test_court_locations() -> None:
    for case in cases['courtLocations']:
        assert belgica.get_court_location(case['id'], case['on']) == case['location'], case['id']
