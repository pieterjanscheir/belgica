<script setup>
import { data as stats } from '../../.vitepress/stats.data'

const labels = {
    'justice-of-the-peace': 'Vredegerecht / justice de paix',
    'police-court': 'Politierechtbank / tribunal de police',
    'court-of-first-instance': 'Rechtbank van eerste aanleg / tribunal de première instance',
    'enterprise-court': "Ondernemingsrechtbank / tribunal de l'entreprise",
    'labour-court': 'Arbeidsrechtbank / tribunal du travail',
    'court-of-appeal': "Hof van beroep / cour d'appel",
    'labour-court-of-appeal': 'Arbeidshof / cour du travail',
    'court-of-assize': "Hof van assisen / cour d'assises",
}

const areas = {
    'justice-of-the-peace': 'Кантон; Philippeville засідає у двох місцях',
    'police-court': 'Судовий округ (Брюссель поділено за мовою, Halle, Vilvoorde)',
    'court-of-first-instance': 'Судовий округ (Брюссель поділено за мовою)',
    'enterprise-court': 'Судовий округ або територія hof van beroep / cour d\'appel',
    'labour-court': 'Судовий округ або територія hof van beroep / cour d\'appel',
    'court-of-appeal': 'Апеляційний округ',
    'labour-court-of-appeal': 'Апеляційний округ',
    'court-of-assize': 'Провінція або Брюссель-Столиця',
}
</script>

# Суди {#courts}

Файл: `data/courts.json`. Кожен суд судової системи, який наводить власний портал судів,
[tribunaux-rechtbanken.be](https://www.tribunaux-rechtbanken.be): {{ stats.courts.total }}
записів, чинних сьогодні<span v-if="stats.courts.retired">, і {{ stats.courts.retired }} виведених
з ужитку версій, яких портал більше не наводить</span>. Числа на цій сторінці обчислюються з
даних під час побудови сайту.

<table>
<thead><tr><th>Вид</th><th style="text-align:right">Суди</th><th style="text-align:right">Відділення або місця засідань</th><th>Територія</th></tr></thead>
<tbody>
<tr v-for="t in stats.courts.byType" :key="t.type">
<td>{{ labels[t.type] }}</td><td style="text-align:right">{{ t.courts }}</td><td style="text-align:right">{{ t.divisions }}</td><td>{{ areas[t.type] }}</td>
</tr>
</tbody>
</table>

Цих судів немає на порталі, тож тут їх поки немає: Hof van Cassatie / Cour de cassation
(Касаційний суд), Grondwettelijk Hof / Cour constitutionnelle (Конституційний суд), Raad van
State / Conseil d'État (Державна рада) і дисциплінарні суди.

## Чим він корисний {#why-it-s-useful}

- **Адресування документів.** Позовні заяви (dagvaardingen / citations), клопотання і висновки
  (conclusies / conclusions) називають суд так, як він сам себе називає; листи й подання
  надсилаються до канцелярії (griffie / greffe) за її адресою.
- **Зв'язок із правильною канцелярією.** Більші суди мають окрему канцелярію для кожної категорії
  справ (цивільні, кримінальні, сімейні, реєстр юридичних осіб…), кожна зі своїм телефоном,
  електронною поштою, а іноді й банківським рахунком. Дані тримають їх окремо, з мітками, які дає
  сам суд.
- **Сплата зборів.** Канцелярії, що публікують банківський рахунок для судових зборів і
  депозитів, мають його в даних, з перевіреною контрольною сумою.
- **Побудова форм.** Для вибору суду потрібен повний список зі стабільними id, пов'язаний із
  кантонами, судовими й апеляційними округами, а також із судом, до якого належить відділення.
- **Посилання на судову практику.** `ecli` дає код, який рішення суду мають у своєму
  European Case Law Identifier (`ECLI:BE:HBGNT:…`).

## Джерело й оновлення {#source-and-updates}

|                  |                                                                                                                                               |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Джерело          | [tribunaux-rechtbanken.be](https://www.tribunaux-rechtbanken.be), портал College van de hoven en rechtbanken / Collège des cours et tribunaux |
| Будується        | `scripts/parse` зі щотижневих знімків сторінки і сторінки контактів кожного суду                                                              |
| Змінюється, коли | Суд переїжджає, змінює контакти чи години роботи, або портал додає чи перейменовує суд                                                        |
| Перевіряється    | Щотижня, через [sources workflow](/uk/guide/data-quality#how-the-data-is-built); зміни надходять як pull request                              |

Кожен запис перелічує сторінки, з яких його прочитано, і день, коли вміст кожної сторінки було
вперше побачено (`sources`). Контактні дані змінюються частіше, ніж будь-що інше в цьому пакеті:
коли це важливо, перевіряйте сторінку суду (`website`).

<CourtList />

## Поля {#fields}

| Поле               | Тип                                   | Опис                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`               | `CourtId`                             | Стабільний id: `type`, потім місце мовою самого суду: `justice-of-the-peace-gent-1`, `police-court-brussel-fr`, `enterprise-court-gent-brugge`. Див. [Ідентифікатори](/uk/guide/identifiers)                                                                                                                                                                                                     |
| `validFrom`        | string?                               | Перший день, коли запис чинний, `YYYY-MM-DD`: день, коли портал уперше його навів. Якщо немає — від початку охоплення                                                                                                                                                                                                                                                                            |
| `validTo`          | string?                               | Останній день, коли запис чинний: день перед тим, як щотижнева перевірка виявила, що його на порталі немає. Якщо немає — досі чинний                                                                                                                                                                                                                                                             |
| `type`             | `CourtType`                           | `justice-of-the-peace`, `police-court`, `court-of-first-instance`, `enterprise-court`, `labour-court`, `court-of-appeal`, `labour-court-of-appeal`, `court-of-assize`                                                                                                                                                                                                                            |
| `kind`             | `'court'` \| `'division'` \| `'seat'` | Сам суд, одне з його відділень (afdeling, division, Abteilung) або одне з місць, де засідає vredegerecht / justice de paix                                                                                                                                                                                                                                                                       |
| `court`            | `CourtId`?                            | Для відділення чи місця засідань: суд, до якого воно належить                                                                                                                                                                                                                                                                                                                                    |
| `name`             | `{ nl?, fr?, de? }`                   | Назва, як її публікує суд, кожною мовою, якою він має сторінку: `Vredegerecht Gent 1`, `Tribunal de l'entreprise du Hainaut - division Mons`                                                                                                                                                                                                                                                     |
| `judicialArea`     | `JudicialAreaId`                      | Апеляційний округ                                                                                                                                                                                                                                                                                                                                                                                |
| `arrondissement`   | `ArrondissementId`?                   | Судовий округ, для суду чи відділення, чия територія — один судовий округ або лежить у межах одного                                                                                                                                                                                                                                                                                              |
| `canton`           | `CantonId`?                           | Для vredegerecht / justice de paix: кантон, який він обслуговує                                                                                                                                                                                                                                                                                                                                  |
| `cantons`          | `CantonId[]`?                         | Для кожного іншого суду: кантони, які він охоплює, як їх визначають додаток до Gerechtelijk Wetboek / Code judiciaire (ст. 3–5) і ст. 114 Кодексу. Для відділення: кантони, що повністю лежать у його території, як її визначають королівські укази, видані на підставі ст. 186 Кодексу (див. [Відділення](#divisions)); територія для цивільних справ, якщо указ визначає іншу для кримінальних |
| `municipalities`   | `MunicipalityId[]`?                   | Для відділення, територія якого охоплює лише частину кантону: ці громади, за кодом REFNIS                                                                                                                                                                                                                                                                                                        |
| `criminalArea`     | `{ cantons?, municipalities? }`?      | Для відділення, якому указ визначає для кримінальних справ іншу територію, ніж для цивільних: його територія в кримінальних справах, що читається так само, як `cantons` і `municipalities`. Відсутнє, якщо відділення має одну територію для обох видів справ                                                                                                                                   |
| `ecli`             | `string[]`?                           | Коди ECLI суду, по одному на кожну мову, якою він судить; лише коди, побачені в опублікованих рішеннях                                                                                                                                                                                                                                                                                           |
| `address`          | `Address`?                            | Де розташована канцелярія, з громадою, до якої належить її поштовий індекс (`municipality`, за кодом REFNIS). Відсутня, коли суд не публікує єдиної адреси (суд, кожне відділення якого має власну)                                                                                                                                                                                              |
| `contacts`         | `Contact[]`                           | Телефон, факс, електронна пошта і банківський рахунок, кожен із канцелярією, до якої він належить (`label`), і текстом, опублікованим разом із ним (`note`)                                                                                                                                                                                                                                      |
| `openingHours`     | string?                               | Години роботи канцелярії в синтаксисі OpenStreetMap [`opening_hours`](https://wiki.openstreetmap.org/wiki/Key:opening_hours): `Mo-Fr 08:30-12:30,13:30-16:00`, лише коли опублікований текст каже саме це                                                                                                                                                                                        |
| `openingHoursText` | `{ nl?, fr?, de? }`?                  | Години роботи, як їх опубліковано, кожною мовою                                                                                                                                                                                                                                                                                                                                                  |
| `website`          | `{ nl?, fr?, de? }`                   | Сторінка суду на порталі, кожною мовою                                                                                                                                                                                                                                                                                                                                                           |
| `sources`          | `{ url, retrieved }[]`                | Сторінки, з яких прочитано запис, і коли їхній вміст було вперше побачено                                                                                                                                                                                                                                                                                                                        |

::: tip Нові типи судів
`type` може отримати нові значення (наприклад, Hof van Cassatie / Cour de cassation). Якщо ви
робите `switch` за ним, залиште гілку `default`, щоб новий тип не зламав ваш код.
:::

## Структура {#shape}

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
    street: string // як опубліковано, з номером, поштовою скринькою чи поверхом: 'Beverstraat 7B (eerste verdieping)'
    postalCode: string
    city: string
    municipality?: MunicipalityId // через поштовий індекс; див. сторінку «Поштові індекси»
}

interface Contact {
    type: 'phone' | 'fax' | 'email' | 'bank-account'
    value: string // канонічно: E.164, e-mail у нижньому регістрі, електронний IBAN
    label?: string // канцелярія чи служба: 'Burgerlijke griffie', 'Greffe pénal'
    note?: string // текст, опублікований разом зі значенням: 'druk 1', 'tapez 2'
}
```

## Відділення {#divisions}

Rechtbank van eerste aanleg / tribunal de première instance, ondernemingsrechtbank / tribunal de
l'entreprise, arbeidsrechtbank / tribunal du travail, arbeidshof / cour du travail або
politierechtbank / tribunal de police може бути поділений на відділення (afdelingen, divisions):
саме до відділення подають документи, і саме там відбувається засідання. Відділення
ondernemingsrechtbank / tribunal de l'entreprise — це ще й те, яке вказують у позначці реєстру
юридичних осіб на документах компаній («RPR Gent, afdeling Brugge»). Територію кожного
відділення визначає королівський указ, виданий на підставі ст. 186 Gerechtelijk Wetboek / Code
judiciaire: указ від 14 березня 2014 року або, відтоді для багатьох судів, власний указ суду про
розподіл справ (zaakverdelingsreglement). Реформи кантонів 2017–2019 років і об'єднання громад
2025 року змінили і перший, і другі.

Кожне відділення має свою територію в `cantons`: це кантони, що повністю лежать у ній. Якщо указ
ділить кантон, відділення перелічує в `municipalities` громади, які воно з нього бере. Tribunal
du travail du Hainaut відносить Pont-à-Celles (кантон Seneffe) до Charleroi, а Erquelinnes і
Merbes-le-Château (кантон Chimay) — до Binche. Tribunal de première instance de Liège (з 2024
року), а також politierechtbank Limburg і tribunal de police de Liège дають своїм відділенням
переліки громад замість кантонів. Громада належить до відділення, яке називає її в
`municipalities`, а інакше — до того, що має її кантон. Цей пошук виконує
`findDivisionsWithJurisdiction`.

### Цивільні та кримінальні справи {#civil-and-criminal-cases}

Указ може визначити одну територію для цивільних справ і іншу — для кримінальних. Так роблять
rechtbank van eerste aanleg Antwerpen і politierechtbank Antwerpen у своїх указах від 16 грудня
2020 року: у цивільних справах увесь кантон Heist-op-den-Berg відходить до відділення Mechelen, а
в кримінальних (разом із цивільними позовами, що розглядаються в них) його громади Hulshout і
Herenthout відходять до Turnhout.

`cantons` і `municipalities` тоді є територією в цивільних справах, а свою територію в
кримінальних справах відділення має в `criminalArea`, з тими самими двома полями:

```ts
getCourt('police-court-antwerpen-turnhout').criminalArea
// { cantons: ['mol-geel-1', 'mol-geel-2', 'turnhout-1', 'turnhout-2', 'westerlo'],
//   municipalities: ['13012', '13016'] }   Herenthout і Hulshout
```

Лише відділення, дві території якого різняться, має `criminalArea`: сьогодні таких чотири —
Mechelen і Turnhout обох судів. Для кожного іншого відділення одна територія чинна для обох видів
справ. `findDivisionsWithJurisdiction` приймає вид справи як `matter`:

```ts
const ids = (options?: DivisionOptions) =>
    findDivisionsWithJurisdiction('13016', 'police-court', options).map((d) => d.id)
ids({ matter: 'civil' }) // ['police-court-antwerpen-mechelen']
ids({ matter: 'criminal' }) // ['police-court-antwerpen-turnhout']
ids() // обидва, цивільне першим: вирішує вид справи
```

### Джерела {#sources}

Території — це чинний текст, вручну консолідований із публікацій у Belgisch Staatsblad / Moniteur
belge, на які кожне відділення посилається в `sources`: указ, що визначає територію, і кожен
пізніший, що її змінив. Території politierechtbanken / tribunaux de police прочитано з
консолідованих текстів Justel. Тест перевіряє, що відділення суду покривають його територію рівно
один раз — і в цивільних, і в кримінальних справах.

Указ може також спрямувати один вид справ до одного відділення для всього суду: колективне
врегулювання боргів (règlement collectif de dettes) у tribunal du travail du Hainaut або
правопорушення, що належать до компетенції tribunaux du travail, у tribunal de police de Liège.
Цих правил у даних немає.

## Допоміжні функції {#helpers}

```ts
getCourt('justice-of-the-peace-gent-1')
getJusticeOfThePeace('gent-1') // той самий суд, за id кантону
getDivisions('enterprise-court-gent') // його вісім відділень
getCourtsForCanton('gent-1') // його vredegerecht і по одному суду кожного іншого типу
findCourtsWithJurisdiction('23088', 'police-court') // [police-court-vilvoorde], за кодом REFNIS
findDivisionsWithJurisdiction('31005', 'enterprise-court') // [enterprise-court-gent-brugge]
findDivisionsWithJurisdiction('44021', 'police-court') // [police-court-oost-vlaanderen-gent]
findCourts({ type: 'police-court', kind: 'court', judicialArea: 'gent' })
getContact(court, 'email', 'Greffe pénal') // значення першого відповідного контакту
formatPhoneNumber('+3253820701') // '053 82 07 01'
formatIban('BE73679200844560') // 'BE73 6792 0084 4560'
```

## Як читаються дані {#how-the-data-is-read}

Портал має сторінку для кожного суду і кожного відділення, мовою суду; двомовні суди в Брюсселі
мають сторінку нідерландською і сторінку французькою, а суди в Eupen — французькою і німецькою.
Парсер:

1. зчитує тип і місце суду з його назви (`Politierechtbank Limburg - afdeling Genk`), а кантон
   vredegerecht / justice de paix — з його назви і номера;
2. об'єднує мовні версії одного суду в один запис: назви, сторінки і години роботи — для
   кожної мови; адресу й контакти — з першої мови (нідерландська в Брюсселі, німецька в Eupen),
   плюс будь-яке значення, яке є лише на іншій сторінці;
3. зчитує блоки контактів канцелярій, зберігаючи кожне значення з його канцелярією;
4. перетворює опубліковані години роботи на синтаксис `opening_hours` лише тоді, коли зрозуміле
   кожне слово і кожна мова каже те саме. Текст із приміткою чи тимчасовою домовленістю
   («OPGELET: tot 31 december…») зберігає лише опублікований текст;
5. дає кожному суду кантони, які йому призначає закон (`cantons`), з таблиці додатка до
   Gerechtelijk Wetboek / Code judiciaire у `scripts/parse/jurisdictions.ts`, і виводить із них
   його `arrondissement`. Таблиця і портал перевіряють одне одного: суд на порталі, якого немає
   в таблиці закону, або навпаки, зупиняє збірку.

Він відмовляється щось записувати, коли сторінку неможливо розпізнати (невідомий вид суду,
vredegerecht / justice de paix без кантону), кантон не має суду або таблиця закону і портал не
погоджуються щодо того, які суди існують. Те, чого він не може прочитати (номер телефону без
коду зони, адреса, записана реченням), повідомляється разом зі щотижневим pull request і
пропускається в даних, а не вгадується.

## Канонічні значення {#canonical-values}

| Значення       | Зберігається як                                  | Чому                                                                                                                                                                 |
| -------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Номер телефону | E.164: `+3253820701`                             | Одна форма для кожного номера, можна набрати звідусіль, посилання `tel:` працюють без змін                                                                           |
| IBAN           | Електронний формат: `BE73679200844560`           | Форма, яку приймають платіжні системи; контрольна сума перевіряється під час читання і в тестах                                                                      |
| E-mail         | У нижньому регістрі                              | Працюють порівняння і дедуплікація                                                                                                                                   |
| Години роботи  | `opening_hours`: `Mo-Fr 08:30-12:30,13:30-16:00` | Стандарт OpenStreetMap, з парсерами для багатьох мов (напр. [opening_hours.js](https://github.com/opening-hours/opening_hours.js)) і без прив'язки до природної мови |
| Вулиця         | Як опубліковано                                  | Номери, поштові скриньки й поверхи записуються надто по-різному (`Canadaplein ZN`, `Rue de Bruxelles 2 - 3`), щоб розділяти їх без вгадування                        |
