<script setup>
import { data as stats } from '../../.vitepress/stats.data'
</script>

# Bilinen eksikler {#known-gaps}

- **Portalda bulunmayan mahkemeler** verilerde yok: Hof van Cassatie / Cour de cassation,
  Grondwettelijk Hof / Cour constitutionnelle, Raad van State / Conseil d'État ve disiplin
  mahkemeleri ([#4](https://github.com/pieterjanscheir/belgica/issues/4)).
- **Belirli bir dava türünü tek bir bölüme gönderen kurallar verilerde yok.** Her bölümün
  (afdeling / division) yetki alanı ve, kararname başka bir yetki alanı belirliyorsa, ceza
  davalarındaki yetki alanı verilerdedir ([bölümler](/tr/data/courts#divisions)). Bir kararname,
  Hainaut tribunal du travail'indeki toplu borç yapılandırması (règlement collectif de dettes)
  davaları gibi, belirli bir dava türünü mahkemenin tamamı için tek bir bölüme de gönderebilir:
  `findDivisionsWithJurisdiction` bunları bilmez.
- **{{ stats.courts.withoutAddress }} mahkemenin tek bir adresi yok**: bölümlerinin her birinin
  kendi adresi olan bir mahkeme (adres bölümdedir) ya da adreslerini bir cümle olarak yayımlayan
  bir mahkeme. Bunların `address` alanı tahmin edilmek yerine boş bırakılır; bölümlerin kendi
  adresleri vardır.
- **Çalışma saatleri**: saat yayımlayan
  {{ stats.courts.hoursParsed + stats.courts.hoursTextOnly }} mahkemeden
  {{ stats.courts.hoursParsed }} tanesinde saatler `opening_hours` söz dizimindedir. Geri
  kalanlar notlar veya geçici düzenlemeler içeren metin yayımlar; bunlar yalnızca
  `openingHoursText` olarak saklanır.
- **İletişim etiketleri sayfanın dilindedir**: iki dilli bir mahkeme için Felemenkçe sayfanınki
  (Eupen'de Almanca sayfanınki). Fransızca sayfadaki adlar ve saatler de mevcuttur.
- **Kaynak sayfalardaki bazı değerler okunamaz** ve dışarıda bırakılır: alan kodu olmayan bir
  telefon numarası (`+32 682 05 28`), "désactivé" olan bir faks. Haftalık veri pull request'i
  bunları listeler, böylece mahkemeye bildirilebilirler.
- **Tongeren-Borgloon vredegerecht / justice de paix'sinin** (sulh mahkemesi benzeri, kanton
  düzeyindeki mahkeme) Fransızca sayfası onu hâlâ 2025 belediye birleşmelerinden önceki adıyla,
  `Justice de paix de Tongres-Fourons` olarak anar. Veriler adı yayımlandığı haliyle saklar ve
  doğru kantona bağlar.
- **Henüz geçmiş yok**: coğrafya verileri 1 Ocak 2025 ve sonrasını, mahkeme verileri ise
  okundukları günü tanımlar. Daha önceki bir gün için yapılan sorgular bugünün haritasıyla
  yanıt vermek yerine hata fırlatır
  ([#27](https://github.com/pieterjanscheir/belgica/issues/27)).
- **Kanton adları ve duruşma yerleri** yalnızca Felemenkçe ve Fransızcadır: Gerechtelijk Wetboek /
  Code judiciaire ekinin konsolide bir Almanca metni yoktur.
- **Bölünmüş belediyeler** (Antwerpen, Gent, Brussel, Luik, …) birden fazla kantona karşılık
  gelir. Bir posta kodu sizi belediyeye kadar götürür (`findCourtsForPostalCode`); kantonu seçmek
  için sokak adresi gerekir: `findCantonsAt(lon, lat)` onu
  [kanton sınırları](./canton-boundaries) yardımıyla koordinatlardan bulur, ancak adresi
  coğrafi olarak kodlamak size kalmıştır ve sınırlar NGI'nin `territory` içindeki yasal metni
  yorumlamasıdır; ikisi uyuşmadığında yasal metin geçerlidir
  ([#66](https://github.com/pieterjanscheir/belgica/issues/66)).
- **Posta kodları belediye düzeyinde durur.** Alt belediyeler (deelgemeenten) verilerde yok:
  Statbel'in tablosunda yer almazlar ve bpost'un listesi açık lisanslı değildir. Üç kod (`1040`,
  `1050`, `1804`) iki belediyeye aittir; sorgular ikisini de döndürür
  ([#54](https://github.com/pieterjanscheir/belgica/issues/54)).
- **Belediyesi olmayan bir mahkeme adresi**: Etterbeek vredegerecht'i
  `1040 Brussel (Etterbeek)` yayımlar; bu, her iki belediyeyi de anan bir şehir satırıyla
  birlikte ortak bir koddur, bu yüzden `address.municipality` tahmin edilmek yerine boş
  bırakılır. Limbourg vredegerecht'i Eupen adliye binasında geçici bir duruşma yeri yayımlar,
  bu nedenle belediyesi, sayfasında da belirtildiği gibi, kendi arrondissement'ının (adli bölge)
  dışında kalır.
- **ECLI kodları** yalnızca yayımlanmış kararlarda göründükleri yerde verilir; vredegerechten
  ve politierechtbanken / tribunaux de police'in çoğunun orada hiç kodu yoktur.
- **Eupen'deki justitiehuis / maison de justice** eksik
  ([#3](https://github.com/pieterjanscheir/belgica/issues/3)).

Yanlış veya eksik bir şey mi buldunuz?
[Veri düzeltmesi bildirin](https://github.com/pieterjanscheir/belgica/issues/new?template=data-correction.yml)
ya da [katkıda bulunma](/tr/guide/contributing) sayfasına bakın. Planlanan veri kümeleri
[yol haritasında](./roadmap).
