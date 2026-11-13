/**
 * The area of each division (afdeling, division) of a court, as the royal decrees under art. 186
 * of the Judicial Code set it (#58).
 *
 * The starting point is the royal decree of 14 March 2014 on the division of the labour courts
 * of appeal, the courts of first instance, the labour courts, the enterprise courts and the
 * police courts into divisions. Many of its articles have since been repealed and their
 * content moved into each court's own case-allocation decree (zaakverdelingsreglement), and
 * the canton reforms of 2017 and the municipal mergers of 2025 changed the canton names in
 * both. Each entry below is the text in force, consolidated by hand from the publications in
 * the Belgian Official Journal that `decrees` lists, read on etaamb (a copy of the Official
 * Journal) on the date in `DIVISION_AREAS_CHECKED`; Justel has no consolidated text of most of
 * them, and refuses connections from GitHub's runners (#52).
 *
 * Areas are given as the decree gives them: whole cantons (by id), whole provinces (by REFNIS
 * code), or municipalities by name, with the municipalities a canton gives to another division
 * in `except` and those added from another canton in `plus`. The build turns each into the
 * cantons that lie wholly in the division (`cantons`) and the municipalities of a canton the
 * division shares with another one (`municipalities`), and refuses an area that names an
 * unknown canton or municipality. test/data.test.ts checks that a court's divisions cover its
 * area once.
 *
 * The police courts aren't here yet: their areas are lists of municipalities, and the police
 * court of Antwerp has one area for civil and one for criminal cases.
 */

export const DIVISION_AREAS_CHECKED = '2026-11-13'

/** A publication in the Belgian Official Journal: its numac and its promulgation date */
export interface Decree {
    numac: string
    /** The day the decree was signed, which its ELI uses: 'YYYY-MM-DD' */
    date: string
}

export type DivisionArea =
    | {
          /** Canton ids */
          cantons: string[]
          /** Municipalities (by name) of those cantons that belong to another division */
          except?: string[]
          /** Municipalities (by name) of other cantons that belong to this division */
          plus?: string[]
      }
    | {
          /** Provinces, by REFNIS code */
          provinces: string[]
      }
    | {
          /** Municipalities by name, as the decree lists them */
          municipalities: string[]
      }

export interface CourtDivisions {
    /** The decree that sets the areas, then every later one that changed them, oldest first */
    decrees: Decree[]
    /** The article of the first decree that sets the areas */
    article: number
    /** Per division id: its area */
    divisions: Record<string, DivisionArea>
}

/** The ELI of a decree's publication in the Belgian Official Journal */
export function decreeEli({ numac, date }: Decree): string {
    return `https://www.ejustice.just.fgov.be/eli/besluit/${date.replaceAll('-', '/')}/${numac}/staatsblad`
}

const decree = (numac: string, date: string): Decree => ({ numac, date })

// The decree of 14 March 2014, and the decrees that changed it or a case-allocation decree
const KB_2014 = decree('2014009088', '2014-03-14')
/** Canton reform (wet 25 december 2017), first round */
const KB_2018_04_15 = decree('2018011654', '2018-04-15')
/** Canton reform, second round */
const KB_2018_05_17 = decree('2018012032', '2018-05-17')
/** Canton reform, third round */
const KB_2018_07_22 = decree('2018040538', '2018-07-22')
/** Neerpelt and Overpelt merge into Pelt (1 January 2019) */
const KB_2018_12_21 = decree('2018015470', '2018-12-21')
/** Fontaine-l'Evêque leaves the cantons of Charleroi (canton reform) */
const KB_2019_01_20 = decree('2019010269', '2019-01-20')
/** Canton reform, last round */
const KB_2019_05_23 = decree('2019030426', '2019-05-23')
/** The municipal mergers of 1 January 2025 */
const KB_2024_12_20 = decree('2024011888', '2024-12-20')

const cantons = (...ids: string[]): DivisionArea => ({ cantons: ids })
const provinces = (...codes: string[]): DivisionArea => ({ provinces: codes })

export const DIVISION_AREAS: Record<string, CourtDivisions> = {
    // Labour courts of appeal: a division per province

    // KB 14 March 2014, art. 1
    'labour-court-of-appeal-antwerpen': {
        decrees: [KB_2014],
        article: 1,
        divisions: {
            'labour-court-of-appeal-antwerpen-antwerpen': provinces('10000'),
            'labour-court-of-appeal-antwerpen-hasselt': provinces('70000'),
        },
    },
    // Art. 2 of the KB of 2014 was repealed for the court's case-allocation decree, art. 1
    'labour-court-of-appeal-gent': {
        decrees: [decree('2024007883', '2024-07-25')],
        article: 1,
        divisions: {
            'labour-court-of-appeal-gent-gent': provinces('40000'),
            'labour-court-of-appeal-gent-brugge': provinces('30000'),
        },
    },
    // Art. 3 of the KB of 2014 was repealed for the court's case-allocation decree, art. 1. The
    // province of Liège holds the German-speaking area too.
    'labour-court-of-appeal-liege': {
        decrees: [decree('2025000522', '2025-01-30')],
        article: 1,
        divisions: {
            'labour-court-of-appeal-liege-liege': provinces('60000'),
            'labour-court-of-appeal-liege-neufchateau': provinces('80000'),
            'labour-court-of-appeal-liege-namur': provinces('90000'),
        },
    },

    // Courts of first instance

    // Case-allocation decree of 16 February 2016, art. 1, replaced on 16 December 2020. That
    // text gives one area for civil cases (here) and one for criminal cases, where the
    // municipalities Hulshout and Herenthout go to Turnhout instead of Mechelen.
    'court-of-first-instance-antwerpen': {
        decrees: [decree('2016009074', '2016-02-16'), decree('2020016202', '2020-12-16')],
        article: 1,
        divisions: {
            'court-of-first-instance-antwerpen-antwerpen': cantons(
                'antwerpen-1',
                'antwerpen-2',
                'antwerpen-3',
                'antwerpen-4',
                'antwerpen-5',
                'antwerpen-6',
                'antwerpen-7',
                'merksem',
                'deurne',
                'boom',
                'brasschaat',
                'kapellen',
                'kontich',
                'zandhoven',
            ),
            'court-of-first-instance-antwerpen-mechelen': cantons(
                'heist-op-den-berg',
                'lier',
                'mechelen',
                'willebroek',
            ),
            'court-of-first-instance-antwerpen-turnhout': cantons(
                'mol-geel-1',
                'mol-geel-2',
                'turnhout-1',
                'turnhout-2',
                'westerlo',
            ),
        },
    },
    // KB 14 March 2014, art. 5
    'court-of-first-instance-limburg': {
        decrees: [KB_2014, KB_2018_04_15, KB_2018_12_21, KB_2024_12_20],
        article: 5,
        divisions: {
            'court-of-first-instance-limburg-hasselt': cantons(
                'beringen',
                'hasselt-1',
                'hasselt-2',
                'houthalen-helchteren',
                'pelt',
                'sint-truiden',
            ),
            'court-of-first-instance-limburg-tongeren-borgloon': cantons(
                'bilzen-hoeselt',
                'bree',
                'genk',
                'maasmechelen',
                'tongeren-borgloon',
            ),
        },
    },
    // Case-allocation decree of 16 February 2016, art. 1
    'court-of-first-instance-oost-vlaanderen': {
        decrees: [decree('2016009073', '2016-02-16'), KB_2018_05_17, KB_2024_12_20],
        article: 1,
        divisions: {
            'court-of-first-instance-oost-vlaanderen-gent': cantons(
                'deinze',
                'eeklo',
                'gent-1',
                'gent-2',
                'gent-3',
                'gent-4',
                'gent-5',
                'merelbeke-melle',
                'zelzate',
            ),
            'court-of-first-instance-oost-vlaanderen-dendermonde': cantons(
                'aalst-1',
                'aalst-2',
                'beveren-kruibeke-zwijndrecht',
                'dendermonde',
                'hamme',
                'lokeren',
                'ninove',
                'sint-niklaas',
                'wetteren',
            ),
            'court-of-first-instance-oost-vlaanderen-oudenaarde': cantons(
                'geraardsbergen',
                'oudenaarde',
                'herzele',
            ),
        },
    },
    // Case-allocation decree of 14 January 2018, art. 1
    'court-of-first-instance-west-vlaanderen': {
        decrees: [decree('2017040887', '2018-01-14'), KB_2018_05_17, KB_2018_07_22],
        article: 1,
        divisions: {
            'court-of-first-instance-west-vlaanderen-brugge': cantons(
                'brugge-1',
                'brugge-2',
                'brugge-3',
                'brugge-4',
                'oostende-1',
                'oostende-2',
                'tielt',
                'torhout',
            ),
            'court-of-first-instance-west-vlaanderen-ieper': cantons('ieper', 'poperinge'),
            'court-of-first-instance-west-vlaanderen-kortrijk': cantons(
                'izegem',
                'kortrijk-1',
                'kortrijk-2',
                'menen',
                'roeselare',
                'waregem',
            ),
            'court-of-first-instance-west-vlaanderen-veurne': cantons('veurne'),
        },
    },
    // Case-allocation decree of 16 February 2016, art. 1, whose areas the decree of 9 April
    // 2024 replaced with lists of municipalities
    'court-of-first-instance-liege': {
        decrees: [decree('2016009072', '2016-02-16'), decree('2024002657', '2024-04-09')],
        article: 1,
        divisions: {
            'court-of-first-instance-liege-liege': {
                municipalities: [
                    'Luik',
                    'Seraing',
                    'Wezet',
                    'Borgworm',
                    'Ans',
                    'Awans',
                    'Aywaille',
                    'Bitsingen',
                    'Berloz',
                    'Beyne-Heusay',
                    'Blégny',
                    'Chaudfontaine',
                    'Crisnée',
                    'Dalhem',
                    'Donceel',
                    'Esneux',
                    'Faimes',
                    'Fexhe-le-Haut-Clocher',
                    'Flémalle',
                    'Fléron',
                    'Geer',
                    'Grâce-Hollogne',
                    'Herstal',
                    'Juprelle',
                    'Oerle',
                    'Oupeye',
                    'Remicourt',
                    'Saint-Nicolas',
                    'Soumagne',
                    'Sprimont',
                    'Trooz',
                ],
            },
            'court-of-first-instance-liege-huy': {
                municipalities: [
                    'Hannuit',
                    'Hoei',
                    'Amay',
                    'Anthisnes',
                    'Braives',
                    'Burdinne',
                    'Clavier',
                    'Comblain-au-Pont',
                    'Engis',
                    'Ferrières',
                    'Hamoir',
                    'Héron',
                    'Lijsem',
                    'Marchin',
                    'Modave',
                    'Nandrin',
                    'Neupré',
                    'Ouffet',
                    'Saint-Georges-sur-Meuse',
                    'Tinlot',
                    'Villers-le-Bouillet',
                    'Verlaine',
                    'Wanze',
                    'Wasseiges',
                ],
            },
            'court-of-first-instance-liege-verviers': {
                municipalities: [
                    'Herve',
                    'Limburg',
                    'Malmedy',
                    'Stavelot',
                    'Verviers',
                    'Aubel',
                    'Baelen',
                    'Dison',
                    'Jalhay',
                    'Lierneux',
                    'Olne',
                    'Pepinster',
                    'Plombières',
                    'Spa',
                    'Stoumont',
                    'Theux',
                    'Thimister-Clermont',
                    'Trois-Ponts',
                    'Weismes',
                    'Welkenraedt',
                ],
            },
        },
    },
    // Case-allocation decree of 2 November 2017, art. 1
    'court-of-first-instance-luxembourg': {
        decrees: [decree('2017031386', '2017-11-02'), KB_2018_04_15, KB_2018_07_22],
        article: 1,
        divisions: {
            'court-of-first-instance-luxembourg-arlon': cantons('arlon', 'virton'),
            'court-of-first-instance-luxembourg-marche-en-famenne': cantons('marche-en-famenne'),
            'court-of-first-instance-luxembourg-neufchateau': cantons('bastogne', 'neufchateau'),
        },
    },
    // Case-allocation decree of 16 February 2016, art. 1
    'court-of-first-instance-namur': {
        decrees: [decree('2016009071', '2016-02-16'), KB_2018_04_15],
        article: 1,
        divisions: {
            'court-of-first-instance-namur-namur': cantons(
                'andenne',
                'fosses-la-ville',
                'gembloux',
                'namur-1',
                'namur-2',
            ),
            'court-of-first-instance-namur-dinant': cantons('dinant', 'ciney', 'philippeville'),
        },
    },
    // Case-allocation decree of 13 October 2019, art. 1
    'court-of-first-instance-hainaut': {
        decrees: [decree('2019042077', '2019-10-13')],
        article: 1,
        divisions: {
            'court-of-first-instance-hainaut-charleroi': cantons(
                'chimay',
                'binche',
                'charleroi-1',
                'charleroi-2',
                'charleroi-3',
                'charleroi-4',
                'chatelet',
                'seneffe',
                'thuin',
            ),
            'court-of-first-instance-hainaut-mons': cantons(
                'boussu-colfontaine-1',
                'boussu-colfontaine-2',
                'la-louviere',
                'mons-1',
                'mons-2',
                'soignies',
            ),
            'court-of-first-instance-hainaut-tournai': cantons(
                'ath',
                'mouscron',
                'leuze-en-hainaut',
                'tournai-1',
                'tournai-2',
            ),
        },
    },

    // Labour courts

    // Case-allocation decree of 29 February 2024, art. 1
    'labour-court-antwerpen': {
        decrees: [decree('2024002082', '2024-02-29'), KB_2024_12_20],
        article: 1,
        divisions: {
            'labour-court-antwerpen-antwerpen': cantons(
                'antwerpen-1',
                'antwerpen-2',
                'antwerpen-3',
                'antwerpen-4',
                'antwerpen-5',
                'antwerpen-6',
                'antwerpen-7',
                'boom',
                'deurne',
                'brasschaat',
                'kapellen',
                'merksem',
                'kontich',
                'zandhoven',
            ),
            'labour-court-antwerpen-mechelen': cantons(
                'heist-op-den-berg',
                'lier',
                'mechelen',
                'willebroek',
            ),
            'labour-court-antwerpen-turnhout': cantons(
                'mol-geel-1',
                'mol-geel-2',
                'turnhout-1',
                'turnhout-2',
                'westerlo',
            ),
            'labour-court-antwerpen-hasselt': cantons(
                'beringen',
                'hasselt-1',
                'hasselt-2',
                'houthalen-helchteren',
                'pelt',
                'sint-truiden',
            ),
            'labour-court-antwerpen-tongeren-borgloon': cantons(
                'bilzen-hoeselt',
                'bree',
                'genk',
                'maasmechelen',
                'tongeren-borgloon',
            ),
        },
    },
    // Case-allocation decree of 25 July 2024, art. 1, § 2
    'labour-court-gent': {
        decrees: [decree('2024007884', '2024-07-25'), KB_2024_12_20],
        article: 1,
        divisions: {
            'labour-court-gent-aalst': cantons('aalst-1', 'aalst-2', 'ninove'),
            'labour-court-gent-dendermonde': cantons('dendermonde', 'hamme', 'wetteren'),
            'labour-court-gent-gent': cantons(
                'deinze',
                'eeklo',
                'gent-1',
                'gent-2',
                'gent-3',
                'gent-4',
                'gent-5',
                'merelbeke-melle',
                'zelzate',
            ),
            'labour-court-gent-oudenaarde': cantons('oudenaarde', 'herzele', 'geraardsbergen'),
            'labour-court-gent-sint-niklaas': cantons(
                'sint-niklaas',
                'beveren-kruibeke-zwijndrecht',
                'lokeren',
            ),
            'labour-court-gent-brugge': cantons(
                'brugge-1',
                'brugge-2',
                'brugge-3',
                'brugge-4',
                'oostende-1',
                'oostende-2',
                'tielt',
                'torhout',
            ),
            'labour-court-gent-ieper': cantons('ieper', 'poperinge'),
            'labour-court-gent-kortrijk': cantons('kortrijk-1', 'kortrijk-2', 'menen', 'waregem'),
            'labour-court-gent-roeselare': cantons('izegem', 'roeselare'),
            'labour-court-gent-veurne': cantons('veurne'),
        },
    },
    // KB 14 March 2014, art. 15
    'labour-court-liege': {
        decrees: [KB_2014, KB_2018_04_15, KB_2018_05_17, KB_2018_07_22, KB_2019_05_23],
        article: 15,
        divisions: {
            'labour-court-liege-liege': cantons(
                'waremme',
                'fleron',
                'grace-hollogne',
                'herstal',
                'liege-1',
                'liege-2',
                'liege-3',
                'liege-4',
                'seraing',
                'sprimont',
                'vise',
            ),
            'labour-court-liege-huy': cantons('huy-1', 'huy-2'),
            'labour-court-liege-verviers': cantons('limbourg', 'spa', 'verviers-1', 'verviers-2'),
            'labour-court-liege-arlon': cantons('arlon', 'virton'),
            'labour-court-liege-marche-en-famenne': cantons('marche-en-famenne'),
            'labour-court-liege-neufchateau': cantons('bastogne', 'neufchateau'),
            'labour-court-liege-namur': cantons(
                'andenne',
                'fosses-la-ville',
                'gembloux',
                'namur-1',
                'namur-2',
            ),
            'labour-court-liege-dinant': cantons('dinant', 'ciney', 'philippeville'),
        },
    },
    // KB 14 March 2014, art. 16, § 1. Its § 2 sends the collective debt settlements of the
    // area of Binche to Charleroi, of La Louvière to Mons and of Mouscron to Tournai.
    'labour-court-hainaut': {
        decrees: [KB_2014, KB_2018_04_15, KB_2019_01_20, KB_2019_05_23],
        article: 16,
        divisions: {
            'labour-court-hainaut-charleroi': {
                cantons: [
                    'chimay',
                    'charleroi-1',
                    'charleroi-2',
                    'charleroi-3',
                    'charleroi-4',
                    'chatelet',
                    'thuin',
                ],
                except: ['Erquelinnes', 'Merbes-le-Château'],
                plus: ['Pont-à-Celles'],
            },
            'labour-court-hainaut-binche': {
                cantons: ['binche', 'seneffe'],
                except: ['Pont-à-Celles'],
                plus: ['Erquelinnes', 'Merbes-le-Château'],
            },
            'labour-court-hainaut-mons': cantons(
                'boussu-colfontaine-1',
                'boussu-colfontaine-2',
                'mons-1',
                'mons-2',
            ),
            'labour-court-hainaut-la-louviere': cantons('la-louviere', 'soignies'),
            'labour-court-hainaut-tournai': cantons(
                'ath',
                'leuze-en-hainaut',
                'tournai-1',
                'tournai-2',
            ),
            'labour-court-hainaut-mouscron': cantons('mouscron'),
        },
    },

    // Enterprise courts

    // Case-allocation decree of 11 March 2024, art. 1
    'enterprise-court-antwerpen': {
        decrees: [decree('2024002083', '2024-03-11'), KB_2024_12_20],
        article: 1,
        divisions: {
            'enterprise-court-antwerpen-antwerpen': cantons(
                'antwerpen-1',
                'antwerpen-2',
                'antwerpen-3',
                'antwerpen-4',
                'antwerpen-5',
                'antwerpen-6',
                'antwerpen-7',
                'boom',
                'deurne',
                'brasschaat',
                'kapellen',
                'merksem',
                'kontich',
                'zandhoven',
            ),
            'enterprise-court-antwerpen-mechelen': cantons(
                'heist-op-den-berg',
                'lier',
                'mechelen',
                'willebroek',
            ),
            'enterprise-court-antwerpen-turnhout': cantons(
                'mol-geel-1',
                'mol-geel-2',
                'turnhout-1',
                'turnhout-2',
                'westerlo',
            ),
            'enterprise-court-antwerpen-hasselt': cantons(
                'beringen',
                'hasselt-1',
                'hasselt-2',
                'houthalen-helchteren',
                'pelt',
                'sint-truiden',
            ),
            'enterprise-court-antwerpen-tongeren-borgloon': cantons(
                'bilzen-hoeselt',
                'bree',
                'genk',
                'maasmechelen',
                'tongeren-borgloon',
            ),
        },
    },
    // KB 14 March 2014, art. 18
    'enterprise-court-gent': {
        decrees: [KB_2014, KB_2018_05_17, KB_2018_07_22, KB_2024_12_20],
        article: 18,
        divisions: {
            'enterprise-court-gent-gent': cantons(
                'deinze',
                'eeklo',
                'gent-1',
                'gent-2',
                'gent-3',
                'gent-4',
                'gent-5',
                'merelbeke-melle',
                'zelzate',
            ),
            'enterprise-court-gent-dendermonde': cantons(
                'aalst-1',
                'aalst-2',
                'beveren-kruibeke-zwijndrecht',
                'dendermonde',
                'hamme',
                'lokeren',
                'ninove',
                'sint-niklaas',
                'wetteren',
            ),
            'enterprise-court-gent-oudenaarde': cantons('geraardsbergen', 'oudenaarde', 'herzele'),
            'enterprise-court-gent-brugge': cantons(
                'brugge-1',
                'brugge-2',
                'brugge-3',
                'brugge-4',
                'tielt',
            ),
            'enterprise-court-gent-oostende': cantons('oostende-1', 'oostende-2', 'torhout'),
            'enterprise-court-gent-ieper': cantons('ieper', 'poperinge'),
            'enterprise-court-gent-kortrijk': cantons(
                'izegem',
                'kortrijk-1',
                'kortrijk-2',
                'menen',
                'roeselare',
                'waregem',
            ),
            'enterprise-court-gent-veurne': cantons('veurne'),
        },
    },
    // Case-allocation decree of 18 March 2018, art. 1
    'enterprise-court-liege': {
        decrees: [
            decree('2018011311', '2018-03-18'),
            KB_2018_04_15,
            KB_2018_05_17,
            KB_2018_07_22,
            KB_2019_05_23,
        ],
        article: 1,
        divisions: {
            'enterprise-court-liege-liege': cantons(
                'fleron',
                'grace-hollogne',
                'herstal',
                'liege-1',
                'liege-2',
                'liege-3',
                'liege-4',
                'seraing',
                'sprimont',
                'vise',
                'waremme',
            ),
            'enterprise-court-liege-huy': cantons('huy-1', 'huy-2'),
            'enterprise-court-liege-verviers': cantons(
                'limbourg',
                'spa',
                'verviers-1',
                'verviers-2',
            ),
            'enterprise-court-liege-arlon': cantons('arlon', 'virton'),
            'enterprise-court-liege-marche-en-famenne': cantons('marche-en-famenne'),
            'enterprise-court-liege-neufchateau': cantons('bastogne', 'neufchateau'),
            'enterprise-court-liege-namur': cantons(
                'andenne',
                'fosses-la-ville',
                'gembloux',
                'namur-1',
                'namur-2',
            ),
            'enterprise-court-liege-dinant': cantons('dinant', 'ciney', 'philippeville'),
        },
    },
    // KB 14 March 2014, art. 20
    'enterprise-court-hainaut': {
        decrees: [KB_2014, KB_2018_04_15, KB_2019_01_20, KB_2019_05_23],
        article: 20,
        divisions: {
            'enterprise-court-hainaut-charleroi': cantons(
                'chimay',
                'binche',
                'charleroi-1',
                'charleroi-2',
                'charleroi-3',
                'charleroi-4',
                'chatelet',
                'seneffe',
                'thuin',
            ),
            'enterprise-court-hainaut-mons': cantons(
                'mons-1',
                'mons-2',
                'boussu-colfontaine-1',
                'boussu-colfontaine-2',
                'la-louviere',
                'soignies',
            ),
            'enterprise-court-hainaut-tournai': cantons(
                'ath',
                'mouscron',
                'leuze-en-hainaut',
                'tournai-1',
                'tournai-2',
            ),
        },
    },
}

/** The pieces of the data the areas resolve against */
export interface Territory {
    cantons: { id: string; arrondissement: string; municipalities: { municipality: string }[] }[]
    municipalities: {
        id: string
        name: Partial<Record<'nl' | 'fr' | 'de', string>>
        province: string
    }[]
}

/** A municipality's name as the resolver compares it: no accents, case or punctuation */
const fold = (name: string) =>
    name
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .toLowerCase()
        .replace(/[^a-z]+/g, ' ')
        .trim()

export interface ResolvedArea {
    /** The cantons that lie wholly in the division */
    cantons: string[]
    /** The municipalities of a canton the division shares with another division, by REFNIS code */
    municipalities: string[]
    /** The arrondissements its area lies in */
    arrondissements: string[]
}

/** A municipality in a canton: a city split over cantons is one pair per canton */
interface Pair {
    canton: string
    municipality: string
}

/**
 * The cantons and municipalities of a court's divisions. A municipality name resolves within
 * the court's area, by its Dutch, French or German name. An unknown canton, an unknown or
 * ambiguous name, a division that covers nothing, and a city split between divisions within a
 * canton are problems, for a person to look at.
 */
export function resolveDivisionAreas(
    court: CourtDivisions,
    courtCantons: readonly string[],
    territory: Territory,
): { areas: Map<string, ResolvedArea>; problems: string[] } {
    const problems: string[] = []
    const cantonById = new Map(territory.cantons.map((c) => [c.id, c]))
    const inCourt = courtCantons.flatMap((id) => cantonById.get(id) ?? [])
    const courtPairs: Pair[] = inCourt.flatMap((c) =>
        c.municipalities.map((m) => ({ canton: c.id, municipality: m.municipality })),
    )
    const courtMunicipalities = new Set(courtPairs.map((p) => p.municipality))
    const byName = new Map<string, Set<string>>()
    for (const m of territory.municipalities) {
        if (!courtMunicipalities.has(m.id)) continue
        for (const name of Object.values(m.name)) {
            const key = fold(name)
            byName.set(key, (byName.get(key) ?? new Set()).add(m.id))
        }
    }
    const named = (division: string, name: string): string | undefined => {
        const found = [...(byName.get(fold(name)) ?? [])]
        if (found.length === 1) return found[0]
        problems.push(
            `${division}: ${found.length === 0 ? 'no' : 'more than one'} municipality "${name}" in the court's area`,
        )
        return undefined
    }
    const provinceOf = new Map(territory.municipalities.map((m) => [m.id, m.province]))
    const holds = (area: DivisionArea, division: string): ((p: Pair) => boolean) => {
        if ('provinces' in area)
            return (p) => area.provinces.includes(provinceOf.get(p.municipality) ?? '')
        if ('municipalities' in area) {
            const ids = new Set(area.municipalities.map((n) => named(division, n)))
            return (p) => ids.has(p.municipality)
        }
        for (const id of area.cantons)
            if (!courtCantons.includes(id))
                problems.push(`${division}: canton "${id}" isn't in the court's area`)
        const except = new Set((area.except ?? []).map((n) => named(division, n)))
        const plus = new Set((area.plus ?? []).map((n) => named(division, n)))
        return (p) =>
            !except.has(p.municipality) &&
            (area.cantons.includes(p.canton) || plus.has(p.municipality))
    }

    const areas = new Map<string, ResolvedArea>()
    for (const [division, area] of Object.entries(court.divisions)) {
        const pairs = courtPairs.filter(holds(area, division))
        if (pairs.length === 0) problems.push(`${division}: covers nothing`)
        const held = new Set(pairs.map((p) => `${p.canton}|${p.municipality}`))
        const whole = inCourt.filter((c) =>
            c.municipalities.every((m) => held.has(`${c.id}|${m.municipality}`)),
        )
        const wholeIds = new Set(whole.map((c) => c.id))
        const rest = new Set(
            pairs.filter((p) => !wholeIds.has(p.canton)).map((p) => p.municipality),
        )
        const arrondissements = new Set(
            pairs.map((p) => cantonById.get(p.canton)?.arrondissement ?? ''),
        )
        areas.set(division, {
            cantons: whole.map((c) => c.id),
            municipalities: [...rest].sort(),
            arrondissements: [...arrondissements],
        })
    }
    // A municipality listed by REFNIS code must lie wholly in its division: a city split over
    // cantons that go to different divisions can't be told apart by its code. (Split by whole
    // cantons, it can: the street address picks the canton.)
    const listed = new Set([...areas.values()].flatMap((a) => a.municipalities))
    const holders = new Map<string, Set<string>>()
    for (const [division, area] of areas)
        for (const { canton, municipality } of courtPairs)
            if (
                listed.has(municipality) &&
                (area.cantons.includes(canton) || area.municipalities.includes(municipality))
            )
                holders.set(municipality, (holders.get(municipality) ?? new Set()).add(division))
    for (const [municipality, divisions] of holders)
        if (divisions.size > 1)
            problems.push(
                `municipality ${municipality} is split between ${[...divisions].sort().join(' and ')}`,
            )
    return { areas, problems }
}

/** The fields of a court record the areas are written to */
export interface DivisibleCourt {
    id: string
    kind: string
    court?: string
    arrondissement?: string
    cantons?: string[]
    municipalities?: string[]
    sources: { url: string; retrieved: string }[]
}

/**
 * Gives each division in `DIVISION_AREAS` its area (`cantons`, and `municipalities` where it
 * shares a canton) and cites the decrees in its `sources`. Returns what a person has to look
 * at: `problems` (an area that doesn't resolve, a division on the portal without an area) and
 * `missing` (a court or division in the table that the sources don't have).
 */
export function applyDivisionAreas(
    courts: DivisibleCourt[],
    territory: Territory,
): { problems: string[]; missing: string[] } {
    const problems: string[] = []
    const missing: string[] = []
    for (const [courtId, divided] of Object.entries(DIVISION_AREAS)) {
        const court = courts.find((c) => c.id === courtId)
        if (!court) {
            missing.push(courtId)
            continue
        }
        const resolved = resolveDivisionAreas(divided, court.cantons ?? [], territory)
        problems.push(...resolved.problems)
        const divisions = courts.filter((c) => c.court === courtId && c.kind === 'division')
        for (const division of divisions) {
            const area = resolved.areas.get(division.id)
            if (!area) {
                problems.push(`${division.id}: on the portal, but not in the division areas`)
                continue
            }
            if (area.cantons.length > 0) division.cantons = area.cantons
            else delete division.cantons
            if (area.municipalities.length > 0) division.municipalities = area.municipalities
            else delete division.municipalities
            // Its arrondissement follows from its area, as a court's does: none when the area
            // spans several (the province of Liège holds the arrondissement Eupen too)
            const held = new Set(area.arrondissements)
            const [only] = held
            if (held.size === 1 && only !== undefined) {
                if (division.arrondissement !== undefined && division.arrondissement !== only)
                    problems.push(
                        `${division.id}: in ${division.arrondissement}, but the decree puts its area in ${only}`,
                    )
                division.arrondissement = only
            } else delete division.arrondissement
            const cited = new Set(division.sources.map((s) => s.url))
            for (const d of divided.decrees)
                if (!cited.has(decreeEli(d)))
                    division.sources.push({ url: decreeEli(d), retrieved: DIVISION_AREAS_CHECKED })
        }
        for (const id of resolved.areas.keys())
            if (!divisions.some((d) => d.id === id)) missing.push(id)
    }
    return { problems, missing }
}
