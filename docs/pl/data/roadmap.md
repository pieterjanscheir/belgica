# Plan rozwoju {#roadmap}

Planowane zbiory danych, każdy z issue, które go opisuje. Każde issue wymienia oficjalne źródła,
proponowane pola i to, co oznacza „gotowe”. Pomoc jest mile widziana: wybierz jedno i stosuj
[konwencje](/pl/guide/contributing#adding-a-dataset).

## Sądy, urzędy i osoby {#courts-offices-and-people}

| Zbiór danych                                                                                                                                               | Do czego się przydaje                                                                               | Issue                                                       |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Pozostałe sądy**: Hof van Cassatie / Cour de cassation, Grondwettelijk Hof / Cour constitutionnelle, Raad van State / Conseil d'État, sądy dyscyplinarne | Najwyższych sądów nie ma na portalu sądów, więc potrzebują własnych źródeł                          | [#4](https://github.com/pieterjanscheir/belgica/issues/4)   |
| **Justitiehuis / maison de justice w Eupen** (Wspólnota Niemieckojęzyczna)                                                                                 | Jedyna placówka, której dane jeszcze nie mają                                                       | [#3](https://github.com/pieterjanscheir/belgica/issues/3)   |
| **Właściwość według wydziału sądu** (afdelingen / divisions)                                                                                               | Gdzie składać pisma w obrębie sądu oraz wzmianka RPR / RPM na dokumentach spółek                    | [#58](https://github.com/pieterjanscheir/belgica/issues/58) |
| **Prokuratury** (parketten, arbeidsauditoraten, parketten-generaal, prokuratura federalna)                                                                 | Gdzie złożyć zawiadomienie o przestępstwie oraz audytor pracy w sprawach z zakresu prawa socjalnego | [#55](https://github.com/pieterjanscheir/belgica/issues/55) |
| **Kancelarie komornicze** (gerechtsdeurwaarders / huissiers de justice)                                                                                    | Znalezienie komornika w okręgu sądowym do doręczeń lub egzekucji                                    | [#6](https://github.com/pieterjanscheir/belgica/issues/6)   |
| **Strefy policyjne** (politiezones / zones de police)                                                                                                      | Która strefa obsługuje gminę: skargi, kopie protokołów                                              | [#7](https://github.com/pieterjanscheir/belgica/issues/7)   |
| **Urzędy katastralne i urzędy pewności prawnej** (kadaster, dawne hypotheekkantoren)                                                                       | Zamawianie zaświadczeń hipotecznych i wypisów katastralnych we właściwym urzędzie                   | [#8](https://github.com/pieterjanscheir/belgica/issues/8)   |
| **Notariusze i izby notarialne**                                                                                                                           | Znalezienie notariusza oraz izby właściwej do rozpatrzenia skargi                                   | [#56](https://github.com/pieterjanscheir/belgica/issues/56) |
| **Izby adwokackie** (balies / barreaux) i ich biura pomocy prawnej                                                                                         | Biuro pomocy prawnej właściwe dla adresu oraz bâtonnier w sprawach deontologicznych                 | [#57](https://github.com/pieterjanscheir/belgica/issues/57) |

## Terytorium {#territory}

| Zbiór danych                                                                                      | Do czego się przydaje                                                                                       | Issue                                                       |
| ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Historia**: kiedy zmieniały się kantony, gminy i sądy                                           | Model ma okresy obowiązywania i wyszukiwania według dnia; wcześniejsze wersje wciąż potrzebują danych       | [#27](https://github.com/pieterjanscheir/belgica/issues/27) |
| **Dawne gminy** oraz połączenia z 2019 i 2025 roku                                                | Mapowanie starego kodu REFNIS lub nazwy na dzisiejszą gminę                                                 | [#53](https://github.com/pieterjanscheir/belgica/issues/53) |
| **Części gmin** (deelgemeenten / sections de commune) dla każdego kodu pocztowego                 | [Kody pocztowe](./postal-codes) kończą się na gminie; adresy podają miejscowość                             | [#54](https://github.com/pieterjanscheir/belgica/issues/54) |
| **Adres → kanton** z BeST Address                                                                 | [Granice kantonów](./canton-boundaries) znajdują kanton punktu; brakującym krokiem jest geokodowanie adresu | [#66](https://github.com/pieterjanscheir/belgica/issues/66) |
| **Obszary językowe i ułatwienia językowe** w każdej gminie (taalgebieden / faciliteitengemeenten) | Język postępowania i doręczanych tam dokumentów                                                             | [#70](https://github.com/pieterjanscheir/belgica/issues/70) |

## Kwoty, stawki i kalendarze {#amounts-rates-and-calendars}

| Zbiór danych                                                                                            | Do czego się przydaje                                                                | Issue                                                       |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| **Opłaty sądowe** (rolrechten / droits de mise au rôle, griffierechten / droits de greffe)              | Szacowanie kosztów i e-wnoszenie pism; opłata zależy od daty wniesienia              | [#59](https://github.com/pieterjanscheir/belgica/issues/59) |
| **Zryczałtowany zwrot kosztów postępowania** (rechtsplegingsvergoeding / indemnité de procédure)        | Przedziały i ich indeksacja, do każdego szacunku kosztów i każdego wyroku            | [#60](https://github.com/pieterjanscheir/belgica/issues/60) |
| **Progi kwotowe dla właściwości i apelacji** (art. 590, 617 Ger.W.)                                     | Który sąd rozpoznaje roszczenie i czy od jego wyroku przysługuje apelacja            | [#69](https://github.com/pieterjanscheir/belgica/issues/69) |
| **Ferie sądowe i dni ustawowo wolne od pracy**                                                          | Obliczanie terminów procesowych                                                      | [#61](https://github.com/pieterjanscheir/belgica/issues/61) |
| **Indeks zdrowia** (gezondheidsindex / indice santé) dla każdego miesiąca                               | Indeksacja czynszów i alimentów                                                      | [#62](https://github.com/pieterjanscheir/belgica/issues/62) |
| **Limity odszkodowań i odsetek od długów konsumenckich** (Księga XIX WER / CDE)                         | Co można naliczyć konsumentowi, który płaci z opóźnieniem                            | [#63](https://github.com/pieterjanscheir/belgica/issues/63) |
| **Granice zajęcia** (beslagbare bedragen / quotités saisissables, art. 1409 Ger.W.)                     | Jaka część wynagrodzenia lub świadczenia może zostać zajęta, indeksowana co roku     | [#67](https://github.com/pieterjanscheir/belgica/issues/67) |
| **Podatkowe stopy procentowe**: odsetki za zwłokę od podatnika i odsetki moratoryjne należne od państwa | Odsetki w sporach podatkowych, obok [stóp ustawowych i handlowych](./interest-rates) | [#68](https://github.com/pieterjanscheir/belgica/issues/68) |

## Dlaczego niektórych zbiorów danych jeszcze nie ma {#why-some-datasets-aren-t-here-yet}

Prawniczy zbiór danych jest użyteczny tylko wtedy, gdy każda wartość pochodzi z oficjalnego
źródła, więc nic nie jest dodawane ręcznie z pamięci. Każdy zbiór danych jest budowany przez
skrypt ze snapshotów swojego źródła, a większość źródeł jest pobierana co tydzień przez GitHub
Actions. Dwóch na razie nie da się tak pobrać: strona Belgisch Staatsblad / Moniteur belge
(ejustice), z której pochodzą kantony, oraz police.be odrzucają połączenia z serwerów GitHuba;
zamiast tego są pobierane ze zwykłego komputera
([#52](https://github.com/pieterjanscheir/belgica/issues/52)). Katalog komorników jest budowany w
przeglądarce, więc do jego odczytania potrzebna jest przeglądarka albo dane Nationale Kamer van
Gerechtsdeurwaarders / Chambre nationale des huissiers de justice
([#6](https://github.com/pieterjanscheir/belgica/issues/6)).
