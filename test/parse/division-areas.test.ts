import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import {
    applyDivisionAreas,
    decreeEli,
    resolveDivisionAreas,
    type CourtDivisions,
    type DivisibleCourt,
    type Territory,
} from '../../scripts/parse/division-areas.ts'

// Two cantons of three municipalities, one of which (Stad) is split over both
const territory: Territory = {
    cantons: [
        {
            id: 'noord',
            arrondissement: 'a',
            municipalities: [{ municipality: '1' }, { municipality: '2' }, { municipality: '9' }],
        },
        {
            id: 'zuid',
            arrondissement: 'b',
            municipalities: [{ municipality: '3' }, { municipality: '9' }],
        },
    ],
    municipalities: [
        { id: '1', name: { nl: 'Eén', fr: 'Un' }, province: 'p' },
        { id: '2', name: { nl: 'Twee' }, province: 'p' },
        { id: '3', name: { nl: 'Drie' }, province: 'q' },
        { id: '9', name: { nl: 'Stad' }, province: 'p' },
    ],
}
const decrees = [{ numac: '2014009088', date: '2014-03-14' }]

describe('resolveDivisionAreas', () => {
    it('keeps whole cantons as cantons and the rest as municipalities', () => {
        const court: CourtDivisions = {
            decrees,
            article: 1,
            divisions: {
                x: { cantons: ['noord'], except: ['twee'] },
                y: { cantons: ['zuid'], plus: ['TWEE'] },
            },
        }
        const { areas, problems } = resolveDivisionAreas(court, ['noord', 'zuid'], territory)
        // Stad lies in both cantons: its part in noord goes to x, its part in zuid to y, and its
        // REFNIS code can't say which
        expect(problems).toEqual(['municipality 9 is split between x and y'])
        expect(areas.get('x')).toEqual({
            cantons: [],
            municipalities: ['1', '9'],
            arrondissements: ['a'],
        })
        expect(areas.get('y')).toEqual({
            cantons: ['zuid'],
            municipalities: ['2'],
            arrondissements: ['a', 'b'],
        })
    })

    it('reads municipalities by any of their names, and provinces', () => {
        const court: CourtDivisions = {
            decrees,
            article: 1,
            divisions: { x: { municipalities: ['Un', 'Twee', 'Stad'] }, y: { provinces: ['q'] } },
        }
        const { areas, problems } = resolveDivisionAreas(court, ['noord', 'zuid'], territory)
        expect(problems).toEqual([])
        expect(areas.get('x')?.cantons).toEqual(['noord'])
        // Stad is split: its part in zuid goes with the name too
        expect(areas.get('x')?.municipalities).toEqual(['9'])
        expect(areas.get('y')).toEqual({
            cantons: [],
            municipalities: ['3'],
            arrondissements: ['b'],
        })
    })

    it("reports a name it can't place and a canton outside the court", () => {
        const court: CourtDivisions = {
            decrees,
            article: 1,
            divisions: {
                x: { cantons: ['zuid'], plus: ['Vier'] },
                y: { municipalities: ['Nergens'] },
            },
        }
        const { problems } = resolveDivisionAreas(court, ['noord'], territory)
        expect(problems).toEqual([
            'x: canton "zuid" isn\'t in the court\'s area',
            'x: no municipality "Vier" in the court\'s area',
            'x: covers nothing',
            'y: no municipality "Nergens" in the court\'s area',
            'y: covers nothing',
        ])
    })
})

describe('applyDivisionAreas', () => {
    it('reports a divided court the sources lack', () => {
        expect(applyDivisionAreas([], territory).missing).toContain('labour-court-gent')
    })

    it('gives a division its area in criminal cases only where it differs', () => {
        const data = (file: string) =>
            JSON.parse(readFileSync(`data/${file}.json`, 'utf8')) as unknown
        const division = (place: string): DivisibleCourt => ({
            id: `police-court-antwerpen-${place}`,
            kind: 'division',
            court: 'police-court-antwerpen',
            sources: [],
        })
        const court: DivisibleCourt = {
            id: 'police-court-antwerpen',
            kind: 'court',
            cantons: [
                ...['1', '2', '3', '4', '5', '6', '7'].map((n) => `antwerpen-${n}`),
                ...['merksem', 'deurne', 'boom', 'brasschaat', 'kapellen', 'kontich'],
                ...['zandhoven', 'heist-op-den-berg', 'lier', 'mechelen', 'willebroek'],
                ...['mol-geel-1', 'mol-geel-2', 'turnhout-1', 'turnhout-2', 'westerlo'],
            ],
            sources: [],
        }
        const [antwerpen, mechelen, turnhout] = ['antwerpen', 'mechelen', 'turnhout'].map(division)
        const { problems } = applyDivisionAreas(
            [court, antwerpen, mechelen, turnhout].flatMap((c) => c ?? []),
            {
                cantons: data('cantons') as Territory['cantons'],
                municipalities: data('municipalities') as Territory['municipalities'],
            },
        )
        expect(problems).toEqual([])
        // The same area in civil and in criminal cases
        expect(antwerpen?.cantons).toContain('antwerpen-1')
        expect(antwerpen?.criminalArea).toBeUndefined()
        // Hulshout (13016) and Herenthout (13012) leave Mechelen for Turnhout in criminal cases,
        // so Mechelen keeps Heist-op-den-Berg (12014) and Putte (12029) of their canton by name
        expect(mechelen?.cantons).toEqual(['heist-op-den-berg', 'lier', 'mechelen', 'willebroek'])
        expect(mechelen?.municipalities).toBeUndefined()
        expect(mechelen?.criminalArea).toEqual({
            cantons: ['lier', 'mechelen', 'willebroek'],
            municipalities: ['12014', '12029'],
        })
        expect(turnhout?.criminalArea).toEqual({
            cantons: ['mol-geel-1', 'mol-geel-2', 'turnhout-1', 'turnhout-2', 'westerlo'],
            municipalities: ['13012', '13016'],
        })
        // Read later than the other courts' areas
        expect(mechelen?.sources).toEqual([
            {
                url: 'https://www.ejustice.just.fgov.be/eli/besluit/2020/12/16/2020016203/staatsblad',
                retrieved: '2026-11-22',
            },
        ])
    })

    it('cites the publication in the Official Journal', () => {
        expect(decreeEli({ numac: '2017040887', date: '2018-01-14' })).toBe(
            'https://www.ejustice.just.fgov.be/eli/besluit/2018/01/14/2017040887/staatsblad',
        )
    })
})
