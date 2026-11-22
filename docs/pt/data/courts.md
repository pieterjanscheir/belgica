<script setup>
import { data as stats } from '../../.vitepress/stats.data'

const labels = {
    'justice-of-the-peace': 'Justice de paix / vredegerecht',
    'police-court': 'Tribunal de police / politierechtbank',
    'court-of-first-instance': 'Tribunal de première instance / rechtbank van eerste aanleg',
    'enterprise-court': "Tribunal de l'entreprise / ondernemingsrechtbank",
    'labour-court': 'Tribunal du travail / arbeidsrechtbank',
    'court-of-appeal': "Cour d'appel / hof van beroep",
    'labour-court-of-appeal': 'Cour du travail / arbeidshof',
    'court-of-assize': "Cour d'assises / hof van assisen",
}

const areas = {
    'justice-of-the-peace': 'Um cantão; Philippeville tem sede em dois locais',
    'police-court': 'Um arrondissement (Bruxelas dividida por língua, Halle, Vilvoorde)',
    'court-of-first-instance': 'Um arrondissement (Bruxelas dividida por língua)',
    'enterprise-court': "Um arrondissement, ou a área de uma cour d'appel",
    'labour-court': "Um arrondissement, ou a área de uma cour d'appel",
    'court-of-appeal': 'Uma área judicial',
    'labour-court-of-appeal': 'Uma área judicial',
    'court-of-assize': 'Uma província, ou Bruxelas-Capital',
}
</script>

# Tribunais {#courts}

Ficheiro: `data/courts.json`. Cada tribunal do poder judicial que o próprio portal dos tribunais,
[tribunaux-rechtbanken.be](https://www.tribunaux-rechtbanken.be), lista:
{{ stats.courts.total }} registos que se aplicam hoje<span v-if="stats.courts.retired">, e
{{ stats.courts.retired }} versões retiradas que o portal já não lista</span>. Os números desta
página são calculados a partir dos dados quando o site é gerado.

<table>
<thead><tr><th>Tipo</th><th style="text-align:right">Tribunais</th><th style="text-align:right">Divisões ou sedes</th><th>Área</th></tr></thead>
<tbody>
<tr v-for="t in stats.courts.byType" :key="t.type">
<td>{{ labels[t.type] }}</td><td style="text-align:right">{{ t.courts }}</td><td style="text-align:right">{{ t.divisions }}</td><td>{{ areas[t.type] }}</td>
</tr>
</tbody>
</table>

Não estão no portal, e por isso ainda não estão aqui: o Hof van Cassatie / Cour de cassation, o
Grondwettelijk Hof / Cour constitutionnelle e o Raad van State / Conseil d'État, e os tribunais
disciplinares.

## Porque é útil {#why-it-s-useful}

- **Endereçar documentos.** Citações, requerimentos e conclusões designam o tribunal tal como
  ele próprio se designa; as cartas e as peças vão para a secretaria (griffie, greffe) na sua
  morada.
- **Contactar a secretaria certa.** Os tribunais maiores têm uma secretaria por matéria (cível,
  penal, família, o registo das pessoas coletivas…), cada uma com o seu próprio telefone, e-mail
  e por vezes conta bancária. Os dados mantêm-nas separadas, com a etiqueta que o tribunal lhes
  dá.
- **Pagar custas.** As secretarias que publicam uma conta bancária para custas judiciais e
  depósitos têm-na nos dados, com o dígito de controlo verificado.
- **Construir formulários.** Os seletores de tribunais precisam de uma lista completa com ids
  estáveis, ligados a cantões, arrondissements e áreas judiciais, e ao tribunal a que uma divisão
  pertence.
- **Ligar à jurisprudência.** `ecli` dá o código que as decisões do tribunal têm no seu European
  Case Law Identifier (`ECLI:BE:HBGNT:…`).

## Fonte e atualizações {#source-and-updates}

|                |                                                                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fonte          | [tribunaux-rechtbanken.be](https://www.tribunaux-rechtbanken.be), o portal do College van de hoven en rechtbanken / Collège des cours et tribunaux |
| Construído por | `scripts/parse` a partir de snapshots semanais da página e da página de contactos de cada tribunal                                                 |
| Muda quando    | Um tribunal muda de instalações, de contactos ou de horário, ou o portal acrescenta ou renomeia um tribunal                                        |
| Verificado     | Todas as semanas, pelo [workflow sources](/pt/guide/data-quality#how-the-data-is-built); as alterações chegam como pull request                    |

Cada registo indica as páginas de onde foi lido e o dia em que o conteúdo de cada página foi visto
pela primeira vez (`sources`). Os dados de contacto mudam com mais frequência do que qualquer
outra coisa neste pacote: quando for importante, consulte a página do tribunal (`website`).

<CourtList />

## Campos {#fields}

| Campo              | Tipo                                  | Descrição                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`               | `CourtId`                             | Id estável: o `type`, depois o local na língua do próprio tribunal: `justice-of-the-peace-gent-1`, `police-court-brussel-fr`, `enterprise-court-gent-brugge`. Veja [identificadores](/pt/guide/identifiers)                                                                                                                                                                                                                           |
| `validFrom`        | string?                               | Primeiro dia em que o registo se aplica, `YYYY-MM-DD`: o dia em que o portal o listou pela primeira vez. Nenhum: desde o início da cobertura                                                                                                                                                                                                                                                                                          |
| `validTo`          | string?                               | Último dia em que o registo se aplica: o dia anterior à verificação semanal que deu pela sua ausência no portal. Nenhum: ainda se aplica                                                                                                                                                                                                                                                                                              |
| `type`             | `CourtType`                           | `justice-of-the-peace`, `police-court`, `court-of-first-instance`, `enterprise-court`, `labour-court`, `court-of-appeal`, `labour-court-of-appeal`, `court-of-assize`                                                                                                                                                                                                                                                                 |
| `kind`             | `'court'` \| `'division'` \| `'seat'` | O próprio tribunal, uma das suas divisões (afdeling, division, Abteilung), ou um dos locais onde um justice de paix tem sede                                                                                                                                                                                                                                                                                                          |
| `court`            | `CourtId`?                            | Para uma divisão ou sede: o tribunal a que pertence                                                                                                                                                                                                                                                                                                                                                                                   |
| `name`             | `{ nl?, fr?, de? }`                   | O nome tal como o tribunal o publica, em cada língua em que tem uma página: `Vredegerecht Gent 1`, `Tribunal de l'entreprise du Hainaut - division Mons`                                                                                                                                                                                                                                                                              |
| `judicialArea`     | `JudicialAreaId`                      | A área judicial                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `arrondissement`   | `ArrondissementId`?                   | O arrondissement, para um tribunal ou divisão cuja área é um arrondissement ou fica dentro de um                                                                                                                                                                                                                                                                                                                                      |
| `canton`           | `CantonId`?                           | Para um justice de paix: o cantão que serve                                                                                                                                                                                                                                                                                                                                                                                           |
| `cantons`          | `CantonId[]`?                         | Para todos os outros tribunais: os cantões que abrange, tal como os fixam o anexo ao Gerechtelijk Wetboek / Code judiciaire (art. 3–5) e o art. 114 do mesmo código. Para uma divisão: os cantões que ficam inteiramente na sua área, tal como a fixam os decretos reais adotados ao abrigo do art. 186 do código (veja [divisões](#divisions)); a área para os processos cíveis quando o decreto fixa outra para os processos penais |
| `municipalities`   | `MunicipalityId[]`?                   | Para uma divisão cuja área abrange só parte de um cantão: esses municípios, por código REFNIS                                                                                                                                                                                                                                                                                                                                         |
| `criminalArea`     | `{ cantons?, municipalities? }`?      | Para uma divisão cujo decreto fixa para os processos penais uma área diferente da dos cíveis: a sua área nos processos penais, lida como `cantons` e `municipalities`. Ausente quando a divisão tem uma só área para ambos                                                                                                                                                                                                            |
| `ecli`             | `string[]`?                           | Os códigos ECLI do tribunal, um por língua em que julga; só códigos vistos em decisões publicadas                                                                                                                                                                                                                                                                                                                                     |
| `address`          | `Address`?                            | Onde fica a secretaria, com o município a que pertence o seu código postal (`municipality`, por código REFNIS). Ausente quando o tribunal não publica uma morada única (um tribunal cujas divisões têm cada uma a sua)                                                                                                                                                                                                                |
| `contacts`         | `Contact[]`                           | Telefone, fax, e-mail e conta bancária, cada um com a secretaria a que pertence (`label`) e o texto publicado com ele (`note`)                                                                                                                                                                                                                                                                                                        |
| `openingHours`     | string?                               | Horário da secretaria na sintaxe [`opening_hours`](https://wiki.openstreetmap.org/wiki/Key:opening_hours) do OpenStreetMap: `Mo-Fr 08:30-12:30,13:30-16:00`, só quando o texto publicado diz exatamente isso                                                                                                                                                                                                                          |
| `openingHoursText` | `{ nl?, fr?, de? }`?                  | O horário tal como publicado, por língua                                                                                                                                                                                                                                                                                                                                                                                              |
| `website`          | `{ nl?, fr?, de? }`                   | A página do tribunal no portal, por língua                                                                                                                                                                                                                                                                                                                                                                                            |
| `sources`          | `{ url, retrieved }[]`                | As páginas de onde o registo foi lido, e quando o seu conteúdo foi visto pela primeira vez                                                                                                                                                                                                                                                                                                                                            |

::: tip Novos tipos de tribunal
`type` pode ganhar valores (o Hof van Cassatie / Cour de cassation, por exemplo). Se fizer um
`switch` sobre ele, mantenha um ramo `default` para que um novo tipo não parta o seu código.
:::

## Forma {#shape}

```ts
interface Court {
    id: CourtId
    validFrom?: string
    validTo?: string
    type: CourtType
    kind: 'court' | 'division' | 'seat'
    court?: CourtId
    name: Partial<Translated>
    judicialArea: JudicialAreaId
    arrondissement?: ArrondissementId
    canton?: CantonId
    cantons?: CantonId[]
    municipalities?: MunicipalityId[]
    criminalArea?: { cantons?: CantonId[]; municipalities?: MunicipalityId[] }
    ecli?: string[]
    address?: Address
    contacts: Contact[]
    openingHours?: string
    openingHoursText?: Partial<Translated>
    website: Partial<Record<Locale, string>>
    sources: SourceRef[]
}

interface Address {
    building?: string
    street: string // tal como publicado, com número, caixa ou andar: 'Beverstraat 7B (eerste verdieping)'
    postalCode: string
    city: string
    municipality?: MunicipalityId // através do código postal; veja a página Códigos postais
}

interface Contact {
    type: 'phone' | 'fax' | 'email' | 'bank-account'
    value: string // canónico: E.164, e-mail em minúsculas, IBAN eletrónico
    label?: string // a secretaria ou serviço: 'Burgerlijke griffie', 'Greffe pénal'
    note?: string // texto publicado com o valor: 'druk 1', 'tapez 2'
}
```

## Divisões {#divisions}

Um tribunal de première instance / rechtbank van eerste aanleg, um tribunal de l'entreprise /
ondernemingsrechtbank, um tribunal du travail / arbeidsrechtbank, uma cour du travail /
arbeidshof ou um tribunal de police / politierechtbank pode estar dividido em divisões
(afdelingen, divisions): onde se dá entrada do processo, e onde decorre a audiência. A divisão de
um tribunal de l'entreprise é também a que consta da menção do registo das pessoas coletivas nos
documentos das empresas ("RPR Gent, afdeling Brugge"). Um decreto real adotado ao abrigo do art.
186 do Gerechtelijk Wetboek / Code judiciaire fixa a área de cada divisão: o decreto de 14 de
março de 2014 ou, desde então para muitos tribunais, o decreto de repartição dos processos do
próprio tribunal (zaakverdelingsreglement). As reformas dos cantões de 2017–2019 e as fusões de
municípios de 2025 alteraram ambos.

Cada divisão tem a sua área em `cantons`: os cantões que ficam inteiramente nela. Quando um
decreto divide um cantão, a divisão lista em `municipalities` os municípios que dele recebe. O
tribunal du travail de Hainaut envia Pont-à-Celles (cantão de Seneffe) para Charleroi, e
Erquelinnes e Merbes-le-Château (cantão de Chimay) para Binche. O tribunal de première instance
de Liège (desde 2024) e os tribunaux de police de Limburg e de Liège dão às suas divisões listas
de municípios em vez de cantões. Um município pertence à divisão que o indica em
`municipalities` ou, se nenhuma o indicar, à que tem o seu cantão.
`findDivisionsWithJurisdiction` faz essa pesquisa.

### Processos cíveis e penais {#civil-and-criminal-cases}

Um decreto pode fixar uma área para os processos cíveis e outra para os penais. É o que fazem o
tribunal de première instance e o tribunal de police de Antwerpen, nos seus decretos de 16 de
dezembro de 2020: nos processos cíveis todo o cantão de Heist-op-den-Berg vai para a divisão de
Mechelen, e nos processos penais (com os pedidos cíveis neles julgados) os seus municípios de
Hulshout e Herenthout vão para Turnhout.

`cantons` e `municipalities` são então a área nos processos cíveis, e a divisão tem a sua área
nos processos penais em `criminalArea`, com os mesmos dois campos:

```ts
getCourt('police-court-antwerpen-turnhout').criminalArea
// { cantons: ['mol-geel-1', 'mol-geel-2', 'turnhout-1', 'turnhout-2', 'westerlo'],
//   municipalities: ['13012', '13016'] }   Herenthout e Hulshout
```

Só uma divisão cujas duas áreas diferem tem `criminalArea`: hoje são quatro, Mechelen e Turnhout
nos dois tribunais. Para todas as outras divisões, a única área vale para os dois tipos de
processo. `findDivisionsWithJurisdiction` recebe o tipo de processo em `matter`:

```ts
const ids = (options?: DivisionOptions) =>
    findDivisionsWithJurisdiction('13016', 'police-court', options).map((d) => d.id)
ids({ matter: 'civil' }) // ['police-court-antwerpen-mechelen']
ids({ matter: 'criminal' }) // ['police-court-antwerpen-turnhout']
ids() // ambas, a cível primeiro: o tipo de processo decide
```

### Fontes {#sources}

As áreas são o texto em vigor, consolidado à mão a partir das publicações no Belgisch
Staatsblad / Moniteur belge que cada divisão cita em `sources`: o decreto que fixa a área e todos
os posteriores que a alteraram. As áreas dos tribunaux de police / politierechtbanken foram lidas
dos textos consolidados do Justel. Um teste verifica que as divisões de um tribunal cobrem a sua
área uma só vez, nos processos cíveis e nos penais.

Um decreto pode também enviar um tipo de processo para uma só divisão em todo o tribunal: os
processos de regularização coletiva de dívidas do tribunal du travail de Hainaut, ou as infrações
que cabem aos tribunaux du travail no tribunal de police de Liège. Essas regras não estão nos
dados.

## Funções auxiliares {#helpers}

```ts
getCourt('justice-of-the-peace-gent-1')
getJusticeOfThePeace('gent-1') // o mesmo tribunal, pelo id do cantão
getDivisions('enterprise-court-gent') // as suas oito divisões
getCourtsForCanton('gent-1') // o seu justice de paix, e um tribunal de cada um dos outros tipos
findCourtsWithJurisdiction('23088', 'police-court') // [police-court-vilvoorde], por código REFNIS
findDivisionsWithJurisdiction('31005', 'enterprise-court') // [enterprise-court-gent-brugge]
findDivisionsWithJurisdiction('44021', 'police-court') // [police-court-oost-vlaanderen-gent]
findCourts({ type: 'police-court', kind: 'court', judicialArea: 'gent' })
getContact(court, 'email', 'Greffe pénal') // o valor do primeiro contacto correspondente
formatPhoneNumber('+3253820701') // '053 82 07 01'
formatIban('BE73679200844560') // 'BE73 6792 0084 4560'
```

## Como os dados são lidos {#how-the-data-is-read}

O portal tem uma página por tribunal e por divisão, na língua do tribunal; os tribunais bilingues
de Bruxelas têm uma página em neerlandês e outra em francês, e os tribunais de Eupen uma em
francês e outra em alemão. O parser:

1. lê o tipo e o local do tribunal a partir do seu nome (`Politierechtbank Limburg - afdeling
Genk`), e o cantão de um justice de paix a partir do seu nome e número;
2. junta as versões linguísticas de um mesmo tribunal num único registo: nomes, páginas e
   horários por língua; morada e contactos da primeira língua (neerlandês em Bruxelas, alemão em
   Eupen), com qualquer valor que só a outra página tenha;
3. lê os blocos de contacto das secretarias, mantendo cada valor com a sua secretaria;
4. converte o horário publicado para a sintaxe `opening_hours` apenas quando todas as palavras são
   compreendidas e todas as línguas dizem o mesmo. Um texto com uma nota ou um regime temporário
   ("OPGELET: tot 31 december…") fica só com o texto publicado;
5. dá a cada tribunal os cantões que a lei lhe atribui (`cantons`), a partir de uma tabela do
   anexo ao Gerechtelijk Wetboek / Code judiciaire em `scripts/parse/jurisdictions.ts`, e deriva
   deles o seu `arrondissement`. A tabela e o portal verificam-se mutuamente: um tribunal no
   portal que falte na tabela da lei, ou o inverso, interrompe a build.

Recusa-se a escrever o que quer que seja quando uma página não pode ser situada (um tipo de
tribunal desconhecido, um justice de paix sem cantão), quando um cantão não tem tribunal, ou
quando a tabela da lei e o portal discordam sobre que tribunais existem. O que não consegue ler
(um número de telefone sem indicativo de zona, uma morada escrita como frase) é indicado no pull
request semanal, e fica fora dos dados em vez de ser adivinhado.

## Valores canónicos {#canonical-values}

| Valor              | Armazenado como                                  | Porquê                                                                                                                                                            |
| ------------------ | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Número de telefone | E.164: `+3253820701`                             | Uma forma por número, marcável de qualquer lado, os links `tel:` funcionam tal como estão                                                                         |
| IBAN               | Formato eletrónico: `BE73679200844560`           | A forma que os sistemas de pagamento aceitam; o dígito de controlo é verificado na leitura e nos testes                                                           |
| E-mail             | Minúsculas                                       | As comparações e a deduplicação funcionam                                                                                                                         |
| Horário            | `opening_hours`: `Mo-Fr 08:30-12:30,13:30-16:00` | O standard do OpenStreetMap, com parsers em muitas linguagens (p. ex. [opening_hours.js](https://github.com/opening-hours/opening_hours.js)) e sem língua própria |
| Rua                | Tal como publicada                               | Números, caixas e andares escrevem-se de demasiadas maneiras (`Canadaplein ZN`, `Rue de Bruxelles 2 - 3`) para os separar sem adivinhar                           |
