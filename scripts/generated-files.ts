/**
 * The committed files that `pnpm generate` writes. One list, for the two places that need it:
 *
 * - `pnpm check` ends with `node scripts/generated-files.ts --check`, which fails when one of
 *   them differs from what is committed;
 * - the sources workflow stages them with the data it rebuilt
 *   (`git add data $(node scripts/generated-files.ts)`), so a data pull request never leaves
 *   main with a generated file that is behind.
 *
 * A file `pnpm generate` starts writing goes in this list (test/parse/generated-files.test.ts
 * checks the `src/*.generated.ts` files). The files under data/courts/ and data/cantons/ are
 * generated too, but published without being committed, so they aren't here.
 */
import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

export const GENERATED_FILES = [
    'schema',
    'data/courts.json',
    'src/ids.generated.ts',
    'src/canton-names.generated.ts',
    'src/data-files.generated.ts',
    'src/court-details-files.generated.ts',
    'ids.lock.json',
] as const

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    if (process.argv[2] === '--check') {
        // Prints the diff, and exits with git's status: 1 when a file is out of date
        const { status } = spawnSync('git', ['diff', '--exit-code', '--', ...GENERATED_FILES], {
            stdio: 'inherit',
        })
        if (status !== 0) {
            console.error(
                '\nGenerated files are out of date: run `pnpm generate` and commit the result.',
            )
        }
        process.exit(status ?? 1)
    }
    console.log(GENERATED_FILES.join('\n'))
}
