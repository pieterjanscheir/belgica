<script setup>
import { data as stats } from '../../.vitepress/stats.data'

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`
</script>

# ابدأ الآن {#getting-started}

## التثبيت {#install}

::: code-group

```bash [pnpm]
pnpm add belgica
```

```bash [npm]
npm install belgica
```

```bash [yarn]
yarn add belgica
```

:::

الحزمة بصيغة ESM، وتأتي مع تعريفات الأنواع الخاصة بها، وليس لها أي تبعيات وقت التشغيل، وتعمل
في المتصفحات وعلى Node 22.12 أو أحدث، حيث يحمّلها `require()` أيضًا. وهي مختبرة على Node 22.12
و22 و24 و26.

### استورد ما تحتاج إليه فقط {#import-only-what-you-need}

البيانات مضمّنة في JavaScript، لذا فإن الاستيراد من جذر الحزمة يحمّل كل مجموعات البيانات. لكل
مجموعة بيانات entry point خاص بها، والمحاكم والكانتونات (مع النص القانوني لأقاليمها) هي الأكبر
حجمًا بفارق كبير:

```ts
import { getInterestRate } from 'belgica/interest-rates'
import { getCourt } from 'belgica/courts'
import { getCanton } from 'belgica/territory'
import { getMunicipalitiesForPostalCode } from 'belgica/postal-codes'
```

[حدود الكانتونات](/ar/data/canton-boundaries) هي الاستثناء: مليون موضع من البيانات الهندسية،
موجودة فقط في `belgica/canton-boundaries`، ولا يحمّلها جذر الحزمة أبدًا.

<table v-if="stats.sizes">
<thead><tr><th>Entry point</th><th style="text-align:right">JavaScript المحمَّل</th><th style="text-align:right">gzip</th></tr></thead>
<tbody>
<tr v-for="s in stats.sizes" :key="s.entry">
<td><code>{{ s.entry }}</code></td><td style="text-align:right">{{ kb(s.raw) }}</td><td style="text-align:right">{{ kb(s.gzip) }}</td>
</tr>
</tbody>
</table>
<p v-else class="bld-muted">تُقاس الأحجام من البناء عند بناء الموقع (شغّل <code>pnpm build</code> أولًا).</p>

## نظرة أولى {#a-first-look}

```ts
import {
    getCourt,
    findCourts,
    getCanton,
    getCantonsForMunicipality,
    getInterestRate,
} from 'belgica'

getCourt('justice-of-the-peace-gent-1').name.nl // 'Vredegerecht Gent 1'
findCourts({ type: 'enterprise-court', arrondissement: 'west-vlaanderen' })

getCantonsForMunicipality('44088') // [Canton merelbeke-melle]
getCantonsForMunicipality('44021') // Gent 1–5: مدينة مقسّمة، انظر `territory` لكل كانتون
getCanton('oudergem').seat.nl // 'Etterbeek'

getInterestRate('2024-06-15', 'legal') // { rate: 5.75, period: { from: '2024-01-01', to: '2024-12-31' } }
getInterestRate(new Date(2014, 5, 15), 'commercial', { contractAfter20130316: true }) // { rate: 8.5, … }
```

## مهام شائعة {#common-tasks}

### أي vredegerecht / justice de paix يختص بعنوان ما؟ {#which-justice-of-the-peace-handles-an-address}

ابحث عن رمز REFNIS للبلدية واحصل على كانتوناتها، ثم على محكمة الكانتون، أي الـvredegerecht /
justice de paix (محكمة الصلح).

```ts
import { getCantonsForMunicipality, getJusticeOfThePeace } from 'belgica'

const cantons = getCantonsForMunicipality('44088')
if (cantons.length === 1) {
    const court = getJusticeOfThePeace(cantons[0].id) // لكل كانتون محكمته
}

// في يوم تبليغ الاستدعاء، لا في يوم اليوم
getCantonsForMunicipality('44088', { on: '2025-09-15' })
```

حين تكون المدينة مقسّمة على عدة كانتونات (Antwerpen وGent وBrussel وLuik، …) تحصل على أكثر من
نتيجة. عنوان الشارع هو الفيصل، و`territory` لكل كانتون يتضمن الوصف القانوني لجزئه. جرّبه في
[صفحة الإقليم والكانتونات](/ar/data/territory#find-the-canton-for-a-municipality).

وإذا توفرت إحداثيات العنوان، تحسم [حدود الكانتونات](/ar/data/canton-boundaries) المسألة:

```ts
import { findCantonsAt } from 'belgica/canton-boundaries'

const [canton] = findCantonsAt(3.7268, 51.053) // خط الطول، خط العرض: gent-1
const court = getJusticeOfThePeace(canton.id)
```

### أي محكمة تختص ببلدية ما؟ {#which-court-for-a-municipality}

كل محكمة غير الـvredegerecht / justice de paix تذكر الكانتونات التي تغطيها (`cantons`)، كما
يحددها القانون. وتبحث `findCourtsWithJurisdiction` عن كانتونات البلدية فيها.

```ts
import { findCourtsWithJurisdiction, getDivisions } from 'belgica'

findCourtsWithJurisdiction('23088', 'police-court') // [police-court-vilvoorde]، لا Brussel
findCourtsWithJurisdiction('21004', 'labour-court') // المحكمة الناطقة بالهولندية والمحكمة الناطقة بالفرنسية في Brussel

// المحكمة ككل؛ أما القسم الذي ينظر في القضية فليس في البيانات بعد
const [court] = findCourtsWithJurisdiction('44021', 'enterprise-court')
getDivisions(court.id) // enterprise-court-gent-gent, enterprise-court-gent-brugge, …
```

#### انطلاقًا من رمز بريدي {#from-a-postal-code}

يأتي العنوان مع رمز بريدي، لا مع رمز REFNIS. تنتقل `findCourtsForPostalCode` من الرمز البريدي
إلى البلدية ([الرموز البريدية](/ar/data/postal-codes)) ومن هناك إلى محاكم الـvredegerecht /
justice de paix وإلى محاكم نوع معيّن. وهي تجيب لكل بلدية على حدة: ثلاثة رموز بريدية (`1040`
و`1050` و`1804`) تنتمي إلى بلديتين، وعندها يكون الشارع هو الفيصل.

```ts
import { findCourtsForPostalCode, getMunicipalitiesForPostalCode } from 'belgica'

const [gent] = findCourtsForPostalCode('9050', 'labour-court')
gent.municipality.name.nl // 'Gent'
gent.courts.map((c) => c.id) // ['labour-court-gent']
gent.justicesOfThePeace.map((c) => c.canton.id) // ['gent-1', …, 'gent-5']: الشارع هو الفيصل

findCourtsForPostalCode('1040', 'police-court').map((r) => r.municipality.name.nl) // ['Brussel', 'Etterbeek']
getMunicipalitiesForPostalCode('9050').map((m) => m.id) // ['44021']
```

في مدينة مقسّمة على كانتونات، يضيّق الرمز البريدي السؤال إلى البلدية؛ لكن الكانتون لا يزال يحتاج
إلى الشارع، وحدوده نص قانوني نثري إلى أن تضيفها
[#29](https://github.com/pieterjanscheir/belgica/issues/29) بوصفها بيانات هندسية.

### الفائدة المستحقة في يوم معيّن {#interest-due-on-a-day}

```ts
import { getInterestRate, getLatestKnownRateDate } from 'belgica'

const result = getInterestRate(new Date(), 'commercial')
if (!result) {
    console.warn(`No rate on file; latest known day is ${getLatestKnownRateDate('commercial')}`)
}
```

تُرجع `getInterestRate` القيمة `null` ليوم لا يوجد له سعر مسجَّل، حتى تتمكن من إصدار تحذير بدلًا
من استخدام 0 % بصمت. وترمي `RangeError` ليوم مكتوب بصيغة خاطئة مثل `'2024-6-1'`: مرّر
`YYYY-MM-DD` أو `Date`.

### أسماء المحاكم بلغة أخرى {#court-names-in-another-language}

الأسماء كما تنشرها كل محكمة، بكل لغة لها فيها صفحة. المحكمة في Vlaanderen (فلاندرز) تنشر
بالهولندية فقط؛ والمحاكم الثنائية اللغة في Brussel بالهولندية والفرنسية؛ والمحاكم في Eupen
بالألمانية والفرنسية.

```ts
getCourt('court-of-appeal-brussel').name.fr // "Cour d'appel de Bruxelles"
getCourt('police-court-eupen-sankt-vith').name.de // 'Polizeigericht Eupen, Abteilung Sankt Vith'
```

## JSON الخام {#raw-json}

ملفات البيانات مُصدَّرة أيضًا:

```ts
import courts from 'belgica/data/courts.json' with { type: 'json' }
```

## المعرّفات جزء من الواجهة العامة {#ids-are-public-api}

تخزّن المشاريع معرّفات مثل `justice-of-the-peace-gent-1` أو `oost-vlaanderen`، لذا لا تتغير
أبدًا ضمن إصدار major واحد (انظر [المعرّفات](./identifiers))، وتتبع الإصدارات هذه القواعد:

| التغيير                  | الإصدار |
| ------------------------ | ------- |
| إضافة بيانات             | minor   |
| تصحيح قيمة               | patch   |
| حذف معرّف أو إعادة تسميته | major   |
