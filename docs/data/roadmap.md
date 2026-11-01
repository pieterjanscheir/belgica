# Roadmap

Datasets that are planned, with the issue that specifies each one. Each issue lists the
official sources, the proposed fields and what "done" means. Help is welcome: pick one and
follow the [conventions](/guide/contributing#adding-a-dataset).

The public and judicial holidays ([#61](https://github.com/pieterjanscheir/belgica/issues/61))
were on this list and have shipped: see [public holidays](./public-holidays).

## Courts, offices and people

| Dataset                                                                                               | Why it's useful                                                                                 | Issue                                                       |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **The other courts**: Court of Cassation, Constitutional Court, Council of State, disciplinary courts | The highest courts aren't on the courts' portal, so they need their own sources                 | [#4](https://github.com/pieterjanscheir/belgica/issues/4)   |
| **The house of justice in Eupen** (German-speaking Community)                                         | The one house of justice the data doesn't have yet                                              | [#3](https://github.com/pieterjanscheir/belgica/issues/3)   |
| **Jurisdiction per court division** (afdelingen / divisions)                                          | Where to file within a court, and the RPR / RPM mention on company documents                    | [#58](https://github.com/pieterjanscheir/belgica/issues/58) |
| **Prosecutors' offices** (parketten, arbeidsauditoraten, parketten-generaal, federal prosecutor)      | Where to file a criminal complaint, and the labour prosecutor in social-law cases               | [#55](https://github.com/pieterjanscheir/belgica/issues/55) |
| **Chambers of bailiffs** (gerechtsdeurwaarders / huissiers de justice) and the area each covers       | Which chamber covers an arrondissement, and a link to its search for a bailiff                  | [#6](https://github.com/pieterjanscheir/belgica/issues/6)   |
| **Police zones** (politiezones / zones de police)                                                     | Which zone handles a municipality: complaints, copies of reports                                | [#7](https://github.com/pieterjanscheir/belgica/issues/7)   |
| **Cadastre and legal-certainty offices** (kadaster, former hypotheekkantoren)                         | Request mortgage certificates and cadastral extracts from the competent office                  | [#8](https://github.com/pieterjanscheir/belgica/issues/8)   |
| **Chambers of notaries** and the area each covers                                                     | The chamber competent for a property or a complaint, and a link to Fednot's search for a notary | [#56](https://github.com/pieterjanscheir/belgica/issues/56) |
| **Bars** (balies / barreaux) and their legal aid offices                                              | The legal aid office for an address, and the bâtonnier for deontological questions              | [#57](https://github.com/pieterjanscheir/belgica/issues/57) |

## Territory

| Dataset                                                                                            | Why it's useful                                                                             | Issue                                                       |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **History**: when cantons, municipalities and courts changed                                       | The model has validity periods and lookups by day; the earlier versions still need the data | [#27](https://github.com/pieterjanscheir/belgica/issues/27) |
| **Former municipalities** and the 2019 and 2025 mergers                                            | Map an old REFNIS code or name to today's municipality                                      | [#53](https://github.com/pieterjanscheir/belgica/issues/53) |
| **Sub-municipalities** (deelgemeenten / sections de commune) per postal code                       | The [postal codes](./postal-codes) stop at the municipality; addresses name the locality    | [#54](https://github.com/pieterjanscheir/belgica/issues/54) |
| **Address → canton** in the package itself                                                         | The docs and the explorer already geocode an address; the package doesn't yet               | [#66](https://github.com/pieterjanscheir/belgica/issues/66) |
| **Language areas and language facilities** per municipality (taalgebieden / faciliteitengemeenten) | The language of the proceedings and of documents served there                               | [#70](https://github.com/pieterjanscheir/belgica/issues/70) |

## Amounts, rates and calendars

| Dataset                                                                                               | Why it's useful                                                                        | Issue                                                         |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Court fees** (rolrechten / droits de mise au rôle, griffierechten / droits de greffe)               | Cost estimates and e-filing; the fee depends on the filing date                        | [#59](https://github.com/pieterjanscheir/belgica/issues/59)   |
| **Procedural indemnity** (rechtsplegingsvergoeding / indemnité de procédure)                          | The brackets and their indexation, for every cost estimate and judgment                | [#60](https://github.com/pieterjanscheir/belgica/issues/60)   |
| **Amount thresholds for competence and appeal** (art. 590, 617 Ger.W.)                                | Which court hears a claim, and whether its judgment can be appealed                    | [#69](https://github.com/pieterjanscheir/belgica/issues/69)   |
| **Health index** (gezondheidsindex / indice santé) per month                                          | Rent and maintenance indexation                                                        | [#62](https://github.com/pieterjanscheir/belgica/issues/62)   |
| **Damages and interest caps for consumer debts** (Book XIX WER / CDE)                                 | What can be charged to a consumer who pays late                                        | [#63](https://github.com/pieterjanscheir/belgica/issues/63)   |
| **Garnishment limits** (beslagbare bedragen / quotités saisissables, art. 1409 Ger.W.)                | How much of a wage or benefit can be seized, indexed every year                        | [#67](https://github.com/pieterjanscheir/belgica/issues/67)   |
| **Tax interest rates**: late-payment and moratorium interest                                          | Interest in tax disputes, next to the [legal and commercial rates](./interest-rates)   | [#68](https://github.com/pieterjanscheir/belgica/issues/68)   |
| **Bailiffs' tariff** in civil and commercial matters (KB 30 november 1976)                            | What service and enforcement cost, next to the court fees and the procedural indemnity | [#102](https://github.com/pieterjanscheir/belgica/issues/102) |
| **Income limits for legal aid** (juridische tweedelijnsbijstand / aide juridique, art. 508/13 Ger.W.) | Whether someone gets a pro bono lawyer, fully or partly; indexed every year            | [#100](https://github.com/pieterjanscheir/belgica/issues/100) |
| **Multiplier for criminal fines** (opdeciemen / décimes additionnels, Wet 5 maart 1952)               | The fine actually due: the statutory amount times the factor on the day of the offence | [#101](https://github.com/pieterjanscheir/belgica/issues/101) |

## Why some datasets aren't here yet

A legal dataset is only useful if every value comes from an official source, so nothing is
added by hand from memory. Each dataset is built by a script from snapshots of its source, and
most sources are fetched twice a week by GitHub Actions. Two can't be, for now: the site of the
Belgian Official Journal (ejustice), which the cantons come from, and police.be both refuse
connections from GitHub's servers; they're fetched from a regular machine instead
([#52](https://github.com/pieterjanscheir/belgica/issues/52)).

Registers of individual people (bailiffs, notaries, judicial experts, mediators) aren't planned:
they change all the time and every record is personal data, so the docs link to the official
search instead, and the data keeps the chambers and the areas they cover.
