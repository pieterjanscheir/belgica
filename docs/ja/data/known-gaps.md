<script setup>
import { data as stats } from '../../.vitepress/stats.data'
</script>

# 既知の欠落 {#known-gaps}

- **ポータルに掲載されていない裁判所**はデータにありません：Hof van Cassatie / Cour de cassation、
  Grondwettelijk Hof / Cour constitutionnelle、Raad van State / Conseil d'État、懲戒裁判所
  （[#4](https://github.com/pieterjanscheir/belgica/issues/4)）。
- **ある種類の事件を一つの部に割り当てる規則は、データに入っていません。** どの部にも管轄区域が
  あり、勅令が刑事事件について別の管轄区域を定めている場合は、刑事事件の管轄区域もあります
  （[部](/ja/data/courts#divisions)）。勅令は、Hainaut の arbeidsrechtbank / tribunal du travail の
  集団的債務整理のように、ある種類の事件を裁判所全体について一つの部に割り当てることもあります。
  `findDivisionsWithJurisdiction` はこうした規則を扱いません。
- **{{ stats.courts.withoutAddress }} の裁判所には単一の住所がありません**：部ごとに住所がある
  裁判所（住所は部の側にあります）、または住所を文章で公表している裁判所です。これらの `address`
  は推測せずに欠落させており、部にはそれぞれの住所があります。
- **開庁時間**：開庁時間を公表している
  {{ stats.courts.hoursParsed + stats.courts.hoursTextOnly }} の裁判所のうち
  {{ stats.courts.hoursParsed }} については `opening_hours` 構文で収録しています。残りは注記や
  一時的な取り決めを含むテキストで公表しているため、`openingHoursText` としてのみ保持しています。
- **連絡先のラベルはページの言語です**：二言語の裁判所ではオランダ語のページのもの（Eupen では
  ドイツ語のページのもの）です。フランス語のページの名称と開庁時間も収録しています。
- **情報源のページにある一部の値は読み取れず**、除外しています：市外局番のない電話番号
  （`+32 682 05 28`）、「désactivé」となっているファクスなど。週次のデータの pull request に一覧が
  載るので、裁判所に報告できます。
- **Tongeren-Borgloon の vredegerecht / justice de paix のフランス語のページ**は、2025 年の自治体
  合併前の名称 `Justice de paix de Tongres-Fourons` をまだ使っています。データは名称を公表どおりに
  保持し、正しい canton にリンクしています。
- **まだ履歴はありません**：領域のデータは 2025 年 1 月 1 日以降を、裁判所のデータは読み取った日の
  状況を記述しています。それより前の日付で検索すると、今日の地図で答える代わりに例外を投げます
  （[#27](https://github.com/pieterjanscheir/belgica/issues/27)）。
- **canton の名称と所在地**はオランダ語とフランス語のみです。Gerechtelijk Wetboek / Code judiciaire
  の附属書には統合されたドイツ語の条文がありません。
- **分割された自治体**（Antwerpen、Gent、Brussel、Luik など）は複数の canton に対応します。郵便
  番号から自治体まではたどれますが（`findCourtsForPostalCode`）、canton を選ぶには通りの住所が必要
  です。`findCantonsAt(lon, lat)` は [canton の境界](./canton-boundaries)を使って座標から canton を
  見つけますが、住所のジオコーディングは利用者側で行う必要があります。また境界は `territory` に
  ある法令の条文を NGI が解釈したものであり、食い違う場合は条文が優先します（[#66](https://github.com/pieterjanscheir/belgica/issues/66)）。
- **郵便番号は自治体の単位までです。** 自治体内の旧自治体（deelgemeenten）はデータにありません。
  Statbel の表にはなく、bpost の一覧はオープンなライセンスではないためです。3 つのコード（`1040`、
  `1050`、`1804`）は 2 つの自治体に属しており、検索では両方を返します（[#54](https://github.com/pieterjanscheir/belgica/issues/54)）。
- **自治体のない裁判所の住所が一つあります**：Etterbeek の vredegerecht / justice de paix は
  `1040 Brussel (Etterbeek)` と公表しています。これは共有のコードで、都市名の行も両方の自治体を
  挙げているため、`address.municipality` は推測せずに除外しています。Limbourg の vredegerecht /
  justice de paix は Eupen の裁判所庁舎にある仮の所在地を公表しているため、ページに書かれている
  とおり、その自治体は自身の arrondissement の外にあります。
- **ECLI コード**は公表された判決に現れる場合にのみ記載しています。vredegerecht / justice de paix と
  ほとんどの politierechtbank / tribunal de police には、そこに現れるコードがありません。
- **Eupen の justitiehuis / maison de justice** がありません
  （[#3](https://github.com/pieterjanscheir/belgica/issues/3)）。

誤りや欠落を見つけましたか？
[データの修正を報告する](https://github.com/pieterjanscheir/belgica/issues/new?template=data-correction.yml)か、
[コントリビュート](/ja/guide/contributing)を参照してください。予定しているデータセットは
[ロードマップ](./roadmap)にあります。
