'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { Court, CourtType } from 'belgica'
import { Link } from '@/i18n/navigation'
import { courtTypes, type PerLocale } from '@/lib/labels'
import { Name } from './Name'

export interface CourtRow {
    id: string
    type: CourtType
    kind: Court['kind']
    name: PerLocale
    /** Every name, folded, for the text filter */
    search: string
    city: string
    /** The judicial arrondissements the court is for */
    areas: string[]
}

export interface Area {
    id: string
    name: string
}

const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

/**
 * Every court, division and seat, filtered by type, arrondissement and name or city, and
 * grouped by type so the list can be scanned
 */
export function CourtList({ rows, areas }: { rows: CourtRow[]; areas: Area[] }) {
    const t = useTranslations('courts')
    const types = useTranslations('courtType')
    const kinds = useTranslations('kind')
    const [type, setType] = useState<CourtType | ''>('')
    const [area, setArea] = useState('')
    const [query, setQuery] = useState('')
    const [divisions, setDivisions] = useState(true)
    const shown = useMemo(() => {
        const q = fold(query.trim())
        return rows.filter(
            (r) =>
                (!type || r.type === type) &&
                (!area || r.areas.includes(area)) &&
                (divisions || r.kind === 'court') &&
                (!q || r.search.includes(q)),
        )
    }, [rows, type, area, query, divisions])
    const groups = courtTypes
        .map((ct) => [ct, shown.filter((r) => r.type === ct)] as const)
        .filter(([, list]) => list.length > 0)

    return (
        <>
            <div className="filters">
                <input
                    type="search"
                    placeholder={t('filterPlaceholder')}
                    aria-label={t('filterLabel')}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                    }}
                />
                <select
                    aria-label={t('typeLabel')}
                    value={type}
                    onChange={(e) => {
                        setType(e.target.value as CourtType | '')
                    }}
                >
                    <option value="">{t('everyType')}</option>
                    {courtTypes.map((ct) => (
                        <option key={ct} value={ct}>
                            {types(ct)}
                        </option>
                    ))}
                </select>
                <select
                    aria-label={t('areaLabel')}
                    value={area}
                    onChange={(e) => {
                        setArea(e.target.value)
                    }}
                >
                    <option value="">{t('everyArea')}</option>
                    {areas.map((a) => (
                        <option key={a.id} value={a.id}>
                            {a.name}
                        </option>
                    ))}
                </select>
                <label className="check">
                    <input
                        type="checkbox"
                        checked={divisions}
                        onChange={(e) => {
                            setDivisions(e.target.checked)
                        }}
                    />
                    {t('divisions')}
                </label>
                <span className="muted count" aria-live="polite">
                    {t('count', { shown: shown.length, total: rows.length })}
                </span>
            </div>
            {groups.length > 1 && (
                <nav className="jump" aria-label={t('jumpLabel')}>
                    {groups.map(([ct, list]) => (
                        <a key={ct} href={`#type-${ct}`}>
                            {types(ct)} <span className="muted">{list.length}</span>
                        </a>
                    ))}
                </nav>
            )}
            {shown.length === 0 && <p className="muted">{t('none')}</p>}
            {groups.map(([ct, list]) => (
                <section key={ct} className="group" aria-labelledby={`type-${ct}`}>
                    <h2 id={`type-${ct}`} className="group-title">
                        {types(ct)} <span className="muted">{list.length}</span>
                    </h2>
                    <ul className="rows">
                        {list.map((r) => (
                            <li key={r.id}>
                                <Link href={`/courts/${r.id}/`}>
                                    <span className="row-main">
                                        <Name value={r.name} />
                                    </span>
                                    <span className="row-meta">
                                        {r.kind !== 'court' && (
                                            <span className="pill">{kinds(r.kind)}</span>
                                        )}
                                        {r.city}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </>
    )
}
