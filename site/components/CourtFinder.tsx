'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { formatPhoneNumber, type CourtType, type Locale } from 'belgica'
import { Link } from '@/i18n/navigation'
import { loadAddressIndex, place, REGISTERS, type CantonFile, type Placed } from '@/lib/address'
import { fetchJson } from '@/lib/fetch-json'
import type { FinderCourt, FinderIndex, FinderMunicipality } from '@/lib/finder-index'
import { geocode, type AddressCandidate, type GeocodeResult } from '@/lib/geocode'
import { formatDay, locales, pick, type PerLocale } from '@/lib/labels'
import { AddressMap } from './AddressMap'
import { Combobox } from './Combobox'
import { Name } from './Name'

/** The courts by tier, from the lowest up */
const GROUPS: { id: 'first' | 'appeal'; types: CourtType[] }[] = [
    {
        id: 'first',
        types: [
            'justice-of-the-peace',
            'police-court',
            'court-of-first-instance',
            'enterprise-court',
            'labour-court',
        ],
    },
    { id: 'appeal', types: ['court-of-appeal', 'labour-court-of-appeal', 'court-of-assize'] },
]

/** One a single canton, one split over cantons, one in German, one in Brussels */
const EXAMPLES = [
    { municipality: '41081', postalCode: '9620' },
    { municipality: '11002', postalCode: '2060', address: 'Kerkstraat 10' },
    { municipality: '63023', postalCode: '4700' },
    { municipality: '21004', postalCode: '1000' },
]

/** The address, or the point clicked on the map, and the cantons it's in */
interface Found {
    candidate: AddressCandidate
    placed: Placed
}

/** A municipality as the field suggests it, with the postal code typed, if any */
interface Choice {
    municipality: FinderMunicipality
    postalCode?: string
}

const fold = (s: string) =>
    s
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim()

const namesOf = (m: FinderMunicipality) => [...new Set(Object.values(m.name))].join(' / ')

/** The language official names show in: html[data-lang], set by the header's NL · FR · DE */
const namesLanguage = (): Locale =>
    (document.documentElement.dataset['lang'] as Locale | undefined) ?? 'nl'

function readParams() {
    const p = new URLSearchParams(window.location.search)
    return {
        municipality: p.get('municipality'),
        postalCode: p.get('postalCode') ?? undefined,
        address: p.get('address') ?? '',
    }
}

function writeParams(values: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries(values)) if (v) p.set(k, v)
    const query = p.toString()
    window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname)
}

/**
 * Which courts have jurisdiction over an address: pick the municipality or postal code, and
 * where the municipality is split over cantons, give the street and number. Built from
 * jurisdiction.json, which the site writes from the package's data; the street address goes to
 * the region's address register and is placed in the canton boundaries, as on /address/.
 */
export function CourtFinder() {
    const t = useTranslations('finder')
    const a = useTranslations('address')
    const locale = useLocale()
    const [index, setIndex] = useState<FinderIndex | null>(null)
    const [loadError, setLoadError] = useState(false)
    const [choice, setChoice] = useState<Choice | null>(null)
    const [street, setStreet] = useState('')

    useEffect(() => {
        fetchJson<FinderIndex>('/jurisdiction.json').then(setIndex, () => {
            setLoadError(true)
        })
    }, [])

    const byId = useMemo(() => new Map(index?.municipalities.map((m) => [m.id, m]) ?? []), [index])
    const searchable = useMemo(
        () =>
            index?.municipalities.map((m) => ({
                m,
                text: fold(Object.values(m.name).join(' ')),
            })) ?? [],
        [index],
    )

    const search = useCallback(
        (text: string): Choice[] => {
            const q = fold(text)
            if (!q) return []
            // A postal code or its first digits, a name, or both, as the field shows a choice:
            // '9000 Gent'
            const [, code = '', name = ''] = /^(\d*)\s*(.*)$/.exec(q) ?? []
            return searchable
                .flatMap(({ m, text: names }) => {
                    // A name that starts with what's typed comes before one that holds it
                    const rank =
                        !name || names.startsWith(name) || names.includes(` ${name}`) ? 0
                        : names.includes(name) ? 1
                        : -1
                    if (rank < 0) return []
                    if (!code) return [{ rank, choice: { municipality: m } as Choice }]
                    // One option per postal code
                    return m.postalCodes
                        .filter((postalCode) => postalCode.startsWith(code))
                        .map((postalCode) => ({ rank, choice: { municipality: m, postalCode } }))
                })
                .sort(
                    (x, y) =>
                        x.rank - y.rank ||
                        (x.choice.postalCode ?? '').localeCompare(y.choice.postalCode ?? ''),
                )
                .slice(0, 8)
                .map((found) => found.choice)
        },
        [searchable],
    )

    const open = useCallback(
        (params: { municipality: string | null; postalCode?: string; address?: string }) => {
            const m = params.municipality ? byId.get(params.municipality) : undefined
            setChoice(
                m ?
                    {
                        municipality: m,
                        ...(params.postalCode &&
                            m.postalCodes.includes(params.postalCode) && {
                                postalCode: params.postalCode,
                            }),
                    }
                :   null,
            )
            setStreet(params.address ?? '')
        },
        [byId],
    )

    // A shared link opens on its address once the data is in
    useEffect(() => {
        if (byId.size) open(readParams())
    }, [byId, open])

    useEffect(() => {
        if (!index) return
        writeParams({
            municipality: choice?.municipality.id,
            postalCode: choice?.postalCode,
            address: street.trim(),
        })
    }, [index, choice, street])

    return (
        <div className="finder">
            <form
                className="finder-form"
                role="search"
                onSubmit={(e) => {
                    e.preventDefault()
                }}
            >
                {loadError && (
                    <p className="warn" role="alert">
                        {t('loadError')}
                    </p>
                )}
                <Combobox<Choice>
                    label={t('municipalityLabel')}
                    placeholder={index ? t('municipalityPlaceholder') : t('loading')}
                    search={search}
                    countLabel={(count) => t('suggestions', { count })}
                    value={choice}
                    onChange={(c) => {
                        setChoice(c)
                        setStreet('')
                    }}
                    display={(c) =>
                        `${c.postalCode ?? c.municipality.postalCodes[0] ?? ''} ${namesOf(c.municipality)}`.trim()
                    }
                    itemKey={(c) => `${c.municipality.id}-${c.postalCode ?? ''}`}
                    option={(c) => (
                        <>
                            <span>
                                {c.postalCode && <span className="mono">{c.postalCode} </span>}
                                {namesOf(c.municipality)}
                            </span>
                            <span className="kind">
                                {c.postalCode ?
                                    t('refnis', { id: c.municipality.id })
                                :   c.municipality.postalCodes.slice(0, 4).join(', ') +
                                    (c.municipality.postalCodes.length > 4 ? ', …' : '')
                                }
                            </span>
                        </>
                    )}
                />
            </form>

            {!choice && index && (
                <div className="finder-intro">
                    <p>{t('intro')}</p>
                    <p className="examples">
                        {t('try')}{' '}
                        {EXAMPLES.map((example, i) => {
                            const m = byId.get(example.municipality)
                            if (!m) return null
                            return (
                                <span key={example.municipality}>
                                    {i > 0 && ' · '}
                                    <a
                                        href={`?municipality=${example.municipality}&postalCode=${example.postalCode}${example.address ? `&address=${encodeURIComponent(example.address)}` : ''}`}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            open(example)
                                        }}
                                    >
                                        {[
                                            example.address,
                                            `${example.postalCode} ${pick(m.name, 'nl')}`,
                                        ]
                                            .filter(Boolean)
                                            .join(', ')}
                                    </a>
                                </span>
                            )
                        })}
                    </p>
                </div>
            )}

            {choice && index && (
                <Result
                    key={choice.municipality.id}
                    index={index}
                    choice={choice}
                    street={street}
                    onStreet={(value, postalCode) => {
                        setStreet(value)
                        // The postal code the street was looked up under goes in the link with
                        // it, or the link would open on the municipality's first one
                        const shown = choice.postalCode ?? choice.municipality.postalCodes[0]
                        if (value && postalCode && postalCode !== shown)
                            setChoice({ ...choice, postalCode })
                    }}
                />
            )}

            {index && (
                <p className="muted small finder-foot">
                    {t('dataNote', { date: formatDay(index.builtOn, locale) })} {a('disclaimer')}
                </p>
            )}
        </div>
    )
}

function Result({
    index,
    choice,
    street,
    onStreet,
}: {
    index: FinderIndex
    choice: Choice
    street: string
    onStreet: (street: string, postalCode?: string) => void
}) {
    const t = useTranslations('finder')
    const m = choice.municipality
    const cantonIds = m.cantons.map((c) => c.id)
    const split = m.cantons.some((c) => c.partial)
    const [placed, setPlaced] = useState<Found | null>(null)
    const [picked, setPicked] = useState<{ longitude: number; latitude: number } | null>(null)
    const [files, setFiles] = useState<CantonFile[]>([])

    // The cantons' boundaries, for the map: the same files the address is placed in
    useEffect(() => {
        let stale = false
        Promise.all(cantonIds.map((id) => fetchJson<CantonFile>(`/address/${id}.json`))).then(
            (f) => {
                if (!stale) setFiles(f)
            },
            () => {
                if (!stale) setFiles([])
            },
        )
        return () => {
            stale = true
        }
        // The municipality's cantons: this component remounts for another municipality
    }, [])

    // What the map draws for the address: the same values until the address is placed again
    const highlight = useMemo(() => placed?.placed.inside.map((c) => c.canton) ?? [], [placed])
    const point = useMemo(
        () =>
            placed ?
                {
                    latitude: placed.candidate.latitude,
                    longitude: placed.candidate.longitude,
                    label: placed.candidate.label,
                }
            :   undefined,
        [placed],
    )

    // The cantons the address decided, or every canton of the municipality
    const active = highlight.length ? highlight : cantonIds
    const courtsOf = (ids: readonly string[]) => [
        ...new Set(ids.flatMap((id) => index.cantons[id]?.courts ?? [])),
    ]
    const all = courtsOf(cantonIds)
    const shown = new Set(courtsOf(active))
    /** The municipality's cantons that a court serves */
    const servedBy = (court: string) =>
        cantonIds.filter((id) => index.cantons[id]?.courts.includes(court))

    return (
        <section className="block finder-result">
            <h2>
                {choice.postalCode && <span className="mono">{choice.postalCode} </span>}
                <Name value={m.name} />{' '}
                <Link className="small" href={`/municipalities/${m.id}/`}>
                    {t('municipalityPage')}
                </Link>
            </h2>
            <p className="muted">
                {t('summary', {
                    codes: m.postalCodes.join(', '),
                    cantons: cantonIds.length,
                })}
            </p>

            {split && (
                <StreetStep
                    index={index}
                    choice={choice}
                    street={street}
                    onStreet={onStreet}
                    onPlaced={setPlaced}
                    picked={picked}
                />
            )}

            <AddressMap
                cantons={files}
                highlight={highlight}
                point={point}
                onPick={
                    split ?
                        (longitude, latitude) => {
                            setPicked({ longitude, latitude })
                        }
                    :   undefined
                }
                label={t('mapLabel', { name: pick(m.name, 'nl') })}
            />
            {split && <p className="muted small">{t('mapHint')}</p>}

            {GROUPS.map((group) => {
                const types = group.types.filter((type) =>
                    all.some((id) => index.courts[id]?.type === type),
                )
                if (!types.length) return null
                return (
                    <section key={group.id} className="tier" aria-labelledby={`tier-${group.id}`}>
                        <h3 id={`tier-${group.id}`}>{t(`group.${group.id}`)}</h3>
                        {types.map((type) => (
                            <Slot
                                key={type}
                                type={type}
                                index={index}
                                all={all.filter((id) => index.courts[id]?.type === type)}
                                shown={shown}
                                decided={Boolean(placed?.placed.inside.length)}
                                cantonIds={cantonIds}
                                servedBy={servedBy}
                            />
                        ))}
                    </section>
                )
            })}

            {m.policeZone && (
                <section className="tier" aria-labelledby="tier-police">
                    <h3 id="tier-police">{t('group.police')}</h3>
                    <div className="slot">
                        <div className="slot-head">
                            <strong>{t('policeZone')}</strong>
                            <p className="muted small">{t('policeZoneAbout')}</p>
                        </div>
                        <div className="slot-courts">
                            <p>
                                <span className="mono">{m.policeZone.id}</span> {m.policeZone.name}
                            </p>
                        </div>
                    </div>
                </section>
            )}
            <p className="muted small">{t('divisionNote')}</p>
        </section>
    )
}

/** The street and number of a municipality split over cantons, placed in its cantons */
function StreetStep({
    index,
    choice,
    street,
    onStreet,
    onPlaced,
    picked,
}: {
    index: FinderIndex
    choice: Choice
    street: string
    onStreet: (street: string, postalCode?: string) => void
    onPlaced: (found: Found | null) => void
    /** A point clicked on the map, which takes the place of a typed address */
    picked: { longitude: number; latitude: number } | null
}) {
    const t = useTranslations('finder')
    const a = useTranslations('address')
    const m = choice.municipality
    const [postalCode, setPostalCode] = useState(choice.postalCode ?? m.postalCodes[0] ?? '')
    const [text, setText] = useState(street)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [result, setResult] = useState<GeocodeResult | null>(null)
    const [selected, setSelected] = useState(0)
    const [placed, setPlacedHere] = useState<Placed | null>(null)
    /** The point was clicked on the map: nothing says which municipality it's in */
    const [byMap, setByMap] = useState(false)
    const controller = useRef<AbortController | null>(null)
    const cantonIds = m.cantons.map((c) => c.id)
    const candidate = result?.candidates[selected]

    const lookup = useCallback(
        async (address: string, code: string) => {
            if (!address.trim()) return
            controller.current?.abort()
            const current = new AbortController()
            controller.current = current
            setLoading(true)
            setError(null)
            try {
                // The name in the register's language: Dutch in Flanders, French in Wallonia
                const name = pick(m.name, m.register === 'wallonia' ? 'fr' : 'nl')
                const found = await geocode(
                    `${address.trim()}, ${code} ${name}`,
                    { [code]: m.register },
                    current.signal,
                )
                if (controller.current !== current) return
                setResult(found)
                setSelected(0)
                setByMap(false)
            } catch (e) {
                if ((e as Error).name === 'AbortError') return
                if (controller.current === current) setError(String(e))
            } finally {
                if (controller.current === current) setLoading(false)
            }
        },
        [m],
    )

    // A point clicked on the map: placed as it is, without the address register
    useEffect(() => {
        if (!picked) return
        controller.current?.abort()
        setLoading(false)
        setError(null)
        setText('')
        onStreet('')
        setResult({
            candidates: [
                {
                    label: t('mapPoint', {
                        point: `${picked.latitude.toFixed(5)}, ${picked.longitude.toFixed(5)}`,
                    }),
                    longitude: picked.longitude,
                    latitude: picked.latitude,
                    precise: true,
                    source: m.register,
                },
            ],
            failed: [],
        })
        setSelected(0)
        setByMap(true)
        // Only for a new click
    }, [picked])

    // An address from a shared link is looked up as the page opens
    const initial = useRef(street)
    useEffect(() => {
        if (initial.current) void lookup(initial.current, postalCode)
        // Once, for the address the page opened with
    }, [])

    useEffect(() => {
        setPlacedHere(null)
        onPlaced(null)
        if (!candidate) return
        let stale = false
        loadAddressIndex()
            .then((addressIndex) => place(candidate, addressIndex, cantonIds))
            .then(
                (p) => {
                    if (stale) return
                    setPlacedHere(p)
                    onPlaced({ candidate, placed: p })
                },
                (e: unknown) => {
                    if (!stale) setError(String(e))
                },
            )
        return () => {
            stale = true
        }
        // cantonIds follows the municipality, which remounts this component
    }, [candidate, onPlaced])

    function submit(e: FormEvent) {
        e.preventDefault()
        onStreet(text.trim(), postalCode)
        void lookup(text, postalCode)
    }

    const inside = placed?.inside ?? []
    return (
        <div className="street-step">
            <p className="note">
                {t('split', { name: pick(m.name, 'nl'), count: cantonIds.length })}
            </p>
            <form className="address-form" onSubmit={submit}>
                <label className="grow">
                    <span className="field-label">{t('streetLabel')}</span>
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => {
                            setText(e.target.value)
                        }}
                        placeholder={t('streetPlaceholder')}
                        autoComplete="address-line1"
                    />
                </label>
                {m.postalCodes.length > 1 && (
                    <label>
                        <span className="field-label">{t('postalCodeLabel')}</span>
                        <select
                            value={postalCode}
                            onChange={(e) => {
                                setPostalCode(e.target.value)
                            }}
                        >
                            {m.postalCodes.map((code) => (
                                <option key={code}>{code}</option>
                            ))}
                        </select>
                    </label>
                )}
                <button type="submit" disabled={loading}>
                    {t('find')}
                </button>
            </form>

            <div aria-live="polite">
                {loading && <p className="muted">{a('searching')}</p>}
                {error && <p className="warn">{error}</p>}
                {!loading &&
                    result?.failed.map((f) => (
                        <p key={f.source} className="warn">
                            {a('failed', { source: REGISTERS[f.source], error: f.error })}
                        </p>
                    ))}
                {!loading && result && !candidate && <p className="muted">{a('none')}</p>}
                {!loading && candidate && (
                    <div className="street-found">
                        {result && result.candidates.length > 1 && (
                            <label className="address-match">
                                {a('match')}{' '}
                                <select
                                    value={selected}
                                    onChange={(e) => {
                                        setSelected(Number(e.target.value))
                                    }}
                                >
                                    {result.candidates.map((c, i) => (
                                        <option key={`${c.label}${i}`} value={i}>
                                            {c.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        )}
                        {placed && !inside.length && (
                            <p className="warn">{t('outside', { name: pick(m.name, 'nl') })}</p>
                        )}
                        {inside.length > 0 && (
                            <p>
                                {t.rich('inCanton', {
                                    address: candidate.label,
                                    canton: inside.map((c) => c.name).join(' / '),
                                    strong: (c) => <strong>{c}</strong>,
                                })}{' '}
                                <a
                                    className="small"
                                    href={`https://www.openstreetmap.org/?mlat=${candidate.latitude}&mlon=${candidate.longitude}#map=19/${candidate.latitude}/${candidate.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {a('map')}
                                </a>
                            </p>
                        )}
                        {byMap &&
                            inside.map((c) => {
                                // The cantons are drawn whole, and reach into other municipalities
                                const others = index.municipalities
                                    .filter(
                                        (x) =>
                                            x.id !== m.id &&
                                            x.cantons.some((k) => k.id === c.canton),
                                    )
                                    .map((x) => pick(x.name, 'nl'))
                                return others.length ?
                                        <p key={c.canton} className="note">
                                            {t('alsoCovers', {
                                                canton: c.name,
                                                others: others.join(', '),
                                            })}
                                        </p>
                                    :   null
                            })}
                        {!candidate.precise && <p className="note">{a('streetOnly')}</p>}
                        {inside.length > 1 && (
                            <p className="note">
                                {a('onLine', { cantons: inside.map((c) => c.name).join(' / ') })}
                            </p>
                        )}
                        {placed?.near[0] && inside.length > 0 && (
                            <p className="note">
                                {a('near', {
                                    metres: Math.round(placed.near[0].metres),
                                    other: placed.near[0].canton.name,
                                })}
                            </p>
                        )}
                        {placed && (inside.length > 1 || placed.near.length > 0) && (
                            <details className="territory">
                                <summary>{a('legalText')}</summary>
                                {[...inside, ...placed.near.map((n) => n.canton)].map((c) => (
                                    <div key={c.canton}>
                                        <h4>
                                            <Link href={`/cantons/${c.canton}/`}>{c.name}</Link>
                                        </h4>
                                        <p>
                                            <Name value={c.territory} />
                                        </p>
                                    </div>
                                ))}
                            </details>
                        )}
                        {/* A point clicked on the map didn't come from a register */}
                        {!byMap && (
                            <p className="muted small">
                                {a('source', { register: REGISTERS[candidate.source] })}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

/** One court type: its court, or the courts the address chooses between */
function Slot({
    type,
    index,
    all,
    shown,
    decided,
    cantonIds,
    servedBy,
}: {
    type: CourtType
    index: FinderIndex
    all: string[]
    shown: Set<string>
    decided: boolean
    cantonIds: string[]
    servedBy: (court: string) => string[]
}) {
    const t = useTranslations('finder')
    const types = useTranslations('courtType')
    const j = useTranslations('jurisdiction')
    // The address decides when the courts differ from canton to canton
    const byAddress = all.some((id) => servedBy(id).length < cantonIds.length)
    const visible = all.filter((id) => shown.has(id))
    // Brussels: a Dutch- and a French-speaking court for the same cantons
    const byLanguage =
        visible.length > 1 && visible.every((id) => servedBy(id).length === cantonIds.length)
    return (
        <div className="slot">
            <div className="slot-head">
                <strong>{types(type)}</strong>
                <p className="muted small">{t(`about.${type}`)}</p>
            </div>
            <div className="slot-courts">
                {byAddress && !decided && <p className="pill">{t('byAddress')}</p>}
                {byAddress && decided && <p className="pill">{t('forAddress')}</p>}
                {byLanguage && <p className="muted small">{t('byLanguage')}</p>}
                {(decided ? visible : all).map((id) => {
                    const court = index.courts[id]
                    if (!court) return null
                    const cantons = byAddress && !decided ? servedBy(id) : []
                    return (
                        <CourtEntry key={id} id={id} court={court}>
                            {cantons.map((cid) => {
                                const canton = index.cantons[cid]
                                if (!canton) return null
                                return canton.territory ?
                                        <details key={cid} className="territory">
                                            <summary>
                                                {j.rich('areaOf', {
                                                    name: canton.name,
                                                    link: (c) => (
                                                        <Link href={`/cantons/${cid}/`}>{c}</Link>
                                                    ),
                                                })}
                                            </summary>
                                            <p>
                                                <Name value={canton.territory} />
                                            </p>
                                        </details>
                                    :   <p key={cid} className="muted small">
                                            {j.rich('areaOf', {
                                                name: canton.name,
                                                link: (c) => (
                                                    <Link href={`/cantons/${cid}/`}>{c}</Link>
                                                ),
                                            })}
                                        </p>
                            })}
                        </CourtEntry>
                    )
                })}
            </div>
        </div>
    )
}

function CourtEntry({
    id,
    court,
    children,
}: {
    id: string
    court: FinderCourt
    children?: React.ReactNode
}) {
    const t = useTranslations('finder')
    const [copied, setCopied] = useState(false)
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
    useEffect(() => () => clearTimeout(timer.current), [])

    async function copy() {
        const lang = namesLanguage()
        const lines = [pick(court.name, lang)]
        if (court.address)
            lines.push(court.address.street, `${court.address.postalCode} ${court.address.city}`)
        try {
            await navigator.clipboard.writeText(lines.join('\n'))
            setCopied(true)
            clearTimeout(timer.current)
            timer.current = setTimeout(() => {
                setCopied(false)
            }, 2000)
        } catch {
            // No clipboard (an insecure origin, a denied permission): the address is on the page
        }
    }

    return (
        <article className="court-entry">
            <Link href={`/courts/${id}/`} className="court-name">
                <Name value={court.name} />
            </Link>
            {court.address && (
                <address>
                    {court.address.street}, {court.address.postalCode} {court.address.city}
                </address>
            )}
            <ul className="court-links">
                {court.phone && (
                    <li>
                        <a href={`tel:${court.phone}`} dir="ltr">
                            {formatPhoneNumber(court.phone)}
                        </a>
                    </li>
                )}
                {court.email && (
                    <li>
                        <a href={`mailto:${court.email}`}>{court.email}</a>
                    </li>
                )}
                {court.website && (
                    <li>
                        <WebsiteLink website={court.website} label={t('website')} />
                    </li>
                )}
                {court.address && (
                    <li>
                        <button type="button" className="link-button" onClick={() => void copy()}>
                            {copied ? t('copied') : t('copy')}
                        </button>
                    </li>
                )}
            </ul>
            {children}
        </article>
    )
}

/** The court's page in the language picked for names, which CSS shows as Name does */
function WebsiteLink({ website, label }: { website: PerLocale; label: string }) {
    const links = locales.map((l) => [l, pick(website, l)] as const)
    if (links.every(([, href]) => href === links[0]?.[1]))
        return <a href={links[0]?.[1]}>{label}</a>
    return (
        <>
            {links.map(([l, href]) => (
                <a key={l} className="tr" data-l={l} href={href} hrefLang={l}>
                    {label}
                </a>
            ))}
        </>
    )
}
