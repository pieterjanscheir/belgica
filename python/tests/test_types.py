"""Every record matches its TypedDict in belgica.types: no key missing, none unknown, and the
values of the type declared. The JSON Schemas check the data itself (pnpm test); this checks
that the Python types say the same."""

import json
import types as pytypes
from pathlib import Path
from typing import Any, Literal, NotRequired, Union, get_args, get_origin, get_type_hints

import pytest

from belgica import types

ROOT = Path(__file__).parent.parent.parent


def check(value: Any, hint: Any, path: str) -> None:
    origin = get_origin(hint)
    if origin is NotRequired:
        check(value, get_args(hint)[0], path)
    elif origin is Literal:
        assert value in get_args(hint), f'{path}: {value!r} not in {get_args(hint)}'
    elif origin in (Union, pytypes.UnionType):
        errors = []
        for option in get_args(hint):
            try:
                check(value, option, path)
                return
            except AssertionError as error:
                errors.append(str(error))
        raise AssertionError('; '.join(errors))
    elif origin is list:
        assert isinstance(value, list), f'{path}: expected a list'
        for i, item in enumerate(value):
            check(item, get_args(hint)[0], f'{path}[{i}]')
    elif isinstance(hint, type) and hasattr(hint, '__required_keys__'):
        assert isinstance(value, dict), f'{path}: expected an object'
        hints = get_type_hints(hint, include_extras=True)
        missing = hint.__required_keys__ - value.keys()
        unknown = value.keys() - hints.keys()
        assert not missing, f'{path}: missing {missing}'
        assert not unknown, f'{path}: not in {hint.__name__}: {unknown}'
        for key, item in value.items():
            check(item, hints[key], f'{path}.{key}')
    elif hint is float:
        assert isinstance(value, int | float) and not isinstance(value, bool), path
    else:
        assert isinstance(value, hint), f'{path}: expected {hint}, got {value!r}'


FILES = {
    'judicial-areas': types.JudicialArea,
    'arrondissements': types.Arrondissement,
    'regions': types.Region,
    'provinces': types.Province,
    'municipalities': types.Municipality,
    'cantons': types.Canton,
    'courts': types.Court,
    'prisons': types.Prison,
    'houses-of-justice': types.HouseOfJustice,
    'postal-codes': types.PostalCode,
    'police-zones': types.PoliceZone,
    'canton-boundaries': types.CantonBoundary,
    'arrondissement-boundaries': types.ArrondissementBoundary,
    'court-locations': types.CourtLocation,
}


@pytest.mark.parametrize('name', FILES)
def test_records_match_their_type(name: str) -> None:
    records = json.loads((ROOT / 'data' / f'{name}.json').read_text(encoding='utf-8'))
    for record in records:
        check(record, FILES[name], f'{name}:{record["id"]}')


def test_interest_rates_match_their_type() -> None:
    data = json.loads((ROOT / 'data' / 'interest-rates.json').read_text(encoding='utf-8'))
    check(data, types.InterestRates, 'interest-rates')


def test_public_holidays_match_their_type() -> None:
    data = json.loads((ROOT / 'data' / 'public-holidays.json').read_text(encoding='utf-8'))
    check(data, types.PublicHolidays, 'public-holidays')


def test_procedural_indemnities_match_their_type() -> None:
    data = json.loads((ROOT / 'data' / 'procedural-indemnities.json').read_text(encoding='utf-8'))
    check(data, types.ProceduralIndemnities, 'procedural-indemnities')


def test_every_data_file_has_a_type() -> None:
    names = {file.stem for file in (ROOT / 'data').glob('*.json')}
    assert names == {*FILES, 'interest-rates', 'public-holidays', 'procedural-indemnities'}
