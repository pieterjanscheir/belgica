# أسعار الفائدة {#interest-rates}

الملف: `data/interest-rates.json`. المصدر: FOD Financiën (الوزارة الاتحادية للمالية)، والنشر في
Belgisch Staatsblad / Moniteur belge (الجريدة الرسمية البلجيكية).

## لماذا هي مفيدة {#why-it-s-useful}

الفائدة على التأخر في الدفع جزء من كل مطالبة تقريبًا، والسعر يتوقف على اليوم:

- **الفائدة القانونية** (wettelijke interest / intérêt légal) تسري على الديون عمومًا، وهي ما تحكم
  به المحاكم فائدةً تأخيرية ما لم ينص عقد أو قانون خاص على غير ذلك.
- **الفائدة التجارية** (Wet 2 augustus 2002، قانون 2 أغسطس 2002) تسري على التأخر في الدفع بين
  الشركات وتجاه السلطات العامة، ما لم يحدد العقد سعرًا أعلى.

المطالبة الممتدة على عدة سنوات تعبر عدة فترات، لكل منها سعرها. والخطأ في فترة واحدة يغيّر المبلغ
المطالَب به، والانتقال في 2013–2015 (أدناه) سهل الإغفال. تعطي `getInterestRate` السعر الصحيح ليوم
ما، وتُرجع `null` بدلًا من التخمين حين لا يكون السعر قد نُشر بعد.

## المصدر والتحديثات {#source-and-updates}

|           |                                                                                                                                                                                                                                   |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| المصدر    | [FOD Financiën](https://financien.belgium.be/nl/over_de_fod/structuur_en_diensten/algemene_administraties/thesaurie/rentevoet_betalingsachterstand_handelstransacties) (التجارية)؛ وإعلان سنوي في Belgisch Staatsblad (القانونية) |
| يبنيه     | يدويًا: أضف فترة حين يُنشر سعر جديد                                                                                                                                                                                                 |
| يتغير حين | كل سنة تقويمية (القانونية)؛ كل نصف سنة (التجارية)                                                                                                                                                                                 |
| المراجعة  | أسبوعيًا: يفتح فحص الحداثة issue حين لا يكون لليوم، أو للأسبوعين القادمين، سعر                                                                                                                                                     |

- **القانونية** (`legal`، wettelijke interest، Wet 5 mei 1865): تُحدَّد لكل سنة تقويمية؛ ومسجَّلة
  منذ 1970.
- **التجارية** (`commercial`، التأخر في الدفع في المعاملات التجارية، Wet 2 augustus 2002):
  تُحدَّد لكل نصف سنة؛ ومسجَّلة منذ 2002.

## ابحث عن سعر {#look-up-a-rate}

<InterestRates />

## قاعدة العقود 2013–2015 {#the-2013-2015-contract-rule}

من 2013 حتى 15 مارس 2015 يتوقف السعر التجاري على تاريخ إبرام العقد. تحمل تلك الفترات حقلًا إضافيًا
`rateForContractsBefore20130316`. افتراضيًا تُرجع `getInterestRate` سعر العقود الأقدم؛ مرّر
`{ contractAfter20130316: true }` للعقود المبرمة في 16 مارس 2013 أو بعده.

```ts
getInterestRate('2014-06-15', 'commercial') // { rate: 7.5, … }
getInterestRate('2014-06-15', 'commercial', { contractAfter20130316: true }) // { rate: 8.5, … }
```

## الفترات الناقصة {#missing-periods}

تُرجع `getInterestRate` القيمة `null` ليوم لا سعر مسجَّلًا له: قبل الفترة الأولى، أو في فترة لم
تُنشر (أو لم تُضف) بعد. استخدم `getLatestKnownRateDate(type)` لإظهار المدى الذي تصل إليه البيانات،
وأصدر تحذيرًا بدلًا من استخدام 0 % بصمت.

## البنية {#shape}

```ts
type InterestType = 'legal' | 'commercial'

interface InterestRateSeries {
    description: string
    source: string
    periods: InterestRatePeriod[]
}

interface InterestRatePeriod {
    from: string // اليوم الأول، مشمول، YYYY-MM-DD
    to: string // اليوم الأخير، مشمول، YYYY-MM-DD
    rate: number // نسبة مئوية
    rateForContractsBefore20130316?: number
    note?: string
}
```
