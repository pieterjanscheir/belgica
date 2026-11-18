<script setup>
import { data as stats } from '../../.vitepress/stats.data'
</script>

# Justitiehuizen / maisons de justice {#houses-of-justice}

الملف: `data/houses-of-justice.json`. الـjustitiehuizen / maisons de justice (دور العدالة)
التابعة للمجموعة الفلمنكية (Vlaamse Gemeenschap) والمجموعة الفرنسية (Communauté française):
{{ stats.housesOfJustice }} سجلًا.

تتولى الـjustitiehuizen / maisons de justice توجيه الجناة والإشراف عليهم نيابةً عن المحاكم
والنيابات (المراقبة القضائية، والمراقبة الإلكترونية، والعمل للمنفعة العامة)، واستقبال الضحايا،
وإعداد الدراسات الاجتماعية لمحاكم الأسرة. وتديرها المجموعات (Gemeenschappen / Communautés) منذ 2015.

## لماذا هي مفيدة {#why-it-s-useful}

- **قانون الأسرة.** تأمر محكمة الأسرة بدراسة اجتماعية من الـjustitiehuis / maison de justice
  التابعة لمنطقة الأسرة؛ ويحتاج المحامون والأطراف إلى بيانات الاتصال بها.
- **القانون الجنائي.** شروط المراقبة القضائية، والعقوبات البديلة، والمراقبة الإلكترونية تتابعها
  الـjustitiehuis / maison de justice؛ وكذلك استقبال الضحايا.
- **الربط.** تحمل الدور الفلمنكية رقم OVO الخاص بها، وهو المعرّف في سجل المنظمات الفلمنكي
  ([Wegwijs](https://wegwijs.vlaanderen.be))، فترتبط البيانات ببيانات حكومية فلمنكية أخرى.

## المصدر والتحديثات {#source-and-updates}

|          |                                                                                                                                                                                                                                                    |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| المصدر   | [vlaanderen.be: Justitiehuizen](https://www.vlaanderen.be/agentschap-justitie-en-handhaving/justitie/justitiehuizen) (المجموعة الفلمنكية) و[maisonsdejustice.be](https://www.maisonsdejustice.be/menu-de-droite/trouverunemj/) (المجموعة الفرنسية) |
| يبنيه    | `scripts/parse` من اللقطات الأسبوعية                                                                                                                                                                                                               |
| المراجعة | كل أسبوع، بواسطة [workflow المصادر](/ar/guide/data-quality#how-the-data-is-built)                                                                                                                                                                  |

ليست في البيانات بعد: الـJustizhaus التابعة للمجموعة الناطقة بالألمانية (Deutschsprachige
Gemeinschaft) في Eupen ([#3](https://github.com/pieterjanscheir/belgica/issues/3)). وفي Brussel
دار فلمنكية (`justitiehuis-brussel`) ودار ناطقة بالفرنسية (`maison-justice-bruxelles`) معًا.

## الحقول {#fields}

| الحقل                  | النوع                                   | الوصف                                                                                                                   |
| ---------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `id`                   | `HouseOfJusticeId`                      | من الاسم، دون أدوات التعريف: `justitiehuis-gent`، `maison-justice-arlon`                                                |
| `validFrom`، `validTo` | string?                                 | الأيام التي يسري فيها السجل، كما أدرجه الموقع؛ غيابهما: منذ بداية التغطية، أو لا يزال ساريًا. انظر [الزمن](/ar/api#time) |
| `community`            | `'flemish'` \| `'french'` \| `'german'` | المجموعة التي تديرها                                                                                                    |
| `name`                 | `{ nl }` أو `{ fr }`                    | بلغة المجموعة                                                                                                           |
| `ovo`                  | string?                                 | رقم OVO في سجل المنظمات الفلمنكي، للدور الفلمنكية: `OVO001917`                                                          |
| `address`              | `Address`                               | مع البلدية التي ينتمي إليها رمزه البريدي (`municipality`، برمز REFNIS)                                                  |
| `contacts`             | `Contact[]`                             | الهاتف والفاكس والبريد الإلكتروني؛ ولخدمة الضحايا في الدار الناطقة بالفرنسية بيانات اتصال خاصة بها، موسومة              |
| `website`              | `{ nl }` أو `{ fr }`                    | الصفحة التي تُدرج فيها                                                                                                   |
| `sources`              | `{ url, retrieved }[]`                  | الصفحات التي قُرئ منها السجل                                                                                             |

```ts
import { getHouseOfJustice, getContact } from 'belgica/houses-of-justice'

getHouseOfJustice('justitiehuis-gent').ovo // 'OVO001917'
getContact(getHouseOfJustice('maison-justice-arlon'), 'email', "service d'accueil des victimes")
```
