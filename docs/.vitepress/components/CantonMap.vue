<script setup lang="ts">
/**
 * The judicial cantons on a map: MapLibre with OpenFreeMap's vector tiles (OpenStreetMap), every
 * canton tinted in one of six colours, never the same as a neighbour's. Zoomed out it draws the
 * overview (simplified to about 50 m); from DETAIL_ZOOM it fetches the boundaries of the cantons
 * in view at full precision, so the building outlines and house numbers sit on the tint and the
 * canton of each house shows. Hover for the canton and its justice of the peace; with `pick`, a
 * click picks that point. The files come from scripts/build-docs-map.ts.
 */
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useData, withBase } from 'vitepress'
import type * as MapLibre from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { formatCourtName, getCanton, getCourt, getJusticeOfThePeace } from '../../../src'
import type { BoundingBox } from '../../../src/geometry'
import { boxAround, loadCanton, loadIndex, overviewUrl, PALETTE, type MapIndex } from '../map'
import { inLang, useLocale, useStrings } from '../i18n'

export interface MapPoint {
    longitude: number
    latitude: number
}

/** What the map shows: all of Belgium, some cantons, or a point at a zoom */
export type MapView = 'belgium' | readonly string[] | (MapPoint & { zoom?: number })

const props = withDefaults(
    defineProps<{
        /** The cantons to pick out; the rest step back */
        highlight?: readonly string[]
        /** The address or the point picked, as a marker */
        point?: MapPoint | null
        view?: MapView
        /** A click on the map picks that point */
        pick?: boolean
        height?: string
    }>(),
    { highlight: () => [], point: null, view: 'belgium', pick: false, height: '440px' },
)
const emit = defineEmits<{ pick: [longitude: number, latitude: number] }>()

const { dataLang } = useLocale()
const t = useStrings('CantonMap', {
    root: {
        label: 'The judicial cantons of Belgium on a map',
        loading: 'Loading the map…',
        failed: "The map couldn't load: {error}",
        pickHint: 'Click the map to pick a point',
        justiceOfThePeace: 'Justice of the peace',
        attribution: 'Cantons © NGI',
        scroll: 'Use Ctrl + scroll to zoom the map',
        scrollMac: 'Use ⌘ + scroll to zoom the map',
        touch: 'Use two fingers to move the map',
    },
    nl: {
        label: 'De gerechtelijke kantons van België op een kaart',
        loading: 'Kaart laden…',
        failed: 'De kaart kon niet laden: {error}',
        pickHint: 'Klik op de kaart om een punt te kiezen',
        justiceOfThePeace: 'Vredegerecht',
        attribution: 'Kantons © NGI',
        scroll: 'Gebruik Ctrl + scrollen om te zoomen',
        scrollMac: 'Gebruik ⌘ + scrollen om te zoomen',
        touch: 'Gebruik twee vingers om de kaart te verplaatsen',
    },
    fr: {
        label: 'Les cantons judiciaires de Belgique sur une carte',
        loading: 'Chargement de la carte…',
        failed: 'La carte n’a pas pu se charger : {error}',
        pickHint: 'Cliquez sur la carte pour choisir un point',
        justiceOfThePeace: 'Justice de paix',
        attribution: 'Cantons © IGN',
        scroll: 'Utilisez Ctrl + molette pour zoomer',
        scrollMac: 'Utilisez ⌘ + molette pour zoomer',
        touch: 'Utilisez deux doigts pour déplacer la carte',
    },
})

const STYLES = {
    light: 'https://tiles.openfreemap.org/styles/positron',
    dark: 'https://tiles.openfreemap.org/styles/dark',
}
/** Belgium, [west, south, east, north] */
const BELGIUM: BoundingBox = [2.54, 49.49, 6.41, 51.51]
/** From this zoom the boundaries are drawn at full precision, fetched per canton in view */
const DETAIL_ZOOM = 11.5
/** More cantons than this in view: the overview is good enough */
const MAX_DETAIL = 24

const container = ref<HTMLDivElement>()
const status = ref<'loading' | 'ready' | 'failed'>('loading')
const error = ref('')
const hover = ref<{ x: number; y: number; title: string; detail: string } | null>(null)
const map = shallowRef<MapLibre.Map>()
let lib: typeof MapLibre | undefined
let marker: MapLibre.Marker | undefined
let index: MapIndex | undefined
let hovered: string | null = null
let detail: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }
let disposed = false

const { isDark } = useData()
const reducedMotion = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const colourOf: MapLibre.ExpressionSpecification = [
    'match',
    ['get', 'colour'],
    ...PALETTE.flatMap((c, i) => [i, c]),
    PALETTE[0]!,
] as unknown as MapLibre.ExpressionSpecification

const state = (selected: number, hover: number, rest: number): MapLibre.ExpressionSpecification => [
    'case',
    ['boolean', ['feature-state', 'selected'], false],
    selected,
    ['boolean', ['feature-state', 'hover'], false],
    hover,
    rest,
]

const intersects = (a: readonly number[], b: readonly number[]) =>
    (a[0] ?? 0) <= (b[2] ?? 0) &&
    (a[2] ?? 0) >= (b[0] ?? 0) &&
    (a[1] ?? 0) <= (b[3] ?? 0) &&
    (a[3] ?? 0) >= (b[1] ?? 0)

/** OpenFreeMap's dark style when it answers, Positron otherwise */
async function pickStyle(dark: boolean): Promise<string> {
    if (!dark) return STYLES.light
    try {
        const r = await fetch(STYLES.dark, { method: 'HEAD' })
        return r.ok ? STYLES.dark : STYLES.light
    } catch {
        return STYLES.light
    }
}

/** 'Gent 1': the name alone doesn't tell a city's cantons apart */
function cantonName(id: string): string {
    const canton = getCanton(id)
    if (!canton) return id
    const name = inLang(canton.name, dataLang.value)
    return canton.number === undefined ? name : `${name} ${canton.number}`
}

function courtPoints(): GeoJSON.FeatureCollection {
    return {
        type: 'FeatureCollection',
        features: (index?.courts ?? []).map((c) => ({
            type: 'Feature',
            properties: { id: c.id },
            geometry: { type: 'Point', coordinates: [...c.coordinates] },
        })),
    }
}

onMounted(async () => {
    try {
        const [maplibre, style, loaded] = await Promise.all([
            import('maplibre-gl'),
            pickStyle(isDark.value),
            loadIndex(),
        ])
        if (disposed || !container.value) return
        lib = maplibre
        index = loaded
        // Bundled, the worker isn't next to the module: it's copied to public/map by the build
        maplibre.setWorkerUrl(withBase('/map/maplibre-gl-worker.mjs'))
        const m = new maplibre.Map({
            container: container.value,
            style,
            bounds: BELGIUM,
            fitBoundsOptions: { padding: 24 },
            attributionControl: { compact: true },
            cooperativeGestures: true,
            maxPitch: 0,
            dragRotate: false,
            locale: {
                'CooperativeGesturesHandler.WindowsHelpText': t.value.scroll,
                'CooperativeGesturesHandler.MacHelpText': t.value.scrollMac,
                'CooperativeGesturesHandler.MobileHelpText': t.value.touch,
            },
        })
        m.touchZoomRotate.disableRotation()
        m.addControl(new maplibre.NavigationControl({ showCompass: false }), 'top-right')
        m.addControl(new maplibre.ScaleControl({ unit: 'metric' }), 'bottom-left')
        m.on('style.load', () => addOverlay(m))
        m.on('load', () => {
            status.value = 'ready'
            applyView(m, props.view, false)
            applyPoint(m, props.point)
        })
        m.on('moveend', () => void loadDetail(m))
        m.on('mousemove', (e) => {
            const court =
                m.getLayer('bld-courts') ?
                    m.queryRenderedFeatures(e.point, { layers: ['bld-courts'] })[0]
                :   undefined
            const layers = ['bld-detail-fill', 'bld-overview-fill'].filter((l) => m.getLayer(l))
            const feature = m.queryRenderedFeatures(e.point, { layers })[0]
            const id = feature?.properties?.['id'] as string | undefined
            setHovered(m, id ?? null)
            if (court) {
                const found = getCourt(court.properties?.['id'] as string)
                hover.value = {
                    x: e.point.x,
                    y: e.point.y,
                    title: found ? formatCourtName(found, dataLang.value) : '',
                    detail: found?.address ? `${found.address.street}, ${found.address.city}` : '',
                }
            } else if (id) {
                const court = getJusticeOfThePeace(id)
                hover.value = {
                    x: e.point.x,
                    y: e.point.y,
                    title: cantonName(id),
                    detail: court ? formatCourtName(court, dataLang.value) : '',
                }
            } else hover.value = null
            m.getCanvas().style.cursor = props.pick || court ? 'crosshair' : ''
        })
        m.on('mouseout', () => {
            setHovered(m, null)
            hover.value = null
        })
        m.on('click', (e) => {
            if (props.pick) emit('pick', e.lngLat.lng, e.lngLat.lat)
        })
        m.on('error', (e) => {
            // A tile that fails is drawn empty; only the style's failure is fatal
            if (status.value === 'loading' && !m.isStyleLoaded()) fail(e.error)
        })
        map.value = m
    } catch (e) {
        fail(e)
    }
})

function fail(e: unknown) {
    status.value = 'failed'
    error.value = e instanceof Error ? e.message : String(e)
}

onBeforeUnmount(() => {
    disposed = true
    map.value?.remove()
    map.value = undefined
})

// Another colour scheme: the base style for it, and our layers again on style.load
watch(isDark, (dark) => {
    const m = map.value
    if (!m) return
    void pickStyle(dark).then((style) => {
        if (!disposed) m.setStyle(style, { diff: false })
    })
})

watch(
    () => props.highlight,
    () => map.value && applySelection(map.value),
)
watch(
    () => props.point,
    (point) => map.value && applyPoint(map.value, point),
)
watch(
    () => props.view,
    (view) => map.value && applyView(map.value, view, true),
)

function setHovered(m: MapLibre.Map, id: string | null) {
    if (hovered === id) return
    for (const source of ['bld-overview', 'bld-detail']) {
        if (!m.getSource(source)) continue
        if (hovered) m.setFeatureState({ source, id: hovered }, { hover: false })
        if (id) m.setFeatureState({ source, id }, { hover: true })
    }
    hovered = id
}

/** The highlighted cantons, as feature state on both sources */
function applySelection(m: MapLibre.Map) {
    if (!index || !m.isStyleLoaded()) return
    const selected = new Set(props.highlight)
    for (const source of ['bld-overview', 'bld-detail']) {
        if (!m.getSource(source)) continue
        for (const c of index.cantons)
            m.setFeatureState({ source, id: c.id }, { selected: selected.has(c.id) })
    }
}

function applyPoint(m: MapLibre.Map, point: MapPoint | null) {
    marker?.remove()
    marker = undefined
    if (!point || !lib) return
    marker = new lib.Marker({ color: isDark.value ? '#9aa6ff' : '#1c2033' })
        .setLngLat([point.longitude, point.latitude])
        .addTo(m)
}

function applyView(m: MapLibre.Map, view: MapView, animate: boolean) {
    const duration = animate && !reducedMotion() ? 800 : 0
    if (view === 'belgium') {
        m.fitBounds(BELGIUM, { padding: 24, duration })
    } else if (Array.isArray(view)) {
        const box = index && boxAround(index, view as readonly string[])
        if (box) m.fitBounds(box, { padding: 40, maxZoom: 13, duration })
    } else {
        const { longitude, latitude, zoom = 16 } = view as MapPoint & { zoom?: number }
        const to = { center: [longitude, latitude] as [number, number], zoom }
        if (duration) m.flyTo({ ...to, duration })
        else m.jumpTo(to)
    }
}

/** Our layers on the base style: again after every style change */
function addOverlay(m: MapLibre.Map) {
    const style = m.getStyle()
    const layers = style.layers
    const firstSymbol = layers.find((l) => l.type === 'symbol')?.id
    const vector = Object.entries(style.sources).find(([, s]) => s.type === 'vector')?.[0]
    const fontLayer = layers.find(
        (l) => l.type === 'symbol' && Array.isArray(l.layout?.['text-font']),
    ) as MapLibre.SymbolLayerSpecification | undefined
    const font = (fontLayer?.layout?.['text-font'] as string[] | undefined) ?? ['Noto Sans Regular']
    const dark = isDark.value
    const attribution = t.value.attribution

    m.addSource('bld-overview', {
        type: 'geojson',
        data: overviewUrl(),
        promoteId: 'id',
        attribution,
    })
    m.addSource('bld-detail', { type: 'geojson', data: detail, promoteId: 'id' })
    m.addSource('bld-courts', { type: 'geojson', data: courtPoints() })

    m.addLayer(
        {
            id: 'bld-overview-fill',
            type: 'fill',
            source: 'bld-overview',
            maxzoom: DETAIL_ZOOM,
            paint: {
                'fill-color': colourOf,
                'fill-opacity': state(0.42, 0.3, 0.16),
                'fill-opacity-transition': { duration: 400 },
            },
        },
        firstSymbol,
    )
    m.addLayer(
        {
            id: 'bld-detail-fill',
            type: 'fill',
            source: 'bld-detail',
            minzoom: DETAIL_ZOOM,
            paint: {
                'fill-color': colourOf,
                'fill-opacity': state(0.34, 0.26, 0.17),
                'fill-opacity-transition': { duration: 400 },
            },
        },
        firstSymbol,
    )
    // The buildings' outlines over the tint: every house stands out in its canton's colour
    if (vector)
        m.addLayer(
            {
                id: 'bld-buildings',
                type: 'line',
                source: vector,
                'source-layer': 'building',
                minzoom: 14.5,
                paint: {
                    'line-color': dark ? 'rgba(255,255,255,0.35)' : 'rgba(15,23,42,0.28)',
                    'line-width': 0.75,
                },
            },
            firstSymbol,
        )
    m.addLayer(
        {
            id: 'bld-overview-line',
            type: 'line',
            source: 'bld-overview',
            maxzoom: DETAIL_ZOOM,
            paint: { 'line-color': colourOf, 'line-width': state(2.5, 1.5, 0.8) },
        },
        firstSymbol,
    )
    m.addLayer(
        {
            id: 'bld-detail-casing',
            type: 'line',
            source: 'bld-detail',
            minzoom: DETAIL_ZOOM,
            paint: {
                'line-color': dark ? '#000' : '#fff',
                'line-width': state(6, 5, 4),
                'line-opacity': 0.9,
            },
        },
        firstSymbol,
    )
    m.addLayer(
        {
            id: 'bld-detail-line',
            type: 'line',
            source: 'bld-detail',
            minzoom: DETAIL_ZOOM,
            paint: { 'line-color': colourOf, 'line-width': state(3, 2.5, 2) },
        },
        firstSymbol,
    )
    // House numbers, when the base style has none
    const hasNumbers = layers.some(
        (l) => 'source-layer' in l && l['source-layer'] === 'housenumber',
    )
    if (vector && !hasNumbers)
        m.addLayer({
            id: 'bld-housenumbers',
            type: 'symbol',
            source: vector,
            'source-layer': 'housenumber',
            minzoom: 16.5,
            layout: { 'text-field': ['get', 'housenumber'], 'text-font': font, 'text-size': 11 },
            paint: {
                'text-color': dark ? '#e2e8f0' : '#334155',
                'text-halo-color': dark ? '#000' : '#fff',
                'text-halo-width': 1.2,
            },
        })
    m.addLayer({
        id: 'bld-overview-labels',
        type: 'symbol',
        source: 'bld-overview',
        minzoom: 8.5,
        maxzoom: DETAIL_ZOOM,
        layout: { 'text-field': ['get', dataLang.value], 'text-font': font, 'text-size': 11 },
        paint: {
            'text-color': dark ? '#f8fafc' : '#0f172a',
            'text-halo-color': dark ? '#000' : '#fff',
            'text-halo-width': 1.5,
        },
    })
    // The justices of the peace, where the NGI has their point
    m.addLayer({
        id: 'bld-courts',
        type: 'circle',
        source: 'bld-courts',
        minzoom: 9,
        paint: {
            'circle-radius': 6,
            'circle-color': dark ? '#fff' : '#1c2033',
            'circle-stroke-color': dark ? '#1c2033' : '#fff',
            'circle-stroke-width': 2,
        },
    })
    hovered = null
    applySelection(m)
    void loadDetail(m)
}

/** The boundaries of the cantons in view at full precision, from DETAIL_ZOOM */
async function loadDetail(m: MapLibre.Map) {
    if (!index || m.getZoom() < DETAIL_ZOOM) return
    const b = m.getBounds()
    const view = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]
    const inView = index.cantons.filter((c) => intersects(c.box, view))
    if (!inView.length || inView.length > MAX_DETAIL) return
    const have = new Set(detail.features.map((f) => f.id))
    if (inView.every((c) => have.has(c.id)) && have.size === inView.length) return
    const files = await Promise.all(inView.map((c) => loadCanton(c.id)))
    if (disposed) return
    const colours = new Map(index.cantons.map((c) => [c.id, c.colour]))
    detail = {
        type: 'FeatureCollection',
        features: files.map((f) => ({
            type: 'Feature',
            id: f.id,
            properties: { id: f.id, colour: colours.get(f.id) ?? 0 },
            geometry: f.geometry,
        })),
    }
    const source = m.getSource('bld-detail') as MapLibre.GeoJSONSource | undefined
    source?.setData(detail)
    // The new features start without state: the selection and hover again once they're there
    m.once('sourcedata', () => {
        applySelection(m)
        const id = hovered
        hovered = null
        setHovered(m, id)
    })
}
</script>

<template>
    <div class="bld-map" :style="{ height }">
        <div ref="container" class="bld-map-canvas" role="region" :aria-label="t.label" />
        <p v-if="status === 'loading'" class="bld-map-note bld-muted">{{ t.loading }}</p>
        <p v-else-if="status === 'failed'" class="bld-map-note bld-warning">
            {{ t.failed.replace('{error}', error) }}
        </p>
        <p v-else-if="pick" class="bld-map-hint">{{ t.pickHint }}</p>
        <div
            v-if="hover && status === 'ready'"
            class="bld-map-tip"
            :style="{ left: `${hover.x}px`, top: `${hover.y}px` }"
        >
            <strong>{{ hover.title }}</strong>
            <span v-if="hover.detail">{{ hover.detail }}</span>
        </div>
        <ul v-if="status === 'ready'" class="bld-map-legend" aria-hidden="true">
            <li v-for="(c, i) in PALETTE" :key="i" :style="{ '--swatch': c }" />
        </ul>
    </div>
</template>

<style scoped>
.bld-map {
    position: relative;
    margin: 16px 0;
    border: 1px solid var(--vp-c-divider);
    border-radius: 12px;
    overflow: hidden;
    background: var(--vp-c-bg-soft);
}
.bld-map-canvas {
    position: absolute;
    inset: 0;
}
.bld-map-note {
    position: absolute;
    left: 12px;
    top: 12px;
    margin: 0;
}
.bld-map-hint {
    position: absolute;
    left: 50%;
    top: 10px;
    transform: translateX(-50%);
    margin: 0;
    padding: 2px 10px;
    border-radius: 12px;
    background: var(--vp-c-bg);
    color: var(--vp-c-text-2);
    font-size: 12px;
    pointer-events: none;
    box-shadow: 0 1px 4px rgb(0 0 0 / 0.15);
}
.bld-map-tip {
    position: absolute;
    transform: translate(12px, -100%) translateY(-12px);
    max-width: 260px;
    padding: 6px 10px;
    border-radius: 8px;
    background: var(--vp-c-bg-elv);
    border: 1px solid var(--vp-c-divider);
    box-shadow: 0 4px 16px rgb(0 0 0 / 0.15);
    font-size: 13px;
    line-height: 1.4;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    z-index: 2;
}
.bld-map-tip span {
    color: var(--vp-c-text-2);
}
.bld-map-legend {
    position: absolute;
    right: 12px;
    bottom: 12px;
    display: flex;
    gap: 3px;
    margin: 0;
    padding: 4px;
    list-style: none;
    border-radius: 6px;
    background: var(--vp-c-bg);
    box-shadow: 0 1px 4px rgb(0 0 0 / 0.15);
}
.bld-map-legend li {
    width: 12px;
    height: 12px;
    margin: 0;
    border-radius: 3px;
    background: var(--swatch);
    opacity: 0.6;
}
/* The site's fonts and colours in MapLibre's controls and attribution */
.bld-map :deep(.maplibregl-ctrl-attrib) {
    font-size: 11px;
}
.bld-map :deep(.maplibregl-ctrl-attrib a) {
    color: inherit;
}
.bld-map :deep(.maplibregl-marker) {
    cursor: default;
}
.dark .bld-map :deep(.maplibregl-ctrl-group),
.dark .bld-map :deep(.maplibregl-ctrl-attrib) {
    background: rgb(24 26 36 / 0.9);
    color: #eef0f8;
}
.dark .bld-map :deep(.maplibregl-ctrl-group button + button) {
    border-top-color: #262938;
}
.dark .bld-map :deep(.maplibregl-ctrl-zoom-in .maplibregl-ctrl-icon),
.dark .bld-map :deep(.maplibregl-ctrl-zoom-out .maplibregl-ctrl-icon) {
    filter: invert(1);
}
</style>
