import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import CantonLookup from '../components/CantonLookup.vue'
import CourtList from '../components/CourtList.vue'
import CantonMap from '../components/CantonMap.vue'
import CourtFinder from '../components/CourtFinder.vue'
import InterestRates from '../components/InterestRates.vue'
import DataStats from '../components/DataStats.vue'
import HeroMark from '../components/HeroMark.vue'
import './style.css'

export default {
    extends: DefaultTheme,
    // The logo, large, beside the hero on every language's home page
    Layout: () => h(DefaultTheme.Layout, null, { 'home-hero-image': () => h(HeroMark) }),
    enhanceApp({ app }) {
        app.component('CantonLookup', CantonLookup)
        app.component('CantonMap', CantonMap)
        app.component('CourtFinder', CourtFinder)
        app.component('CourtList', CourtList)
        app.component('InterestRates', InterestRates)
        app.component('DataStats', DataStats)
    },
} satisfies Theme
