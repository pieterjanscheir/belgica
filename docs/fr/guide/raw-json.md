# Sans JavaScript {#without-javascript}

Les fichiers JSON de `data/` sont la source de vérité ; le TypeScript n'ajoute que des types et
des fonctions utilitaires. Vous pouvez les lire depuis n'importe quel langage :

- depuis le package npm (`node_modules/belgica/data/`) ;
- comme sous-module git ;
- depuis une URL brute épinglée sur un tag de version.

```
https://raw.githubusercontent.com/pieterjanscheir/belgica/v0.6.2/data/cantons.json
```

Épinglez un tag plutôt que `main`, pour que les données ne changent que lorsque vous choisissez
de mettre à jour.

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

### Taux d'intérêt {#interest-rates}

Les périodes sont inclusives aux deux extrémités et les dates sont au format `YYYY-MM-DD`, si
bien qu'une comparaison de chaînes suffit :

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

Chaque [release](https://github.com/pieterjanscheir/belgica/releases) contient un zip avec
les données en JSON et sous forme de tables CSV (UTF-8, séparées par des virgules), accompagnées
des schémas et de `datapackage.json`. Les valeurs imbriquées sont des tables à part : les contacts
d'un tribunal sont dans `court-contacts.csv`, avec l'identifiant du tribunal comme clé ; les
communes d'un canton dans `canton-municipalities.csv`. La géométrie des limites des cantons n'est pas
tabulaire et reste dans le JSON ; `canton-boundaries.csv` contient les identifiants de l'IGN par canton. Dans Excel, ouvrez-les via Données >
À partir d'un fichier texte/CSV.

## Fichiers {#files}

| Fichier                       | Contenu                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `data/judicial-areas.json`    | Les 5 ressorts (cours d'appel)                                                 |
| `data/arrondissements.json`   | Les 12 arrondissements judiciaires et leur ressort                             |
| `data/cantons.json`           | Les 162 cantons judiciaires                                                    |
| `data/canton-boundaries.json` | La limite de chaque canton en géométrie GeoJSON (23 Mo)                        |
| `data/municipalities.json`    | Les 565 communes avec leur code REFNIS, leur province et leur région           |
| `data/regions.json`           | Les 3 régions, nommées en trois langues                                        |
| `data/provinces.json`         | Les 10 provinces, avec leur région                                             |
| `data/courts.json`            | Chaque cour, tribunal, division et siège du portail des cours et tribunaux     |
| `data/prisons.json`           | Les prisons et maisons de détention                                            |
| `data/houses-of-justice.json` | Les maisons de justice de la Communauté flamande et de la Communauté française |
| `data/postal-codes.json`      | Chaque code postal avec la commune à laquelle il appartient                    |
| `data/police-zones.json`      | Les 175 zones de police et les communes que chacune couvre                     |
| `data/interest-rates.json`    | Taux d'intérêt légal et taux pour les transactions commerciales                |

Les structures sont décrites sur les [pages des jeux de données](/fr/data/territory) et dans la
[Référence de l'API](/fr/api#types).

## Licence {#licence}

Les données sont sous licence [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) :
réutilisez-les librement, y compris à des fins commerciales, en créditant ce projet et les
sources mentionnées pour chaque jeu de données. Données des communes © Statbel ; limites des cantons © Institut géographique national (IGN).
