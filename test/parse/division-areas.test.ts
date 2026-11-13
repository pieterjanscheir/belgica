import { describe, expect, it } from 'vitest'

import {
    applyDivisionAreas,
    decreeEli,
    resolveDivisionAreas,
    type CourtDivisions,
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

    it('cites the publication in the Official Journal', () => {
        expect(decreeEli({ numac: '2017040887', date: '2018-01-14' })).toBe(
            'https://www.ejustice.just.fgov.be/eli/besluit/2018/01/14/2017040887/staatsblad',
        )
    })
})
