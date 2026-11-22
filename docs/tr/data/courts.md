<script setup>
import { data as stats } from '../../.vitepress/stats.data'

const labels = {
    'justice-of-the-peace': 'Vredegerecht / justice de paix',
    'police-court': 'Politierechtbank / tribunal de police',
    'court-of-first-instance': 'Rechtbank van eerste aanleg / tribunal de première instance',
    'enterprise-court': "Ondernemingsrechtbank / tribunal de l'entreprise",
    'labour-court': 'Arbeidsrechtbank / tribunal du travail',
    'court-of-appeal': "Hof van beroep / cour d'appel",
    'labour-court-of-appeal': 'Arbeidshof / cour du travail',
    'court-of-assize': "Hof van assisen / cour d'assises",
}

const areas = {
    'justice-of-the-peace': 'Bir kanton; Philippeville iki yerde duruşma yapar',
    'police-court': 'Bir arrondissement (Brüksel dile göre bölünmüş, Halle, Vilvoorde)',
    'court-of-first-instance': 'Bir arrondissement (Brüksel dile göre bölünmüş)',
    'enterprise-court': 'Bir arrondissement veya bir hof van beroep / cour d\'appel yargı çevresi',
    'labour-court': 'Bir arrondissement veya bir hof van beroep / cour d\'appel yargı çevresi',
    'court-of-appeal': 'Bir yargı çevresi',
    'labour-court-of-appeal': 'Bir yargı çevresi',
    'court-of-assize': 'Bir eyalet veya Brüksel-Başkent',
}
</script>

# Mahkemeler {#courts}

Dosya: `data/courts.json`. Mahkemelerin kendi portalı
[tribunaux-rechtbanken.be](https://www.tribunaux-rechtbanken.be)'nin listelediği yargı
teşkilatındaki her mahkeme: bugün geçerli {{ stats.courts.total }} kayıt<span v-if="stats.courts.retired">
ve portalın artık listelemediği {{ stats.courts.retired }} emekliye ayrılmış sürüm</span>. Bu
sayfadaki sayılar, site derlenirken verilerden hesaplanır.

<table>
<thead><tr><th>Tür</th><th style="text-align:right">Mahkemeler</th><th style="text-align:right">Bölümler veya duruşma yerleri</th><th>Alan</th></tr></thead>
<tbody>
<tr v-for="t in stats.courts.byType" :key="t.type">
<td>{{ labels[t.type] }}</td><td style="text-align:right">{{ t.courts }}</td><td style="text-align:right">{{ t.divisions }}</td><td>{{ areas[t.type] }}</td>
</tr>
</tbody>
</table>

Portalda olmadıkları için henüz burada da olmayanlar: Hof van Cassatie / Cour de cassation,
Grondwettelijk Hof / Cour constitutionnelle ve Raad van State / Conseil d'État ile disiplin
mahkemeleri.

Bu sayfada mahkeme türleri resmî Belçika adlarıyla geçer: vredegerecht / justice de paix (sulh
mahkemesi benzeri, kanton düzeyindeki mahkeme), politierechtbank / tribunal de police, rechtbank
van eerste aanleg / tribunal de première instance, ondernemingsrechtbank / tribunal de
l'entreprise, arbeidsrechtbank / tribunal du travail, hof van beroep / cour d'appel, arbeidshof /
cour du travail ve hof van assisen / cour d'assises. Arrondissement, adli bölge demektir.

## Neden işe yarar {#why-it-s-useful}

- **Belgeleri doğru adreslemek.** Celpnameler (dagvaarding / citation), dilekçeler ve
  conclusies / conclusions (yazılı savunmalar) mahkemeyi kendi kullandığı adla anar; mektuplar ve
  sunulan evrak, adresindeki kaleme (griffie / greffe) gider.
- **Doğru kalemle iletişim kurmak.** Büyük mahkemelerin her konu için ayrı bir kalemi vardır
  (hukuk, ceza, aile, tüzel kişiler sicili…); her birinin kendi telefon numarası, e-postası ve
  bazen banka hesabı bulunur. Veriler bunları, mahkemenin kendi verdiği etiketlerle, birbirinden
  ayrı tutar.
- **Harç ödemek.** Mahkeme harçları ve depozitolar için banka hesabı yayımlayan kalemlerin
  hesabı, sağlama toplamı doğrulanmış olarak verilerde yer alır.
- **Form oluşturmak.** Mahkeme seçicilerin, kantonlara, arrondissement'lara ve yargı çevrelerine
  (rechtsgebied / ressort) ve bir bölümün ait olduğu mahkemeye bağlı, kararlı id'lere sahip eksiksiz
  bir listeye ihtiyacı vardır.
- **İçtihada bağlantı vermek.** `ecli`, mahkemenin kararlarının European Case Law Identifier'da
  (`ECLI:BE:HBGNT:…`) taşıdığı kodu verir.

## Kaynak ve güncellemeler {#source-and-updates}

|                  |                                                                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Kaynak           | [tribunaux-rechtbanken.be](https://www.tribunaux-rechtbanken.be), College van de hoven en rechtbanken / Collège des cours et tribunaux'nun portalı     |
| Oluşturan        | Her mahkemenin sayfasının ve iletişim sayfasının haftalık anlık görüntülerinden `scripts/parse`                                                        |
| Ne zaman değişir | Bir mahkeme taşındığında, iletişim bilgilerini veya çalışma saatlerini değiştirdiğinde ya da portal bir mahkeme eklediğinde veya adını değiştirdiğinde |
| Kontrol          | Her hafta, [sources workflow'u](/tr/guide/data-quality#how-the-data-is-built) tarafından; değişiklikler pull request olarak gelir                      |

Her kayıt, okunduğu sayfaları ve her sayfanın içeriğinin ilk görüldüğü günü listeler
(`sources`). İletişim bilgileri bu paketteki her şeyden daha sık değişir: önemli olduğunda
mahkemenin sayfasını (`website`) kontrol edin.

<CourtList />

## Alanlar {#fields}

| Alan               | Tür                                   | Açıklama                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------ | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`               | `CourtId`                             | Kararlı id: `type`, ardından mahkemenin kendi dilinde yer adı: `justice-of-the-peace-gent-1`, `police-court-brussel-fr`, `enterprise-court-gent-brugge`. Bkz. [tanımlayıcılar](/tr/guide/identifiers)                                                                                                                                                                                                                                         |
| `validFrom`        | string?                               | Kaydın geçerli olduğu ilk gün, `YYYY-MM-DD`: portalın onu ilk listelediği gün. Yoksa: kapsamın başladığı günden beri                                                                                                                                                                                                                                                                                                                          |
| `validTo`          | string?                               | Kaydın geçerli olduğu son gün: haftalık kontrolün onu portalda bulamadığı günden bir önceki gün. Yoksa: hâlâ geçerli                                                                                                                                                                                                                                                                                                                          |
| `type`             | `CourtType`                           | `justice-of-the-peace`, `police-court`, `court-of-first-instance`, `enterprise-court`, `labour-court`, `court-of-appeal`, `labour-court-of-appeal`, `court-of-assize`                                                                                                                                                                                                                                                                         |
| `kind`             | `'court'` \| `'division'` \| `'seat'` | Mahkemenin kendisi, bölümlerinden biri (afdeling, division, Abteilung) ya da bir vredegerecht'in duruşma yaptığı yerlerden biri                                                                                                                                                                                                                                                                                                               |
| `court`            | `CourtId`?                            | Bir bölüm veya duruşma yeri için: ait olduğu mahkeme                                                                                                                                                                                                                                                                                                                                                                                          |
| `name`             | `{ nl?, fr?, de? }`                   | Mahkemenin yayımladığı haliyle adı, sayfası olan her dilde: `Vredegerecht Gent 1`, `Tribunal de l'entreprise du Hainaut - division Mons`                                                                                                                                                                                                                                                                                                      |
| `judicialArea`     | `JudicialAreaId`                      | Yargı çevresi                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `arrondissement`   | `ArrondissementId`?                   | Alanı tek bir arrondissement olan veya bir arrondissement içinde kalan bir mahkeme ya da bölüm için o arrondissement                                                                                                                                                                                                                                                                                                                          |
| `canton`           | `CantonId`?                           | Bir vredegerecht için: hizmet verdiği kanton                                                                                                                                                                                                                                                                                                                                                                                                  |
| `cantons`          | `CantonId[]`?                         | Diğer her mahkeme için: Gerechtelijk Wetboek / Code judiciaire'in eki (md. 3–5) ve Kanun'un 114. maddesinin belirlediği şekilde kapsadığı kantonlar. Bir bölüm için: tamamı bölümün yetki alanında kalan kantonlar; bu yetki alanını Kanun'un 186. maddesi uyarınca çıkarılan kraliyet kararnameleri belirler (bkz. [bölümler](#divisions)). Kararname ceza davaları için başka bir yetki alanı belirliyorsa, hukuk davalarındaki yetki alanı |
| `municipalities`   | `MunicipalityId[]`?                   | Yetki alanı bir kantonun yalnızca bir kısmını içine alan bir bölüm için: o belediyeler, REFNIS koduyla                                                                                                                                                                                                                                                                                                                                        |
| `criminalArea`     | `{ cantons?, municipalities? }`?      | Kararnamesi ceza davaları için hukuk davalarındakinden farklı bir yetki alanı belirleyen bir bölüm için: ceza davalarındaki yetki alanı; `cantons` ve `municipalities` gibi okunur. Bölümün her iki dava türü için tek bir yetki alanı varsa yoktur                                                                                                                                                                                           |
| `ecli`             | `string[]`?                           | Mahkemenin ECLI kodları, yargılama yaptığı her dil için bir tane; yalnızca yayımlanmış kararlarda görülen kodlar                                                                                                                                                                                                                                                                                                                              |
| `address`          | `Address`?                            | Kalemin bulunduğu yer, posta kodunun ait olduğu belediyeyle birlikte (`municipality`, REFNIS koduyla). Mahkeme tek bir adres yayımlamıyorsa (her bölümünün kendi adresi olan bir mahkeme) yoktur                                                                                                                                                                                                                                              |
| `contacts`         | `Contact[]`                           | Telefon, faks, e-posta ve banka hesabı; her biri ait olduğu kalemle (`label`) ve onunla birlikte yayımlanan metinle (`note`)                                                                                                                                                                                                                                                                                                                  |
| `openingHours`     | string?                               | Kalemin çalışma saatleri, OpenStreetMap [`opening_hours`](https://wiki.openstreetmap.org/wiki/Key:opening_hours) sözdiziminde: `Mo-Fr 08:30-12:30,13:30-16:00`; yalnızca yayımlanan metin tam olarak bunu söylüyorsa                                                                                                                                                                                                                          |
| `openingHoursText` | `{ nl?, fr?, de? }`?                  | Yayımlandığı haliyle çalışma saatleri, dil başına                                                                                                                                                                                                                                                                                                                                                                                             |
| `website`          | `{ nl?, fr?, de? }`                   | Mahkemenin portaldaki sayfası, dil başına                                                                                                                                                                                                                                                                                                                                                                                                     |
| `sources`          | `{ url, retrieved }[]`                | Kaydın okunduğu sayfalar ve içeriklerinin ilk görüldüğü tarih                                                                                                                                                                                                                                                                                                                                                                                 |

::: tip Yeni mahkeme türleri
`type` yeni değerler kazanabilir (örneğin Hof van Cassatie / Cour de cassation). Üzerinde
`switch` kullanıyorsanız, yeni bir türün kodunuzu bozmaması için bir `default` dalı bırakın.
:::

## Yapı {#shape}

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
    street: string // yayımlandığı haliyle, numara, kutu veya katla: 'Beverstraat 7B (eerste verdieping)'
    postalCode: string
    city: string
    municipality?: MunicipalityId // posta kodu üzerinden; posta kodları sayfasına bakın
}

interface Contact {
    type: 'phone' | 'fax' | 'email' | 'bank-account'
    value: string // kanonik: E.164, küçük harfli e-posta, elektronik IBAN
    label?: string // kalem veya servis: 'Burgerlijke griffie', 'Greffe pénal'
    note?: string // değerle birlikte yayımlanan metin: 'druk 1', 'tapez 2'
}
```

## Bölümler {#divisions}

Bir rechtbank van eerste aanleg / tribunal de première instance, ondernemingsrechtbank / tribunal
de l'entreprise, arbeidsrechtbank / tribunal du travail, arbeidshof / cour du travail veya
politierechtbank / tribunal de police bölümlere (afdelingen, divisions) ayrılabilir: başvuru
bölüme yapılır, duruşma da orada görülür. Bir ondernemingsrechtbank / tribunal de l'entreprise
bölümü, aynı zamanda şirket belgelerindeki tüzel kişiler sicili ibaresinde yer alan bölümdür
("RPR Gent, afdeling Brugge"). Her bölümün yetki alanını, Gerechtelijk Wetboek / Code
judiciaire'in 186. maddesi uyarınca çıkarılan bir kraliyet kararnamesi belirler: 14 Mart 2014
tarihli kararname ya da o tarihten sonra birçok mahkeme için mahkemenin kendi dava dağılımı
kararnamesi (zaakverdelingsreglement). 2017–2019 kanton reformları ve 2025 belediye birleşmeleri
her ikisini de değiştirdi.

Her bölümün yetki alanı `cantons` içindedir: tamamı o yetki alanında kalan kantonlar. Bir
kararname bir kantonu böldüğünde bölüm, o kantondan aldığı belediyeleri `municipalities` içinde
listeler. Hainaut tribunal du travail'i Pont-à-Celles'i (Seneffe kantonu) Charleroi'ya,
Erquelinnes ile Merbes-le-Château'yu (Chimay kantonu) Binche'e gönderir. Liège tribunal de
première instance'ı (2024'ten beri) ile Limburg politierechtbank'ı ve Liège tribunal de police'i
bölümlerine kanton yerine belediye listeleri verir. Bir belediye, onu `municipalities` içinde
anan bölüme, böyle bir bölüm yoksa kantonuna sahip olan bölüme aittir. Bu aramayı
`findDivisionsWithJurisdiction` yapar.

### Hukuk ve ceza davaları {#civil-and-criminal-cases}

Bir kararname hukuk davaları için bir yetki alanı, ceza davaları için başka bir yetki alanı
belirleyebilir. Antwerpen rechtbank van eerste aanleg'i ve politierechtbank'ı, 16 Aralık 2020
tarihli kararnamelerinde böyle yapar: hukuk davalarında Heist-op-den-Berg kantonunun tamamı
Mechelen bölümüne gider; ceza davalarında ise (bu davalarda görülen özel hukuk talepleriyle
birlikte) kantonun Hulshout ve Herenthout belediyeleri Turnhout'a gider.

Bu durumda `cantons` ve `municipalities` hukuk davalarındaki yetki alanıdır; bölümün ceza
davalarındaki yetki alanı ise aynı iki alanla `criminalArea` içinde yer alır:

```ts
getCourt('police-court-antwerpen-turnhout').criminalArea
// { cantons: ['mol-geel-1', 'mol-geel-2', 'turnhout-1', 'turnhout-2', 'westerlo'],
//   municipalities: ['13012', '13016'] }   Herenthout ve Hulshout
```

Yalnızca iki yetki alanı birbirinden farklı olan bir bölümün `criminalArea` alanı vardır: bugün
dört tane, her iki mahkemenin Mechelen ve Turnhout bölümleri. Diğer her bölüm için tek yetki
alanı her iki dava türünde de geçerlidir. `findDivisionsWithJurisdiction` dava türünü `matter`
olarak alır:

```ts
const ids = (options?: DivisionOptions) =>
    findDivisionsWithJurisdiction('13016', 'police-court', options).map((d) => d.id)
ids({ matter: 'civil' }) // ['police-court-antwerpen-mechelen']
ids({ matter: 'criminal' }) // ['police-court-antwerpen-turnhout']
ids() // ikisi de, önce hukuk davalarındaki: dava türü belirler
```

### Kaynaklar {#sources}

Yetki alanları yürürlükteki metindir; her bölümün `sources` içinde atıf yaptığı Belgisch
Staatsblad / Moniteur belge yayınlarından elle konsolide edilmiştir: yetki alanını belirleyen
kararname ve onu sonradan değiştiren her kararname. Politierechtbanken / tribunaux de police'in
yetki alanları Justel'in konsolide metinlerinden okunmuştur. Bir test, bir mahkemenin
bölümlerinin mahkemenin yetki alanını hem hukuk hem de ceza davalarında tam bir kez kapsadığını
denetler.

Bir kararname, belirli bir dava türünü mahkemenin tamamı için tek bir bölüme de gönderebilir:
Hainaut tribunal du travail'indeki toplu borç yapılandırması (règlement collectif de dettes)
davaları ya da Liège tribunal de police'inde tribunaux du travail'in görev alanına giren suçlar.
Bu kurallar verilerde yoktur.

## Yardımcılar {#helpers}

```ts
getCourt('justice-of-the-peace-gent-1')
getJusticeOfThePeace('gent-1') // aynı mahkeme, kanton id'siyle
getDivisions('enterprise-court-gent') // sekiz bölümü
getCourtsForCanton('gent-1') // vredegerecht'i ve diğer her türden birer mahkeme
findCourtsWithJurisdiction('23088', 'police-court') // [police-court-vilvoorde], REFNIS koduyla
findDivisionsWithJurisdiction('31005', 'enterprise-court') // [enterprise-court-gent-brugge]
findDivisionsWithJurisdiction('44021', 'police-court') // [police-court-oost-vlaanderen-gent]
findCourts({ type: 'police-court', kind: 'court', judicialArea: 'gent' })
getContact(court, 'email', 'Greffe pénal') // eşleşen ilk iletişim kaydının değeri
formatPhoneNumber('+3253820701') // '053 82 07 01'
formatIban('BE73679200844560') // 'BE73 6792 0084 4560'
```

## Veriler nasıl okunur {#how-the-data-is-read}

Portalda her mahkeme ve her bölüm için, mahkemenin dilinde bir sayfa vardır; Brüksel'deki iki
dilli mahkemelerin bir Felemenkçe bir de Fransızca sayfası, Eupen'deki mahkemelerin ise bir
Fransızca bir de Almanca sayfası bulunur. Ayrıştırıcı (parser):

1. mahkemenin türünü ve yerini adından (`Politierechtbank Limburg - afdeling Genk`), bir
   vredegerecht'in kantonunu da adından ve numarasından okur;
2. bir mahkemenin dil sürümlerini tek bir kayıtta birleştirir: adlar, sayfalar ve çalışma
   saatleri dil başına; adres ve iletişim bilgileri ilk dilden (Brüksel'de Felemenkçe, Eupen'de
   Almanca), yalnızca diğer sayfada bulunan değerlerle tamamlanarak;
3. kalemlerin iletişim bloklarını okur ve her değeri kendi kalemiyle birlikte tutar;
4. yayımlanan çalışma saatlerini, yalnızca her kelime anlaşıldığında ve her dil aynı şeyi
   söylediğinde `opening_hours` sözdizimine çevirir. Bir not veya geçici bir düzenleme içeren
   metin ("OPGELET: tot 31 december…") yalnızca yayımlanan metin olarak kalır;
5. her mahkemeye kanunun ona verdiği kantonları (`cantons`), `scripts/parse/jurisdictions.ts`
   içindeki Gerechtelijk Wetboek ekinden alınmış bir tablodan atar ve `arrondissement`'ını
   bunlardan türetir. Tablo ve portal birbirini denetler: portalda olup kanun tablosunda olmayan
   bir mahkeme, ya da tersi, derlemeyi durdurur.

Bir sayfa yerleştirilemediğinde (bilinmeyen bir mahkeme türü, kantonu olmayan bir vredegerecht),
bir kantonun mahkemesi olmadığında ya da kanun tablosu ile portal hangi mahkemelerin var olduğu
konusunda uyuşmadığında hiçbir şey yazmayı reddeder. Okuyamadığı şeyler (alan kodu olmayan bir
telefon numarası, cümle olarak yazılmış bir adres) haftalık pull request ile bildirilir ve tahmin
edilmek yerine verilerden çıkarılır.

## Kanonik değerler {#canonical-values}

| Değer            | Saklanma biçimi                                  | Neden                                                                                                                                                                              |
| ---------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telefon numarası | E.164: `+3253820701`                             | Her numara için tek bir biçim, her yerden aranabilir, `tel:` bağlantıları olduğu gibi çalışır                                                                                      |
| IBAN             | Elektronik biçim: `BE73679200844560`             | Ödeme sistemlerinin kabul ettiği biçim; sağlama toplamı okunurken ve testlerde doğrulanır                                                                                          |
| E-posta          | Küçük harf                                       | Karşılaştırma ve yinelenenleri ayıklama çalışır                                                                                                                                    |
| Çalışma saatleri | `opening_hours`: `Mo-Fr 08:30-12:30,13:30-16:00` | OpenStreetMap standardı; birçok dilde ayrıştırıcısı vardır (örn. [opening_hours.js](https://github.com/opening-hours/opening_hours.js)) ve kendisi belirli bir dile bağlı değildir |
| Sokak            | Yayımlandığı haliyle                             | Numaralar, kutular ve katlar çok farklı biçimlerde yazılır (`Canadaplein ZN`, `Rue de Bruxelles 2 - 3`); tahmin yürütmeden bölmek mümkün değildir                                  |
