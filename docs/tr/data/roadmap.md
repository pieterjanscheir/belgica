# Yol haritası {#roadmap}

Planlanan veri kümeleri, her birini tanımlayan issue ile birlikte. Her issue resmî kaynakları,
önerilen alanları ve "tamam"ın ne anlama geldiğini listeler. Yardım memnuniyetle karşılanır:
birini seçin ve [kurallara](/tr/guide/contributing#adding-a-dataset) uyun.

## Mahkemeler, bürolar ve kişiler {#courts-offices-and-people}

| Veri kümesi                                                                                                                                                    | Ne işe yarar                                                                                          | Issue                                                       |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Diğer mahkemeler**: Hof van Cassatie / Cour de cassation, Grondwettelijk Hof / Cour constitutionnelle, Raad van State / Conseil d'État, disiplin mahkemeleri | En yüksek mahkemeler mahkemelerin portalında yer almaz, bu yüzden kendi kaynaklarına ihtiyaç duyarlar | [#4](https://github.com/pieterjanscheir/belgica/issues/4)   |
| **Eupen'deki justitiehuis / maison de justice** (Almanca konuşan Topluluk)                                                                                     | Verilerde henüz bulunmayan tek justitiehuis                                                           | [#3](https://github.com/pieterjanscheir/belgica/issues/3)   |
| **Mahkeme şubesi başına yetki** (afdelingen / divisions)                                                                                                       | Bir mahkeme içinde nereye başvurulacağı ve şirket belgelerindeki RPR / RPM ibaresi                    | [#58](https://github.com/pieterjanscheir/belgica/issues/58) |
| **Savcılıklar** (parketten, arbeidsauditoraten, parketten-generaal, federal savcılık)                                                                          | Bir suç duyurusunun nereye yapılacağı ve sosyal hukuk davalarında iş savcısı                          | [#55](https://github.com/pieterjanscheir/belgica/issues/55) |
| **İcra memuru büroları** (gerechtsdeurwaarders / huissiers de justice)                                                                                         | Tebligat veya icra için bir arrondissement'ta (adli bölge) icra memuru bulmak                         | [#6](https://github.com/pieterjanscheir/belgica/issues/6)   |
| **Kadastro ve hukuki güvenlik büroları** (kadaster, eski hypotheekkantoren)                                                                                    | Yetkili bürodan ipotek belgeleri ve kadastro kayıt örnekleri istemek                                  | [#8](https://github.com/pieterjanscheir/belgica/issues/8)   |
| **Noterler ve noterlik odaları**                                                                                                                               | Bir noter bulmak ve bir şikâyet için yetkili odayı belirlemek                                         | [#56](https://github.com/pieterjanscheir/belgica/issues/56) |
| **Barolar** (balies / barreaux) ve adli yardım büroları                                                                                                        | Bir adres için adli yardım bürosu ve meslek kuralları soruları için bâtonnier                         | [#57](https://github.com/pieterjanscheir/belgica/issues/57) |

## Coğrafya {#territory}

| Veri kümesi                                                                                  | Ne işe yarar                                                                                                           | Issue                                                       |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Geçmiş**: kantonların, belediyelerin ve mahkemelerin ne zaman değiştiği                    | Modelde geçerlilik dönemleri ve güne göre sorgular var; önceki sürümler için hâlâ veri gerekiyor                       | [#27](https://github.com/pieterjanscheir/belgica/issues/27) |
| **Eski belediyeler** ile 2019 ve 2025 birleşmeleri                                           | Eski bir REFNIS kodunu veya adını bugünkü belediyeyle eşlemek                                                          | [#53](https://github.com/pieterjanscheir/belgica/issues/53) |
| Posta kodu başına **alt belediyeler** (deelgemeenten / sections de commune)                  | [Posta kodları](./postal-codes) belediye düzeyinde durur; adresler ise yerleşim yerini belirtir                        | [#54](https://github.com/pieterjanscheir/belgica/issues/54) |
| BeST Address ile **adres → kanton**                                                          | [Kanton sınırları](./canton-boundaries) bir noktanın kantonunu bulur; eksik adım, adresin coğrafi olarak kodlanmasıdır | [#66](https://github.com/pieterjanscheir/belgica/issues/66) |
| Belediye başına **dil bölgeleri ve dil kolaylıkları** (taalgebieden / faciliteitengemeenten) | Yargılamanın ve orada tebliğ edilen belgelerin dili                                                                    | [#70](https://github.com/pieterjanscheir/belgica/issues/70) |

## Tutarlar, oranlar ve takvimler {#amounts-rates-and-calendars}

| Veri kümesi                                                                                   | Ne işe yarar                                                                        | Issue                                                       |
| --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Mahkeme harçları** (rolrechten / droits de mise au rôle, griffierechten / droits de greffe) | Maliyet tahminleri ve elektronik başvuru; harç başvuru tarihine bağlıdır            | [#59](https://github.com/pieterjanscheir/belgica/issues/59) |
| **Yetki ve istinaf için tutar eşikleri** (art. 590, 617 Ger.W.)                               | Bir talebe hangi mahkemenin bakacağı ve kararına itiraz edilip edilemeyeceği        | [#69](https://github.com/pieterjanscheir/belgica/issues/69) |
| **Adli tatiller ve resmî tatiller**                                                           | Usul sürelerini hesaplamak                                                          | [#61](https://github.com/pieterjanscheir/belgica/issues/61) |
| Ay başına **sağlık endeksi** (gezondheidsindex / indice santé)                                | Kira ve nafaka endekslemesi                                                         | [#62](https://github.com/pieterjanscheir/belgica/issues/62) |
| **Tüketici borçlarında tazminat ve faiz tavanları** (Book XIX WER / CDE)                      | Geç ödeyen bir tüketiciden ne talep edilebileceği                                   | [#63](https://github.com/pieterjanscheir/belgica/issues/63) |
| **Haciz sınırları** (beslagbare bedragen / quotités saisissables, art. 1409 Ger.W.)           | Bir ücretin veya ödeneğin ne kadarının haczedilebileceği; her yıl endekslenir       | [#67](https://github.com/pieterjanscheir/belgica/issues/67) |
| **Vergi faiz oranları**: gecikme faizi ve moratoryum faizi                                    | Vergi uyuşmazlıklarında faiz, [yasal ve ticari oranların](./interest-rates) yanında | [#68](https://github.com/pieterjanscheir/belgica/issues/68) |

## Bazı veri kümeleri neden henüz yok {#why-some-datasets-aren-t-here-yet}

Hukuki bir veri kümesi ancak her değeri resmî bir kaynaktan geliyorsa işe yarar; bu yüzden
hiçbir şey ezberden elle eklenmez. Her veri kümesi, kaynağının anlık görüntülerinden bir script
ile oluşturulur ve kaynakların çoğu her hafta GitHub Actions tarafından çekilir. İkisi şimdilik
çekilemiyor: kantonların geldiği Belgisch Staatsblad / Moniteur belge (resmî gazete) sitesi
(ejustice) ve police.be, GitHub sunucularından gelen bağlantıları reddediyor; bunlar onun yerine
sıradan bir makineden çekiliyor
([#52](https://github.com/pieterjanscheir/belgica/issues/52)). İcra memurları rehberi tarayıcıda
oluşturulduğundan okumak için bir tarayıcı ya da Ulusal Oda'nın verileri gerekiyor
([#6](https://github.com/pieterjanscheir/belgica/issues/6)).
