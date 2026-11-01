<script setup>
import { data as stats } from '../../.vitepress/stats.data'
</script>

# Bekende hiaten {#known-gaps}

- **Gerechten die niet op het portaal staan** zitten niet in de data: het Hof van Cassatie, het
  Grondwettelijk Hof, de Raad van State en de tuchtrechtbanken
  ([#4](https://github.com/pieterjanscheir/belgica/issues/4)).
- **De bevoegdheid stopt bij het gerecht.** `cantons` en `findCourtsWithJurisdiction` zeggen welk gerecht
  een gemeente bestrijkt, niet welke van zijn afdelingen: het gebied van een afdeling wordt bij
  koninklijk besluit bepaald en zit nog niet in de data
  ([#58](https://github.com/pieterjanscheir/belgica/issues/58)).
- **{{ stats.courts.withoutAddress }} gerechten hebben geen enkel adres**: een gerecht waarvan elke
  afdeling haar eigen adres heeft (het adres staat op de afdeling), of een dat zijn adressen als
  een zin publiceert. Hun `address` ontbreekt in plaats van geraden te zijn; de afdelingen hebben
  het hunne.
- **Openingsuren**: {{ stats.courts.hoursParsed }} van de
  {{ stats.courts.hoursParsed + stats.courts.hoursTextOnly }} gerechten die uren publiceren, hebben
  ze in de `opening_hours`-syntaxis. De rest publiceert tekst met opmerkingen of tijdelijke
  regelingen, alleen bewaard als `openingHoursText`.
- **Contactlabels staan in de taal van de pagina**: voor een tweetalig gerecht die van de
  Nederlandse pagina (de Duitse in Eupen). De namen en uren van de Franse pagina zijn er ook.
- **Sommige waarden op de bronpagina's zijn niet leesbaar**, en worden weggelaten: een
  telefoonnummer zonder zonenummer (`+32 682 05 28`), een fax die "désactivé" is. De
  data-pull-request somt ze op, zodat ze aan het gerecht gemeld kunnen worden.
- **De Franse pagina van het vredegerecht van Tongeren-Borgloon** noemt het nog altijd
  `Justice de paix de Tongres-Fourons`, zijn naam van vóór de gemeentefusies van 2025. De data
  bewaart de naam zoals gepubliceerd en koppelt hem aan het juiste kanton.
- **Nog geen historiek**: de territoriumdata beschrijft 1 januari 2025 en later, en de
  gerechtendata de dag waarop ze gelezen is. Opzoekingen voor een vroegere dag gooien een fout
  in plaats van te antwoorden met de kaart van vandaag
  ([#27](https://github.com/pieterjanscheir/belgica/issues/27)).
- **Kantonnamen en zetels** zijn er alleen in het Nederlands en het Frans: het bijvoegsel bij
  het Gerechtelijk Wetboek heeft geen geconsolideerde Duitse tekst.
- **Gesplitste gemeenten** (Antwerpen, Gent, Brussel, Luik, …) horen bij meerdere kantons. Een
  postcode brengt je tot de gemeente (`findCourtsForPostalCode`); het kanton kiezen vereist het
  straatadres: `findCantonsAt(lon, lat)` vindt het aan de hand van coördinaten met de
  [kantongrenzen](./canton-boundaries), maar het adres geocoderen is aan jou, en de grenzen
  zijn de lezing van het NGI van de wettekst in `territory`, die voorrang heeft waar ze van
  elkaar afwijken ([#66](https://github.com/pieterjanscheir/belgica/issues/66)).
- **Postcodes stoppen bij de gemeente.** Deelgemeenten zitten niet in de data: de tabel van
  Statbel heeft er geen, en de lijst van bpost heeft geen open licentie. Drie codes (`1040`,
  `1050`, `1804`) horen bij twee gemeenten; de opzoekingen geven beide terug
  ([#54](https://github.com/pieterjanscheir/belgica/issues/54)).
- **Eén gerechtsadres zonder gemeente**: het vredegerecht van Etterbeek publiceert
  `1040 Brussel (Etterbeek)`, een gedeelde code met een plaatsregel die beide gemeenten noemt,
  dus `address.municipality` is weggelaten in plaats van geraden. Het vredegerecht van Limbourg
  publiceert een tijdelijke zetel in het gerechtsgebouw van Eupen, dus zijn gemeente ligt
  buiten zijn arrondissement, zoals zijn pagina zegt.
- **ECLI-codes** worden alleen gegeven waar ze in gepubliceerde beslissingen voorkomen; de
  vredegerechten en de meeste politierechtbanken hebben er daar geen.
- **Het justitiehuis in Eupen** ontbreekt
  ([#3](https://github.com/pieterjanscheir/belgica/issues/3)).

Iets fout of ontbrekend gevonden?
[Meld een datacorrectie](https://github.com/pieterjanscheir/belgica/issues/new?template=data-correction.yml)
of zie [bijdragen](/nl/guide/contributing). Geplande datasets staan op de [roadmap](./roadmap).
