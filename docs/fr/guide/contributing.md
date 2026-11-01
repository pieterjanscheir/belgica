# Contribuer {#contributing}

## Mettre à jour les données {#updating-data}

Les cours et tribunaux, les prisons, les maisons de justice et les limites des cantons sont construits
chaque semaine à partir des sources officielles ([comment](./data-quality#how-the-data-is-built)) : ne les modifiez
pas à la main. Corrigez le parser dans `scripts/parse` ou, si la source elle-même est erronée,
signalez-le au tribunal. La pull request hebdomadaire est relue comme n'importe quelle autre :
comparez le diff avec les sources avant de fusionner.

Pour les jeux de données tenus à la main (ressorts, arrondissements, taux d'intérêt) :

1. Modifiez le JSON dans `data/`. Conservez les identifiants existants : des projets les
   stockent.
2. Mettez à jour `lastReviewed` pour le jeu de données dans `datapackage.json` si vous l'avez
   vérifié par rapport à ses sources.
3. `pnpm check` : régénère les types d'identifiants et les schémas, vérifie les types, lance le
   lint et le contrôle de formatage, construit le package, exécute les tests avec couverture et
   le lint du package. Il échoue quand les fichiers générés ne sont pas commités.
4. Ajoutez une ligne à `CHANGELOG.md` sous Unreleased, et commitez (y compris `schema/`,
   `src/ids.generated.ts` et `ids.lock.json`). La sortie de build (`dist/`) n'est pas commitée :
   elle est construite pour chaque version et publiée sur npm.

Un identifiant publié reste : `ids.lock.json` les liste tous et les tests échouent quand l'un
d'eux manque dans les données. Si une source a renommé un enregistrement, faites correspondre le
nouveau nom à l'identifiant existant dans le parser ; si l'enregistrement a pris fin, gardez-le
avec un `validTo`. Voir [Identifiants](./identifiers#stability).

### Cantons et communes {#cantons-and-municipalities}

`data/cantons.json` et `data/municipalities.json` sont générés ; ne les modifiez pas à la main.
Lancez `pnpm build:cantons` (nécessite un accès réseau et `unzip`). Il lit :

- l'annexe au Code judiciaire, « Gebiedsomschrijving en zetel van hoven en rechtbanken »
  (« Délimitation du territoire et siège des cours et tribunaux »)
  ([ELI, numac 1967101058](https://www.ejustice.just.fgov.be/eli/wet/1967/10/10/1967101058/justel)),
  en néerlandais et en français ;
- le fichier de population par commune de Statbel pour les communes actuelles et les codes
  REFNIS.

Il analyse séparément les textes néerlandais et français et refuse d'écrire quoi que ce soit
tant qu'ils ne concordent pas et que chaque commune n'est pas couverte exactement une fois (ou
scindée entre plusieurs cantons). Les exonymes que l'annexe emploie mais pas Statbel
(`Gembloers`, `Saint-Nicolas`, …), les coquilles de l'annexe et les mentions de limites qu'il ne
sait pas distinguer sont listés en tête du script.

Relancez-le après qu'une loi a modifié l'annexe ou que des communes ont fusionné. Les
identifiants des cantons suivent la langue locale (le néerlandais en Flandre et à Bruxelles, le
français en Wallonie, l'allemand autour d'Eupen) ; la justice de paix du canton `x` a
l'identifiant `justice-of-the-peace-x` et y renvoie par son champ `canton`.

### Jeux de données extraits des sites {#scraped-datasets}

```bash
pnpm fetch:sources            # chaque source dans .sources/ (environ 20 minutes, avec courtoisie)
pnpm fetch:sources courts     # ou une seule source
pnpm build:data               # reconstruit les cours et tribunaux, prisons, maisons de justice, codes postaux, régions et provinces à partir de .sources/
```

Les limites des cantons viennent du GeoPackage de l'IGN (source `ngi`), lu avec le SQLite propre à
Node ; quand l'IGN renomme un canton, associez son code à l'identifiant dans `CANTON_ALIASES` de
`scripts/parse/boundaries.ts`.

Ou récupérez les derniers snapshots au lieu de les télécharger :
`git worktree add .sources origin/sources`.

Une source est un parcours dans `scripts/sources/catalog.ts` ; un parser lit ses snapshots dans
`scripts/parse`. Quand un site change son balisage, les tests des parsers dans `test/parse` (sur
des copies élaguées de pages réelles dans `test/fixtures/sources`) montrent ce qui a cassé.

### Nouveaux taux d'intérêt {#new-interest-rates}

- **Commercial** : le SPF Finances publie le taux par semestre. Ajoutez une période avec `from`,
  `to`, `rate`, et la date du Moniteur belge dans `note`.
- **Légal** : publié par année civile. Ajoutez une période pour l'année.

## Ajouter un jeu de données {#adding-a-dataset}

Chaque jeu de données reçoit le même traitement, pour que les utilisateurs puissent s'y fier :

1. **Données** : `data/<name>.json`, un tableau d'enregistrements. Chaque valeur provient d'une
   source officielle.
2. **Identifiants** : suivez les [règles des identifiants](./identifiers) : un code officiel
   quand il en existe un, sinon du kebab-case en minuscules à partir du nom dans la langue locale
   (`scripts/id.ts`).
3. **Des liens, pas des copies** : désignez les arrondissements, les cantons et les communes par
   leur identifiant, et réutilisez les types partagés (`Translated`, `Address`, `Contact`,
   `SourceRef`).
4. **Sources** : un `sources: [{ url, retrieved }]` sur chaque enregistrement, et une entrée dans
   `datapackage.json` avec les sources du jeu de données, sa licence, `lastReviewed` et
   `reviewEveryMonths`.
5. **Types et fonctions d'aide** : `src/<name>.ts`, exporté depuis `src/index.ts`, plus un point
   d'entrée dans `tsup.config.ts` et dans les `exports` de `package.json`.
6. **Schéma** : ajoutez le type de fichier à `scripts/schema-types.ts` et à
   `scripts/build-schemas.ts`.
7. **Source et parser** : un parcours dans `scripts/sources/catalog.ts` qui récupère les pages
   officielles, et un parser dans `scripts/parse` qui construit le fichier à partir des
   snapshots, avec des fixtures et des tests. Il ne lit que ce qu'il peut lire avec certitude et
   signale le reste.
8. **Tests** : identifiants uniques, références qui se résolvent, et le nombre que donne la
   source officielle.
9. **Docs** : une page sous `docs/data/` avec son utilité, sa source et ses mises à jour, et un
   tableau des champs.

### Garder le package léger {#keeping-the-package-light}

Chaque jeu de données est installé par chaque utilisateur, quoi qu'il importe : un nouveau jeu ne
doit donc pas alourdir le package pour tout le monde.

1. **Un jeu de données, un point d'entrée.** Son propre sous-chemin dans `tsup.config.ts` et dans
   les `exports` de `package.json`. Ne le réexportez depuis `src/index.ts` que s'il est minuscule.
2. **Les grosses données se chargent à la demande.** Au-delà d'environ 500 Ko, découpez-les en un
   petit index et des fichiers chargés quand on les demande, comme `data/courts/` et
   `belgica/courts/load` (`scripts/build-data-files.ts`).
3. **Une seule copie.** Le fichier canonique est dans `data/` ; ne l'intégrez pas en plus dans
   `dist/`.
4. **La géométrie est optionnelle.** Les points et les limites ont leur propre point d'entrée,
   jamais à côté des données tabulaires.
5. **Vérifiez la taille.** `pnpm test:package` affiche la taille du package et échoue au-delà des
   limites de `test/smoke/package-size.mjs` (le package entier, le package sans les limites, et
   chaque fichier), et `test/smoke/bundle-size.mjs` fait de même pour ce qu'embarque une
   application web. La CI affiche les chiffres dans le résumé du job. Relevez une limite
   délibérément, avec la raison dans le changelog.

Les données personnelles restent dehors. Un registre de personnes physiques (huissiers, notaires,
experts, médiateurs pris individuellement) change sans cesse et chaque enregistrement est une
donnée personnelle : renvoyez vers la recherche officielle, et gardez les études, les chambres et
le territoire qu'elles couvrent.

## Contrôles {#checks}

| Commande                    | Ce qu'elle fait                                                                                                                                                              |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm check`                | Tout ce que la CI exécute : `generate`, `typecheck`, `lint`, `build`, `test:coverage`, `test:package`, `lint:package`, et un contrôle que les fichiers générés sont commités |
| `pnpm test`                 | Tests unitaires, d'intégrité, de schéma et de types sur la source (sans build)                                                                                               |
| `pnpm test:package`         | Tests de fumée du package construit avec `import` et `require()` : lancez `pnpm build` d'abord                                                                               |
| `pnpm test:coverage`        | Les mêmes, en échouant sous 100 % de couverture de `src/`                                                                                                                    |
| `pnpm lint` / `pnpm format` | ESLint et Prettier : contrôle / correction. ESLint exige aussi un commentaire de documentation sur chaque export de `src/`                                                   |
| `pnpm generate`             | Régénère `src/ids.generated.ts` (types d'identifiants) et `schema/` à partir des données et des types, et ajoute les nouveaux identifiants à `ids.lock.json`                 |
| `pnpm lint:package`         | `publint` et `arethetypeswrong` sur le package empaqueté                                                                                                                     |
| `pnpm test:freshness`       | Contrôles liés à la date : taux manquants, vérifications en retard. Ne fait pas partie de `check` ; `FRESHNESS_ONLINE=1` vérifie aussi les URL des sources                   |
| `pnpm fetch:sources`        | Récupère les sources officielles dans `.sources/`                                                                                                                            |
| `pnpm build:data`           | Reconstruit les cours et tribunaux, les prisons, les maisons de justice, les codes postaux, les régions, les provinces et les limites des cantons à partir de `.sources/`    |
| `pnpm build:csv`            | Écrit les données sous forme de tables CSV dans `csv/`                                                                                                                       |

## Publier une version {#releasing}

1. Déplacez les entrées Unreleased de `CHANGELOG.md` sous la nouvelle version.
2. Incrémentez `version` dans `package.json` et commitez.
3. Taguez et poussez : `git tag v0.3.0 && git push && git push --tags`.

Le workflow release exécute `pnpm check`, publie le tag sur npm avec provenance, et crée une
release GitHub avec les données, les schémas et les tables CSV en pièces jointes. Le tag doit
correspondre à `version`.

## Ce site web {#this-website}

Le site se trouve dans `docs/` et est construit avec [VitePress](https://vitepress.dev). Les
tableaux interactifs importent les propres `src/` et `data/` du package ; ils montrent donc
toujours les données du dépôt.

```bash
pnpm docs:dev      # serveur local avec rechargement à chaud
pnpm docs:build    # site statique dans docs/.vitepress/dist
pnpm docs:preview  # sert le site construit
```

Chaque push sur `main` le déploie sur GitHub Pages. La CI le construit à chaque pull request ;
une page cassée est donc détectée avant la fusion.

### Traductions {#translations}

Les pages anglaises sous `docs/` font foi. Chaque autre langue a la même arborescence dans son
propre dossier : néerlandais (`docs/nl/`) et français (`docs/fr/`), ainsi qu'allemand, espagnol,
italien, portugais, polonais, turc, arabe, ukrainien, chinois et japonais (`docs/de/`,
`docs/es/`, etc.). Ce sont des traductions de la page anglaise, mises à jour après sa
modification. Quand vous modifiez une page anglaise, modifiez aussi la même page dans
`docs/nl/` et `docs/fr/`, ou signalez dans la pull request que les traductions sont en retard ;
les autres langues peuvent avoir une version de retard. Les textes du thème et des composants
interactifs dans ces autres langues se trouvent dans `docs/.vitepress/locales/`.

Le code, les ids, les noms de champs et les noms officiels restent tels quels dans chaque
langue, et chaque titre garde son ancre anglaise (`## Titre {#english-anchor}`), de sorte que
les liens entre pages et le sélecteur de langue continuent de fonctionner. Une institution ou
une notion juridique belge garde son nom officiel néerlandais ou français (ou allemand, quand
la Belgique en publie un) plutôt qu'une traduction inventée : une page chinoise dit
vredegerecht / justice de paix, pas un mot forgé pour l'occasion. Le changelog n'est tenu
qu'en anglais.
