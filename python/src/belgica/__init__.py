"""Belgian legal reference data: courts, judicial cantons and arrondissements, municipalities and
postal codes, police zones, prisons, houses of justice, and legal and commercial interest rates.

The records are the dicts from the JSON files, typed in `belgica.types`. Each data file is read
on first use. Lookups take `on`, a day as a `date` or 'YYYY-MM-DD', and give today's answer
without it. Documentation: https://pieterjanscheir.github.io/belgica/guide/python
"""

from ._arrondissement_boundaries import (
    ARRONDISSEMENT_BOUNDARIES_COVERAGE_FROM,
    arrondissement_boundaries,
    find_arrondissements_at,
    get_arrondissement_boundary,
)
from ._canton_boundaries import (
    CANTON_BOUNDARIES_COVERAGE_FROM,
    canton_boundaries,
    find_cantons_at,
    get_canton_boundary,
)
from ._contacts import format_iban, format_phone_number, get_contact
from ._court_locations import COURT_LOCATIONS_COVERAGE_FROM, court_locations, get_court_location
from ._courts import (
    COURTS_COVERAGE_FROM,
    courts,
    find_courts,
    format_court_name,
    get_court,
    get_courts_for_canton,
    get_divisions,
    get_justice_of_the_peace,
)
from ._interest_rates import (
    InterestRateResult,
    get_interest_rate,
    get_latest_known_rate_date,
    interest_rates,
)
from ._jurisdiction import (
    CantonCourt,
    PostalCodeCourts,
    find_competent_courts,
    find_courts_for_postal_code,
    find_courts_with_jurisdiction,
    find_divisions_with_jurisdiction,
    find_justices_of_the_peace,
)
from ._places import (
    HOUSES_OF_JUSTICE_COVERAGE_FROM,
    PRISONS_COVERAGE_FROM,
    get_house_of_justice,
    get_prison,
    houses_of_justice,
    prisons,
)
from ._police_zones import (
    POLICE_ZONES_COVERAGE_FROM,
    find_police_zone,
    get_police_zone,
    get_police_zone_municipalities,
    police_zones,
)
from ._postal_codes import (
    POSTAL_CODES_COVERAGE_FROM,
    get_municipalities_for_postal_code,
    get_postal_code,
    get_postal_codes,
    postal_codes,
)
from ._territory import (
    TERRITORY_COVERAGE_FROM,
    arrondissements,
    cantons,
    get_arrondissement,
    get_arrondissement_for_municipality,
    get_canton,
    get_cantons_for_municipality,
    get_judicial_area,
    get_municipality,
    get_province,
    get_province_for_municipality,
    get_region,
    get_region_for_municipality,
    judicial_areas,
    municipalities,
    provinces,
    regions,
)
from ._time import Day, applies_on, to_day

__all__ = [
    'ARRONDISSEMENT_BOUNDARIES_COVERAGE_FROM',
    'CANTON_BOUNDARIES_COVERAGE_FROM',
    'COURTS_COVERAGE_FROM',
    'COURT_LOCATIONS_COVERAGE_FROM',
    'HOUSES_OF_JUSTICE_COVERAGE_FROM',
    'POLICE_ZONES_COVERAGE_FROM',
    'POSTAL_CODES_COVERAGE_FROM',
    'PRISONS_COVERAGE_FROM',
    'TERRITORY_COVERAGE_FROM',
    'CantonCourt',
    'Day',
    'InterestRateResult',
    'PostalCodeCourts',
    'applies_on',
    'arrondissement_boundaries',
    'arrondissements',
    'canton_boundaries',
    'cantons',
    'court_locations',
    'courts',
    'find_arrondissements_at',
    'find_cantons_at',
    'find_competent_courts',
    'find_courts',
    'find_courts_for_postal_code',
    'find_courts_with_jurisdiction',
    'find_divisions_with_jurisdiction',
    'find_justices_of_the_peace',
    'find_police_zone',
    'format_court_name',
    'format_iban',
    'format_phone_number',
    'get_arrondissement',
    'get_arrondissement_boundary',
    'get_arrondissement_for_municipality',
    'get_canton',
    'get_canton_boundary',
    'get_cantons_for_municipality',
    'get_contact',
    'get_court',
    'get_court_location',
    'get_courts_for_canton',
    'get_divisions',
    'get_house_of_justice',
    'get_interest_rate',
    'get_judicial_area',
    'get_justice_of_the_peace',
    'get_latest_known_rate_date',
    'get_municipalities_for_postal_code',
    'get_municipality',
    'get_police_zone',
    'get_police_zone_municipalities',
    'get_postal_code',
    'get_postal_codes',
    'get_prison',
    'get_province',
    'get_province_for_municipality',
    'get_region',
    'get_region_for_municipality',
    'houses_of_justice',
    'interest_rates',
    'judicial_areas',
    'municipalities',
    'police_zones',
    'postal_codes',
    'prisons',
    'provinces',
    'regions',
    'to_day',
]
