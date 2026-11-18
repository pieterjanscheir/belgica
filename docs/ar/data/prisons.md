# السجون {#prisons}

<script setup>
import { data as stats } from '../../.vitepress/stats.data'
</script>

الملف: `data/prisons.json`. السجون ودور الاحتجاز (detentiehuizen / maisons de détention) البالغ
عددها {{ stats.prisons }}، التابعة لـFOD Justitie / SPF Justice (الوزارة الاتحادية للعدل، DG
Penitentiaire Inrichtingen / DG Établissements pénitentiaires).

## لماذا هي مفيدة {#why-it-s-useful}

- **مراسلة محتجز أو سجنه.** يحتاج المحامون والأسر والمصالح إلى عنوان السجن ورقم هاتفه؛ والأسماء
  تختلف بحسب اللغة (`Gevangenis van Bergen`، `Prison de Mons`، `Gefängnis Mons`).
- **إيداع المال.** حيث تنشر FOD Justitie / SPF Justice حساب السجن الخاص بأموال المحتجزين، يكون في
  بيانات الاتصال بوصفه `bank-account`، مع التحقق من رقم التحقق.
- **النماذج وملفات القضايا.** معرّف ثابت لكل مؤسسة لتخزينه مع ملف، وقائمة للاختيار منها.

## المصدر والتحديثات {#source-and-updates}

|           |                                                                                                                                                                                      |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| المصدر    | [FOD Justitie / SPF Justice: السجون البلجيكية](https://justitie.belgium.be/nl/themas_en_dossiers/gevangenissen/belgische_gevangenissen)، صفحة كل سجن بالهولندية والفرنسية والألمانية |
| يبنيه     | `scripts/parse` من اللقطات الأسبوعية                                                                                                                                                 |
| يتغير حين | يُفتتح سجن أو يُغلق، أو يغيّر بيانات الاتصال                                                                                                                                            |
| المراجعة  | كل أسبوع، بواسطة [workflow المصادر](/ar/guide/data-quality#how-the-data-is-built)                                                                                                    |

## الحقول {#fields}

| الحقل                  | النوع                             | الوصف                                                                                                                   |
| ---------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `id`                   | `PrisonId`                        | من الاسم باللغة المحلية، دون أدوات التعريف: `gevangenis-gent`، `prison-lantin`، `detentiehuis-kortrijk`                 |
| `validFrom`، `validTo` | string?                           | الأيام التي يسري فيها السجل، كما أدرجه الموقع؛ غيابهما: منذ بداية التغطية، أو لا يزال ساريًا. انظر [الزمن](/ar/api#time) |
| `kind`                 | `'prison'` \| `'detention-house'` | دار الاحتجاز (detentiehuis / maison de détention) تؤوي أشخاصًا بعقوبات قصيرة، قريبًا من مساكنهم                           |
| `name`                 | `{ nl, fr, de }`                  | كما تنشره FOD Justitie / SPF Justice                                                                                    |
| `address`              | `Address`                         | باللغة المحلية، مع البلدية التي ينتمي إليها رمزه البريدي (`municipality`، برمز REFNIS)                                  |
| `contacts`             | `Contact[]`                       | الهاتف والفاكس والبريد الإلكتروني والحساب الخاص بأموال المحتجزين، حيث تُنشر                                              |
| `website`              | `{ nl, fr, de }`                  | صفحة السجن لكل لغة                                                                                                      |
| `sources`              | `{ url, retrieved }[]`            | الصفحات التي قُرئ منها السجل                                                                                             |

اسم المدير، الذي تذكره الصفحات أيضًا، مستبعَد: فهو يتغير، وهو بيانات شخصية لا تحتاج إليها الحزمة.

```ts
import { getPrison, prisons } from 'belgica/prisons'

getPrison('gevangenis-gent').name.fr // 'Prison de Gand'
prisons.filter((p) => p.kind === 'detention-house') // Kortrijk، Olen، Vorst
```
