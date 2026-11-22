# Upgrading

What each version changes for code that already uses belgica: what is new, what gives a
different answer than before, and what to change. The [changelog](./changelog) lists every
change; this page says what an upgrade asks of you.

It starts at 0.11. For earlier versions, read the changelog.

Before 1.0, a minor version can change an answer, as 0.11 does. Removing or renaming an id
always takes a major version: see the [id rules](./identifiers).

## 0.10 → 0.11 {#v0-11}

Released on 22 November 2026.

```sh
npm install belgica@0.11
pip install --upgrade belgica
```

### In short

| You                                                        | What to do                                                                 |
| ---------------------------------------------------------- | -------------------------------------------------------------------------- |
| call `findDivisionsWithJurisdiction` with `'police-court'` | Expect a division where you got the court: [see below](#v0-11-police)      |
| assume `findDivisionsWithJurisdiction` gives one result    | Pass `matter`, or handle two: [see below](#v0-11-matter)                   |
| validate the JSON with a schema or type of your own        | Allow `criminalArea`, or take the 0.11 schema: [see below](#v0-11-schema)  |
| read a division's `cantons` as its whole area              | For four divisions it is the area in civil cases: [see below](#v0-11-area) |
| use anything else                                          | Nothing                                                                    |

No id was removed or renamed, no function lost a parameter, and every other lookup gives the
answer it gave. The Python package changes in the same way.

### New

- The 33 divisions of the ten divided police courts have their area, so
  `findDivisionsWithJurisdiction` finds the division of a police court.
- A division can have a second area for criminal cases, in `criminalArea`.
- `findDivisionsWithJurisdiction` takes the kind of case: `{ matter: 'civil' | 'criminal' }`
  (Python: `matter='criminal'`).

The [divisions](/data/courts#divisions) section of the courts page explains all three.

### A police court lookup gives the division {#v0-11-police}

**Changes an answer.** `findDivisionsWithJurisdiction(municipalityId, 'police-court')` gave the
police court as a whole, because the divisions had no area. For the ten divided police courts it
now gives the division, which is another record: its own id, `kind: 'division'`, and its own
address and contacts.

```ts
findDivisionsWithJurisdiction('44021', 'police-court').map((c) => c.id)
// 0.10: ['police-court-oost-vlaanderen']
// 0.11: ['police-court-oost-vlaanderen-gent']
```

The five police courts without divisions (both of Brussels, Halle, Vilvoorde and Leuven) still
give themselves.

What to change:

- **You want the court, not the division.** Call `findCourtsWithJurisdiction`, which is
  unchanged, or go up from the division with `court`, which a division has and a court
  doesn't:

    ```ts
    const [found] = findDivisionsWithJurisdiction('44021', 'police-court')
    const court = found?.court ? getCourt(found.court) : found
    court?.id // 'police-court-oost-vlaanderen'
    ```

- **You listed the divisions to let someone choose.** That is no longer needed: the result is
  the division. `getDivisions` of a division is empty, so call it with the court's id if you
  still want the list.
- **You compared or stored the result's id.** An id stored from 0.10 is the court's and stays
  valid; a new lookup gives the division's.

### Two divisions for Hulshout and Herenthout {#v0-11-matter}

**Changes an answer.** The court of first instance and the police court of Antwerp have one area
for civil cases and another for criminal ones. Hulshout (13016) and Herenthout (13012) go to
Mechelen in civil cases and to Turnhout in criminal cases. 0.10 knew only the civil area.

Without `matter`, those two municipalities now get both divisions, the civil one first:

```ts
findDivisionsWithJurisdiction('13016', 'court-of-first-instance').map((c) => c.id)
// 0.10: ['court-of-first-instance-antwerpen-mechelen']
// 0.11: ['court-of-first-instance-antwerpen-mechelen', 'court-of-first-instance-antwerpen-turnhout']
```

What to change:

- **You know the kind of case.** Pass it, and you get one division:

    ```ts
    findDivisionsWithJurisdiction('13016', 'police-court', { matter: 'criminal' }).map((c) => c.id)
    // ['police-court-antwerpen-turnhout']
    ```

- **You don't.** Show both, as you would for a city split over cantons. Code that requires
  exactly one result fails for these two municipalities. For the court of first instance, code
  that takes the first result keeps getting Mechelen, the answer of 0.10; for the police court,
  0.10 gave the court as a whole, so [the change above](#v0-11-police) applies.

Every other municipality gets one division of these courts, with or without `matter`.

### A new field on four divisions {#v0-11-schema}

**Can fail a strict check.** Four divisions have a new optional field, `criminalArea`, with
`cantons` and `municipalities` inside: Mechelen and Turnhout of the court of first instance and
of the police court of Antwerp. The 33 police court divisions also get `cantons`, and some of
them `municipalities`, which they didn't have.

That matters only if you check the data yourself:

- **The JSON Schema** in [`schema/courts.schema.json`](./schema) refuses unknown fields. A copy
  from 0.10 rejects the four records: take the schema of the same version as the data.
- **Your own type or validator** that lists the fields of a court needs `criminalArea`.

belgica's own types and zod schemas have the field, and so do the summary files in
`data/courts/`.

### `cantons` is the civil area where there are two {#v0-11-area}

**Changes a meaning, for four records.** A division's `cantons` and `municipalities` were its
area. They still are, except for the four divisions with a `criminalArea`: there they are the
area in civil cases, and `criminalArea` is the one in criminal cases. If you work out a
division's area yourself:

```ts
const area = (division: Court, matter: Matter) =>
    (matter === 'criminal' ? division.criminalArea : undefined) ?? division
area(division, 'criminal').cantons
```

`findDivisionsWithJurisdiction` does this for you.

### Unchanged

- `findCourtsWithJurisdiction`, `findJusticesOfThePeace`, `findCourtsForPostalCode` and
  `getCourtsForCanton` give what they gave: the court, never a division.
- The divisions of the enterprise courts, labour courts and labour courts of appeal, and of
  the other courts of first instance, have the area they had.
- `belgica/courts` grows from 57.0 to 57.8 KB gzipped.
