<script setup>
import { data as stats } from '../../.vitepress/stats.data'
</script>

# Lacunas conhecidas {#known-gaps}

- **Os tribunais que não estão no portal** não estão nos dados: o Hof van Cassatie / Cour de
  cassation, o Grondwettelijk Hof / Cour constitutionnelle, o Raad van State / Conseil d'État e os
  tribunais disciplinares ([#4](https://github.com/pieterjanscheir/belgica/issues/4)).
- **As regras que enviam um tipo de processo para uma só divisão não estão nos dados.** Cada
  divisão tem a sua área, e a sua área nos processos penais quando o decreto fixa outra
  ([divisões](/pt/data/courts#divisions)). Um decreto pode também enviar um tipo de processo para
  uma só divisão em todo o tribunal, como os processos de regularização coletiva de dívidas do
  tribunal du travail de Hainaut: `findDivisionsWithJurisdiction` não as conhece.
- **{{ stats.courts.withoutAddress }} tribunais não têm uma morada única**: um tribunal cujas
  divisões têm cada uma a sua (a morada está na divisão), ou um que publica as suas moradas como
  frase. O seu `address` falta em vez de ser adivinhado; as divisões têm a delas.
- **Horários**: {{ stats.courts.hoursParsed }} dos
  {{ stats.courts.hoursParsed + stats.courts.hoursTextOnly }} tribunais que publicam horário
  têm-no na sintaxe `opening_hours`. Os restantes publicam texto com notas ou regimes temporários,
  guardado apenas como `openingHoursText`.
- **As etiquetas dos contactos estão na língua da página**: para um tribunal bilingue, as da
  página neerlandesa (as da página alemã em Eupen). Os nomes e horários da página francesa também
  lá estão.
- **Alguns valores nas páginas de origem não podem ser lidos**, e ficam de fora: um número de
  telefone sem indicativo de zona (`+32 682 05 28`), um fax que está "désactivé". O pull request
  semanal de dados lista-os, para que possam ser comunicados ao tribunal.
- **A página francesa do justice de paix de Tongeren-Borgloon** ainda lhe chama
  `Justice de paix de Tongres-Fourons`, o seu nome antes das fusões de municípios de 2025. Os
  dados mantêm o nome tal como publicado e ligam-no ao cantão certo.
- **Ainda sem histórico**: os dados do território descrevem a situação de 1 de janeiro de 2025 em
  diante, e os dados dos tribunais o dia em que foram lidos. As pesquisas para um dia anterior
  lançam um erro em vez de responder com o mapa de hoje
  ([#27](https://github.com/pieterjanscheir/belgica/issues/27)).
- **Os nomes e as sedes dos cantões** estão só em neerlandês e francês: o anexo ao Gerechtelijk
  Wetboek / Code judiciaire não tem texto consolidado em alemão.
- **Os municípios divididos** (Antwerpen, Gent, Brussel, Luik, …) correspondem a vários cantões.
  Um código postal leva-o até ao município (`findCourtsForPostalCode`); escolher o cantão exige a
  morada completa: `findCantonsAt(lon, lat)` encontra-o a partir de coordenadas com os
  [limites dos cantões](./canton-boundaries), mas a geocodificação da morada fica a seu cargo, e
  os limites são a leitura do NGI do texto legal em `territory`, que prevalece quando discordam
  ([#66](https://github.com/pieterjanscheir/belgica/issues/66)).
- **Os códigos postais param no município.** As subdivisões dos municípios (deelgemeenten /
  sections de commune, os antigos municípios anteriores às fusões) não estão nos dados: a tabela do Statbel não as tem, e a
  lista da bpost não tem licença aberta. Três códigos (`1040`, `1050`, `1804`) pertencem a dois
  municípios; as pesquisas devolvem ambos
  ([#54](https://github.com/pieterjanscheir/belgica/issues/54)).
- **Uma morada de tribunal sem município**: o justice de paix de Etterbeek publica
  `1040 Brussel (Etterbeek)`, um código partilhado com uma linha de localidade que menciona os
  dois municípios, por isso `address.municipality` fica de fora em vez de ser adivinhado. O
  justice de paix de Limbourg publica uma sede temporária no tribunal de Eupen, por isso o seu
  município fica fora do seu arrondissement, como a sua página indica.
- **Os códigos ECLI** só são dados onde aparecem em decisões publicadas; os justices de paix e a
  maioria dos tribunaux de police / politierechtbanken não têm nenhum.
- **A maison de justice de Eupen** falta
  ([#3](https://github.com/pieterjanscheir/belgica/issues/3)).

Encontrou algo errado ou em falta?
[Comunique uma correção de dados](https://github.com/pieterjanscheir/belgica/issues/new?template=data-correction.yml)
ou veja [contribuir](/pt/guide/contributing). Os conjuntos de dados previstos estão no
[roadmap](./roadmap).
