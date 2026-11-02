# Identifiers

Every record has an `id`. Other records, your database and your URLs refer to it, so an id has
to be right once and then never change. This page sets out the rules, why each one exists, and
what happens when the law changes the thing an id names.

## The rules

1. **Every record has an `id` field**, and it is unique within its dataset. Generic code (an
   index, a cache, a form) treats every dataset the same way.
2. **An official code wins, if it covers every record.** Where the authorities assign a code
   to every record of a dataset, the id _is_ that code: municipalities use their Statbel REFNIS
   code (`44021` for Gent). A code that covers only some records is kept as a field instead:
   courts have their ECLI codes in `ecli`, Flemish houses of justice their OVO number in `ovo`
   (see [why](#why-not-the-official-court-codes)).
3. **Otherwise, lowercase kebab-case ASCII**: `^[a-z0-9]+(-[a-z0-9]+)*$`, built by
   [`scripts/id.ts`](https://github.com/pieterjanscheir/belgica/blob/main/scripts/id.ts):
   accents dropped, everything else that isn't a letter or digit becomes one hyphen.
   `Merelbeke-Melle` → `merelbeke-melle`, `Braine-l'Alleud` → `braine-l-alleud`,
   `Liège` → `liege`.
4. **From the official name in the local language**: Dutch in Flanders, French in Wallonia,
   German around Eupen. Brussels is officially bilingual and needs one fixed choice: Dutch.
5. **A number is a suffix**: places with several cantons get `gent-1` … `gent-5`.
6. **Courts are `type` + place**: `justice-of-the-peace-gent-1`, `court-of-appeal-liege`. A
   justice of the peace takes its canton's id. The two courts of one type in Brussels, one per
   language, add `-nl` or `-fr` (`police-court-brussel-fr`). A division or seat adds its own
   place to its court's id (`enterprise-court-gent-brugge`). The prefix keeps ids unique when
   Gent has a justice of the peace, an enterprise court and a labour court, and it is exactly
   the record's `type`, so it never needs a second vocabulary.
7. **Prisons and houses of justice are their name** in the local language, without articles:
   `gevangenis-gent`, `prison-lantin`, `justitiehuis-gent`, `maison-justice-arlon`. Their names
   already say what they are, and two institutions in one city (the central and the auxiliary
   prison of Leuven) differ by name.
8. **Links are fields, never derived strings.** A justice of the peace has a `canton` field; a
   canton lists `{ municipality }`; an arrondissement has a `judicialArea`. Each holds the id of
   the record it points to, and the field is named after the dataset it points into.

All of these are enforced by tests (`test/ids.test.ts`) and by the
[JSON Schemas](./schema), which list the valid ids, so a dangling link fails validation.

## The ids

| Dataset           | Examples                                                                                                                  | Rule                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| Judicial areas    | `antwerpen`, `brussel`, `gent`, `liege`, `mons`                                                                           | Local name                |
| Arrondissements   | `oost-vlaanderen`, `brabant-wallon`, `eupen`                                                                              | Local name                |
| Cantons           | `gent-1`, `merelbeke-melle`, `wavre-1`, `oudergem`, `eupen-sankt-vith-1`                                                  | Local name + number       |
| Canton boundaries | `gent-1`: one boundary per canton, with the canton's id, and `canton` as the link                                         | The canton's id           |
| Municipalities    | `44021`, `21004`                                                                                                          | REFNIS code               |
| Provinces         | `10000`, `40000`                                                                                                          | REFNIS code               |
| Regions           | `02000`, `03000`, `04000`                                                                                                 | REFNIS code               |
| Postal codes      | `9000-44021`, `1040-21005`                                                                                                | Postal code + REFNIS code |
| Police zones      | `5415`, `5349`                                                                                                            | Official zone number      |
| Courts            | `justice-of-the-peace-gent-1`, `enterprise-court-gent-brugge`, `police-court-brussel-fr`, `police-court-eupen-sankt-vith` | Type + place              |
| Prisons           | `gevangenis-gent`, `prison-lantin`, `detentiehuis-kortrijk`                                                               | Local name                |
| Houses of justice | `justitiehuis-gent`, `maison-justice-arlon`                                                                               | Local name                |
| Interest rates    | `legal`, `commercial`                                                                                                     | Fixed keys                |

## Why these choices

**Why kebab-case?** Ids end up in URLs (`/cantons/gent-1`), file names, CSS classes, database
keys and log lines. Lowercase avoids collisions on case-insensitive systems (macOS and Windows
file systems, many database collations): `Gent1` and `gent1` would be two ids in the data and
one file on disk. Hyphens keep word boundaries readable without capitals, and the character set
needs no escaping anywhere.

**Why readable ids rather than numbers or UUIDs?** A reference dataset is read by people:
`justice-of-the-peace-gent-1` in a database row or an error message tells you what it is. The
ids are as stable as numbers would be, because they only change when the law changes the thing
they name (see below), and then a new id is the right outcome.

**Why the local language, not English?** English names exist for a handful of places (Ghent,
Antwerp, Liege) and not for the 162 cantons, so English ids would mean two rules. The local name
is also the one the institution uses itself, and it's in the official texts.

**Why official codes?** REFNIS is what Statbel, the regions and almost every Belgian dataset use.
With the code as the id, joining any of them to cantons and courts needs no mapping table.

**Why two codes for a postal code?** A postal code alone doesn't name a record: `1040` belongs
to Brussel and to Etterbeek, and each pair is its own record with its own validity. The pair of
official codes, `1040-21005`, is unique and stays what it is until Statbel's table changes the
pair, which is exactly when a new record is right. The municipality is also a field
(`municipality`), as rule 8 asks: the id is a key, not something to split.

**Why `type` in court ids?** Within one place there are several courts, and court types will
grow (police courts, labour courts, courts of first instance…). A court's own fields say what
it is; the id only needs to be unique and recognisable, and the type does both.

**Why not the official court codes?** Courts have two official codes, and neither covers
every court. ECLI codes (`HBGNT` for the Ghent court of appeal) exist per court and per
language, not per division, and none appear in published decisions of the justices of the
peace. Enterprise numbers (KBO) belong to the FPS Justice; its establishment units follow
buildings, not courts, and change when a court moves. A rule that holds for every record beats
two rules, so the ECLI codes are a field (`ecli`), and the id follows rule 6.

**Why explicit links?** The old scheme built a court id by concatenating `Vredegerecht` and the
canton id. That hides a relation in a string format, which breaks the moment one court serves
two cantons or a name changes. A `canton` field is checked by the schema and the tests, and can
be followed in both directions.

## In TypeScript

Every dataset has a generated id type (`CantonId`, `CourtId`, `MunicipalityId`, `ProvinceId`,
`RegionId`, `ArrondissementId`, `JudicialAreaId`, `PrisonId`, `HouseOfJusticeId`, `PostalCodeId`, `PoliceZoneId`), regenerated
from the data by `pnpm build:ids`:

```ts
import { getCanton, type CantonId } from 'belgica'

getCanton('gent-1') // Canton: a known id always finds its record
getCanton(userInput) // Canton | undefined: any other string may not

const id: CantonId = 'gent1' // compile error: not a canton id
```

Use the id types for values you store, so a typo or a removed id is caught when you upgrade.

## When the law changes an id

Cantons and municipalities do change: municipalities merged in 2019 and 2025, and laws redraw
cantons. Records carry a validity period (`validFrom`, `validTo`), so a change adds history
rather than erasing it:

1. The old record stays, with a `validTo`; the new one gets a new id and a `validFrom`. An id
   is never reused for a different thing, so an id stored years ago still finds what it meant.
2. Without a day, lookups answer for today: a lookup by id gives the version that applies
   today (the last one, for a record that has ended), and lists such as
   `getCantonsForMunicipality` only what applies today. With `{ on }` both answer for that day.
3. The changelog lists every new id and the ids it replaces.

A change of name alone, such as a spelling correction, doesn't change the id. The history
before 1 January 2025 isn't in the data yet
([#27](https://github.com/pieterjanscheir/belgica/issues/27)): a lookup for an earlier
day throws a `RangeError` rather than answer with today's map.

## Ids are opaque

An id is a key, not a format. `court-of-first-instance-luxembourg-marche-en-famenne` cannot be
split back into type, place and division, because the type, the place and the language suffix
all use the same hyphen. Don't parse ids: every part of one is also a field (`type`, `court`,
`canton`, `arrondissement`), and the fields are what the schemas and the tests check.

## Stability

Ids are public API. Adding records is a minor version, correcting a value a patch, and removing
or renaming an id a major version. Version 0.3.0 replaces the earlier PascalCase ids
(`VredegerechtGent1`, `EastFlanders`) with this scheme before the package had any users; the
[changelog](./changelog) lists the mapping.

The promise is checked, not just made. `ids.lock.json` lists every id the package has
published, per dataset; `pnpm generate` adds new ids to it and never removes one, and
`test/ids.test.ts` fails when a locked id is missing from the data. So a scraper that reads a
retitled page, a regenerated canton list or a hand edit can't drop or rename an id unnoticed:
the data pull request fails, and a person maps the new name to the existing id in the
parser, or ends the record with a `validTo`. Taking an id out of the lock is a deliberate act,
for a major version, with the id and its replacement in the changelog.
