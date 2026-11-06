import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Code } from '@/components/Code'
import { CourtFinder } from '@/components/CourtFinder'
import { ClientMessages } from '@/lib/client-messages'

interface Props {
    params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const t = await getTranslations({ locale: (await params).locale, namespace: 'finder' })
    return { title: t('title'), description: t('lede') }
}

export default async function Finder({ params }: Props) {
    setRequestLocale((await params).locale)
    const t = await getTranslations('finder')
    return (
        <>
            <h1>{t('title')}</h1>
            <p className="lede">{t('lede')}</p>
            <ClientMessages namespaces={['finder', 'address', 'jurisdiction', 'courtType']}>
                <CourtFinder />
            </ClientMessages>
            <Code>{`
import { findCourtsWithJurisdiction, findJusticesOfThePeace } from 'belgica'
import { findCantonsAt } from 'belgica/canton-boundaries'

findCourtsWithJurisdiction('41081', 'labour-court').map((c) => c.id) // Zottegem
findJusticesOfThePeace('11002').length // Antwerpen: one per canton, the address decides
findCantonsAt(4.429126, 51.217827)[0]?.id // Kerkstraat 10, 2060 Antwerpen`}</Code>
            <section className="block">
                <h2>{t('howTitle')}</h2>
                <p className="muted prose">{t('how')}</p>
            </section>
        </>
    )
}
