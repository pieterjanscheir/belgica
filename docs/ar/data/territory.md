<script setup>
import { judicialAreas, arrondissements, getJudicialArea, regions, provinces, getRegion } from '../../../src'
</script>

# الإقليم والكانتونات {#territory-and-cantons}

للخريطة القضائية في بلجيكا ثلاثة مستويات: **المناطق القضائية** (rechtsgebieden / ressorts، واحدة
لكل hof van beroep / cour d'appel، أي محكمة استئناف) تضم **الدوائر القضائية** (arrondissements)،
وهذه تضم **الكانتونات القضائية** (cantons، لكل منها vredegerecht / justice de paix واحد، أي محكمة
صلح). وتُعرَّف الكانتونات بدلالة **البلديات**. وإلى جانب الخريطة القضائية توجد الخريطة الإدارية:
كل بلدية تقع في **إقليم** (gewest / région)، وخارج Brussel في **مقاطعة**.

## لماذا هي مفيدة {#why-it-s-useful}

- **أي vredegerecht / justice de paix؟** نزاعات الإيجار، والمطالبات الصغيرة، والحماية القانونية
  (الوصاية)، ونزاعات الجوار تُرفع أمام الـvredegerecht / justice de paix، وعادة أمام محكمة الكانتون
  الذي يقيم فيه المدعى عليه أو يقع فيه العقار. والخطأ في الكانتون يعني دعوى مرفوعة أمام محكمة غير
  مختصة.
- **أي دائرة قضائية؟** محاكم الـrechtbank van eerste aanleg / tribunal de première instance،
  والـondernemingsrechtbank / tribunal de l'entreprise، والـarbeidsrechtbank / tribunal du
  travail، والنيابة العامة، والنطاق الذي يجوز للمحضر القضائي أن يعمل فيه، كلها منظمة حسب الدائرة
  القضائية.
- **أي محكمة استئناف؟** يُرفع الاستئناف أمام الـhof van beroep / cour d'appel للمنطقة القضائية.
- **ربط البيانات.** كل ما له رمز REFNIS (إحصاءات Statbel، والبيانات المفتوحة للأقاليم، وسجلات
  العناوين) يمكن وضعه على الخريطة القضائية.

يصف القانون الكانتونات نثرًا («جزء إقليم مدينة Antwerpen المحدود بالخطوط الوسطى لـBrouwersvliet…»). وتحوّل هذه الملفات ذلك إلى بيانات مع الاحتفاظ بالنص القانوني
للحالات التي لا يحسمها إلا النص.

## المصدر والتحديثات {#source-and-updates}

|           |                                                                                                                                                                                                                                                                                                            |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| المصدر    | ملحق Gerechtelijk Wetboek / Code judiciaire (القانون القضائي)، «Gebiedsomschrijving en zetel van hoven en rechtbanken» ([ELI، numac 1967101058](https://www.ejustice.just.fgov.be/eli/wet/1967/10/10/1967101058/justel))، بالهولندية والفرنسية؛ والبيانات المفتوحة لـStatbel للبلديات والمقاطعات والأقاليم |
| يبنيه     | `pnpm build:cantons` (الكانتونات، البلديات)؛ لقطات أسبوعية + `pnpm build:data` (الأقاليم، المقاطعات)؛ يدويًا (المناطق، الدوائر القضائية)                                                                                                                                                                    |
| يتغير حين | يعدّل قانونٌ الملحق؛ تندمج بلديات (2019، 2025)                                                                                                                                                                                                                                                               |
| يغطي      | من 1 يناير 2025 فصاعدًا: البحث عن يوم سابق يرمي `RangeError` ([الزمن](/ar/api#time))                                                                                                                                                                                                                        |
| المراجعة  | يُعاد بناؤه يدويًا بـ`pnpm build:cantons`: يرفض ejustice خوادم GitHub ([جودة البيانات](/ar/guide/data-quality))                                                                                                                                                                                              |
| الترخيص   | CC BY 4.0؛ بيانات البلديات © Statbel، ‏CC BY 4.0                                                                                                                                                                                                                                                           |

## ابحث عن كانتون بلدية {#find-the-canton-for-a-municipality}

<CantonLookup />

## المناطق القضائية {#judicial-areas}

المناطق الخمس لمحاكم الاستئناف (rechtsgebieden). الملف: `data/judicial-areas.json`. المصدر: ملحق
Gerechtelijk Wetboek ‏(Ger.W. bijvoegsel)، المادة 5.

<table>
<thead><tr><th>Id</th><th>nl</th><th>fr</th><th>de</th></tr></thead>
<tbody>
<tr v-for="a in judicialAreas" :key="a.id">
<td><code>{{ a.id }}</code></td><td>{{ a.name.nl }}</td><td>{{ a.name.fr }}</td><td>{{ a.name.de }}</td>
</tr>
</tbody>
</table>

```ts
interface JudicialArea {
    id: JudicialAreaId // 'gent'
    name: Translated // { nl, fr, de }
}
```

## الدوائر القضائية {#arrondissements}

الدوائر القضائية (arrondissements) الاثنتا عشرة. الملف: `data/arrondissements.json`. المصدر:
Ger.W. bijvoegsel، المادة 4.

<table>
<thead><tr><th>Id</th><th>nl</th><th>fr</th><th>de</th><th>المنطقة القضائية</th></tr></thead>
<tbody>
<tr v-for="a in arrondissements" :key="a.id">
<td><code>{{ a.id }}</code></td><td>{{ a.name.nl }}</td><td>{{ a.name.fr }}</td><td>{{ a.name.de }}</td>
<td>{{ getJudicialArea(a.judicialArea)?.name.nl }}</td>
</tr>
</tbody>
</table>

```ts
interface Arrondissement {
    id: ArrondissementId // 'oost-vlaanderen'
    name: Translated
    judicialArea: JudicialAreaId
}
```

## الكانتونات {#cantons}

الكانتونات القضائية الـ162 كلها: لكل منها نطاق vredegerecht / justice de paix واحد. الملف:
`data/cantons.json` (مولَّد من ملحق Gerechtelijk Wetboek، المادة 1).

### الحقول {#fields}

| الحقل            | النوع                          | الوصف                                                                                                   |
| ---------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `id`             | `CantonId`                     | معرّف ثابت باللغة المحلية، مع رقم للأماكن التي فيها عدة كانتونات: `gent-1`، `merelbeke-melle`، `wavre-1` |
| `arrondissement` | string                         | معرّف الدائرة القضائية                                                                                   |
| `name`           | `{ nl, fr }`                   | اسم الكانتون كما يورده الملحق                                                                           |
| `number`         | number?                        | رقم الكانتون في الأماكن التي فيها عدة كانتونات (Gent 1–5)                                               |
| `seat`           | `{ nl, fr }`                   | مقر الـvredegerecht / justice de paix؛ قد يختلف عن الاسم                                                |
| `municipalities` | `{ municipality, partial? }[]` | البلديات المشمولة، برمز REFNIS؛ و`partial: true` حين لا يُشمل إلا جزء منها                               |
| `territory`      | `{ nl, fr }`                   | نطاق الكانتون، حرفيًا من الملحق                                                                          |
| `legalBasis`     | `{ url, provision }`           | حيث يعرّفه القانون: ELI الملحق والقسم، مثل `Bijvoegsel art. 1, afdeling 6.15` ‏(Gent 4)                  |

```ts
interface Canton {
    id: CantonId // 'gent-1', 'merelbeke-melle'
    arrondissement: ArrondissementId
    name: Bilingual // { nl, fr }؛ عادة المقر، لكن ليس دائمًا
    number?: number // للأماكن التي فيها عدة كانتونات (Gent 1–5، …)
    seat: Bilingual // مقر الـvredegerecht / justice de paix
    municipalities: { municipality: MunicipalityId; partial?: boolean }[]
    territory: Bilingual // نطاق الكانتون، حرفيًا من الملحق
    legalBasis: { url: string; provision: string } // ELI الملحق، والقسم
}
```

- **المعرّفات** تتبع اللغة المحلية: الهولندية في Vlaanderen وBrussel، والفرنسية في Wallonie،
  والألمانية حول Eupen؛ وBrussel، ثنائية اللغة، تأخذ الاسم الهولندي. انظر [المعرّفات](/ar/guide/identifiers).
  يرتبط الـvredegerecht / justice de paix بكانتونه عبر حقله `canton`.
- **قد يختلف الاسم عن المقر**: الكانتون `oudergem` مقره في Etterbeek.
- **`partial: true`** يميّز بلدية مقسّمة على عدة كانتونات. وعندها يقول نص `territory` أي جزء
  (شوارع، أرقام، مجارٍ مائية) ينتمي إلى هذا الكانتون.
- الأسماء بالهولندية والفرنسية فقط: لا يتضمن الملحق نصًا ألمانيًا موحدًا.

### البلديات المقسّمة {#split-municipalities}

55 كانتونًا لا تغطي إلا جزءًا من بلدية. في هذه الحالات لا يمكن تحديد الكانتون من البلدية وحدها:
فهو يتوقف على الشارع (وأحيانًا على رقم المنزل). ويسمّي نص `territory` الحدود. وإذا توفرت إحداثيات
العنوان، تجد `findCantonsAt(lon, lat)` من `belgica/canton-boundaries` الكانتون في
[حدود الكانتونات](./canton-boundaries) الخاصة بـNGI؛ وإلا فاعرض الكانتونات المرشحة ونصوصها، ودع
شخصًا يقرر. وحيث تختلف الهندسة عن النص، فالنص هو القانون.

## البلديات {#municipalities}

البلديات الـ565 مع رمز REFNIS ‏(NIS) الخاص بها لدى Statbel. الملف: `data/municipalities.json`
(مولَّد من Statbel). © Statbel، ‏CC BY 4.0.

```ts
interface Municipality {
    id: MunicipalityId // رمز REFNIS: '44021' لـGent
    name: Bilingual
    province: ProvinceId | '04000' // رمز REFNIS للمقاطعة؛ '04000' في Brussel
    region: RegionId // رمز REFNIS للإقليم
}
```

ليس للبلديات الـ19 في إقليم Brussel العاصمة (Brussels Hoofdstedelijk Gewest / Région de
Bruxelles-Capitale) مقاطعة. قيمة `province` فيها هي `04000`، رمز الإقليم، وهذا ما تضعه Statbel في
عمود المقاطعة في ملفاتها، وتُرجع `getProvinceForMunicipality` لها `undefined`؛ أما
`getRegionForMunicipality` فتعطي الإقليم. الرموز مسرودة أدناه، من البيانات.

## الأقاليم {#regions}

الأقاليم الثلاثة (gewesten / régions). الملف: `data/regions.json` (مولَّد من قائمة رموز REFNIS لدى
Statbel؛ والأسماء كما تنشرها Statbel). © Statbel، ‏CC BY 4.0.

<table>
<thead><tr><th>Id (REFNIS)</th><th>nl</th><th>fr</th><th>de</th></tr></thead>
<tbody>
<tr v-for="r in regions" :key="r.id">
<td><code>{{ r.id }}</code></td><td>{{ r.name.nl }}</td><td>{{ r.name.fr }}</td><td>{{ r.name.de }}</td>
</tr>
</tbody>
</table>

```ts
interface Region {
    id: RegionId // رمز REFNIS: '02000'، '03000'، '04000'
    name: Translated // { nl, fr, de }، كما تنشرها Statbel
    sources: SourceRef[] // قائمة رموز REFNIS لدى Statbel
}
```

## المقاطعات {#provinces}

المقاطعات العشر، مع إقليم كل منها. الملف: `data/provinces.json` (مولَّد من قائمة رموز REFNIS لدى
Statbel). © Statbel، ‏CC BY 4.0. ليس لإقليم Brussel العاصمة مقاطعة؛ ومقاطعة Brabant، التي انتهت في
31 ديسمبر 1994، سابقة لتغطية البيانات.

<table>
<thead><tr><th>Id (REFNIS)</th><th>nl</th><th>fr</th><th>de</th><th>الإقليم</th></tr></thead>
<tbody>
<tr v-for="p in provinces" :key="p.id">
<td><code>{{ p.id }}</code></td><td>{{ p.name.nl }}</td><td>{{ p.name.fr }}</td><td>{{ p.name.de }}</td>
<td>{{ getRegion(p.region).name.nl }}</td>
</tr>
</tbody>
</table>

```ts
interface Province {
    id: ProvinceId // رمز REFNIS: '40000' لـOost-Vlaanderen
    name: Translated // { nl, fr, de }، كما تنشرها Statbel
    region: RegionId
    sources: SourceRef[] // قائمة رموز REFNIS لدى Statbel
}
```

الأسماء هي أسماء Statbel، بما فيها الكلمة الدالة على نوع الوحدة (`Provincie Oost-Vlaanderen`،
`Province de Flandre orientale`، `Provinz Ostflandern`): تخزّن الحزمة القيم كما ينشرها المصدر، ولا
تختصرها.
