# Sem JavaScript {#without-javascript}

Os ficheiros JSON em `data/` são a fonte de verdade; o TypeScript apenas acrescenta tipos e
funções auxiliares. Pode lê-los a partir de qualquer linguagem:

- a partir do pacote npm (`node_modules/belgica/data/`);
- como submódulo git;
- a partir de um URL raw fixado numa tag de release.

```
https://raw.githubusercontent.com/pieterjanscheir/belgica/v0.8.0/data/cantons.json
```

Fixe uma tag em vez de `main`, para que os dados só mudem quando decidir atualizar.

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

### Taxas de juro {#interest-rates}

Os períodos são inclusivos nas duas extremidades e as datas estão no formato `YYYY-MM-DD`, por
isso a comparação de strings funciona:

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

Cada [release](https://github.com/pieterjanscheir/belgica/releases) tem um zip com os dados em
JSON e em tabelas CSV (UTF-8, separadas por vírgulas), com os schemas e o `datapackage.json`. Os
valores aninhados são tabelas próprias: os contactos de um tribunal estão em
`court-contacts.csv`, ligados pelo id do tribunal; os municípios de um cantão em
`canton-municipalities.csv`. A geometria dos limites dos cantões não é tabular e fica no JSON;
`canton-boundaries.csv` tem os identificadores do NGI (o instituto geográfico nacional belga) por
cantão. No Excel, abra-os com Dados > De Texto/CSV.

## Ficheiros {#files}

| Ficheiro                      | Conteúdo                                                                   |
| ----------------------------- | -------------------------------------------------------------------------- |
| `data/judicial-areas.json`    | As 5 áreas judiciais (cours d'appel / hoven van beroep)                    |
| `data/arrondissements.json`   | Os 12 arrondissements judiciais e a respetiva área judicial                |
| `data/cantons.json`           | Os 162 cantões judiciais                                                   |
| `data/canton-boundaries.json` | O limite de cada cantão como geometria GeoJSON (23 MB)                     |
| `data/municipalities.json`    | Os 565 municípios com código REFNIS, província e região                    |
| `data/regions.json`           | As 3 regiões, com o nome em três línguas                                   |
| `data/provinces.json`         | As 10 províncias, com a respetiva região                                   |
| `data/courts.json`            | Cada tribunal, divisão e sede do portal dos tribunais                      |
| `data/prisons.json`           | As prisões e casas de detenção                                             |
| `data/houses-of-justice.json` | As maisons de justice / justitiehuizen das Comunidades flamenga e francesa |
| `data/postal-codes.json`      | Cada código postal com o município a que pertence                          |
| `data/interest-rates.json`    | Taxas de juro legal e das transações comerciais                            |

As estruturas estão descritas nas [páginas de dados](/pt/data/territory) e na
[referência da API](/pt/api#types).

## Licença {#licence}

Os dados estão sob [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/): reutilize-os
livremente, incluindo para fins comerciais, com crédito a este projeto e às fontes indicadas para
cada conjunto de dados. Dados dos municípios © Statbel; limites dos cantões © Nationaal
Geografisch Instituut / Institut géographique national (NGI).
