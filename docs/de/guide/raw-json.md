# Ohne JavaScript {#without-javascript}

Die JSON-Dateien in `data/` sind die maßgebliche Quelle; das TypeScript fügt nur Typen und
Hilfsfunktionen hinzu. Sie können sie aus jeder Sprache lesen:

- aus dem npm-Package (`node_modules/belgica/data/`);
- als Git-Submodul;
- über eine Raw-URL, die auf einen Release-Tag festgelegt ist.

```
https://raw.githubusercontent.com/pieterjanscheir/belgica/v0.8.0/data/cantons.json
```

Legen Sie sich auf einen Tag fest statt auf `main`, damit sich die Daten nur ändern, wenn Sie sich
für ein Upgrade entscheiden.

## Python {#python}

```python
import json
from urllib.request import urlopen

BASE = "https://raw.githubusercontent.com/pieterjanscheir/belgica/v0.8.0/data"

cantons = json.load(urlopen(f"{BASE}/cantons.json"))

def cantons_for_municipality(refnis: str) -> list[dict]:
    return [c for c in cantons if any(m["municipality"] == refnis for m in c["municipalities"])]

print([c["id"] for c in cantons_for_municipality("44021")])  # gent-1 … gent-5
```

### Zinssätze {#interest-rates}

Zeiträume schließen beide Enden ein, und Daten haben das Format `YYYY-MM-DD`, sodass ein
Stringvergleich funktioniert:

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

Jedes [Release](https://github.com/pieterjanscheir/belgica/releases) enthält ein Zip mit den
Daten als JSON und als CSV-Tabellen (UTF-8, kommagetrennt), zusammen mit den Schemas und
`datapackage.json`. Verschachtelte Werte sind eigene Tabellen: Die Kontakte eines Gerichts stehen
in `court-contacts.csv`, verknüpft über die ID des Gerichts; die Gemeinden eines Kantons in
`canton-municipalities.csv`. Die Geometrie der Kantonsgrenzen ist nicht tabellarisch und bleibt im
JSON; `canton-boundaries.csv` enthält die Identifikatoren des NGI pro Kanton. In Excel öffnen Sie
sie über Daten > Aus Text/CSV.

## Dateien {#files}

| Datei                         | Inhalt                                                                   |
| ----------------------------- | ------------------------------------------------------------------------ |
| `data/judicial-areas.json`    | Die 5 Gerichtsbereiche (Appellationshöfe)                                |
| `data/arrondissements.json`   | Die 12 Gerichtsbezirke und ihr Gerichtsbereich                           |
| `data/cantons.json`           | Alle 162 Gerichtskantone                                                 |
| `data/canton-boundaries.json` | Die Grenze jedes Kantons als GeoJSON-Geometrie (23 MB)                   |
| `data/municipalities.json`    | Die 565 Gemeinden mit REFNIS-Code, Provinz und Region                    |
| `data/regions.json`           | Die 3 Regionen, in drei Sprachen benannt                                 |
| `data/provinces.json`         | Die 10 Provinzen, mit ihrer Region                                       |
| `data/courts.json`            | Jedes Gericht, jede Abteilung und jeder Sitz auf dem Portal der Gerichte |
| `data/prisons.json`           | Die Gefängnisse und Detentionshäuser                                     |
| `data/houses-of-justice.json` | Die Justizhäuser der Flämischen und der Französischen Gemeinschaft       |
| `data/postal-codes.json`      | Jede Postleitzahl mit der Gemeinde, zu der sie gehört                    |
| `data/interest-rates.json`    | Gesetzlicher Zinssatz und Zinssatz bei Zahlungsverzug im Handelsverkehr  |

Die Strukturen sind auf den [Datenseiten](/de/data/territory) und in der
[API-Referenz](/de/api#types) beschrieben.

## Lizenz {#licence}

Die Daten stehen unter [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/): Verwenden Sie
sie frei weiter, auch kommerziell, mit Nennung dieses Projekts und der Quellen, die bei jedem
Datensatz angegeben sind. Gemeindedaten © Statbel; Kantonsgrenzen © Nationales Geographisches
Institut (NGI).
