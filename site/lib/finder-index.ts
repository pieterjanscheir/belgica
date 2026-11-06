// What the court finder (/jurisdiction/) loads in the browser, from the package: every
// municipality with its postal codes, cantons and police zone, every canton's courts, and the
// courts' contacts. One file for every language, written at build time by
// app/jurisdiction.json/route.ts.
import {
    appliesOn,
    formatCourtName,
    getContact,
    getCourtsForCanton,
    getPostalCodes,
    type CourtType,
} from 'belgica'
import { policeZones } from 'belgica/police-zones'
import type { GeocodeSource } from './geocode'
import { buildDay, cantonName, currentCantons, currentCourts, currentMunicipalities } from './data'
import { locales, type PerLocale } from './labels'

export interface FinderCourt {
    type: CourtType
    name: PerLocale
    address?: { street: string; postalCode: string; city: string }
    phone?: string
    email?: string
    website?: PerLocale
}

export interface FinderCanton {
    /** 'Gent 1 / Gand 1' */
    name: string
    /** Its courts, every type, by id */
    courts: string[]
    /** The law's text of its area: only for a canton that covers part of a municipality */
    territory?: PerLocale
}

export interface FinderMunicipality {
    /** REFNIS code */
    id: string
    name: PerLocale
    postalCodes: string[]
    /** The address register that geocodes its streets */
    register: GeocodeSource
    /** Its cantons; `partial` when the canton covers only part of it */
    cantons: { id: string; partial?: true }[]
    /** The police zone's number and the name it goes by */
    policeZone?: { id: string; name: string }
}

export interface FinderIndex {
    /** The day the site was built, which the data is current on */
    builtOn: string
    municipalities: FinderMunicipality[]
    cantons: Record<string, FinderCanton>
    courts: Record<string, FinderCourt>
}

const registers: Record<string, GeocodeSource> = {
    '02000': 'flanders',
    '03000': 'wallonia',
    '04000': 'brussels',
}

/**
 * The zones that go by the initials of their municipalities (HEKLA: Hove, Edegem, Kontich, Lint,
 * Aartselaar), which stay in capitals. The source writes every name in capitals, so it can't
 * tell them from a place name: a new one shows as 'Hekla' until it's added here.
 */
const ZONE_INITIALS = new Set([
    'AMOW',
    'BODUKAP',
    'BRT',
    'BRUNAU',
    'CARMA',
    'DSZ',
    'FLOWAL',
    'GERMINALT',
    'HEKLA',
    'HERKO',
    'KASTZE',
    'MIDOW',
    'MINOS',
    'MIRA',
    'RIHO',
    'SAMSOM',
    'SECOVA',
    'SPOORKIN',
    'TARL',
    'VLAS',
    'WOKRA',
    'ZARA',
])

/** 'AARTSELAAR/EDEGEM/HOVE' → 'Aartselaar/Edegem/Hove': the zones' names are in capitals */
function titleCase(text: string): string {
    return text.replace(/\p{L}+/gu, (word) =>
        ZONE_INITIALS.has(word) ? word : word.charAt(0) + word.slice(1).toLowerCase(),
    )
}

export function finderIndex(): FinderIndex {
    const on = { on: buildDay }
    const zoneOf = new Map<string, { id: string; name: string }>()
    for (const zone of policeZones.filter((z) => appliesOn(z, buildDay)))
        for (const m of zone.municipalities)
            zoneOf.set(m, { id: zone.id, name: titleCase(zone.alias ?? zone.name.nl) })

    const splitCantons = new Set(
        currentCantons.filter((c) => c.municipalities.some((m) => m.partial)).map((c) => c.id),
    )
    const used = new Set<string>()
    const cantons = Object.fromEntries(
        currentCantons.map((canton) => {
            const courts = getCourtsForCanton(canton.id, on).map((c) => c.id)
            for (const id of courts) used.add(id)
            const entry: FinderCanton = { name: cantonName(canton), courts }
            if (splitCantons.has(canton.id)) entry.territory = canton.territory
            return [canton.id, entry]
        }),
    )

    const courts = Object.fromEntries(
        currentCourts
            .filter((c) => used.has(c.id))
            .map((court) => {
                const phone = getContact(court, 'phone')
                const email = getContact(court, 'email')
                const entry: FinderCourt = {
                    type: court.type,
                    name: Object.fromEntries(locales.map((l) => [l, formatCourtName(court, l)])),
                }
                if (court.address)
                    entry.address = {
                        street: court.address.street,
                        postalCode: court.address.postalCode,
                        city: court.address.city,
                    }
                if (phone) entry.phone = phone
                if (email) entry.email = email
                if (Object.keys(court.website).length) entry.website = court.website
                return [court.id, entry]
            }),
    )

    const municipalities = currentMunicipalities.map((m): FinderMunicipality => {
        const entry: FinderMunicipality = {
            id: m.id,
            name: m.name,
            postalCodes: getPostalCodes(m.id, on).map((p) => p.postalCode),
            register: registers[m.region] ?? 'flanders',
            cantons: currentCantons.flatMap((c) => {
                const part = c.municipalities.find((x) => x.municipality === m.id)
                if (!part) return []
                return [part.partial ? { id: c.id, partial: true as const } : { id: c.id }]
            }),
        }
        const zone = zoneOf.get(m.id)
        if (zone) entry.policeZone = zone
        return entry
    })

    return { builtOn: buildDay, municipalities, cantons, courts }
}
