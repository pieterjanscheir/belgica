# Datasets

Every dataset is a JSON file in `data/`, described by a [JSON Schema](/guide/schema) and listed
in [`datapackage.json`](/guide/schema#datapackage-json) with its official sources, licence and
the date it was last checked against them.

| Dataset                                                                    | Records   | What you'd use it for                                                               |
| -------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------- |
| [Judicial areas](./territory#judicial-areas)                               | 5         | Which court of appeal (and labour court of appeal) hears an appeal                  |
| [Arrondissements](./territory#arrondissements)                             | 12        | Grouping courts, prosecutors and bailiffs; the unit most jurisdiction rules use     |
| [Cantons](./territory#cantons)                                             | 162       | Which justice of the peace has jurisdiction over an address                         |
| [Canton boundaries](./canton-boundaries)                                   | 162       | The canton of a point in a split city; the cantons on a map (GeoJSON)               |
| [Arrondissement boundaries](./canton-boundaries#arrondissement-boundaries) | 12        | The arrondissements on a map (GeoJSON)                                              |
| [Municipalities](./territory#municipalities)                               | 565       | Joining any Belgian address or statistic to the judicial map by REFNIS code         |
| [Regions](./territory#regions)                                             | 3         | The region of a municipality, by REFNIS code, named in three languages              |
| [Provinces](./territory#provinces)                                         | 10        | The province of a municipality (none in Brussels), with its region                  |
| [Postal codes](./postal-codes)                                             | 1 152     | From an address's postal code to its municipality, and on to its cantons and courts |
| [Police zones](./police-zones)                                             | 175       | Which police zone handles a municipality, by its official zone number               |
| [Courts](./courts)                                                         | 347       | Names, addresses and registries' contacts to write to, file with or pay any court   |
| [Court locations](./courts#locations)                                      | 139       | The justices of the peace on a map (GeoJSON points)                                 |
| [Prisons](./prisons)                                                       | 39        | Addresses and contacts of every prison and detention house                          |
| [Houses of justice](./houses-of-justice)                                   | 27        | Probation, victim support and social studies for the family courts                  |
| [Interest rates](./interest-rates)                                         | 2 series  | Calculating late-payment interest on a claim                                        |
| [Public holidays](./public-holidays)                                       | 10 rules  | Moving the last day of a deadline to the next working day (art. 53 Ger.W.)          |
| [Procedural indemnity](./procedural-indemnities)                           | 4 tariffs | The minimum, base and maximum indemnity for a claim on the day of the judgment      |

## How the datasets fit together

```
Judicial area ──< Arrondissement ──< Canton >──< Municipality (REFNIS) ──< Postal code
      │                 │              │  │
      │                 │              │  └── Canton boundary   the canton's geometry (NGI)
      └───────────── Court ────────────┘  a justice of the peace links to its canton,
                        │                 and every court's address to its municipality
                        └──< Division      a division links to its court
```

`──<` reads "has many". A municipality is usually in one canton; split cities (Antwerpen, Gent,
Brussel, Luik, …) are in several. On the administrative side, `Region ──< Province ──<
Municipality`, except that the Brussels-Capital Region has no province and holds its 19
municipalities directly.

Records link to each other by id, never by name: a court has a `judicialArea` id and, when its
area is one arrondissement, an `arrondissement` id; a canton lists the REFNIS codes of its
municipalities; a postal code and a court's address carry the REFNIS code of their
municipality. Names change spelling between sources and languages; ids don't.

## Why this data is useful

Belgian legal work runs into the same lookups over and over, and the official sources are hard
to use from code:

- **Jurisdiction.** The justice of the peace, police court and many other courts have jurisdiction
  by place. The law (the annex to the Judicial Code) describes those areas in prose, partly
  street by street. `cantons.json` turns that into a lookup from municipality to canton, and
  keeps the legal text for the split cities; `canton-boundaries.json` adds the NGI's geometry,
  so a point in a split city finds its canton.
- **Correct names and addresses.** Writs, conclusions and letters must address the right court
  as it names itself, such as `Vredegerecht Gent 1` or
  `Ondernemingsrechtbank Gent - afdeling Brugge`, and reach the right registry. The names are
  taken from the courts' own pages, in every language they publish in.
- **Interest calculations.** Claims for late payment use the legal rate or, between
  businesses, the commercial-transaction rate. Both change every year or semester, and the
  2013–2015 transition depends on the contract date. Getting one period wrong changes the
  amount claimed.
- **Joining other data.** REFNIS codes are what Statbel, the regions and most open data use.
  Mapping them to cantons and arrondissements lets you put caseload, population or address data
  on the judicial map.

## What isn't in it (yet)

See [known gaps](./known-gaps) for limitations of the current data and the
[roadmap](./roadmap) for datasets that are planned: the highest courts, history, bailiffs,
police zones and the cadastre and mortgage offices.

::: warning Reference data, not legal advice
The data is checked against official sources, but sources change and mistakes happen. Check
the official source before relying on a value, and
[report anything wrong](https://github.com/pieterjanscheir/belgica/issues/new?template=data-correction.yml).
:::
