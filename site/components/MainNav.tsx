'use client'

import { Link, usePathname } from '@/i18n/navigation'

/** The header's links, the current section marked with aria-current */
export function MainNav({
    label,
    links,
}: {
    label: string
    links: readonly (readonly [string, string])[]
}) {
    const pathname = usePathname()
    return (
        <nav aria-label={label}>
            {links.map(([href, text]) => {
                const current = `${pathname.replace(/\/$/, '')}/`.startsWith(href)
                return (
                    <Link key={href} href={href} aria-current={current ? 'page' : undefined}>
                        {text}
                    </Link>
                )
            })}
        </nav>
    )
}
