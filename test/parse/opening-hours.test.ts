import { describe, expect, it } from 'vitest'

import { toOpeningHours } from '../../scripts/parse/opening-hours.ts'

describe('toOpeningHours', () => {
    it.each([
        [
            'De griffie is elke werkdag open van 8u30 tot 12u30 en van 13u30 tot 16u00.',
            'Mo-Fr 08:30-12:30,13:30-16:00',
        ],
        [
            'de griffie is open van maandag-vrijdag, telkens van 8u30 - 12u30 en van 13u30 - 16u00',
            'Mo-Fr 08:30-12:30,13:30-16:00',
        ],
        [
            'Maandag : van 9.00 tot 12.30 uur – namiddag gesloten Dinsdag : van 9.00 tot 12.30 uur – van 13.30 tot 16.00 uur Woensdag : van 9.00 tot 12.30 uur – namiddag gesloten Donderdag : van 9.00 tot 12.30 uur – van 13.30 tot 16.00 uur Vrijdag : van 9.00 tot 12.30 uur – namiddag gesloten',
            'Mo,We,Fr 09:00-12:30; Tu,Th 09:00-12:30,13:30-16:00',
        ],
        [
            'Maandag: 08u30 - 12u30 | 13u30 - 16u00 Dinsdag: 08u30 - 12u30 Woensdag: 08u30 - 12u30 | 13u30 - 16u00 Donderdag: 08u30 - 12u30 Vrijdag: 08u30 - 12u30 | 13u30 - 16u00',
            'Mo,We,Fr 08:30-12:30,13:30-16:00; Tu,Th 08:30-12:30',
        ],
        [
            'Le greffe est ouvert du lundi au vendredi de 8h30 à 12h30 et de 13h30 à 16h.',
            'Mo-Fr 08:30-12:30,13:30-16:00',
        ],
        ['Montag bis Freitag von 8.30 bis 12.30 Uhr', 'Mo-Fr 08:30-12:30'],
        ['Maandag, dinsdag en donderdag van 9u tot 12u', 'Mo,Tu,Th 09:00-12:00'],
        // Days with no hours, said once, are simply closed
        ['Maandag tot donderdag van 9u tot 12u. Vrijdag gesloten.', 'Mo-Th 09:00-12:00'],
        // "fermé" at the end, and the afternoon closed in French
        [
            'Lundi: 08h30 - 12h30 | 13h30 - 16h00 Mardi: 08h30 - 12h30 Mercredi: 08h30 - 12h30 | 13h30 - 16h00 Jeudi: 08h30 - 12h30 Vendredi: fermé',
            'Mo,We 08:30-12:30,13:30-16:00; Tu,Th 08:30-12:30',
        ],
        ['Lundi au vendredi de 9h à 12h30 – après-midi fermé', 'Mo-Fr 09:00-12:30'],
    ])('reads %j', (text, expected) => {
        expect(toOpeningHours(text)).toBe(expected)
    })

    it.each([
        // Anything not understood: a note, a temporary change, hearings instead of the registry
        'de griffie is open van maandag-vrijdag, telkens van 8u30 - 12u30 OPGELET : tot en met 31 december 2026 werkt de griffie met gesloten deuren',
        'openbare terechtzittingen : woensdag van 09u00 tot 12u00',
        'Op afspraak',
        '',
        // Impossible or implausible times
        'Maandag van 12u tot 9u',
        'Maandag van 25u tot 26u',
        'Maandag van 3u tot 4u',
        // A day described twice: the text corrects itself, and either reading could be wrong
        'Maandag tot vrijdag van 8u30 tot 12u. Woensdag gesloten.',
        'Maandag tot vrijdag van 8u30 tot 12u en van 13u tot 16u. Woensdag namiddag gesloten.',
        'Maandag tot vrijdag van 9u tot 16u. Woensdag van 9u tot 12u.',
        // Closed after hours for the same days, or an afternoon closed without morning hours
        'Maandag van 9u tot 12u gesloten',
        'Woensdag namiddag gesloten',
        // Times without days, days without times
        'van 8u30 tot 12u30',
        'Maandag gesloten',
        // A day range that runs backwards
        'Vrijdag tot maandag van 9u tot 12u',
        // A time without its end
        'Maandag van 9u',
    ])('refuses %j', (text) => {
        expect(toOpeningHours(text)).toBeUndefined()
    })
})
