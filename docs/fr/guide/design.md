# Choix de conception {#design-decisions}

Le package a été repensé avant d'avoir ses premiers utilisateurs, si bien que chaque choix a pu
être fait sur ses mérites plutôt que par souci de compatibilité. Cette page consigne chaque
décision, la raison pour laquelle elle a été prise et ce qui en découle. Une nouvelle décision
reçoit une nouvelle entrée ; une décision abandonnée est marquée comme telle, pas supprimée.

## 1. Les données sont le produit ; le code est une commodité {#_1-the-data-is-the-product-the-code-is-a-convenience}

**Décision.** Les sources officielles sont la vérité ; les fichiers JSON de `data/` en sont
construits et constituent le produit. Ils sont utilisables sans le moindre TypeScript : depuis
Python, un tableur (les releases contiennent des tables CSV) ou `jq`. La structure de chaque
fichier est définie une seule fois, par les types TypeScript, et publiée sous forme d'un JSON
Schema généré à partir d'eux ; la CI échoue dès que les types, les schémas et les données ne
concordent pas. La bibliothèque ajoute des types, des index et des fonctions utilitaires, et rien
en elle n'est nécessaire pour comprendre les données.

**Pourquoi.** Les données de référence survivent au code qui les entoure, et la plupart des
utilisateurs de données juridiques belges ne sont pas des projets JavaScript.

**Donc.** Chaque fichier a un [JSON Schema](./schema) et une entrée dans `datapackage.json` avec
ses sources et sa licence. Les noms de champs et les valeurs sont expliqués dans la
documentation, pas seulement dans le code.

## 2. Les faits juridiques sont des données, jamais des calculs {#_2-legal-facts-are-data-never-computed}

**Décision.** Tout ce qui a une portée juridique (le nom d'un tribunal, le territoire d'un canton,
un taux) provient mot pour mot d'une source officielle et est stocké. Le code peut formater ou
rechercher ; il ne peut pas construire un fait juridique.

**Pourquoi.** Un code qui assemble un fait peut se tromper d'une manière que les tests ne
détectent pas : les noms français de tribunaux qu'un ancien `formatCourtName` construisait
étaient faux (`Tribunal de paix …`, alors que les juridictions s'appellent elles-mêmes
`Justice de paix …` ; [#10](https://github.com/pieterjanscheir/belgica/issues/10)). Une
valeur stockée peut être vérifiée par rapport à sa source.

**Donc.** Les noms des tribunaux sont stockés tels que chaque tribunal les publie, dans chaque
langue où il publie. `formatCourtName` recherche un nom (`style: 'official'`) ; son style
`'canton'` construit un libellé d'affichage à partir du numéro et du nom du canton ('Justice de
paix 1er canton Gand'), documenté comme libellé et jamais comme nom officiel. Les territoires des cantons restent du texte
légal verbatim, avec leur base légale sous forme de lien ELI. Quand une source manque, le champ
manque : rien n'est complété par supposition. Il en va de même pour l'analyse : un texte d'heures
d'ouverture contenant une remarque, un numéro de téléphone sans indicatif de zone ou une adresse
rédigée en une phrase sont laissés de côté, pas devinés.

## 3. Une seule règle d'identifiant {#_3-one-identifier-rule}

**Décision.** Un code officiel lorsqu'il en existe un qui couvre tous les enregistrements, sinon
du kebab-case en minuscules à partir du nom dans la langue locale ; les tribunaux sont `type` +
lieu. Les codes officiels qui ne couvrent qu'une partie des enregistrements (ECLI, OVO) sont des
champs. Voir [Identifiants](./identifiers).

## 4. Les liens sont des champs {#_4-links-are-fields}

**Décision.** Les enregistrements ne se réfèrent les uns aux autres que par des champs contenant
l'identifiant de l'autre enregistrement, nommés d'après le jeu de données qu'ils visent
(`arrondissement`, `canton`, `municipality`). Aucun identifiant n'est construit à partir d'un
autre.

**Pourquoi.** Une relation cachée dans le format d'une chaîne se brise en silence dès que l'un
des deux côtés change. Un champ est validé par le schéma (qui liste les identifiants valides) et
par les tests.

**Donc.** L'adresse d'un tribunal, d'une prison ou d'une maison de justice est liée à sa commune
de la même manière (`address.municipality`), par le code postal de la table de conversion de
Statbel, jamais par le nom de la localité
([#28](https://github.com/pieterjanscheir/belgica/issues/28)) ; un enregistrement de code
postal renvoie à sa commune plutôt que d'en copier le nom.

## 5. Valeurs canoniques, présentation dans le code {#_5-canonical-values-presentation-in-code}

**Décision.** Chaque valeur est stockée sous une seule forme canonique et standard, et le
formatage à destination des personnes est une fonction :

| Valeur             | Stockée comme                   | Standard                       |
| ------------------ | ------------------------------- | ------------------------------ |
| Jour               | `2024-06-15`                    | ISO 8601                       |
| Téléphone          | `+3253820701`                   | E.164                          |
| IBAN               | `BE73679200844560`              | ISO 13616, format électronique |
| Heures d'ouverture | `Mo-Fr 08:30-12:30,13:30-16:00` | OpenStreetMap `opening_hours`  |
| Langue             | clés `nl`, `fr`, `de`           | ISO 639-1                      |

**Pourquoi.** Une seule forme par valeur rend les valeurs comparables, validables (la somme de
contrôle de l'IBAN est testée) et exploitables par d'autres logiciels (liens `tel:`, systèmes de
paiement, analyseurs d'heures d'ouverture). Les conventions d'affichage varient selon le
contexte ; les données ne devraient pas.

## 6. Provenance sur chaque enregistrement {#_6-provenance-on-every-record}

**Décision.** Chaque jeu de données indique ses sources, sa licence et sa date de révision dans
`datapackage.json` ; chaque enregistrement issu d'une extraction indique les pages dont il a été
lu et le jour où leur contenu a été vu pour la première fois (`sources: [{ url, retrieved }]`).

**Pourquoi.** « D'où cela vient-il, et de quand cela date-t-il ? » est la première question qu'on
pose à des données juridiques.

## 7. Les données sont construites par des machines, à partir d'instantanés conservés {#_7-the-data-is-built-by-machines-from-kept-snapshots}

**Décision.** Deux fois par semaine, un workflow récupère les sources officielles, conserve les pages
sous forme d'instantanés sur la branche `sources`, en reconstruit les données avec les analyseurs
de `scripts/parse`, les teste et ouvre une pull request lorsqu'elles ont changé. Rien n'est saisi
à la main. Un job hebdomadaire distinct vérifie les taux d'intérêt manquants, les révisions en
retard et les sources mortes.

**Pourquoi.** Les données juridiques se périment en silence ; les gens oublient, les planifications
non. Des données saisies à la main ne peuvent être ni vérifiées ni refaites ; un analyseur peut
être testé, et les instantanés montrent exactement ce que la source disait ce jour-là. La pull
request garde une personne dans la boucle : les données de `main` ne changent jamais sans
relecture.

**Donc.** Les instantanés vivent sur leur propre branche, pour que l'historique du package ne
soit pas alourdi de mégaoctets de HTML. Les analyseurs sont testés sur des copies élaguées de
vraies pages. Une page que l'analyseur ne parvient pas à situer arrête la construction au lieu de
produire un enregistrement à moitié correct. Deux sources refusent les serveurs de GitHub
(ejustice, police.be) ; elles sont récupérées depuis une machine ordinaire
([#52](https://github.com/pieterjanscheir/belgica/issues/52)).

## 8. Distribution : ESM uniquement, Node 22.12+, construit à la release {#_8-distribution-esm-only-node-22-12-built-on-release}

**Décision.** Le package est en ESM uniquement, requiert Node 22.12 ou plus récent, et le
résultat de la construction n'est pas commité : il est construit et publié sur npm par le
workflow de release, avec provenance.

**Pourquoi.** Node 18 et 20 sont en fin de vie. Depuis Node 22.12, `require()` charge l'ESM, de
sorte qu'une construction CommonJS séparée n'ajouterait qu'une seconde copie des données (le
« dual-package hazard ») et davantage à tester. Un résultat de construction commité se périme et
a cassé les mises à jour automatiques de dépendances.

**Donc.** `import` et `require()` fonctionnent tous deux, testés sous Node 22.12, 22, 24 et 26.
Chaque jeu de données a son propre point d'entrée, si bien qu'une application qui n'a besoin que
des taux d'intérêt charge quelques kilooctets, et non les tribunaux et le texte légal de chaque
canton (la [page Premiers pas](./getting-started#import-only-what-you-need) mesure chaque point
d'entrée à partir du build).

## 9. Des types qui portent les garanties des données {#_9-types-that-carry-the-data-s-guarantees}

**Décision.** Les identifiants sont des types union générés ; les jeux de données sont
`readonly` ; les recherches avec un identifiant connu renvoient l'enregistrement, pas
`record | undefined` ; les vocabulaires fermés (types de tribunaux, catégories, types de contact)
sont des unions. Les libellés de contact sont du texte libre, tels que le tribunal les publie :
une liste fermée reviendrait à ramener des centaines de noms de greffes à quelques mots, ce qui
serait deviner.

**Pourquoi.** Les erreurs apparaissent pendant la frappe au lieu d'apparaître en production, et
les types documentent les données.

## 10. Garde-fous de qualité {#_10-quality-gates}

**Décision.** Chaque changement passe : TypeScript strict (y compris `noUncheckedIndexedAccess`
et `exactOptionalPropertyTypes`), ESLint avec les règles strictes tenant compte des types,
Prettier, 100 % de couverture de tests sur `src/`, validation JSON Schema de toutes les données,
tests d'intégrité (identifiants, liens, dénombrements, périodes), et `publint` +
`arethetypeswrong` sur le package empaqueté.

**Pourquoi.** Un package de référence ne vaut la peine qu'on en dépende que s'il est plus fiable
que de recopier les données à la main.

## 11. Le temps fait partie du modèle {#_11-time-is-part-of-the-model}

**Décision.** Les enregistrements portent une période de validité (`validFrom`, `validTo`, les
deux jours inclus), chaque jeu de données indique à partir de quel jour il décrit la situation
(`territoryCoverage`, et `temporalCoverage` dans `datapackage.json`), et les recherches acceptent
un jour optionnel : `getCanton(id, { on })`, `getCantonsForMunicipality(refnis, { on })`. Un jour
antérieur à la couverture lève une `RangeError`.

**Pourquoi.** Les questions juridiques portent sur un jour : quel tribunal était compétent quand
la citation a été signifiée, quel taux s'appliquait quand la facture est arrivée à échéance. Les
cantons, les communes et les tribunaux changent ; un modèle qui ne connaît que « maintenant »
répond aux questions sur le passé avec la carte d'aujourd'hui, et semble avoir raison en le
faisant. Ajouter le temps plus tard changerait chaque identifiant et chaque recherche, il est donc
dans le modèle avant que l'historique ne soit dans les données
([#27](https://github.com/pieterjanscheir/belgica/issues/27)).

**Donc.** Les taux d'intérêt ont déjà des périodes. Une recherche par identifiant sans jour donne
la version d'aujourd'hui, de sorte que les identifiants connus gardent leur type non-`undefined` ;
avec un jour, elle peut ne rien trouver. Chaque jeu de données porte la période, pas seulement le
territoire : un enregistrement extrait d'un site que la source cesse de recenser est clôturé par
un `validTo` plutôt que supprimé (`scripts/parse/retire.ts`), si bien qu'un identifiant, une fois
publié, reste, et qu'un tribunal qui ferme est toujours celui que nommait la citation de l'an
dernier.

## 12. Les releases transportent les données, pas seulement le package {#_12-releases-carry-the-data-not-only-the-package}

**Décision.** Chaque release GitHub contient les données en JSON et sous forme de tables CSV, avec
les schémas et `datapackage.json`, dans un seul zip. npm est une façon d'obtenir les données, pas
la seule.

**Pourquoi.** Les personnes qui ont le plus besoin de données de référence juridiques belges
travaillent dans des tableurs et dans d'autres langages, pas en JavaScript.

## 13. La géométrie est une seconde source, et le texte l'emporte {#_13-geometry-is-a-second-source-and-the-text-wins}

**Décision.** Les limites des cantons sont la numérisation par l'Institut géographique national
(IGN) de l'annexe au Code judiciaire, prise telle que publiée (sommet par sommet, sans
simplification, coordonnées au centimètre) et rattachée aux cantons par leur nom dans les deux
langues, avec une table d'alias explicite pour le reste. Le texte `territory` du canton reste la
loi : là où la géométrie et le texte divergent, le texte l'emporte. La géométrie a son propre
point d'entrée et la racine du package ne la réexporte pas.

**Pourquoi.** Les polygones de l'IGN sont une lecture officielle du même texte : on peut les citer
et les reconstruire ; une limite dérivée ici de données de rues serait une troisième lecture que
personne ne peut vérifier. Simplifier déplacerait la ligne, et les lignes comptent le plus là où
les cantons se touchent. Un million de positions éclipserait tous les autres jeux de données :
personne ne doit les charger par accident.

**Donc.** `findCantonsAt(lon, lat)` répond à partir de la géométrie et la documentation le dit ;
un point proche d'une ligne est un cas pour le texte. Le build des sources échoue quand un canton
n'a pas de limite ou qu'une entité ne correspond à aucun canton
([#29](https://github.com/pieterjanscheir/belgica/issues/29)).

## Pas encore décidé {#not-decided-yet}

| Question                                                                    | Issue                                                                                                  |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| L'historique antérieur au 1er janvier 2025                                  | [#27](https://github.com/pieterjanscheir/belgica/issues/27)                                            |
| Le calcul des intérêts sur une période (décompte des jours, capitalisation) | Pas prévu tant que la méthode ne peut pas être tirée de la jurisprudence ou d'une directive officielle |
