# Qualité et fraîcheur des données {#data-quality-freshness}

Les données juridiques de référence vieillissent sans bruit : un nouveau taux d'intérêt est
publié, un tribunal déménage, une loi fusionne deux cantons. Cette page explique comment le
package reste à jour, et jusqu'où vous pouvez faire confiance à chaque jeu de données.

## D'où vient chaque jeu de données {#where-each-dataset-comes-from}

| Jeu de données            | Source                                   | Construction                                            | Change quand                                                       | Vérification tous les |
| ------------------------- | ---------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------ | --------------------- |
| Ressorts, arrondissements | Code judiciaire, annexe art. 4–5         | À la main                                               | Une loi redessine la carte judiciaire (rare ; la dernière en 2014) | 24 mois               |
| Cantons                   | Code judiciaire, annexe art. 1 (nl + fr) | Générés : `pnpm build:cantons`                          | Une loi modifie l'annexe ; des communes fusionnent                 | 12 mois               |
| Limites des cantons       | IGN (geo.be)                             | Deux fois par semaine : instantanés + `pnpm build:data` | L'IGN publie une nouvelle version                                  | Semaine               |
| Communes                  | Données ouvertes de Statbel              | Générées : `pnpm build:cantons`                         | Des communes fusionnent (2019, 2025)                               | 12 mois               |
| Régions, provinces        | Liste des codes REFNIS de Statbel        | Deux fois par semaine : instantanés + `pnpm build:data` | Statbel modifie son registre (dernière fois en 1995)               | Hebdomadaire          |
| Cours et tribunaux        | tribunaux-rechtbanken.be                 | Deux fois par semaine : instantanés + `pnpm build:data` | Un tribunal déménage ou change de contacts ou d'horaires           | Semaine               |
| Prisons                   | justitie.belgium.be                      | Deux fois par semaine : instantanés + `pnpm build:data` | Une prison ouvre, ferme ou change de contacts                      | Semaine               |
| Maisons de justice        | vlaanderen.be, maisonsdejustice.be       | Deux fois par semaine : instantanés + `pnpm build:data` | Une maison déménage ou change de contacts                          | Semaine               |
| Codes postaux             | Table de conversion de Statbel           | Deux fois par semaine : instantanés + `pnpm build:data` | Statbel publie une nouvelle table (fusions, nouveaux codes)        | Semaine               |
| Taux d'intérêt            | SPF Finances, Moniteur belge             | À la main                                               | Chaque année (légal) et chaque semestre (commercial)               | 6 mois                |

Les jeux de données générés ne sont jamais modifiés à la main. `pnpm build:cantons` analyse le
texte officiel et refuse d'écrire quoi que ce soit tant que les versions néerlandaise et
française ne concordent pas et que chaque commune n'est pas couverte ; `pnpm build:data` refuse
quand une page ne peut pas être rattachée, qu'un canton n'a pas de tribunal ou qu'un canton n'a
pas de limite dans le fichier de l'IGN.

## Comment les données sont construites {#how-the-data-is-built}

```
site officiel ──fetch──> snapshots (branche sources) ──parse──> data/*.json ──> pull request
```

1. **Récupération.** Chaque lundi et chaque jeudi, le [workflow sources](https://github.com/pieterjanscheir/belgica/actions/workflows/sources.yml)
   récupère chaque page des sources (`scripts/sources`), avec courtoisie : une requête par
   seconde et par site, avec un user agent qui nomme le projet. Il conserve chaque page sur la
   branche `sources`, avec un index de ce qui a été récupéré, quand, et un hachage de son
   contenu. Une page n'est enregistrée à nouveau que lorsque son contenu change, de sorte que
   l'historique de la branche montre ce qui a changé quel jour. Une page en échec (une erreur
   serveur, une 404) garde son dernier snapshot valide, et un parcours interrompu (une page de
   liste qui ne liste plus rien) laisse les snapshots de sa source tels quels. L'exécution
   continue avec les autres sources, pour qu'un seul site en panne ne bloque pas toutes les mises
   à jour : les enregistrements de la source en échec restent tels quels, sans jamais être
   retirés à partir d'une image incomplète. La pull request des données liste les sources en
   échec, et l'exécution échoue pour qu'une issue le signale aussi. Une page
   vers laquelle la source ne renvoie plus est retirée des snapshots ; son enregistrement reste
   dans les données, clôturé par un `validTo` (la veille de la vérification qui ne l'a plus
   trouvée), de sorte que son identifiant continue de fonctionner et qu'une recherche pour un
   jour antérieur le trouve encore. Une page qui apparaît reçoit un enregistrement avec un
   `validFrom`.
2. **Analyse.** `pnpm build:data` lit les snapshots (`scripts/parse`) et écrit les cours et
   tribunaux, les prisons, les maisons de justice et les limites des cantons. Il signale ce qu'il ne
   peut pas lire, et échoue quand une page ne peut pas être rattachée.
3. **Tests.** Le workflow vérifie les types et exécute les tests sur les nouvelles données.
4. **Relecture.** Quand les données ont changé, il ouvre ou met à jour une seule pull request
   avec le diff et la liste des valeurs illisibles. Une personne la vérifie par rapport aux
   sources et la fusionne.

Pour l'exécuter vous-même : `pnpm fetch:sources` (écrit dans `.sources/`), puis
`pnpm build:data`.

Les cantons et les communes sont reconstruits à la main avec `pnpm build:cantons` : le site du
Moniteur belge refuse les serveurs de GitHub
([#52](https://github.com/pieterjanscheir/belgica/issues/52)).

## Contrôles automatiques {#automatic-checks}

### À chaque changement (CI) {#on-every-change-ci}

- **Validation des schémas** : chaque fichier de données respecte son [JSON Schema](./schema).
- **Intégrité** : les identifiants sont uniques et bien formés ; chaque référence
  (arrondissement, canton, commune, tribunal, limite) pointe vers un enregistrement existant ; chaque
  canton a une limite, en GeoJSON valide situé en Belgique, qui recouvre la superficie du pays sans
  chevauchement ; chaque
  commune est dans exactement un canton ou scindée entre plusieurs ; chaque canton reste dans
  les provinces de son arrondissement ; chaque canton a exactement une justice de paix ; chaque
  division a le type et le ressort de son tribunal ; chaque catégorie de juridiction compte le
  nombre de tribunaux que la loi fixe ; chaque canton relève d'un tribunal de chaque type (un
  par langue à Bruxelles), et les cantons d'un tribunal se situent dans son arrondissement et
  dans son ressort.
- **Parsers** : testés de bout en bout sur des copies élaguées de pages réelles
  (`test/fixtures/sources`), et chaque lecteur (numéros de téléphone, IBAN, adresses, heures
  d'ouverture) sur les formes rencontrées dans les sources et sur ce qu'il doit refuser.
- **Taux d'intérêt** : les périodes sont triées, ne se chevauchent jamais et ne laissent aucun
  trou ; le taux légal court par année civile et le taux commercial par semestre ; le taux lié à
  la date du contrat de 2013–2015 n'apparaît que dans cette fenêtre.
- **Données de contact** : chaque IBAN passe sa somme de contrôle ISO 13616, les numéros de
  téléphone sont des numéros belges au format E.164, les adresses e-mail sont en minuscules, et
  les heures d'ouverture respectent la syntaxe `opening_hours`.
- **Code** : TypeScript strict (y compris l'accès par index non vérifié et les propriétés
  optionnelles exactes), ESLint avec des règles sensibles aux types, Prettier, et une couverture
  de test de 100 % de `src/`.
- **Packaging** : le package construit se charge avec `import` et avec `require()`, depuis
  chaque point d'entrée, sous Node 22.12, 22, 24 et 26 ; `publint` et `arethetypeswrong`
  vérifient les `exports` et les déclarations de types.

### Chaque semaine (planifié) {#every-week-scheduled}

Le [workflow freshness](https://github.com/pieterjanscheir/belgica/actions/workflows/freshness.yml)
s'exécute chaque lundi et ouvre une issue étiquetée
[`data-freshness`](https://github.com/pieterjanscheir/belgica/issues?q=label%3Adata-freshness)
quand il trouve quelque chose :

- **Taux manquants** : pas de taux légal ou commercial pour aujourd'hui, ou pas de taux
  commercial pour les deux prochaines semaines (le SPF Finances le publie avant le début du
  semestre).
- **Vérifications en retard** : la date `lastReviewed` d'un jeu de données dans
  `datapackage.json` est plus ancienne que son `reviewEveryMonths`.
- **Sources mortes** : une URL de source officielle dans `datapackage.json` ne répond plus.

Lancez-les vous-même avec `pnpm test:freshness` (ajoutez `FRESHNESS_ONLINE=1` pour vérifier les
URL).

## Comment lire une valeur {#how-to-read-a-value}

- **Absent n'est pas zéro.** `getInterestRate` renvoie `null` pour un jour sans taux connu,
  plutôt que de deviner ; un champ que la source ne donne pas (l'adresse d'un tribunal, des
  heures d'ouverture lisibles par machine) est absent plutôt que rempli. Traitez les deux cas.
- **Trop tôt est une erreur.** Une recherche pour un jour antérieur à la couverture d'un jeu de
  données lève une `RangeError` : les données ne peuvent pas répondre, et la réponse
  d'aujourd'hui aurait l'air d'être la bonne.
- **Les données de contact sont les moins stables.** Les numéros de téléphone, les adresses
  e-mail et les heures d'ouverture changent sans préavis. Chaque enregistrement indique de
  quelles pages il a été lu et quand (`sources`) ; consultez la page du tribunal (`website`)
  quand cela compte.
- **Le texte légal l'emporte.** Pour les communes scindées, le `territory` du canton est le
  texte même de la loi, mot pour mot. Quand un résumé, ou la [limite](/fr/data/canton-boundaries) de l'IGN, et le texte
  divergent, c'est le texte qui a raison.

## Signaler une erreur {#reporting-a-mistake}

[Ouvrez une correction de données](https://github.com/pieterjanscheir/belgica/issues/new?template=data-correction.yml)
avec l'identifiant de l'enregistrement et un lien vers la source officielle. Les corrections
sont publiées en versions patch.
