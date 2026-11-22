<script setup>
import { data as stats } from '../../.vitepress/stats.data'
</script>

# Lagunas conocidas {#known-gaps}

- **Los tribunales que no están en el portal** no están en los datos: la Cour de cassation (Hof
  van Cassatie), la Cour constitutionnelle (Grondwettelijk Hof), el Conseil d'État (Raad van
  State) y los tribunales disciplinarios
  ([#4](https://github.com/pieterjanscheir/belgica/issues/4)).
- **Las reglas que envían un tipo de asunto a una sola división no están en los datos.** Cada
  división tiene su área, y su área en los asuntos penales cuando el decreto fija otra
  ([divisiones](/es/data/courts#divisions)). Un decreto también puede enviar un tipo de asunto a
  una sola división para todo el tribunal, como los procedimientos de liquidación colectiva de
  deudas del tribunal du travail de Hainaut: `findDivisionsWithJurisdiction` no las conoce.
- **{{ stats.courts.withoutAddress }} tribunales no tienen una dirección única**: un tribunal
  cuyas divisiones tienen cada una la suya (la dirección está en la división), o uno que publica
  sus direcciones como una frase. Su `address` falta en lugar de adivinarse; las divisiones tienen
  la suya.
- **Horarios**: {{ stats.courts.hoursParsed }} de los
  {{ stats.courts.hoursParsed + stats.courts.hoursTextOnly }} tribunales que publican horarios los
  tienen en sintaxis `opening_hours`. El resto publica texto con notas o arreglos temporales, que
  se conserva solo como `openingHoursText`.
- **Las etiquetas de contacto están en la lengua de la página**: para un tribunal bilingüe, las
  de la página en neerlandés (las de la página en alemán en Eupen). Los nombres y horarios de la
  página en francés también están.
- **Algunos valores de las páginas de origen no se pueden leer**, y se dejan fuera: un número de
  teléfono sin prefijo (`+32 682 05 28`), un fax "désactivé". El pull request semanal de datos
  los enumera, para que se puedan comunicar al tribunal.
- **La página en francés de la justice de paix (vredegerecht) de Tongeren-Borgloon** todavía la
  llama `Justice de paix de Tongres-Fourons`, su nombre antes de las fusiones municipales de 2025. Los datos conservan el nombre tal como se publica y lo vinculan al cantón correcto.
- **Aún no hay historia**: los datos del territorio describen la situación desde el 1 de enero de
  2025, y los de los tribunales el día en que se leyeron. Las búsquedas para un día anterior
  lanzan un error en lugar de responder con el mapa de hoy
  ([#27](https://github.com/pieterjanscheir/belgica/issues/27)).
- **Los nombres y las sedes de los cantones** están solo en neerlandés y francés: el anexo del
  Code judiciaire (Gerechtelijk Wetboek) no tiene texto alemán consolidado.
- **Los municipios divididos** (Antwerpen, Gent, Brussel, Luik, …) corresponden a varios
  cantones. Un código postal te lleva al municipio (`findCourtsForPostalCode`); elegir el cantón
  requiere la dirección postal: `findCantonsAt(lon, lat)` lo encuentra a partir de coordenadas
  con los [límites de los cantones](./canton-boundaries), pero geocodificar la dirección corre de
  tu cuenta, y los límites son la lectura que hace el NGI del texto legal de `territory`, que
  prevalece donde discrepan ([#66](https://github.com/pieterjanscheir/belgica/issues/66)).
- **Los códigos postales se detienen en el municipio.** Las secciones de municipio
  (deelgemeenten) no están en los datos: la tabla de Statbel no las tiene, y la lista de bpost no
  tiene licencia abierta. Tres códigos (`1040`, `1050`, `1804`) pertenecen a dos municipios; las
  búsquedas devuelven ambos ([#54](https://github.com/pieterjanscheir/belgica/issues/54)).
- **Una dirección de tribunal sin municipio**: la justice de paix de Etterbeek publica
  `1040 Brussel (Etterbeek)`, un código compartido con una línea de ciudad que nombra ambos
  municipios, así que `address.municipality` se deja fuera en lugar de adivinarse. La justice de
  paix de Limbourg publica una sede temporal en el palacio de justicia de Eupen, de modo que su
  municipio queda fuera de su distrito judicial, como dice su página.
- **Los códigos ECLI** solo se dan cuando aparecen en resoluciones publicadas; las justices de
  paix y la mayoría de los tribunaux de police no tienen ninguno allí.
- **Falta la maison de justice / Justizhaus de Eupen**
  ([#3](https://github.com/pieterjanscheir/belgica/issues/3)).

¿Has encontrado algo incorrecto o que falta?
[Comunica una corrección de datos](https://github.com/pieterjanscheir/belgica/issues/new?template=data-correction.yml)
o consulta [contribuir](/es/guide/contributing). Los conjuntos de datos previstos están en la
[hoja de ruta](./roadmap).
