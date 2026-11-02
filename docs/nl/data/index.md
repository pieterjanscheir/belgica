# Datasets {#datasets}

Elke dataset is een JSON-bestand in `data/`, beschreven door een [JSON Schema](/nl/guide/schema) en
opgenomen in [`datapackage.json`](/nl/guide/schema#datapackage-json) met zijn officiële bronnen,
licentie en de datum waarop hij voor het laatst tegen die bronnen is gecontroleerd.

| Dataset                                         | Records   | Waarvoor je hem gebruikt                                                                                            |
| ----------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------- |
| [Rechtsgebieden](./territory#judicial-areas)    | 5         | Welk hof van beroep (en arbeidshof) een beroep behandelt                                                            |
| [Arrondissementen](./territory#arrondissements) | 12        | Rechtbanken, parketten en gerechtsdeurwaarders groeperen; de eenheid waar de meeste bevoegdheidsregels mee werken   |
| [Kantons](./territory#cantons)                  | 162       | Welk vredegerecht bevoegd is voor een adres                                                                         |
| [Kantongrenzen](./canton-boundaries)            | 162       | Het kanton van een punt in een gesplitste stad; de kantons op een kaart (GeoJSON)                                   |
| [Gemeenten](./territory#municipalities)         | 565       | Elk Belgisch adres of elke statistiek via de REFNIS-code aan de gerechtelijke kaart koppelen                        |
| [Gewesten](./territory#regions)                 | 3         | Het gewest van een gemeente, op REFNIS-code, in drie talen benoemd                                                  |
| [Provincies](./territory#provinces)             | 10        | De provincie van een gemeente (geen in Brussel), met haar gewest                                                    |
| [Postcodes](./postal-codes)                     | 1 152     | Van de postcode van een adres naar zijn gemeente, en verder naar haar kantons en gerechten                          |
| [Politiezones](./police-zones)                  | 175       | Welke politiezone een gemeente behandelt, op haar officiële zonenummer                                              |
| [Hoven en rechtbanken](./courts)                | 347       | Namen, adressen en contactgegevens van de griffies om elk gerecht aan te schrijven, er neer te leggen of te betalen |
| [Gevangenissen](./prisons)                      | 39        | Adressen en contactgegevens van elke gevangenis en elk detentiehuis                                                 |
| [Justitiehuizen](./houses-of-justice)           | 27        | Probatie, slachtofferonthaal en maatschappelijke onderzoeken voor de familierechtbanken                             |
| [Rentevoeten](./interest-rates)                 | 2 reeksen | Betalingsachterstand op een vordering berekenen                                                                     |

## Hoe de datasets samenhangen {#how-the-datasets-fit-together}

```
Rechtsgebied ──< Arrondissement ──< Kanton >──< Gemeente (REFNIS) ──< Postcode
      │                 │              │  │
      │                 │              │  └── Kantongrens   de geometrie van het kanton (NGI)
      └──────────── Gerecht ───────────┘  een vredegerecht verwijst naar zijn kanton,
                        │                 en het adres van elk gerecht naar zijn gemeente
                        └──< Afdeling     een afdeling verwijst naar haar gerecht
```

`──<` lees je als "heeft meerdere". Een gemeente ligt meestal in één kanton; gesplitste steden
(Antwerpen, Gent, Brussel, Luik, …) liggen in meerdere. Aan de bestuurlijke kant: `Gewest ──<
Provincie ──< Gemeente`, behalve dat het Brussels Hoofdstedelijk Gewest geen provincie heeft en
zijn 19 gemeenten rechtstreeks omvat.

Records verwijzen naar elkaar met een id, nooit met een naam: een gerecht heeft een
`judicialArea`-id en, als zijn gebied één arrondissement is, een `arrondissement`-id; een kanton
somt de REFNIS-codes van zijn gemeenten op; een postcode en het adres van een gerecht dragen de
REFNIS-code van hun gemeente. Namen worden per bron en per taal anders gespeld; ids niet.

## Waarvoor deze data dient {#why-this-data-is-useful}

Belgisch juridisch werk loopt telkens weer tegen dezelfde opzoekingen aan, en de officiële
bronnen zijn vanuit code moeilijk te gebruiken:

- **Bevoegdheid.** Het vredegerecht, de politierechtbank en veel andere gerechten zijn
  territoriaal bevoegd. De wet (het bijvoegsel bij het Gerechtelijk Wetboek) beschrijft die
  gebieden in proza, deels straat per straat. `cantons.json` maakt daar een opzoeking van
  gemeente naar kanton van, en bewaart de wettekst voor de gesplitste steden.
- **Juiste namen en adressen.** Dagvaardingen, conclusies en brieven moeten het juiste gerecht
  aanspreken zoals het zichzelf noemt, bijvoorbeeld `Vredegerecht Gent 1` of
  `Ondernemingsrechtbank Gent - afdeling Brugge`, en bij de juiste griffie terechtkomen. De
  namen komen van de eigen pagina's van de gerechten, in elke taal waarin ze publiceren.
- **Interestberekeningen.** Vorderingen wegens betalingsachterstand gebruiken de wettelijke
  rentevoet of, tussen ondernemingen, de rentevoet voor handelstransacties. Beide veranderen
  elk jaar of elk semester, en de overgang 2013–2015 hangt af van de contractdatum. Eén periode
  fout en het gevorderde bedrag klopt niet.
- **Andere data koppelen.** REFNIS-codes zijn wat Statbel, de gewesten en de meeste open data
  gebruiken. Door ze aan kantons en arrondissementen te koppelen kun je caseload-, bevolkings-
  of adresdata op de gerechtelijke kaart zetten.

## Wat er (nog) niet in zit {#what-isn-t-in-it-yet}

Zie [bekende hiaten](./known-gaps) voor de beperkingen van de huidige data en de
[roadmap](./roadmap) voor geplande datasets: de hoogste rechtscolleges, historiek,
gerechtsdeurwaarders, politiezones en de kantoren van het kadaster en de hypotheken.

::: warning Referentiedata, geen juridisch advies
De data wordt tegen officiële bronnen gecontroleerd, maar bronnen veranderen en fouten gebeuren.
Controleer de officiële bron voor je op een waarde vertrouwt, en
[meld wat fout is](https://github.com/pieterjanscheir/belgica/issues/new?template=data-correction.yml).
:::
