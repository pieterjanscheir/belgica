# حدود الكانتونات {#canton-boundaries}

<script setup>
import { data as stats } from '../../.vitepress/stats.data'

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`
const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`
</script>

الملف: `data/canton-boundaries.json`. حدود كل كانتون من الكانتونات القضائية الـ{{ stats.cantons }}
بوصفها هندسة GeoJSON، كما رقمنها NGI (المعهد الجغرافي الوطني) من ملحق Gerechtelijk Wetboek /
Code judiciaire (القانون القضائي).

## لماذا هي مفيدة {#why-it-s-useful}

- **كانتون عنوان في مدينة مقسّمة.** {{ stats.splitCantons }} كانتونًا لا تغطي إلا جزءًا من بلدية
  (Antwerpen وGent وBrussel وLuik وCharleroi، …)، ولا تستطيع `getCantonsForMunicipality` إلا سرد
  المرشحين. وإذا حُوِّل العنوان إلى إحداثيات (geocoding)، تعطي `findCantonsAt(lon, lat)` الكانتون
  الوحيد، ومن ثم الـvredegerecht / justice de paix (محكمة الصلح).
- **الخرائط.** الهندسة GeoJSON قياسي بنظام WGS 84: ارسم الكانتونات على خريطة، أو اربطها ببيانات
  جغرافية أخرى، أو حمّلها في PostGIS أو QGIS أو جدول بيانات فيه خريطة.
- **التحقق من النص القانوني.** مضلّعات NGI قراءة ثانية للملحق نفسه، إلى جانب نص `territory` لكل
  كانتون.

::: warning النص القانوني هو الغالب
الحد هو تفسير NGI لملحق Gerechtelijk Wetboek / Code judiciaire، مرقمنًا على حدود البلديات
المساحية (cadastrale) والمجاري المائية والطرق. أما الملحق نفسه، المقتبس حرفيًا في `territory` كل
كانتون، فهو القانون. للنقطة القريبة من خط حد، اقرأ النص؛ فهو يسمّي الشوارع وأرقام المنازل.
:::

## المصدر والتحديثات {#source-and-updates}

|           |                                                                                                                                                                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| المصدر    | NGI، [Judicial cantons and arrondissements](https://www.geo.be/catalog/details/e1f61c40-623a-11eb-9e7c-186571a04de3) ‏(Territorial Divisions) على geo.be: ملف GeoPackage بنظام WGS 84 ‏(EPSG:4326)، نوع الميزة `judicialcanton`، بمراجعة 16 يوليو 2026 |
| الترخيص   | © NGI، [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)                                                                                                                                                                                       |
| يبنيه     | `scripts/parse/boundaries.ts` من اللقطة الأسبوعية لملف GeoPackage                                                                                                                                                                                      |
| يتغير حين | ينشر NGI نسخة جديدة: كل سنة، حين تُحدَّث حدود البلديات لدى FOD Financiën / SPF Finances، أو حين يغيّر قانونٌ الملحق                                                                                                                                         |
| يغطي      | من 21 أكتوبر 2026 فصاعدًا، وهو يوم أول قراءة للملف: البحث عن يوم سابق يرمي `RangeError` ([الزمن](/ar/api#time))                                                                                                                                         |
| المراجعة  | كل أسبوع، بواسطة [workflow المصادر](/ar/guide/data-quality#how-the-data-is-built): يفشل البناء حين لا يكون لكانتون حد أو لا يطابق حدٌّ أي كانتون                                                                                                         |

كيف رسم NGI الحدود، بكلماته: حيث يشير الملحق إلى حدود البلديات، استخدم الحدود المساحية لدى FOD
Financiën / SPF Finances؛ وحيث يشير إلى مجارٍ مائية أو طرق، استخدم بياناته الطبوغرافية الخاصة؛
وحيث يشير إلى بلديات سابقة، استخدم حدوده لتلك البلديات. المقياس 1:10 000.

## الحقول {#fields}

| الحقل                  | النوع                  | الوصف                                                                                                                                                 |
| ---------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                   | `CantonId`             | معرّف الكانتون: للكانتون حد واحد، يأخذ مفتاحه                                                                                                          |
| `validFrom`، `validTo` | string?                | الأيام التي يسري فيها السجل؛ غيابهما: منذ بداية التغطية، أو لا يزال ساريًا. انظر [الزمن](/ar/api#time)                                                 |
| `canton`               | `CantonId`             | الكانتون الذي ينتمي إليه الحد                                                                                                                         |
| `ngiId`                | string                 | معرّف الكائن لدى NGI (قيمة `tgid`)، وهو GUID                                                                                                           |
| `cantonCode`           | `{ nl, fr }`           | رمز الكانتون في بيانات NGI: ستة أرقام (`248112` لـGent 1)، مع بادئة `N` أو `F` لكل لغة في Brussel العاصمة وفي Sint-Genesius-Rode ‏(`N238104`)         |
| `geometry`             | `MultiPolygon`         | GeoJSON ‏([RFC 7946](https://www.rfc-editor.org/rfc/rfc7946)): نظام WGS 84، خط الطول أولًا، والحلقات الخارجية عكس اتجاه عقارب الساعة، والثقوب باتجاهها |
| `sources`              | `{ url, retrieved }[]` | ملف NGI الذي قُرئ منه السجل                                                                                                                            |

```ts
interface CantonBoundary {
    id: CantonId // 'gent-1'
    canton: CantonId // 'gent-1'
    ngiId: string // '{3905ED53-F233-4C4E-8225-4E43FEC7C541}'
    cantonCode: Bilingual // { nl: '248114', fr: '248114' }
    geometry: MultiPolygon // { type: 'MultiPolygon', coordinates: [[[[lon, lat], …]]] }
    sources: SourceRef[]
}
```

الهندسة هي هندسة NGI، رأسًا برأس: لا شيء مبسَّط. الإحداثيات مقرّبة إلى 7 منازل عشرية، أي نحو
سنتيمتر، وهو دون دقة المصدر نفسه. وكل حد `MultiPolygon` واحد، حتى حين يتكون من مضلّع واحد، فيكون
لكل السجلات البنية نفسها.

### كيف تُطابَق الكانتونات مع ميزات NGI {#how-cantons-are-matched-to-the-ngi-s-features}

يسمّي NGI كل ميزة (feature) بالهولندية والفرنسية (`Eerste gerechtelijk kanton Gent`،
`Premier canton judiciaire de Gand`). تكون الميزة حدَّ كانتون حين يعطي كلا الاسمين، بعد تحويلهما
إلى معرّف [بالطريقة المعتادة](/ar/guide/identifiers)، ذلك الكانتون ويتفقان على رقمه. سبع ميزات
مسمّاة باسمها المحلي في اللغتين حيث يستخدم الملحق اسمًا أجنبيًا (`Canton judiciaire de Halle`، حيث
يقول الملحق `Hal`؛ `Gerechtelijk kanton Huy`، حيث يقول `Hoei`)؛ وهذه تُربط برمز كانتونها في
`CANTON_ALIASES` في المحلّل. وأي شيء آخر يوقف البناء.

## الحجم {#size}

الحدود هي أكبر مجموعة بيانات بفارق كبير: نحو مليون موضع. لها entry point خاص بها،
`belgica/canton-boundaries`، ولا يعيد جذر الحزمة تصديرها، فلا شيء يحمّلها ما لم يطلبها:

<table v-if="stats.sizes">
<thead><tr><th>Entry point</th><th style="text-align:right">JavaScript المحمَّل</th><th style="text-align:right">gzip</th></tr></thead>
<tbody>
<tr v-for="s in stats.sizes.filter((s) => s.entry === 'belgica' || s.entry.endsWith('canton-boundaries'))" :key="s.entry">
<td><code>{{ s.entry }}</code></td><td style="text-align:right">{{ mb(s.raw) }}</td><td style="text-align:right">{{ mb(s.gzip) }}</td>
</tr>
</tbody>
</table>
<p v-else class="bld-muted">تُقاس الأحجام من البناء عند بناء الموقع (شغّل <code>pnpm build</code> أولًا).</p>

الملف الخام، `data/canton-boundaries.json`، موجود في حزمة npm وفي كل إصدار، فتستطيع Python
وPostGIS وأدوات GIS قراءته دون JavaScript.

## إيجاد كانتون نقطة {#finding-the-canton-of-a-point}

```ts
import { findCantonsAt, getCantonBoundary } from 'belgica/canton-boundaries'
import { getJusticeOfThePeace } from 'belgica/courts'

// خط الطول أولًا، ثم خط العرض، كما يرتبهما GeoJSON
const [canton] = findCantonsAt(3.7268, 51.053) // Sint-Baafskathedraal, Gent → gent-1
getJusticeOfThePeace(canton.id).address // أين تودع

findCantonsAt(2.3522, 48.8566) // [] : Paris، خارج بلجيكا
getCantonBoundary('gent-1').geometry // الـMultiPolygon
```

تُرجع `findCantonsAt` كانتونًا واحدًا لنقطة في بلجيكا، ولا شيء لنقطة خارجها، والكانتونين كليهما
لنقطة تقع تمامًا على الخط الفاصل بينهما. لا تحتاج إلى أي تبعية: اختبار point-in-polygon بسيط على
الحدود، نحو ميلي ثانية لكل بحث. أما تحويل العنوان إلى إحداثيات (الشارع والرقم إلى إحداثيات) فعليك:
سجلات العناوين في الأقاليم (Adressenregister في Vlaanderen، وUrbIS في Brussel، وICAR في Wallonie)
وبيانات العناوين الاتحادية BeSt على geo.be تقوم بذلك.

## بلغات أخرى {#in-other-languages}

الملف هندسة GeoJSON بسيطة لكل سجل، فيقرؤه أي نظام GIS. في Python مع Shapely:

```python
import json
from shapely.geometry import Point, shape

boundaries = json.load(open("data/canton-boundaries.json"))
polygons = {b["canton"]: shape(b["geometry"]) for b in boundaries}

def cantons_at(lon: float, lat: float) -> list[str]:
    point = Point(lon, lat)
    return [canton for canton, polygon in polygons.items() if polygon.covers(point)]

cantons_at(3.7268, 51.053)  # ['gent-1']
```
