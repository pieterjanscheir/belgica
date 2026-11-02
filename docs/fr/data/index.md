# Jeux de données {#datasets}

Chaque jeu de données est un fichier JSON dans `data/`, décrit par un [JSON Schema](/fr/guide/schema) et repris
dans [`datapackage.json`](/fr/guide/schema#datapackage-json) avec ses sources officielles, sa licence et
la date de sa dernière vérification par rapport à celles-ci.

| Jeu de données                                 | Enregistrements | À quoi il sert                                                                                                               |
| ---------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| [Ressorts](./territory#judicial-areas)         | 5               | Quelle cour d'appel (et quelle cour du travail) connaît d'un appel                                                           |
| [Arrondissements](./territory#arrondissements) | 12              | Regrouper les tribunaux, les parquets et les huissiers de justice ; l'unité qu'utilisent la plupart des règles de compétence |
| [Cantons](./territory#cantons)                 | 162             | Quelle justice de paix est compétente pour une adresse                                                                       |
| [Limites des cantons](./canton-boundaries)     | 162             | Le canton d'un point dans une ville scindée ; les cantons sur une carte (GeoJSON)                                            |
| [Communes](./territory#municipalities)         | 565             | Relier toute adresse ou statistique belge à la carte judiciaire par le code REFNIS                                           |
| [Régions](./territory#regions)                 | 3               | La région d'une commune, par code REFNIS, nommée en trois langues                                                            |
| [Provinces](./territory#provinces)             | 10              | La province d'une commune (aucune à Bruxelles), avec sa région                                                               |
| [Codes postaux](./postal-codes)                | 1 152           | Du code postal d'une adresse à sa commune, puis à ses cantons et à ses juridictions                                          |
| [Zones de police](./police-zones)              | 175             | Quelle zone de police s'occupe d'une commune, par son numéro de zone officiel                                                |
| [Cours et tribunaux](./courts)                 | 347             | Noms, adresses et coordonnées des greffes pour écrire à n'importe quelle juridiction, y déposer un acte ou la payer          |
| [Prisons](./prisons)                           | 39              | Adresses et coordonnées de chaque prison et maison de détention                                                              |
| [Maisons de justice](./houses-of-justice)      | 27              | Probation, aide aux victimes et études sociales pour les tribunaux de la famille                                             |
| [Taux d'intérêt](./interest-rates)             | 2 séries        | Calculer les intérêts de retard sur une créance                                                                              |

## Comment les jeux de données s'articulent {#how-the-datasets-fit-together}

```
Ressort ──< Arrondissement ──< Canton >──< Commune (REFNIS) ──< Code postal
   │              │              │  │
   │              │              │  └── Limite de canton   la géométrie du canton (IGN)
   └────────── Tribunal ─────────┘  une justice de paix renvoie à son canton,
                  │                 et l'adresse de chaque tribunal à sa commune
                  └──< Division     une division renvoie à son tribunal
```

`──<` se lit « a plusieurs ». Une commune est généralement dans un seul canton ; les villes scindées (Anvers, Gand,
Bruxelles, Liège, …) en couvrent plusieurs. Côté administratif : `Région ──< Province ──< Commune`,
sauf que la Région de Bruxelles-Capitale n'a pas de province et contient directement ses 19 communes.

Les enregistrements se renvoient les uns aux autres par identifiant, jamais par nom : une juridiction porte un
identifiant `judicialArea` et, lorsque son territoire se limite à un arrondissement, un identifiant
`arrondissement` ; un canton énumère les codes REFNIS de ses communes ; un code postal et l'adresse d'un
tribunal portent le code REFNIS de leur commune. L'orthographe des noms varie d'une source et d'une
langue à l'autre ; les identifiants, non.

## À quoi ces données servent {#why-this-data-is-useful}

Le travail juridique belge bute sans cesse sur les mêmes recherches, et les sources officielles se prêtent
mal à une exploitation par programme :

- **Compétence.** La justice de paix, le tribunal de police et bien d'autres juridictions sont compétents
  en fonction du lieu. La loi (l'annexe au Code judiciaire) décrit ces territoires en prose, parfois
  rue par rue. `cantons.json` en fait une table de correspondance de la commune au canton, et
  conserve le texte légal pour les villes scindées ; `canton-boundaries.json` y ajoute la géométrie
  de l'IGN, si bien qu'un point d'une ville scindée trouve son canton.
- **Noms et adresses exacts.** Les exploits, conclusions et courriers doivent désigner la juridiction
  telle qu'elle se nomme elle-même, par exemple `Vredegerecht Gent 1` ou
  `Ondernemingsrechtbank Gent - afdeling Brugge`, et parvenir au bon greffe. Les noms sont
  repris des pages des juridictions elles-mêmes, dans chaque langue où elles publient.
- **Calculs d'intérêts.** Les créances pour retard de paiement se calculent au taux légal ou, entre
  entreprises, au taux applicable aux transactions commerciales. Les deux changent chaque année ou chaque
  semestre, et la transition de 2013–2015 dépend de la date du contrat. Une seule période erronée modifie
  le montant réclamé.
- **Croiser d'autres données.** Les codes REFNIS sont ceux qu'utilisent Statbel, les Régions et la plupart
  des données ouvertes. Leur correspondance avec les cantons et les arrondissements permet de placer des
  données de charge de travail, de population ou d'adresses sur la carte judiciaire.

## Ce qui n'y est pas (encore) {#what-isn-t-in-it-yet}

Voyez les [lacunes connues](./known-gaps) pour les limites des données actuelles et la
[feuille de route](./roadmap) pour les jeux de données prévus : les juridictions suprêmes, l'historique, les
huissiers de justice, les zones de police, ainsi que les bureaux du cadastre et des hypothèques.

::: warning Données de référence, pas un avis juridique
Les données sont vérifiées par rapport aux sources officielles, mais les sources changent et les erreurs
arrivent. Vérifiez la source officielle avant de vous fier à une valeur, et
[signalez toute erreur](https://github.com/pieterjanscheir/belgica/issues/new?template=data-correction.yml).
:::
