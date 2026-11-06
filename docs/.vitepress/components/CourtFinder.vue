<script setup lang="ts">
/**
 * From an address to its courts, the way an app on the package does it: the region's address
 * register geocodes the address (docs/.vitepress/geocode.ts), the point is placed in the canton
 * boundaries (../map.ts, the same test as `findCantonsAt`), and `getCourtsForCanton` lists the
 * courts. The map shows the point in its canton; a click on it picks a point instead. The calls
 * that gave the result are printed under it.
 */
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import {
    formatCourtName,
    formatPhoneNumber,
    getCanton,
    getContact,
    getCourtsForCanton,
    getMunicipalitiesForPostalCode,
    getMunicipality,
    type Canton,
    type Court,
    type CourtType,
} from '../../../src'
import { geocode, type AddressCandidate, type GeocodeSource } from '../geocode'
import { fmt, inLang, useLocale, useStrings } from '../i18n'
import { place, type Placed } from '../map'
import CantonMap, { type MapPoint, type MapView } from './CantonMap.vue'

const { dataLang } = useLocale()
const t = useStrings('CourtFinder', {
    root: {
        address: 'Address',
        placeholder: 'Street and number, postal code and municipality',
        find: 'Find the courts',
        clear: 'Clear',
        examples: 'Try',
        orClick: 'or click a point on the map',
        searching: 'Looking up the address…',
        placing: 'Placing the point in the cantons…',
        placeFailed: 'Couldn’t load the canton boundaries: {error}. Try again.',
        none: 'No address found. Check the spelling, and give the postal code.',
        failed: "Couldn't reach {source}: {error}",
        match: 'Match',
        picked: 'A point picked on the map',
        streetOnly:
            'The register knows the street but not this house number: the point is somewhere on the street, which may itself be the boundary between two cantons. Check the number.',
        canton: 'Canton',
        outside: 'This point lies in no canton: is it in Belgium?',
        onLine: 'The address lies on the boundary between {cantons}: the courts of each are listed, and the law decides. Read each canton’s area below.',
        near: 'The address is {m} m from the boundary with {other}. The NGI drew the boundary from the law, and the law decides: read both cantons’ areas below.',
        split: '{name} is split over several cantons; the address decides which.',
        legalText: 'The canton’s area in the law',
        courts: 'Courts for this address',
        website: 'Website',
        hours: 'Registry hours',
        code: 'The calls behind this result',
        source: 'Address from {register}. Reference data, not legal advice.',
        'type.justice-of-the-peace': 'Justice of the peace',
        'type.police-court': 'Police court',
        'type.court-of-first-instance': 'Court of first instance',
        'type.enterprise-court': 'Enterprise court',
        'type.labour-court': 'Labour court',
        'type.court-of-appeal': 'Court of appeal',
        'type.labour-court-of-appeal': 'Labour court of appeal',
        'type.court-of-assize': 'Court of assize',
    },
    nl: {
        address: 'Adres',
        placeholder: 'Straat en nummer, postcode en gemeente',
        find: 'Zoek de rechtbanken',
        clear: 'Wissen',
        examples: 'Probeer',
        orClick: 'of klik op een punt op de kaart',
        searching: 'Adres opzoeken…',
        placing: 'Punt in de kantons plaatsen…',
        placeFailed: 'De kantongrenzen konden niet laden: {error}. Probeer opnieuw.',
        none: 'Geen adres gevonden. Controleer de spelling en geef de postcode.',
        failed: '{source} niet bereikbaar: {error}',
        match: 'Resultaat',
        picked: 'Een punt gekozen op de kaart',
        streetOnly:
            'Het register kent de straat maar niet dit huisnummer: het punt ligt ergens in de straat, die zelf de grens tussen twee kantons kan zijn. Controleer het nummer.',
        canton: 'Kanton',
        outside: 'Dit punt ligt in geen enkel kanton: ligt het in België?',
        onLine: 'Het adres ligt op de grens tussen {cantons}: de rechtbanken van elk staan hieronder, en de wet beslist. Lees hieronder het gebied van elk kanton.',
        near: 'Het adres ligt {m} m van de grens met {other}. Het NGI tekende de grens naar de wet, en de wet beslist: lees hieronder het gebied van beide kantons.',
        split: '{name} is verdeeld over meerdere kantons; het adres beslist welk.',
        legalText: 'Het gebied van het kanton volgens de wet',
        courts: 'Rechtbanken voor dit adres',
        website: 'Website',
        hours: 'Openingsuren griffie',
        code: 'De aanroepen achter dit resultaat',
        source: 'Adres uit {register}. Referentiedata, geen juridisch advies.',
        'type.justice-of-the-peace': 'Vredegerecht',
        'type.police-court': 'Politierechtbank',
        'type.court-of-first-instance': 'Rechtbank van eerste aanleg',
        'type.enterprise-court': 'Ondernemingsrechtbank',
        'type.labour-court': 'Arbeidsrechtbank',
        'type.court-of-appeal': 'Hof van beroep',
        'type.labour-court-of-appeal': 'Arbeidshof',
        'type.court-of-assize': 'Hof van assisen',
    },
    fr: {
        address: 'Adresse',
        placeholder: 'Rue et numéro, code postal et commune',
        find: 'Trouver les juridictions',
        clear: 'Effacer',
        examples: 'Essayez',
        orClick: 'ou cliquez sur un point de la carte',
        searching: 'Recherche de l’adresse…',
        placing: 'Placement du point dans les cantons…',
        placeFailed: 'Les limites des cantons n’ont pas pu se charger : {error}. Réessayez.',
        none: 'Aucune adresse trouvée. Vérifiez l’orthographe et indiquez le code postal.',
        failed: '{source} injoignable : {error}',
        match: 'Résultat',
        picked: 'Un point choisi sur la carte',
        streetOnly:
            'Le registre connaît la rue mais pas ce numéro : le point est quelque part dans la rue, qui peut elle-même être la limite entre deux cantons. Vérifiez le numéro.',
        canton: 'Canton',
        outside: 'Ce point ne se trouve dans aucun canton : est-il en Belgique ?',
        onLine: 'L’adresse se trouve sur la limite entre {cantons} : les juridictions de chacun sont listées, et la loi décide. Lisez ci-dessous le territoire de chaque canton.',
        near: 'L’adresse est à {m} m de la limite avec {other}. L’IGN a tracé la limite d’après la loi, et la loi décide : lisez ci-dessous le territoire des deux cantons.',
        split: '{name} est répartie sur plusieurs cantons ; l’adresse décide lequel.',
        legalText: 'Le territoire du canton selon la loi',
        courts: 'Juridictions pour cette adresse',
        website: 'Site web',
        hours: 'Heures du greffe',
        code: 'Les appels derrière ce résultat',
        source: 'Adresse issue de {register}. Données de référence, pas un avis juridique.',
        'type.justice-of-the-peace': 'Justice de paix',
        'type.police-court': 'Tribunal de police',
        'type.court-of-first-instance': 'Tribunal de première instance',
        'type.enterprise-court': 'Tribunal de l’entreprise',
        'type.labour-court': 'Tribunal du travail',
        'type.court-of-appeal': 'Cour d’appel',
        'type.labour-court-of-appeal': 'Cour du travail',
        'type.court-of-assize': 'Cour d’assises',
    },
})

const REGISTERS: Record<GeocodeSource, string> = {
    flanders: 'the Adressenregister (Digitaal Vlaanderen, Geolocation API)',
    brussels: 'UrbIS (paradigm.brussels)',
    wallonia: 'ICAR (SPW, geocodeWS)',
}

// Addresses in split cities, one per region, and one in a municipality of a single canton
const EXAMPLES = [
    'Kerkstraat 10, 2060 Antwerpen',
    'Rue de la Loi 16, 1000 Bruxelles',
    'Place Saint-Lambert 18, 4000 Liège',
    'Hundelgemsesteenweg 622, 9820 Merelbeke',
]

const COURT_ORDER: CourtType[] = [
    'justice-of-the-peace',
    'police-court',
    'court-of-first-instance',
    'enterprise-court',
    'labour-court',
    'court-of-appeal',
    'labour-court-of-appeal',
    'court-of-assize',
]

const query = ref('')
const loading = ref(false)
const placing = ref(false)
const candidates = ref<AddressCandidate[]>([])
const failed = ref<{ source: GeocodeSource; error: string }[]>([])
const searched = ref(false)
const selected = ref(0)
/** A point clicked on the map, instead of an address */
const picked = ref<MapPoint | null>(null)
const placed = shallowRef<Placed | null>(null)
const placeError = ref('')
const view = ref<MapView>('belgium')

let controller: AbortController | undefined
let placing_ = 0

/** `match`: the label of the candidate to select, from a shared link; the first otherwise */
async function search(address = query.value, match = '') {
    query.value = address
    if (!address.trim()) return
    controller?.abort()
    // Only the latest search writes its results: an earlier one can finish after it starts
    const current = new AbortController()
    controller = current
    loading.value = true
    picked.value = null
    try {
        const result = await geocode(address, current.signal)
        if (controller !== current) return
        candidates.value = result.candidates
        failed.value = result.failed
        selected.value = Math.max(
            0,
            result.candidates.findIndex((c) => c.label === match),
        )
        searched.value = true
        remember()
    } catch (error) {
        if ((error as Error).name !== 'AbortError') throw error
    } finally {
        if (controller === current) loading.value = false
    }
}

function pickPoint(longitude: number, latitude: number) {
    controller?.abort()
    loading.value = false
    candidates.value = []
    failed.value = []
    searched.value = true
    picked.value = { longitude, latitude }
    remember()
}

function clear() {
    controller?.abort()
    loading.value = false
    query.value = ''
    candidates.value = []
    failed.value = []
    searched.value = false
    picked.value = null
    placed.value = null
    view.value = 'belgium'
    remember()
}

const candidate = computed(() => candidates.value[selected.value])
const point = computed<MapPoint | null>(() => picked.value ?? candidate.value ?? null)

// The point in the cantons, from the per-canton files; the map flies to a geocoded address
watch(point, async (p) => {
    const run = ++placing_
    placed.value = null
    placeError.value = ''
    if (!p) return
    if (!picked.value) view.value = { longitude: p.longitude, latitude: p.latitude, zoom: 16 }
    placing.value = true
    try {
        const result = await place(p.longitude, p.latitude)
        if (run === placing_) placed.value = result
    } catch (error) {
        if (run === placing_) placeError.value = (error as Error).message
    } finally {
        if (run === placing_) placing.value = false
    }
})

const cantons = computed<Canton[]>(() =>
    (placed.value?.inside ?? []).flatMap((f) => getCanton(f.id) ?? []),
)
const cantonIds = computed(() => cantons.value.map((c) => c.id))
const nearby = computed(() => placed.value?.near ?? [])

// A point on the line between two cantons gets both, and the courts of each
const courts = computed(() => {
    const found = new Map(
        cantons.value.flatMap((c) => getCourtsForCanton(c.id)).map((court) => [court.id, court]),
    )
    return [...found.values()].sort(
        (a, b) => COURT_ORDER.indexOf(a.type) - COURT_ORDER.indexOf(b.type),
    )
})

// The municipalities of the address's postal code; none for a point picked on the map
const addressMunicipalities = computed(() => {
    const code = candidate.value?.label.match(/\b\d{4}\b/g)?.at(-1)
    return code ? getMunicipalitiesForPostalCode(code).map((m) => m.id) : []
})
// A canton can hold whole municipalities next to part of a city: the note is for an address in
// the city, and not shown when the municipality isn't known (a point picked on the map)
const splitMunicipality = computed(() =>
    cantons.value[0]?.municipalities.find(
        (m) => m.partial === true && addressMunicipalities.value.includes(m.municipality),
    ),
)

/** 'Antwerpen 4': the name alone doesn't tell a city's cantons apart */
function cantonName(canton: Canton | undefined): string {
    if (!canton) return ''
    const name = inLang(canton.name, dataLang.value)
    return canton.number ? `${name} ${canton.number}` : name
}

function typeLabel(court: Court): string {
    return (t.value as Record<string, string>)[`type.${court.type}`] ?? court.type
}

const phone = (court: Court) => getContact(court, 'phone')
const email = (court: Court) => getContact(court, 'email')
const website = (court: Court) =>
    court.website[dataLang.value] ?? court.website.nl ?? court.website.fr ?? court.website.de
const hours = (court: Court) =>
    court.openingHoursText ? inLang(court.openingHoursText, dataLang.value) : ''

/** What a program would call for this point, with what it gets */
const code = computed(() => {
    const p = point.value
    if (!p) return ''
    const lon = String(p.longitude)
    const lat = String(p.latitude)
    const ids = cantonIds.value.map((id) => `'${id}'`).join(', ')
    const lines = [
        "import { findCantonsAt } from 'belgica/canton-boundaries'",
        "import { getCourtsForCanton } from 'belgica'",
        '',
        `findCantonsAt(${lon}, ${lat}).map((c) => c.id) // [${ids}]`,
    ]
    for (const id of cantonIds.value)
        lines.push(
            `getCourtsForCanton('${id}').map((c) => c.id) // [${getCourtsForCanton(id)
                .map((c) => `'${c.id}'`)
                .join(', ')}]`,
        )
    return lines.join('\n')
})

const osm = computed(() => {
    const p = point.value
    return p ?
            `https://www.openstreetmap.org/?mlat=${p.latitude}&mlon=${p.longitude}#map=19/${p.latitude}/${p.longitude}`
        :   ''
})

/** The address or the point in the page's URL, so a result can be shared */
function remember() {
    if (typeof history === 'undefined') return
    const url = new URL(location.href)
    url.searchParams.delete('q')
    url.searchParams.delete('at')
    url.searchParams.delete('match')
    if (picked.value)
        url.searchParams.set(
            'at',
            `${picked.value.latitude.toFixed(6)},${picked.value.longitude.toFixed(6)}`,
        )
    else if (searched.value && query.value.trim()) {
        url.searchParams.set('q', query.value.trim())
        if (candidate.value && selected.value > 0)
            url.searchParams.set('match', candidate.value.label)
    }
    history.replaceState(history.state, '', url)
}

onMounted(() => {
    const params = new URLSearchParams(location.search)
    const q = params.get('q')
    const [lat, lon] = params.get('at')?.split(',').map(Number) ?? []
    if (q) void search(q, params.get('match') ?? '')
    else if (
        lat !== undefined &&
        lon !== undefined &&
        Math.abs(lat) <= 90 &&
        Math.abs(lon) <= 180
    ) {
        pickPoint(lon, lat)
        view.value = { longitude: lon, latitude: lat, zoom: 16 }
    }
})
</script>

<template>
    <div class="bld-panel bld-finder">
        <form class="bld-controls" @submit.prevent="search()">
            <label class="bld-address">
                {{ t.address }}
                <input v-model="query" :placeholder="t.placeholder" autocomplete="street-address" />
            </label>
            <button type="submit" class="bld-more" :disabled="loading">{{ t.find }}</button>
            <button v-if="searched" type="button" class="bld-more bld-quiet" @click="clear">
                {{ t.clear }}
            </button>
        </form>
        <p class="bld-muted">
            {{ t.examples }}:
            <template v-for="(example, i) in EXAMPLES" :key="example">
                <a href="#" @click.prevent="search(example)">{{ example }}</a
                ><span v-if="i < EXAMPLES.length - 1"> · </span>
            </template>
            <span class="bld-or">· {{ t.orClick }}</span>
        </p>

        <CantonMap pick :point="point" :highlight="cantonIds" :view="view" @pick="pickPoint" />

        <p v-if="loading" class="bld-muted">{{ t.searching }}</p>
        <p v-for="f in failed" :key="f.source" class="bld-warning">
            {{ fmt(t.failed, { source: REGISTERS[f.source], error: f.error }) }}
        </p>

        <template v-if="searched && !loading">
            <p v-if="!point" class="bld-muted">{{ t.none }}</p>
            <template v-else>
                <div v-if="candidates.length > 1" class="bld-controls">
                    <label>
                        {{ t.match }}
                        <select v-model="selected" @change="remember">
                            <option v-for="(c, i) in candidates" :key="i" :value="i">
                                {{ c.label }}
                            </option>
                        </select>
                    </label>
                </div>
                <p>
                    <strong>{{ candidate?.label ?? t.picked }}</strong>
                    <span class="bld-muted">
                        · {{ point.latitude.toFixed(6) }}, {{ point.longitude.toFixed(6) }} ·
                        <a :href="osm" target="_blank" rel="noopener">OpenStreetMap</a>
                    </span>
                </p>
                <p v-if="candidate && !candidate.precise" class="bld-warning">
                    {{ t.streetOnly }}
                </p>

                <p v-if="placing" class="bld-muted">{{ t.placing }}</p>
                <p v-else-if="placeError" class="bld-warning">
                    {{ fmt(t.placeFailed, { error: placeError }) }}
                </p>
                <template v-else-if="placed">
                    <p v-if="!cantons.length" class="bld-warning">{{ t.outside }}</p>
                    <template v-else>
                        <p class="bld-result">
                            <template v-for="(c, i) in cantons" :key="c.id">
                                <span v-if="i"> / </span>{{ cantonName(c) }}
                                <code class="bld-muted">{{ c.id }}</code>
                            </template>
                        </p>
                        <p v-if="cantons.length > 1" class="bld-warning">
                            {{ fmt(t.onLine, { cantons: cantons.map(cantonName).join(' / ') }) }}
                        </p>
                        <p v-if="splitMunicipality" class="bld-muted">
                            {{
                                fmt(t.split, {
                                    name: inLang(
                                        getMunicipality(splitMunicipality.municipality)?.name,
                                        dataLang,
                                    ),
                                })
                            }}
                        </p>
                        <p v-for="n in nearby.slice(0, 1)" :key="n.canton.id" class="bld-warning">
                            {{
                                fmt(t.near, {
                                    m: Math.round(n.metres),
                                    other: cantonName(getCanton(n.canton.id)),
                                })
                            }}
                        </p>

                        <h4>{{ t.courts }}</h4>
                        <div class="bld-cards">
                            <article v-for="court in courts" :key="court.id" class="bld-card">
                                <p class="bld-card-type">{{ typeLabel(court) }}</p>
                                <p class="bld-card-name">
                                    {{ formatCourtName(court, dataLang) }}
                                </p>
                                <p v-if="court.address" class="bld-muted">
                                    {{ court.address.street }}, {{ court.address.postalCode }}
                                    {{ court.address.city }}
                                </p>
                                <p class="bld-card-links">
                                    <a v-if="phone(court)" :href="`tel:${phone(court)}`">
                                        {{ formatPhoneNumber(phone(court)!) }}
                                    </a>
                                    <a v-if="email(court)" :href="`mailto:${email(court)}`">
                                        {{ email(court) }}
                                    </a>
                                    <a
                                        v-if="website(court)"
                                        :href="website(court)"
                                        target="_blank"
                                        rel="noopener"
                                    >
                                        {{ t.website }}
                                    </a>
                                </p>
                                <p v-if="hours(court)" class="bld-muted bld-card-hours">
                                    {{ t.hours }}: {{ hours(court) }}
                                </p>
                                <code class="bld-muted">{{ court.id }}</code>
                            </article>
                        </div>

                        <details>
                            <summary>{{ t.legalText }}</summary>
                            <div v-for="c in cantons" :key="c.id">
                                <h4>
                                    <code>{{ c.id }}</code>
                                </h4>
                                <p class="bld-muted">{{ c.territory[dataLang] }}</p>
                            </div>
                            <div v-for="n in nearby" :key="n.canton.id">
                                <h4>
                                    <code>{{ n.canton.id }}</code>
                                </h4>
                                <p class="bld-muted">
                                    {{ getCanton(n.canton.id)?.territory[dataLang] }}
                                </p>
                            </div>
                        </details>

                        <details>
                            <summary>{{ t.code }}</summary>
                            <pre class="bld-code"><code>{{ code }}</code></pre>
                        </details>
                    </template>
                </template>
                <p v-if="candidate" class="bld-muted">
                    {{ fmt(t.source, { register: REGISTERS[candidate.source] }) }}
                </p>
            </template>
        </template>
    </div>
</template>

<style scoped>
.bld-address {
    flex: 1 1 320px;
}
.bld-address input {
    flex: 1;
}
.bld-quiet {
    color: var(--vp-c-text-2);
}
.bld-or {
    margin-left: 6px;
}
.bld-finder .bld-map {
    margin: 12px 0;
}
.bld-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 10px;
    margin-top: 8px;
}
.bld-card {
    border: 1px solid var(--vp-c-divider);
    border-radius: 10px;
    padding: 10px 12px;
    background: var(--vp-c-bg);
    font-size: 14px;
    display: flex;
    flex-direction: column;
    gap: 2px;
}
.bld-card:first-child {
    border-color: var(--vp-c-brand-1);
    box-shadow: 0 0 0 3px var(--vp-c-brand-soft);
}
.bld-card p {
    margin: 0;
    line-height: 1.4;
}
.bld-card-type {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--vp-c-text-2);
}
.bld-card-name {
    font-weight: 600;
}
.bld-card-links {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 12px;
    font-size: 13px;
}
.bld-card-hours {
    font-size: 13px;
}
.bld-card code {
    font-size: 11px;
    align-self: flex-start;
}
.bld-code {
    margin: 8px 0 0;
    padding: 10px 12px;
    border-radius: 8px;
    background: var(--vp-c-bg);
    font-size: 13px;
    overflow-x: auto;
}
</style>
