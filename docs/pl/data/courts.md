<script setup>
import { data as stats } from '../../.vitepress/stats.data'

const labels = {
    'justice-of-the-peace': 'Vredegerecht / justice de paix',
    'police-court': 'Politierechtbank / tribunal de police',
    'court-of-first-instance': 'Rechtbank van eerste aanleg / tribunal de première instance',
    'enterprise-court': "Ondernemingsrechtbank / tribunal de l'entreprise",
    'labour-court': 'Arbeidsrechtbank / tribunal du travail',
    'court-of-appeal': "Hof van beroep / cour d'appel",
    'labour-court-of-appeal': 'Arbeidshof / cour du travail',
    'court-of-assize': "Hof van assisen / cour d'assises",
}

const areas = {
    'justice-of-the-peace': 'Kanton; Philippeville ma siedzibę w dwóch miejscach',
    'police-court': 'Okręg sądowy (Bruksela podzielona według języka, Halle, Vilvoorde)',
    'court-of-first-instance': 'Okręg sądowy (Bruksela podzielona według języka)',
    'enterprise-court': 'Okręg sądowy albo obszar sądu apelacyjnego',
    'labour-court': 'Okręg sądowy albo obszar sądu apelacyjnego',
    'court-of-appeal': 'Obszar sądowy',
    'labour-court-of-appeal': 'Obszar sądowy',
    'court-of-assize': 'Prowincja albo Bruksela-Stolica',
}
</script>

# Sądy {#courts}

Plik: `data/courts.json`. Każdy sąd władzy sądowniczej wymieniony na własnym portalu sądów,
[tribunaux-rechtbanken.be](https://www.tribunaux-rechtbanken.be): {{ stats.courts.total }}
rekordów obowiązujących dziś<span v-if="stats.courts.retired">, oraz {{ stats.courts.retired }}
wycofanych wersji, których portal już nie wymienia</span>. Liczby na tej stronie są obliczane z
danych podczas budowania strony.

<table>
<thead><tr><th>Rodzaj</th><th style="text-align:right">Sądy</th><th style="text-align:right">Wydziały lub siedziby</th><th>Obszar</th></tr></thead>
<tbody>
<tr v-for="t in stats.courts.byType" :key="t.type">
<td>{{ labels[t.type] }}</td><td style="text-align:right">{{ t.courts }}</td><td style="text-align:right">{{ t.divisions }}</td><td>{{ areas[t.type] }}</td>
</tr>
</tbody>
</table>

Nie ma ich na portalu, więc nie ma ich jeszcze tutaj: Hof van Cassatie / Cour de cassation,
Grondwettelijk Hof / Cour constitutionnelle i Raad van State / Conseil d'État oraz sądy
dyscyplinarne.

## Do czego się przydaje {#why-it-s-useful}

- **Adresowanie pism.** Pozwy, wnioski i pisma procesowe podają nazwę sądu w brzmieniu, jakiego
  używa on sam; listy i pisma trafiają do sekretariatu sądu (griffie / greffe) pod jego adres.
- **Kontakt z właściwym sekretariatem.** Większe sądy mają osobny sekretariat dla każdej
  dziedziny (cywilnej, karnej, rodzinnej, rejestru osób prawnych…), każdy z własnym numerem
  telefonu, adresem e-mail, a czasem rachunkiem bankowym. Dane trzymają je osobno, z etykietami
  nadanymi przez sąd.
- **Uiszczanie opłat.** Sekretariaty, które publikują rachunek bankowy na opłaty sądowe i
  zaliczki, mają go w danych, ze sprawdzoną sumą kontrolną.
- **Budowanie formularzy.** Pola wyboru sądu wymagają pełnej listy ze stabilnymi id, powiązanej
  z kantonami, okręgami sądowymi (arrondissements) i obszarami sądowymi oraz z sądem, do którego
  należy wydział.
- **Linkowanie do orzecznictwa.** `ecli` podaje kod, który orzeczenia sądu mają w swoim
  European Case Law Identifier (`ECLI:BE:HBGNT:…`).

## Źródło i aktualizacje {#source-and-updates}

|                  |                                                                                                                                               |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Źródło           | [tribunaux-rechtbanken.be](https://www.tribunaux-rechtbanken.be), portal College van de hoven en rechtbanken / Collège des cours et tribunaux |
| Budowane przez   | `scripts/parse` z cotygodniowych snapshotów strony każdego sądu i jego strony kontaktowej                                                     |
| Zmienia się, gdy | Sąd się przeprowadza, zmienia dane kontaktowe lub godziny albo portal dodaje sąd lub zmienia jego nazwę                                       |
| Sprawdzanie      | Co tydzień, przez [workflow sources](/pl/guide/data-quality#how-the-data-is-built); zmiany przychodzą jako pull request                       |

Każdy rekord wymienia strony, z których został odczytany, i dzień, w którym treść każdej strony
pojawiła się po raz pierwszy (`sources`). Dane kontaktowe zmieniają się częściej niż cokolwiek
innego w tym pakiecie: gdy to ważne, sprawdź stronę sądu (`website`).

<CourtList />

## Pola {#fields}

| Pole               | Typ                                   | Opis                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------ | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`               | `CourtId`                             | Stabilne id: `type`, a potem miejscowość w języku sądu: `justice-of-the-peace-gent-1`, `police-court-brussel-fr`, `enterprise-court-gent-brugge`. Zobacz [identyfikatory](/pl/guide/identifiers)                                                                                                                                                                                                         |
| `validFrom`        | string?                               | Pierwszy dzień obowiązywania rekordu, `YYYY-MM-DD`: dzień, w którym portal wymienił go po raz pierwszy. Brak: od początku zakresu                                                                                                                                                                                                                                                                        |
| `validTo`          | string?                               | Ostatni dzień obowiązywania rekordu: dzień przed cotygodniową kontrolą, która stwierdziła, że zniknął z portalu. Brak: nadal obowiązuje                                                                                                                                                                                                                                                                  |
| `type`             | `CourtType`                           | `justice-of-the-peace`, `police-court`, `court-of-first-instance`, `enterprise-court`, `labour-court`, `court-of-appeal`, `labour-court-of-appeal`, `court-of-assize`                                                                                                                                                                                                                                    |
| `kind`             | `'court'` \| `'division'` \| `'seat'` | Sam sąd, jeden z jego wydziałów (afdeling, division, Abteilung) albo jedno z miejsc, w których zasiada vredegerecht / justice de paix                                                                                                                                                                                                                                                                    |
| `court`            | `CourtId`?                            | Dla wydziału lub siedziby: sąd, do którego należy                                                                                                                                                                                                                                                                                                                                                        |
| `name`             | `{ nl?, fr?, de? }`                   | Nazwa w brzmieniu publikowanym przez sąd, w każdym języku, w którym ma stronę: `Vredegerecht Gent 1`, `Tribunal de l'entreprise du Hainaut - division Mons`                                                                                                                                                                                                                                              |
| `judicialArea`     | `JudicialAreaId`                      | Obszar sądowy                                                                                                                                                                                                                                                                                                                                                                                            |
| `arrondissement`   | `ArrondissementId`?                   | Okręg sądowy, dla sądu lub wydziału, którego obszarem jest jeden okręg sądowy albo który leży w jednym                                                                                                                                                                                                                                                                                                   |
| `canton`           | `CantonId`?                           | Dla vredegerecht / justice de paix: kanton, który obsługuje                                                                                                                                                                                                                                                                                                                                              |
| `cantons`          | `CantonId[]`?                         | Dla każdego innego sądu: kantony, które obejmuje, zgodnie z załącznikiem do Gerechtelijk Wetboek / Code judiciaire (art. 3–5) i art. 114 tego kodeksu. Dla wydziału: kantony leżące w całości w jego obszarze, tak jak określają go dekrety królewskie wydane na podstawie art. 186 tego kodeksu (zobacz [wydziały](#divisions)); obszar w sprawach cywilnych, gdy dekret określa inny dla spraw karnych |
| `municipalities`   | `MunicipalityId[]`?                   | Dla wydziału, którego obszar obejmuje tylko część kantonu: te gminy, po kodzie REFNIS                                                                                                                                                                                                                                                                                                                    |
| `criminalArea`     | `{ cantons?, municipalities? }`?      | Dla wydziału, któremu dekret wyznacza w sprawach karnych inny obszar niż w cywilnych: jego obszar w sprawach karnych, odczytywany tak samo jak `cantons` i `municipalities`. Brak, gdy wydział ma jeden obszar dla obu rodzajów spraw                                                                                                                                                                    |
| `ecli`             | `string[]`?                           | Kody ECLI sądu, po jednym na każdy język, w którym orzeka; tylko kody widziane w opublikowanych orzeczeniach                                                                                                                                                                                                                                                                                             |
| `address`          | `Address`?                            | Gdzie mieści się sekretariat, z gminą, do której należy jego kod pocztowy (`municipality`, po kodzie REFNIS). Brak, gdy sąd nie publikuje jednego adresu (sąd, którego wydziały mają każdy własny)                                                                                                                                                                                                       |
| `contacts`         | `Contact[]`                           | Telefon, faks, e-mail i rachunek bankowy, każdy z sekretariatem, do którego należy (`label`), i tekstem opublikowanym razem z nim (`note`)                                                                                                                                                                                                                                                               |
| `openingHours`     | string?                               | Godziny sekretariatu w składni OpenStreetMap [`opening_hours`](https://wiki.openstreetmap.org/wiki/Key:opening_hours): `Mo-Fr 08:30-12:30,13:30-16:00`, tylko gdy opublikowany tekst mówi dokładnie to                                                                                                                                                                                                   |
| `openingHoursText` | `{ nl?, fr?, de? }`?                  | Godziny otwarcia w opublikowanej formie, dla każdego języka                                                                                                                                                                                                                                                                                                                                              |
| `website`          | `{ nl?, fr?, de? }`                   | Strona sądu na portalu, dla każdego języka                                                                                                                                                                                                                                                                                                                                                               |
| `sources`          | `{ url, retrieved }[]`                | Strony, z których odczytano rekord, i kiedy ich treść pojawiła się po raz pierwszy                                                                                                                                                                                                                                                                                                                       |

::: tip Nowe typy sądów
`type` może zyskać nowe wartości (na przykład Hof van Cassatie / Cour de cassation). Jeśli
używasz na nim `switch`, zachowaj gałąź `default`, żeby nowy typ nie zepsuł twojego kodu.
:::

## Struktura {#shape}

```ts
interface Court {
    id: CourtId
    validFrom?: string
    validTo?: string
    type: CourtType
    kind: 'court' | 'division' | 'seat'
    court?: CourtId
    name: Partial<Translated>
    judicialArea: JudicialAreaId
    arrondissement?: ArrondissementId
    canton?: CantonId
    cantons?: CantonId[]
    municipalities?: MunicipalityId[]
    criminalArea?: { cantons?: CantonId[]; municipalities?: MunicipalityId[] }
    ecli?: string[]
    address?: Address
    contacts: Contact[]
    openingHours?: string
    openingHoursText?: Partial<Translated>
    website: Partial<Record<Locale, string>>
    sources: SourceRef[]
}

interface Address {
    building?: string
    street: string // w opublikowanej formie, z numerem, skrytką lub piętrem: 'Beverstraat 7B (eerste verdieping)'
    postalCode: string
    city: string
    municipality?: MunicipalityId // przez kod pocztowy; zobacz stronę o kodach pocztowych
}

interface Contact {
    type: 'phone' | 'fax' | 'email' | 'bank-account'
    value: string // kanoniczna: E.164, e-mail małymi literami, IBAN w formacie elektronicznym
    label?: string // sekretariat lub służba: 'Burgerlijke griffie', 'Greffe pénal'
    note?: string // tekst opublikowany razem z wartością: 'druk 1', 'tapez 2'
}
```

## Wydziały {#divisions}

Rechtbank van eerste aanleg / tribunal de première instance, ondernemingsrechtbank / tribunal de
l'entreprise, arbeidsrechtbank / tribunal du travail, arbeidshof / cour du travail albo
politierechtbank / tribunal de police może być podzielony na wydziały (afdelingen, divisions): to
w wydziale składa się pisma i tam odbywa się rozprawa. Wydział ondernemingsrechtbank / tribunal
de l'entreprise to także ten, który podaje wzmianka o rejestrze osób prawnych na dokumentach
spółek („RPR Gent, afdeling Brugge”). Obszar każdego wydziału określa dekret królewski wydany na
podstawie art. 186 Gerechtelijk Wetboek / Code judiciaire: dekret z 14 marca 2014 r. albo, od
tego czasu dla wielu sądów, własny dekret sądu o podziale spraw (zaakverdelingsreglement).
Reformy kantonów z lat 2017–2019 i połączenia gmin w 2025 roku zmieniły jedne i drugie.

Każdy wydział ma swój obszar w `cantons`: to kantony leżące w nim w całości. Gdy dekret dzieli
kanton, wydział wymienia w `municipalities` gminy, które z niego przejmuje. Tribunal du travail
du Hainaut kieruje Pont-à-Celles (kanton Seneffe) do Charleroi, a Erquelinnes i
Merbes-le-Château (kanton Chimay) do Binche. Tribunal de première instance de Liège (od 2024
roku) oraz politierechtbank Limburg i tribunal de police de Liège wyznaczają swoim wydziałom
listy gmin zamiast kantonów. Gmina należy do wydziału, który wymienia ją w `municipalities`, a w
przeciwnym razie do tego, który ma jej kanton. To wyszukiwanie wykonuje
`findDivisionsWithJurisdiction`.

### Sprawy cywilne i karne {#civil-and-criminal-cases}

Dekret może określić jeden obszar dla spraw cywilnych, a inny dla karnych. Robią tak rechtbank
van eerste aanleg Antwerpen i politierechtbank Antwerpen w swoich dekretach z 16 grudnia 2020 r.:
w sprawach cywilnych cały kanton Heist-op-den-Berg trafia do wydziału Mechelen, a w sprawach
karnych (wraz z rozpoznawanymi w nich powództwami cywilnymi) jego gminy Hulshout i Herenthout
trafiają do Turnhout.

`cantons` i `municipalities` to wtedy obszar w sprawach cywilnych, a swój obszar w sprawach
karnych wydział ma w `criminalArea`, z tymi samymi dwoma polami:

```ts
getCourt('police-court-antwerpen-turnhout').criminalArea
// { cantons: ['mol-geel-1', 'mol-geel-2', 'turnhout-1', 'turnhout-2', 'westerlo'],
//   municipalities: ['13012', '13016'] }   Herenthout i Hulshout
```

Tylko wydział, którego dwa obszary się różnią, ma `criminalArea`: dziś są cztery, Mechelen i
Turnhout obu sądów. Dla każdego innego wydziału jeden obszar obowiązuje w obu rodzajach spraw.
`findDivisionsWithJurisdiction` przyjmuje rodzaj sprawy jako `matter`:

```ts
const ids = (options?: DivisionOptions) =>
    findDivisionsWithJurisdiction('13016', 'police-court', options).map((d) => d.id)
ids({ matter: 'civil' }) // ['police-court-antwerpen-mechelen']
ids({ matter: 'criminal' }) // ['police-court-antwerpen-turnhout']
ids() // oba, najpierw cywilny: rozstrzyga rodzaj sprawy
```

### Źródła {#sources}

Obszary to tekst obowiązujący, skonsolidowany ręcznie z publikacji w Belgisch Staatsblad /
Moniteur belge, które każdy wydział przytacza w `sources`: dekretu określającego obszar i każdego
późniejszego, który go zmienił. Obszary politierechtbanken / tribunaux de police odczytano ze
skonsolidowanych tekstów Justel. Test sprawdza, czy wydziały sądu pokrywają jego obszar dokładnie
raz, w sprawach cywilnych i w karnych.

Dekret może też skierować jeden rodzaj spraw do jednego wydziału dla całego sądu: zbiorowe
uregulowanie długów (règlement collectif de dettes) w tribunal du travail du Hainaut albo, w
tribunal de police de Liège, czyny zabronione należące do właściwości tribunaux du travail. Tych
reguł nie ma w danych.

## Funkcje pomocnicze {#helpers}

```ts
getCourt('justice-of-the-peace-gent-1')
getJusticeOfThePeace('gent-1') // ten sam sąd, po id kantonu
getDivisions('enterprise-court-gent') // jego osiem wydziałów
getCourtsForCanton('gent-1') // jego vredegerecht i po jednym sądzie każdego innego typu
findCourtsWithJurisdiction('23088', 'police-court') // [police-court-vilvoorde], po kodzie REFNIS
findDivisionsWithJurisdiction('31005', 'enterprise-court') // [enterprise-court-gent-brugge]
findDivisionsWithJurisdiction('44021', 'police-court') // [police-court-oost-vlaanderen-gent]
findCourts({ type: 'police-court', kind: 'court', judicialArea: 'gent' })
getContact(court, 'email', 'Greffe pénal') // wartość pierwszego pasującego kontaktu
formatPhoneNumber('+3253820701') // '053 82 07 01'
formatIban('BE73679200844560') // 'BE73 6792 0084 4560'
```

## Jak dane są odczytywane {#how-the-data-is-read}

Portal ma stronę dla każdego sądu i każdego wydziału, w języku sądu; dwujęzyczne sądy w Brukseli
mają stronę po niderlandzku i po francusku, a sądy w Eupen po francusku i po niemiecku. Parser:

1. odczytuje typ sądu i miejscowość z jego nazwy (`Politierechtbank Limburg - afdeling Genk`), a
   kanton vredegerecht / justice de paix z jego nazwy i numeru;
2. łączy wersje językowe jednego sądu w jeden rekord: nazwy, strony i godziny otwarcia dla
   każdego języka; adres i dane kontaktowe z pierwszego języka (niderlandzkiego w Brukseli,
   niemieckiego w Eupen), uzupełnione o wartości, które ma tylko druga strona;
3. odczytuje bloki kontaktowe sekretariatów, zachowując każdą wartość z jej sekretariatem;
4. zamienia opublikowane godziny otwarcia na składnię `opening_hours` tylko wtedy, gdy rozumie
   każde słowo, a każdy język mówi to samo. Tekst z uwagą lub tymczasowym rozwiązaniem
   („OPGELET: tot 31 december…”) zachowuje tylko opublikowany tekst;
5. przypisuje każdemu sądowi kantony, które przyznaje mu ustawa (`cantons`), z tabeli załącznika
   do Gerechtelijk Wetboek w `scripts/parse/jurisdictions.ts`, i wyprowadza z nich jego
   `arrondissement`. Tabela i portal sprawdzają się nawzajem: sąd na portalu, którego brak w
   tabeli ustawowej, lub odwrotnie, zatrzymuje build.

Parser odmawia zapisania czegokolwiek, gdy strony nie da się umiejscowić (nieznany rodzaj sądu,
vredegerecht bez kantonu), kanton nie ma sądu albo tabela ustawowa i portal nie zgadzają się co
do tego, jakie sądy istnieją. To, czego nie potrafi odczytać (numer telefonu bez numeru
kierunkowego, adres zapisany jako zdanie), jest raportowane w cotygodniowym pull requeście i
pomijane w danych, a nie zgadywane.

## Wartości kanoniczne {#canonical-values}

| Wartość          | Zapisana jako                                    | Dlaczego                                                                                                                                                |
| ---------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Numer telefonu   | E.164: `+3253820701`                             | Jedna postać na numer, można go wybrać z dowolnego miejsca, linki `tel:` działają od razu                                                               |
| IBAN             | Format elektroniczny: `BE73679200844560`         | Postać, którą przyjmują systemy płatności; suma kontrolna jest sprawdzana przy odczycie i w testach                                                     |
| E-mail           | Małymi literami                                  | Porównywanie i usuwanie duplikatów działają                                                                                                             |
| Godziny otwarcia | `opening_hours`: `Mo-Fr 08:30-12:30,13:30-16:00` | Standard OpenStreetMap, z parserami w wielu językach (np. [opening_hours.js](https://github.com/opening-hours/opening_hours.js)) i niezależny od języka |
| Ulica            | W opublikowanej formie                           | Numery, skrytki i piętra są zapisywane na zbyt wiele sposobów (`Canadaplein ZN`, `Rue de Bruxelles 2 - 3`), by je rozdzielić bez zgadywania             |
