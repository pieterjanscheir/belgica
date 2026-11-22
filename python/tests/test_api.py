"""The examples from the README, and the errors"""

import json
import tomllib
from datetime import UTC, date, datetime, timedelta, timezone
from pathlib import Path

import pytest

import belgica

ROOT = Path(__file__).parent.parent


def test_the_version_is_the_npm_version() -> None:
    pyproject = tomllib.loads((ROOT / 'pyproject.toml').read_text(encoding='utf-8'))
    package = json.loads((ROOT.parent / 'package.json').read_text(encoding='utf-8'))
    assert pyproject['project']['version'] == package['version']


def test_readme_examples() -> None:
    court = belgica.get_court('court-of-appeal-brussel')
    assert court is not None
    assert court['name'] == {'nl': 'Hof van Beroep Brussel', 'fr': "Cour d'appel de Bruxelles"}
    liege = belgica.get_court('court-of-appeal-liege')
    assert liege is not None
    assert (
        belgica.get_contact(liege, 'email', 'Greffe pénal') == 'liege.ca.greffepenal@just.fgov.be'
    )

    [canton] = belgica.get_cantons_for_municipality('44088')
    assert canton['id'] == 'merelbeke-melle'
    gent = belgica.get_cantons_for_municipality('44021', on='2025-09-15')
    assert [c['id'] for c in gent] == ['gent-1', 'gent-2', 'gent-3', 'gent-4', 'gent-5']
    assert [c['id'] for c in belgica.find_cantons_at(3.7268, 51.053)] == ['gent-1']
    assert [a['id'] for a in belgica.find_arrondissements_at(3.7268, 51.053)] == ['oost-vlaanderen']
    location = belgica.get_court_location('justice-of-the-peace-gent-1')
    assert location is not None and location['geometry']['type'] == 'Point'
    assert belgica.get_court_location('court-of-appeal-gent') is None
    assert [c['id'] for c in belgica.find_courts_with_jurisdiction('23088', 'police-court')] == [
        'police-court-vilvoorde'
    ]
    divisions = belgica.find_divisions_with_jurisdiction
    assert [c['id'] for c in divisions('31005', 'enterprise-court')] == [
        'enterprise-court-gent-brugge'
    ]
    # Pont-à-Celles goes to Charleroi, though the rest of its canton (Seneffe) goes to Binche
    assert [c['id'] for c in divisions('52055', 'labour-court')] == [
        'labour-court-hainaut-charleroi'
    ]
    assert [c['id'] for c in divisions('55085', 'labour-court')] == ['labour-court-hainaut-binche']
    assert [c['id'] for c in divisions('24062', 'court-of-first-instance')] == [
        'court-of-first-instance-leuven'
    ]
    assert [c['id'] for c in divisions('44021', 'police-court')] == [
        'police-court-oost-vlaanderen-gent'
    ]
    # Hulshout: Mechelen in civil cases, Turnhout in criminal ones, and both when it isn't said
    assert [c['id'] for c in divisions('13016', 'police-court', matter='civil')] == [
        'police-court-antwerpen-mechelen'
    ]
    assert [c['id'] for c in divisions('13016', 'police-court', matter='criminal')] == [
        'police-court-antwerpen-turnhout'
    ]
    assert [c['id'] for c in divisions('13016', 'court-of-first-instance')] == [
        'court-of-first-instance-antwerpen-mechelen',
        'court-of-first-instance-antwerpen-turnhout',
    ]
    assert [
        e.municipality['id'] for e in belgica.find_courts_for_postal_code('1040', 'police-court')
    ] == [
        '21004',
        '21005',
    ]

    rate = belgica.get_interest_rate('2024-06-15', 'legal')
    assert rate == belgica.InterestRateResult(5.75, '2024-01-01', '2024-12-31')
    commercial = belgica.get_interest_rate(
        date(2014, 6, 15), 'commercial', contract_after_20130316=True
    )
    assert commercial is not None and commercial.rate == 8.5


def test_format_court_name() -> None:
    court = belgica.get_justice_of_the_peace('gent-1')
    assert court is not None
    assert belgica.format_court_name(court, 'nl', 'canton') == 'Vredegerecht 1e kanton Gent'
    assert belgica.format_court_name(court, 'fr', 'canton') == 'Justice de paix 1er canton Gand'
    assert belgica.format_court_name(court, 'de', 'canton') == 'Friedensgericht 1. Kanton Gent'


def test_contacts() -> None:
    assert belgica.format_phone_number('+3292343210') == '09 234 32 10'
    assert belgica.format_phone_number('+3253820701') == '053 82 07 01'
    assert belgica.format_phone_number('+32470123456') == '0470 12 34 56'
    assert belgica.format_iban('BE73679200844560') == 'BE73 6792 0084 4560'
    with pytest.raises(ValueError):
        belgica.format_phone_number('092343210')


def test_days() -> None:
    assert belgica.to_day(date(2025, 3, 1)) == '2025-03-01'
    # Naive: a time in Belgium, so its calendar day
    assert belgica.to_day(datetime(2025, 3, 1, 23, 59)) == '2025-03-01'
    assert belgica.to_day('2025-03-01T10:00:00Z') == '2025-03-01'
    assert belgica.to_day('2024-12-31T23:30:00') == '2024-12-31'
    for bad in ('2013-1-15', '2013-02-30', 'yesterday', ''):
        with pytest.raises(ValueError):
            belgica.to_day(bad)


def test_an_instant_is_read_as_its_day_in_belgium() -> None:
    # #164: an aware datetime, or a string with an offset, is the same instant however written
    assert belgica.to_day(datetime(2024, 12, 31, 23, 30, tzinfo=UTC)) == '2025-01-01'
    assert belgica.to_day(datetime(2026, 6, 30, 21, 59, 59, tzinfo=UTC)) == '2026-06-30'
    eastern = timezone(timedelta(hours=-5))
    assert belgica.to_day(datetime(2024, 6, 15, 23, 30, tzinfo=eastern)) == '2024-06-16'
    assert belgica.to_day('2024-12-31T23:30:00Z') == '2025-01-01'
    assert belgica.to_day('2025-01-01T00:30:00+01:00') == '2025-01-01'
    assert belgica.to_day('2024-06-15T10:30:00Z') == '2024-06-15'
    assert belgica.to_day('2024-06-15T23:30:00-05:00') == '2024-06-16'
    for bad in (
        '2024-12-31T23:30:00+0100',
        '2024-12-31T23:30:00+01',
        '2024-12-31T23:30:00z',
        '2024-12-31T99:99Z',
        '2025-01-01T00:30:00+01:60',
        '2025-01-01T00:30:00+24:00',
        '2024-12-31T23:30:00+01:00:00',
        '2024-12-31T23:30:00+1:00',
        '2024-12-31T23:30:00+01:0',
    ):
        with pytest.raises(ValueError):
            belgica.to_day(bad)


def test_today_is_the_day_in_belgium() -> None:
    def utc(text: str) -> datetime:
        return datetime.fromisoformat(text).replace(tzinfo=UTC)

    assert belgica.today(utc('2026-11-18T22:59:59')) == '2026-11-18'
    assert belgica.today(utc('2026-11-18T23:00:00')) == '2026-11-19'
    assert belgica.today(utc('2026-12-31T23:30:00')) == '2027-01-01'
    assert belgica.today(utc('2026-06-30T21:59:59')) == '2026-06-30'
    assert belgica.today(utc('2026-06-30T22:00:00')) == '2026-07-01'
    assert belgica.today(utc('2026-03-28T23:30:00')) == '2026-03-29'
    assert belgica.today(utc('2026-10-24T22:30:00')) == '2026-10-25'
    # 1995: summer time ended on 24 September; 1976: none
    assert belgica.today(utc('1995-10-01T22:30:00')) == '1995-10-01'
    assert belgica.today(utc('1995-09-23T22:30:00')) == '1995-09-24'
    assert belgica.today(utc('1976-07-01T22:30:00')) == '1976-07-01'


def test_today_matches_europe_brussels() -> None:
    try:
        from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

        brussels = ZoneInfo('Europe/Brussels')
    except ZoneInfoNotFoundError:
        pytest.skip('no time zone database (tzdata) on this machine')
    for year in range(1947, 2041):
        for month, day in ((3, 25), (4, 1), (9, 23), (10, 25), (12, 31)):
            start = datetime(year, month, day, tzinfo=UTC)
            for hour in range(9 * 24):
                for offset in (timedelta(minutes=30), timedelta(minutes=59, seconds=59)):
                    now = start + timedelta(hours=hour) + offset
                    assert belgica.today(now) == now.astimezone(brussels).date().isoformat(), now


def test_a_day_before_the_coverage_raises() -> None:
    with pytest.raises(ValueError, match='2025-01-01 onwards'):
        belgica.get_cantons_for_municipality('44021', on='2024-12-31')
    with pytest.raises(ValueError):
        belgica.get_court('court-of-appeal-gent', on='2020-01-01')
    with pytest.raises(ValueError):
        belgica.find_cantons_at(float('nan'), 51.0)


def test_unknown_ids() -> None:
    assert belgica.get_court('nowhere') is None
    assert belgica.get_cantons_for_municipality('00000') == []
    assert belgica.find_courts_for_postal_code('0000', 'police-court') == []
    assert belgica.get_interest_rate('1900-01-01', 'legal') is None


def test_places() -> None:
    prison = belgica.get_prison('gevangenis-gent')
    assert prison is not None and prison['address']['postalCode'] == '9000'
    house = belgica.get_house_of_justice('justitiehuis-gent')
    assert house is not None and house['community'] == 'flemish'
