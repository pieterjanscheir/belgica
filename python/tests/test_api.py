"""The examples from the README, and the errors"""

import json
import tomllib
from datetime import date, datetime
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
    assert belgica.to_day(datetime(2025, 3, 1, 23, 59)) == '2025-03-01'
    assert belgica.to_day('2025-03-01T10:00:00Z') == '2025-03-01'
    for bad in ('2013-1-15', '2013-02-30', 'yesterday', ''):
        with pytest.raises(ValueError):
            belgica.to_day(bad)


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
