# من دون JavaScript {#without-javascript}

ملفات JSON في `data/` هي المصدر المرجعي؛ وكل ما تضيفه TypeScript هو الأنواع والدوال المساعدة.
يمكنك قراءتها من أي لغة:

- من حزمة npm (`node_modules/belgica/data/`)؛
- بوصفها git submodule؛
- من رابط raw مثبّت على release tag.

```
https://raw.githubusercontent.com/pieterjanscheir/belgica/v0.9.0/data/cantons.json
```

ثبّت tag بدلًا من `main`، حتى لا تتغير البيانات إلا حين تختار الترقية.

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

### أسعار الفائدة {#interest-rates}

الفترات شاملة لطرفيها والتواريخ بصيغة `YYYY-MM-DD`، لذا تنجح مقارنة السلاسل النصية:

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

يتضمن كل [إصدار](https://github.com/pieterjanscheir/belgica/releases) ملف zip فيه البيانات
بصيغة JSON وبصيغة جداول CSV (UTF-8، مفصولة بفواصل)، مع المخططات و`datapackage.json`. القيم
المتداخلة جداول مستقلة: بيانات الاتصال بمحكمة ما في `court-contacts.csv`، مفهرسة بمعرّف المحكمة؛
وبلديات الكانتون في `canton-municipalities.csv`. هندسة حدود الكانتونات ليست جدولية فتبقى في JSON؛
ويحتوي `canton-boundaries.csv` على معرّفات NGI لكل كانتون. في Excel افتحها عبر
Data > From Text/CSV.

## الملفات {#files}

| الملف                         | المحتوى                                                                       |
| ----------------------------- | ----------------------------------------------------------------------------- |
| `data/judicial-areas.json`    | المناطق القضائية الخمس (محاكم الاستئناف)                                      |
| `data/arrondissements.json`   | الدوائر القضائية (arrondissements) الاثنتا عشرة ومنطقتها القضائية             |
| `data/cantons.json`           | الكانتونات القضائية الـ162 كلها                                               |
| `data/canton-boundaries.json` | حدود كل كانتون بوصفها هندسة GeoJSON ‏(23 MB)                                  |
| `data/municipalities.json`    | البلديات الـ565 مع رمز REFNIS والمقاطعة والإقليم                              |
| `data/regions.json`           | الأقاليم الثلاثة، بأسمائها بثلاث لغات                                         |
| `data/provinces.json`         | المقاطعات العشر، مع إقليم كل منها                                             |
| `data/courts.json`            | كل محكمة وقسم ومقر على بوابة المحاكم                                          |
| `data/prisons.json`           | السجون ودور الاحتجاز (detentiehuizen / maisons de détention)                  |
| `data/houses-of-justice.json` | الـjustitiehuizen / maisons de justice التابعة للمجموعتين الفلمنكية والفرنسية |
| `data/postal-codes.json`      | كل رمز بريدي مع البلدية التي ينتمي إليها                                      |
| `data/interest-rates.json`    | سعر الفائدة القانونية وسعر الفائدة على المعاملات التجارية                     |

البُنى موصوفة في [صفحات البيانات](/ar/data/territory) وفي [مرجع API](/ar/api#types).

## الترخيص {#licence}

البيانات مرخّصة بـ[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/): أعد استخدامها
بحرية، بما في ذلك تجاريًا، مع نسبة الفضل إلى هذا المشروع وإلى المصادر المذكورة لكل مجموعة بيانات.
بيانات البلديات © Statbel؛ حدود الكانتونات © NGI (المعهد الجغرافي الوطني).
