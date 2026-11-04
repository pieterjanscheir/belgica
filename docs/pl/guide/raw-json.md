# Bez JavaScriptu {#without-javascript}

Pliki JSON w `data/` są źródłem prawdy; TypeScript dodaje tylko typy i funkcje pomocnicze.
Możesz je czytać z dowolnego języka:

- z pakietu npm (`node_modules/belgica/data/`);
- jako submoduł gita;
- z surowego URL-a przypiętego do release tagu.

```
https://raw.githubusercontent.com/pieterjanscheir/belgica/v0.7.0/data/cantons.json
```

Przypinaj tag zamiast `main`, żeby dane zmieniały się tylko wtedy, gdy sam zdecydujesz się na
aktualizację.

## Python {#python}

```python
import json
from urllib.request import urlopen

BASE = "https://raw.githubusercontent.com/pieterjanscheir/belgica/v0.7.0/data"

cantons = json.load(urlopen(f"{BASE}/cantons.json"))

def cantons_for_municipality(refnis: str) -> list[dict]:
    return [c for c in cantons if any(m["municipality"] == refnis for m in c["municipalities"])]

print([c["id"] for c in cantons_for_municipality("44021")])  # gent-1 … gent-5
```

### Stopy procentowe {#interest-rates}

Okresy obejmują oba krańce, a daty mają format `YYYY-MM-DD`, więc porównywanie napisów działa:

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

Każde [wydanie](https://github.com/pieterjanscheir/belgica/releases) zawiera plik zip z danymi
jako JSON i jako tabele CSV (UTF-8, rozdzielane przecinkami), razem ze schematami i
`datapackage.json`. Zagnieżdżone wartości są osobnymi tabelami: dane kontaktowe sądu są w
`court-contacts.csv`, powiązane przez id sądu; gminy kantonu w `canton-municipalities.csv`.
Geometria granic kantonów nie jest tabelaryczna i zostaje w JSON-ie; `canton-boundaries.csv`
zawiera identyfikatory NGI (belgijskiego Narodowego Instytutu Geograficznego) dla każdego kantonu.
W Excelu otwórz je przez Dane > Z pliku tekstowego/CSV.

## Pliki {#files}

| Plik                          | Zawartość                                                                  |
| ----------------------------- | -------------------------------------------------------------------------- |
| `data/judicial-areas.json`    | 5 obszarów sądowych (sądów apelacyjnych: hoven van beroep / cours d'appel) |
| `data/arrondissements.json`   | 12 okręgów sądowych (arrondissements) i ich obszar sądowy                  |
| `data/cantons.json`           | Wszystkie 162 kantony sądowe                                               |
| `data/canton-boundaries.json` | Granica każdego kantonu jako geometria GeoJSON (23 MB)                     |
| `data/municipalities.json`    | 565 gmin z kodem REFNIS, prowincją i regionem                              |
| `data/regions.json`           | 3 regiony, z nazwami w trzech językach                                     |
| `data/provinces.json`         | 10 prowincji, z ich regionem                                               |
| `data/courts.json`            | Każdy sąd, wydział i siedziba z portalu sądów                              |
| `data/prisons.json`           | Więzienia i detentiehuizen / maisons de détention                          |
| `data/houses-of-justice.json` | Justitiehuizen / maisons de justice Wspólnoty Flamandzkiej i Francuskiej   |
| `data/postal-codes.json`      | Każdy kod pocztowy z gminą, do której należy                               |
| `data/interest-rates.json`    | Stopy odsetek ustawowych i odsetek w transakcjach handlowych               |

Struktury są opisane na [stronach z danymi](/pl/data/territory) i w
[dokumentacji API](/pl/api#types).

## Licencja {#licence}

Dane są udostępnione na licencji [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/):
możesz je swobodnie wykorzystywać, także komercyjnie, z podaniem tego projektu i źródeł
wymienionych przy każdym zbiorze danych. Dane gmin © Statbel; granice kantonów © Nationaal
Geografisch Instituut / Institut géographique national (NGI).
