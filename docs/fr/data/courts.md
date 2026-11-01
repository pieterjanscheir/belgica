<script setup>
import { data as stats } from '../../.vitepress/stats.data'

const labels = {
    'justice-of-the-peace': 'Justice de paix',
    'police-court': 'Tribunal de police',
    'court-of-first-instance': 'Tribunal de première instance',
    'enterprise-court': "Tribunal de l'entreprise",
    'labour-court': 'Tribunal du travail',
    'court-of-appeal': "Cour d'appel",
    'labour-court-of-appeal': 'Cour du travail',
    'court-of-assize': "Cour d'assises",
}

const areas = {
    'justice-of-the-peace': 'Un canton ; Philippeville siège en deux endroits',
    'police-court': 'Un arrondissement (Bruxelles scindé par langue, Hal, Vilvorde)',
    'court-of-first-instance': 'Un arrondissement (Bruxelles scindé par langue)',
    'enterprise-court': "Un arrondissement, ou le ressort d'une cour d'appel",
    'labour-court': "Un arrondissement, ou le ressort d'une cour d'appel",
    'court-of-appeal': 'Un ressort',
    'labour-court-of-appeal': 'Un ressort',
    'court-of-assize': 'Une province, ou Bruxelles-Capitale',
}
</script>

# Cours et tribunaux {#courts}

Fichier : `data/courts.json`. Toutes les juridictions de l'ordre judiciaire que recense le portail des
cours et tribunaux, [tribunaux-rechtbanken.be](https://www.tribunaux-rechtbanken.be) : {{ stats.courts.total }}
enregistrements en vigueur aujourd'hui<span v-if="stats.courts.retired">, et {{ stats.courts.retired }} versions
retirées que le portail ne recense plus</span>. Les nombres de cette page sont calculés à partir des données lors de
la construction du site.

<table>
<thead><tr><th>Type</th><th style="text-align:right">Juridictions</th><th style="text-align:right">Divisions ou sièges</th><th>Territoire</th></tr></thead>
<tbody>
<tr v-for="t in stats.courts.byType" :key="t.type">
<td>{{ labels[t.type] }}</td><td style="text-align:right">{{ t.courts }}</td><td style="text-align:right">{{ t.divisions }}</td><td>{{ areas[t.type] }}</td>
</tr>
</tbody>
</table>

Absents du portail, donc pas encore ici : la Cour de cassation, la Cour constitutionnelle et le Conseil
d'État, ainsi que les juridictions disciplinaires.

## À quoi ça sert {#why-it-s-useful}

- **Adresser des actes.** Les citations, requêtes et conclusions désignent la juridiction telle qu'elle
  se nomme elle-même ; les courriers et les dépôts vont au greffe (griffie), à son adresse.
- **Joindre le bon greffe.** Les juridictions plus grandes ont un greffe par matière (civil, pénal,
  famille, registre des personnes morales…), chacun avec son numéro de téléphone, son adresse e-mail et
  parfois son compte bancaire. Les données les distinguent, étiquetés comme la juridiction les étiquette.
- **Payer des droits.** Les greffes qui publient un compte bancaire pour les droits de greffe et les
  consignations l'ont dans les données, somme de contrôle vérifiée.
- **Construire des formulaires.** Un sélecteur de juridiction a besoin d'une liste complète avec des
  identifiants stables, reliée aux cantons, aux arrondissements et aux ressorts, et à la juridiction dont
  une division relève.
- **Relier à la jurisprudence.** `ecli` donne le code que portent les décisions de la juridiction dans
  leur European Case Law Identifier (`ECLI:BE:HBGNT:…`).

## Source et mises à jour {#source-and-updates}

|               |                                                                                                                                                          |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source        | [tribunaux-rechtbanken.be](https://www.tribunaux-rechtbanken.be), le portail du Collège des cours et tribunaux                                           |
| Construit par | `scripts/parse` à partir des instantanés de la page et de la page de contact de chaque juridiction                                                       |
| Change quand  | Une juridiction déménage, change de coordonnées ou d'horaires, ou le portail ajoute ou renomme une juridiction                                           |
| Vérifié       | Deux fois par semaine, par le [workflow des sources](/fr/guide/data-quality#how-the-data-is-built) ; les changements arrivent sous forme de pull request |

Chaque enregistrement énumère les pages dont il a été lu et le jour où le contenu de chaque page a été vu
pour la première fois (`sources`). Les coordonnées changent plus souvent que tout le reste dans ce
package : quand cela compte, vérifiez la page de la juridiction (`website`).

<CourtList />

## Champs {#fields}

| Champ              | Type                                  | Description                                                                                                                                                                                                                   |
| ------------------ | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`               | `CourtId`                             | Identifiant stable : le `type`, puis le lieu dans la langue de la juridiction : `justice-of-the-peace-gent-1`, `police-court-brussel-fr`, `enterprise-court-gent-brugge`. Voyez [Identifiants](/fr/guide/identifiers)         |
| `validFrom`        | string?                               | Premier jour où l'enregistrement s'applique, `YYYY-MM-DD` : le jour où le portail l'a recensé pour la première fois. Absent : depuis le début de la couverture                                                                |
| `validTo`          | string?                               | Dernier jour où l'enregistrement s'applique : la veille de la vérification qui ne l'a plus trouvé sur le portail. Absent : toujours en vigueur                                                                                |
| `type`             | `CourtType`                           | `justice-of-the-peace`, `police-court`, `court-of-first-instance`, `enterprise-court`, `labour-court`, `court-of-appeal`, `labour-court-of-appeal`, `court-of-assize`                                                         |
| `kind`             | `'court'` \| `'division'` \| `'seat'` | La juridiction elle-même, l'une de ses divisions (afdeling, division, Abteilung), ou l'un des lieux où siège une justice de paix                                                                                              |
| `court`            | `CourtId`?                            | Pour une division ou un siège : la juridiction dont elle relève                                                                                                                                                               |
| `name`             | `{ nl?, fr?, de? }`                   | Le nom tel que la juridiction le publie, dans chaque langue où elle a une page : `Vredegerecht Gent 1`, `Tribunal de l'entreprise du Hainaut - division Mons`                                                                 |
| `judicialArea`     | `JudicialAreaId`                      | Le ressort                                                                                                                                                                                                                    |
| `arrondissement`   | `ArrondissementId`?                   | L'arrondissement, pour une juridiction ou une division dont le territoire est un arrondissement ou s'y inscrit                                                                                                                |
| `canton`           | `CantonId`?                           | Pour une justice de paix : le canton qu'elle dessert                                                                                                                                                                          |
| `cantons`          | `CantonId[]`?                         | Pour toute autre juridiction (pas ses divisions) : les cantons qu'elle couvre, tels que les fixent l'annexe au Code judiciaire (art. 3 à 5) et l'art. 114 du Code                                                             |
| `ecli`             | `string[]`?                           | Les codes ECLI de la juridiction, un par langue dans laquelle elle juge ; seuls les codes relevés dans des décisions publiées                                                                                                 |
| `address`          | `Address`?                            | Où se trouve le greffe, avec la commune à laquelle le code postal appartient (`municipality`, par code REFNIS). Absent quand la juridiction ne publie pas d'adresse unique (une juridiction dont chaque division a la sienne) |
| `contacts`         | `Contact[]`                           | Téléphone, fax, e-mail et compte bancaire, chacun avec le greffe auquel il appartient (`label`) et le texte publié avec lui (`note`)                                                                                          |
| `openingHours`     | string?                               | Heures d'ouverture du greffe en syntaxe OpenStreetMap [`opening_hours`](https://wiki.openstreetmap.org/wiki/Key:opening_hours) : `Mo-Fr 08:30-12:30,13:30-16:00`, uniquement quand le texte publié dit exactement cela        |
| `openingHoursText` | `{ nl?, fr?, de? }`?                  | Les heures d'ouverture telles que publiées, par langue                                                                                                                                                                        |
| `website`          | `{ nl?, fr?, de? }`                   | La page de la juridiction sur le portail, par langue                                                                                                                                                                          |
| `sources`          | `{ url, retrieved }[]`                | Les pages dont l'enregistrement a été lu, et quand leur contenu a été vu pour la première fois                                                                                                                                |

::: tip Nouveaux types de juridiction
`type` peut gagner des valeurs (la Cour de cassation, par exemple). Si vous faites un `switch` dessus,
gardez une branche `default` pour qu'un nouveau type ne casse pas votre code.
:::

## Structure {#shape}

```ts
interface Court {
    id: CourtId
    validFrom?: string
    validTo?: string
    type: CourtType
    kind: 'court' | 'division' | 'seat'
    court?: CourtId
    name: Partial<Translated>
    judicialArea: JudicialAreaId
    arrondissement?: ArrondissementId
    canton?: CantonId
    cantons?: CantonId[]
    ecli?: string[]
    address?: Address
    contacts: Contact[]
    openingHours?: string
    openingHoursText?: Partial<Translated>
    website: Partial<Record<Locale, string>>
    sources: SourceRef[]
}

interface Address {
    building?: string
    street: string // tel que publié, avec numéro, boîte ou étage : 'Beverstraat 7B (eerste verdieping)'
    postalCode: string
    city: string
    municipality?: MunicipalityId // par le code postal ; voir la page Codes postaux
}

interface Contact {
    type: 'phone' | 'fax' | 'email' | 'bank-account'
    value: string // canonique : E.164, e-mail en minuscules, IBAN électronique
    label?: string // le greffe ou le service : 'Burgerlijke griffie', 'Greffe pénal'
    note?: string // texte publié avec la valeur : 'druk 1', 'tapez 2'
}
```

## Fonctions utilitaires {#helpers}

```ts
getCourt('justice-of-the-peace-gent-1')
getJusticeOfThePeace('gent-1') // la même juridiction, par identifiant de canton
getDivisions('enterprise-court-gent') // ses huit divisions
getCourtsForCanton('gent-1') // sa justice de paix, et une juridiction de chaque autre type
findCourtsWithJurisdiction('23088', 'police-court') // [police-court-vilvoorde], par code REFNIS
findCourts({ type: 'police-court', kind: 'court', judicialArea: 'gent' })
getContact(court, 'email', 'Greffe pénal') // la valeur du premier contact correspondant
formatPhoneNumber('+3253820701') // '053 82 07 01'
formatIban('BE73679200844560') // 'BE73 6792 0084 4560'
```

## Comment les données sont lues {#how-the-data-is-read}

Le portail a une page par juridiction et par division, dans la langue de la juridiction ; les juridictions
bilingues de Bruxelles ont une page en néerlandais et une en français, et celles d'Eupen une en français
et une en allemand. L'analyseur :

1. lit le type et le lieu de la juridiction dans son nom (`Politierechtbank Limburg - afdeling Genk`),
   et le canton d'une justice de paix dans son nom et son numéro ;
2. fusionne les versions linguistiques d'une même juridiction en un seul enregistrement : noms, pages et
   heures d'ouverture par langue ; adresse et coordonnées de la première langue (le néerlandais à
   Bruxelles, l'allemand à Eupen), complétées par toute valeur que seule l'autre page donne ;
3. lit les blocs de coordonnées des greffes, en gardant chaque valeur avec son greffe ;
4. convertit les heures d'ouverture publiées en syntaxe `opening_hours` uniquement quand chaque mot est
   compris et que chaque langue dit la même chose. Un texte comportant une remarque ou un régime
   temporaire (« OPGELET: tot 31 december… ») ne garde que le texte publié ;
5. attribue à chaque juridiction les cantons que la loi lui assigne (`cantons`), d'après une table de
   l'annexe au Code judiciaire dans `scripts/parse/jurisdictions.ts`, et en déduit son `arrondissement`.
   La table et le portail se vérifient l'un l'autre : une juridiction présente sur le portail mais absente
   de la table de la loi, ou l'inverse, arrête la construction.

Il refuse d'écrire quoi que ce soit quand une page ne peut être située (un type de juridiction inconnu,
une justice de paix sans canton), qu'un canton n'a pas de juridiction, ou que la table de la loi et le
portail ne s'accordent pas sur les juridictions qui existent. Ce qu'il ne peut lire (un numéro
de téléphone sans indicatif de zone, une adresse rédigée en phrase) est signalé avec la pull request
des données, et laissé hors des données plutôt que deviné.

## Valeurs canoniques {#canonical-values}

| Valeur              | Stockée comme                                     | Pourquoi                                                                                                                                                                      |
| ------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Numéro de téléphone | E.164 : `+3253820701`                             | Une seule forme par numéro, composable de partout ; les liens `tel:` fonctionnent tels quels                                                                                  |
| IBAN                | Format électronique : `BE73679200844560`          | La forme qu'acceptent les systèmes de paiement ; la somme de contrôle est vérifiée à la lecture et dans les tests                                                             |
| E-mail              | Minuscules                                        | Les comparaisons et la déduplication fonctionnent                                                                                                                             |
| Heures d'ouverture  | `opening_hours` : `Mo-Fr 08:30-12:30,13:30-16:00` | Le standard OpenStreetMap, avec des analyseurs dans de nombreux langages (p. ex. [opening_hours.js](https://github.com/opening-hours/opening_hours.js)) et sans langue propre |
| Rue                 | Telle que publiée                                 | Les numéros, boîtes et étages s'écrivent de trop de façons (`Canadaplein ZN`, `Rue de Bruxelles 2 - 3`) pour les séparer sans deviner                                         |
