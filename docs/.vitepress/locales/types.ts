/**
 * Everything the theme shows in words, per language. English (`root`) is the source: the
 * pages under docs/nl, docs/fr, docs/de and the rest mirror the English tree, so each locale's
 * nav and sidebar are the English ones with the locale's prefix and labels.
 */
export interface Strings {
    description: string
    nav: { guide: string; data: string; api: string; releases: string; tryIt?: string }
    sidebar: {
        guide: string
        gettingStarted: string
        rawJson: string
        design: string
        identifiers: string
        schema: string
        dataQuality: string
        contributing: string
        changelog: string
        data: string
        overview: string
        territory: string
        cantonBoundaries: string
        courts: string
        prisons: string
        housesOfJustice: string
        interestRates: string
        publicHolidays: string
        proceduralIndemnity: string
        postalCodes: string
        knownGaps: string
        roadmap: string
        api: string
        // Added after the translations: English until a language has its own
        introduction?: string
        concepts?: string
        commonTasks?: string
        entryPoints?: string
        policeZones?: string
        usingTheData?: string
        project?: string
        courtFinder?: string
    }
    editLink: string
    lastUpdated: string
    prev: string
    next: string
    outline: string
    returnToTop: string
    sidebarMenu: string
    darkModeSwitch: string
    lightModeTitle: string
    darkModeTitle: string
    langMenu: string
    notFound: { title: string; quote: string; linkLabel: string; linkText: string }
    footer: string
    search: {
        button: string
        buttonAria: string
        displayDetails: string
        reset: string
        back: string
        noResults: string
        select: string
        navigate: string
        close: string
    }
}

/** The interactive components that show words: each takes its strings from `useStrings(name, …)` */
export type ComponentName =
    'CantonLookup' | 'CantonMap' | 'CourtFinder' | 'CourtList' | 'DataStats' | 'InterestRates'

/**
 * A language beyond English, Dutch and French: one file per language in this folder, next to its
 * pages under docs/<code>/. English, Dutch and French keep their words in config.ts and in the
 * components themselves.
 */
export interface LocaleFile {
    /** The language's name in itself, for the language menu: 'Deutsch', '中文' */
    label: string
    /** BCP 47 tag for <html lang> and number formatting: 'de-BE', 'zh-CN' */
    lang: string
    /** 'rtl' for Arabic */
    dir?: 'ltr' | 'rtl'
    site: Strings
    /**
     * Every key of the component's English (`root`) strings, translated. The map and the court
     * finder are in English, Dutch and French only so far: a language without their strings
     * shows them in English.
     */
    components: Record<
        Exclude<ComponentName, 'CantonMap' | 'CourtFinder'>,
        Record<string, string>
    > & {
        CantonMap?: Record<string, string>
        CourtFinder?: Record<string, string>
    }
}
