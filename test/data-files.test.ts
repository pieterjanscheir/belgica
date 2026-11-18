// The files scripts/build-data-files.ts splits data/courts.json and data/cantons.json into, and
// the entry points that read them: together they must hold exactly what the complete files do.
import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { getCanton as getSummary, cantons as summaries } from '../src/cantons'
import { getCantonTerritory } from '../src/canton-territory'
import { formatCourtName as formatWithoutData } from '../src/court-format'
import { buildCourtLabel } from '../src/court-label'
import { loadCourt, loadCourtDetails, loadCourts } from '../src/courts-load'
import { courtDetailsFiles } from '../src/court-details-files.generated'
import { courtIndexFile, courtListFiles } from '../src/data-files.generated'
import {
    appliesOn,
    cantons,
    courts,
    formatCourtName,
    getCanton,
    getCourt,
    type Court,
    type CourtDetails,
    type CourtSummary,
    type Locale,
} from '../src'
import { cantonSummarySchema, cantonTerritorySchema } from '../src/schemas'
import { courtDetailsSchema, courtSummarySchema } from '../src/schemas/courts'
import { cantonNames } from '../src/canton-names.generated'
import { today as todayInBelgium } from '../src/time'

const read = (path: string): unknown => JSON.parse(readFileSync(path, 'utf8'))
const files = readdirSync('data/courts', { recursive: true, encoding: 'utf8' })
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''))
const details = files.filter((f) => f.startsWith('details/'))
const lists = files.filter((f) => !f.startsWith('details/') && f !== 'index')
const typeFiles = lists.filter((f) => !f.includes('/'))
const blocks = lists.filter((f) => f.includes('/'))
const index = read('data/courts/index.json') as Record<string, string>
const locales: Locale[] = ['nl', 'fr', 'de']
const today = todayInBelgium()

describe('data/courts/', () => {
    it('has a file per court type, and only those', () => {
        expect(typeFiles.sort()).toEqual([...new Set(courts.map((c) => c.type))].sort())
    })

    it('puts every court in exactly one building block, by its arrondissement or area', () => {
        const seen = new Map<Court, string[]>()
        for (const block of blocks) {
            for (const summary of read(`data/courts/${block}.json`) as CourtSummary[]) {
                const court = courts.find(
                    (c) => c.id === summary.id && c.validFrom === summary.validFrom,
                )
                expect(court, summary.id).toBeDefined()
                if (court) seen.set(court, [...(seen.get(court) ?? []), block])
            }
        }
        for (const court of courts) {
            const block =
                court.arrondissement === undefined ?
                    `${court.type}/judicial-area/${court.judicialArea}`
                :   `${court.type}/${court.arrondissement}`
            expect(seen.get(court), court.id).toEqual([block])
        }
    })

    it('holds a whole type in its type file, in the order of courts.json', () => {
        for (const type of typeFiles) {
            expect((read(`data/courts/${type}.json`) as CourtSummary[]).map((c) => c.id)).toEqual(
                courts.filter((c) => c.type === type).map((c) => c.id),
            )
        }
    })

    it('splits each record into a summary and details that together are the full record', () => {
        const summariesById = new Map<string, CourtSummary[]>()
        for (const type of typeFiles)
            for (const s of read(`data/courts/${type}.json`) as CourtSummary[])
                summariesById.set(s.id, [...(summariesById.get(s.id) ?? []), s])
        expect(details).toHaveLength(new Set(courts.map((c) => c.id)).size)
        for (const court of courts) {
            const versions = (id: string) => (v: { id: string; validFrom?: string }) =>
                v.id === id && v.validFrom === court.validFrom
            const summary = summariesById.get(court.id)?.find(versions(court.id))
            const detail = (read(`data/courts/details/${court.id}.json`) as CourtDetails[]).find(
                versions(court.id),
            )
            expect(courtSummarySchema.strict().parse(summary)).toEqual(summary)
            expect(courtDetailsSchema.strict().parse(detail)).toEqual(detail)
            expect({ ...summary, ...detail }).toEqual(court)
            // Nothing is in both but the id and validity
            const shared = Object.keys(summary ?? {}).filter((k) => k in (detail ?? {}))
            expect(shared.every((k) => ['id', 'validFrom', 'validTo'].includes(k))).toBe(true)
        }
    })

    it('has an index that leads every id to the file it is in', () => {
        expect(Object.keys(index).sort()).toEqual([...new Set(courts.map((c) => c.id))].sort())
        for (const [id, file] of Object.entries(index)) {
            expect(blocks).toContain(file)
            expect((read(`data/courts/${file}.json`) as CourtSummary[]).map((c) => c.id)).toContain(
                id,
            )
        }
    })
})

describe('data/cantons/', () => {
    it('splits each canton into a summary and its territory', () => {
        const territories = read('data/cantons/territory.json') as unknown[]
        expect(summaries).toHaveLength(cantons.length)
        cantons.forEach((canton, i) => {
            expect(cantonSummarySchema.parse(summaries[i])).toEqual(summaries[i])
            expect(cantonTerritorySchema.parse(territories[i])).toEqual(territories[i])
            expect({ ...summaries[i], ...(territories[i] as object) }).toEqual(canton)
        })
    })

    it('looks a canton up without its territory, and the territory apart', () => {
        expect(getSummary('gent-1')).toEqual({ ...getCanton('gent-1'), territory: undefined })
        expect(getSummary('gent-1')).not.toHaveProperty('territory')
        expect(getSummary('nope')).toBeUndefined()
        expect(getCantonTerritory('gent-1')).toEqual(getCanton('gent-1').territory)
        expect(getCantonTerritory('nope', { on: '2025-06-01' })).toBeUndefined()
        expect(() => getCantonTerritory('gent-1', { on: '2024-12-31' })).toThrow(RangeError)
    })
})

describe('src/data-files.generated.ts', () => {
    it('has a loader for every file, and loads that file', async () => {
        expect(Object.keys(courtListFiles).sort()).toEqual([...lists].sort())
        expect(Object.keys(courtDetailsFiles).map((id) => `details/${id}`)).toEqual(
            expect.arrayContaining(details),
        )
        expect(Object.keys(courtDetailsFiles)).toHaveLength(details.length)
        for (const [file, load] of Object.entries(courtListFiles))
            expect((await load()).default, file).toEqual(read(`data/courts/${file}.json`))
        for (const [id, load] of Object.entries(courtDetailsFiles))
            expect((await load()).default, id).toEqual(read(`data/courts/details/${id}.json`))
        expect((await courtIndexFile()).default).toEqual(index)
    })
})

describe('belgica/courts/load', () => {
    it('loads a type, or a type in an arrondissement', async () => {
        const east = await loadCourts({
            type: 'justice-of-the-peace',
            arrondissement: 'oost-vlaanderen',
        })
        expect(east.map((c) => c.id)).toContain('justice-of-the-peace-gent-1')
        expect(east.every((c) => c.arrondissement === 'oost-vlaanderen')).toBe(true)
        const appeal = await loadCourts({ type: 'court-of-appeal' })
        expect(appeal.map((c) => c.id)).toContain('court-of-appeal-antwerpen')
        expect(appeal).toHaveLength(courts.filter((c) => c.type === 'court-of-appeal').length)
    })

    it('gives an empty list for an unknown type or arrondissement', async () => {
        expect(await loadCourts({ type: 'police-court', arrondissement: 'nope' })).toEqual([])
        expect(await loadCourts({ type: 'toString' as 'police-court' })).toEqual([])
    })

    it('rejects a day before the coverage', async () => {
        await expect(loadCourts({ type: 'police-court' }, { on: '2024-12-31' })).rejects.toThrow(
            RangeError,
        )
    })

    it('loads one court by id, through the index', async () => {
        const court = await loadCourt('justice-of-the-peace-gent-1')
        expect(court).toEqual(
            (read('data/courts/justice-of-the-peace/oost-vlaanderen.json') as CourtSummary[]).find(
                (c) => c.id === 'justice-of-the-peace-gent-1',
            ),
        )
        expect(await loadCourt('justice-of-the-peace-gent-1', { on: '2025-06-01' })).toEqual(court)
        expect(await loadCourt('nope')).toBeUndefined()
        expect(await loadCourt('constructor')).toBeUndefined()
    })

    it("loads one court's details", async () => {
        const detail = await loadCourtDetails('court-of-appeal-liege')
        expect(detail?.contacts).toEqual(getCourt('court-of-appeal-liege').contacts)
        expect(detail).not.toHaveProperty('address')
        expect(await loadCourtDetails('nope')).toBeUndefined()
        await expect(
            loadCourtDetails('court-of-appeal-liege', { on: '2024-12-31' }),
        ).rejects.toThrow(RangeError)
    })
})

describe('label', () => {
    const justicesOfThePeace = courts.filter(
        (c) => c.type === 'justice-of-the-peace' && c.kind === 'court',
    )

    it('is on every justice of the peace, and on no other court or seat', () => {
        expect(justicesOfThePeace.every((c) => c.label)).toBe(true)
        expect(courts.filter((c) => c.label)).toHaveLength(justicesOfThePeace.length)
    })

    it.each(locales)("equals formatCourtName's canton style built from the canton, in %s", (l) => {
        for (const court of justicesOfThePeace.filter((c) => appliesOn(c, today))) {
            const { label, ...withoutLabel } = court
            const built = formatCourtName(withoutLabel, l, { style: 'canton' })
            expect(label?.[l], court.id).toBe(built)
            expect(formatCourtName(court, l, { style: 'canton' })).toBe(built)
            expect(formatWithoutData(court, l, { style: 'canton' })).toBe(built)
        }
    })

    it('leaves the official name to the official style', () => {
        const gent1 = getCourt('justice-of-the-peace-gent-1')
        expect(formatCourtName(gent1, 'nl')).toBe('Vredegerecht Gent 1')
        expect(formatWithoutData(gent1, 'nl')).toBe('Vredegerecht Gent 1')
    })

    it('falls back to the official name in belgica/courts/format without a stored label', () => {
        const gent1: Court = { ...getCourt('justice-of-the-peace-gent-1') }
        delete gent1.label
        expect(formatWithoutData(gent1, 'fr', { style: 'canton' })).toBe('Vredegerecht Gent 1')
    })

    it('is built only for a justice of the peace with a known canton', () => {
        const versions = cantonNames.filter((c) => c.id === 'gent-1')
        expect(buildCourtLabel(getCourt('police-court-antwerpen'), versions)).toBeUndefined()
        expect(buildCourtLabel(getCourt('justice-of-the-peace-gent-1'), undefined)).toBeUndefined()
        expect(buildCourtLabel(getCourt('justice-of-the-peace-gent-1'), versions)?.nl).toBe(
            'Vredegerecht 1e kanton Gent',
        )
    })
})
