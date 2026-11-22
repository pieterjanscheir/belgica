<script setup>
import { data as stats } from '../../.vitepress/stats.data'

const labels = {
    'justice-of-the-peace': 'Vredegerecht / Justice de paix',
    'police-court': 'Politierechtbank / Tribunal de police',
    'court-of-first-instance': 'Rechtbank van eerste aanleg / Tribunal de première instance',
    'enterprise-court': "Ondernemingsrechtbank / Tribunal de l'entreprise",
    'labour-court': 'Arbeidsrechtbank / Tribunal du travail',
    'court-of-appeal': "Hof van beroep / Cour d'appel",
    'labour-court-of-appeal': 'Arbeidshof / Cour du travail',
    'court-of-assize': "Hof van assisen / Cour d'assises",
}

const areas = {
    'justice-of-the-peace': 'كانتون؛ ومحكمة Philippeville لها مقران',
    'police-court': 'دائرة قضائية (Brussel مقسّمة حسب اللغة، Halle، Vilvoorde)',
    'court-of-first-instance': 'دائرة قضائية (Brussel مقسّمة حسب اللغة)',
    'enterprise-court': 'دائرة قضائية، أو نطاق hof van beroep / cour d\'appel',
    'labour-court': 'دائرة قضائية، أو نطاق hof van beroep / cour d\'appel',
    'court-of-appeal': 'منطقة قضائية',
    'labour-court-of-appeal': 'منطقة قضائية',
    'court-of-assize': 'مقاطعة، أو Brussel العاصمة',
}
</script>

# المحاكم {#courts}

الملف: `data/courts.json`. كل محكمة من محاكم السلطة القضائية تدرجها بوابة المحاكم نفسها،
[tribunaux-rechtbanken.be](https://www.tribunaux-rechtbanken.be): {{ stats.courts.total }} سجلًا
ساريًا اليوم<span v-if="stats.courts.retired">، و{{ stats.courts.retired }} نسخة منتهية لم تعد
البوابة تدرجها</span>. الأرقام في هذه الصفحة محسوبة من البيانات عند بناء الموقع.

<table>
<thead><tr><th>الصنف</th><th style="text-align:right">المحاكم</th><th style="text-align:right">الأقسام أو المقار</th><th>النطاق</th></tr></thead>
<tbody>
<tr v-for="t in stats.courts.byType" :key="t.type">
<td>{{ labels[t.type] }}</td><td style="text-align:right">{{ t.courts }}</td><td style="text-align:right">{{ t.divisions }}</td><td>{{ areas[t.type] }}</td>
</tr>
</tbody>
</table>

ليست على البوابة، فليست هنا بعد: Hof van Cassatie / Cour de cassation (محكمة النقض)،
وGrondwettelijk Hof / Cour constitutionnelle (المحكمة الدستورية)، وRaad van State / Conseil
d'État (مجلس الدولة)، والمحاكم التأديبية.

## لماذا هي مفيدة {#why-it-s-useful}

- **توجيه الوثائق.** صحف الاستدعاء والعرائض والمذكرات تسمّي المحكمة كما تسمّي نفسها؛ والرسائل
  والإيداعات تذهب إلى قلم المحكمة (griffie / greffe) في عنوانه.
- **الاتصال بالقلم الصحيح.** للمحاكم الأكبر قلم لكل مادة (مدني، جزائي، أسرة، سجل الأشخاص
  الاعتباريين…)، لكل منها رقم هاتفه وبريده الإلكتروني وأحيانًا حسابه المصرفي. البيانات تفصل بينها،
  بالتسميات التي تستخدمها المحكمة.
- **دفع الرسوم.** الأقلام التي تنشر حسابًا مصرفيًا لرسوم المحكمة والودائع تجده في البيانات، مع
  التحقق من رقم التحقق.
- **بناء النماذج.** تحتاج قوائم اختيار المحاكم إلى قائمة كاملة بمعرّفات ثابتة، مرتبطة بالكانتونات
  والدوائر القضائية والمناطق القضائية، وبالمحكمة التي ينتمي إليها القسم.
- **الربط بالاجتهاد القضائي.** يعطي `ecli` الرمز الذي تحمله أحكام المحكمة في European Case Law
  Identifier ‏(`ECLI:BE:HBGNT:…`).

## المصدر والتحديثات {#source-and-updates}

|           |                                                                                                                                              |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| المصدر    | [tribunaux-rechtbanken.be](https://www.tribunaux-rechtbanken.be)، بوابة College van de hoven en rechtbanken / Collège des cours et tribunaux |
| يبنيه     | `scripts/parse` من لقطات أسبوعية لصفحة كل محكمة وصفحة الاتصال بها                                                                            |
| يتغير حين | تنتقل محكمة، أو تغيّر بيانات الاتصال أو مواعيد العمل، أو تضيف البوابة محكمة أو تعيد تسميتها                                                   |
| المراجعة  | كل أسبوع، بواسطة [workflow المصادر](/ar/guide/data-quality#how-the-data-is-built)؛ وتصل التغييرات في شكل pull request                        |

يسرد كل سجل الصفحات التي قُرئ منها واليوم الذي رُئي فيه محتوى كل صفحة أول مرة (`sources`). بيانات
الاتصال تتغير أكثر من أي شيء آخر في هذه الحزمة: حين يكون الأمر مهمًا، راجع صفحة المحكمة
(`website`).

<CourtList />

## الحقول {#fields}

| الحقل              | النوع                                 | الوصف                                                                                                                                                                                                                                                                                                                                  |
| ------------------ | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`               | `CourtId`                             | معرّف ثابت: الـ`type`، ثم المكان بلغة المحكمة: `justice-of-the-peace-gent-1`، `police-court-brussel-fr`، `enterprise-court-gent-brugge`. انظر [المعرّفات](/ar/guide/identifiers)                                                                                                                                                         |
| `validFrom`        | string?                               | أول يوم يسري فيه السجل، `YYYY-MM-DD`: اليوم الذي أدرجته فيه البوابة أول مرة. غيابه: منذ بداية التغطية                                                                                                                                                                                                                                  |
| `validTo`          | string?                               | آخر يوم يسري فيه السجل: اليوم السابق للفحص الأسبوعي الذي وجده غائبًا عن البوابة. غيابه: لا يزال ساريًا                                                                                                                                                                                                                                   |
| `type`             | `CourtType`                           | `justice-of-the-peace`، `police-court`، `court-of-first-instance`، `enterprise-court`، `labour-court`، `court-of-appeal`، `labour-court-of-appeal`، `court-of-assize`                                                                                                                                                                  |
| `kind`             | `'court'` \| `'division'` \| `'seat'` | المحكمة نفسها، أو أحد أقسامها (afdeling / division / Abteilung)، أو أحد الأماكن التي يجلس فيها vredegerecht / justice de paix                                                                                                                                                                                                          |
| `court`            | `CourtId`?                            | للقسم أو المقر: المحكمة التي ينتمي إليها                                                                                                                                                                                                                                                                                               |
| `name`             | `{ nl?, fr?, de? }`                   | الاسم كما تنشره المحكمة، بكل لغة لها فيها صفحة: `Vredegerecht Gent 1`، `Tribunal de l'entreprise du Hainaut - division Mons`                                                                                                                                                                                                           |
| `judicialArea`     | `JudicialAreaId`                      | المنطقة القضائية                                                                                                                                                                                                                                                                                                                       |
| `arrondissement`   | `ArrondissementId`?                   | الدائرة القضائية، للمحكمة أو القسم الذي يكون نطاقه دائرة قضائية واحدة أو يقع داخلها                                                                                                                                                                                                                                                    |
| `canton`           | `CantonId`?                           | للـvredegerecht / justice de paix: الكانتون الذي يخدمه                                                                                                                                                                                                                                                                                 |
| `cantons`          | `CantonId[]`?                         | لكل محكمة أخرى: الكانتونات التي تغطيها، كما يحددها ملحق Gerechtelijk Wetboek / Code judiciaire (المواد 3–5) والمادة 114 منه. وللقسم: الكانتونات الواقعة كلها في نطاقه، كما تحدده المراسيم الملكية الصادرة بموجب المادة 186 منه (انظر [الأقسام](#divisions))؛ وهو النطاق في القضايا المدنية حين يحدد المرسوم نطاقًا آخر للقضايا الجزائية |
| `municipalities`   | `MunicipalityId[]`?                   | للقسم الذي لا يأخذ نطاقه إلا جزءًا من كانتون: تلك البلديات، برمز REFNIS                                                                                                                                                                                                                                                                 |
| `criminalArea`     | `{ cantons?, municipalities? }`?      | للقسم الذي يحدد مرسومه للقضايا الجزائية نطاقًا غير نطاق القضايا المدنية: نطاقه في القضايا الجزائية، ويُقرأ كما يُقرأ `cantons` و`municipalities`. يغيب حين يكون للقسم نطاق واحد لكليهما                                                                                                                                                   |
| `ecli`             | `string[]`?                           | رموز ECLI للمحكمة، واحد لكل لغة تقضي بها؛ ولا يشمل إلا الرموز التي رُئيت في أحكام منشورة                                                                                                                                                                                                                                                |
| `address`          | `Address`?                            | مكان قلم المحكمة، مع البلدية التي ينتمي إليها رمزه البريدي (`municipality`، برمز REFNIS). يغيب حين لا تنشر المحكمة عنوانًا واحدًا (محكمة لكل قسم من أقسامها عنوانه الخاص)                                                                                                                                                                |
| `contacts`         | `Contact[]`                           | الهاتف والفاكس والبريد الإلكتروني والحساب المصرفي، كل منها مع القلم الذي ينتمي إليه (`label`) والنص المنشور معه (`note`)                                                                                                                                                                                                               |
| `openingHours`     | string?                               | مواعيد عمل القلم بصياغة [`opening_hours`](https://wiki.openstreetmap.org/wiki/Key:opening_hours) في OpenStreetMap: `Mo-Fr 08:30-12:30,13:30-16:00`، فقط حين يقول النص المنشور ذلك بالضبط                                                                                                                                               |
| `openingHoursText` | `{ nl?, fr?, de? }`?                  | مواعيد العمل كما نُشرت، لكل لغة                                                                                                                                                                                                                                                                                                         |
| `website`          | `{ nl?, fr?, de? }`                   | صفحة المحكمة على البوابة، لكل لغة                                                                                                                                                                                                                                                                                                      |
| `sources`          | `{ url, retrieved }[]`                | الصفحات التي قُرئ منها السجل، ومتى رُئي محتواها أول مرة                                                                                                                                                                                                                                                                                  |

::: tip أنواع محاكم جديدة
قد تُضاف قيم إلى `type` (مثل Hof van Cassatie / Cour de cassation). إذا استخدمت `switch` عليه،
فاحتفظ بفرع `default` حتى لا يعطّل نوع جديد الكود الخاص بك.
:::

## البنية {#shape}

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
    street: string // كما نُشر، مع الرقم أو الصندوق أو الطابق: 'Beverstraat 7B (eerste verdieping)'
    postalCode: string
    city: string
    municipality?: MunicipalityId // عبر الرمز البريدي؛ انظر صفحة الرموز البريدية
}

interface Contact {
    type: 'phone' | 'fax' | 'email' | 'bank-account'
    value: string // معياري: E.164، بريد إلكتروني بأحرف صغيرة، IBAN إلكتروني
    label?: string // القلم أو المصلحة: 'Burgerlijke griffie'، 'Greffe pénal'
    note?: string // النص المنشور مع القيمة: 'druk 1'، 'tapez 2'
}
```

## الأقسام {#divisions}

يمكن أن تُقسَّم محكمة من نوع rechtbank van eerste aanleg / tribunal de première instance أو
ondernemingsrechtbank / tribunal de l'entreprise أو arbeidsrechtbank / tribunal du travail أو
arbeidshof / cour du travail أو politierechtbank / tribunal de police إلى أقسام (afdelingen /
divisions): حيث يُودَع الطلب، وحيث تُعقد الجلسة. وقسم الـondernemingsrechtbank / tribunal de
l'entreprise هو أيضًا القسم المذكور في بيان سجل الأشخاص الاعتباريين على وثائق الشركات («RPR Gent,
afdeling Brugge»). يحدد نطاقَ كل قسم مرسومٌ ملكي صادر بموجب المادة 186 من Gerechtelijk Wetboek /
Code judiciaire: مرسوم 14 مارس 2014، أو، لمحاكم كثيرة منذ ذلك الحين، مرسوم توزيع القضايا الخاص
بالمحكمة (zaakverdelingsreglement). وقد غيّرت إصلاحات الكانتونات في 2017–2019 واندماجات البلديات في
2025 كليهما.

لكل قسم نطاقه في `cantons`: الكانتونات الواقعة كلها فيه. وحين يقسّم مرسومٌ كانتونًا، يسرد القسم في
`municipalities` البلديات التي يأخذها منه. فمحكمة الـarbeidsrechtbank / tribunal du travail في
Hainaut تُسند Pont-à-Celles (كانتون Seneffe) إلى Charleroi، وErquelinnes وMerbes-le-Château
(كانتون Chimay) إلى Binche. ومحكمة الـrechtbank van eerste aanleg / tribunal de première instance
في Liège (منذ 2024) ومحكمتا الـpolitierechtbank / tribunal de police في Limburg وLiège تعطي أقسامها
قوائم بلديات بدلًا من كانتونات. تنتمي البلدية إلى القسم الذي يذكرها في `municipalities`، وإلا فإلى
القسم الذي له كانتونها. و`findDivisionsWithJurisdiction` تجري هذا البحث.

### القضايا المدنية والجزائية {#civil-and-criminal-cases}

يمكن أن يحدد مرسومٌ نطاقًا للقضايا المدنية وآخر للقضايا الجزائية. وهذا ما تفعله محكمة الـrechtbank
van eerste aanleg / tribunal de première instance ومحكمة الـpolitierechtbank / tribunal de police
في Antwerpen، في مرسومَيهما المؤرخين 16 ديسمبر 2020: في القضايا المدنية يذهب كانتون
Heist-op-den-Berg كله إلى قسم Mechelen، وفي القضايا الجزائية (مع الدعاوى المدنية التي تُنظر فيها)
تذهب بلديتاه Hulshout وHerenthout إلى Turnhout.

وعندها يكون `cantons` و`municipalities` النطاقَ في القضايا المدنية، ويكون نطاق القسم في القضايا
الجزائية في `criminalArea`، بالحقلين نفسيهما:

```ts
getCourt('police-court-antwerpen-turnhout').criminalArea
// { cantons: ['mol-geel-1', 'mol-geel-2', 'turnhout-1', 'turnhout-2', 'westerlo'],
//   municipalities: ['13012', '13016'] }   Herenthout وHulshout
```

لا يكون `criminalArea` إلا لقسم يختلف نطاقاه: أربعة أقسام اليوم، Mechelen وTurnhout في كلتا
المحكمتين. ولكل قسم آخر يسري النطاق الواحد على كليهما. وتأخذ `findDivisionsWithJurisdiction` نوع
القضية في `matter`:

```ts
const ids = (options?: DivisionOptions) =>
    findDivisionsWithJurisdiction('13016', 'police-court', options).map((d) => d.id)
ids({ matter: 'civil' }) // ['police-court-antwerpen-mechelen']
ids({ matter: 'criminal' }) // ['police-court-antwerpen-turnhout']
ids() // كلاهما، والمدني أولًا: نوع القضية هو الفيصل
```

### المصادر {#sources}

النطاقات هي النص الساري، موحَّدًا يدويًا من المنشورات في Belgisch Staatsblad / Moniteur belge
(الجريدة الرسمية البلجيكية) التي يذكرها كل قسم في `sources`: المرسوم الذي يحدد النطاق وكل مرسوم
لاحق غيّره. وقد قُرئت نطاقات محاكم الـpolitierechtbank / tribunal de police من النصوص الموحدة في
Justel. ويتحقق اختبار من أن أقسام المحكمة تغطي نطاقها مرة واحدة، في القضايا المدنية وفي القضايا
الجزائية.

ويمكن أن يُسند مرسومٌ أيضًا نوعًا واحدًا من القضايا إلى قسم واحد للمحكمة كلها: التسويات الجماعية
للديون لدى محكمة الـarbeidsrechtbank / tribunal du travail في Hainaut، أو المخالفات الداخلة في
اختصاص محاكم الـarbeidsrechtbank / tribunal du travail لدى محكمة الـpolitierechtbank / tribunal de
police في Liège. هذه القواعد ليست في البيانات.

## الدوال المساعدة {#helpers}

```ts
getCourt('justice-of-the-peace-gent-1')
getJusticeOfThePeace('gent-1') // المحكمة نفسها، بمعرّف الكانتون
getDivisions('enterprise-court-gent') // أقسامها الثمانية
getCourtsForCanton('gent-1') // الـvredegerecht الخاص به، ومحكمة واحدة من كل نوع آخر
findCourtsWithJurisdiction('23088', 'police-court') // [police-court-vilvoorde]، برمز REFNIS
findDivisionsWithJurisdiction('31005', 'enterprise-court') // [enterprise-court-gent-brugge]
findDivisionsWithJurisdiction('44021', 'police-court') // [police-court-oost-vlaanderen-gent]
findCourts({ type: 'police-court', kind: 'court', judicialArea: 'gent' })
getContact(court, 'email', 'Greffe pénal') // قيمة أول جهة اتصال مطابقة
formatPhoneNumber('+3253820701') // '053 82 07 01'
formatIban('BE73679200844560') // 'BE73 6792 0084 4560'
```

## كيف تُقرأ البيانات {#how-the-data-is-read}

للبوابة صفحة لكل محكمة ولكل قسم، بلغة المحكمة؛ وللمحاكم الثنائية اللغة في Brussel صفحة بالهولندية
وأخرى بالفرنسية، وللمحاكم في Eupen صفحة بالفرنسية وأخرى بالألمانية. المحلّل:

1. يقرأ نوع المحكمة ومكانها من اسمها (`Politierechtbank Limburg - afdeling Genk`)، وكانتون
   الـvredegerecht / justice de paix من اسمه ورقمه؛
2. يدمج النسخ اللغوية لمحكمة واحدة في سجل واحد: الأسماء والصفحات ومواعيد العمل لكل لغة؛ والعنوان
   وبيانات الاتصال من اللغة الأولى (الهولندية في Brussel، والألمانية في Eupen)، مع أي قيمة لا توجد
   إلا في الصفحة الأخرى؛
3. يقرأ كتل بيانات الاتصال بالأقلام، محتفظًا بكل قيمة مع قلمها؛
4. يحوّل مواعيد العمل المنشورة إلى صياغة `opening_hours` فقط حين تُفهم كل كلمة وتقول كل اللغات
   الشيء نفسه. أما النص الذي فيه ملاحظة أو ترتيب مؤقت («OPGELET: tot 31 december…») فلا يُحفظ منه
   إلا النص المنشور؛
5. يعطي كل محكمة الكانتونات التي يسندها إليها القانون (`cantons`)، من جدول لملحق Gerechtelijk
   Wetboek / Code judiciaire في `scripts/parse/jurisdictions.ts`، ويشتق منها `arrondissement`
   الخاص بها. الجدول والبوابة يتحقق كل منهما من الآخر: محكمة على البوابة يفتقدها جدول القانون، أو
   العكس، توقف البناء.

يرفض كتابة أي شيء حين لا يمكن تصنيف صفحة (صنف محكمة مجهول، vredegerecht / justice de paix بلا
كانتون)، أو لا يكون لكانتون محكمة، أو يختلف جدول القانون والبوابة على المحاكم الموجودة. وما لا
يستطيع قراءته (رقم هاتف بلا رمز منطقة، عنوان مكتوب على شكل جملة) يُبلَّغ عنه مع الـpull request
الأسبوعي، ويُترك خارج البيانات بدلًا من تخمينه.

## القيم المعيارية {#canonical-values}

| القيمة            | تُخزَّن بصيغة                                       | السبب                                                                                                                                          |
| ----------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| رقم الهاتف        | E.164: `+3253820701`                             | صيغة واحدة لكل رقم، قابلة للاتصال من أي مكان، وروابط `tel:` تعمل كما هي                                                                        |
| IBAN              | الصيغة الإلكترونية: `BE73679200844560`           | الصيغة التي تقبلها أنظمة الدفع؛ ويُتحقق من رقم التحقق عند القراءة وفي الاختبارات                                                                |
| البريد الإلكتروني | أحرف صغيرة                                       | تنجح المقارنات وإزالة التكرار                                                                                                                  |
| مواعيد العمل      | `opening_hours`: `Mo-Fr 08:30-12:30,13:30-16:00` | معيار OpenStreetMap، مع محلّلات بلغات كثيرة (مثل [opening_hours.js](https://github.com/opening-hours/opening_hours.js)) وبلا لغة طبيعية خاصة به |
| الشارع            | كما نُشر                                          | الأرقام والصناديق والطوابق تُكتب بطرق كثيرة جدًا (`Canadaplein ZN`، `Rue de Bruxelles 2 - 3`) بحيث لا يمكن تقسيمها دون تخمين                     |
