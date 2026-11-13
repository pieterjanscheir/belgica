'use client'

import { Analytics } from '@vercel/analytics/next'

/**
 * Page views for Vercel Analytics, by path only. A page's query string can hold what a visitor
 * typed (the court finder keeps the street address there, so a result can be shared as a link),
 * and none of that is for the statistics: the query string and the fragment are cut off before
 * anything is sent.
 */
export function PageAnalytics() {
    return <Analytics beforeSend={(event) => ({ ...event, url: withoutQuery(event.url) })} />
}

/** A URL without its query string and fragment */
const withoutQuery = (url: string) => url.split(/[?#]/)[0] ?? url
