import { defineConfig, type Options } from 'tsup'

// belgica/courts/load imports each file in data/courts/ with import(): keep those imports out of
// the bundle, as they are, so a consumer's bundler makes a chunk of each file and Node reads
// them from data/. The path stays right because src/ and dist/ are both one level down.
// The canton (22 MB) and arrondissement (8 MB) boundaries are kept out too, so the package holds
// them once, in data/.
const keptApart = new Set([
    '../data/canton-boundaries.json',
    '../data/arrondissement-boundaries.json',
])
const keepDataFilesApart: NonNullable<Options['esbuildPlugins']>[number] = {
    name: 'keep-data-files-apart',
    setup(build) {
        build.onResolve({ filter: /^\.\.\/data\/.+\.json$/ }, (args) =>
            args.kind === 'dynamic-import' || keptApart.has(args.path) ?
                { path: args.path, external: true }
            :   undefined,
        )
    },
}

// ESM only: Node ≥ 22.12 loads ESM from require() as well, so a CommonJS build would only add a
// second copy of the data. The JSON is inlined, except the boundaries, which
// belgica/canton-boundaries and belgica/arrondissement-boundaries import from data/ with
// `with { type: 'json' }`. Each dataset
// has its own entry point, so importing only the interest rates doesn't pull in the cantons, and
// the boundaries (the largest by far) are only in theirs: the root doesn't re-export them.
// The zod schemas have their own entry point too: the datasets only import their types, so zod
// isn't in their bundles. belgica/courts/format and belgica/courts/load import no data of their
// own; belgica/cantons is the cantons without their territory texts, which are in
// belgica/cantons/territory.
export default defineConfig({
    entry: {
        index: 'src/index.ts',
        territory: 'src/territory.ts',
        'canton-boundaries': 'src/canton-boundaries.ts',
        'arrondissement-boundaries': 'src/arrondissement-boundaries.ts',
        courts: 'src/courts.ts',
        'court-locations': 'src/court-locations.ts',
        'courts-format': 'src/court-format.ts',
        'courts-load': 'src/courts-load.ts',
        cantons: 'src/cantons.ts',
        'canton-territory': 'src/canton-territory.ts',
        prisons: 'src/prisons.ts',
        'houses-of-justice': 'src/houses-of-justice.ts',
        'interest-rates': 'src/interest-rates.ts',
        calendar: 'src/calendar.ts',
        'postal-codes': 'src/postal-codes.ts',
        'police-zones': 'src/police-zones.ts',
        schemas: 'src/schemas/index.ts',
    },
    format: ['esm'],
    target: 'node22',
    dts: true,
    clean: true,
    splitting: true,
    esbuildPlugins: [keepDataFilesApart],
})
