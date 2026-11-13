# JavaScript olmadan {#without-javascript}

`data/` içindeki JSON dosyaları asıl kaynaktır; TypeScript yalnızca tipler ve yardımcı
fonksiyonlar ekler. Bu dosyaları herhangi bir dilden okuyabilirsiniz:

- npm paketinden (`node_modules/belgica/data/`);
- bir git submodule olarak;
- bir release tag'e sabitlenmiş ham (raw) bir URL'den.

```
https://raw.githubusercontent.com/pieterjanscheir/belgica/v0.9.0/data/cantons.json
```

`main` yerine bir tag'e sabitleyin; böylece veriler yalnızca siz yükseltmeye karar verdiğinizde
değişir.

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

### Faiz oranları {#interest-rates}

Dönemler iki uçta da kapsayıcıdır ve tarihler `YYYY-MM-DD` biçimindedir, bu yüzden string
karşılaştırması işe yarar:

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

Her [sürümde](https://github.com/pieterjanscheir/belgica/releases) verileri JSON ve CSV tabloları
(UTF-8, virgülle ayrılmış) olarak, şemalar ve `datapackage.json` ile birlikte içeren bir zip
bulunur. İç içe değerler kendi tablolarındadır: bir mahkemenin iletişim bilgileri, mahkeme id'siyle
anahtarlanmış olarak `court-contacts.csv` içinde; bir kantonun belediyeleri
`canton-municipalities.csv` içindedir. Kanton sınırlarının geometrisi tablo biçiminde değildir ve
JSON'da kalır; `canton-boundaries.csv` her kanton için NGI'nin (Belçika Ulusal Coğrafya Enstitüsü)
tanımlayıcılarını içerir. Excel'de bunları Veri > Metinden/CSV'den ile açın.

## Dosyalar {#files}

| Dosya                         | İçerik                                                                     |
| ----------------------------- | -------------------------------------------------------------------------- |
| `data/judicial-areas.json`    | 5 yargı çevresi (rechtsgebied / ressort; hoven van beroep / cours d'appel) |
| `data/arrondissements.json`   | 12 adli arrondissement (adli bölge) ve bağlı oldukları yargı çevresi       |
| `data/cantons.json`           | 162 adli kantonun tamamı                                                   |
| `data/canton-boundaries.json` | Her kantonun GeoJSON geometrisi olarak sınırı (23 MB)                      |
| `data/municipalities.json`    | REFNIS kodu, eyaleti ve bölgesiyle 565 belediye                            |
| `data/regions.json`           | Üç dilde adlandırılmış 3 bölge                                             |
| `data/provinces.json`         | Bölgeleriyle birlikte 10 eyalet                                            |
| `data/courts.json`            | Mahkemelerin portalındaki her mahkeme, bölüm ve duruşma yeri               |
| `data/prisons.json`           | Cezaevleri ve tutukevleri (detentiehuizen / maisons de détention)          |
| `data/houses-of-justice.json` | Flaman ve Fransız Topluluklarının justitiehuizen / maisons de justice'leri |
| `data/postal-codes.json`      | Her posta kodu ve ait olduğu belediye                                      |
| `data/interest-rates.json`    | Yasal faiz ve ticari işlemler faiz oranları                                |

Yapılar [veri sayfalarında](/tr/data/territory) ve [API başvurusunda](/tr/api#types) açıklanır.

## Lisans {#licence}

Veriler [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) lisanslıdır: bu projeye ve her
veri kümesi için listelenen kaynaklara atıf yaparak, ticari amaçlar dahil serbestçe yeniden
kullanabilirsiniz. Belediye verileri © Statbel; kanton sınırları © Ulusal Coğrafya Enstitüsü (NGI).
