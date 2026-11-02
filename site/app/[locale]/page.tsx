import { useTranslations } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { use } from 'react'
import { housesOfJustice, interestRates, prisons } from 'belgica'
import { policeZones } from 'belgica/police-zones'
import { CantonMap } from '@/components/CantonMap'
import { Code } from '@/components/Code'
import { Search } from '@/components/Search'
import { Link } from '@/i18n/navigation'
import { currentCantons, currentCourts, currentMunicipalities, postalCodeList } from '@/lib/data'

const examples = [
    ['9000', 'example9000'],
    ['1050', 'example1050'],
    ['4700', 'example4700'],
] as const

export default function Home({ params }: { params: Promise<{ locale: string }> }) {
    setRequestLocale(use(params).locale)
    const t = useTranslations('home')
    const s = useTranslations('search')
    const stats = [
        [currentCourts.length, t('statCourts'), '/courts/'],
        [currentCantons.length, t('statCantons'), '/cantons/'],
        [currentMunicipalities.length, t('statMunicipalities'), '/municipalities/'],
        [postalCodeList.length, t('statPostalCodes'), '/municipalities/'],
        [policeZones.filter((z) => !z.validTo).length, t('statPoliceZones'), '/municipalities/'],
        [prisons.length + housesOfJustice.length, t('statPlaces'), '/places/'],
        [
            interestRates.legal.periods.length + interestRates.commercial.periods.length,
            t('statRates'),
            '/interest/',
        ],
    ] as const
    return (
        <>
            <section className="hero">
                <div>
                    <p className="eyebrow">{t('eyebrow')}</p>
                    <h1>{t('title')}</h1>
                    <p className="lede">{t('lede')}</p>
                    <Search placeholder={s('placeholder')} />
                    <p className="examples">
                        {t('try')}{' '}
                        {examples.map(([code, note], i) => (
                            <span key={code}>
                                {i > 0 && ' · '}
                                <Link href={`/postal-codes/${code}/`}>{code}</Link>{' '}
                                <span className="muted">({t(note)})</span>
                            </span>
                        ))}
                    </p>
                </div>
                <div className="hero-map">
                    <CantonMap label={t('mapLabel', { count: currentCantons.length })} />
                </div>
            </section>

            <section className="stats" aria-label={t('statsLabel')}>
                {stats.map(([n, label, href]) => (
                    <Link key={label} href={href} className="stat">
                        <strong>{n}</strong>
                        <span>{label}</span>
                    </Link>
                ))}
            </section>

            <section className="features">
                <article>
                    <h2>
                        <Link href="/postal-codes/9000/">{t('featureAddressTitle')}</Link>
                    </h2>
                    <p>{t('featureAddress')}</p>
                    <Code>{`
import { findCourtsForPostalCode } from 'belgica'

findCourtsForPostalCode('9000', 'police-court')
// → [{ municipality, justicesOfThePeace, courts }]`}</Code>
                </article>
                <article>
                    <h2>
                        <Link href="/cantons/">{t('featureMapTitle')}</Link>
                    </h2>
                    <p>{t('featureMap')}</p>
                    <Code>{`
import { findCantonsAt } from 'belgica/canton-boundaries'

findCantonsAt(3.7174, 51.0543) // Gent, Korenmarkt
// → [{ id: 'gent-1', … }]`}</Code>
                </article>
                <article>
                    <h2>
                        <Link href="/interest/">{t('featureInterestTitle')}</Link>
                    </h2>
                    <p>{t.rich('featureInterest', { code: (c) => <code>{c}</code> })}</p>
                    <Code>{`
import { getInterestRate } from 'belgica/interest-rates'

getInterestRate('2026-03-01', 'commercial')
// → { rate: 10.5, period: { from: '2026-01-01', … } }`}</Code>
                </article>
                <article>
                    <h2>
                        <Link href="/courts/">{t('featureCourtsTitle')}</Link>
                    </h2>
                    <p>{t('featureCourts')}</p>
                    <Code>{`
import { getCourt, formatCourtName, formatPhoneNumber } from 'belgica'

const court = getCourt('justice-of-the-peace-gent-1')
formatCourtName(court, 'fr', { style: 'canton' })
// → 'Justice de paix 1er canton Gand'`}</Code>
                </article>
            </section>
        </>
    )
}
