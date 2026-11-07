# 不用 JavaScript {#without-javascript}

`data/` 中的 JSON 文件是唯一的权威数据源；TypeScript 只是在其上加了类型和辅助函数。你可以用任何语言读取它们：

- 从 npm 包中读取（`node_modules/belgica/data/`）；
- 作为 git submodule 引入；
- 通过固定到某个 release tag 的 raw URL 读取。

```
https://raw.githubusercontent.com/pieterjanscheir/belgica/v0.8.0/data/cantons.json
```

请固定到某个 tag 而不是 `main`，这样数据只会在你主动升级时才变化。

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

### 利率 {#interest-rates}

期间的起止日期都包含在内，日期格式为 `YYYY-MM-DD`，所以直接比较字符串即可：

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

每个 [release](https://github.com/pieterjanscheir/belgica/releases) 都附带一个 zip 文件，其中包含 JSON 格式的数据和
CSV 表格（UTF-8，逗号分隔），以及各个 schema 和 `datapackage.json`。嵌套的值单独成表：法院的联系方式在
`court-contacts.csv` 中，以法院 id 为键；canton 包含的市镇在 `canton-municipalities.csv` 中。canton 边界的几何数据
不是表格形式，只保留在 JSON 中；`canton-boundaries.csv` 列出每个 canton 在 NGI（比利时国家地理研究所）中的标识符。
在 Excel 中，请通过「数据 > 从文本/CSV」打开。

## 文件 {#files}

| 文件                          | 内容                                                         |
| ----------------------------- | ------------------------------------------------------------ |
| `data/judicial-areas.json`    | 5 个司法辖区（即上诉法院的辖区）                             |
| `data/arrondissements.json`   | 12 个司法 arrondissement 及其所属司法辖区                    |
| `data/cantons.json`           | 全部 162 个司法 canton                                       |
| `data/canton-boundaries.json` | 每个 canton 的边界，GeoJSON 几何格式（23 MB）                |
| `data/municipalities.json`    | 565 个市镇，含 REFNIS 代码、省和大区                         |
| `data/regions.json`           | 3 个大区，含三种语言的名称                                   |
| `data/provinces.json`         | 10 个省及其所属大区                                          |
| `data/courts.json`            | 法院门户网站上的每个法院、分部和开庭地点                     |
| `data/prisons.json`           | 监狱和 detentiehuizen / maisons de détention（拘留所）       |
| `data/houses-of-justice.json` | 弗拉芒语社群和法语社群的 justitiehuizen / maisons de justice |
| `data/postal-codes.json`      | 每个邮政编码及其所属市镇                                     |
| `data/interest-rates.json`    | 法定利率和商业交易利率                                       |

数据结构在各[数据页面](/zh/data/territory)和 [API 参考](/zh/api#types)中有说明。

## 许可 {#licence}

数据采用 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 许可：可以自由复用，包括商业用途，但须注明本项目
以及各数据集所列的来源。市镇数据 © Statbel；canton 边界 © 比利时国家地理研究所（NGI）。
