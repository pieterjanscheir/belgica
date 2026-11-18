# Python

The [`belgica` package on PyPI](https://pypi.org/project/belgica/) has the same data and lookups as
the npm package, with the same version number: the same version on PyPI and on npm holds the same
data. The tests check that both packages give the same answers for every municipality, postal
code, canton and court, for a grid of points over Belgium, and for the interest rates of every
month since 1969.

::: code-group

```bash [pip]
pip install belgica
```

```bash [uv]
uv add belgica
```

```bash [poetry]
poetry add belgica
```

:::

Python 3.11 or later, no dependencies. The data files are inside the package, so nothing is
downloaded at run time.

## Records

A record is the dict from the JSON file, with its keys as in the JSON: `validFrom`, `postalCode`,
`judicialArea`. The `TypedDict`s in `belgica.types` type them, so mypy and Pyright know
`court['address']['postalCode']` is a `str` and that `address` may be missing:

```python
from belgica import get_court
from belgica.types import Court

court: Court | None = get_court('justice-of-the-peace-gent-1')
if court and 'address' in court:
    print(court['address']['street'])
```

Each data file is read on first use and kept. The canton boundaries are 23 MB of JSON: only
`find_cantons_at`, `get_canton_boundary` and `canton_boundaries()` read them. The arrondissement
boundaries are read by `find_arrondissements_at`, `get_arrondissement_boundary` and
`arrondissement_boundaries()`, the court locations by `get_court_location` and
`court_locations()`.

Every dataset is a function that gives every record, every version: `courts()`, `cantons()`,
`municipalities()`, `postal_codes()`, `prisons()`, `houses_of_justice()`, `canton_boundaries()`,
`arrondissement_boundaries()`, `court_locations()`, `interest_rates()`, and so on. They give the same tuple of the same dicts on each call: copy a
record before changing it.

## Lookups

The functions are the npm package's, in snake case. Options are keyword arguments.

| npm                                                     | Python                                                        |
| ------------------------------------------------------- | ------------------------------------------------------------- |
| `getCourt(id, { on })`                                  | `get_court(id, on=None)`                                      |
| `findCourts({ type, kind, arrondissement }, { on })`    | `find_courts(type=…, kind=…, arrondissement=…, on=…)`         |
| `getCantonsForMunicipality(id, { on })`                 | `get_cantons_for_municipality(id, on=None)`                   |
| `findCourtsWithJurisdiction(id, type, { on })`          | `find_courts_with_jurisdiction(id, type, on=None)`            |
| `findCourtsForPostalCode(code, type, { on })`           | `find_courts_for_postal_code(code, type, on=None)`            |
| `findCantonsAt(lon, lat, { on })`                       | `find_cantons_at(lon, lat, on=None)`                          |
| `findArrondissementsAt(lon, lat, { on })`               | `find_arrondissements_at(lon, lat, on=None)`                  |
| `getCourtLocation(id, { on })`                          | `get_court_location(id, on=None)`                             |
| `formatCourtName(court, locale, { style })`             | `format_court_name(court, locale, style='official')`          |
| `getInterestRate(day, type, { contractAfter20130316 })` | `get_interest_rate(day, type, contract_after_20130316=False)` |

```python
from belgica import (
    find_cantons_at,
    find_courts_with_jurisdiction,
    find_courts_for_postal_code,
    find_justices_of_the_peace,
    format_court_name,
    get_cantons_for_municipality,
    get_contact,
    get_court,
    get_interest_rate,
)

[canton] = get_cantons_for_municipality('44088')  # merelbeke-melle
get_cantons_for_municipality('44021', on='2025-09-15')  # Gent 1–5: a split city
find_cantons_at(3.7268, 51.053)  # [gent-1]

for entry in find_justices_of_the_peace('44021'):
    print(entry.canton['id'], entry.court['id'], entry.partial)

find_courts_with_jurisdiction('23088', 'police-court')  # [police-court-vilvoorde]
for entry in find_courts_for_postal_code('1040', 'police-court'):  # Brussel and Etterbeek
    print(entry.municipality['name']['nl'], [c['id'] for c in entry.courts])

court = get_court('court-of-appeal-liege')
get_contact(court, 'email', 'Greffe pénal')  # 'liege.ca.greffepenal@just.fgov.be'
format_court_name(get_court('justice-of-the-peace-gent-1'), 'fr', 'canton')  # 'Justice de paix 1er canton Gand'

get_interest_rate('2024-06-15', 'legal')
# InterestRateResult(rate=5.75, period_from='2024-01-01', period_to='2024-12-31')
```

The results the helpers build are frozen dataclasses: `CantonCourt` (`canton`, `court`,
`partial`), `PostalCodeCourts` (`municipality`, `justices_of_the_peace`, `courts`) and
`InterestRateResult` (`rate`, `period_from`, `period_to`).

## Days

`on` takes a `datetime.date`, a `datetime` (its calendar day) or a `'YYYY-MM-DD'` string, and is
today in Belgium (Europe/Brussels) without it, whatever the machine's time zone; `today()` gives
that day as `'YYYY-MM-DD'`. A lookup by id without `on` always finds a known record, as it is
today; with `on`, the version of that day, or `None`. A day before a dataset's coverage raises a
`ValueError`, as does a string that isn't a valid day: the data can't answer for a day before it
starts, and a guess would look like an answer. The coverage is in `TERRITORY_COVERAGE_FROM`,
`COURTS_COVERAGE_FROM` and the other `*_COVERAGE_FROM` constants.

## Not in Python yet

The calendar functions (`getPublicHolidays`, `nextWorkingDay`, `isJudicialHoliday`, …) and the
loaders of `belgica/courts/load`, which exist for browser bundles, have no Python version.
The package does include `public-holidays.json`, the rules the calendar functions read, and
`belgica.types` types it.

See [design decisions](./design) for why the functions work this way, and the
[API reference](../api) for what each one does: the Python functions do the same.
