# Sin JavaScript {#without-javascript}

Los archivos JSON de `data/` son la fuente de verdad; el TypeScript solo añade tipos y helpers.
Puedes leerlos desde cualquier lenguaje:

- desde el paquete npm (`node_modules/belgica/data/`);
- como submódulo de git;
- desde una URL raw fijada a un release tag.

```
https://raw.githubusercontent.com/pieterjanscheir/belgica/v0.9.0/data/cantons.json
```

Fija un tag en lugar de `main`, para que los datos solo cambien cuando tú decidas actualizar.

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

### Tipos de interés {#interest-rates}

Los periodos incluyen ambos extremos y las fechas son `YYYY-MM-DD`, así que la comparación de
cadenas funciona:

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

Cada [release](https://github.com/pieterjanscheir/belgica/releases) tiene un zip con los datos en
JSON y como tablas CSV (UTF-8, separadas por comas), con los esquemas y `datapackage.json`. Los
valores anidados son tablas propias: los contactos de un tribunal están en `court-contacts.csv`,
con el id del tribunal como clave; los municipios de un cantón en `canton-municipalities.csv`. La
geometría de los límites de los cantones no es tabular y se queda en el JSON;
`canton-boundaries.csv` tiene los identificadores del NGI (Institut géographique national,
Nationaal Geografisch Instituut) por cantón. En Excel, ábrelos con Datos > Desde el texto/CSV.

## Archivos {#files}

| Archivo                       | Contenido                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `data/judicial-areas.json`    | Las 5 áreas judiciales (las de las cours d'appel)                              |
| `data/arrondissements.json`   | Los 12 distritos judiciales y su área judicial                                 |
| `data/cantons.json`           | Los 162 cantones judiciales                                                    |
| `data/canton-boundaries.json` | El límite de cada cantón como geometría GeoJSON (23 MB)                        |
| `data/municipalities.json`    | Los 565 municipios con código REFNIS, provincia y región                       |
| `data/regions.json`           | Las 3 regiones, con su nombre en tres lenguas                                  |
| `data/provinces.json`         | Las 10 provincias, con su región                                               |
| `data/courts.json`            | Cada tribunal, división y sede del portal de los tribunales                    |
| `data/prisons.json`           | Las prisiones y casas de detención                                             |
| `data/houses-of-justice.json` | Las maisons de justice / justitiehuizen de las Comunidades flamenca y francesa |
| `data/postal-codes.json`      | Cada código postal con el municipio al que pertenece                           |
| `data/interest-rates.json`    | Tipos de interés legal y de operaciones comerciales                            |

Las estructuras se describen en las [páginas de datos](/es/data/territory) y en la
[referencia de la API](/es/api#types).

## Licencia {#licence}

Los datos están bajo [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/): reutilízalos
libremente, también con fines comerciales, citando este proyecto y las fuentes indicadas para
cada conjunto de datos. Datos de municipios © Statbel; límites de los cantones © Instituto
Geográfico Nacional de Bélgica (NGI).
