# JavaScript なしで使う {#without-javascript}

`data/` にある JSON ファイルが正のデータで、TypeScript は型とヘルパーを加えているだけです。
どの言語からでも読めます。

- npm パッケージから（`node_modules/belgica/data/`）
- git submodule として
- release tag に固定した raw URL から

```
https://raw.githubusercontent.com/pieterjanscheir/belgica/v0.9.0/data/cantons.json
```

`main` ではなく tag に固定してください。そうすれば、データが変わるのは自分でアップグレードを
選んだときだけになります。

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

### 利率 {#interest-rates}

期間は両端を含み、日付は `YYYY-MM-DD` なので、文字列の比較がそのまま使えます。

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

各 [release](https://github.com/pieterjanscheir/belgica/releases) には、データを JSON と CSV の表
（UTF-8、カンマ区切り）で収めた zip が付いており、スキーマと `datapackage.json` も含まれます。
入れ子になった値はそれぞれ独立した表になります。裁判所の連絡先は裁判所の id をキーとして
`court-contacts.csv` に、canton の自治体は `canton-municipalities.csv` に入っています。canton の
境界のジオメトリは表形式にならないため JSON のみで、`canton-boundaries.csv` には canton ごとの
NGI の識別子が入っています。Excel では「データ > テキストまたは CSV から」で開いてください。

## ファイル {#files}

| ファイル                      | 内容                                                                  |
| ----------------------------- | --------------------------------------------------------------------- |
| `data/judicial-areas.json`    | 5 つの管轄区域（hof van beroep / cour d'appel、つまり控訴裁判所ごと） |
| `data/arrondissements.json`   | 12 の司法 arrondissement と、それぞれが属する管轄区域                 |
| `data/cantons.json`           | 162 の司法 canton すべて                                              |
| `data/canton-boundaries.json` | 各 canton の境界を表す GeoJSON ジオメトリ（23 MB）                    |
| `data/municipalities.json`    | 565 の自治体と、その REFNIS コード、州、地域                          |
| `data/regions.json`           | 3 つの地域（3 言語の名称つき）                                        |
| `data/provinces.json`         | 10 の州と、それぞれが属する地域                                       |
| `data/courts.json`            | 裁判所ポータルに載っているすべての裁判所、部、所在地                  |
| `data/prisons.json`           | 刑務所と detentiehuis / maison de détention                           |
| `data/houses-of-justice.json` | フラマン語共同体とフランス語共同体の justitiehuis / maison de justice |
| `data/postal-codes.json`      | すべての郵便番号と、それが属する自治体                                |
| `data/interest-rates.json`    | 法定利率と商取引の利率                                                |

データの構造は[データのページ](/ja/data/territory)と [API リファレンス](/ja/api#types)で説明しています。

## ライセンス {#licence}

データは [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) です。商用利用も含めて自由に
再利用できます。その際は、このプロジェクトと各データセットに記載された出典をクレジットしてください。
自治体データ © Statbel、canton の境界 © National Geographic Institute（NGI）。
