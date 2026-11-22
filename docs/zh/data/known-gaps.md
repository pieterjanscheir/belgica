<script setup>
import { data as stats } from '../../.vitepress/stats.data'
</script>

# 已知缺口 {#known-gaps}

- **不在门户网站上的法院**不包含在数据中：Hof van Cassatie / Cour de cassation（最高法院）、Grondwettelijk Hof / Cour
  constitutionnelle（宪法法院）、Raad van State / Conseil d'État（国务委员会）以及各纪律审判机构
  （[#4](https://github.com/pieterjanscheir/belgica/issues/4)）。
- **把某一类案件交给一个分部的规则不在数据中。** 每个分部都有自己的辖区；法令为刑事案件另定辖区的，还有它在刑事案件中的辖区
  （[分部](/zh/data/courts#divisions)）。法令还可以把某一类案件在整个法院范围内交给一个分部，例如 Hainaut
  劳动法院（arbeidsrechtbank / tribunal du travail）的集体债务清理案件：`findDivisionsWithJurisdiction` 不了解这些规则。
- **{{ stats.courts.withoutAddress }} 个法院没有统一地址**：要么法院的每个分部都有自己的地址（地址记录在分部上），要么法院以一句话的形式发布其地址。
  这些法院的 `address` 缺省，而不是猜测填写；各分部有自己的地址。
- **开放时间**：在发布开放时间的 {{ stats.courts.hoursParsed + stats.courts.hoursTextOnly }} 个法院中，有
  {{ stats.courts.hoursParsed }} 个采用 `opening_hours` 语法。其余法院发布的是带有备注或临时安排的文字，仅保存为 `openingHoursText`。
- **联系方式的标签使用网页的语言**：对于双语法院，使用荷兰语页面的标签（Eupen 则使用德语页面的标签）。法语页面上的名称和开放时间也同样包含在内。
- **来源网页上有些值无法解读**，因此被略去：缺少区号的电话号码（`+32 682 05 28`）、标注为 "désactivé" 的传真。
  每周的数据 pull request 会列出这些值，以便反馈给相关法院。
- **Tongeren-Borgloon 治安法院（vredegerecht / justice de paix）的法语页面**仍称其为 `Justice de paix de Tongres-Fourons`，
  这是 2025 年市镇合并之前的名称。数据按发布原样保留该名称，并将其关联到正确的 canton。
- **尚无历史数据**：地域数据描述的是 2025 年 1 月 1 日及之后的情况，法院数据描述的是读取当天的情况。查询更早的日期会抛出错误，
  而不是用今天的地图来回答（[#27](https://github.com/pieterjanscheir/belgica/issues/27)）。
- **Canton 名称和所在地**只有荷兰语和法语：Gerechtelijk Wetboek / Code judiciaire（司法法典）的附件没有经过合并整理的德语文本。
- **被分割的市镇**（Antwerpen、Gent、Brussel、Luik 等）对应多个 canton。邮政编码可以把你带到市镇（`findCourtsForPostalCode`）；
  要确定 canton 则需要街道地址：`findCantonsAt(lon, lat)` 可借助 [canton 边界](./canton-boundaries)根据坐标找到 canton，
  但地址的地理编码需要你自己完成；而且这些边界是 NGI 对 `territory` 中法律文本的解读，两者不一致时以法律文本为准（[#66](https://github.com/pieterjanscheir/belgica/issues/66)）。
- **邮政编码只确定到市镇这一级。** 数据中不包含 deelgemeente / section（合并前的原市镇）：Statbel 的表格中没有它们，而 bpost
  的列表不是以开放许可发布的。有三个邮编（`1040`、`1050`、`1804`）同时属于两个市镇；查询会同时返回这两个市镇（[#54](https://github.com/pieterjanscheir/belgica/issues/54)）。
- **有一个法院地址没有市镇**：Etterbeek 治安法院发布的是 `1040 Brussel (Etterbeek)`，这是一个共用邮编，城市一行同时提到了两个市镇，
  因此省略了 `address.municipality`，而不是猜测填写。Limbourg 治安法院发布的是位于 Eupen 法院大楼内的临时所在地，
  因此其市镇位于其 arrondissement 之外，与其网页上所写的一致。
- **ECLI 代码**只在已公布的裁判中出现时才提供；治安法院和大多数违警法院在其中没有 ECLI 代码。
- **Eupen 的 justitiehuis / maison de justice** 尚缺失（[#3](https://github.com/pieterjanscheir/belgica/issues/3)）。

发现错误或缺失？
[提交数据更正](https://github.com/pieterjanscheir/belgica/issues/new?template=data-correction.yml)，
或参阅[参与贡献](/zh/guide/contributing)。计划中的数据集列在[路线图](./roadmap)上。
