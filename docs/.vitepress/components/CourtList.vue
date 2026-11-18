<script setup lang="ts">
import { computed, ref } from 'vue'
import {
    findCourts,
    arrondissements,
    formatPhoneNumber,
    formatIban,
    getArrondissement,
    getJudicialArea,
    type Court,
    type CourtType,
} from '../../../src'
import { fmt, inLang, useLocale, useStrings } from '../i18n'

// Today's records: the files also hold retired versions
const courts = findCourts({})

const { dataLang } = useLocale()
const t = useStrings('CourtList', {
    root: {
        search: 'Search',
        searchPlaceholder: 'Name, city or id',
        type: 'Type',
        all: 'All',
        arrondissement: 'Arrondissement',
        count: '{n} of {total} courts, divisions and seats',
        name: 'Name, as published',
        address: 'Address',
        contacts: 'Contacts',
        noAddress: 'No single address',
        judicialArea: '(judicial area)',
        fax: 'fax',
        more: 'and {n} more',
        showMore: 'Show more',
        'justice-of-the-peace': 'Justice of the peace',
        'police-court': 'Police court',
        'court-of-first-instance': 'Court of first instance',
        'enterprise-court': 'Enterprise court',
        'labour-court': 'Labour court',
        'court-of-appeal': 'Court of appeal',
        'labour-court-of-appeal': 'Labour court of appeal',
        'court-of-assize': 'Court of assize',
    },
    nl: {
        search: 'Zoeken',
        searchPlaceholder: 'Naam, stad of id',
        type: 'Type',
        all: 'Alle',
        arrondissement: 'Arrondissement',
        count: '{n} van {total} hoven, rechtbanken, afdelingen en zetels',
        name: 'Naam, zoals gepubliceerd',
        address: 'Adres',
        contacts: 'Contactgegevens',
        noAddress: 'Geen eigen adres',
        judicialArea: '(rechtsgebied)',
        fax: 'fax',
        more: 'en nog {n}',
        showMore: 'Meer tonen',
        'justice-of-the-peace': 'Vredegerecht',
        'police-court': 'Politierechtbank',
        'court-of-first-instance': 'Rechtbank van eerste aanleg',
        'enterprise-court': 'Ondernemingsrechtbank',
        'labour-court': 'Arbeidsrechtbank',
        'court-of-appeal': 'Hof van beroep',
        'labour-court-of-appeal': 'Arbeidshof',
        'court-of-assize': 'Hof van assisen',
    },
    fr: {
        search: 'Rechercher',
        searchPlaceholder: 'Nom, ville ou id',
        type: 'Type',
        all: 'Tous',
        arrondissement: 'Arrondissement',
        count: '{n} sur {total} cours, tribunaux, divisions et sièges',
        name: 'Nom, tel que publié',
        address: 'Adresse',
        contacts: 'Coordonnées',
        noAddress: "Pas d'adresse unique",
        judicialArea: '(ressort)',
        fax: 'fax',
        more: 'et {n} de plus',
        showMore: 'Afficher plus',
        'justice-of-the-peace': 'Justice de paix',
        'police-court': 'Tribunal de police',
        'court-of-first-instance': 'Tribunal de première instance',
        'enterprise-court': "Tribunal de l'entreprise",
        'labour-court': 'Tribunal du travail',
        'court-of-appeal': "Cour d'appel",
        'labour-court-of-appeal': 'Cour du travail',
        'court-of-assize': "Cour d'assises",
    },
})

const types: CourtType[] = [
    'justice-of-the-peace',
    'police-court',
    'court-of-first-instance',
    'enterprise-court',
    'labour-court',
    'court-of-appeal',
    'labour-court-of-appeal',
    'court-of-assize',
]

const type = ref<CourtType | ''>('')
const arrondissement = ref('')
const query = ref('')
const limit = ref(50)

const where = (c: Court) =>
    c.arrondissement ?
        inLang(getArrondissement(c.arrondissement)?.name, dataLang.value)
    :   `${inLang(getJudicialArea(c.judicialArea)?.name, dataLang.value)} ${t.value.judicialArea}`

const rows = computed(() => {
    const q = query.value.trim().toLowerCase()
    return courts.filter(
        (c) =>
            (!type.value || c.type === type.value) &&
            (!arrondissement.value || c.arrondissement === arrondissement.value) &&
            (!q ||
                c.id.includes(q) ||
                Object.values(c.name).some((n) => n.toLowerCase().includes(q)) ||
                c.address?.city.toLowerCase().includes(q)),
    )
})
</script>

<template>
    <div class="bld-panel">
        <div class="bld-controls">
            <label>
                {{ t.search }}
                <input v-model="query" :placeholder="t.searchPlaceholder" />
            </label>
            <label>
                {{ t.type }}
                <select v-model="type">
                    <option value="">{{ t.all }}</option>
                    <option v-for="value in types" :key="value" :value="value">
                        {{ t[value] }}
                    </option>
                </select>
            </label>
            <label>
                {{ t.arrondissement }}
                <select v-model="arrondissement">
                    <option value="">{{ t.all }}</option>
                    <option v-for="a in arrondissements" :key="a.id" :value="a.id">
                        {{ a.name[dataLang] }}
                    </option>
                </select>
            </label>
        </div>
        <p class="bld-muted">{{ fmt(t.count, { n: rows.length, total: courts.length }) }}</p>
        <table>
            <thead>
                <tr>
                    <th>{{ t.name }}</th>
                    <th>{{ t.address }}</th>
                    <th>{{ t.contacts }}</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="c in rows.slice(0, limit)" :key="c.id">
                    <td>
                        <template v-for="(n, lang) in c.name" :key="lang">
                            <a :href="c.website[lang]">{{ n }}</a><br />
                        </template>
                        <code>{{ c.id }}</code><br />
                        <span class="bld-muted">{{ where(c) }}</span>
                    </td>
                    <td>
                        <template v-if="c.address">
                            <span v-if="c.address.building">{{ c.address.building }}<br /></span>
                            {{ c.address.street }}<br />
                            {{ c.address.postalCode }} {{ c.address.city }}
                        </template>
                        <span v-else class="bld-muted">{{ t.noAddress }}</span>
                        <div v-if="c.openingHours" class="bld-muted">
                            <code>{{ c.openingHours }}</code>
                        </div>
                    </td>
                    <td>
                        <div v-for="k in c.contacts.slice(0, 6)" :key="k.type + k.value + k.label">
                            <a v-if="k.type === 'email'" :href="'mailto:' + k.value">{{
                                k.value
                            }}</a>
                            <span v-else-if="k.type === 'bank-account'">{{
                                formatIban(k.value)
                            }}</span>
                            <a v-else :href="'tel:' + k.value"
                                >{{ k.type === 'fax' ? t.fax + ' ' : ''
                                }}{{ formatPhoneNumber(k.value) }}</a
                            >
                            <span v-if="k.label || k.note" class="bld-muted">
                                ({{ [k.label, k.note].filter(Boolean).join(': ') }})</span
                            >
                        </div>
                        <div v-if="c.contacts.length > 6" class="bld-muted">
                            {{ fmt(t.more, { n: c.contacts.length - 6 }) }}
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
        <button v-if="rows.length > limit" class="bld-more" @click="limit += 50">
            {{ t.showMore }}
        </button>
    </div>
</template>
