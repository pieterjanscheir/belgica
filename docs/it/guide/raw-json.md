# Senza JavaScript {#without-javascript}

I file JSON in `data/` sono la fonte di verità; il TypeScript aggiunge solo tipi e helper.
Puoi leggerli da qualsiasi linguaggio:

- dal package npm (`node_modules/belgica/data/`);
- come git submodule;
- da un URL raw fissato a un release tag.

```
https://raw.githubusercontent.com/pieterjanscheir/belgica/v0.6.2/data/cantons.json
```

Fissa un tag invece di `main`, così i dati cambiano solo quando decidi tu di aggiornare.

## Python {#python}

```python
import json
from urllib.request import urlopen

BASE = "https://raw.githubusercontent.com/pieterjanscheir/belgica/v0.6.2/data"

cantons = json.load(urlopen(f"{BASE}/cantons.json"))

def cantons_for_municipality(refnis: str) -> list[dict]:
    return [c for c in cantons if any(m["municipality"] == refnis for m in c["municipalities"])]

print([c["id"] for c in cantons_for_municipality("44021")])  # gent-1 … gent-5
```

### Tassi d'interesse {#interest-rates}

I periodi sono inclusivi a entrambi gli estremi e le date sono `YYYY-MM-DD`, quindi il confronto
tra stringhe funziona:

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

Ogni [release](https://github.com/pieterjanscheir/belgica/releases) include uno zip con i dati
in JSON e come tabelle CSV (UTF-8, separate da virgole), con gli schemi e `datapackage.json`. I
valori annidati sono tabelle a sé: i contatti di un tribunale stanno in `court-contacts.csv`,
con l'id del tribunale come chiave; i comuni di un cantone in `canton-municipalities.csv`. La
geometria dei confini dei cantoni non è tabellare e resta nel JSON; `canton-boundaries.csv`
contiene gli identificatori dell'NGI per ogni cantone. In Excel, aprili con Dati > Da testo/CSV.

## File {#files}

| File                          | Contenuto                                                                  |
| ----------------------------- | -------------------------------------------------------------------------- |
| `data/judicial-areas.json`    | I 5 distretti giudiziari (corti d'appello)                                 |
| `data/arrondissements.json`   | I 12 arrondissement giudiziari e il loro distretto giudiziario             |
| `data/cantons.json`           | Tutti i 162 cantoni giudiziari                                             |
| `data/canton-boundaries.json` | Il confine di ogni cantone come geometria GeoJSON (23 MB)                  |
| `data/municipalities.json`    | I 565 comuni con codice REFNIS, provincia e regione                        |
| `data/regions.json`           | Le 3 regioni, con il nome in tre lingue                                    |
| `data/provinces.json`         | Le 10 province, con la loro regione                                        |
| `data/courts.json`            | Ogni corte, tribunale, sezione e sede presente sul portale dei tribunali   |
| `data/prisons.json`           | Le carceri e le case di detenzione                                         |
| `data/houses-of-justice.json` | Le justitiehuizen / maisons de justice delle Comunità fiamminga e francese |
| `data/postal-codes.json`      | Ogni codice postale con il comune a cui appartiene                         |
| `data/interest-rates.json`    | Tassi d'interesse legale e per le transazioni commerciali                  |

Le strutture sono descritte nelle [pagine sui dati](/it/data/territory) e nel
[riferimento API](/it/api#types).

## Licenza {#licence}

I dati sono [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/): riutilizzali liberamente,
anche a fini commerciali, citando questo progetto e le fonti indicate per ogni dataset. Dati sui
comuni © Statbel; confini dei cantoni © Istituto geografico nazionale (NGI).
