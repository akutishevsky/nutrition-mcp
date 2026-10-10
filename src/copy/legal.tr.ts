// Turkish (tr) translation of PRIVACY_EN / TERMS_EN. Kept in the same direct,
// plain-spoken register as the rest of the Turkish site copy (informal "sen",
// matching src/copy/chrome.tr.ts, login.tr.ts and health-sync.tr.ts) rather
// than shifting into formal/legalistic Turkish — see legal.ts's own comment
// above PRIVACY_DE/TERMS_DE for the reasoning. Brand names are never
// inflected or given a Turkish apostrophe suffix (Google, GitHub, Claude,
// Apple Health, …); sentences are reworded around them instead, because
// scripts/depersonalize.ts matches base forms only. No human review pass
// (product decision, see git history) — this is exactly the page most worth
// a native-speaker legal review before it's relied on.

import type { LegalDoc } from "./legal.js";

export const PRIVACY_TR: LegalDoc = {
    title: "Gizlilik Politikası",
    metaDescription:
        "Nutrition MCP verilerini nasıl işliyor: neleri saklıyoruz, nasıl kullanılıyor, nerede tutuluyor ve hesabını içindeki her şeyle birlikte dilediğin an nasıl silersin.",
    ogDescription:
        "Nutrition MCP verilerini nasıl işliyor: neleri saklıyoruz, nasıl kullanılıyor, nerede tutuluyor ve hesabını içindeki her şeyle birlikte dilediğin an nasıl silersin.",
    lead: "Nutrition MCP verilerini nasıl işliyor: neleri saklıyoruz, nasıl kullanılıyor, nerede tutuluyor ve hesabını içindeki her şeyle birlikte dilediğin an nasıl silersin.",
    documentsLabel: "Hukuki belgeler",
    tocLabel: "Bu sayfada",
    lastUpdated: "10 Ekim 2026",
    backToHome: "Ana sayfaya dön",
    sections: [
        {
            heading: "Neleri topluyoruz",
            blocks: [
                {
                    type: "p",
                    html: "Kayıt olduğunda <strong>e-posta adresini</strong> ve güvenli biçimde hash'lenmiş bir şifreyi Supabase Auth üzerinden saklıyoruz. Bunun yerine Google ile giriş yaparsan, Google servisinden yalnızca e-posta adresini isteriz ve onu, Google tarafından senin için verilen hesap kimliğiyle birlikte alırız; Supabase Auth bu kimliği saklar, böylece bir sonraki Google girişinde seni tanıyabilir. Bir Google şifresini asla görmeyiz. 27 Eylül 2026 tarihinden önce Google ile giriş yapmış hesaplarda, Google tarafından o zaman gönderilen ad ve profil fotoğrafı da hâlâ duruyor olabilir; veri dışa aktarman dışında serviste bunları okuyan ya da gösteren hiçbir yer yok ve hesabınla birlikte silinirler.",
                },
                {
                    type: "p",
                    html: "Servisi kullandığında şunları saklıyoruz:",
                },
                {
                    type: "ul",
                    items: [
                        "<strong>Yemek kayıtları</strong> — açıklama, yemek türü, kalori, makrolar, lif, toplam şeker, ilave şeker, doymuş yağ, trans yağ, gram cinsinden alkol, miligram cinsinden kafein, notlar ve zaman damgaları. Bir yemeği malzemeleriyle kaydedersen her malzeme de tutulur — adı, miktarı, birimi ve besin değerleri — ve varsa kaydedildiği kayıtlı yemek de. Yemek fotoğraflarını yapay zekâ asistanın yorumlar; bunlar bize hiçbir zaman yüklenmez ve bizde saklanmaz.",
                        "<strong>Kayıtlı yemekler</strong> — adı, açıklaması, varsayılan yemek türü ve porsiyon başına değerleri, varsa malzemeleri (her biri için ad, miktar, birim ve besin değerleri) ve oluşturulduğu ile son değiştirildiği zaman. Kayıtlı yemekten kaydettiğin yemekler kendi değerlerinin kendi kopyasını tutar; kayıtlı yemeği değiştirmek ya da silmek onları olduğu gibi bırakır.",
                        "<strong>Su kayıtları</strong> — miktar, notlar ve zaman damgaları.",
                        "<strong>Kilo kayıtları</strong> — kilo, notlar ve zaman damgaları. Bu bir sağlık verisidir ve diğer kayıtlarınla tamamen aynı şekilde ele alınır.",
                        "<strong>Vücut ölçüsü kayıtları</strong> — hangi bölgenin ölçüldüğü (bel, kalça, boyun, göğüs, omuzlar, üst kol, ön kol, uyluk ya da baldır), değer tam senin girdiğin gibi ve birimi (cm veya in), notlar ve zaman damgaları. Bu bir sağlık verisidir ve diğer kayıtlarınla tamamen aynı şekilde ele alınır.",
                        "<strong>Hedefler</strong> — günlük kalori, protein, karbonhidrat, yağ, doymuş yağ, lif, şeker, ilave şeker, alkol, kafein ve su hedeflerin ile hedef kilon. Her değiştiklerinde ayrıca tarihli bir kopyasını saklıyoruz, böylece geçmiş bir gün, o gün geçerli olan hedeflerle karşılaştırılabilir.",
                        "<strong>Profil ayarları</strong> — IANA saat dilimin, tercih ettiğin kilo birimi, vücut ölçüleri için tercih ettiğin uzunluk birimi, alkol takibinin açık olup olmadığı ve hangi standart içki üzerinden gösterildiği, sohbet içi widget'ların etkin olup olmadığı ve bu widget'ların hangi dilde gösterildiği.",
                        "<strong>Apple Health eşitlemesi</strong> — yalnızca iPhone cihazındaki Nutrition MCP Health kısayolu üzerinden bağlarsan: bağlantının kendisi (hangi günlük toplamları gönderdiği, suyun dahil olup olmadığı, hangi tarihten başladığı, telefonunun bildirdiği saat dilimi — ki bu yalnızca profilinde saat dilimi yokken kullanılır — ve ne zaman oluşturulduğu, en son ne zaman kullanıldığı ve en son ne zaman eşitlendiği); son 8 günün her biri için, Apple Health tarafına daha önce gönderilen toplamlar ve gönderim zamanı, böylece bir gün bir kez gönderilir ve sonrasında yalnızca eklenenlerle tamamlanır; ve bağlanma sırasında, 30 dakikaya kadar bekleyen bir bağlanma isteği. Alkol hiçbir zaman gönderilmez.",
                        "<strong>Araç kullanım telemetrisi</strong> — her MCP araç çağrısı için: hangi aracın çalıştığı, başarılı olup olmadığı, ne kadar sürdüğü, başarısız olduğunda kaba bir hata kategorisi, sorduğun tarih aralığının gün cinsinden uzunluğu, MCP oturum kimliği, yapay zekâ uygulamanın hangi MCP protokol revizyonuyla bağlandığı ve bu uygulamanın kendisi için bildirdiği ad ile sürüm (örneğin &ldquo;claude-ai/1.0&rdquo;), bunları gönderdiğinde. Hesap kimliğinle ilişkilendirilir. Kayıtlarının içeriğini asla içermez.",
                        "<strong>Sunucu çalışma kaydı</strong> — sunucuya gelen her istek için: yöntem, yol, yanıt durumu ve yanıt süresi, son bölümü çıkarılmış IP adresin ve MCP istekleri için protokol revizyonu ile yapay zekâ uygulamanın bildirdiği ad ve sürüm. Her araç çağrısı için ayrıca aracın adını, başarılı olup olmadığını, ne kadar sürdüğünü ve başarısız olduğunda kısa bir referans kodunu ve hata mesajını tutar — bu mesaj, yapay zekâ uygulamanın gönderdiği bir değeri, örneğin geçersiz bir tarihi, geri yansıtabilir. Yapay zekâ uygulaman giriş yaptığında ya da bağlantısını yenilediğinde sonucu, uygulamanın giriş servisimize kaydolurken aldığı rastgele tanımlayıcıyı ve geri gönderilmek istediği siteyi (örneğin claude.ai) kaydeder. Barındırma sağlayıcımızın çalışma kaydına yazılır, hesap kimliğini ya da e-posta adresini içermez ve yalnızca kısa süre tutulur: bu kayıt, yeni trafik geldikçe eski satırların üzerine yazan dönen bir tampondur.",
                    ],
                },
                {
                    type: "p",
                    html: "<strong>Alkol de bir sağlık verisidir</strong> ve bir kalori sayısından daha hassas bir türdendir; bu yüzden yukarıdaki her şeyden farklı çalışır. Alkol takibi varsayılan olarak kapalıdır ve alkolü yalnızca senden geldiğinde kaydediyoruz — kaydettiğin bir içki ya da içe aktardığın bir dosyadaki bir sütun. Hiçbir şey onu senin adına çıkarsamaz. Ayarı kapatmak iki şey yapar: toplu içe aktarıcı yüklediğin dosyalardaki alkol sütununu okumayı bırakır ve geri kalan her şey, gördüğün yemeklerde, hedeflerde, ilerlemede ve widget'larda alkolü göstermeyi bırakır. Bu bir silme düğmesi değildir. Doğrudan kaydettiğin alkol, ayar açık da olsa kapalı da olsa kaydedilmeye devam eder, hâlihazırda saklanan her şey veritabanında kalır ve bunların tamamı, alacağın her dışa aktarmanın yemekler dosyasında yine görünür. Bir alkol değerini gerçekten kaldırmak için ait olduğu yemeği sil ya da hesabını sil.",
                },
                {
                    type: "p",
                    html: "Ayrıca yapay zekâ asistanının hesabına bağlı kalmasını sağlayan OAuth erişim ve yenileme belirteçlerini ve yetkilendirme kodlarını saklıyoruz; her birinin ne kadar sürdüğü &ldquo;Verileri ne kadar süre tutuyoruz&rdquo; başlığı altındadır. Bunlar yalnızca tek yönlü hash olarak saklanır. Apple Health eşitlemesinin kendine ait bir erişim belirteci vardır; onu da yalnızca tek yönlü hash olarak saklıyoruz. Kısayolun isteklerini yapabilmek için belirtecin kendisine ihtiyacı var, bu yüzden Kısayollar uygulaması onu iPhone cihazında bir dosyada değil kısayolun kendi deposunda tutar ve kısayolların iCloud üzerinden eşitleniyorsa diğer cihazlarına da aktarabilir. Cihazlarında o kısayolu çalıştırabilen herkes, sen bağlantıyı kesene kadar eşitlemeyi kullanabilir.",
                },
            ],
        },
        {
            heading: "Verileri nasıl kullanıyoruz",
            blocks: [
                {
                    type: "p",
                    html: "Yemek, kayıtlı yemek, su, kilo, vücut ölçüsü ve hedef verilerin yalnızca beslenme takibi servisini sunmak için ve anonim, toplu biçimde ana sayfadaki herkese açık istatistikler için kullanılır. Bunları <strong>asla satmıyoruz, asla üçüncü taraflarla paylaşmıyoruz ve asla reklam için kullanmıyoruz</strong>; hiçbir reklam ya da profilleme sistemine de aktarmıyoruz. Aşağıda anlatılan Apple Health eşitlemesi bunu değiştirmez: bu, senin kendi başlattığın, kendi iPhone cihazına yapılan bir aktarımdır ve Apple tarafına hiçbir şey göndermiyoruz.",
                },
                {
                    type: "p",
                    html: "Ana sayfa ve arkasındaki herkese açık istatistik akışı, site genelindeki anonim toplamları gösterir — kaç yemek kaydedildiğini, bunların kalorilerini ve makrolarını, kaydedilen suyu ve tüm hesaplar genelinde net verilen kiloyu — ve profillerde ayarlanmış saat dilimlerini; ana sayfa bunları bir dünya haritası olarak çizer. Bir saat dilimi haritada yalnızca en az üç profil onu kullandığında görünür ve hiçbir sayı bir kişiyle ilişkilendirilmez.",
                },
                {
                    type: "p",
                    html: 'Sen ya da yapay zekâ asistanın bir barkod sorguladığında, sunucumuz yalnızca barkod rakamlarını <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer">Open Food Facts</a> tarafına gönderir — hesabını, e-posta adresini ya da kayıtlarını asla — ve dönen ürün verilerini, hiçbir kullanıcıyla ilişkilendirilmeyen paylaşımlı bir önbellekte tutar.',
                },
                {
                    type: "p",
                    html: "Apple Health eşitlemesini bağlarsan, iPhone cihazındaki kısayol sunucumuzdan tamamlanmış günlerinin günlük toplamlarını ister — kalori, protein, karbonhidrat, yağ, lif, kafein ve seçtiysen su — ve bunları o iPhone cihazındaki Apple Health uygulamasına yazar. Bu, senin isteğinle ve senin cihazında olur: sunucumuz yalnızca kısayola yanıt verir ve Apple tarafına hiçbir şey göndermez. Toplamlar bir kez Apple Health içine girdikten sonra orada senin kendi ayarlarına ve Apple ile olan sözleşmene göre saklanır ve paylaşılır, bizimkine göre değil.",
                },
                {
                    type: "p",
                    html: "İki tür analiz de var ve ikisi de kayıtlarının içeriğine dokunmaz:",
                },
                {
                    type: "ul",
                    items: [
                        "<strong>Web sitesi analizi.</strong> İzninle bu sayfalar Google Analytics yükler — bu bize toplu trafik istatistikleri verir: sayfa görüntülemeleri, yönlendiren siteler, kaba coğrafya, cihaz türü — ve Microsoft Clarity yükler; bu da ziyaretçilerin siteyi nasıl kullandığını (tıklamalar, dokunmalar, kaydırma, fare hareketi) oturum kayıtları ve ısı haritaları olarak kaydeder, böylece sayfaların insanları nerede şaşırttığını görebiliriz. Çerez bildiriminde kabul etmeden ikisi de yüklenmez; reddedersen ikisi de hiç yüklenmez ve tarayıcın bir Global Privacy Control sinyali gönderiyorsa, alt bilgiden kendin izin vermedikçe ikisi de yüklenmez. Kabul etmek yalnızca analiz depolamasına izin verir: reklam depolaması ve Google signals kapalı kalır. Google her istekte IP adresini alır ama Google tarafının beyanına göre AB, İsviçre ya da Birleşik Krallık ziyaretçileri için bunu kaydetmez ya da saklamaz ve yalnızca yaklaşık bir konum çıkarmak için kullanır. Clarity formlara yazdıklarını maskeler ve o da IP adresini ve tarayıcı bilgilerini alır. İkisi de giriş sayfasında çalışmaz. İzni dilediğin an alt bilgideki &ldquo;Çerez ayarları&rdquo; ile geri çekebilirsin; bu aynı zamanda bu sitede ayarlanmış analiz çerezlerini de siler. Seçimin tarayıcının yerel deposunda 6 aya kadar tutulur.",
                        "<strong>Sunucu telemetrisi.</strong> Her MCP araç çağrısı bir satır kullanım telemetrisi yazar — hangi aracın çalıştığı, başarılı olup olmadığı, ne kadar sürdüğü, hangi MCP protokol revizyonunun ve hangi yapay zekâ uygulamasının (bildirdiği ad ve sürümle) çağrıyı yaptığı — hesap kimliğinle ilişkili, ama kaydettiğin şeyle değil. Bunu yavaş ve bozuk araçları bulmak için kullanıyoruz. Kimseyle paylaşılmaz ve hesabını sildiğinde geri kalan her şeyle birlikte silinir.",
                    ],
                },
                {
                    type: "p",
                    html: "Site yazı tiplerini ve simgelerini Google Fonts ve jsDelivr üzerinden yüklediği için, bu sayfaları ziyaret etmek IP adresini bu sağlayıcılara açar. Projenin GitHub yıldız sayısını tarayıcın değil sunucumuz çeker, bu yüzden GitHub tarafı ziyaretini hiç görmez.",
                },
            ],
        },
        {
            heading: "Veriler nerede tutuluyor",
            blocks: [
                {
                    type: "p",
                    html: 'Tüm veriler AB içinde, AWS İrlanda bölgesinde (eu-west-1), <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">Supabase</a> (PostgreSQL) üzerinde saklanır. Kimlik doğrulama ve dışa aktarma depolaması da aynı bölgede Supabase tarafından yürütülür. Sunucu, Almanya&rsquo;nın Frankfurt şehrinde DigitalOcean üzerinde çalışır. Siteye ve sunucuya gelen istekler Cloudflare ağından geçer (bu ağı barındırma sağlayıcımız kullanır); Cloudflare bağlantının şifresini çözer ve dolayısıyla servise gönderilen ve servisten gelen her şeyi, IP adresin dahil, aktarım sırasında işler ve kesinlikle gerekli bir bot koruma çerezi ayarlayabilir (<code>__cf_bm</code>, 30 dakika).',
                },
            ],
        },
        {
            heading: "Verileri ne kadar süre tutuyoruz",
            blocks: [
                {
                    type: "p",
                    html: "Yemek kayıtların, kayıtlı yemeklerin, su, kilo ve vücut ölçüsü kayıtların, hedefler ve değişiklik geçmişleri, profil ayarların ve araç kullanım telemetrin hesabın var olduğu sürece tutulur — bunların hiçbirinin ayrı bir son kullanma tarihi ya da planlı bir temizliği yok. Hesabını sildiğinde bunların tamamı, aşağıda anlatıldığı gibi anında ve geri dönüşsüz biçimde silinir. Geriye kalan tek izler şunlar: hesap kimliğin olmadan kaydedilen, silme işleminin kendisine ait telemetri satırı; yukarıda anlatılan ve hesap kimliğini hiçbir zaman taşımayan kısa ömürlü sunucu çalışma kaydı; veritabanı sağlayıcımızın sınırlı bir süre tuttuğu kendi operasyonel kayıtları (bizim planımızda 7 güne kadar); ve kendi takvimine göre eskiyip düşen dönen yedekleri.",
                },
                {
                    type: "p",
                    html: "Giriş bilgileri tasarımı gereği kısa ömürlüdür. Giriş sayfasının oturumu 10 dakika sürer ve sunucunun belleğinde tutulur; yalnızca rastgele bir değer taşıyan, kesinlikle gerekli bir çerezle tarayıcına bağlanır — bu çerez de aynı 10 dakikanın sonunda sona erer ve giriş tamamlandığında silinir. Şifreni ya da Google girişini doğrulamak için Supabase Auth kullanıyoruz; bu her seferinde bir Supabase giriş oturumu oluşturur, biz onu hiç kullanmayız ve hemen sona erdiririz. Yapay zekâ uygulamana verilen tek kullanımlık yetkilendirme kodu 10 dakika sonra geçersiz olur ve kullanıldığı anda silinir. Bir erişim belirteci 24 saat geçerlidir (27 Eylül 2026 tarihinde ve öncesinde verilen birkaç belirteç en geç 6 Ekim 2026 tarihinde sona erer); bir yenileme belirteci 90 gün geçerlidir ve yeni bir çift almak için kullanıldığı anda silinir. Süresi geçmiş belirteçler ve kodlar bir saat içinde otomatik olarak silinir. Hesabını silmek hepsini anında kaldırır.",
                },
                {
                    type: "p",
                    html: "Apple Health eşitlemesi de zaman sınırlıdır. Bağlantı, 90 gün boyunca kullanılmadığında ve her hâlükârda bağladıktan 365 gün sonra sona erer; bundan sonra kısayolun yeniden bağlanması gerekir. Gönderilenlerin kaydı yalnızca son 8 günü tutar ve tamamlamadığın bir bağlanma isteği 30 dakika sürer. Süresi geçmiş bağlantılar, kayıtlar ve istekler bir saat içinde otomatik olarak silinir. Kısayolda Disconnect seçeneğini seçmek, bağlantıyı ve kaydını anında siler.",
                },
                {
                    type: "p",
                    html: "Dışa aktarma arşivleri kısa ömürlüdür. Her yeni dışa aktarma öncekinin üzerine yazar ve dosya, 60 dakikalık indirme bağlantısı sona erdiğinde otomatik olarak silinir — temizlik her on dakikada bir çalışır, bu yüzden bir arşiv normalde depoda yaklaşık 70 dakikadan uzun kalmaz.",
                },
            ],
        },
        {
            heading: "Verilerin silinmesi",
            blocks: [
                {
                    type: "p",
                    html: "Nutrition MCP sunucusuna bağlıyken yapay zekâ asistanından <strong>hesabını silmesini</strong> isteyerek hesabını ve ilişkili tüm verileri dilediğin an silebilirsin. Bu işlem anında ve geri dönüşsüzdür. Yemek kayıtların ve her birinin malzemeleri, kayıtlı yemeklerin ve malzemeleri, su, kilo ve vücut ölçüsü kayıtların, hedefler ve değişiklik geçmişleri, profil ayarların, depoda hâlâ duran bir dışa aktarma arşivi, araç kullanım telemetrin, erişim belirteçlerin, Apple Health eşitleme bağlantın ve gönderilenlere ait kaydı ve hesabın kendisi kaldırılır. Buna, alkol takibi açık olsun ya da olmasın, şimdiye kadar kaydettiğin her alkol değeri de dahildir. Kısayolun Apple Health içine daha önce yazdığı toplamlar iPhone cihazında, sunucularımızda değil; sen Health uygulamasında silene kadar orada kalırlar.",
                },
            ],
        },
        {
            heading: "İletişim ve hakların",
            blocks: [
                {
                    type: "p",
                    html: 'Nutrition MCP, bağımsız bir geliştirici olan Anton Kutishevskyi tarafından işletilir; bu servis için kişisel verilerinin veri sorumlusu kendisidir. Verilerinle ya da bu politikayla ilgili her konu için <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a> adresine e-posta gönder.',
                },
                {
                    type: "p",
                    html: "Verileri işlememize ne izin veriyor:",
                },
                {
                    type: "ul",
                    items: [
                        "<strong>Hesabın ve kayıtların</strong> — kaydolduğun servisi sunmak için (bir sözleşmenin ifası). Yemekler, kilo, vücut ölçüleri ve alkol sağlık verisidir; bu yüzden bunları açık rızana dayanarak işliyoruz. Bu rızayı hesabını oluştururken ve her giriş yaptığında veriyorsun (giriş sayfası bu rızayı istemeye başlamadan önce bağlanmış bir uygulama için: bir sonraki girişine kadar kayıtları girmekle) ve kayıtları ya da hesabını silerek dilediğin an geri çekebilirsin. Apple Health eşitlemesi de aynı rızaya dayanır ve ancak sen bağladığında çalışır; kısayolda bağlantıyı kesmek, eşitleme için verdiğin bu rızayı geri çeker.",
                        "<strong>Araç kullanım telemetrisi ve sunucu çalışma kaydı</strong> — servisi çalışır, hızlı ve güvenli tutmaktaki meşru menfaatimiz (bozuk araçları bulmak, kötüye kullanımı hız sınırıyla engellemek). İkisi de kayıtlarının içeriğini içermez.",
                        "<strong>Web sitesi analizi</strong> — çerez bildiriminde verdiğin ve alt bilgideki &ldquo;Çerez ayarları&rdquo; ile dilediğin an geri çekebileceğin rızan.",
                    ],
                },
                {
                    type: "p",
                    html: "Hakların ve bunları nasıl kullanacağın — çoğu için e-posta göndermen bile gerekmiyor:",
                },
                {
                    type: "ul",
                    items: [
                        "<strong>Erişim ve taşınabilirlik</strong> — yapay zekâ asistanından verilerini dışa aktarmasını iste. Hakkında sakladığımız her şeyi içeren CSV dosyalarından oluşan bir ZIP alırsın: yemek kayıtların (meals.csv, doymuş yağ ve trans yağ sütunlarıyla), kaydettiğin yemeklerin malzemeleri (meal_items.csv), kayıtlı yemeklerin (saved_meals.csv) ve onların malzemeleri (saved_meal_items.csv), su, kilo ve vücut ölçüsü kayıtların, hedeflerin ve hedef değişikliklerinin geçmişi, ayarların, hesap kaydın (e-posta adresi, giriş yöntemleri ve giriş tarihleri ve Google tarafından gönderilmiş bir ad ya da fotoğraf varsa onlar), araç kullanım telemetrin, yapay zekâ uygulamalarını ve Apple Health eşitlemesini bağlı tutan bağlantılar (belirteçlerin kendileri hariç) ve son 8 günde Apple Health tarafına gönderilen günlük toplamların kaydı. İçinde olmayanlar: güvenlik için yalnızca tek yönlü hash olarak tuttuğumuz değerler (şifren ve bağlantılarının belirteçleri), yineleme tespiti anahtarları gibi dahili kayıt tutma verileri, hesap kimliğini içermeyen sunucu çalışma kaydı ve sağlayıcılarımızın kendi kısa ömürlü kayıtları ile dönen yedekleri.",
                        "<strong>Düzeltme</strong> — yapay zekâ asistanından herhangi bir yemek, su, kilo ya da vücut ölçüsü kaydını ya da kayıtlı bir yemeği düzeltmesini veya silmesini ya da hedeflerini ve ayarlarını değiştirmesini iste.",
                        "<strong>Silme</strong> — yapay zekâ asistanından hesabını silmesini iste; bu, her şeyi tek seferde kaldırır.",
                        "<strong>İtiraz ve kısıtlama</strong> — bize e-posta gönder.",
                        "<strong>Şikâyet</strong> — yaşadığın ya da çalıştığın yerdeki veri koruma kurumuna şikâyette bulunabilirsin. Önce bize düzeltme şansı verirsen memnun oluruz.",
                    ],
                },
                {
                    type: "p",
                    html: "Sakladığımız her şey yukarıda adı geçen AB bölgesinde kalır. Yapay zekâ asistanının araçlar üzerinden okuduğu her şey, AB dışında olabilecek o asistanın sağlayıcısına gönderilir; bu, bizim değil senin onlarla olan sözleşmen kapsamında gerçekleşir. Cloudflare (her isteğin geçtiği ağ), Google ve Microsoft (web sitesi analizi, Google Sign-In) ile Google ve jsDelivr (yukarıda anlatılan yazı tipi ve simge istekleri) de AB dışındadır; AB dışından kişisel veri aldıkları ölçüde Avrupa Komisyonunun standart sözleşme maddelerine ya da AB–ABD Veri Gizliliği Çerçevesine dayanırlar. Apple Health eşitlemesi bizim tarafımızdan bir aktarım eklemez: toplamlar sunucumuzdan iPhone cihazındaki kısayola gider ve Apple Health uygulamasının bundan sonra onlarla ne yaptığı senin kendi Apple ayarlarına bağlıdır.",
                },
                {
                    type: "p",
                    html: 'Servis 16 yaşından küçükler için tasarlanmadı ve <a href="/terms" data-legal-link="terms">Kullanım Koşulları</a> en az 16 yaşında olmanı gerektiriyor. Daha küçük birinin hesap oluşturduğunu düşünüyorsan bize e-posta gönder, hesabı sileriz.',
                },
                {
                    type: "p",
                    html: "Bu politika değişirse, üstteki tarih de onunla birlikte değişir.",
                },
            ],
        },
        {
            heading: "Kullanım Koşulları",
            blocks: [
                {
                    type: "p",
                    html: 'Servisin kullanımı aynı zamanda <a href="/terms" data-legal-link="terms">Kullanım Koşulları</a> belgemize tabidir; bu belge kabul edilebilir kullanımı, buradaki hiçbir şeyin tıbbi tavsiye olmadığını ve hiçbir garanti bulunmadığını kapsar — servis olduğu gibi, ücretsiz olarak, kullanılabilirlik, doğruluk ya da herhangi bir amaca uygunluk garantisi verilmeksizin sunulur.',
                },
            ],
        },
    ],
};

export const TERMS_TR: LegalDoc = {
    title: "Kullanım Koşulları",
    metaDescription:
        "Nutrition MCP kullanımını düzenleyen koşullar — Claude ve ChatGPT için ücretsiz, açık kaynak beslenme takipçisi ve uzak MCP sunucusu. Hesaplar, kabul edilebilir kullanım, verilerin ve sorumluluk konusunda açık dille yazılmış koşullar.",
    ogDescription:
        "Nutrition MCP kullanımını düzenleyen koşullar — Claude ve ChatGPT için ücretsiz, açık kaynak beslenme takipçisi ve uzak MCP sunucusu.",
    lead: "Nutrition MCP kullanımını düzenleyen koşullar — Claude ve ChatGPT için ücretsiz, açık kaynak beslenme takipçisi ve uzak MCP sunucusu.",
    documentsLabel: "Hukuki belgeler",
    tocLabel: "Bu sayfada",
    lastUpdated: "10 Ekim 2026",
    backToHome: "Ana sayfaya dön",
    sections: [
        {
            heading: "Sözleşme",
            blocks: [
                {
                    type: "p",
                    html: "Bu koşullar, Nutrition MCP (&ldquo;servis&rdquo;) kullanımını düzenler — nutrition-mcp.com adresindeki web sitesi ve <strong>https://nutrition-mcp.com/mcp</strong> adresindeki uzak MCP sunucusu. Bir hesap oluşturarak ya da sunucuya bir yapay zekâ asistanı bağlayarak bu koşulları kabul ediyorsun. Kabul etmiyorsan lütfen servisi kullanma.",
                },
                {
                    type: "p",
                    html: "Servis, bağımsız bir geliştirici olan Anton Kutishevskyi tarafından işletilir (&ldquo;biz&rdquo;, &ldquo;bize&rdquo;).",
                },
            ],
        },
        {
            heading: "Servis",
            blocks: [
                {
                    type: "p",
                    html: 'Nutrition MCP, MCP sunucusu olarak çalışan ücretsiz ve açık kaynak bir beslenme takipçisidir; Claude ve ChatGPT gibi yapay zekâ asistanlarının senin adına yemek, su, kilo ve vücut ölçüsü kaydetmesine olanak tanır. İstersen, iPhone cihazındaki bir kısayol günlük toplamlarını Apple Health içine kopyalayabilir. Ücretli bir paket, reklam ve servisi kullanmak için herhangi bir ücret yok. Barındırma ve veritabanı masraflarını karşılamaya yardımcı olmak üzere Patreon üzerinden gönüllü bağışlar kabul ediyoruz; bunlar bir hediyedir, satın alma değildir ve hiçbir özellik, hiçbir paket ve hiçbir tür ayrıcalık satın almaz. Kaynak kodu MIT lisansıyla <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">GitHub</a> üzerinde yayımlanmıştır ve onu kendi sunucunda barındırmakta özgürsün.',
                },
            ],
        },
        {
            heading: "Hesabın",
            blocks: [
                {
                    type: "p",
                    html: "Servisi kullanmak için en az 16 yaşında olmalısın. Yaşı doğrulamıyoruz; bu yüzden bir hesap oluşturarak bu koşulu karşıladığını onaylıyorsun. Giriş bilgilerini gizli tutmaktan ve hesabın altında gerçekleşen tüm etkinlikten sen sorumlusun. Lütfen gerçekten erişimin olan bir e-posta adresi ver — erişimi kurtarmanın tek yolu o.",
                },
                {
                    type: "p",
                    html: "Servisi yalnızca yapay zekâ sağlayıcının desteklediği ve geçerli yaptırım ve ihracat kontrolü yasalarının izin verdiği yerlerde kullanabilirsin.",
                },
            ],
        },
        {
            heading: "Tıbbi tavsiye değildir",
            blocks: [
                {
                    type: "p",
                    html: "Nutrition MCP bir kayıt ve raporlama aracıdır, bir sağlık hizmeti değildir. Ürettiği hiçbir şey — kalori ve makro değerleri, hedefler, eğilimler ya da yapay zekâ asistanının eklediği herhangi bir yorum — tıbbi, beslenme ya da diyet tavsiyesi değildir ve hiçbiri nitelikli bir uzmanın yerini tutmaz. Sağlığınla ilgili kararlar vermeden önce bir doktora ya da diyetisyene danış; özellikle bir rahatsızlığın ya da yeme bozukluğu geçmişin varsa.",
                },
                {
                    type: "p",
                    html: "Servis klinik kullanım için tasarlanmadı ve aktif bir yeme bozukluğu olan, hamile olan ya da beslenmeyle ilgili bir durum nedeniyle klinik gözetim altında olan hiç kimse tarafından, kendi klinisyeni devrede olmadan kullanılmamalı. Kalori ve makro takibi bu durumlarda zararlı olabilir. Bu senin durumunsa, kullanmadan önce klinisyenine danış.",
                },
                {
                    type: "p",
                    html: "Besin değerleri <strong>tahmindir</strong>. Açıklamalarını ve fotoğraflarını yorumlayan yapay zekâ modellerinden, Open Food Facts gibi üçüncü taraf veritabanlarından ve kendi girdiklerinden gelirler. Yanlış olabilirler. Önemli olan her şeyi doğrula.",
                },
                {
                    type: "p",
                    html: "Yemek fotoğrafları sunucumuza hiçbir zaman gönderilmez. Yapay zekâ asistanın fotoğrafı kendi tarafında yorumlar ve bize yalnızca ortaya çıkan metin ile sayıları gönderir — bir açıklama, bir yemek türü, kalori, makrolar, notlar, bir barkod.",
                },
            ],
        },
        {
            heading: "Kabul edilebilir kullanım",
            blocks: [
                {
                    type: "p",
                    html: "Servisi kullanırken şunları yapmamayı kabul ediyorsun:",
                },
                {
                    type: "ul",
                    items: [
                        "servisi hukuka aykırı herhangi bir amaçla ya da geçerli herhangi bir yasayı veya düzenlemeyi ihlal ederek kullanmak;",
                        "başka bir kullanıcının hesabına ya da verilerine erişmeye veya kimlik doğrulamayı, hız sınırlarını ya da başka herhangi bir teknik denetimi aşmaya çalışmak;",
                        "otomatik toplu istekler de dahil olmak üzere servisi ya da üzerinde çalıştığı altyapıyı yoklamak, taramak, aşırı yüklemek ya da aksatmak;",
                        "hukuka aykırı olan ya da paylaşma hakkına sahip olmadığın içerik yüklemek;",
                        "barındırılan servisi yeniden satmak ya da kendininmiş gibi sunmak;",
                        "servisi aşırı kalori kısıtlaması uygulamak için ya da bunu başkalarına özendirmek, öğretmek veya teşvik etmek için kullanmak.",
                    ],
                },
                {
                    type: "p",
                    html: "Servis, herkes için erişilebilir kalsın diye hız sınırlıdır. Daha yüksek hacme ihtiyacın varsa kendi sunucunda barındır — MIT lisansı tam bunun için var.",
                },
            ],
        },
        {
            heading: "Verilerin",
            blocks: [
                {
                    type: "p",
                    html: 'Kayıtların senin olarak kalır. Servisi senin için işletmek üzere bunları <a href="/privacy" data-legal-link="privacy">Gizlilik Politikası</a> belgemizde anlatıldığı gibi saklıyor ve işliyoruz. Kaydettiğin içerikten sen sorumlusun.',
                },
                {
                    type: "p",
                    html: "Yapay zekâ asistanından dışa aktarmasını isteyerek tüm verilerini dilediğin an dışa aktarabilirsin. Dışa aktarma; yemekler ve malzemeleri, kayıtlı yemekler ve malzemeleri, su, kilo, vücut ölçüleri, hedefler, hedef geçmişi, profil ayarları, hesap kaydı, araç kullanım telemetrisi, bağlı yapay zekâ uygulamaları ve Apple Health eşitlemesi için CSV dosyaları içeren bir ZIP arşividir; alkol takibi açık olsun ya da olmasın alkol dahildir. Geri verdiğimiz indirme bağlantısı özeldir ve 60 dakika sonra sona erer.",
                },
                {
                    type: "p",
                    html: "Apple Health eşitlemesini bağlarsan, günlük toplamların senin isteğinle iPhone cihazındaki Apple Health uygulamasına yazılır. Bir kez oraya girdiklerinde senin elindedirler ve Apple koşullarına tabidirler: bağlantıyı kesmek ya da hesabını silmek onları kaldırmaz ve Apple Health elindeki bir değeri düşüremediği için, sonradan aşağı doğru düzelttiğin bir gün orada düzeltilmez — o girdileri Health uygulamasında kendin sil. Kısayolu yalnızca kendi kullandığın cihazlarda tut: hesabının eşitlemesini kullanmasını sağlayan belirteci taşır ve kısayolun menüsünden bağlantıyı kesmek o belirteci anında sona erdirir.",
                },
                {
                    type: "p",
                    html: "Servisin nasıl kullanıldığına dair temel operasyonel telemetriyi de kaydediyoruz: her araç çağrısı için aracın adını, başarılı olup olmadığını, ne kadar sürdüğünü, başarısız olduğunda kaba bir hata kategorisini, sorduğun tarih aralığının uzunluğunu, oturum kimliğini, yapay zekâ uygulamanın bağlandığı MCP protokol revizyonunu ve bu uygulamanın kendisi için bildirdiği ad ile sürümü. Bu satırlar hesap kimliğinle ilişkilendirilir. Kaydettiğin şeyi içermezler — yemek açıklaması yok, kalori yok, kilo ya da ölçü yok. Bunları servisi çalışır tutmak ve hangi araçları geliştirmeye değdiğini görmek için kullanıyoruz ve hesabını sildiğinde geri kalan her şeyle birlikte silinirler.",
                },
                {
                    type: "p",
                    html: "Bağlı durumdayken yapay zekâ asistanından <strong>hesabını silmesini</strong> isteyerek hesabını ve ilişkili tüm verileri dilediğin an silebilirsin — bu işlem anında ve geri dönüşsüzdür.",
                },
            ],
        },
        {
            heading: "Kullanılabilirlik ve değişiklikler",
            blocks: [
                {
                    type: "p",
                    html: "Servis, çalışma süresi taahhüdü ve hizmet seviyesi sözleşmesi olmaksızın ücretsiz sunulur. Araçlar, özellikler ve barındırılan sunucunun kendisi dahil olmak üzere herhangi bir bölümünü dilediğimiz an ve bildirimde bulunmaksızın değiştirebilir, askıya alabilir ya da sona erdirebiliriz. Bu koşulları ihlal eden içerikleri de değiştirebilir ya da kaldırabiliriz.",
                },
            ],
        },
        {
            heading: "Üçüncü taraf servisler",
            blocks: [
                {
                    type: "p",
                    html: "Servis üçüncü taraflara bağımlıdır: veritabanı, kimlik doğrulama ve dışa aktarma depolaması için Supabase, barındırma için DigitalOcean, her isteğin geçtiği ağ için Cloudflare (barındırma sağlayıcımız aracılığıyla), barkod verileri için Open Food Facts, Apple Health eşitlemesini bağlarsan Apple tarafının Kısayollar ve Health uygulamaları ve bağlandığın yapay zekâ asistanı hangisiyse o.",
                },
                {
                    type: "p",
                    html: 'Barkod ürün verileri &copy; <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer">Open Food Facts</a> katkıcıları, <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noopener noreferrer">Open Database License (ODbL)</a> kapsamında kullanıma açıktır.',
                },
                {
                    type: "p",
                    html: "Web sitesinin kendisi de izninle şunları kullanır: trafiği ve sayfaların nasıl kullanıldığını ölçmek için Google Analytics ve Microsoft Clarity, yazı tiplerini ve simgeleri yüklemek için Google Fonts ve jsDelivr CDN, bu yolla giriş yapmayı seçersen Google Sign-In ve projenin yıldız sayısı için GitHub API — bu sorguyu tarayıcın değil sunucumuz yapar, böylece GitHub tarafına hiçbir ziyaretçi verisi ulaşmaz. Bu nedenle bir sayfanın yüklenmesi Google Fonts ve jsDelivr tarafına istek gönderir; bunlar IP adresini ve tarayıcını görebilir. Google Analytics ve Microsoft Clarity ile ise yalnızca analizi kabul ettikten sonra iletişime geçilir.",
                },
                {
                    type: "p",
                    html: "Koşulları ve kullanılabilirlikleri kendilerine aittir ve bunlardan biz sorumlu değiliz.",
                },
            ],
        },
        {
            heading: "Garanti yoktur",
            blocks: [
                {
                    type: "p",
                    html: "Servis <strong>&ldquo;olduğu gibi&rdquo; ve &ldquo;mevcut olduğu şekilde&rdquo;</strong>, açık ya da zımni hiçbir garanti olmaksızın sunulur; buna satılabilirlik, belirli bir amaca uygunluk, doğruluk ya da ihlal etmeme konusundaki zımni garantiler de dahildir. Servisin kesintisiz, güvenli ya da hatasız olacağını, ürettiği hiçbir verinin ya da besin değerinin doğru olduğunu garanti etmiyoruz. Kullanım riski sana aittir.",
                },
            ],
        },
        {
            heading: "Sorumluluğun sınırlandırılması",
            blocks: [
                {
                    type: "p",
                    html: "Yasaların izin verdiği en geniş ölçüde, servisi kullanmandan kaynaklanan ya da bununla bağlantılı dolaylı, arızi, özel, sonuç olarak ortaya çıkan veya cezai nitelikteki zararlardan ve ayrıca herhangi bir veri ya da kâr kaybından sorumlu değiliz.",
                },
            ],
        },
        {
            heading: "Yasal hakların",
            blocks: [
                {
                    type: "p",
                    html: "Bazı sorumluluklar hiçbir zaman hariç tutulamaz ve biz de bunu denemiyoruz. İhmalimizden kaynaklanan ölüm ya da bedensel zarar ile dolandırıcılık veya hileli beyan konusunda tam sorumluluğumuz sürer.",
                },
                {
                    type: "p",
                    html: "Ayrıca yasaların sana tüketici olarak verdiği her hakkı korursun. Bu koşullar o hakların yanında yer alır ve onları azaltmaz. Yukarıdaki bir bölüm, vazgeçemeyeceğin bir hakla çelişirse, yasal hakkın geçerlidir.",
                },
            ],
        },
        {
            heading: "Sona erdirme",
            blocks: [
                {
                    type: "p",
                    html: "Servisi kullanmayı dilediğin an bırakabilir ve hesabını yukarıda anlatıldığı gibi silebilirsin. Bu koşulları ihlal eden ya da servisin kararlılığını veya güvenliğini tehdit eden erişimi askıya alabilir ya da sona erdirebiliriz. &ldquo;Garanti yoktur&rdquo;, &ldquo;Sorumluluğun sınırlandırılması&rdquo; ve &ldquo;Yasal hakların&rdquo; bölümleri sona erdirmeden sonra da yürürlükte kalır.",
                },
            ],
        },
        {
            heading: "Bu koşullardaki değişiklikler",
            blocks: [
                {
                    type: "p",
                    html: "Bu koşulları zaman zaman güncelleyebiliriz. Güncel sürüm her zaman bu sayfada durur ve üstteki tarih en son ne zaman değiştiğini gösterir. Bir güncellemeden sonra servisi kullanmaya devam etmek, revize edilmiş koşulları kabul ettiğin anlamına gelir.",
                },
            ],
        },
        {
            heading: "Bölünebilirlik",
            blocks: [
                {
                    type: "p",
                    html: "Bu koşulların herhangi bir bölümünün uygulanamaz olduğu tespit edilirse, o bölüm çıkarılır ve geri kalanı yürürlükte kalır.",
                },
            ],
        },
        {
            heading: "İletişim",
            blocks: [
                {
                    type: "p",
                    html: 'Bu koşullar ya da verilerinle ilgili sorular? <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a> adresine e-posta gönder.',
                },
            ],
        },
    ],
};
