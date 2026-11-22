<script setup>
import { data as stats } from '../../.vitepress/stats.data'
</script>

# Lacune note {#known-gaps}

- **Le giurisdizioni che non sono sul portale** non sono nei dati: l'Hof van Cassatie / Cour de
  cassation, il Grondwettelijk Hof / Cour constitutionnelle, il Raad van State / Conseil d'État
  e i tribunali disciplinari ([#4](https://github.com/pieterjanscheir/belgica/issues/4)).
- **Le regole che mandano un tipo di causa a un'unica sezione non sono nei dati.** Ogni sezione
  ha la sua area, e la sua area nelle cause penali quando il decreto ne stabilisce un'altra
  ([sezioni](/it/data/courts#divisions)). Un decreto può anche mandare un tipo di causa a
  un'unica sezione per tutto il tribunale, come le procedure di regolamento collettivo dei debiti
  del tribunal du travail dell'Hainaut: `findDivisionsWithJurisdiction` non le conosce.
- **{{ stats.courts.withoutAddress }} tribunali non hanno un indirizzo unico**: un tribunale le
  cui sezioni hanno ciascuna il proprio (l'indirizzo è sulla sezione), oppure uno che pubblica i
  suoi indirizzi sotto forma di frase. Il loro `address` manca invece di essere indovinato; le
  sezioni hanno il proprio.
- **Orari di apertura**: {{ stats.courts.hoursParsed }} dei
  {{ stats.courts.hoursParsed + stats.courts.hoursTextOnly }} tribunali che pubblicano orari li
  hanno nella sintassi `opening_hours`. Gli altri pubblicano un testo con note o disposizioni
  temporanee, conservato solo come `openingHoursText`.
- **Le etichette dei contatti sono nella lingua della pagina**: per un tribunale bilingue, quelle
  della pagina neerlandese (quelle della pagina tedesca a Eupen). Anche i nomi e gli orari della
  pagina francese sono presenti.
- **Alcuni valori delle pagine sorgente non si possono leggere**, e vengono omessi: un numero di
  telefono senza prefisso (`+32 682 05 28`), un fax "désactivé". La pull request settimanale dei
  dati li elenca, così possono essere segnalati al tribunale.
- **La pagina francese del vredegerecht / justice de paix (giudice di pace) di
  Tongeren-Borgloon** lo chiama ancora `Justice de paix de Tongres-Fourons`, il suo nome prima
  delle fusioni comunali del 2025. I dati conservano il nome come pubblicato e lo collegano al
  cantone giusto.
- **Ancora nessuna storia**: i dati sul territorio descrivono la situazione dal 1° gennaio 2025,
  e i dati sui tribunali il giorno in cui sono stati letti. Le ricerche per un giorno precedente
  lanciano un errore invece di rispondere con la mappa di oggi
  ([#27](https://github.com/pieterjanscheir/belgica/issues/27)).
- **I nomi e le sedi dei cantoni** sono solo in neerlandese e in francese: l'allegato al
  Gerechtelijk Wetboek / Code judiciaire non ha un testo tedesco consolidato.
- **I comuni suddivisi** (Antwerpen, Gent, Brussel, Luik, …) corrispondono a più cantoni. Un
  codice postale porta al comune (`findCourtsForPostalCode`); per scegliere il cantone serve
  l'indirizzo con la via: `findCantonsAt(lon, lat)` lo trova a partire dalle coordinate con i
  [confini dei cantoni](./canton-boundaries), ma la geocodifica dell'indirizzo spetta a te, e i
  confini sono la lettura dell'NGI del testo di legge in `territory`, che prevale dove non
  concordano ([#66](https://github.com/pieterjanscheir/belgica/issues/66)).
- **I codici postali si fermano al comune.** Le frazioni (deelgemeenten) non sono nei dati: la
  tabella di Statbel non le ha, e l'elenco di bpost non ha una licenza aperta. Tre codici
  (`1040`, `1050`, `1804`) appartengono a due comuni; le ricerche restituiscono entrambi
  ([#54](https://github.com/pieterjanscheir/belgica/issues/54)).
- **Un indirizzo di tribunale senza comune**: il giudice di pace di Etterbeek pubblica
  `1040 Brussel (Etterbeek)`, un codice condiviso con una riga della città che nomina entrambi i
  comuni, quindi `address.municipality` viene omesso invece di essere indovinato. Il giudice di
  pace di Limbourg pubblica una sede temporanea nel palazzo di giustizia di Eupen, quindi il suo
  comune si trova fuori dal suo arrondissement, come dice la sua pagina.
- **I codici ECLI** sono indicati solo dove compaiono in decisioni pubblicate; i giudici di pace
  e la maggior parte dei politierechtbanken / tribunaux de police non ne hanno.
- **La justitiehuis / maison de justice di Eupen** manca
  ([#3](https://github.com/pieterjanscheir/belgica/issues/3)).

Hai trovato qualcosa di sbagliato o mancante?
[Segnala una correzione dei dati](https://github.com/pieterjanscheir/belgica/issues/new?template=data-correction.yml)
o vedi [contribuire](/it/guide/contributing). I dataset previsti sono nella [roadmap](./roadmap).
