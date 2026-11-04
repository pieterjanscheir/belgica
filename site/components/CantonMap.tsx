'use client'

import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react'
import { Link } from '@/i18n/navigation'
import { fetchJson } from '@/lib/fetch-json'

interface MapData {
    viewBox: [number, number, number, number]
    cantons: { canton: string; name: string; court: string; d: string }[]
}

interface Props {
    /** Draw only these cantons (and zoom to them); all by default */
    only?: readonly string[]
    /** Cantons to highlight */
    highlight?: readonly string[]
    label: string
}

function bounds(paths: readonly string[]): [number, number, number, number] {
    let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity]
    for (const d of paths) {
        for (const pair of d.split(/[MLZ]/)) {
            if (!pair) continue
            const [x, y] = pair.split(' ').map(Number) as [number, number]
            minX = Math.min(minX, x)
            minY = Math.min(minY, y)
            maxX = Math.max(maxX, x)
            maxY = Math.max(maxY, y)
        }
    }
    return [minX, minY, maxX - minX, maxY - minY]
}

/**
 * The cantons as an SVG map, from the boundaries in belgica/canton-boundaries, simplified at
 * build time into canton-map.json. Each canton links to its page; hovering names it.
 */
export function CantonMap({ only, highlight = [], label }: Props) {
    const [data, setData] = useState<MapData | null>(null)
    const [tip, setTip] = useState<{ x: number; y: number; name: string; court: string } | null>(
        null,
    )
    const frameRef = useRef<HTMLDivElement>(null)
    const tipRef = useRef<HTMLDivElement>(null)

    // Place the tooltip beside the cursor, flipping and clamping it so it stays inside the map.
    useLayoutEffect(() => {
        const frame = frameRef.current
        const el = tipRef.current
        if (!tip || !frame || !el) return
        const gap = 12
        const { width: fw, height: fh } = frame.getBoundingClientRect()
        const { width: tw, height: th } = el.getBoundingClientRect()
        let left = tip.x + gap
        if (left + tw > fw) left = tip.x - gap - tw
        let top = tip.y - gap - th
        if (top < 0) top = tip.y + gap
        left = Math.max(0, Math.min(left, fw - tw))
        top = Math.max(0, Math.min(top, fh - th))
        el.style.left = `${left}px`
        el.style.top = `${top}px`
        el.style.visibility = 'visible'
    }, [tip])
    useEffect(() => {
        fetchJson<MapData>('/canton-map.json').then(setData, () => {
            setData(null)
        })
    }, [])

    const shapes =
        data ?
            only ? data.cantons.filter((c) => only.includes(c.canton))
            :   data.cantons
        :   []
    const [x, y, w, h] =
        !data ? [0, 0, 100, 80]
        : only ? bounds(shapes.map((s) => s.d))
        : data.viewBox
    const pad = Math.max(w, h) * 0.03
    const viewBox = [x - pad, y - pad, w + 2 * pad, h + 2 * pad]

    function move(e: PointerEvent<HTMLDivElement>) {
        const link = (e.target as Element).closest('a[data-canton]')
        const shape = data?.cantons.find((c) => c.canton === link?.getAttribute('data-canton'))
        if (!shape) {
            setTip(null)
            return
        }
        const box = e.currentTarget.getBoundingClientRect()
        setTip({
            x: e.clientX - box.left,
            y: e.clientY - box.top,
            name: shape.name,
            court: shape.court,
        })
    }

    return (
        <div
            ref={frameRef}
            className="map-frame"
            onPointerMove={move}
            onPointerLeave={() => {
                setTip(null)
            }}
        >
            <svg
                viewBox={viewBox.join(' ')}
                role="img"
                aria-label={label}
                className="map"
                aria-busy={!data}
            >
                {shapes.map((s) => (
                    <Link
                        key={s.canton}
                        href={`/cantons/${s.canton}/`}
                        data-canton={s.canton}
                        aria-label={s.name}
                    >
                        <path
                            d={s.d}
                            fillRule="evenodd"
                            className={highlight.includes(s.canton) ? 'on' : undefined}
                        />
                    </Link>
                ))}
            </svg>
            {tip && (
                <div ref={tipRef} className="tip" style={{ visibility: 'hidden' }}>
                    <strong>{tip.name}</strong>
                    <span>{tip.court}</span>
                </div>
            )}
        </div>
    )
}
