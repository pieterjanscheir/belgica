<script setup>
import { data as stats } from '../.vitepress/stats.data'
</script>

# Known gaps

- **Courts not on the portal** aren't in the data: the Court of Cassation, the Constitutional
  Court, the Council of State and the disciplinary courts
  ([#4](https://github.com/pieterjanscheir/belgica/issues/4)).
- **The police courts' divisions have no area.** The divisions of the courts of first instance,
  enterprise and labour courts and labour courts of appeal have theirs
  ([divisions](./courts#divisions)). The police courts' decrees list municipalities, and the
  police court of Antwerp has one area for civil and one for criminal cases, so
  `findDivisionsWithJurisdiction` gives the police court as a whole
  ([#58](https://github.com/pieterjanscheir/belgica/issues/58)). The division areas are the
  civil ones, and leave out a decree's rules that send one kind of case to one division.
- **{{ stats.courts.withoutAddress }} courts have no single address**: a court whose divisions
  each have their own (the address is on the division), or one that publishes its addresses as
  a sentence. Their `address` is missing rather than guessed; the divisions have theirs.
- **Opening hours**: {{ stats.courts.hoursParsed }} of the
  {{ stats.courts.hoursParsed + stats.courts.hoursTextOnly }} courts that publish hours have
  them in `opening_hours` syntax. The rest publish text with notes or temporary arrangements,
  kept as `openingHoursText` only.
- **Contact labels are in the page's language**: for a bilingual court, the Dutch page's (the
  German page's in Eupen). The French page's names and hours are there too.
- **Some values on the source pages can't be read**, and are left out: a phone number without
  its area code (`+32 682 05 28`), a fax that is "désactivé". The data pull request
  lists them, so they can be reported to the court.
- **The French page of the justice of the peace of Tongeren-Borgloon** still calls it
  `Justice de paix de Tongres-Fourons`, its name before the 2025 municipal mergers. The data
  keeps the name as published and links it to the right canton.
- **No history yet**: the territory data describes 1 January 2025 onwards, and the court data
  the day it was read. Lookups for an earlier day throw rather than answer with today's map
  ([#27](https://github.com/pieterjanscheir/belgica/issues/27)).
- **Canton names and seats** are in Dutch and French only: the annex to the Judicial Code has
  no consolidated German text.
- **Split municipalities** (Antwerpen, Gent, Brussel, Luik, …) map to several cantons. A postal
  code gets you to the municipality (`findCourtsForPostalCode`); picking the canton needs the
  street address: `findCantonsAt(lon, lat)` finds it from coordinates with the
  [canton boundaries](./canton-boundaries), but geocoding the address is up to you, and the
  boundaries are the NGI's reading of the legal text in `territory`, which wins where they
  disagree ([#66](https://github.com/pieterjanscheir/belgica/issues/66)).
- **Postal codes stop at the municipality.** Sub-municipalities (deelgemeenten) aren't in the
  data: Statbel's table has none, and bpost's list isn't openly licensed. Three codes (`1040`,
  `1050`, `1804`) belong to two municipalities; the lookups return both
  ([#54](https://github.com/pieterjanscheir/belgica/issues/54)).
- **One court address without a municipality**: the justice of the peace of Etterbeek
  publishes `1040 Brussel (Etterbeek)`, a shared code with a city line that names both
  municipalities, so `address.municipality` is left out rather than guessed. The justice of
  the peace of Limbourg publishes a temporary seat in Eupen's courthouse, so its municipality
  lies outside its arrondissement, as its page says.
- **ECLI codes** are only given where they appear in published decisions; the justices of the
  peace and most police courts have none there.
- **The house of justice in Eupen** is missing
  ([#3](https://github.com/pieterjanscheir/belgica/issues/3)).

Found something wrong or missing?
[Report a data correction](https://github.com/pieterjanscheir/belgica/issues/new?template=data-correction.yml)
or see [contributing](/guide/contributing). Planned datasets are on the [roadmap](./roadmap).
