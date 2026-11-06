# Rechtbankzoeker {#court-finder}

Typ een adres, of klik op een punt op de kaart, en zie welke rechtbanken daar territoriaal
bevoegd zijn: het vredegerecht van het kanton, en de politierechtbank, rechtbank van eerste
aanleg, ondernemingsrechtbank, arbeidsrechtbank, het hof van beroep, het arbeidshof en het hof
van assisen waarvan het gebied het punt bevat. Het draait op dit package, in je browser, en
toont bij elk resultaat de aanroepen erachter.

<CourtFinder />

De kaart kleurt elk kanton in een van zes kleuren, nooit dezelfde als die van een buur. Zoom in
op een gesplitste stad en de contouren van de gebouwen en de huisnummers liggen op de kleur, zodat
het kanton van elk huis te zien is. Beweeg over de kaart voor het kanton en zijn vredegerecht. De
link van een resultaat bevat het adres (`?q=…`) of het punt (`?at=lat,lon`), zodat je het kunt
delen.

## Hoe het werkt {#how-it-works}

Drie stappen, elk één functie. Alleen de eerste heeft iets nodig dat het package niet heeft.

### 1. Van adres naar punt {#_1-address-to-point}

Het package is geen geocoder. Elk gewest houdt zijn eigen adresregister bij, met een API die
vanuit de browser antwoordt: het Adressenregister (Digitaal Vlaanderen) in Vlaanderen, UrbIS
(paradigm.brussels) in Brussel, ICAR (SPW) in Wallonië. De postcode in het adres zegt welk
register je vraagt; `getMunicipalitiesForPostalCode` geeft het gewest:

```ts
import { getMunicipalitiesForPostalCode } from 'belgica'

const postalCode = address.match(/\b\d{4}\b/g)?.at(-1) // de laatste vier cijfers: geen huisnummer
const region = postalCode && getMunicipalitiesForPostalCode(postalCode)[0]?.region
// '02000' Vlaanderen, '03000' Wallonië, '04000' Brussel: welk register te vragen
```

Voor een adres dat het register tot op het huisnummer kent, ligt het punt op het gebouw, zodat de
even en de oneven kant van een grensstraat in het juiste kanton vallen. Kent het alleen de straat,
dan ligt het punt ergens in de straat, en de zoeker zegt dat.

### 2. Van punt naar kanton {#_2-point-to-canton}

`findCantonsAt` uit `belgica/canton-boundaries` houdt het punt tegen de NGI-grens van elk
kanton: één kanton voor een punt in België, twee voor een punt op de lijn ertussen, geen buiten
België.

```ts
import { findCantonsAt } from 'belgica/canton-boundaries'

findCantonsAt(4.4203, 51.2287).map((c) => c.id) // ['antwerpen-4']: lengtegraad eerst
```

De grenzen zijn 23 MB JSON, dus deze pagina laadt die module niet. Ze haalt één bestand per
kanton op, geschreven uit `data/canton-boundaries.json` bij het bouwen van de site, en alleen de
kantons waarvan de bounding box het punt bevat: enkele honderden kilobytes. De test zelf is die van
het package, de ray casting die `findCantonsAt` gebruikt (`src/geometry.ts`), dus het antwoord is
hetzelfde. Op een server roep je gewoon `findCantonsAt` aan.

Binnen 25 m van een ander kanton waarschuwt de zoeker en toont hij de wettekst van beide: het NGI
tekende de grens naar het bijvoegsel bij het Gerechtelijk Wetboek, en voor een huis op de lijn
[beslist de tekst](/nl/data/canton-boundaries#why-it-s-useful).

### 3. Van kanton naar rechtbanken {#_3-canton-to-courts}

`getCourtsForCanton` geeft het vredegerecht van het kanton en, van elk ander type, de rechtbank
waarvan het gebied het kanton bevat:

```ts
import { formatCourtName, getContact, getCourtsForCanton } from 'belgica'

for (const court of getCourtsForCanton('antwerpen-4')) {
    formatCourtName(court, 'nl') // 'Vredegerecht Antwerpen 4', 'Politierechtbank Antwerpen', …
    court.address // waar je neerlegt
    getContact(court, 'email') // het e-mailadres van de griffie
}
```

Welke afdeling van een rechtbank de zaak behandelt, is bij koninklijk besluit bepaald en zit nog
niet in de data ([#58](https://github.com/pieterjanscheir/belgica/issues/58)): `getDivisions`
somt ze op.

## De kaart {#the-map}

De kaart is [MapLibre GL](https://maplibre.org) op de vectortegels van
[OpenFreeMap](https://openfreemap.org) (OpenStreetMap-data), met de kantons als GeoJSON-bron
erbovenop. Elke kaartbibliotheek neemt de grenzen zoals ze zijn:

```ts
import { appliesOn, toDay } from 'belgica'
import { cantonBoundaries } from 'belgica/canton-boundaries'

const today = toDay(new Date())

map.addSource('cantons', {
    type: 'geojson',
    data: {
        type: 'FeatureCollection',
        features: cantonBoundaries
            .filter((b) => appliesOn(b, today)) // de versies die vandaag gelden
            .map((b) => ({ type: 'Feature', id: b.canton, properties: {}, geometry: b.geometry })),
    },
})
```

Wat deze pagina daar bovenop doet, en een app kan overnemen:

- **Een overzicht en het detail.** De build vereenvoudigt elke grens tot ongeveer 50 m voor één
  overzichtsbestand, dat uitgezoomd wordt getekend. Vanaf zoom 11,5 haalt de kaart de kantons in
  beeld op volle precisie op, zodat een huis in een grensstraat aan de juiste kant ligt.
- **Zes kleuren.** Aangrenzende kantons delen nooit een kleur: de build zoekt de buren (kantons
  met een gemeenschappelijk grenspunt) en kleurt de meest verbonden eerst.
- **Gebouwen en huisnummers op de kleur.** De vectortegels bevatten de contouren van de
  gebouwen en de huisnummers; boven de kantonvulling getekend toont elk huis in welk kanton het
  ligt.
- **De vredegerechten.** `belgica/court-locations` heeft voor de meeste het punt van het NGI,
  getekend als stippen vanaf zoom 9.

Het buildscript is [`scripts/build-docs-map.ts`](https://github.com/pieterjanscheir/belgica/blob/main/scripts/build-docs-map.ts),
de kaart [`CantonMap.vue`](https://github.com/pieterjanscheir/belgica/blob/main/docs/.vitepress/components/CantonMap.vue)
en de zoeker [`CourtFinder.vue`](https://github.com/pieterjanscheir/belgica/blob/main/docs/.vitepress/components/CourtFinder.vue).

## Gebouwd op het package {#built-on-the-package}

- [**CourtFull**](https://courtfull.scheir.eu/) gaat verder: dezelfde kaart tot op het
  huis, de afdelingen die het adres bedienen, routes en openingsuren, termijnen en interest, in
  vier talen, met een MCP-server en een REST-API. De broncode staat op
  [GitHub](https://github.com/pieterjanscheir/courtfull).
- De [explorer](https://belgica.scheir.eu/) heeft een pagina voor elke rechtbank, elk kanton,
  elke gemeente en elke postcode, in 13 talen.

::: warning Referentiedata, geen juridisch advies
De gebieden van de rechtbanken zijn die van de wet, de grenzen de lezing van het NGI, de adressen
die van de registers van de gewesten. Controleer de officiële bronnen voor je op een resultaat
vertrouwt waar het ertoe doet.
:::
