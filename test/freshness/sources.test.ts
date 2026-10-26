/**
 * Checks that the official sources listed in datapackage.json are still online, so a moved or
 * removed page is noticed. The court pages are checked by the weekly sources workflow, which
 * fetches every one of them. Needs the network; set FRESHNESS_ONLINE=1.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const { resources } = JSON.parse(readFileSync('datapackage.json', 'utf8')) as {
    resources: { sources: { path?: string }[] }[]
}
const urls = new Set<string>(
    resources.flatMap((r) => r.sources.map((s) => s.path).filter((p) => p !== undefined)),
)

// ejustice resets connections from GitHub's runners; check it from elsewhere (pnpm build:cantons)
const blocked = (url: string) => new URL(url).host === 'www.ejustice.just.fgov.be'
const runner = process.env['GITHUB_ACTIONS'] === 'true'
// The e-Justice portal's firewall answers GitHub's runners with 403; a moved page still shows as 404
const walled = (url: string) => new URL(url).host === 'e-justice.europa.eu'

describe.runIf(process.env['FRESHNESS_ONLINE'] === '1')('source URLs', () => {
    it.each([...urls].filter((url) => !(runner && blocked(url))))('%s responds', async (url) => {
        const res = await fetch(url, {
            redirect: 'follow',
            headers: {
                'user-agent':
                    'belgica freshness check (+https://github.com/pieterjanscheir/belgica)',
            },
            signal: AbortSignal.timeout(25_000),
        })
        if (runner && walled(url) && res.status === 403) return
        expect(res.status, url).toBeLessThan(400)
    })
})
