# belgica

Belgian legal reference data for Python: every court with its registries' contacts, prisons,
houses of justice, judicial cantons and arrondissements, municipalities and their postal codes,
the police zones, and the legal and commercial interest rates. Every record says where it comes from, and the
scraped data is rebuilt from the official sources twice a week.

The same data and lookups as the [`belgica` npm package](https://www.npmjs.com/package/belgica),
with the same version number. The tests check that both give the same answers. The calendar
functions of the npm package (public holidays, next working day) aren't in Python yet.

```bash
pip install belgica
```

Python 3.11 or later, no dependencies. Documentation:
**https://pieterjanscheir.github.io/belgica/guide/python**

It's reference data, not legal advice: check the official sources before relying on it.

```python
from belgica import (
    find_arrondissements_at,
    find_cantons_at,
    find_courts_with_jurisdiction,
    find_courts,
    find_courts_for_postal_code,
    find_police_zone,
    get_cantons_for_municipality,
    get_contact,
    get_court,
    get_court_location,
    get_interest_rate,
    get_justice_of_the_peace,
)

get_court('court-of-appeal-brussel')['name']  # {'nl': 'Hof van Beroep Brussel', 'fr': "Cour d'appel de Bruxelles"}
get_contact(get_court('court-of-appeal-liege'), 'email', 'Greffe pénal')  # 'liege.ca.greffepenal@just.fgov.be'
find_courts(type='enterprise-court', arrondissement='west-vlaanderen')

[canton] = get_cantons_for_municipality('44088')  # merelbeke-melle
get_justice_of_the_peace(canton['id'])['address']  # where to file
get_cantons_for_municipality('44021', on='2025-09-15')  # Gent 1–5 on that day: a split city
find_cantons_at(3.7268, 51.053)  # [gent-1]: the canton of a point
find_arrondissements_at(3.7268, 51.053)  # [oost-vlaanderen]: and its arrondissement
get_court_location('justice-of-the-peace-gent-1')['geometry']  # the court on the map, a GeoJSON Point
find_courts_with_jurisdiction('23088', 'police-court')  # [police-court-vilvoorde]: which court, by REFNIS code
find_courts_for_postal_code('1040', 'police-court')  # per municipality: Brussel and Etterbeek share the code
find_police_zone('44021')['id']  # '5415': the police zone of Gent

get_interest_rate('2024-06-15', 'legal')  # InterestRateResult(rate=5.75, period_from='2024-01-01', period_to='2024-12-31')
```

The records are the dicts from the JSON files, with their keys as in the JSON (`validFrom`,
`postalCode`), typed with the `TypedDict`s in `belgica.types`. Each data file is read on first
use; the canton boundaries (23 MB) only by `find_cantons_at` and `get_canton_boundary`, the
arrondissement boundaries only by `find_arrondissements_at` and `get_arrondissement_boundary`.

Lookups take `on`, a day as a `datetime.date`, a `datetime` or `'YYYY-MM-DD'`, and answer for
today without it. A day before a dataset's coverage raises a `ValueError` rather than answer with
today's data. A lookup by an unknown id returns `None`, and a search that matches nothing an
empty list.

## Licence

Code MIT. Data CC BY 4.0: municipality, province, region and postal-code data © Statbel, canton and
arrondissement boundaries and court locations © National Geographic Institute (NGI), police zones ©
FOD Financiën (AAPD). See the
[repository](https://github.com/pieterjanscheir/belgica) for the sources of every dataset.
