# Contributing

## Updating data

The courts, prisons, houses of justice and canton boundaries are built from the official
sources every week ([how](./data-quality#how-the-data-is-built)): don't edit them by hand. Fix the parser in
`scripts/parse`, or, if the source itself is wrong, report it to the court. The weekly pull
request is reviewed like any other: compare the diff with the sources before merging.

For the datasets kept by hand (judicial areas, arrondissements, interest rates):

1. Edit the JSON in `data/`. Keep the existing ids: projects store them.
2. Update `lastReviewed` for the dataset in `datapackage.json` if you checked it against its
   sources.
3. `pnpm check`: regenerate the id types and schemas, typecheck, lint and format check, build,
   tests with coverage, and package lint. It fails when the generated files aren't committed.
4. Add a line to `CHANGELOG.md` under Unreleased, and commit (including `schema/`,
   `data/courts.json`, the `src/*.generated.ts` files and `ids.lock.json`).
   The build output (`dist/`) isn't committed, nor are the files split into `data/courts/` and
   `data/cantons/`: they're built for every release and published to npm.

An id that was published stays: `ids.lock.json` lists them all and the tests fail when one is
missing from the data. If a source renamed a record, map the new name to the existing id in the
parser; if the record ended, keep it with a `validTo`. See
[identifiers](./identifiers#stability).

### Cantons and municipalities

`data/cantons.json` and `data/municipalities.json` are generated; don't edit them by hand. Run
`pnpm build:cantons` (needs network access and `unzip`). It reads:

- the annex to the Judicial Code, "Gebiedsomschrijving en zetel van hoven en rechtbanken"
  ([ELI, numac 1967101058](https://www.ejustice.just.fgov.be/eli/wet/1967/10/10/1967101058/justel)),
  in Dutch and French;
- Statbel's population-by-municipality file for the current municipalities and REFNIS codes.

It parses the Dutch and French texts separately and refuses to write anything unless they agree
and every municipality is covered exactly once (or split over several cantons). Exonyms the annex
uses but Statbel doesn't (`Gembloers`, `Saint-Nicolas`, …), typos in the annex, and boundary
mentions it can't tell apart are listed at the top of the script.

Rerun it after a law changes the annex or municipalities merge. Canton ids follow the local
language (Dutch in Flanders and Brussels, French in Wallonia, German around Eupen); the justice of
the peace of canton `x` has id `justice-of-the-peace-x` and links to it through its `canton` field.

### Scraped datasets

```bash
pnpm fetch:sources            # every source into .sources/ (about 20 minutes, politely)
pnpm fetch:sources courts     # or one source
pnpm build:data               # rebuild every scraped dataset from .sources/
```

The canton boundaries come from the NGI's GeoPackage (source `ngi`), read with Node's own
SQLite; when the NGI renames a canton, map its code to the id in `CANTON_ALIASES` in
`scripts/parse/boundaries.ts`.

Or check out the latest snapshots instead of fetching: `git worktree add .sources origin/sources`.

A source is a walk in `scripts/sources/catalog.ts`; a parser reads its snapshots in
`scripts/parse`. When a site changes its markup, the parser tests in `test/parse` (on trimmed
copies of real pages in `test/fixtures/sources`) show what broke.

### New interest rates

- **Commercial**: FOD Financiën publishes the rate per semester. Add a period with `from`, `to`,
  `rate`, and the Staatsblad date in `note`.
- **Legal**: published per calendar year. Add a period for the year.

## Adding a dataset

Every dataset gets the same treatment, so users can rely on it:

1. **Data**: `data/<name>.json`, an array of records. Every value from an official source.
2. **Ids**: follow the [identifier rules](./identifiers): an official code when one exists,
   otherwise lowercase kebab-case from the local-language name (`scripts/id.ts`).
3. **Links, not copies**: refer to arrondissements, cantons and municipalities by id, and reuse
   the shared types (`Translated`, `Address`, `Contact`, `SourceRef`).
4. **Sources**: a `sources: [{ url, retrieved }]` on each record, and an entry in
   `datapackage.json` with the dataset's sources, licence, `lastReviewed` and
   `reviewEveryMonths`.
5. **Types and helpers**: `src/<name>.ts`, with its own entry point in
   `tsup.config.ts` and `package.json` `exports`. Re-export it from `src/index.ts` only if it is
   tiny ([below](#keeping-the-package-light)).
6. **Schema**: a zod schema in `src/schemas/`, exported from `src/schemas/index.ts` with the
   file in `dataFileSchemas`. The record type is its `z.infer`; the JSON Schema is generated
   from it, with the JSDoc comments as descriptions.
7. **Source and parser**: a walk in `scripts/sources/catalog.ts` that fetches the official
   pages, and a parser in `scripts/parse` that builds the file from the snapshots, with
   fixtures and tests. It reads only what it can read for certain and reports the rest.
8. **Tests**: unique ids, references that resolve, and the count the official source gives.
9. **Docs**: a page under `docs/data/` with the same sections as the others: what the file holds,
   why it's useful, a "Source and updates" table (source, built by, changes when, covers,
   checked, licence), the fields, and an example. Add its functions to the
   [API reference](/api), each with its signature, results, errors and an example.

### Keeping the package light {#keeping-the-package-light}

Every dataset ships to every user, whatever they import, so a new one shouldn't grow the
package for everyone:

1. **One dataset, one entry point.** Its own subpath in `tsup.config.ts` and `package.json`
   `exports`. Re-export it from the root `src/index.ts` only if it is tiny.
2. **Large data loads on demand.** Above about 500 KB, split it into a small index and files
   loaded when asked for, as `data/courts/` and `belgica/courts/load` do (`scripts/build-data-files.ts`).
3. **One copy.** The canonical file lives in `data/`; don't inline it into `dist/` as well.
4. **Geometry is opt-in.** Points and boundaries get their own entry point, never sit next to
   the tabular data.
5. **Check the size.** `pnpm test:package` reports the package size and fails over the limits in
   `test/smoke/package-size.mjs` (the whole package, the package without the boundaries, and any
   single file outside the boundaries), and `test/smoke/bundle-size.mjs` does the same for what a browser app ships. CI
   shows the numbers in the job summary. Raise a limit on purpose, with the reason in the
   changelog.

Personal data stays out. A register of natural persons (individual bailiffs, notaries, experts,
mediators) changes all the time and every record is personal data: link to the official search
instead, and keep the offices, chambers and the areas they cover.

## Checks

| Command                     | What it does                                                                                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm check`                | Everything CI runs: `generate`, `typecheck`, `lint`, `build`, `test:coverage`, `test:package`, `lint:package`, and a check that generated files are committed |
| `pnpm test`                 | Unit, integrity, schema and type tests on the source (no build needed; it splits `data/courts/` and `data/cantons/` first)                                    |
| `pnpm test:package`         | Smoke tests of the built package with `import` and `require()`: run `pnpm build` first                                                                        |
| `pnpm test:coverage`        | The same, failing below 100 % coverage of `src/`                                                                                                              |
| `pnpm lint` / `pnpm format` | ESLint and Prettier: check / fix. ESLint also requires a doc comment on every export in `src/`                                                                |
| `pnpm generate`             | Regenerate the courts' `label`, `src/ids.generated.ts` (id types) and `schema/`, add new ids to `ids.lock.json`, and split `data/courts/` and `data/cantons/` |
| `pnpm lint:package`         | `publint` and `arethetypeswrong` on the packed package                                                                                                        |
| `pnpm test:freshness`       | Date-based checks: missing rates, overdue reviews. Not part of `check`; `FRESHNESS_ONLINE=1` also checks the source URLs                                      |
| `pnpm fetch:sources`        | Fetch the official sources into `.sources/`                                                                                                                   |
| `pnpm build:data`           | Rebuild the courts, prisons, houses of justice, postal codes, regions, provinces and canton boundaries from `.sources/`                                       |
| `pnpm build:cases`          | Write the TypeScript helpers' answers for the Python package's tests into `python/tests/.cases/` (after `pnpm build`)                                         |
| `pnpm build:csv`            | Write the data as CSV tables into `csv/`                                                                                                                      |

## Releasing

1. Run the **Prepare release** workflow from the Actions tab and pick patch, minor or major by
   the id rules at the top of `CHANGELOG.md`. It moves the Unreleased entries under the new
   version, bumps `version` in `package.json` and the Python package (`python/pyproject.toml`
   and `python/uv.lock`), points the raw data links in the docs at the new
   tag (`scripts/prepare-release.ts`), and opens the release pull request.
2. Tidy the version's section if it needs it (two branches can each add an `### Added`), check
   the pull request, and merge it.

Merging a new `version` into main starts the release workflow: it runs `pnpm check`, publishes
to npm with provenance and to PyPI, tags the commit, and creates a GitHub release with the data, schemas and
CSV tables attached. The release notes are the version's section of `CHANGELOG.md`, followed by
the list of pull requests. Bumping the version by hand in a pull request, or pushing a `v*` tag
that matches `version`, releases the same way.

`CHANGELOG.md` merges with git's union driver (`.gitattributes`): merging main into a branch
keeps both sides' Unreleased entries instead of stopping at a conflict. GitHub's merge button
doesn't use it, so merge main into the branch locally when GitHub reports a conflict there.

### The bot

The release pull request and the weekly data pull request are opened by a workflow. With the
workflow's own token GitHub doesn't run CI on them, so they're opened with a token from a GitHub
App when one is set up. Without it, close and reopen those pull requests to run CI. To set it up:

1. Create a GitHub App under Settings → Developer settings → GitHub Apps → New GitHub App: any
   name, any homepage URL, webhook off, repository permissions **Contents: read and write** and
   **Pull requests: read and write**, installable only on this account.
2. Note its **Client ID**, generate a **private key**, and install the app on this repository.
3. In the repository's Settings → Secrets and variables → Actions, add the variable
   `BOT_CLIENT_ID` and the secret `BOT_PRIVATE_KEY` (the whole `.pem` file).

Every pull request also gets a preview package from [pkg.pr.new](https://pkg.pr.new), with the
install command in a comment, to try a change before it's released.

## This website

The site lives in `docs/` and is built with [VitePress](https://vitepress.dev). The interactive
tables import the package's own `src/` and `data/`, so they always show the data in the repository.

```bash
pnpm docs:dev      # local server with hot reload
pnpm docs:build    # static site in docs/.vitepress/dist
pnpm docs:preview  # serve the built site
```

Every push to `main` deploys it to GitHub Pages. CI builds it on every pull request, so a broken
page is caught before merging.

### Translations

The English pages in `docs/` are the source of truth. Every other language has the same tree
under its own folder: Dutch (`docs/nl/`) and French (`docs/fr/`), and German, Spanish, Italian,
Portuguese, Polish, Turkish, Arabic, Ukrainian, Chinese and Japanese (`docs/de/`, `docs/es/`,
and so on). They are translations of the English page and are updated after it changes. When
you change an English page, change the same page in `docs/nl/` and `docs/fr/` too, or say in
the pull request that the translations lag behind; the other languages may lag a release. The
words of the theme and the interactive components in those other languages are in
`docs/.vitepress/locales/`.

Some pages are in English only for now, and every language's sidebar links to the English
page: the introduction, core concepts, common tasks, entry points, Python and public holidays.
A new page can start that way too; give its sidebar label an English fallback in
`docs/.vitepress/locales/types.ts`.

Code, ids, field names and official names stay as they are in every language, and every heading
keeps the English anchor (`## Heading {#english-anchor}`) so cross-links and the language
switcher keep working. A Belgian institution or legal term keeps its official Dutch or French
name (or German, where Belgium publishes one) instead of a coined translation: a Chinese page
says vredegerecht / justice de paix, not a made-up word for it. The changelog is kept in English
only.
