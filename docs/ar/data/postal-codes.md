# الرموز البريدية {#postal-codes}

<script setup>
import { data as stats } from '../../.vitepress/stats.data'
</script>

الملف: `data/postal-codes.json`. الرموز البريدية البلجيكية البالغ عددها {{ stats.postalCodes.codes }}،
كل منها مرتبط بالبلدية التي ينتمي إليها برمز REFNIS: {{ stats.postalCodes.records }} سجلًا، لأن
{{ stats.postalCodes.shared }} رموز بريدية تنتمي إلى بلديتين.

## لماذا هي مفيدة {#why-it-s-useful}

- **من العنوان إلى الخريطة القضائية.** تأتي العناوين مع رمز بريدي، لا مع رمز REFNIS. الرمز البريدي
  يعطي البلدية، والبلدية تعطي كانتوناتها ومحاكمها: `findCourtsForPostalCode('9050', 'labour-court')`
  يجيب عن «أي محكمة لهذا العنوان؟» بقدر ما يسمح الرمز البريدي.
- **الرموز البريدية لبلدية.** التحقق من نموذج، أو توجيه مراسلات، أو التأكد من أن عنوانًا ورمز
  REFNIS متطابقان: `getPostalCodes('44021')`.
- **بلدية كل محكمة وسجن وjustitiehuis / maison de justice.** حقل `address.municipality` فيها هو
  هذا الرابط، مطبَّقًا على الرمز البريدي للعنوان المنشور
  ([#28](https://github.com/pieterjanscheir/belgica/issues/28)).

## المصدر والتحديثات {#source-and-updates}

|           |                                                                                                                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| المصدر    | [جدول التحويل من الرموز البريدية إلى رموز REFNIS](https://statbel.fgov.be/nl/over-statbel/methodologie/classificaties/geografie) لدى Statbel، الجدول الساري من 1 يناير 2025 (`…_va01012025.xlsx`)      |
| يبنيه     | `scripts/parse/postal-codes.ts` من اللقطات الأسبوعية. يفشل البناء حين يشير رمز إلى رمز REFNIS غير موجود في `municipalities.json`، أو حين لا يكون لبلدية رمز                                            |
| يتغير حين | تنشر Statbel جدولًا جديدًا: تندمج بلديات، أو تضيف bpost رمزًا بريديًا أو تلغيه                                                                                                                             |
| يغطي      | من 1 يناير 2025 فصاعدًا: البحث عن يوم سابق يرمي `RangeError` ([الزمن](/ar/api#time)). والجدول اللاحق يعطي الأزواج التي يُسقطها `validTo` والأزواج التي يضيفها `validFrom`، في اليوم الذي يسري فيه الجدول |
| المراجعة  | كل أسبوع، بواسطة [workflow المصادر](/ar/guide/data-quality#how-the-data-is-built)                                                                                                                      |
| الترخيص   | © Statbel، [CC BY 4.0](https://statbel.fgov.be/en/cc-40)                                                                                                                                               |

تبني Statbel الجدول من مكاتب البريد لدى bpost ومن بلديات FOD Financiën / SPF Finances. ويتضمن
أيضًا اسم بلدية في كل صف، لا يُخزَّن هنا: فهو يختلف عن قائمة REFNIS الخاصة بـStatbel نفسها في بضعة
مواضع (`Tongeren-Borgloon` حيث تقول القائمة `Tongres-Looz`، و`Saint-Nicolas` لـSint-Niklaas)،
والسجل يرتبط ببلديته بدلًا من نسخ اسمها. الأسماء موجودة في `getMunicipality(record.municipality).name`.

## الرموز البريدية المشتركة {#shared-postal-codes}

للبلدية عدة رموز بريدية (لـGent عشرة)، والرمز البريدي ينتمي إلى بلدية واحدة، مع ثلاثة استثناءات:

| الرمز البريدي | البلديات                                         |
| ------------- | ------------------------------------------------ |
| `1040`        | Brussel ‏(`21004`) وEtterbeek ‏(`21005`)         |
| `1050`        | Brussel ‏(`21004`) وElsene ‏(`21009`)            |
| `1804`        | Vilvoorde ‏(`23088`) وZemst ‏(`23096`): Cargovil |

في هذه الحالات يكون الشارع هو الفيصل. تُرجع `getMunicipalitiesForPostalCode` البلديتين كلتيهما،
وتجيب `findCourtsForPostalCode` لكل بلدية على حدة، فلا يُحسم الرمز المشترك بصمت لصالح إحداهما.

## الحقول {#fields}

| الحقل                  | النوع            | الوصف                                                                                                                                         |
| ---------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                   | `PostalCodeId`   | الرمز البريدي ورمز REFNIS، موصولين: `9000-44021`. لا يسمّي أي منهما وحده سجلًا؛ ومعًا هما رسميان وفريدان. انظر [المعرّفات](/ar/guide/identifiers) |
| `validFrom`، `validTo` | string?          | الأيام التي يسري فيها الزوج، كما تعطيها جداول Statbel؛ غيابهما: منذ بداية التغطية، أو لا يزال ساريًا. انظر [الزمن](/ar/api#time)               |
| `postalCode`           | string           | الرمز البريدي المكوّن من أربعة أرقام                                                                                                           |
| `municipality`         | `MunicipalityId` | البلدية التي ينتمي إليها الرمز البريدي، برمز REFNIS                                                                                           |

```ts
interface PostalCode {
    id: PostalCodeId // '9000-44021'
    validFrom?: string
    validTo?: string
    postalCode: string // '9000'
    municipality: MunicipalityId // '44021'
}
```

## ما ليس فيها {#what-isn-t-in-it}

- **البلديات الفرعية** (deelgemeenten / sections de commune): يتوقف جدول Statbel عند البلدية.
  قائمة الرموز البريدية الخاصة بـbpost تسمّي المحليات، لكنها لا تحمل رمز REFNIS وتُنشر بموجب شروط
  استخدام bpost (جميع الحقوق محفوظة)، لا بترخيص مفتوح، لذا لا تُستخدم.
- **الشارع.** في مدينة مقسّمة على كانتونات (Antwerpen وGent وBrussel وLuik، …) يعطي الرمز البريدي
  البلدية، والبلدية تعطي عدة كانتونات؛ وعندها يكون الشارع هو الفيصل، والحدود لا توجد إلا نصًا
  قانونيًا نثريًا في `territory` كل كانتون إلى أن تضيفها
  [#29](https://github.com/pieterjanscheir/belgica/issues/29) بوصفها بيانات هندسية.

## الدوال المساعدة {#helpers}

```ts
import { getMunicipalitiesForPostalCode, getPostalCodes } from 'belgica/postal-codes'
import { findCourtsForPostalCode } from 'belgica'

getMunicipalitiesForPostalCode('9050').map((m) => m.name.nl) // ['Gent']
getMunicipalitiesForPostalCode('1040').map((m) => m.name.nl) // ['Brussel', 'Etterbeek']
getPostalCodes('44021').map((p) => p.postalCode) // ['9000', '9030', '9031', …]

// لكل بلدية: محاكم الـvredegerecht الخاصة بها، ومحاكمها من النوع المطلوب
findCourtsForPostalCode('9050', 'labour-court')
// [{ municipality: Gent, justicesOfThePeace: [gent-1 … gent-5], courts: [labour-court-gent] }]
```
