"""The record types: each record is the dict from the JSON file, typed with these.

They follow the JSON Schemas in schema/ (and the zod schemas they're built from); the tests check
every record against them. Keys are as in the JSON, so camelCase: `validFrom`, `postalCode`.
"""

from typing import Literal, NotRequired, TypeAlias, TypedDict

Locale: TypeAlias = Literal['nl', 'fr', 'de']

CourtType: TypeAlias = Literal[
    'justice-of-the-peace',
    'police-court',
    'court-of-first-instance',
    'enterprise-court',
    'labour-court',
    'court-of-appeal',
    'labour-court-of-appeal',
    'court-of-assize',
]

CourtKind: TypeAlias = Literal['court', 'division', 'seat']

ContactType: TypeAlias = Literal['phone', 'fax', 'email', 'bank-account']

InterestType: TypeAlias = Literal['legal', 'commercial']


class Translated(TypedDict):
    """A name in the three national languages"""

    nl: str
    fr: str
    de: str


class Bilingual(TypedDict):
    """A name as the Judicial Code gives it, in Dutch and French"""

    nl: str
    fr: str


class PartialTranslated(TypedDict, total=False):
    """A name, or a page, in the national languages it's published in"""

    nl: str
    fr: str
    de: str


class SourceRef(TypedDict):
    """Where a record's data was taken from"""

    url: str
    """The exact official page or file the data comes from"""
    retrieved: str
    """Day the source was last checked, YYYY-MM-DD"""


class Validity(TypedDict, total=False):
    """When a record applies, both days included. No `validTo`: it still applies."""

    validFrom: str
    """First day the record applies, YYYY-MM-DD. None: since before the dataset's coverage."""
    validTo: str
    """Last day the record applies, YYYY-MM-DD"""


class Address(TypedDict):
    """A postal address, as published"""

    building: NotRequired[str]
    street: str
    """The street line as published, with its number, box or floor: 'Kazernevest 3'"""
    postalCode: str
    city: str
    municipality: NotRequired[str]
    """The municipality the postal code belongs to, by REFNIS code; missing when the code is
    shared by two municipalities and the city line doesn't name one"""


class Contact(TypedDict):
    type: ContactType
    value: str
    """Phone and fax in E.164 ('+3292343210'), email lowercase, bank account as an IBAN"""
    label: NotRequired[str]
    """The registry or service the contact belongs to, as the source titles it"""
    note: NotRequired[str]


class JudicialArea(Validity):
    """Area of a court of appeal (rechtsgebied): Antwerpen, Brussel, Gent, Luik or Bergen"""

    id: str
    name: Translated


class Arrondissement(Validity):
    """A judicial arrondissement"""

    id: str
    name: Translated
    judicialArea: str


class Region(Validity):
    """One of the three regions, by REFNIS code: '02000', '03000', '04000'"""

    id: str
    name: Translated
    sources: list[SourceRef]


class Province(Validity):
    """One of the ten provinces, by REFNIS code. The Brussels-Capital Region has none."""

    id: str
    name: Translated
    region: str
    sources: list[SourceRef]


class Municipality(Validity):
    """A municipality, as Statbel lists it, by REFNIS code"""

    id: str
    name: Bilingual
    province: str
    """REFNIS code of the province; '04000' (the region) for the 19 of Brussels-Capital"""
    region: str


class LegalBasis(TypedDict):
    url: str
    """The law's ELI"""
    provision: str


class CantonName(TypedDict):
    nl: str
    fr: str
    de: NotRequired[str]


class CantonMunicipality(TypedDict):
    municipality: str
    partial: NotRequired[bool]
    """The municipality is split over several cantons: `territory` says which part is this one's"""


class Canton(Validity):
    """A judicial canton: the area of one justice of the peace"""

    id: str
    arrondissement: str
    name: CantonName
    number: NotRequired[int]
    seat: Bilingual
    municipalities: list[CantonMunicipality]
    territory: Bilingual
    """The canton's area, verbatim from the annex to the Judicial Code"""
    legalBasis: LegalBasis
    sources: NotRequired[list[SourceRef]]


class Court(Validity):
    """A court, a division of one, or one of the seats of a justice of the peace"""

    id: str
    type: CourtType
    kind: CourtKind
    court: NotRequired[str]
    """For a division or seat: the court it belongs to"""
    name: PartialTranslated
    label: NotRequired[Translated]
    """For a justice of the peace (not its seats): a label built from its canton,
    'Vredegerecht 1e kanton Gent', as `format_court_name(court, locale, 'canton')` gives it. Not
    the court's official name."""
    judicialArea: str
    arrondissement: NotRequired[str]
    canton: NotRequired[str]
    """For a justice of the peace: the canton it serves"""
    cantons: NotRequired[list[str]]
    """For a court other than a justice of the peace: the cantons it covers. For a division of a
    court of first instance, enterprise or labour court or labour court of appeal: the cantons
    wholly in its area, as the royal decrees under art. 186 of the Judicial Code set it"""
    municipalities: NotRequired[list[str]]
    """For a division whose area takes only part of a canton: those municipalities, by REFNIS
    code"""
    ecli: NotRequired[list[str]]
    address: NotRequired[Address]
    contacts: list[Contact]
    openingHours: NotRequired[str]
    """In OpenStreetMap `opening_hours` syntax"""
    openingHoursText: NotRequired[PartialTranslated]
    website: PartialTranslated
    sources: list[SourceRef]


class Prison(Validity):
    """A prison or detention house of the FPS Justice"""

    id: str
    kind: Literal['prison', 'detention-house']
    name: PartialTranslated
    address: Address
    contacts: list[Contact]
    website: PartialTranslated
    sources: list[SourceRef]


class HouseOfJustice(Validity):
    """A house of justice (justitiehuis, maison de justice), run by a Community"""

    id: str
    community: Literal['flemish', 'french', 'german']
    name: PartialTranslated
    ovo: NotRequired[str]
    address: Address
    contacts: list[Contact]
    website: PartialTranslated
    sources: list[SourceRef]


class PoliceZone(Validity):
    """A police zone (politiezone, zone de police): id is its official number, e.g. '5415'"""

    id: str
    name: Translated
    alias: NotRequired[str]
    municipalities: list[str]
    sources: list[SourceRef]


class PostalCode(Validity):
    """A postal code and one of the municipalities it belongs to: id '9000-44021'"""

    id: str
    postalCode: str
    municipality: str


Position: TypeAlias = list[float]
"""Longitude, then latitude, in decimal degrees (WGS 84)"""

Ring: TypeAlias = list[Position]


class MultiPolygon(TypedDict):
    type: Literal['MultiPolygon']
    coordinates: list[list[Ring]]


class CantonCode(TypedDict):
    nl: str
    fr: str


class CantonBoundary(Validity):
    """The boundary of a judicial canton, as the NGI digitised it. The `territory` text is the
    law; where the two disagree, the text wins."""

    id: str
    canton: str
    ngiId: str
    cantonCode: CantonCode
    geometry: MultiPolygon
    sources: list[SourceRef]


class ArrondissementBoundary(Validity):
    """The boundary of a judicial arrondissement, as the NGI digitised it: the union of its
    cantons' boundaries. The legal text is the law; where the two disagree, the text wins."""

    id: str
    arrondissement: str
    ngiId: str
    geometry: MultiPolygon
    sources: list[SourceRef]


class Point(TypedDict):
    type: Literal['Point']
    coordinates: Position


class CourtLocation(Validity):
    """Where a court is on the map: a point the NGI publishes for each justice of the peace, kept
    only where the NGI's address and the court's own agree on the house number"""

    id: str
    court: str
    ngiId: str
    address: str
    """The address the NGI gives with the point, as published: 'Neerstraat 11'"""
    geometry: Point
    sources: list[SourceRef]


InterestRatePeriod = TypedDict(
    'InterestRatePeriod',
    {
        'from': str,
        'to': str,
        'rate': float,
        'rateForContractsBefore20130316': NotRequired[float],
        'note': NotRequired[str],
    },
)


class InterestRateSeries(TypedDict):
    description: str
    source: str
    periods: list[InterestRatePeriod]


class InterestRates(TypedDict):
    legal: InterestRateSeries
    commercial: InterestRateSeries


PublicHolidayId: TypeAlias = Literal[
    'new-year',
    'easter-monday',
    'labour-day',
    'ascension',
    'whit-monday',
    'national-day',
    'assumption',
    'all-saints',
    'armistice',
    'christmas',
]


class FixedDayRule(TypedDict):
    """The same day every year"""

    type: Literal['fixed']
    month: int
    day: int


class EasterRule(TypedDict):
    """A number of days after Easter Sunday (Gregorian calendar)"""

    type: Literal['easter']
    daysAfterEaster: int


class PublicHolidayDefinition(TypedDict):
    id: PublicHolidayId
    name: Translated
    rule: FixedDayRule | EasterRule


class PublicHolidayReplacement(TypedDict):
    """A year in which a holiday was moved to another day by royal decree"""

    holiday: PublicHolidayId
    replaces: str
    day: str
    legalBasis: str


class PublicHolidays(TypedDict):
    description: str
    legalBasis: str
    fromYear: int
    holidays: list[PublicHolidayDefinition]
    replacements: list[PublicHolidayReplacement]


ProceduralIndemnityTariffId: TypeAlias = Literal[
    'general',
    'labour-court-president',
    'labour-court',
    'labour-court-of-appeal',
]


class ProceduralIndemnityAmounts(TypedDict):
    """The minimum, base and maximum amount in euro"""

    min: float
    base: float
    max: float


class ProceduralIndemnityBracket(ProceduralIndemnityAmounts):
    """One bracket of a tariff, with its amounts as the KB sets them (not indexed)"""

    upTo: float | None
    """Highest value of the claim in the bracket in euro, inclusive; None for the last"""


class ProceduralIndemnityTariff(TypedDict):
    id: ProceduralIndemnityTariffId
    name: Translated
    article: str
    brackets: list[ProceduralIndemnityBracket]
    nonMonetary: ProceduralIndemnityAmounts


ProceduralIndemnityStepsIndexation = TypedDict(
    'ProceduralIndemnityStepsIndexation',
    {
        'from': str,
        'method': Literal['steps'],
        'threshold': float,
        'multiplier': float,
        'note': NotRequired[str],
    },
)
"""Art. 8 before the KB of 16 May 2024: 10 % more or less for every 10 index points"""

ProceduralIndemnityFormulaIndexation = TypedDict(
    'ProceduralIndemnityFormulaIndexation',
    {
        'from': str,
        'method': Literal['formula'],
        'threshold': float,
        'index': float,
        'note': NotRequired[str],
    },
)
"""Art. 8 as amended by the KB of 16 May 2024: the amount times the new index, divided by the
start index"""


class ProceduralIndemnities(TypedDict):
    description: str
    legalBasis: str
    startIndex: float
    tariffs: list[ProceduralIndemnityTariff]
    indexations: list[ProceduralIndemnityStepsIndexation | ProceduralIndemnityFormulaIndexation]
