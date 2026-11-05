import { cpSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig, type DefaultTheme, type LocaleConfig } from 'vitepress'
import pkg from '../../package.json'
import { extraLocales } from './locales'
import type { Strings } from './locales/types'

const repo = 'https://github.com/pieterjanscheir/belgica'
// GitHub Pages serves the site from /belgica/; DOCS_BASE overrides it for a custom domain
const base = process.env.DOCS_BASE ?? '/belgica/'

const en: Strings = {
    description: pkg.description,
    nav: { guide: 'Guide', data: 'Data', api: 'API', releases: 'Releases' },
    sidebar: {
        guide: 'Guide',
        gettingStarted: 'Getting started',
        rawJson: 'Without JavaScript',
        design: 'Design decisions',
        identifiers: 'Identifiers',
        schema: 'JSON Schema',
        dataQuality: 'Data quality & freshness',
        contributing: 'Contributing',
        changelog: 'Changelog',
        data: 'Data',
        overview: 'Overview',
        territory: 'Territory & cantons',
        cantonBoundaries: 'Canton boundaries',
        courts: 'Courts',
        prisons: 'Prisons',
        housesOfJustice: 'Houses of justice',
        interestRates: 'Interest rates',
        publicHolidays: 'Public holidays',
        proceduralIndemnity: 'Procedural indemnity',
        postalCodes: 'Postal codes',
        knownGaps: 'Known gaps',
        roadmap: 'Roadmap',
        api: 'API reference',
        introduction: 'Introduction',
        concepts: 'Core concepts',
        commonTasks: 'Common tasks',
        entryPoints: 'Entry points and bundle size',
        policeZones: 'Police zones',
        usingTheData: 'Using the data',
        project: 'Project',
    },
    editLink: 'Edit this page on GitHub',
    lastUpdated: 'Last updated',
    prev: 'Previous page',
    next: 'Next page',
    outline: 'On this page',
    returnToTop: 'Return to top',
    sidebarMenu: 'Menu',
    darkModeSwitch: 'Appearance',
    lightModeTitle: 'Switch to light theme',
    darkModeTitle: 'Switch to dark theme',
    langMenu: 'Change language',
    notFound: {
        title: 'PAGE NOT FOUND',
        quote: "But if you don't change your direction, and if you keep looking, you may end up where you are heading.",
        linkLabel: 'go to home',
        linkText: 'Take me home',
    },
    footer: 'Code under MIT, data under CC BY 4.0. Reference data, not legal advice: check the official sources.',
    search: {
        button: 'Search',
        buttonAria: 'Search',
        displayDetails: 'Display detailed list',
        reset: 'Reset search',
        back: 'Close search',
        noResults: 'No results for',
        select: 'to select',
        navigate: 'to navigate',
        close: 'to close',
    },
}

const nl: Strings = {
    description:
        'Belgische juridische referentiedata: hoven en rechtbanken, gerechtelijke kantons en arrondissementen, gemeenten, en de wettelijke en commerciële rentevoeten.',
    nav: { guide: 'Gids', data: 'Data', api: 'API', releases: 'Releases' },
    sidebar: {
        guide: 'Gids',
        gettingStarted: 'Aan de slag',
        rawJson: 'Zonder JavaScript',
        design: 'Ontwerpkeuzes',
        identifiers: 'Identifiers',
        schema: 'JSON Schema',
        dataQuality: 'Datakwaliteit en actualiteit',
        contributing: 'Bijdragen',
        changelog: 'Changelog',
        data: 'Data',
        overview: 'Overzicht',
        territory: 'Territorium en kantons',
        cantonBoundaries: 'Kantongrenzen',
        courts: 'Hoven en rechtbanken',
        prisons: 'Gevangenissen',
        housesOfJustice: 'Justitiehuizen',
        interestRates: 'Rentevoeten',
        publicHolidays: 'Feestdagen',
        proceduralIndemnity: 'Rechtsplegingsvergoeding',
        postalCodes: 'Postcodes',
        policeZones: 'Politiezones',
        knownGaps: 'Bekende hiaten',
        roadmap: 'Roadmap',
        api: 'API-referentie',
    },
    editLink: 'Bewerk deze pagina op GitHub',
    lastUpdated: 'Laatst bijgewerkt',
    prev: 'Vorige pagina',
    next: 'Volgende pagina',
    outline: 'Op deze pagina',
    returnToTop: 'Terug naar boven',
    sidebarMenu: 'Menu',
    darkModeSwitch: 'Weergave',
    lightModeTitle: 'Naar het lichte thema',
    darkModeTitle: 'Naar het donkere thema',
    langMenu: 'Taal wijzigen',
    notFound: {
        title: 'PAGINA NIET GEVONDEN',
        quote: 'Deze pagina bestaat niet, of niet in deze taal.',
        linkLabel: 'naar de startpagina',
        linkText: 'Naar de startpagina',
    },
    footer: 'Code onder MIT, data onder CC BY 4.0. Referentiedata, geen juridisch advies: controleer de officiële bronnen.',
    search: {
        button: 'Zoeken',
        buttonAria: 'Zoeken',
        displayDetails: 'Gedetailleerde lijst tonen',
        reset: 'Zoekopdracht wissen',
        back: 'Zoeken sluiten',
        noResults: 'Geen resultaten voor',
        select: 'om te kiezen',
        navigate: 'om te navigeren',
        close: 'om te sluiten',
    },
}

const fr: Strings = {
    description:
        "Données juridiques belges de référence : cours et tribunaux, cantons et arrondissements judiciaires, communes, et les taux d'intérêt légal et commercial.",
    nav: { guide: 'Guide', data: 'Données', api: 'API', releases: 'Versions' },
    sidebar: {
        guide: 'Guide',
        gettingStarted: 'Premiers pas',
        rawJson: 'Sans JavaScript',
        design: 'Choix de conception',
        identifiers: 'Identifiants',
        schema: 'JSON Schema',
        dataQuality: 'Qualité et fraîcheur des données',
        contributing: 'Contribuer',
        changelog: 'Changelog',
        data: 'Données',
        overview: 'Aperçu',
        territory: 'Territoire et cantons',
        cantonBoundaries: 'Limites des cantons',
        courts: 'Cours et tribunaux',
        prisons: 'Prisons',
        housesOfJustice: 'Maisons de justice',
        interestRates: "Taux d'intérêt",
        publicHolidays: 'Jours fériés',
        proceduralIndemnity: 'Indemnité de procédure',
        postalCodes: 'Codes postaux',
        policeZones: 'Zones de police',
        knownGaps: 'Lacunes connues',
        roadmap: 'Feuille de route',
        api: "Référence de l'API",
    },
    editLink: 'Modifier cette page sur GitHub',
    lastUpdated: 'Dernière mise à jour',
    prev: 'Page précédente',
    next: 'Page suivante',
    outline: 'Sur cette page',
    returnToTop: 'Retour en haut',
    sidebarMenu: 'Menu',
    darkModeSwitch: 'Apparence',
    lightModeTitle: 'Passer au thème clair',
    darkModeTitle: 'Passer au thème sombre',
    langMenu: 'Changer de langue',
    notFound: {
        title: 'PAGE INTROUVABLE',
        quote: "Cette page n'existe pas, ou pas dans cette langue.",
        linkLabel: "aller à l'accueil",
        linkText: "Retour à l'accueil",
    },
    footer: 'Code sous licence MIT, données sous CC BY 4.0. Données de référence, pas un avis juridique : vérifiez les sources officielles.',
    search: {
        button: 'Rechercher',
        buttonAria: 'Rechercher',
        displayDetails: 'Afficher la liste détaillée',
        reset: 'Effacer la recherche',
        back: 'Fermer la recherche',
        noResults: 'Aucun résultat pour',
        select: 'pour sélectionner',
        navigate: 'pour naviguer',
        close: 'pour fermer',
    },
}

function themeConfig(prefix: string, t: Strings): DefaultTheme.Config {
    // Labels a language doesn't have yet are English
    const s = { ...en.sidebar, ...t.sidebar }
    return {
        nav: [
            // The introduction is in English only; the other languages start at getting started
            { text: t.nav.guide, link: prefix ? `${prefix}/guide/getting-started` : '/guide/' },
            { text: t.nav.data, link: `${prefix}/data/` },
            { text: t.nav.api, link: `${prefix}/api` },
            // The Next.js site in site/, deployed on Vercel
            { text: 'Explorer', link: 'https://belgica.scheir.eu/' },
            {
                text: `v${pkg.version}`,
                items: [
                    { text: 'npm', link: 'https://www.npmjs.com/package/belgica' },
                    { text: 'PyPI', link: 'https://pypi.org/project/belgica/' },
                    { text: t.nav.releases, link: `${repo}/tags` },
                ],
            },
        ],
        // A link without `prefix` is a page in English only, for every language, for now
        sidebar: [
            {
                text: s.guide,
                items: [
                    { text: s.introduction, link: '/guide/' },
                    { text: s.gettingStarted, link: `${prefix}/guide/getting-started` },
                    { text: s.concepts, link: '/guide/concepts' },
                    { text: s.commonTasks, link: '/guide/common-tasks' },
                ],
            },
            {
                text: s.usingTheData,
                items: [
                    { text: s.entryPoints, link: '/guide/entry-points' },
                    { text: 'Python', link: '/guide/python' },
                    { text: s.rawJson, link: `${prefix}/guide/raw-json` },
                    { text: s.schema, link: `${prefix}/guide/schema` },
                ],
            },
            {
                text: s.data,
                items: [
                    { text: s.overview, link: `${prefix}/data/` },
                    { text: s.territory, link: `${prefix}/data/territory` },
                    { text: s.cantonBoundaries, link: `${prefix}/data/canton-boundaries` },
                    { text: s.courts, link: `${prefix}/data/courts` },
                    { text: s.prisons, link: `${prefix}/data/prisons` },
                    { text: s.housesOfJustice, link: `${prefix}/data/houses-of-justice` },
                    { text: s.postalCodes, link: `${prefix}/data/postal-codes` },
                    // In English, Dutch and French only so far
                    {
                        text: s.policeZones,
                        link: `${prefix === '/nl' || prefix === '/fr' ? prefix : ''}/data/police-zones`,
                    },
                    { text: s.interestRates, link: `${prefix}/data/interest-rates` },
                    { text: s.publicHolidays, link: '/data/public-holidays' },
                    // In English only so far
                    { text: s.proceduralIndemnity, link: '/data/procedural-indemnities' },
                    { text: s.knownGaps, link: `${prefix}/data/known-gaps` },
                    { text: s.roadmap, link: `${prefix}/data/roadmap` },
                ],
            },
            { text: s.api, link: `${prefix}/api` },
            {
                text: s.project,
                items: [
                    { text: s.identifiers, link: `${prefix}/guide/identifiers` },
                    { text: s.design, link: `${prefix}/guide/design` },
                    { text: s.dataQuality, link: `${prefix}/guide/data-quality` },
                    { text: s.contributing, link: `${prefix}/guide/contributing` },
                    { text: s.changelog, link: `${prefix}/guide/changelog` },
                ],
            },
        ],
        editLink: {
            pattern: `${repo}/edit/main/docs/:path`,
            text: t.editLink,
        },
        lastUpdated: { text: t.lastUpdated },
        docFooter: { prev: t.prev, next: t.next },
        outline: { level: [2, 3], label: t.outline },
        returnToTopLabel: t.returnToTop,
        sidebarMenuLabel: t.sidebarMenu,
        darkModeSwitchLabel: t.darkModeSwitch,
        lightModeSwitchTitle: t.lightModeTitle,
        darkModeSwitchTitle: t.darkModeTitle,
        langMenuLabel: t.langMenu,
        notFound: t.notFound,
        footer: { message: t.footer, copyright: '© Pieter-Jan Scheir' },
    }
}

function searchTranslations(t: Strings) {
    return {
        button: { buttonText: t.search.button, buttonAriaLabel: t.search.buttonAria },
        modal: {
            displayDetails: t.search.displayDetails,
            resetButtonTitle: t.search.reset,
            backButtonTitle: t.search.back,
            noResultsText: t.search.noResults,
            footer: {
                selectText: t.search.select,
                selectKeyAriaLabel: 'enter',
                navigateText: t.search.navigate,
                navigateUpKeyAriaLabel: 'up arrow',
                navigateDownKeyAriaLabel: 'down arrow',
                closeText: t.search.close,
                closeKeyAriaLabel: 'escape',
            },
        },
    }
}

const locales: LocaleConfig<DefaultTheme.Config> = {
    root: {
        label: 'English',
        lang: 'en',
        description: en.description,
        themeConfig: themeConfig('', en),
    },
    nl: {
        label: 'Nederlands',
        lang: 'nl-BE',
        description: nl.description,
        themeConfig: themeConfig('/nl', nl),
    },
    fr: {
        label: 'Français',
        lang: 'fr-BE',
        description: fr.description,
        themeConfig: themeConfig('/fr', fr),
    },
    ...Object.fromEntries(
        Object.entries(extraLocales).map(([code, l]) => [
            code,
            {
                label: l.label,
                lang: l.lang,
                dir: l.dir,
                description: l.site.description,
                themeConfig: themeConfig(`/${code}`, l.site),
            },
        ]),
    ),
}

export default defineConfig({
    title: 'belgica',
    description: en.description,
    lang: 'en',
    base,
    cleanUrls: true,
    lastUpdated: true,
    head: [['link', { rel: 'icon', href: `${base}favicon.svg` }]],
    locales,
    // Shared by every locale; the per-locale nav, sidebar and labels are in `locales`
    themeConfig: {
        logo: '/favicon.svg',
        socialLinks: [
            { icon: 'github', link: repo },
            { icon: 'npm', link: 'https://www.npmjs.com/package/belgica' },
        ],
        search: {
            provider: 'local',
            options: {
                locales: {
                    root: { translations: searchTranslations(en) },
                    nl: { translations: searchTranslations(nl) },
                    fr: { translations: searchTranslations(fr) },
                    ...Object.fromEntries(
                        Object.entries(extraLocales).map(([code, l]) => [
                            code,
                            { translations: searchTranslations(l.site) },
                        ]),
                    ),
                },
            },
        },
    },
    // Serve the JSON Schemas at the URLs in their $id, and the data package next to them
    buildEnd({ outDir }) {
        cpSync(join(__dirname, '../../schema'), join(outDir, 'schema'), { recursive: true })
        cpSync(join(__dirname, '../../datapackage.json'), join(outDir, 'datapackage.json'))
    },
})
