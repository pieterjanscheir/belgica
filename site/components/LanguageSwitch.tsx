'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import type { Locale } from 'belgica'
import { getPathname, usePathname } from '@/i18n/navigation'
import { localeNames, routing, type SiteLocale } from '@/i18n/routing'
import { locales } from '@/lib/labels'

const base = process.env.NEXT_PUBLIC_SITE_BASE ?? ''

/**
 * The site's language: the same page in another language. A full page load, not a client-side
 * navigation, so the new page's <head> script sets the language of official names.
 */
export function SiteLanguage() {
    const t = useTranslations('nav')
    const locale = useLocale() as SiteLocale
    const pathname = usePathname()
    return (
        <label className="site-lang" title={t('siteLanguage')}>
            <span className="sr-only">{t('siteLanguage')}</span>
            <Globe />
            <select
                value={locale}
                onChange={(e) => {
                    const next = e.target.value as SiteLocale
                    window.location.assign(base + getPathname({ href: pathname, locale: next }))
                }}
            >
                {routing.locales.map((l) => (
                    <option key={l} value={l} lang={l}>
                        {localeNames[l]}
                    </option>
                ))}
            </select>
        </label>
    )
}

/**
 * The language official names show in, of the three they're published in. Sets html[data-lang],
 * which picks the language every <Name> shows; remembered per browser.
 */
export function NamesLanguage() {
    const t = useTranslations('nav')
    const [lang, setLang] = useState<Locale>('nl')
    useEffect(() => {
        setLang((document.documentElement.dataset.lang as Locale | undefined) ?? 'nl')
    }, [])
    function choose(l: Locale) {
        setLang(l)
        document.documentElement.dataset.lang = l
        try {
            localStorage.setItem('belgica-lang', l)
        } catch {
            // Storage blocked: the choice lasts for this page
        }
    }
    return (
        <div
            className="lang"
            role="group"
            aria-label={t('namesLanguage')}
            title={t('namesLanguage')}
        >
            {locales.map((l) => (
                <button
                    key={l}
                    type="button"
                    aria-pressed={lang === l}
                    onClick={() => {
                        choose(l)
                    }}
                >
                    {l.toUpperCase()}
                </button>
            ))}
        </div>
    )
}

/** A globe: the site's language, as opposed to the language of official names */
function Globe() {
    return (
        <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden="true"
        >
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
        </svg>
    )
}
