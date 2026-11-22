<script setup>
import { data as stats } from '../../.vitepress/stats.data'
</script>

# Znane luki {#known-gaps}

- **Sądów spoza portalu** nie ma w danych: Hof van Cassatie / Cour de cassation, Grondwettelijk
  Hof / Cour constitutionnelle, Raad van State / Conseil d'État i sądów dyscyplinarnych
  ([#4](https://github.com/pieterjanscheir/belgica/issues/4)).
- **Reguł kierujących jeden rodzaj spraw do jednego wydziału nie ma w danych.** Każdy wydział ma
  swój obszar, a także obszar w sprawach karnych, gdy dekret określa dla nich inny
  ([wydziały](/pl/data/courts#divisions)). Dekret może też skierować jeden rodzaj spraw do
  jednego wydziału dla całego sądu, jak zbiorowe uregulowanie długów (règlement collectif de
  dettes) w tribunal du travail du Hainaut: `findDivisionsWithJurisdiction` tych reguł nie zna.
- **{{ stats.courts.withoutAddress }} sądów nie ma jednego adresu**: sąd, którego wydziały mają
  każdy własny (adres jest przy wydziale), albo sąd, który publikuje swoje adresy w postaci
  zdania. Ich `address` jest nieobecny, a nie zgadywany; wydziały mają swoje.
- **Godziny otwarcia**: {{ stats.courts.hoursParsed }} z
  {{ stats.courts.hoursParsed + stats.courts.hoursTextOnly }} sądów publikujących godziny ma je w
  składni `opening_hours`. Pozostałe publikują tekst z uwagami lub tymczasowymi rozwiązaniami,
  zachowany tylko jako `openingHoursText`.
- **Etykiety kontaktów są w języku strony**: dla sądu dwujęzycznego w języku strony
  niderlandzkiej (w Eupen niemieckiej). Nazwy i godziny ze strony francuskiej również są w
  danych.
- **Niektórych wartości na stronach źródłowych nie da się odczytać** i są pomijane: numer
  telefonu bez numeru kierunkowego (`+32 682 05 28`), faks, który jest „désactivé”. Cotygodniowy
  pull request z danymi je wymienia, żeby można je było zgłosić sądowi.
- **Francuska strona vredegerecht / justice de paix w Tongeren-Borgloon** nadal nazywa go
  `Justice de paix de Tongres-Fourons`, nazwą sprzed połączenia gmin w 2025 roku. Dane
  zachowują nazwę w opublikowanej formie i wiążą ją z właściwym kantonem.
- **Na razie brak historii**: dane o terytorium opisują stan od 1 stycznia 2025, a dane o sądach
  dzień, w którym zostały odczytane. Wyszukiwania dla wcześniejszego dnia rzucają błąd, zamiast
  odpowiadać dzisiejszą mapą ([#27](https://github.com/pieterjanscheir/belgica/issues/27)).
- **Nazwy i siedziby kantonów** są tylko po niderlandzku i po francusku: załącznik do
  Gerechtelijk Wetboek / Code judiciaire nie ma skonsolidowanego tekstu niemieckiego.
- **Podzielone gminy** (Antwerpen, Gent, Brussel, Luik, …) odpowiadają kilku kantonom. Kod
  pocztowy prowadzi do gminy (`findCourtsForPostalCode`); wybór kantonu wymaga adresu z ulicą:
  `findCantonsAt(lon, lat)` znajduje go na podstawie współrzędnych dzięki
  [granicom kantonów](./canton-boundaries), ale geokodowanie adresu należy do ciebie, a granice
  są odczytaniem tekstu prawnego z `territory` przez NGI, a tekst wygrywa, gdy się różnią
  ([#66](https://github.com/pieterjanscheir/belgica/issues/66)).
- **Kody pocztowe kończą się na gminie.** Części gmin (deelgemeenten) nie ma w danych: tabela
  Statbel ich nie zawiera, a lista bpost nie jest na otwartej licencji. Trzy kody (`1040`,
  `1050`, `1804`) należą do dwóch gmin; wyszukiwania zwracają obie
  ([#54](https://github.com/pieterjanscheir/belgica/issues/54)).
- **Jeden adres sądu bez gminy**: vredegerecht / justice de paix w Etterbeek publikuje
  `1040 Brussel (Etterbeek)`, wspólny kod z nazwą miejscowości wskazującą obie gminy, więc
  `address.municipality` jest pominięte, a nie zgadywane. Justice de paix w Limbourg publikuje
  tymczasową siedzibę w gmachu sądu w Eupen, więc jego gmina leży poza jego okręgiem sądowym
  (arrondissement), jak podaje jego strona.
- **Kody ECLI** są podawane tylko tam, gdzie pojawiają się w opublikowanych orzeczeniach;
  vredegerechten / justices de paix i większość politierechtbanken / tribunaux de police ich tam
  nie mają.
- **Brakuje justitiehuis / maison de justice w Eupen**
  ([#3](https://github.com/pieterjanscheir/belgica/issues/3)).

Znalazłeś coś błędnego lub brakującego?
[Zgłoś poprawkę danych](https://github.com/pieterjanscheir/belgica/issues/new?template=data-correction.yml)
albo zobacz [współtworzenie](/pl/guide/contributing). Planowane zbiory danych są w
[planie rozwoju](./roadmap).
