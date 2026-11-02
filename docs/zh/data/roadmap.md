# 路线图 {#roadmap}

计划中的数据集，每一个都附有说明其规格的 issue。每个 issue 列出官方来源、拟议的字段，以及"完成"的标准。欢迎参与：挑一个，
并遵循[约定](/zh/guide/contributing#adding-a-dataset)。

## 法院、机构和人员 {#courts-offices-and-people}

| 数据集                                                                                                                                                                               | 用途                                                           | Issue                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- | ----------------------------------------------------------- |
| **其他法院**：Hof van Cassatie / Cour de cassation（最高法院）、Grondwettelijk Hof / Cour constitutionnelle（宪法法院）、Raad van State / Conseil d'État（国务委员会）、纪律审判机构 | 最高级别的法院不在法院门户网站上，因此需要各自的来源           | [#4](https://github.com/pieterjanscheir/belgica/issues/4)   |
| **Eupen 的 justitiehuis / maison de justice**（德语共同体）                                                                                                                          | 数据中唯一还缺少的 justitiehuis                                | [#3](https://github.com/pieterjanscheir/belgica/issues/3)   |
| **各法院分庭的管辖范围**（afdelingen / divisions）                                                                                                                                   | 在法院内向哪个分庭提交，以及公司文件上的 RPR / RPM 标注        | [#58](https://github.com/pieterjanscheir/belgica/issues/58) |
| **检察机关**（parketten、arbeidsauditoraten、parketten-generaal、联邦检察官）                                                                                                        | 向哪里提出刑事控告，以及社会法案件中的劳动检察官               | [#55](https://github.com/pieterjanscheir/belgica/issues/55) |
| **执达员事务所**（gerechtsdeurwaarders / huissiers de justice）                                                                                                                      | 在某个 arrondissement 内找一位执达员进行送达或强制执行         | [#6](https://github.com/pieterjanscheir/belgica/issues/6)   |
| **土地登记和法律保障机构**（kadaster，原 hypotheekkantoren）                                                                                                                         | 向主管机构申请抵押证明和土地登记摘录                           | [#8](https://github.com/pieterjanscheir/belgica/issues/8)   |
| **公证人和公证人公会**                                                                                                                                                               | 找一位公证人，以及受理投诉的公会                               | [#56](https://github.com/pieterjanscheir/belgica/issues/56) |
| **律师公会**（balies / barreaux）及其法律援助办公室                                                                                                                                  | 某个地址对应的法律援助办公室，以及处理职业道德问题的 bâtonnier | [#57](https://github.com/pieterjanscheir/belgica/issues/57) |

## 地域 {#territory}

| 数据集                                                                    | 用途                                                                                | Issue                                                       |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **历史数据**：canton、市镇和法院何时发生变化                              | 数据模型已有有效期和按日期查询；更早的版本还需要补充数据                            | [#27](https://github.com/pieterjanscheir/belgica/issues/27) |
| **原市镇**以及 2019 年和 2025 年的合并                                    | 把旧的 REFNIS 代码或名称映射到如今的市镇                                            | [#53](https://github.com/pieterjanscheir/belgica/issues/53) |
| 按邮政编码列出的**合并前的原市镇**（deelgemeenten / sections de commune） | [邮政编码](./postal-codes)只到市镇一级；地址写的是具体地点                          | [#54](https://github.com/pieterjanscheir/belgica/issues/54) |
| 用 BeST Address 实现**地址 → canton**                                     | [canton 边界](./canton-boundaries)可以找到某一点所属的 canton；缺的是地址的地理编码 | [#66](https://github.com/pieterjanscheir/belgica/issues/66) |
| 每个市镇的**语区和语言便利措施**（taalgebieden / faciliteitengemeenten）  | 诉讼程序的语言，以及在当地送达的文书的语言                                          | [#70](https://github.com/pieterjanscheir/belgica/issues/70) |

## 金额、利率和日历 {#amounts-rates-and-calendars}

| 数据集                                                                                 | 用途                                                           | Issue                                                       |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------- |
| **诉讼费用**（rolrechten / droits de mise au rôle、griffierechten / droits de greffe） | 费用估算和电子立案；费用取决于立案日期                         | [#59](https://github.com/pieterjanscheir/belgica/issues/59) |
| **诉讼费补偿**（rechtsplegingsvergoeding / indemnité de procédure）                    | 分档金额及其指数化调整，用于每一次费用估算和判决               | [#60](https://github.com/pieterjanscheir/belgica/issues/60) |
| **管辖和上诉的金额门槛**（art. 590, 617 Ger.W.）                                       | 哪个法院审理某项请求，以及其判决能否上诉                       | [#69](https://github.com/pieterjanscheir/belgica/issues/69) |
| **司法假期和公共假日**                                                                 | 计算诉讼期限                                                   | [#61](https://github.com/pieterjanscheir/belgica/issues/61) |
| 每月的**健康指数**（gezondheidsindex / indice santé）                                  | 租金和抚养费的指数化                                           | [#62](https://github.com/pieterjanscheir/belgica/issues/62) |
| **消费者债务的损害赔偿和利息上限**（Book XIX WER / CDE）                               | 对逾期付款的消费者可以收取多少                                 | [#63](https://github.com/pieterjanscheir/belgica/issues/63) |
| **扣押限额**（beslagbare bedragen / quotités saisissables，art. 1409 Ger.W.）          | 工资或福利中可被扣押的部分，每年指数化调整                     | [#67](https://github.com/pieterjanscheir/belgica/issues/67) |
| **税务利率**：滞纳利息和退税利息                                                       | 税务争议中的利息，与[法定利率和商业利率](./interest-rates)并列 | [#68](https://github.com/pieterjanscheir/belgica/issues/68) |

## 为什么有些数据集还没有 {#why-some-datasets-aren-t-here-yet}

法律数据集只有在每个值都来自官方来源时才有用，因此不会凭记忆手工添加任何内容。每个数据集都由脚本根据其来源的快照生成，
大多数来源每周由 GitHub Actions 抓取。目前有两个来源无法这样做：canton 数据所来自的 Belgisch Staatsblad / Moniteur belge（比利时政府公报）网站（ejustice）和 police.be
都拒绝来自 GitHub 服务器的连接；它们改为从一台普通机器上抓取（[#52](https://github.com/pieterjanscheir/belgica/issues/52)）。
执达员名录是在浏览器中渲染的，因此需要用浏览器读取，或者使用全国执达员公会的数据（[#6](https://github.com/pieterjanscheir/belgica/issues/6)）。
