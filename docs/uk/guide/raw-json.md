# Без JavaScript {#without-javascript}

JSON-файли в `data/` — це джерело істини; TypeScript лише додає типи й допоміжні функції.
Читати їх можна з будь-якої мови:

- з npm-пакета (`node_modules/belgica/data/`);
- як git submodule;
- за raw URL, закріпленим на release tag.

```
https://raw.githubusercontent.com/pieterjanscheir/belgica/v0.6.2/data/cantons.json
```

Закріплюйтеся на тегу, а не на `main`, щоб дані змінювалися лише тоді, коли ви самі вирішите
оновитися.

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

### Процентні ставки {#interest-rates}

Періоди включають обидва кінці, а дати мають формат `YYYY-MM-DD`, тож порівняння рядків працює:

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

Кожен [реліз](https://github.com/pieterjanscheir/belgica/releases) містить zip-архів із даними у
форматі JSON і у вигляді CSV-таблиць (UTF-8, розділені комами), разом зі схемами та
`datapackage.json`. Вкладені значення винесено в окремі таблиці: контакти суду — у
`court-contacts.csv` з ключем за id суду; громади кантону — у `canton-municipalities.csv`.
Геометрія меж кантонів не є табличною і залишається в JSON; `canton-boundaries.csv` містить
ідентифікатори NGI (Національного географічного інституту Бельгії) для кожного кантону. В Excel
відкривайте їх через Дані > З тексту/CSV.

## Файли {#files}

| Файл                          | Вміст                                                                    |
| ----------------------------- | ------------------------------------------------------------------------ |
| `data/judicial-areas.json`    | 5 апеляційних округів (територій hoven van beroep / cours d'appel)       |
| `data/arrondissements.json`   | 12 судових округів (arrondissements) і їхній апеляційний округ           |
| `data/cantons.json`           | Усі 162 судові кантони                                                   |
| `data/canton-boundaries.json` | Межа кожного кантону як геометрія GeoJSON (23 MB)                        |
| `data/municipalities.json`    | 565 громад із кодом REFNIS, провінцією і регіоном                        |
| `data/regions.json`           | 3 регіони з назвами трьома мовами                                        |
| `data/provinces.json`         | 10 провінцій із їхнім регіоном                                           |
| `data/courts.json`            | Кожен суд, відділення і місце засідань на порталі судів                  |
| `data/prisons.json`           | В'язниці та detentiehuizen                                               |
| `data/houses-of-justice.json` | Justitiehuizen / maisons de justice Фламандської та Французької спільнот |
| `data/postal-codes.json`      | Кожен поштовий індекс із громадою, до якої він належить                  |
| `data/interest-rates.json`    | Законна процентна ставка і ставка для комерційних операцій               |

Структури описано на [сторінках даних](/uk/data/territory) і в [довіднику API](/uk/api#types).

## Ліцензія {#licence}

Дані поширюються за ліцензією [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/):
використовуйте їх вільно, зокрема й комерційно, із зазначенням цього проєкту та джерел,
указаних для кожного набору даних. Дані про громади © Statbel; межі кантонів © Національний
географічний інститут (NGI).
