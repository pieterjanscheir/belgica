# Дорожня карта {#roadmap}

Заплановані набори даних, кожен з issue, що його специфікує. Кожне issue перелічує офіційні
джерела, запропоновані поля і що означає «готово». Допомога вітається: виберіть одне і
дотримуйтеся [домовленостей](/uk/guide/contributing#adding-a-dataset).

## Суди, установи й особи {#courts-offices-and-people}

| Набір даних                                                                                                                                           | Чим він корисний                                                                             | Issue                                                       |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Інші суди**: Hof van Cassatie / Cour de cassation, Grondwettelijk Hof / Cour constitutionnelle, Raad van State / Conseil d'État, дисциплінарні суди | Найвищих судів немає на порталі судів, тож для них потрібні власні джерела                   | [#4](https://github.com/pieterjanscheir/belgica/issues/4)   |
| **Justitiehuis в Eupen** (Німецькомовна спільнота)                                                                                                    | Єдиний justitiehuis / maison de justice, якого в даних поки немає                            | [#3](https://github.com/pieterjanscheir/belgica/issues/3)   |
| **Компетенція за відділеннями суду** (afdelingen / divisions)                                                                                         | Куди подавати в межах суду, і позначка RPR / RPM на документах компаній                      | [#58](https://github.com/pieterjanscheir/belgica/issues/58) |
| **Прокуратури** (parketten, arbeidsauditoraten, parketten-generaal, федеральна прокуратура)                                                           | Куди подати кримінальну скаргу, і трудовий прокурор у справах соціального права              | [#55](https://github.com/pieterjanscheir/belgica/issues/55) |
| **Контори судових виконавців** (gerechtsdeurwaarders / huissiers de justice)                                                                          | Знайти судового виконавця в судовому окрузі для вручення документів чи примусового виконання | [#6](https://github.com/pieterjanscheir/belgica/issues/6)   |
| **Кадастр і управління правової визначеності** (kadaster, колишні hypotheekkantoren)                                                                  | Запитувати іпотечні довідки й кадастрові витяги в компетентному управлінні                   | [#8](https://github.com/pieterjanscheir/belgica/issues/8)   |
| **Нотаріуси і нотаріальні палати**                                                                                                                    | Знайти нотаріуса, і палату, компетентну щодо скарги                                          | [#56](https://github.com/pieterjanscheir/belgica/issues/56) |
| **Адвокатські колегії** (balies / barreaux) та їхні бюро правової допомоги                                                                            | Бюро правової допомоги для адреси, і bâtonnier для деонтологічних питань                     | [#57](https://github.com/pieterjanscheir/belgica/issues/57) |

## Територія {#territory}

| Набір даних                                                                                   | Чим він корисний                                                                                   | Issue                                                       |
| --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Історія**: коли змінювалися кантони, громади й суди                                         | Модель має періоди чинності і пошук за днем; для попередніх версій ще бракує даних                 | [#27](https://github.com/pieterjanscheir/belgica/issues/27) |
| **Колишні громади** та об'єднання 2019 і 2025 років                                           | Зіставити старий код REFNIS чи назву з сьогоднішньою громадою                                      | [#53](https://github.com/pieterjanscheir/belgica/issues/53) |
| **Частини громад** (deelgemeenten / sections de commune) для кожного поштового індексу        | [Поштові індекси](./postal-codes) закінчуються на рівні громади; в адресах указано населений пункт | [#54](https://github.com/pieterjanscheir/belgica/issues/54) |
| **Адреса → кантон** через BeST Address                                                        | [Межі кантонів](./canton-boundaries) знаходять кантон точки; бракує кроку геокодування адреси      | [#66](https://github.com/pieterjanscheir/belgica/issues/66) |
| **Мовні території та мовні пільги** для кожної громади (taalgebieden / faciliteitengemeenten) | Мова провадження і документів, що там вручаються                                                   | [#70](https://github.com/pieterjanscheir/belgica/issues/70) |

## Суми, ставки й календарі {#amounts-rates-and-calendars}

| Набір даних                                                                               | Чим він корисний                                                                           | Issue                                                       |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| **Судові збори** (rolrechten / droits de mise au rôle, griffierechten / droits de greffe) | Кошториси витрат і електронне подання; збір залежить від дати подання                      | [#59](https://github.com/pieterjanscheir/belgica/issues/59) |
| **Процесуальне відшкодування** (rechtsplegingsvergoeding / indemnité de procédure)        | Шкала та її індексація, для кожного кошторису витрат і рішення                             | [#60](https://github.com/pieterjanscheir/belgica/issues/60) |
| **Порогові суми для компетенції та апеляції** (art. 590, 617 Ger.W.)                      | Який суд розглядає позов і чи можна оскаржити його рішення                                 | [#69](https://github.com/pieterjanscheir/belgica/issues/69) |
| **Судові канікули і державні свята**                                                      | Обчислення процесуальних строків                                                           | [#61](https://github.com/pieterjanscheir/belgica/issues/61) |
| **Індекс здоров'я** (gezondheidsindex / indice santé) за кожен місяць                     | Індексація орендної плати й аліментів                                                      | [#62](https://github.com/pieterjanscheir/belgica/issues/62) |
| **Граничні суми збитків і відсотків за споживчими боргами** (Book XIX WER / CDE)          | Що можна стягнути зі споживача, який платить із запізненням                                | [#63](https://github.com/pieterjanscheir/belgica/issues/63) |
| **Межі стягнення** (beslagbare bedragen / quotités saisissables, art. 1409 Ger.W.)        | Яку частину заробітку чи допомоги можна арештувати; індексується щороку                    | [#67](https://github.com/pieterjanscheir/belgica/issues/67) |
| **Податкові процентні ставки**: відсотки за прострочення і мораторні відсотки             | Відсотки в податкових спорах, поряд із [законною і комерційною ставками](./interest-rates) | [#68](https://github.com/pieterjanscheir/belgica/issues/68) |

## Чому деяких наборів даних тут ще немає {#why-some-datasets-aren-t-here-yet}

Правовий набір даних корисний лише тоді, коли кожне значення походить з офіційного джерела, тож
нічого не додається вручну з пам'яті. Кожен набір даних будує скрипт зі знімків його джерела, і
більшість джерел щотижня завантажує GitHub Actions. Два поки що не можна: сайт Belgisch
Staatsblad / Moniteur belge (ejustice), з якого беруться кантони, і police.be відмовляють у
з'єднанні серверам GitHub; натомість їх завантажують зі звичайної машини
([#52](https://github.com/pieterjanscheir/belgica/issues/52)). Довідник судових виконавців
будується в браузері, тож для його читання потрібен браузер або дані Національної палати
([#6](https://github.com/pieterjanscheir/belgica/issues/6)).
