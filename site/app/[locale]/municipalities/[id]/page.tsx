import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import {
    getArrondissementForMunicipality,
    getCantonsForMunicipality,
    getMunicipality,
    getPostalCodes,
    getProvinceForMunicipality,
    getRegionForMunicipality,
} from 'belgica'
import { findPoliceZone } from 'belgica/police-zones'
import { CantonMap } from '@/components/CantonMap'
import { Code } from '@/components/Code'
import { Jurisdiction } from '@/components/Jurisdiction'
import { Name } from '@/components/Name'
import { bilingual, currentCantons, currentMunicipalities } from '@/lib/data'

export const dynamicParams = false
export const generateStaticParams = () => currentMunicipalities.map((m) => ({ id: m.id }))

interface Props {
    params: Promise<{ locale: string; id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const m = getMunicipality((await params).id)
    return { title: m ? bilingual(m.name) : (await params).id }
}

export default async function MunicipalityPage({ params }: Props) {
    const { locale, id } = await params
    setRequestLocale(locale)
    const t = await getTranslations('municipality')
    const nav = await getTranslations('nav')
    const m = getMunicipality(id)
    if (!m) return null
    const region = getRegionForMunicipality(id)
    const province = getProvinceForMunicipality(id)
    const arrondissement = getArrondissementForMunicipality(id)
    const cantonIds = getCantonsForMunicipality(id).map((c) => c.id)
    const policeZone = findPoliceZone(id)
    const nearby = currentCantons
        .filter((c) => c.arrondissement === arrondissement?.id)
        .map((c) => c.id)
    return (
        <>
            <p className="crumbs">
                <Link href="/municipalities/">{nav('municipalities')}</Link> / {m.id}
            </p>
            <h1>{bilingual(m.name)}</h1>
            <div className="detail">
                <div>
                    <dl className="facts">
                        <div>
                            <dt>{t('refnis')}</dt>
                            <dd className="mono">{m.id}</dd>
                        </div>
                        {region && (
                            <div>
                                <dt>{t('region')}</dt>
                                <dd>
                                    <Name value={region.name} />
                                </dd>
                            </div>
                        )}
                        {province && (
                            <div>
                                <dt>{t('province')}</dt>
                                <dd>
                                    <Name value={province.name} />
                                </dd>
                            </div>
                        )}
                        {arrondissement && (
                            <div>
                                <dt>{t('arrondissement')}</dt>
                                <dd>
                                    <Name value={arrondissement.name} />
                                </dd>
                            </div>
                        )}
                        <div>
                            <dt>{t('postalCodes')}</dt>
                            <dd>
                                {getPostalCodes(id).map((p, i) => (
                                    <span key={p.id}>
                                        {i > 0 && ', '}
                                        <Link href={`/postal-codes/${p.postalCode}/`}>
                                            {p.postalCode}
                                        </Link>
                                    </span>
                                ))}
                            </dd>
                        </div>
                        {policeZone && (
                            <div>
                                <dt>{t('policeZone')}</dt>
                                <dd>
                                    <span className="mono">{policeZone.id}</span>{' '}
                                    {policeZone.alias ?? <Name value={policeZone.name} />}
                                    {/* A zone of several municipalities: its official name lists them */}
                                    {policeZone.alias && policeZone.name.nl.includes('/') && (
                                        <div className="muted small">
                                            <Name
                                                value={(l) =>
                                                    policeZone.name[l].replaceAll('/', ' / ')
                                                }
                                            />
                                        </div>
                                    )}
                                </dd>
                            </div>
                        )}
                    </dl>
                    <Code>{`
import { getCantonsForMunicipality, findJusticesOfThePeace } from 'belgica'

getCantonsForMunicipality('${id}').map((c) => c.id)
// → ${JSON.stringify(cantonIds).replaceAll('"', "'").replaceAll(',', ', ')}`}</Code>
                </div>
                <CantonMap
                    only={nearby}
                    highlight={cantonIds}
                    label={t('mapLabel', {
                        arrondissement: arrondissement?.name.nl ?? '',
                        municipality: m.name.nl,
                    })}
                />
            </div>
            <section className="block">
                <h2>{t('courtsWithJurisdiction')}</h2>
                <Jurisdiction municipality={id} />
            </section>
        </>
    )
}
