import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { arrondissements, formatCourtName } from 'belgica'
import { Code } from '@/components/Code'
import { CourtList, type CourtRow } from '@/components/CourtList'
import { ClientMessages } from '@/lib/client-messages'
import { bilingual, courtName, currentCourts } from '@/lib/data'
import { locales } from '@/lib/labels'

interface Props {
    params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const t = await getTranslations({ locale: (await params).locale, namespace: 'courts' })
    return { title: t('title') }
}

const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

export default async function Courts({ params }: Props) {
    setRequestLocale((await params).locale)
    const t = await getTranslations('courts')
    const rows: CourtRow[] = currentCourts.map((c) => ({
        id: c.id,
        type: c.type,
        kind: c.kind,
        name: courtName(c),
        search: fold(
            [
                ...locales.map((l) => formatCourtName(c, l)),
                ...locales.map((l) => formatCourtName(c, l, { style: 'canton' })),
                c.address?.city ?? '',
                c.address?.postalCode ?? '',
            ].join(' '),
        ),
        city: c.address?.city ?? '',
        // A court over a whole judicial area (a court of appeal) belongs to each of its
        // arrondissements
        areas:
            c.arrondissement ?
                [c.arrondissement]
            :   arrondissements.filter((a) => a.judicialArea === c.judicialArea).map((a) => a.id),
    }))
    const areas = arrondissements
        .map((a) => ({ id: a.id, name: bilingual(a.name) }))
        .sort((a, b) => a.name.localeCompare(b.name))
    return (
        <>
            <h1>{t('title')}</h1>
            <p className="lede">{t('lede')}</p>
            <Code>{`
import { findCourts } from 'belgica'

findCourts({ type: 'enterprise-court', kind: 'division' }).length // ${currentCourts.filter((c) => c.type === 'enterprise-court' && c.kind === 'division').length}`}</Code>
            <ClientMessages namespaces={['courts', 'courtType', 'kind']}>
                <CourtList rows={rows} areas={areas} />
            </ClientMessages>
        </>
    )
}
