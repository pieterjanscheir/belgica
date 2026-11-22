<script setup>
import { data as stats } from '../../.vitepress/stats.data'

const labels = {
    'justice-of-the-peace': 'Vredegerecht / Justice de paix',
    'police-court': 'Politierechtbank / Tribunal de police',
    'court-of-first-instance': 'Rechtbank van eerste aanleg / Tribunal de première instance',
    'enterprise-court': "Ondernemingsrechtbank / Tribunal de l'entreprise",
    'labour-court': 'Arbeidsrechtbank / Tribunal du travail',
    'court-of-appeal': "Hof van beroep / Cour d'appel",
    'labour-court-of-appeal': 'Arbeidshof / Cour du travail',
    'court-of-assize': "Hof van assisen / Cour d'assises",
}

const areas = {
    'justice-of-the-peace': 'canton。Philippeville は 2 か所に所在',
    'police-court': 'arrondissement（ブリュッセルは言語別に分割、Halle、Vilvoorde）',
    'court-of-first-instance': 'arrondissement（ブリュッセルは言語別に分割）',
    'enterprise-court': 'arrondissement、または hof van beroep / cour d\'appel の管轄区域',
    'labour-court': 'arrondissement、または hof van beroep / cour d\'appel の管轄区域',
    'court-of-appeal': '管轄区域',
    'labour-court-of-appeal': '管轄区域',
    'court-of-assize': '州、またはブリュッセル首都圏',
}
</script>

# 裁判所 {#courts}

ファイル：`data/courts.json`。裁判所自身のポータル
[tribunaux-rechtbanken.be](https://www.tribunaux-rechtbanken.be) に掲載されている司法部のすべての
裁判所です。今日適用されるレコードが {{ stats.courts.total }} 件<span v-if="stats.courts.retired">、
ポータルに掲載されなくなり廃止扱いになった版が {{ stats.courts.retired }} 件</span>あります。
このページの数値は、サイトのビルド時にデータから計算しています。

<table>
<thead><tr><th>種類</th><th style="text-align:right">裁判所</th><th style="text-align:right">部または所在地</th><th>管轄</th></tr></thead>
<tbody>
<tr v-for="t in stats.courts.byType" :key="t.type">
<td>{{ labels[t.type] }}</td><td style="text-align:right">{{ t.courts }}</td><td style="text-align:right">{{ t.divisions }}</td><td>{{ areas[t.type] }}</td>
</tr>
</tbody>
</table>

ポータルに掲載されていないため、まだここにはないもの：Hof van Cassatie / Cour de cassation、
Grondwettelijk Hof / Cour constitutionnelle、Raad van State / Conseil d'État、および懲戒裁判所
（tuchtrechtbanken / tribunaux disciplinaires）。

## 役立つ場面 {#why-it-s-useful}

- **書類の宛先。** 召喚状、申立書、準備書面には、裁判所が自ら名乗る名称を記載します。書簡や
  提出書類は、書記課（griffie / greffe）の住所に送ります。
- **正しい書記課への連絡。** 大規模な裁判所には事件の種類ごと（民事、刑事、家事、法人登記簿など）
  に書記課があり、それぞれに電話番号、メールアドレス、ときには銀行口座があります。データでは
  それらを区別し、裁判所がつけているとおりのラベルを付けています。
- **手数料の支払い。** 裁判所手数料や予納金のための銀行口座を公表している書記課については、
  その口座をチェックサム検証済みでデータに収録しています。
- **フォームの作成。** 裁判所を選ぶ UI には、安定した id を持ち、canton、arrondissement、
  管轄区域、そして部が属する裁判所にリンクした完全な一覧が必要です。
- **判例へのリンク。** `ecli` は、その裁判所の判決が European Case Law Identifier に含むコード
  （`ECLI:BE:HBGNT:…`）を示します。

## 出典と更新 {#source-and-updates}

|            |                                                                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 出典       | College van de hoven en rechtbanken / Collège des cours et tribunaux のポータル [tribunaux-rechtbanken.be](https://www.tribunaux-rechtbanken.be) |
| 作り方     | 各裁判所のページと連絡先ページの週次スナップショットから `scripts/parse` で生成                                                                  |
| 変わるとき | 裁判所が移転したとき、連絡先や開庁時間を変更したとき、ポータルが裁判所を追加したり名前を変えたりしたとき                                         |
| 照合       | 毎週、[sources ワークフロー](/ja/guide/data-quality#how-the-data-is-built)が実行。変更は pull request として届きます                             |

すべてのレコードには、読み取ったページと、各ページの内容を最初に確認した日（`sources`）が記載
されています。連絡先の詳細はこのパッケージの中で最も頻繁に変わるものです。重要な場合は裁判所の
ページ（`website`）を確認してください。

<CourtList />

## フィールド {#fields}

| フィールド         | 型                                    | 説明                                                                                                                                                                                                                                                                                                                  |
| ------------------ | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`               | `CourtId`                             | 安定した id：`type` の後に裁判所自身の言語での地名：`justice-of-the-peace-gent-1`、`police-court-brussel-fr`、`enterprise-court-gent-brugge`。[識別子](/ja/guide/identifiers)を参照                                                                                                                                   |
| `validFrom`        | string?                               | レコードが適用される最初の日、`YYYY-MM-DD`：ポータルに最初に掲載された日。なければ対象期間の開始時から                                                                                                                                                                                                                |
| `validTo`          | string?                               | レコードが適用される最後の日：週次チェックでポータルから消えたことがわかった日の前日。なければまだ適用中                                                                                                                                                                                                              |
| `type`             | `CourtType`                           | `justice-of-the-peace`、`police-court`、`court-of-first-instance`、`enterprise-court`、`labour-court`、`court-of-appeal`、`labour-court-of-appeal`、`court-of-assize`                                                                                                                                                 |
| `kind`             | `'court'` \| `'division'` \| `'seat'` | 裁判所そのもの、その部（afdeling / division / Abteilung）、または vredegerecht / justice de paix の所在地の一つ                                                                                                                                                                                                       |
| `court`            | `CourtId`?                            | 部または所在地の場合：それが属する裁判所                                                                                                                                                                                                                                                                              |
| `name`             | `{ nl?, fr?, de? }`                   | 裁判所が公表している名称。ページのある各言語で：`Vredegerecht Gent 1`、`Tribunal de l'entreprise du Hainaut - division Mons`                                                                                                                                                                                          |
| `judicialArea`     | `JudicialAreaId`                      | 管轄区域                                                                                                                                                                                                                                                                                                              |
| `arrondissement`   | `ArrondissementId`?                   | 管轄が一つの arrondissement であるか、その中に収まる裁判所または部の場合：その arrondissement                                                                                                                                                                                                                         |
| `canton`           | `CantonId`?                           | vredegerecht / justice de paix の場合：担当する canton                                                                                                                                                                                                                                                                |
| `cantons`          | `CantonId[]`?                         | その他すべての裁判所の場合：Gerechtelijk Wetboek / Code judiciaire の附属書（第 3〜5 条）と同法典第 114 条が定める、管轄する canton。部の場合：同法典第 186 条に基づく勅令が定める管轄区域（[部](#divisions)を参照）に全体が含まれる canton。勅令が刑事事件について別の管轄区域を定めている場合は、民事事件の管轄区域 |
| `municipalities`   | `MunicipalityId[]`?                   | 管轄区域が canton の一部だけを含む部の場合：その自治体（REFNIS コード）                                                                                                                                                                                                                                               |
| `criminalArea`     | `{ cantons?, municipalities? }`?      | 勅令が刑事事件について民事事件とは別の管轄区域を定めている部の場合：刑事事件における管轄区域。`cantons` および `municipalities` と同じように読みます。部の管轄区域が両方に共通の一つである場合はなし                                                                                                                  |
| `ecli`             | `string[]`?                           | 裁判所の ECLI コード。判決を下す言語ごとに一つ。公表された判決で確認できたコードのみ                                                                                                                                                                                                                                  |
| `address`          | `Address`?                            | 書記課の所在地と、その郵便番号が属する自治体（`municipality`、REFNIS コード）。裁判所が単一の住所を公表していない場合（部ごとに住所がある裁判所）はなし                                                                                                                                                               |
| `contacts`         | `Contact[]`                           | 電話、ファクス、メール、銀行口座。それぞれが属する書記課（`label`）と、一緒に公表されているテキスト（`note`）つき                                                                                                                                                                                                     |
| `openingHours`     | string?                               | OpenStreetMap の [`opening_hours`](https://wiki.openstreetmap.org/wiki/Key:opening_hours) 構文による書記課の開庁時間：`Mo-Fr 08:30-12:30,13:30-16:00`。公表されたテキストが正確にそれを表す場合のみ                                                                                                                   |
| `openingHoursText` | `{ nl?, fr?, de? }`?                  | 公表されたとおりの開庁時間。言語ごと                                                                                                                                                                                                                                                                                  |
| `website`          | `{ nl?, fr?, de? }`                   | ポータル上の裁判所のページ。言語ごと                                                                                                                                                                                                                                                                                  |
| `sources`          | `{ url, retrieved }[]`                | レコードを読み取ったページと、その内容を最初に確認した日                                                                                                                                                                                                                                                              |

::: tip 新しい種類の裁判所
`type` には値が追加される可能性があります（たとえば Hof van Cassatie / Cour de cassation）。
`switch` で分岐する場合は、新しい種類でコードが壊れないよう `default` 節を残してください。
:::

## 構造 {#shape}

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
    street: string // 公表どおり。番地、box、階を含む：'Beverstraat 7B (eerste verdieping)'
    postalCode: string
    city: string
    municipality?: MunicipalityId // 郵便番号を通じて。郵便番号のページを参照
}

interface Contact {
    type: 'phone' | 'fax' | 'email' | 'bank-account'
    value: string // 正規形：E.164、小文字のメールアドレス、電子形式の IBAN
    label?: string // 書記課または部署：'Burgerlijke griffie'、'Greffe pénal'
    note?: string // 値と一緒に公表されているテキスト：'druk 1'、'tapez 2'
}
```

## 部 {#divisions}

rechtbank van eerste aanleg / tribunal de première instance、ondernemingsrechtbank / tribunal de
l'entreprise、arbeidsrechtbank / tribunal du travail、arbeidshof / cour du travail、politierechtbank /
tribunal de police は、部（afdelingen / divisions）に分かれていることがあります。部は、書類を提出する
先であり、審理が行われる場所です。ondernemingsrechtbank / tribunal de l'entreprise の部は、会社の
書類に記載する法人登記簿の表記（「RPR Gent, afdeling Brugge」）に入る部でもあります。各部の
管轄区域は、Gerechtelijk Wetboek / Code judiciaire 第 186 条に基づく勅令が定めます。2014 年 3 月
14 日の勅令、または、その後多くの裁判所については、その裁判所独自の事件配分規則
（zaakverdelingsreglement）の勅令です。2017〜2019 年の canton 改革と 2025 年の自治体合併により、
どちらも変更されました。

各部の管轄区域は `cantons` にあります。その区域に全体が含まれる canton です。勅令が canton を
分割している場合、部はその canton から受け持つ自治体を `municipalities` に列挙します。Hainaut の
arbeidsrechtbank / tribunal du travail では、Pont-à-Celles（canton Seneffe）は Charleroi に、
Erquelinnes と Merbes-le-Château（canton Chimay）は Binche に割り当てられています。Liège の
rechtbank van eerste aanleg / tribunal de première instance（2024 年以降）と、Limburg および Liège の
politierechtbank / tribunal de police は、部の管轄区域を canton ではなく自治体の一覧で定めて
います。自治体は、`municipalities` にその自治体を挙げている部に属し、そのような部がなければ、
その自治体の canton を持つ部に属します。この検索を行うのが `findDivisionsWithJurisdiction` です。

### 民事事件と刑事事件 {#civil-and-criminal-cases}

勅令は、民事事件と刑事事件とで別々の管轄区域を定めることができます。Antwerpen の rechtbank van
eerste aanleg / tribunal de première instance と politierechtbank / tribunal de police がそうで、
2020 年 12 月 16 日のそれぞれの勅令によります。民事事件では canton Heist-op-den-Berg の全体が
Mechelen の部に属し、刑事事件（およびその中で審理される民事上の請求）では、その canton の自治体
Hulshout と Herenthout が Turnhout に属します。

この場合、`cantons` と `municipalities` は民事事件の管轄区域であり、刑事事件の管轄区域は、同じ
二つのフィールドを持つ `criminalArea` に入ります。

```ts
getCourt('police-court-antwerpen-turnhout').criminalArea
// { cantons: ['mol-geel-1', 'mol-geel-2', 'turnhout-1', 'turnhout-2', 'westerlo'],
//   municipalities: ['13012', '13016'] }   Herenthout と Hulshout
```

`criminalArea` を持つのは、二つの管轄区域が異なる部だけです。現在は四つ、両裁判所の Mechelen と
Turnhout です。それ以外の部では、一つの管轄区域が両方に適用されます。
`findDivisionsWithJurisdiction` は、事件の種類を `matter` として受け取ります。

```ts
const ids = (options?: DivisionOptions) =>
    findDivisionsWithJurisdiction('13016', 'police-court', options).map((d) => d.id)
ids({ matter: 'civil' }) // ['police-court-antwerpen-mechelen']
ids({ matter: 'criminal' }) // ['police-court-antwerpen-turnhout']
ids() // 両方。民事の部が先：事件の種類で決まる
```

### 出典 {#sources}

管轄区域は現行の条文です。各部が `sources` に挙げている Belgisch Staatsblad / Moniteur belge
（官報）の公布文、すなわち管轄区域を定めた勅令と、それを後に改正したすべての勅令から、手作業で
統合しました。politierechtbank / tribunal de police の管轄区域は、Justel の統合された条文から
読み取りました。裁判所の各部が、民事事件でも刑事事件でも、その裁判所の管轄区域を過不足なく
一度ずつ覆っていることを、テストで確認しています。

勅令は、ある種類の事件を裁判所全体について一つの部に割り当てることもあります。Hainaut の
arbeidsrechtbank / tribunal du travail の集団的債務整理や、Liège の politierechtbank / tribunal de
police における arbeidsrechtbank / tribunal du travail の所管に属する違反行為がその例です。
こうした規則はデータに入っていません。

## ヘルパー {#helpers}

```ts
getCourt('justice-of-the-peace-gent-1')
getJusticeOfThePeace('gent-1') // 同じ裁判所を canton の id で
getDivisions('enterprise-court-gent') // その 8 つの部
getCourtsForCanton('gent-1') // その vredegerecht と、他の各種類の裁判所を一つずつ
findCourtsWithJurisdiction('23088', 'police-court') // [police-court-vilvoorde]、REFNIS コードで
findDivisionsWithJurisdiction('31005', 'enterprise-court') // [enterprise-court-gent-brugge]
findDivisionsWithJurisdiction('44021', 'police-court') // [police-court-oost-vlaanderen-gent]
findCourts({ type: 'police-court', kind: 'court', judicialArea: 'gent' })
getContact(court, 'email', 'Greffe pénal') // 最初に一致した連絡先の値
formatPhoneNumber('+3253820701') // '053 82 07 01'
formatIban('BE73679200844560') // 'BE73 6792 0084 4560'
```

## データの読み取り方 {#how-the-data-is-read}

ポータルには裁判所ごと・部ごとに、その裁判所の言語でページがあります。ブリュッセルの二言語の
裁判所にはオランダ語とフランス語のページが、Eupen の裁判所にはフランス語とドイツ語のページが
あります。パーサーは次のように処理します。

1. 名称（`Politierechtbank Limburg - afdeling Genk`）から裁判所の種類と地名を、名称と番号から
   vredegerecht / justice de paix の canton を読み取ります。
2. 一つの裁判所の各言語版を一つのレコードにまとめます。名称、ページ、開庁時間は言語ごとに、
   住所と連絡先は最初の言語（ブリュッセルではオランダ語、Eupen ではドイツ語）から取り、もう一方の
   ページにしかない値があればそれも加えます。
3. 書記課の連絡先ブロックを読み取り、各値をその書記課と結びつけて保持します。
4. 公表された開庁時間は、すべての語が理解でき、かつすべての言語が同じ内容を述べている場合に
   限って `opening_hours` 構文に変換します。注記や一時的な取り決め（「OPGELET: tot 31 december…」）
   を含むテキストは、公表されたテキストだけを保持します。
5. `scripts/parse/jurisdictions.ts` にある Gerechtelijk Wetboek / Code judiciaire の附属書の表から、
   法律が各裁判所に割り当てる canton（`cantons`）を付与し、そこから `arrondissement` を導きます。
   この表とポータルは互いを検証します。ポータルにあって法律の表にない裁判所、またはその逆が
   あれば、ビルドを止めます。

位置づけられないページ（未知の種類の裁判所、canton のない vredegerecht / justice de paix）がある
場合、裁判所のない canton がある場合、どの裁判所が存在するかについて法律の表とポータルが食い違う
場合は、何も書き出しません。読み取れなかったもの（市外局番のない電話番号、文章で書かれた住所）は
週次の pull request で報告し、推測せずにデータから除外します。

## 正規形の値 {#canonical-values}

| 値       | 保存形式                                         | 理由                                                                                                                                                    |
| -------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 電話番号 | E.164：`+3253820701`                             | 番号ごとに形式が一つで、どこからでもダイヤルでき、`tel:` リンクがそのまま使える                                                                         |
| IBAN     | 電子形式：`BE73679200844560`                     | 決済システムが受け付ける形式。チェックサムは読み取り時とテストで検証                                                                                    |
| メール   | 小文字                                           | 比較や重複排除がうまくいく                                                                                                                              |
| 開庁時間 | `opening_hours`：`Mo-Fr 08:30-12:30,13:30-16:00` | OpenStreetMap の標準で、多くの言語にパーサーがあり（例：[opening_hours.js](https://github.com/opening-hours/opening_hours.js)）、特定の言語に依存しない |
| 通り     | 公表どおり                                       | 番地、box、階の書き方があまりに多様なため（`Canadaplein ZN`、`Rue de Bruxelles 2 - 3`）、推測なしには分割できない                                       |
