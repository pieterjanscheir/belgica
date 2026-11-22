<script setup>
import { data as stats } from '../../.vitepress/stats.data'
</script>

# الثغرات المعروفة {#known-gaps}

- **المحاكم غير الموجودة على البوابة** ليست في البيانات: Hof van Cassatie / Cour de cassation،
  وGrondwettelijk Hof / Cour constitutionnelle، وRaad van State / Conseil d'État، والمحاكم
  التأديبية ([#4](https://github.com/pieterjanscheir/belgica/issues/4)).
- **القواعد التي تُسند نوعًا واحدًا من القضايا إلى قسم واحد ليست في البيانات.** لكل قسم نطاقه، ونطاقه
  في القضايا الجزائية حين يحدد المرسوم نطاقًا آخر ([الأقسام](/ar/data/courts#divisions)). ويمكن أن
  يُسند مرسومٌ أيضًا نوعًا واحدًا من القضايا إلى قسم واحد للمحكمة كلها، مثل التسويات الجماعية للديون
  لدى محكمة الـarbeidsrechtbank / tribunal du travail في Hainaut: و`findDivisionsWithJurisdiction` لا
  تعرف هذه القواعد.
- **{{ stats.courts.withoutAddress }} محكمة بلا عنوان واحد**: محكمة لكل قسم من أقسامها عنوانه الخاص
  (العنوان على القسم)، أو محكمة تنشر عناوينها على شكل جملة. يغيب حقل `address` فيها بدلًا من
  تخمينه؛ وللأقسام عناوينها.
- **مواعيد العمل**: {{ stats.courts.hoursParsed }} من أصل
  {{ stats.courts.hoursParsed + stats.courts.hoursTextOnly }} محكمة تنشر مواعيد عملها لديها هذه
  المواعيد بصياغة `opening_hours`. أما الباقي فتنشر نصًا فيه ملاحظات أو ترتيبات مؤقتة، يُحفظ في
  `openingHoursText` فقط.
- **تسميات جهات الاتصال بلغة الصفحة**: للمحكمة الثنائية اللغة، تسميات الصفحة الهولندية (والصفحة
  الألمانية في Eupen). وأسماء الصفحة الفرنسية ومواعيدها موجودة أيضًا.
- **بعض القيم في صفحات المصدر لا يمكن قراءتها**، فتُترك: رقم هاتف بلا رمز منطقته
  (`+32 682 05 28`)، أو فاكس «désactivé». يسردها الـpull request الأسبوعي للبيانات، فيمكن إبلاغ
  المحكمة بها.
- **الصفحة الفرنسية للـvredegerecht / justice de paix في Tongeren-Borgloon** لا تزال تسمّيه
  `Justice de paix de Tongres-Fourons`، وهو اسمه قبل اندماجات البلديات في 2025. تحتفظ البيانات
  بالاسم كما نُشر وتربطه بالكانتون الصحيح.
- **لا تاريخ بعد**: بيانات الإقليم تصف الوضع من 1 يناير 2025 فصاعدًا، وبيانات المحاكم يوم قراءتها.
  البحث عن يوم سابق يرمي خطأ بدلًا من الإجابة بخريطة اليوم
  ([#27](https://github.com/pieterjanscheir/belgica/issues/27)).
- **أسماء الكانتونات ومقارها** بالهولندية والفرنسية فقط: لا يتضمن ملحق Gerechtelijk Wetboek /
  Code judiciaire نصًا ألمانيًا موحدًا.
- **البلديات المقسّمة** (Antwerpen وGent وBrussel وLuik، …) تقابل عدة كانتونات. يوصلك الرمز البريدي
  إلى البلدية (`findCourtsForPostalCode`)؛ أما اختيار الكانتون فيحتاج إلى عنوان الشارع: تجده
  `findCantonsAt(lon, lat)` من الإحداثيات بواسطة [حدود الكانتونات](./canton-boundaries)، لكن تحويل
  العنوان إلى إحداثيات عليك، والحدود قراءة NGI للنص القانوني في `territory`، والنص هو الغالب حيث
  يختلفان ([#66](https://github.com/pieterjanscheir/belgica/issues/66)).
- **الرموز البريدية تتوقف عند البلدية.** البلديات الفرعية (deelgemeenten) ليست في البيانات: جدول
  Statbel لا يتضمنها، وقائمة bpost ليست بترخيص مفتوح. ثلاثة رموز (`1040` و`1050` و`1804`) تنتمي
  إلى بلديتين؛ وتُرجع دوال البحث كلتيهما
  ([#54](https://github.com/pieterjanscheir/belgica/issues/54)).
- **عنوان محكمة واحد بلا بلدية**: الـvredegerecht / justice de paix في Etterbeek ينشر
  `1040 Brussel (Etterbeek)`، وهو رمز مشترك مع سطر مدينة يسمّي البلديتين، فيُترك
  `address.municipality` بدلًا من تخمينه. والـjustice de paix في Limbourg ينشر مقرًا مؤقتًا في قصر
  العدل في Eupen، فتقع بلديته خارج دائرته القضائية، كما تقول صفحته.
- **رموز ECLI** لا تُعطى إلا حيث تظهر في أحكام منشورة؛ ولا رموز هناك لمحاكم الـvredegerecht /
  justice de paix ولا لمعظم محاكم الـpolitierechtbank / tribunal de police.
- **الـJustizhaus في Eupen** غائبة ([#3](https://github.com/pieterjanscheir/belgica/issues/3)).

وجدت شيئًا خاطئًا أو ناقصًا؟
[أبلغ عن تصحيح بيانات](https://github.com/pieterjanscheir/belgica/issues/new?template=data-correction.yml)
أو انظر [المساهمة](/ar/guide/contributing). ومجموعات البيانات المخطط لها في [خارطة الطريق](./roadmap).
