# خارطة الطريق {#roadmap}

مجموعات البيانات المخطط لها، مع الـissue الذي يحدد كلًا منها. يسرد كل issue المصادر الرسمية،
والحقول المقترحة، وما يعنيه «الإنجاز». المساعدة مرحَّب بها: اختر واحدة واتبع
[الأعراف](/ar/guide/contributing#adding-a-dataset).

## المحاكم والمكاتب والأشخاص {#courts-offices-and-people}

| مجموعة البيانات                                                                                                                                              | لماذا هي مفيدة                                                                                                | الـissue                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **المحاكم الأخرى**: Hof van Cassatie / Cour de cassation، وGrondwettelijk Hof / Cour constitutionnelle، وRaad van State / Conseil d'État، والمحاكم التأديبية | المحاكم العليا ليست على بوابة المحاكم، فهي تحتاج إلى مصادرها الخاصة                                           | [#4](https://github.com/pieterjanscheir/belgica/issues/4)   |
| **الـJustizhaus في Eupen** (المجموعة الناطقة بالألمانية)                                                                                                     | الـjustitiehuis / maison de justice الوحيدة التي لا تتضمنها البيانات بعد                                      | [#3](https://github.com/pieterjanscheir/belgica/issues/3)   |
| **الاختصاص حسب أقسام المحكمة** (afdelingen / divisions)                                                                                                      | أين يُودَع الطلب داخل المحكمة، وبيان RPR / RPM على وثائق الشركات                                              | [#58](https://github.com/pieterjanscheir/belgica/issues/58) |
| **النيابات العامة** (parketten، arbeidsauditoraten، parketten-generaal، والنيابة الفيدرالية)                                                                 | أين تُقدَّم شكوى جزائية، والنيابة العمالية (arbeidsauditeur / auditeur du travail) في قضايا القانون الاجتماعي | [#55](https://github.com/pieterjanscheir/belgica/issues/55) |
| **مكاتب المحضرين القضائيين** (gerechtsdeurwaarders / huissiers de justice)                                                                                   | إيجاد محضر في دائرة قضائية للتبليغ أو التنفيذ                                                                 | [#6](https://github.com/pieterjanscheir/belgica/issues/6)   |
| **مكاتب السجل العقاري والأمن القانوني** (kadaster، والـhypotheekkantoren سابقًا)                                                                             | طلب شهادات الرهن ومستخرجات السجل العقاري من المكتب المختص                                                     | [#8](https://github.com/pieterjanscheir/belgica/issues/8)   |
| **الموثقون والغرف التوثيقية**                                                                                                                                | إيجاد موثق، والغرفة المختصة بالنظر في شكوى                                                                    | [#56](https://github.com/pieterjanscheir/belgica/issues/56) |
| **نقابات المحامين** (balies / barreaux) ومكاتب المساعدة القانونية التابعة لها                                                                                | مكتب المساعدة القانونية لعنوان ما، والنقيب (stafhouder / bâtonnier) للمسائل المتعلقة بأخلاقيات المهنة         | [#57](https://github.com/pieterjanscheir/belgica/issues/57) |

## الإقليم {#territory}

| مجموعة البيانات                                                                         | لماذا هي مفيدة                                                                                        | الـissue                                                    |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **التاريخ**: متى تغيرت الكانتونات والبلديات والمحاكم                                    | للنموذج فترات سريان وبحث حسب اليوم؛ والنسخ الأقدم لا تزال تحتاج إلى البيانات                          | [#27](https://github.com/pieterjanscheir/belgica/issues/27) |
| **البلديات السابقة** واندماجات 2019 و2025                                               | ربط رمز REFNIS قديم أو اسم قديم ببلدية اليوم                                                          | [#53](https://github.com/pieterjanscheir/belgica/issues/53) |
| **البلديات الفرعية** (deelgemeenten / sections de commune) لكل رمز بريدي                | تتوقف [الرموز البريدية](./postal-codes) عند البلدية؛ والعناوين تسمّي المحلّة                          | [#54](https://github.com/pieterjanscheir/belgica/issues/54) |
| **العنوان → الكانتون** باستخدام BeST Address                                            | تجد [حدود الكانتونات](./canton-boundaries) كانتون نقطة؛ وتحويل العنوان إلى إحداثيات هو الخطوة الناقصة | [#66](https://github.com/pieterjanscheir/belgica/issues/66) |
| **المناطق اللغوية والتسهيلات اللغوية** لكل بلدية (taalgebieden / faciliteitengemeenten) | لغة الإجراءات ولغة الوثائق المبلَّغة هناك                                                             | [#70](https://github.com/pieterjanscheir/belgica/issues/70) |

## المبالغ والمعدلات والتقاويم {#amounts-rates-and-calendars}

| مجموعة البيانات                                                                           | لماذا هي مفيدة                                                                                | الـissue                                                    |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **رسوم المحاكم** (rolrechten / droits de mise au rôle، griffierechten / droits de greffe) | تقدير التكاليف والإيداع الإلكتروني؛ يتوقف الرسم على تاريخ الإيداع                             | [#59](https://github.com/pieterjanscheir/belgica/issues/59) |
| **التعويض الإجرائي** (rechtsplegingsvergoeding / indemnité de procédure)                  | الشرائح وربطها بالمؤشر، لكل تقدير للتكاليف ولكل حكم                                           | [#60](https://github.com/pieterjanscheir/belgica/issues/60) |
| **الحدود المالية للاختصاص والاستئناف** (art. 590, 617 Ger.W.)                             | أي محكمة تنظر في مطالبة ما، وهل يقبل حكمها الاستئناف                                          | [#69](https://github.com/pieterjanscheir/belgica/issues/69) |
| **العطل القضائية والعطل الرسمية**                                                         | حساب المواعيد الإجرائية                                                                       | [#61](https://github.com/pieterjanscheir/belgica/issues/61) |
| **المؤشر الصحي** (gezondheidsindex / indice santé) لكل شهر                                | ربط الإيجارات والنفقات بالمؤشر                                                                | [#62](https://github.com/pieterjanscheir/belgica/issues/62) |
| **سقوف التعويضات والفوائد على ديون المستهلكين** (Book XIX WER / CDE)                      | ما يجوز تحميله للمستهلك الذي يتأخر في الدفع                                                   | [#63](https://github.com/pieterjanscheir/belgica/issues/63) |
| **حدود الحجز** (beslagbare bedragen / quotités saisissables، art. 1409 Ger.W.)            | مقدار ما يمكن حجزه من الأجر أو الإعانة، ويُربط بالمؤشر كل سنة                                 | [#67](https://github.com/pieterjanscheir/belgica/issues/67) |
| **أسعار الفائدة الضريبية**: فوائد التأخير وفوائد التأخر في الرد                           | الفوائد في المنازعات الضريبية، إلى جانب [أسعار الفائدة القانونية والتجارية](./interest-rates) | [#68](https://github.com/pieterjanscheir/belgica/issues/68) |

## لماذا لا توجد بعض مجموعات البيانات هنا بعد {#why-some-datasets-aren-t-here-yet}

لا تكون مجموعة البيانات القانونية مفيدة إلا إذا جاءت كل قيمة من مصدر رسمي، لذا لا يُضاف شيء يدويًا
من الذاكرة. كل مجموعة بيانات يبنيها سكربت من لقطات لمصدرها، ومعظم المصادر يجلبها GitHub Actions كل
أسبوع. اثنان لا يمكن ذلك معهما حاليًا: موقع Belgisch Staatsblad / Moniteur belge (ejustice)، الذي
تأتي منه الكانتونات، وpolice.be، كلاهما يرفض الاتصالات من خوادم GitHub؛ فيُجلبان من جهاز عادي
بدلًا من ذلك ([#52](https://github.com/pieterjanscheir/belgica/issues/52)). ودليل المحضرين القضائيين
يُبنى في المتصفح، فيحتاج إلى متصفح لقراءته، أو إلى بيانات الغرفة الوطنية (Nationale Kamer van
Gerechtsdeurwaarders / Chambre nationale des huissiers de justice)
([#6](https://github.com/pieterjanscheir/belgica/issues/6)).
