<script setup>
import { data as stats } from '../../.vitepress/stats.data'
</script>

# Bekannte Lücken {#known-gaps}

- **Gerichte, die nicht auf dem Portal stehen**, sind nicht in den Daten: der Kassationshof, der
  Verfassungsgerichtshof, der Staatsrat und die Disziplinargerichte
  ([#4](https://github.com/pieterjanscheir/belgica/issues/4)).
- **Regeln, die eine Art von Sachen einer einzigen Abteilung zuweisen, sind nicht in den Daten.**
  Jede Abteilung hat ihr Gebiet und, wo der Erlass ein anderes festlegt, ihr Gebiet in Strafsachen
  ([Abteilungen](/de/data/courts#divisions)). Ein Erlass kann auch eine Art von Sachen für das ganze
  Gericht einer einzigen Abteilung zuweisen, etwa die kollektiven Schuldenregelungen des
  Arbeitsgerichts Hennegau: Diese kennt `findDivisionsWithJurisdiction` nicht.
- **{{ stats.courts.withoutAddress }} Gerichte haben keine einheitliche Adresse**: ein Gericht,
  dessen Abteilungen je eine eigene haben (die Adresse steht bei der Abteilung), oder eines, das
  seine Adressen als Satz veröffentlicht. Ihr `address` fehlt, statt geraten zu werden; die
  Abteilungen haben ihre eigene.
- **Öffnungszeiten**: {{ stats.courts.hoursParsed }} der
  {{ stats.courts.hoursParsed + stats.courts.hoursTextOnly }} Gerichte, die Zeiten veröffentlichen,
  haben sie in `opening_hours`-Syntax. Die übrigen veröffentlichen Text mit Anmerkungen oder
  vorübergehenden Regelungen, der nur als `openingHoursText` erhalten bleibt.
- **Kontaktbezeichnungen sind in der Sprache der Seite**: bei einem zweisprachigen Gericht die der
  niederländischen Seite (in Eupen die der deutschen Seite). Die Namen und Zeiten der französischen
  Seite sind ebenfalls enthalten.
- **Manche Werte auf den Quellseiten sind nicht lesbar** und werden weggelassen: eine Telefonnummer
  ohne Vorwahl (`+32 682 05 28`), ein Fax, das „désactivé“ ist. Der wöchentliche Daten-Pull-Request
  listet sie auf, damit sie dem Gericht gemeldet werden können.
- **Die französische Seite des Friedensgerichts Tongeren-Borgloon** nennt es noch
  `Justice de paix de Tongres-Fourons`, seinen Namen vor den Gemeindefusionen von 2025. Die Daten
  behalten den Namen wie veröffentlicht und verknüpfen ihn mit dem richtigen Kanton.
- **Noch keine Historie**: Die Gebietsdaten beschreiben die Lage ab dem 1. Januar 2025, die
  Gerichtsdaten den Tag, an dem sie gelesen wurden. Nachschlagen für einen früheren Tag wirft einen
  Fehler, statt mit der Karte von heute zu antworten
  ([#27](https://github.com/pieterjanscheir/belgica/issues/27)).
- **Kantonsnamen und -sitze** gibt es nur auf Niederländisch und Französisch: Die Anlage zum
  Gerichtsgesetzbuch hat keinen koordinierten deutschen Text.
- **Geteilte Gemeinden** (Antwerpen, Gent, Brüssel, Lüttich, …) entsprechen mehreren Kantonen. Eine
  Postleitzahl führt zur Gemeinde (`findCourtsForPostalCode`); für die Wahl des Kantons braucht es
  die Straßenadresse: `findCantonsAt(lon, lat)` findet ihn aus Koordinaten mit den
  [Kantonsgrenzen](./canton-boundaries), aber das Geocodieren der Adresse liegt bei Ihnen, und die
  Grenzen sind die Lesart des NGI des Gesetzestexts in `territory`, der bei Abweichungen gewinnt
  ([#66](https://github.com/pieterjanscheir/belgica/issues/66)).
- **Postleitzahlen enden bei der Gemeinde.** Teilgemeinden (deelgemeenten) sind nicht in den Daten:
  Die Tabelle von Statbel enthält keine, und die Liste von bpost steht nicht unter einer offenen
  Lizenz. Drei Codes (`1040`, `1050`, `1804`) gehören zu zwei Gemeinden; die Nachschlagefunktionen
  geben beide zurück ([#54](https://github.com/pieterjanscheir/belgica/issues/54)).
- **Eine Gerichtsadresse ohne Gemeinde**: Das Friedensgericht Etterbeek veröffentlicht
  `1040 Brussel (Etterbeek)`, einen geteilten Code mit einer Ortszeile, die beide Gemeinden nennt;
  `address.municipality` wird daher weggelassen, statt geraten zu werden. Das Friedensgericht
  Limbourg veröffentlicht einen vorübergehenden Sitz im Gerichtsgebäude von Eupen, sodass seine
  Gemeinde außerhalb seines Gerichtsbezirks liegt, wie seine Seite sagt.
- **ECLI-Codes** sind nur dort angegeben, wo sie in veröffentlichten Entscheidungen vorkommen; die
  Friedensgerichte und die meisten Polizeigerichte haben dort keine.
- **Das Justizhaus in Eupen** fehlt
  ([#3](https://github.com/pieterjanscheir/belgica/issues/3)).

Haben Sie etwas Falsches oder Fehlendes gefunden?
[Melden Sie eine Datenkorrektur](https://github.com/pieterjanscheir/belgica/issues/new?template=data-correction.yml)
oder siehe [Mitwirken](/de/guide/contributing). Geplante Datensätze stehen in der
[Roadmap](./roadmap).
