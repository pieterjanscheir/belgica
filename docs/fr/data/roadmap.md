# Feuille de route {#roadmap}

Les jeux de données prévus, avec l'issue qui spécifie chacun d'eux. Chaque issue liste les
sources officielles, les champs proposés et ce que « terminé » veut dire. L'aide est la
bienvenue : choisissez-en un et suivez les [conventions](/fr/guide/contributing#adding-a-dataset).

## Juridictions, services et personnes {#courts-offices-and-people}

| Jeu de données                                                                                                       | À quoi ça sert                                                                                                        | Issue                                                       |
| -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Les autres juridictions** : Cour de cassation, Cour constitutionnelle, Conseil d'État, juridictions disciplinaires | Les juridictions suprêmes ne sont pas sur le portail des cours et tribunaux ; il leur faut donc leurs propres sources | [#4](https://github.com/pieterjanscheir/belgica/issues/4)   |
| **La maison de justice d'Eupen** (Communauté germanophone)                                                           | La seule maison de justice que les données n'ont pas encore                                                           | [#3](https://github.com/pieterjanscheir/belgica/issues/3)   |
| **Compétence par division de tribunal** (afdelingen / divisions)                                                     | Où déposer au sein d'un tribunal, et la mention RPM sur les documents des sociétés                                    | [#58](https://github.com/pieterjanscheir/belgica/issues/58) |
| **Parquets** (parquets, auditorats du travail, parquets généraux, parquet fédéral)                                   | Où déposer une plainte pénale, et l'auditeur du travail dans les affaires de droit social                             | [#55](https://github.com/pieterjanscheir/belgica/issues/55) |
| **Chambres d'huissiers de justice** (gerechtsdeurwaarders / huissiers de justice) et leur territoire                 | Quelle chambre couvre un arrondissement, et un lien vers sa recherche d'huissier                                      | [#6](https://github.com/pieterjanscheir/belgica/issues/6)   |
| **Cadastre et bureaux de la sécurité juridique** (kadaster, anciens hypotheekkantoren)                               | Demander des certificats hypothécaires et des extraits cadastraux au bureau compétent                                 | [#8](https://github.com/pieterjanscheir/belgica/issues/8)   |
| **Chambres des notaires** et leur territoire                                                                         | La chambre compétente pour un bien ou une plainte, et un lien vers la recherche de notaire de Fednot                  | [#56](https://github.com/pieterjanscheir/belgica/issues/56) |
| **Barreaux** (balies / barreaux) et leurs bureaux d'aide juridique                                                   | Le bureau d'aide juridique pour une adresse, et le bâtonnier pour les questions déontologiques                        | [#57](https://github.com/pieterjanscheir/belgica/issues/57) |

## Territoire {#territory}

| Jeu de données                                                                                          | À quoi ça sert                                                                                                          | Issue                                                       |
| ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Historique** : quand les cantons, les communes et les juridictions ont changé                         | Le modèle a des périodes de validité et des recherches par jour ; les versions antérieures attendent encore les données | [#27](https://github.com/pieterjanscheir/belgica/issues/27) |
| **Anciennes communes** et les fusions de 2019 et 2025                                                   | Faire correspondre un ancien code REFNIS ou un ancien nom à la commune d'aujourd'hui                                    | [#53](https://github.com/pieterjanscheir/belgica/issues/53) |
| **Sections de commune** (deelgemeenten / sections de commune) par code postal                           | Les [codes postaux](./postal-codes) s'arrêtent à la commune ; les adresses nomment la localité                          | [#54](https://github.com/pieterjanscheir/belgica/issues/54) |
| **Adresse → canton** dans le package lui-même                                                           | Les docs et l'explorateur géocodent déjà une adresse ; le package pas encore                                            | [#66](https://github.com/pieterjanscheir/belgica/issues/66) |
| **Régions linguistiques et facilités linguistiques** par commune (taalgebieden / faciliteitengemeenten) | La langue de la procédure et des actes qui y sont signifiés                                                             | [#70](https://github.com/pieterjanscheir/belgica/issues/70) |

## Montants, taux et calendriers {#amounts-rates-and-calendars}

| Jeu de données                                                                                           | À quoi ça sert                                                                                   | Issue                                                       |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| **Frais de justice** (rolrechten / droits de mise au rôle, griffierechten / droits de greffe)            | Estimations de coûts et dépôt électronique ; le droit dépend de la date du dépôt                 | [#59](https://github.com/pieterjanscheir/belgica/issues/59) |
| **Indemnité de procédure** (rechtsplegingsvergoeding / indemnité de procédure)                           | Les tranches et leur indexation, pour chaque estimation de coûts et chaque jugement              | [#60](https://github.com/pieterjanscheir/belgica/issues/60) |
| **Seuils de montant pour la compétence et l'appel** (art. 590, 617 C. jud.)                              | Quel juge connaît d'une demande, et si son jugement est susceptible d'appel                      | [#69](https://github.com/pieterjanscheir/belgica/issues/69) |
| **Vacances judiciaires et jours fériés**                                                                 | Le calcul des délais de procédure                                                                | [#61](https://github.com/pieterjanscheir/belgica/issues/61) |
| **Indice santé** (gezondheidsindex / indice santé) par mois                                              | Indexation des loyers et des pensions alimentaires                                               | [#62](https://github.com/pieterjanscheir/belgica/issues/62) |
| **Clauses indemnitaires et plafonds d'intérêts pour les dettes des consommateurs** (Livre XIX WER / CDE) | Ce qui peut être réclamé à un consommateur qui paie en retard                                    | [#63](https://github.com/pieterjanscheir/belgica/issues/63) |
| **Quotités saisissables** (beslagbare bedragen / quotités saisissables, art. 1409 C. jud.)               | Quelle part d'un salaire ou d'une allocation peut être saisie, indexée chaque année              | [#67](https://github.com/pieterjanscheir/belgica/issues/67) |
| **Taux d'intérêt fiscaux** : intérêts de retard et intérêts moratoires                                   | Les intérêts dans les litiges fiscaux, à côté des [taux légaux et commerciaux](./interest-rates) | [#68](https://github.com/pieterjanscheir/belgica/issues/68) |

## Pourquoi certains jeux de données ne sont pas encore là {#why-some-datasets-aren-t-here-yet}

Un jeu de données juridiques n'est utile que si chaque valeur vient d'une source officielle ;
rien n'est donc ajouté à la main, de mémoire. Chaque jeu de données est construit par un script
à partir d'instantanés de sa source, et la plupart des sources sont récupérées deux fois par semaine par
GitHub Actions. Deux ne peuvent pas l'être, pour l'instant : le site du Moniteur belge
(ejustice), d'où viennent les cantons, et police.be refusent tous deux les connexions depuis les
serveurs de GitHub ; ils sont récupérés depuis une machine ordinaire à la place
([#52](https://github.com/pieterjanscheir/belgica/issues/52)).

Les registres de personnes (huissiers, notaires, experts judiciaires, médiateurs pris
individuellement) ne sont pas prévus : ils changent sans cesse et chaque enregistrement est une
donnée personnelle. Les docs renvoient donc vers la recherche officielle, et les données gardent
les chambres et le territoire qu'elles couvrent.
