# JSON Schema

Every file in `data/` has a [JSON Schema](https://json-schema.org) (draft-07) in `schema/`.
The schemas are generated from the [zod schemas](#zod-schemas) the TypeScript types are inferred
from, so the types, the schemas and the data can't drift apart: CI fails when any of the three
disagree.

| Data file                             | Schema                                                                                                   |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `data/judicial-areas.json`            | [`judicial-areas.schema.json`](/schema/judicial-areas.schema.json){target="_self"}                       |
| `data/arrondissements.json`           | [`arrondissements.schema.json`](/schema/arrondissements.schema.json){target="_self"}                     |
| `data/cantons.json`                   | [`cantons.schema.json`](/schema/cantons.schema.json){target="_self"}                                     |
| `data/canton-boundaries.json`         | [`canton-boundaries.schema.json`](/schema/canton-boundaries.schema.json){target="_self"}                 |
| `data/arrondissement-boundaries.json` | [`arrondissement-boundaries.schema.json`](/schema/arrondissement-boundaries.schema.json){target="_self"} |
| `data/municipalities.json`            | [`municipalities.schema.json`](/schema/municipalities.schema.json){target="_self"}                       |
| `data/regions.json`                   | [`regions.schema.json`](/schema/regions.schema.json){target="_self"}                                     |
| `data/provinces.json`                 | [`provinces.schema.json`](/schema/provinces.schema.json){target="_self"}                                 |
| `data/courts.json`                    | [`courts.schema.json`](/schema/courts.schema.json){target="_self"}                                       |
| `data/court-locations.json`           | [`court-locations.schema.json`](/schema/court-locations.schema.json){target="_self"}                     |
| `data/prisons.json`                   | [`prisons.schema.json`](/schema/prisons.schema.json){target="_self"}                                     |
| `data/houses-of-justice.json`         | [`houses-of-justice.schema.json`](/schema/houses-of-justice.schema.json){target="_self"}                 |
| `data/postal-codes.json`              | [`postal-codes.schema.json`](/schema/postal-codes.schema.json){target="_self"}                           |
| `data/interest-rates.json`            | [`interest-rates.schema.json`](/schema/interest-rates.schema.json){target="_self"}                       |
| `data/public-holidays.json`           | [`public-holidays.schema.json`](/schema/public-holidays.schema.json){target="_self"}                     |

Each schema's `$id` is its URL on this site, e.g.
`https://pieterjanscheir.github.io/belgica/schema/courts.schema.json`. They're also in the
npm package as `belgica/schema/courts.schema.json`.

## Validating the data

::: code-group

```python [Python]
import json
from urllib.request import urlopen
from jsonschema import validate  # pip install jsonschema

# Pinned to a release, so the data and the schema match
BASE = "https://raw.githubusercontent.com/pieterjanscheir/belgica/v0.7.0/"
courts = json.load(urlopen(f"{BASE}data/courts.json"))
schema = json.load(urlopen(f"{BASE}schema/courts.schema.json"))
validate(courts, schema)
```

```ts [TypeScript]
import { Ajv } from 'ajv'
import addFormats from 'ajv-formats'
import courts from 'belgica/data/courts.json' with { type: 'json' }
import schema from 'belgica/schema/courts.schema.json' with { type: 'json' }

const ajv = new Ajv()
addFormats(ajv)
ajv.validate(schema, courts) // true
```

:::

In TypeScript, the [zod schemas](#zod-schemas) do the same without a JSON Schema validator.

You'll mostly want this when you keep a copy of the data (a fork with extra records, a cached
download) and want to know it still has the shape the package expects.

## Zod schemas

`belgica/schemas` exports the [zod](https://zod.dev) schemas the package's types are inferred
from: one per record (`courtSchema`, `cantonSchema`, …), per id (`courtIdSchema`, a `z.enum` of
every id) and per data file (`dataFileSchemas`).

```ts
import { courtIdSchema, dataFileSchemas } from 'belgica/schemas'

const courts = dataFileSchemas.courts.parse(json) // throws a ZodError on a record that doesn't fit
courtIdSchema.safeParse(input).success // whether a string is a known court id
```

Only `belgica/schemas` loads zod; the datasets import their types alone.

## Generating types for other languages

Because the schemas are standard, you can generate models instead of writing them by hand:
[datamodel-code-generator](https://github.com/koxudaxi/datamodel-code-generator) for Python
(Pydantic), [quicktype](https://quicktype.io) for C#, Go, Java, Kotlin, Swift and more.

```bash
datamodel-codegen --input courts.schema.json --input-file-type jsonschema --output courts.py
```

## datapackage.json

The repository root has a [`datapackage.json`](/datapackage.json){target="_self"}, a
[Frictionless Data Package](https://datapackage.org) descriptor: the standard metadata file for
open datasets. It lists each data file with its title, description, schema, official sources,
licence, and two fields of our own:

- `lastReviewed`: the day the dataset was last checked against its sources;
- `reviewEveryMonths`: how often it must be checked again. The
  [freshness check](./data-quality#automatic-checks) opens an issue when a dataset is overdue.
