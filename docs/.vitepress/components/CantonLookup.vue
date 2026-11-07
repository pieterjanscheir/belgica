<script setup lang="ts">
import { computed, ref } from 'vue'
import {
    municipalities,
    getCantonsForMunicipality,
    getArrondissement,
    getJusticeOfThePeace,
    getContact,
} from '../../../src'
import { fmt, inLang, useLocale, useStrings } from '../i18n'
import CantonMap from './CantonMap.vue'

const { dataLang } = useLocale()
const t = useStrings('CantonLookup', {
    root: {
        municipality: 'Municipality or REFNIS code',
        placeholder: 'e.g. Gent, Liège, 44021',
        match: 'Match',
        none: 'No municipality found.',
        split: 'split over {n} cantons',
        cantonId: 'Canton id',
        seat: 'Seat',
        arrondissement: 'Arrondissement',
        justiceOfThePeace: 'Justice of the peace',
        whichPart: 'Which part of {name} belongs to which canton?',
        brussels: 'Brussels-Capital Region',
    },
    nl: {
        municipality: 'Gemeente of REFNIS-code',
        placeholder: 'bv. Gent, Liège, 44021',
        match: 'Resultaat',
        none: 'Geen gemeente gevonden.',
        split: 'verdeeld over {n} kantons',
        cantonId: 'Kanton-id',
        seat: 'Zetel',
        arrondissement: 'Arrondissement',
        justiceOfThePeace: 'Vredegerecht',
        whichPart: 'Welk deel van {name} hoort bij welk kanton?',
        brussels: 'Brussels Hoofdstedelijk Gewest',
    },
    fr: {
        municipality: 'Commune ou code REFNIS',
        placeholder: 'p. ex. Gand, Liège, 44021',
        match: 'Résultat',
        none: 'Aucune commune trouvée.',
        split: 'répartie sur {n} cantons',
        cantonId: 'Id du canton',
        seat: 'Siège',
        arrondissement: 'Arrondissement',
        justiceOfThePeace: 'Justice de paix',
        whichPart: 'Quelle partie de {name} relève de quel canton ?',
        brussels: 'Région de Bruxelles-Capitale',
    },
})

// The provinces carry their own name; only the Brussels-Capital Region is translated
const provinces = computed<Record<string, string>>(() => ({
    '04000': t.value.brussels,
    '10000': 'Antwerpen',
    '20001': 'Vlaams-Brabant',
    '20002': 'Brabant wallon',
    '30000': 'West-Vlaanderen',
    '40000': 'Oost-Vlaanderen',
    '50000': 'Hainaut',
    '60000': 'Liège',
    '70000': 'Limburg',
    '80000': 'Luxembourg',
    '90000': 'Namur',
}))

const query = ref('Gent')
const selected = ref<string | null>(null)

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const matches = computed(() => {
    const q = normalize(query.value.trim())
    if (!q) return []
    return municipalities
        .filter(
            (m) =>
                m.id.startsWith(q) ||
                normalize(m.name.nl).includes(q) ||
                normalize(m.name.fr).includes(q),
        )
        .slice(0, 12)
})

const municipality = computed(() => {
    const id = selected.value ?? matches.value[0]?.id
    return municipalities.find((m) => m.id === id)
})

const cantons = computed(() =>
    municipality.value ? getCantonsForMunicipality(municipality.value.id) : [],
)
const cantonIds = computed(() => cantons.value.map((c) => c.id))

function label(m: { name: { nl: string; fr: string } }) {
    return m.name.nl === m.name.fr ? m.name.nl : `${m.name.nl} / ${m.name.fr}`
}
</script>

<template>
    <div class="bld-panel">
        <div class="bld-controls">
            <label>
                {{ t.municipality }}
                <input v-model="query" :placeholder="t.placeholder" @input="selected = null" />
            </label>
            <label v-if="matches.length > 1">
                {{ t.match }}
                <select v-model="selected">
                    <option v-for="m in matches" :key="m.id" :value="m.id">
                        {{ label(m) }} ({{ m.id }})
                    </option>
                </select>
            </label>
        </div>

        <p v-if="!municipality" class="bld-muted">{{ t.none }}</p>
        <template v-else>
            <p>
                <strong>{{ label(municipality) }}</strong>
                <span class="bld-muted">
                    · REFNIS {{ municipality.id }} · {{ provinces[municipality.province] }}
                </span>
                <span v-if="cantons.length > 1" class="bld-badge">{{
                    fmt(t.split, { n: cantons.length })
                }}</span>
            </p>
            <table>
                <thead>
                    <tr>
                        <th>{{ t.cantonId }}</th>
                        <th>{{ t.seat }}</th>
                        <th>{{ t.arrondissement }}</th>
                        <th>{{ t.justiceOfThePeace }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="c in cantons" :key="c.id">
                        <td>
                            <code>{{ c.id }}</code>
                        </td>
                        <td>
                            {{ c.seat.nl
                            }}<span v-if="c.seat.fr !== c.seat.nl"> / {{ c.seat.fr }}</span>
                        </td>
                        <td>{{ inLang(getArrondissement(c.arrondissement)?.name, dataLang) }}</td>
                        <td>
                            <template v-for="court in [getJusticeOfThePeace(c.id)]" :key="c.id">
                                <template v-if="court">
                                    {{ inLang(court.name, dataLang) }}<br />
                                    <span class="bld-muted">{{ getContact(court, 'email') }}</span>
                                </template>
                            </template>
                        </td>
                    </tr>
                </tbody>
            </table>
            <CantonMap :highlight="cantonIds" :view="cantonIds" height="360px" />
            <details v-if="cantons.length > 1">
                <summary>{{ fmt(t.whichPart, { name: municipality.name[dataLang] }) }}</summary>
                <div v-for="c in cantons" :key="c.id">
                    <h4>
                        <code>{{ c.id }}</code>
                    </h4>
                    <p class="bld-muted">{{ c.territory[dataLang] }}</p>
                </div>
            </details>
        </template>
    </div>
</template>
