'use client'

import { useEffect, useRef, useState } from 'react'
import type { LayerGroup, Map as LeafletMap } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { CantonFile } from '@/lib/address'

interface Props {
    /** The cantons to draw, with their boundaries from public/address/ */
    cantons: readonly CantonFile[]
    /** The cantons the address is in, drawn stronger */
    highlight: readonly string[]
    /** The address's point */
    point?: { latitude: number; longitude: number; label: string } | undefined
    /** Clicking the map picks a point there; without it, the map is only looked at */
    onPick?: ((longitude: number, latitude: number) => void) | undefined
    label: string
}

/** A colour of the site's palette, which Leaflet needs as a value */
const token = (name: string) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#3d4fd1'

/**
 * The cantons on OpenStreetMap's map, with the address's point: Leaflet, loaded only in the
 * browser, with the canton boundaries the address lookup places the point in.
 */
export function AddressMap({ cantons, highlight, point, onPick, label }: Props) {
    const element = useRef<HTMLDivElement>(null)
    const map = useRef<LeafletMap | null>(null)
    const layers = useRef<LayerGroup | null>(null)
    const leaflet = useRef<typeof import('leaflet') | null>(null)
    // Leaflet loads after the first render: the drawing below waits for it
    const [ready, setReady] = useState(false)
    /** The cantons the view was last fitted to, and the point it last moved to */
    const fitted = useRef<readonly CantonFile[] | null>(null)
    const moved = useRef<string | null>(null)
    const pick = useRef(onPick)
    pick.current = onPick

    // The map itself, once; Leaflet touches window, so it's imported here, not at the top
    useEffect(() => {
        let removed = false
        void import('leaflet').then((L) => {
            if (removed || !element.current) return
            leaflet.current = L
            const m = L.map(element.current, { scrollWheelZoom: false, zoomControl: true })
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution:
                    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            }).addTo(m)
            m.on('click', (e) => {
                pick.current?.(e.latlng.lng, e.latlng.lat)
            })
            map.current = m
            layers.current = L.layerGroup().addTo(m)
            m.setView([50.64, 4.67], 8)
            setReady(true)
        })
        return () => {
            removed = true
            map.current?.remove()
            map.current = null
            layers.current = null
            fitted.current = null
            moved.current = null
            setReady(false)
        }
    }, [])

    // The cantons and the point, drawn again when they change. The view only moves for cantons
    // it hasn't shown yet or a point somewhere else: a click on the map keeps the zoom it was
    // made at, also while the point is looked up again.
    useEffect(() => {
        const L = leaflet.current
        const m = map.current
        const group = layers.current
        if (!ready || !L || !m || !group) return
        group.clearLayers()
        const brand = token('--brand')
        const shapes = cantons.map((c) => {
            const on = highlight.includes(c.canton)
            const shape = L.polygon(
                c.geometry.map((polygon) =>
                    polygon.map((ring) => ring.map(([lon = 0, lat = 0]) => L.latLng(lat, lon))),
                ),
                {
                    color: brand,
                    weight: on ? 3 : 1.5,
                    fillOpacity: on ? 0.18 : 0.04,
                    interactive: true,
                },
            )
            shape.bindTooltip(c.name, { sticky: true })
            shape.on('click', (e) => {
                pick.current?.(e.latlng.lng, e.latlng.lat)
            })
            return shape.addTo(group)
        })
        if (point) {
            L.circleMarker([point.latitude, point.longitude], {
                radius: 8,
                color: '#fff',
                weight: 2,
                fillColor: token('--red'),
                fillOpacity: 1,
            })
                .bindTooltip(point.label)
                .addTo(group)
            const at = `${point.latitude},${point.longitude}`
            if (at !== moved.current) {
                moved.current = at
                // Close in on an address; a point clicked on a map already close in stays in view
                if (m.getZoom() < 15) m.setView([point.latitude, point.longitude], 16)
                else m.panTo([point.latitude, point.longitude])
            }
        } else if (shapes.length && fitted.current !== cantons) {
            fitted.current = cantons
            m.fitBounds(L.featureGroup(shapes).getBounds(), { padding: [12, 12] })
        }
    }, [ready, cantons, highlight, point])

    return (
        <div
            ref={element}
            className={`finder-map${onPick ? ' pickable' : ''}`}
            role="region"
            aria-label={label}
        />
    )
}
