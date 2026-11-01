<script setup>
import { data as stats } from '../../.vitepress/stats.data'
</script>

# Lacunes connues {#known-gaps}

- **Les juridictions absentes du portail** ne sont pas dans les données : la Cour de cassation,
  la Cour constitutionnelle, le Conseil d'État et les juridictions disciplinaires
  ([#4](https://github.com/pieterjanscheir/belgica/issues/4)).
- **La compétence s'arrête à la juridiction.** `cantons` et `findCourtsWithJurisdiction` disent quelle
  juridiction couvre une commune, pas laquelle de ses divisions : le territoire d'une division est
  fixé par arrêté royal et n'est pas encore dans les données
  ([#58](https://github.com/pieterjanscheir/belgica/issues/58)).
- **{{ stats.courts.withoutAddress }} juridictions n'ont pas d'adresse unique** : une juridiction
  dont chaque division a la sienne (l'adresse est sur la division), ou qui publie ses adresses
  sous forme de phrase. Leur `address` est absente plutôt que devinée ; les divisions ont la leur.
- **Heures d'ouverture** : {{ stats.courts.hoursParsed }} des
  {{ stats.courts.hoursParsed + stats.courts.hoursTextOnly }} juridictions qui publient des heures
  les ont en syntaxe `opening_hours`. Les autres publient un texte avec des remarques ou des
  arrangements temporaires, conservé uniquement dans `openingHoursText`.
- **Les libellés des contacts sont dans la langue de la page** : pour une juridiction bilingue,
  ceux de la page néerlandaise (de la page allemande à Eupen). Les noms et les heures de la page
  française y sont aussi.
- **Certaines valeurs des pages sources sont illisibles** et sont omises : un numéro de téléphone
  sans son indicatif de zone (`+32 682 05 28`), un fax « désactivé ». La pull request
  des données les liste, pour qu'on puisse les signaler à la juridiction.
- **La page française de la justice de paix de Tongeren-Borgloon** l'appelle encore
  `Justice de paix de Tongres-Fourons`, son nom d'avant les fusions de communes de 2025. Les
  données gardent le nom tel que publié et le lient au bon canton.
- **Pas encore d'historique** : les données territoriales décrivent la situation à partir du
  1er janvier 2025, et les données des juridictions celle du jour où elles ont été lues. Une
  recherche pour un jour antérieur lève une erreur plutôt que de répondre avec la carte
  d'aujourd'hui ([#27](https://github.com/pieterjanscheir/belgica/issues/27)).
- **Les noms et sièges des cantons** sont en néerlandais et en français seulement : l'annexe au
  Code judiciaire n'a pas de texte allemand consolidé.
- **Les communes scindées** (Anvers, Gand, Bruxelles, Liège, …) correspondent à plusieurs
  cantons. Un code postal mène à la commune (`findCourtsForPostalCode`) ; choisir le canton
  exige l'adresse de rue : `findCantonsAt(lon, lat)` le trouve à partir de coordonnées grâce
  aux [limites des cantons](./canton-boundaries), mais géocoder l'adresse vous revient, et les
  limites sont la lecture de l'IGN du texte légal de `territory`, qui l'emporte là où ils
  divergent ([#66](https://github.com/pieterjanscheir/belgica/issues/66)).
- **Les codes postaux s'arrêtent à la commune.** Les sections de commune (deelgemeenten) ne
  sont pas dans les données : la table de Statbel n'en a pas, et la liste de bpost n'est pas
  sous licence ouverte. Trois codes (`1040`, `1050`, `1804`) appartiennent à deux communes ;
  les recherches renvoient les deux ([#54](https://github.com/pieterjanscheir/belgica/issues/54)).
- **Une adresse de juridiction sans commune** : la justice de paix d'Etterbeek publie
  `1040 Brussel (Etterbeek)`, un code partagé avec une ligne de localité qui nomme les deux
  communes ; `address.municipality` est donc omis plutôt que deviné. La justice de paix de
  Limbourg publie un siège temporaire au palais de justice d'Eupen, de sorte que sa commune se
  trouve hors de son arrondissement, comme le dit sa page.
- **Les codes ECLI** ne sont donnés que là où ils apparaissent dans les décisions publiées ; les
  justices de paix et la plupart des tribunaux de police n'en ont pas.
- **La maison de justice d'Eupen** manque
  ([#3](https://github.com/pieterjanscheir/belgica/issues/3)).

Vous avez trouvé une erreur ou un manque ?
[Signalez une correction de données](https://github.com/pieterjanscheir/belgica/issues/new?template=data-correction.yml)
ou consultez [Contribuer](/fr/guide/contributing). Les jeux de données prévus sont sur la
[feuille de route](./roadmap).
