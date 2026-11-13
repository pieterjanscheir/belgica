# Zonder JavaScript {#without-javascript}

De JSON-bestanden in `data/` zijn de bron van de waarheid; de TypeScript voegt alleen types en
helpers toe. Je kunt ze vanuit elke taal lezen:

- uit het npm-package (`node_modules/belgica/data/`);
- als git-submodule;
- via een raw-URL die aan een releasetag vastgepind is.

```
https://raw.githubusercontent.com/pieterjanscheir/belgica/v0.9.0/data/cantons.json
```

Pin een tag in plaats van `main`, zodat de data alleen verandert wanneer jij beslist te upgraden.

## Python {#python}

```python
import json
from urllib.request import urlopen

BASE = "https://raw.githubusercontent.com/pieterjanscheir/belgica/v0.9.0/data"

cantons = json.load(urlopen(f"{BASE}/cantons.json"))

def cantons_for_municipality(refnis: str) -> list[dict]:
    return [c for c in cantons if any(m["municipality"] == refnis for m in c["municipalities"])]

print([c["id"] for c in cantons_for_municipality("44021")])  # gent-1 … gent-5
```

### Rentevoeten {#interest-rates}

Periodes zijn inclusief aan beide kanten en datums zijn `YYYY-MM-DD`, dus stringvergelijking
werkt:

```python
rates = json.load(urlopen(f"{BASE}/interest-rates.json"))

def interest_rate(day: str, kind: str, contract_after_20130316: bool = False) -> float | None:
    for p in rates[kind]["periods"]:
        if p["from"] <= day <= p["to"]:
            older = p.get("rateForContractsBefore20130316")
            return older if older is not None and not contract_after_20130316 else p["rate"]
    return None
```

## CSV {#csv}

Elke [release](https://github.com/pieterjanscheir/belgica/releases) heeft een zip met de
data als JSON en als CSV-tabellen (UTF-8, kommagescheiden), samen met de schema's en
`datapackage.json`. Geneste waarden zijn tabellen op zich: de contacten van een rechtbank staan in
`court-contacts.csv`, gekoppeld via het id van de rechtbank; de gemeenten van een kanton in
`canton-municipalities.csv`. De geometrie van de kantongrenzen is niet tabellair en blijft in de
JSON; `canton-boundaries.csv` heeft de identificatoren van het NGI per kanton. In Excel open je
ze via Gegevens > Uit tekst/CSV.

## Bestanden {#files}

| Bestand                       | Inhoud                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------- |
| `data/judicial-areas.json`    | De 5 rechtsgebieden (hoven van beroep)                                          |
| `data/arrondissements.json`   | De 12 gerechtelijke arrondissementen en hun rechtsgebied                        |
| `data/cantons.json`           | Alle 162 gerechtelijke kantons                                                  |
| `data/canton-boundaries.json` | De grens van elk kanton als GeoJSON-geometrie (23 MB)                           |
| `data/municipalities.json`    | De 565 gemeenten met REFNIS-code, provincie en gewest                           |
| `data/regions.json`           | De 3 gewesten, in drie talen benoemd                                            |
| `data/provinces.json`         | De 10 provincies, met hun gewest                                                |
| `data/courts.json`            | Elke rechtbank, afdeling en zetel op het portaal van de rechtbanken             |
| `data/prisons.json`           | De gevangenissen en detentiehuizen                                              |
| `data/houses-of-justice.json` | De justitiehuizen van de Vlaamse en de Franse Gemeenschap                       |
| `data/postal-codes.json`      | Elke postcode met de gemeente waartoe hij behoort                               |
| `data/police-zones.json`      | De 175 politiezones en de gemeenten die elk dekt                                |
| `data/interest-rates.json`    | Wettelijke interest en interest bij betalingsachterstand bij handelstransacties |

De structuren staan beschreven op de [datapagina's](/nl/data/territory) en in de
[API-referentie](/nl/api#types).

## Licentie {#licence}

De data is [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/): hergebruik ze vrij, ook
commercieel, met vermelding van dit project en van de bronnen die bij elke dataset staan.
Gemeentedata © Statbel; kantongrenzen © Nationaal Geografisch Instituut (NGI).
