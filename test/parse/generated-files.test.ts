import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { GENERATED_FILES } from '../../scripts/generated-files.ts'

describe('the list of generated files', () => {
    it('has every generated source file', () => {
        const generated = readdirSync('src')
            .filter((file) => file.endsWith('.generated.ts'))
            .map((file) => `src/${file}`)
        expect(generated.length).toBeGreaterThan(0)
        expect(GENERATED_FILES).toEqual(expect.arrayContaining(generated))
    })

    // Two lists drifted apart before: a data pull request that added a court left
    // src/court-details-files.generated.ts behind, and `pnpm check` failed on main
    it('is what pnpm check verifies and what the sources workflow stages', () => {
        const { scripts } = JSON.parse(readFileSync('package.json', 'utf8')) as {
            scripts: { check: string }
        }
        expect(scripts.check).toContain('node scripts/generated-files.ts --check')
        expect(scripts.check).not.toContain('git diff')

        const workflow = readFileSync('.github/workflows/sources.yml', 'utf8')
        const paths = 'data $(node scripts/generated-files.ts)'
        expect(workflow).toContain(`git diff --quiet -- ${paths}`)
        expect(workflow).toContain(`git add ${paths}`)
    })
})
