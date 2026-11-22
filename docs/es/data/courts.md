<script setup>
import { data as stats } from '../../.vitepress/stats.data'

const labels = {
    'justice-of-the-peace': 'Justice de paix / vredegerecht',
    'police-court': 'Tribunal de police / politierechtbank',
    'court-of-first-instance': 'Tribunal de première instance / rechtbank van eerste aanleg',
    'enterprise-court': "Tribunal de l'entreprise / ondernemingsrechtbank",
    'labour-court': 'Tribunal du travail / arbeidsrechtbank',
    'court-of-appeal': "Cour d'appel / hof van beroep",
    'labour-court-of-appeal': 'Cour du travail / arbeidshof',
    'court-of-assize': "Cour d'assises / hof van assisen",
}

const areas = {
    'justice-of-the-peace': 'Un cantón; Philippeville tiene sede en dos lugares',
    'police-court': 'Un distrito judicial (Bruselas dividido por lengua, Halle, Vilvoorde)',
    'court-of-first-instance': 'Un distrito judicial (Bruselas dividido por lengua)',
    'enterprise-court': "Un distrito judicial, o el área de una cour d'appel",
    'labour-court': "Un distrito judicial, o el área de una cour d'appel",
    'court-of-appeal': 'Un área judicial',
    'labour-court-of-appeal': 'Un área judicial',
    'court-of-assize': 'Una provincia, o Bruselas-Capital',
}
</script>

# Tribunales {#courts}

Archivo: `data/courts.json`. Todos los tribunales del poder judicial que figuran en el portal
propio de los tribunales, [tribunaux-rechtbanken.be](https://www.tribunaux-rechtbanken.be):
{{ stats.courts.total }} registros vigentes hoy<span v-if="stats.courts.retired">, y
{{ stats.courts.retired }} versiones retiradas que el portal ya no muestra</span>. Las cifras de
esta página se calculan a partir de los datos al construir el sitio.

Los tipos de tribunal llevan su nombre oficial belga, en francés y neerlandés: la justice de paix
(vredegerecht, juzgado de paz de un cantón), el tribunal de première instance (rechtbank van eerste
aanleg, tribunal de primera instancia), la cour d'appel (hof van beroep, tribunal de apelación),
etc.

<table>
<thead><tr><th>Tipo</th><th style="text-align:right">Tribunales</th><th style="text-align:right">Divisiones o sedes</th><th>Área</th></tr></thead>
<tbody>
<tr v-for="t in stats.courts.byType" :key="t.type">
<td>{{ labels[t.type] }}</td><td style="text-align:right">{{ t.courts }}</td><td style="text-align:right">{{ t.divisions }}</td><td>{{ areas[t.type] }}</td>
</tr>
</tbody>
</table>

No están en el portal, y por tanto aún no están aquí: la Cour de cassation (Hof van Cassatie), la
Cour constitutionnelle (Grondwettelijk Hof), el Conseil d'État (Raad van State) y los tribunales
disciplinarios.

## Para qué sirve {#why-it-s-useful}

- **Encabezar documentos.** Las citaciones, demandas y escritos de conclusiones designan al
  tribunal tal como se denomina a sí mismo; las cartas y los escritos se envían a la secretaría
  (griffie, greffe) a su dirección.
- **Contactar con la secretaría correcta.** Los tribunales más grandes tienen una secretaría por
  materia (civil, penal, familia, el registro de personas jurídicas…), cada una con su propio
  teléfono, correo electrónico y a veces cuenta bancaria. Los datos las mantienen separadas, con
  la etiqueta que usa el propio tribunal.
- **Pagar tasas.** Las secretarías que publican una cuenta bancaria para tasas judiciales y
  consignaciones la tienen en los datos, con el dígito de control verificado.
- **Construir formularios.** Un selector de tribunales necesita una lista completa con ids
  estables, vinculada a cantones, distritos judiciales y áreas judiciales, y al tribunal al que
  pertenece cada división.
- **Enlazar jurisprudencia.** `ecli` da el código que llevan las resoluciones del tribunal en su
  European Case Law Identifier (`ECLI:BE:HBGNT:…`).

## Fuente y actualizaciones {#source-and-updates}

|               |                                                                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fuente        | [tribunaux-rechtbanken.be](https://www.tribunaux-rechtbanken.be), el portal del Collège des cours et tribunaux (College van hoven en rechtbanken) |
| Generado por  | `scripts/parse`, a partir de capturas semanales de la página y la página de contacto de cada tribunal                                             |
| Cambia cuando | Un tribunal se traslada, cambia sus datos de contacto u horarios, o el portal añade o renombra un tribunal                                        |
| Comprobado    | Cada semana, mediante el [workflow de fuentes](/es/guide/data-quality#how-the-data-is-built); los cambios llegan como pull request                |

Cada registro enumera las páginas de las que se leyó y el día en que se vio por primera vez el
contenido de cada página (`sources`). Los datos de contacto cambian más a menudo que cualquier
otra cosa en este paquete: cuando importe, consulta la página del tribunal (`website`).

<CourtList />

## Campos {#fields}

| Campo              | Tipo                                  | Descripción                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`               | `CourtId`                             | Id estable: el `type` y luego el lugar en la lengua del propio tribunal: `justice-of-the-peace-gent-1`, `police-court-brussel-fr`, `enterprise-court-gent-brugge`. Ver [identificadores](/es/guide/identifiers)                                                                                                                                                                                                                       |
| `validFrom`        | string?                               | Primer día en que se aplica el registro, `YYYY-MM-DD`: el día en que el portal lo mostró por primera vez. Ausente: desde el inicio de la cobertura                                                                                                                                                                                                                                                                                    |
| `validTo`          | string?                               | Último día en que se aplica el registro: el día anterior a que la comprobación semanal lo encontrara desaparecido del portal. Ausente: sigue vigente                                                                                                                                                                                                                                                                                  |
| `type`             | `CourtType`                           | `justice-of-the-peace`, `police-court`, `court-of-first-instance`, `enterprise-court`, `labour-court`, `court-of-appeal`, `labour-court-of-appeal`, `court-of-assize`                                                                                                                                                                                                                                                                 |
| `kind`             | `'court'` \| `'division'` \| `'seat'` | El tribunal en sí, una de sus divisiones (afdeling, division, Abteilung), o uno de los lugares donde tiene sede una justice de paix                                                                                                                                                                                                                                                                                                   |
| `court`            | `CourtId`?                            | Para una división o sede: el tribunal al que pertenece                                                                                                                                                                                                                                                                                                                                                                                |
| `name`             | `{ nl?, fr?, de? }`                   | El nombre tal como lo publica el tribunal, en cada lengua en la que tiene página: `Vredegerecht Gent 1`, `Tribunal de l'entreprise du Hainaut - division Mons`                                                                                                                                                                                                                                                                        |
| `judicialArea`     | `JudicialAreaId`                      | El área judicial                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `arrondissement`   | `ArrondissementId`?                   | El distrito judicial, para un tribunal o división cuya área es un distrito judicial o está dentro de uno                                                                                                                                                                                                                                                                                                                              |
| `canton`           | `CantonId`?                           | Para una justice de paix: el cantón al que sirve                                                                                                                                                                                                                                                                                                                                                                                      |
| `cantons`          | `CantonId[]`?                         | Para cualquier otro tribunal: los cantones que cubre, según el anexo del Code judiciaire (Gerechtelijk Wetboek, arts. 3–5) y el art. 114 del mismo Código. Para una división: los cantones que están íntegramente en su área, tal como la fijan los reales decretos adoptados en virtud del art. 186 del Código (ver [divisiones](#divisions)); el área para los asuntos civiles cuando el decreto fija otra para los asuntos penales |
| `municipalities`   | `MunicipalityId[]`?                   | Para una división cuya área solo toma parte de un cantón: esos municipios, por código REFNIS                                                                                                                                                                                                                                                                                                                                          |
| `criminalArea`     | `{ cantons?, municipalities? }`?      | Para una división cuyo decreto fija para los asuntos penales un área distinta de la de los civiles: su área en los asuntos penales, que se lee igual que `cantons` y `municipalities`. Ausente cuando la división tiene una sola área para ambos                                                                                                                                                                                      |
| `ecli`             | `string[]`?                           | Los códigos ECLI del tribunal, uno por lengua en la que juzga; solo códigos vistos en resoluciones publicadas                                                                                                                                                                                                                                                                                                                         |
| `address`          | `Address`?                            | Dónde está la secretaría, con el municipio al que pertenece su código postal (`municipality`, por código REFNIS). Ausente cuando el tribunal no publica una dirección única (un tribunal cuyas divisiones tienen cada una la suya)                                                                                                                                                                                                    |
| `contacts`         | `Contact[]`                           | Teléfono, fax, correo electrónico y cuenta bancaria, cada uno con la secretaría a la que pertenece (`label`) y el texto publicado junto a él (`note`)                                                                                                                                                                                                                                                                                 |
| `openingHours`     | string?                               | Horario de la secretaría en sintaxis [`opening_hours`](https://wiki.openstreetmap.org/wiki/Key:opening_hours) de OpenStreetMap: `Mo-Fr 08:30-12:30,13:30-16:00`, solo cuando el texto publicado dice exactamente eso                                                                                                                                                                                                                  |
| `openingHoursText` | `{ nl?, fr?, de? }`?                  | El horario tal como se publica, por lengua                                                                                                                                                                                                                                                                                                                                                                                            |
| `website`          | `{ nl?, fr?, de? }`                   | La página del tribunal en el portal, por lengua                                                                                                                                                                                                                                                                                                                                                                                       |
| `sources`          | `{ url, retrieved }[]`                | Las páginas de las que se leyó el registro, y cuándo se vio su contenido por primera vez                                                                                                                                                                                                                                                                                                                                              |

::: tip Nuevos tipos de tribunal
`type` puede ganar valores (la Cour de cassation, por ejemplo). Si haces un `switch` sobre él,
mantén una rama `default` para que un tipo nuevo no rompa tu código.
:::

## Estructura {#shape}

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
    municipalities?: MunicipalityId[]
    criminalArea?: { cantons?: CantonId[]; municipalities?: MunicipalityId[] }
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
    street: string // tal como se publica, con número, buzón o planta: 'Beverstraat 7B (eerste verdieping)'
    postalCode: string
    city: string
    municipality?: MunicipalityId // a través del código postal; ver la página de códigos postales
}

interface Contact {
    type: 'phone' | 'fax' | 'email' | 'bank-account'
    value: string // canónico: E.164, correo en minúsculas, IBAN electrónico
    label?: string // la secretaría o servicio: 'Burgerlijke griffie', 'Greffe pénal'
    note?: string // texto publicado junto al valor: 'druk 1', 'tapez 2'
}
```

## Divisiones {#divisions}

Un tribunal de première instance, un tribunal de l'entreprise, un tribunal du travail, una cour
du travail o un tribunal de police puede estar dividido en divisiones (afdelingen, divisions):
dónde se presenta el asunto y dónde se celebra la vista. La división de un tribunal de
l'entreprise es también la que figura en la mención del registro de personas jurídicas en los
documentos de las empresas ("RPR Gent, afdeling Brugge"). Un real decreto adoptado en virtud del
art. 186 del Code judiciaire (Gerechtelijk Wetboek) fija el área de cada división: el decreto de
14 de marzo de 2014 o, desde entonces para muchos tribunales, el decreto de reparto de asuntos
del propio tribunal (zaakverdelingsreglement). Las reformas de los cantones de 2017–2019 y las
fusiones municipales de 2025 modificaron ambos.

Cada división tiene su área en `cantons`: los cantones que están íntegramente en ella. Cuando un
decreto divide un cantón, la división enumera en `municipalities` los municipios que toma de él.
El tribunal du travail de Hainaut envía Pont-à-Celles (cantón de Seneffe) a Charleroi, y
Erquelinnes y Merbes-le-Château (cantón de Chimay) a Binche. El tribunal de première instance de
Liège (desde 2024) y los tribunaux de police de Limburg y de Liège dan a sus divisiones listas de
municipios en lugar de cantones. Un municipio pertenece a la división que lo nombra en
`municipalities` o, si ninguna lo hace, a la que tiene su cantón.
`findDivisionsWithJurisdiction` hace esa búsqueda.

### Asuntos civiles y penales {#civil-and-criminal-cases}

Un decreto puede fijar un área para los asuntos civiles y otra para los penales. Así lo hacen el
tribunal de première instance y el tribunal de police de Antwerpen, en sus decretos de 16 de
diciembre de 2020: en los asuntos civiles todo el cantón de Heist-op-den-Berg va a la división de
Mechelen, y en los asuntos penales (con las acciones civiles que se juzgan en ellos) sus
municipios de Hulshout y Herenthout van a Turnhout.

`cantons` y `municipalities` son entonces el área en los asuntos civiles, y la división tiene su
área en los asuntos penales en `criminalArea`, con los mismos dos campos:

```ts
getCourt('police-court-antwerpen-turnhout').criminalArea
// { cantons: ['mol-geel-1', 'mol-geel-2', 'turnhout-1', 'turnhout-2', 'westerlo'],
//   municipalities: ['13012', '13016'] }   Herenthout y Hulshout
```

Solo una división cuyas dos áreas difieren tiene `criminalArea`: hoy son cuatro, Mechelen y
Turnhout en ambos tribunales. Para todas las demás divisiones, la única área vale para ambos
tipos de asunto. `findDivisionsWithJurisdiction` recibe el tipo de asunto en `matter`:

```ts
const ids = (options?: DivisionOptions) =>
    findDivisionsWithJurisdiction('13016', 'police-court', options).map((d) => d.id)
ids({ matter: 'civil' }) // ['police-court-antwerpen-mechelen']
ids({ matter: 'criminal' }) // ['police-court-antwerpen-turnhout']
ids() // ambas, la civil primero: decide el tipo de asunto
```

### Fuentes {#sources}

Las áreas son el texto vigente, consolidado a mano a partir de las publicaciones en el Moniteur
belge (Belgisch Staatsblad) que cada división cita en `sources`: el decreto que fija el área y
cada decreto posterior que la modificó. Las áreas de los tribunaux de police se leyeron de los
textos consolidados de Justel. Un test comprueba que las divisiones de un tribunal cubren su área
una sola vez, en los asuntos civiles y en los penales.

Un decreto también puede enviar un tipo de asunto a una sola división para todo el tribunal: los
procedimientos de liquidación colectiva de deudas del tribunal du travail de Hainaut, o las
infracciones que competen a los tribunaux du travail en el tribunal de police de Liège. Esas
reglas no están en los datos.

## Helpers {#helpers}

```ts
getCourt('justice-of-the-peace-gent-1')
getJusticeOfThePeace('gent-1') // el mismo tribunal, por id de cantón
getDivisions('enterprise-court-gent') // sus ocho divisiones
getCourtsForCanton('gent-1') // su justice de paix, y un tribunal de cada otro tipo
findCourtsWithJurisdiction('23088', 'police-court') // [police-court-vilvoorde], por código REFNIS
findDivisionsWithJurisdiction('31005', 'enterprise-court') // [enterprise-court-gent-brugge]
findDivisionsWithJurisdiction('44021', 'police-court') // [police-court-oost-vlaanderen-gent]
findCourts({ type: 'police-court', kind: 'court', judicialArea: 'gent' })
getContact(court, 'email', 'Greffe pénal') // el valor del primer contacto que coincide
formatPhoneNumber('+3253820701') // '053 82 07 01'
formatIban('BE73679200844560') // 'BE73 6792 0084 4560'
```

## Cómo se leen los datos {#how-the-data-is-read}

El portal tiene una página por tribunal y por división, en la lengua del tribunal; los
tribunales bilingües de Bruselas tienen una página en neerlandés y otra en francés, y los
tribunales de Eupen una en francés y otra en alemán. El parser:

1. lee el tipo y el lugar del tribunal a partir de su nombre (`Politierechtbank Limburg - afdeling Genk`),
   y el cantón de una justice de paix a partir de su nombre y número;
2. fusiona las versiones lingüísticas de un mismo tribunal en un único registro: nombres,
   páginas y horarios por lengua; dirección y contactos de la primera lengua (neerlandés en
   Bruselas, alemán en Eupen), más cualquier valor que solo tenga la otra página;
3. lee los bloques de contacto de las secretarías, manteniendo cada valor con su secretaría;
4. convierte el horario publicado a sintaxis `opening_hours` solo cuando entiende cada palabra y
   todas las lenguas dicen lo mismo. Un texto con una nota o un arreglo temporal
   ("OPGELET: tot 31 december…") conserva solo el texto publicado;
5. asigna a cada tribunal los cantones que le atribuye la ley (`cantons`), a partir de una tabla
   del anexo del Code judiciaire en `scripts/parse/jurisdictions.ts`, y deduce de ellos su
   `arrondissement`. La tabla y el portal se verifican mutuamente: un tribunal del portal que
   falta en la tabla legal, o al revés, detiene la build.

No escribe nada cuando una página no se puede ubicar (un tipo de tribunal desconocido, una
justice de paix sin cantón), cuando un cantón no tiene tribunal, o cuando la tabla legal y el
portal discrepan sobre qué tribunales existen. Lo que no sabe leer (un número de teléfono sin
prefijo, una dirección escrita como frase) se señala en el pull request semanal y se deja fuera
de los datos en lugar de adivinarlo.

## Valores canónicos {#canonical-values}

| Valor              | Se guarda como                                   | Por qué                                                                                                                                                          |
| ------------------ | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Número de teléfono | E.164: `+3253820701`                             | Una sola forma por número, marcable desde cualquier lugar; los enlaces `tel:` funcionan tal cual                                                                 |
| IBAN               | Formato electrónico: `BE73679200844560`          | La forma que aceptan los sistemas de pago; el dígito de control se verifica al leerlo y en los tests                                                             |
| Correo electrónico | En minúsculas                                    | Las comparaciones y la deduplicación funcionan                                                                                                                   |
| Horario            | `opening_hours`: `Mo-Fr 08:30-12:30,13:30-16:00` | El estándar de OpenStreetMap, con parsers en muchos lenguajes (p. ej. [opening_hours.js](https://github.com/opening-hours/opening_hours.js)) y sin idioma propio |
| Calle              | Tal como se publica                              | Números, buzones y plantas se escriben de demasiadas formas (`Canadaplein ZN`, `Rue de Bruxelles 2 - 3`) como para separarlos sin adivinar                       |
