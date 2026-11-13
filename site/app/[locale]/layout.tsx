import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { NamesLanguage, SiteLanguage } from '@/components/LanguageSwitch'
import { MainNav } from '@/components/MainNav'
import { PageAnalytics } from '@/components/PageAnalytics'
import { namesLanguageScript } from '@/lib/names-language-script'
import { Link } from '@/i18n/navigation'
import { ClientMessages } from '@/lib/client-messages'
import { routing, rtl } from '@/i18n/routing'

interface Props {
    children: ReactNode
    params: Promise<{ locale: string }>
}

export const generateStaticParams = () => routing.locales.map((locale) => ({ locale }))
export const dynamicParams = false

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: 'meta' })
    return {
        title: { default: t('title'), template: `%s · ${t('title')}` },
        description: t('description'),
    }
}

export default async function LocaleLayout({ children, params }: Props) {
    const { locale } = await params
    if (!hasLocale(routing.locales, locale)) notFound()
    setRequestLocale(locale)
    const t = await getTranslations('nav')
    const f = await getTranslations('footer')
    const nav = [
        ['/jurisdiction/', t('finder')],
        ['/courts/', t('courts')],
        ['/cantons/', t('cantons')],
        ['/municipalities/', t('municipalities')],
        ['/address/', t('address')],
        ['/interest/', t('interest')],
        ['/places/', t('places')],
    ] as const
    return (
        <html lang={locale} dir={rtl.includes(locale) ? 'rtl' : 'ltr'} suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: namesLanguageScript(locale) }} />
            </head>
            <body>
                <ClientMessages namespaces={['nav']}>
                    <a className="skip" href="#main">
                        {t('skip')}
                    </a>
                    <header className="top">
                        <div className="wrap top-inner">
                            <Link href="/" className="brand">
                                <Mark />
                                belgica <span className="muted">explorer</span>
                            </Link>
                            <NamesLanguage />
                            <SiteLanguage />
                            <MainNav label={t('main')} links={nav} />
                        </div>
                    </header>
                    <main id="main" className="wrap">
                        {children}
                    </main>
                    <footer className="wrap foot">
                        <p>
                            {f.rich('builtFrom', {
                                npm: (c) => <a href="https://www.npmjs.com/package/belgica">{c}</a>,
                                docs: (c) => (
                                    <a href="https://pieterjanscheir.github.io/belgica/">{c}</a>
                                ),
                                source: (c) => (
                                    <a href="https://github.com/pieterjanscheir/belgica/tree/main/site">
                                        {c}
                                    </a>
                                ),
                            })}
                        </p>
                        <p className="muted">{f('disclaimer')}</p>
                    </footer>
                </ClientMessages>
                <PageAnalytics />
            </body>
        </html>
    )
}

/** The logo's b, in its grid cells */
function Mark() {
    const cells: [number, number, string][] = [
        [0, 0, 'ink'],
        [1, 0, 'ink'],
        [2, 0, 'ink'],
        [3, 0, 'ink'],
        [1, 1, 'ink'],
        [1, 2, 'yellow'],
        [2, 2, 'ink'],
        [3, 1, 'ink'],
        [3, 2, 'red'],
    ]
    return (
        <svg viewBox="0 0 34 46" width="17" height="23" aria-hidden="true" className="mark">
            {cells.map(([r, c, k]) => (
                <rect
                    key={`${r}${c}`}
                    x={c * 12}
                    y={r * 12}
                    width="10"
                    height="10"
                    rx="2.5"
                    className={k}
                />
            ))}
        </svg>
    )
}
