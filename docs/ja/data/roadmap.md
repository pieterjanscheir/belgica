# ロードマップ {#roadmap}

予定しているデータセットと、それぞれの仕様を記した issue です。各 issue には、公式の情報源、
提案するフィールド、「完了」の定義が記載されています。協力を歓迎します。一つ選んで
[規約](/ja/guide/contributing#adding-a-dataset)に従ってください。

## 裁判所、事務所、人 {#courts-offices-and-people}

| データセット                                                                                                                                       | 役立つ理由                                                                 | Issue                                                       |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **その他の裁判所**：Hof van Cassatie / Cour de cassation、Grondwettelijk Hof / Cour constitutionnelle、Raad van State / Conseil d'État、懲戒裁判所 | 最上級の裁判所は裁判所のポータルに掲載されていないため、独自の情報源が必要 | [#4](https://github.com/pieterjanscheir/belgica/issues/4)   |
| **Eupen の justitiehuis / maison de justice**（ドイツ語共同体）                                                                                    | データにまだない唯一の justitiehuis / maison de justice                    | [#3](https://github.com/pieterjanscheir/belgica/issues/3)   |
| **裁判所の支部ごとの管轄**（afdelingen / divisions）                                                                                               | 裁判所内のどこに提出するか、そして会社の書類に記載する RPR / RPM の表記    | [#58](https://github.com/pieterjanscheir/belgica/issues/58) |
| **検察庁**（parketten、arbeidsauditoraten、parketten-generaal、連邦検察庁）                                                                        | 刑事告訴をどこに提出するか、そして社会法の事件における労働検察官           | [#55](https://github.com/pieterjanscheir/belgica/issues/55) |
| **執行官の事務所**（gerechtsdeurwaarders / huissiers de justice）                                                                                  | 送達や強制執行のために、arrondissement 内の執行官を探す                    | [#6](https://github.com/pieterjanscheir/belgica/issues/6)   |
| **警察管区**（politiezones / zones de police）                                                                                                     | ある自治体をどの管区が担当するか：被害届、調書の写し                       | [#7](https://github.com/pieterjanscheir/belgica/issues/7)   |
| **土地台帳と法的安定性の事務所**（kadaster、旧 hypotheekkantoren）                                                                                 | 管轄の事務所に抵当権証明書や土地台帳の抄本を請求する                       | [#8](https://github.com/pieterjanscheir/belgica/issues/8)   |
| **公証人と公証人会**                                                                                                                               | 公証人を探す、そして苦情を扱う管轄の公証人会                               | [#56](https://github.com/pieterjanscheir/belgica/issues/56) |
| **弁護士会**（balies / barreaux）とその法律扶助事務所                                                                                              | 住所に対応する法律扶助事務所、そして職業倫理の問題を扱う bâtonnier         | [#57](https://github.com/pieterjanscheir/belgica/issues/57) |

## 領域 {#territory}

| データセット                                                                       | 役立つ理由                                                                                         | Issue                                                       |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **履歴**：canton、自治体、裁判所がいつ変わったか                                   | モデルには有効期間と日付による検索がすでにあり、以前の版のデータがまだ必要                         | [#27](https://github.com/pieterjanscheir/belgica/issues/27) |
| **旧自治体**と 2019 年・2025 年の合併                                              | 古い REFNIS コードや名称を現在の自治体に対応づける                                                 | [#53](https://github.com/pieterjanscheir/belgica/issues/53) |
| 郵便番号ごとの**自治体内の旧自治体**（deelgemeenten / sections de commune）        | [郵便番号](./postal-codes)は自治体の単位まで。住所には地区名が書かれる                             | [#54](https://github.com/pieterjanscheir/belgica/issues/54) |
| BeST Address による**住所 → canton**                                               | [canton の境界](./canton-boundaries)で地点の canton はわかる。欠けているのは住所のジオコーディング | [#66](https://github.com/pieterjanscheir/belgica/issues/66) |
| 自治体ごとの**言語地域と言語上の便宜措置**（taalgebieden / faciliteitengemeenten） | 手続きの言語と、そこで送達される書類の言語                                                         | [#70](https://github.com/pieterjanscheir/belgica/issues/70) |

## 金額、利率、暦 {#amounts-rates-and-calendars}

| データセット                                                                               | 役立つ理由                                                           | Issue                                                       |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| **裁判所手数料**（rolrechten / droits de mise au rôle、griffierechten / droits de greffe） | 費用の見積もりと電子提出。手数料は提出日によって変わる               | [#59](https://github.com/pieterjanscheir/belgica/issues/59) |
| **訴訟費用の補償額**（rechtsplegingsvergoeding / indemnité de procédure）                  | あらゆる費用の見積もりと判決のための、区分とその物価スライド         | [#60](https://github.com/pieterjanscheir/belgica/issues/60) |
| **管轄と上訴の金額基準**（art. 590, 617 Ger.W.）                                           | どの裁判所が請求を審理するか、その判決に上訴できるか                 | [#69](https://github.com/pieterjanscheir/belgica/issues/69) |
| **裁判所休廷期間と祝日**                                                                   | 手続き上の期限の計算                                                 | [#61](https://github.com/pieterjanscheir/belgica/issues/61) |
| 月ごとの**健康指数**（gezondheidsindex / indice santé）                                    | 家賃と扶養料の物価スライド                                           | [#62](https://github.com/pieterjanscheir/belgica/issues/62) |
| **消費者の債務に対する損害賠償と利息の上限**（Book XIX WER / CDE）                         | 支払いが遅れた消費者に何を請求できるか                               | [#63](https://github.com/pieterjanscheir/belgica/issues/63) |
| **差押えの限度額**（beslagbare bedragen / quotités saisissables、art. 1409 Ger.W.）        | 賃金や給付のうちどれだけを差し押さえられるか。毎年物価スライドされる | [#67](https://github.com/pieterjanscheir/belgica/issues/67) |
| **税の利率**：延滞利息と還付加算利息                                                       | 税務紛争の利息。[法定利率と商取引の利率](./interest-rates)と並んで   | [#68](https://github.com/pieterjanscheir/belgica/issues/68) |

## 一部のデータセットがまだない理由 {#why-some-datasets-aren-t-here-yet}

法務データセットは、すべての値が公式の情報源から来ている場合にしか役に立たないので、記憶に
頼って手で追加するものは何もありません。各データセットは、情報源のスナップショットからスクリプト
で作られ、ほとんどの情報源は GitHub Actions が毎週取得しています。今のところ取得できないものが
二つあります。canton の出典である Belgisch Staatsblad / Moniteur belge（官報）のサイト（ejustice）
と police.be は、どちらも GitHub のサーバーからの接続を拒否するため、代わりに通常のマシンから
取得しています（[#52](https://github.com/pieterjanscheir/belgica/issues/52)）。執行官の名簿は
ブラウザ内で組み立てられるため、読み取るにはブラウザか、Nationale Kamer van Gerechtsdeurwaarders /
Chambre nationale des huissiers de justice のデータが必要です
（[#6](https://github.com/pieterjanscheir/belgica/issues/6)）。
