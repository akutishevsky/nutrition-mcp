// Turkish (tr) translation of the /alternatives comparison pages' prose.
// See src/copy/alternatives.ts for AppSlug / AppCopy / AltPageMeta and the
// accuracy rules in scripts/gen-alternatives.ts's APPS array (which app
// names are recognised by column name, which need manual mapping,
// Cronometer's caffeine column, etc.) that still apply to this content.
// App names are brand names and are never translated, inflected or given a
// Turkish apostrophe suffix — see the note in scripts/depersonalize.ts.

import type { AppCopy, AppSlug, AltPageMeta } from "./alternatives.js";

export const ALT_PAGE_META_TR: AltPageMeta = {
    appTitle: "{app} MCP sunucusu? Claude ve ChatGPT içinde beslenme takibi",
    appDesc:
        "{app} için resmî MCP sunucusu yok mu? Nutrition MCP, yemekleri ve makroları Claude veya ChatGPT içinde kaydeder — ücretsiz, açık kaynak ve CSV dışa aktarma dosyanı içe aktarır.",
    appOgDesc:
        "{app} için resmî bir MCP sunucusu yok. Nutrition MCP; yemekleri, makroları ve kiloyu Claude veya ChatGPT içinde kaydeden ücretsiz ve açık kaynak bir alternatif — {app} geçmişini de bir CSV dışa aktarma dosyasından içe aktarır.",
    hubTitle: "Claude ve ChatGPT içinde MyFitnessPal ve Cronometer alternatifi",
    hubDesc:
        "MyFitnessPal, Cronometer ve Lose It! için resmî MCP sunucusu yok. Nutrition MCP; Claude ve ChatGPT için ücretsiz, açık kaynak bir alternatif, CSV içe aktarma ile.",
    hubOgDesc:
        "Beslenme uygulamanın resmî bir MCP sunucusu yok. Nutrition MCP, Claude veya ChatGPT içinde çalışan ücretsiz ve açık kaynak bir alternatif — geçmişini de bir CSV dışa aktarma dosyasından içe aktarır.",
};

export const ALTERNATIVES_TR: Record<AppSlug, AppCopy> = {
    "myfitnesspal-mcp": {
        hubBlurb:
            "Resmî MCP sunucusu yok ve bazı özellikler için ücretli bir plan gerekiyor. Sohbet ederek kullandığın ücretsiz alternatife bak.",
        cons: [
            "Resmî MCP sunucusu yok — günlüğünü Claude veya ChatGPT içinden kaydedemezsin",
            "Her öğe için veritabanında arama yapıp doğru kaydı seçmek",
            "Barkod tarayıcı gibi bazı özellikler için ücretli bir plan gerekiyor",
            "Ayrı bir uygulama ve hesap, ücretsiz sürümde reklamlarla",
        ],
        note: "MyFitnessPal, kocaman bir besin veritabanına sahip yetenekli bir uygulama. Bu bir eleştiri değil — sadece bir takip uygulamasında dokunup durmak yerine yapay zekâsıyla konuşmayı tercih edenler için farklı bir yaklaşım.",
        migrate: {
            title: "Veritabanını arkanda bırakmak",
            body: [
                "MyFitnessPal kullanıcı kitlesini dünyanın en büyük besin veritabanlarından biriyle kurdu — kullanıcıların girdiği on milyonlarca kayıt. Bu ölçek aynı zamanda onun zorluğu: herhangi bir besin için neredeyse birbirinin aynısı kayıtlar arasında kaydırıp hangisinin doğru olduğunu tahmin etmen gerekiyor. Sohbet ederek kaydetmek karşılaştırma adımını atlar — besini anlatırsın; genel besinler USDA FoodData Central değerlerini alır, eşleşme yoksa tahminler devreye girer.",
                "Bunu yapmak için günlüğünü geride bırakmak zorunda değilsin: MyFitnessPal CSV dışa aktarma dosyası, tüm tuhaflıklarıyla birlikte doğrudan içe aktarılır, yani yıllardır kaydettiklerin seninle gelir. Ondan sonra kaydettiğin her şeyi de istediğin zaman CSV olarak dışa aktarabilirsin.",
                "MyFitnessPal uygulamasının zamanla Premium arkasına taşıdığı özellikler — barkod tarama, gram cinsinden makrolar, reklamsız kullanım — burada zaten var. Ücretsiz bir sürümü ayda $20 olan bir yükseltmeyle karşılaştırmıyorsun; tek bir ücretsiz, açık kaynak sürüm var ve kurduğun tek yeni şey, ilk bağlandığında yapacağın ücretsiz bir giriş.",
            ],
        },
        importSection: {
            title: "MyFitnessPal günlüğünü CSV dosyasından içe aktar",
            body: [
                "İnsanların kalmasının gerçek nedeni yıllara yayılmış kayıt geçmişi ve bunu bırakmak zorunda değilsin. İçe aktarmayı istediğinde sohbette bir içe aktarma paneli açılır: MyFitnessPal uygulamasının verdiği CSV dosyasını seçersin, dosya tarayıcında ayrıştırılır, tanıdığı sütunlar senin için eşleştirilir ve hiçbir şey yazılmadan önce neyin ekleneceğini görürsün. Bu eşleştirme kalori, protein, karbonhidrat ve yağı, ayrıca dışa aktardığın dosyada bu sütunlar varsa lif, toplam şeker ve miligram cinsinden kafeini kapsar. Satırlar hiçbir zaman yapay zekânın içinden geçmez, yani onun yanlış yazabileceği bir şey olmaz.",
                "MyFitnessPal dışa aktarma dosyası adıyla tanınır, tuhaflıkları dahil. Dosya, aksi halde ilk sütun başlığını bozacak bir bayt sırası işaretiyle gelir; notları, tırnak içindeki bir hücrenin içinde satır sonu taşıyabilir ve satır satır ayıran basit bir yaklaşım bunu, sonrasındaki bütün satırlarla birlikte parçalara ayırır; her günün bloğu da yemek olmaması gereken bir toplam satırıyla biter. En önemlisi şu: MyFitnessPal her gün için her öğünü tek bir toplu satır olarak dışa aktarır ve besin adı sütunu hiç yoktur; içe aktarıcı da bu satırları açıklaması yok diye reddetmek yerine bu yapıyı tanır ve onları öğünlerine göre etiketler — “Breakfast (imported from MyFitnessPal)” olarak gelirler.",
                "Tarihler varsayılmaz, onaylanır. 05/06/2024 içeren bir sütun gerçekten belirsizdir — mayıs mı, haziran mı — bu yüzden içe aktarıcı kendi okumasını senin dosyandan gerçek bir satırın yanında gösterir ve yazmadan önce düzeltmene izin verir. Ayrıca her satır bir içerik parmak izi taşır; aynı dosyayı tekrar çalıştırdığında, arada saat dilimin değişmediği sürece o yemekler ikinci kez eklenmek yerine zaten kaydedilmiş olarak bildirilir. Eksik bir dışa aktarma dosyasını içe aktar, yanlış eşleştirdiğin bir sütunu fark et ve işlemi yeniden yap.",
            ],
        },
        importFaq:
            "Evet. Geçmişini içe aktarmayı istediğinde sohbette bir içe aktarıcı açılır: MyFitnessPal uygulamasının verdiği CSV dosyasını seçersin, dosya yapay zekâ tarafından okunmak yerine tarayıcında ayrıştırılır, sütunları eşleştirir ya da eşleşmeyi onaylarsın, neyin ekleneceğini önizler ve onaylarsın. Kalori, protein, karbonhidrat ve yağ gelir; dosyanda varsa lif, toplam şeker, kafein, doymuş yağ ve trans yağ da gelir. MyFitnessPal dışa aktarma dosyası adıyla tanınır — bayt sırası işareti, sonundaki toplam satırları ve her gün için her öğünü besin adı olmadan tek bir toplu satır olarak yazması dahil; o satırlar öğünlerine göre etiketlenir. Aynı dosyayı yeniden içe aktarmak, arada saat dilimin değişmediği sürece hiçbir kopya oluşturmaz.",
        extraFaqs: [
            {
                q: "Nutrition MCP, MyFitnessPal Premium gibi barkod tarayabiliyor mu?",
                a: "Evet ve ücretsiz. Bir ürünün barkodunu gönder, Nutrition MCP etiket makrolarını Open Food Facts üzerinden çeker — MyFitnessPal ise barkod tarayıcısını ücretli Premium aboneliğin arkasına taşıdı.",
            },
            {
                q: "MyFitnessPal besin veritabanı olmadan kaydetmek nasıl işliyor?",
                a: "Ne yediğini sade bir dille anlatırsın — “bol pirinçli bir tavuklu burrito kâsesi” — ve yapay zekân bunu kaydeder; genel besinler USDA FoodData Central değerlerini alır, eşleşme yoksa tahminler devreye girer. Arayıp duracağın, kullanıcıların girdiği milyonlarca kayıttan oluşan bir veritabanı yok ve hangisinin doğru olduğunu tahmin etmek de yok.",
            },
        ],
    },
    "cronometer-mcp": {
        hubBlurb:
            "Resmî MCP sunucusu yok. Kalori ve makroları yapay zekânın içinde, sohbet ederek takip etmenin ücretsiz yoluna bak.",
        cons: [
            "Resmî MCP sunucusu yok — günlüğünü Claude veya ChatGPT içinden kaydedemezsin",
            "Veritabanında arayarak, kayıt kayıt kaydetmek",
            "Bazı özellikler ücretli Gold planı gerektiriyor",
            "Her yemekte açman gereken ayrı bir uygulama",
        ],
        note: "Mikro besin düzeyinde derin bir hassasiyet istiyorsan Cronometer mükemmel. Nutrition MCP ise kalori, makro ve kilo için daha hafif, sohbete dayalı bir yaklaşım benimser — doğrudan yapay zekânın içinde.",
        migrate: {
            title: "Doğruluk işin tamamıysa",
            body: [
                "Cronometer itibarını hassasiyetle kazandı — özenle derlenmiş veritabanları ve vitaminler ile mineraller dahil 80+ mikro besin için takip. Uygulamayı o mikro besin derinliği için açıyorsan kendine karşı dürüst ol: sohbete dayalı tahminler, laboratuvar düzeyinde bir veritabanı kaydıyla gram gram örtüşmez.",
                "Ama insanların çoğu selenyum alımını denetlemek için değil, kalori ve makroları aralıkta tutmak için kaydeder. Bu aralık kulağa geldiğinden geniştir: protein, karbonhidrat ve yağın yanında lif, toplam şeker ve miligram cinsinden kafein var, açarsan da gram etanol cinsinden isteğe bağlı alkol. Bunun için bir yemeği yapay zekâna anlatmak, her bileşeni arayıp tartmaktan çok daha az iş — üstelik günlük toplamları, eğilimleri ve karşısında takip edebileceğin bir hedef kiloyu ücretsiz almaya devam ediyorsun.",
                "Bir de orta yol var: zaten bir yapay zekâ asistanının içinde olduğun için, mikro besin tarafını gerçekten istediğinde sorabilirsin — “bugünkü yemeklerde yaklaşık ne kadar demir ve B12 vardı?” — ve geri kalan zamanda her gramı özenle derlenmiş bir kayda işlemek zorunda kalmadan, istediğin anda gerekçeli bir tahmin alırsın.",
            ],
        },
        importSection: {
            title: "On yıllık kayıtlar yerinde kalır",
            body: [
                "Cronometer uygulamasını hassasiyet için kullandın; özensiz bir içe aktarma hiç yapmamaktan kötü olurdu. İçe aktarmayı istediğinde sohbette bir panel açılır: Cronometer CSV dosyanı seçersin, dosya tarayıcında ayrıştırılır ve tek bir satır yazılmadan önce bir önizlemeyi onaylarsın. Sayılar doğrudan dosyadan okunur — yapay zekâ satırları hiç görmez, yani birini yuvarlayamaz ya da yeniden yazamaz.",
                "Cronometer dışa aktarma dosyasının yapısı adıyla tanınır. Zaman damgasını ayrı tarih ve saat sütunlarına böler ve ikisi de okunur; böylece 07:12'de kaydedilen bir kahvaltı, varsayılan öğle saatine düşmek yerine kendi saatini korur. Miktarı birimiyle aynı hücrede yazar — “58.00 g”, “1.00 cup” — ve böyle yazılmış bir değer hiçlik olarak değil, olduğu sayı olarak okunur. Ayrıca “Amount” başlığını birden fazla kez yazar; bu yüzden sütunlar ada göre değil konuma göre anahtarlanır: kopyalar sessizce çakışamaz ve eşleştirici hangisini gösterdiğini sana söyler.",
                "Neyin geçtiği konusunda net olalım: tarih ve saat, besin adı, öğün, kalori, protein, karbonhidrat, yağ, lif, toplam şeker, kafein ve notlar. Bu listede Caffeine (mg) sütunu gönderen tek dışa aktarma dosyası Cronometer dosyasıdır ve bu veri miligram olarak gelir — hâlihazırda bulunduğu birim ve kafeinin burada saklandığı birim olduğu için hiçbir şey dönüştürülmez. Gram cinsinden başlıklanmış bir kafein sütunu ise, etikette 180 mg yazarken 0.18 kaydetmek yerine, nedeni gösterilerek eşleştirilmeden bırakılır. Şeker, meyve ve süt dahil toplam şeker anlamına gelir — hiçbir dışa aktarma dosyasının güvenilir biçimde taşımadığı ilave şeker değil. Cronometer uygulamasının ayrı “Sugar Alcohols” sütunu bir şeker ya da etanol değil, bir poliol; iki alandan hiçbirine girmez. Alkol özel bir durum: Cronometer onu gram cinsinden etil alkol olarak dışa aktarır ve ancak burada alkol takibini önceden açtıysan gelir, çünkü sen açana kadar kapalıdır. Porsiyon miktarları ve Cronometer uygulamasının 80'i aşkın vitamin ve minerali hiç gelmez — o mikro besin derinliği Cronometer tarafındaki dışa aktarma dosyasında kalır. Yeniden içe aktarmak zararsızdır: her satır bir içerik parmak izi taşır, bu yüzden aynı dosyanın ikinci kez çalıştırılması, arada saat dilimin değişmediği sürece yemekleri iki kez eklemek yerine zaten kaydedilmiş olarak bildirir.",
            ],
        },
        importFaq:
            "Evet. İçe aktarmayı istediğinde sohbette bir içe aktarıcı açılır: Cronometer CSV dosyanı seçersin, dosya yapay zekâ tarafından okunmak yerine tarayıcında ayrıştırılır ve onaylamadan önce neyin ekleneceğini önizlersin. Cronometer dışa aktarma dosyası adıyla tanınır — ayrı tarih ve saat sütunlarının ikisi de okunur ve tekrarlanan “Amount” başlığı, sütunlar konuma göre anahtarlandığı için çakışamaz. Tarih ve saat, besin adı, öğün, kalori, protein, karbonhidrat, yağ, lif, toplam şeker, miligram cinsinden kafein, doymuş yağ ve trans yağ (Saturated ve Trans-Fats sütunları) ve notlar gelir; alkol da gelir ama ancak alkol takibini önceden açtıysan. Vitaminler, mineraller ve porsiyon miktarları gelmez. Aynı dosyayı yeniden içe aktarmak, arada saat dilimin değişmediği sürece hiçbir kopya oluşturmaz.",
        extraFaqs: [
            {
                q: "Nutrition MCP, Cronometer gibi mikro besinleri takip ediyor mu?",
                a: "Hayır. Cronometer uygulamasının 80+ vitamin ve minerali takip etmesi onun uzmanlık alanı ve Nutrition MCP içinde hiç mikro besin verisi yok — ne sodyum ne vitamin. Takip ettiği şeyler kalori, protein, karbonhidrat, yağ, lif, toplam şeker, miligram cinsinden kafein, doymuş yağ ve trans yağ, isteğe bağlı alkol, su ve kilo. Bir yemek için yapay zekândan kabaca bir mikro besin okuması isteyebilirsin, ama laboratuvar düzeyinde mikro besin derinliği şartsa Cronometer daha uygun.",
            },
            {
                q: "Nutrition MCP, Cronometer kadar doğru mu?",
                a: "Hayır. Sohbete dayalı değerler Cronometer tarafındaki özenle derlenmiş, gram gram veritabanıyla örtüşmez. Genel besinlerde USDA FoodData Central değerleri eşleşme varsa kullanılır, yoksa tahminler devreye girer; paketli gıdalarda bir barkod sorgusu Open Food Facts üzerindeki etiket verisini kullanır. Bu kaynaklar da yanılabilir ve her rakamın kaynağı yanında gösterilir, bu yüzden önemli olan her şeyi doğrula. Takas ettiğin şey, çok daha az kayıt zahmeti karşılığında bir miktar hassasiyet.",
            },
        ],
    },
    "lose-it-mcp": {
        hubBlurb:
            "Resmî MCP sunucusu yok. Bunun yerine Claude veya ChatGPT ile konuşarak yemek kaydet — ücretsiz.",
        cons: [
            "Resmî MCP sunucusu yok — günlüğünü Claude veya ChatGPT içinden kaydedemezsin",
            "Her öğeyi elle arayıp kaydetmek",
            "Sınırsız Snap It fotoğrafla kayıt gibi bazı özellikler için ücretli bir plan gerekiyor",
            "Bir uygulama daha, bir hesap daha, ücretsiz sürümde reklamlar",
        ],
        note: "Lose It! sıcak yüzlü bir kalori sayacı. Nutrition MCP aynı temel kaydı sohbet ederek, ücretsiz ve hiç Claude veya ChatGPT dışına çıkmadan yapar.",
        migrate: {
            title: "Aynı basitlik, uygulama olmadan",
            body: [
                "Lose It! kalori saymayı hafif ve biraz oyunlaştırılmış tutarak insanları kazandı; en öne çıkan numarası da Snap It fotoğrafla kayıt oldu. Nutrition MCP de fotoğraf numarasını yapar — tabağının fotoğrafını gönder, yapay zekân okur — ama bunu zaten sohbet ettiğin asistanın içinde yapar, yani açılacak ayrı bir uygulama yok.",
                "Lose It! tarafında sevdiğin şey az zahmetli kayıt ve hızlı günlük geri bildirimse, burada kendini evinde hissedeceksin: ne yediğini söyle, kalan kalorilerini ve makrolarını geri al ve yoluna devam et. Reklam yok, üst sürüm satışı yok.",
                "Vazgeçtiğin tek şey, Lose It! uygulamasının seni geri getirmek için kullandığı seri ve rozet katmanı. Seni motive eden şey bu oyunlaştırmaysa, kalmak için geçerli bir neden. Asıl kaydın üstüne eklenmiş bir gürültü gibi geliyorduysa, onu özlemeyeceksin — günlük sayı, sorduğun anda sohbetin içinde.",
            ],
        },
        importSection: {
            title: "Kaydettiğin günler de seninle gelir",
            body: [
                "Geçiş yapmak sıfırdan başlamak demek değil. İçe aktarmayı istediğinde sohbette bir içe aktarıcı açılır: Lose It! uygulamasının verdiği CSV dosyasını seçersin, dosya tarayıcında ayrıştırılır, tanınan sütunlar kendiliğinden eşleşir — tarih, besin, öğün, kalori, protein, karbonhidrat ve yağ; dosyanda varsa lif, toplam şeker ve kafein de — ve neyin ekleneceğinin önizlemesini onaylarsın. Bu bir dosya seçici ve bir önizleme, dikte alıştırması değil — bu yolda yapay zekâ satırlarını ne okur ne de yeniden yazar.",
                "Lose It! tarafına özgü iki şey bilerek ele alınır. Dışa aktarma dosyası bir silinmiş işareti taşır ve silinmiş olarak işaretlenen satırlar içe aktarılmaz, atlanır: onları geri getirmek, bilerek kaldırdığın yemekleri diriltirdi ve önizlemedeki hiçbir toplam bunu göstermezdi. Ayrıca değeri olmayan hücrelere birebir “n/a” metnini yazar; bu da sıfır olarak değil, boş olarak okunur — böylece hiç takip etmediğin bir makro, gerçek bir 0 g olarak kaydedilip ortalamalarını aşağı çekmek yerine yok sayılır.",
                "İstediğin kadar çalıştır. Her satır bir içerik parmak izi taşır; aynı dosyayı tekrar içe aktardığında, arada saat dilimin değişmediği sürece yemekler zaten kaydedilmiş olarak bildirilir ve hiçbir şey eklenmez. Dışa aktarma dosyandaki tarihler iki şekilde okunabiliyorsa — 05/06 mayıs da haziran da olabilir — içe aktarıcı kendi okumasını senin dosyandan bir satırla yan yana gösterir ve yazmadan önce onaylamanı ister.",
            ],
        },
        importFaq:
            "Evet. İçe aktarmayı istediğinde sohbette bir içe aktarıcı açılır: Lose It! uygulamasının verdiği CSV dosyasını seçersin, dosya yapay zekâ tarafından okunmak yerine tarayıcında ayrıştırılır ve hiçbir şey yazılmadan önce bir önizlemeyi onaylarsın. Tarih, besin, öğün, kalori, protein, karbonhidrat ve yağ kendiliğinden eşleşir; dosyanda varsa lif, toplam şeker ve kafein de eşleşir. Lose It! dışa aktarma dosyası adıyla tanınır — silinmiş olarak işaretlenen satırlar diriltilmek yerine atlanır ve “n/a” hücreleri sıfır değil, boş olarak okunur. Aynı dosyayı yeniden içe aktarmak, arada saat dilimin değişmediği sürece hiçbir kopya oluşturmaz.",
        extraFaqs: [
            {
                q: "Nutrition MCP içinde Lose It! tarafındaki Snap It gibi fotoğrafla kayıt var mı?",
                a: "Evet — tabağının fotoğrafını gönder, yapay zekân yemeği tanır, makroları tahmin eder ve ayrıntıları onayladığında kaydeder. Lose It! ücretsiz planında Snap It kullanımını sınırlar ve sınırsız kullanımı Premium ile açar; Nutrition MCP içinde fotoğrafla kayıt hiç ek ücret istemez ve görüntü okuyabilen her yapay zekâ uygulamasında, doğrudan sohbette çalışır.",
            },
            {
                q: "Kalorileri Lose It! içinde yaptığım gibi sayabilir miyim?",
                a: "Evet. Temel döngü aynı — ne yediğini söyle, kalan kalorilerini ve makrolarını anında geri al. Fark, bir uygulamada dokunup durmak yerine yapay zekânla konuşman ve yol boyunca hiç reklam ya da üst sürüm satışı olmaması.",
            },
        ],
    },
    "macrofactor-mcp": {
        hubBlurb:
            "Yalnızca abonelikle ve resmî MCP sunucusu yok. Yapay zekânın içinde yaşayan ücretsiz alternatife bak.",
        cons: [
            "Resmî MCP sunucusu yok — günlüğünü Claude veya ChatGPT içinden kaydedemezsin",
            "Ücretsiz denemeden sonra ücretli abonelik (ücretsiz sürüm yok)",
            "Her yemeği kaydetmek için yine ayrı bir uygulama açıyorsun",
            "Ürün, zahmetsiz kayıt değil, uyarlanabilir koçluk",
        ],
        note: "MacroFactor tarafındaki uyarlanabilir TDEE koçluğu gerçekten iyi. Asıl istediğin şey yapay zekânın içinde hızlı ve ücretsiz makro kaydıysa, Nutrition MCP daha basit ve bedelsiz bir seçenek.",
        migrate: {
            title: "Koçluğa karşı kayıt",
            body: [
                "MacroFactor uygulamasının vaadi algoritması: kaydettiğin alımı ve kiloyu izleyip kalori ve makro hedeflerini her hafta sessizce yeniden hesaplar — Stronger By Science ekibinden gerçekten akıllı, uyarlanabilir bir koçluk. Ürün o koçluk; bu yüzden de yalnızca abonelikle sunuluyor.",
                "Nutrition MCP bir koçluk algoritması çalıştırmaz — ama zaten bir yapay zekâ asistanının içinde olduğun için sadece sorabilirsin. “Son üç haftama bakınca kalorilerimi ayarlamalı mıyım?” sorusu, kendi kaydettiğin sayıların yapay zekân tarafından istediğin anda yapılmış bir okumasını verir — tartman için bir tahmin, beslenme tavsiyesi değil. Bu farklı bir model: sabit bir haftalık yeniden hesaplama yerine, istediğinde sohbet ederek analiz — ve ücretsiz.",
                "Dürüst takas, disipline karşı esneklik. MacroFactor tarafındaki haftalık yeniden hesaplama, sen sormayı akıl etsen de etmesen de olur ve bu seni dürüst tutar; sohbete dayalı modelde ayarlama ancak sen istediğinde yapılır. Sayılarını yönlendiren, eline bakmayan bir algoritma istiyorsan MacroFactor aboneliğe değer. Ücretsiz kaydetmeyi ve önemsediğinde analiz çekmeyi tercih ediyorsan, bu daha iyi oturur.",
            ],
        },
        importSection: {
            title: "Koçluk gelmese de kayıt gelir",
            body: [
                "Geride bırakacağın şey veri değil, algoritma. İçe aktarmayı istediğinde sohbette bir içe aktarma paneli açılır: MacroFactor CSV dışa aktarma dosyanı seçersin, dosya tarayıcında ayrıştırılır, tanınan sütunlar senin için eşleştirilir ve hiçbir şey yazılmadan önce bir önizlemeyi onaylarsın. Satırlar hiçbir zaman yapay zekânın içinden geçmez, yani yolda hiçbir şey yanlış aktarılmaz.",
                "MacroFactor dışa aktarma dosyası adıyla tanınır — porsiyon boyutu sütunu ele veriyor — ve tarih, besin, öğün, kalori ve makro sütunları kendiliğinden eşleşir; dosyada varsa lif, toplam şeker ve kafein de dahil. Dışa aktarma dosyan enerjiyi kilokalori yerine kilojul olarak veriyorsa, 4.184 kat fazla saklanmak yerine dönüştürülür. Sadece “Calories” diye başlıklanmış bir sütun iki birimden birini taşıyabildiği için birim, kendi ilk satırından alınmış işlenmiş bir örneğin yanında bir denetim olarak sunulur; böylece her günü sessizce şişirecek bir tahmine güvenmek yerine onu onaylarsın.",
                "O geçmiş sadece arşivlenmekle kalmaz, hemen işe yarar. Haftalarca alım ve kilo verisi girdikten sonra, MacroFactor algoritmasının belirli aralıklarla yanıtladığı soruyu sorabilirsin — “son üç haftaya bakınca kalorilerimi ayarlamalı mıyım?” — ve kendi sayılarının yapay zekân tarafından istediğin anda yapılmış bir okumasını alırsın; bir tahmin, beslenme tavsiyesi değil. Aynı dosyayı ikinci kez içe aktarmak hiçbir şeyi değiştirmez, çünkü her satır bir içerik parmak izi taşır ve tekrarlar, arada saat dilimin değişmediği sürece zaten kaydedilmiş olarak bildirilir.",
            ],
        },
        importFaq:
            "Evet. İçe aktarmayı istediğinde sohbette bir içe aktarıcı açılır: MacroFactor CSV dışa aktarma dosyanı seçersin, dosya yapay zekâ tarafından okunmak yerine tarayıcında ayrıştırılır ve hiçbir şey yazılmadan önce bir önizlemeyi onaylarsın. MacroFactor dışa aktarma dosyası adıyla tanınır — tarih, besin, öğün, kalori, protein, karbonhidrat ve yağ kendiliğinden eşleşir; dosyada varsa lif, toplam şeker ve kafein de — ve enerji kilojul olarak verildiyse, kendi dosyandan bir örneğin yanında birimi onayladığında kilokaloriye dönüştürülür. Aynı dosyayı yeniden içe aktarmak, arada saat dilimin değişmediği sürece hiçbir kopya oluşturmaz.",
        extraFaqs: [
            {
                q: "Nutrition MCP, MacroFactor gibi kalori hedeflerimi ayarlıyor mu?",
                a: "Otomatik olarak hayır. MacroFactor tarafındaki haftalık, algoritmik yeniden hesaplama onun ücretli temel özelliği. Nutrition MCP içinde sen sorarsın — “son üç haftadaki alımıma ve kiloma göre kalorilerimi ayarlamalı mıyım?” — ve yapay zekân sabit bir haftalık güncelleme yerine, istediğin anda bunu akıl yürüterek yanıtlar.",
            },
            {
                q: "MacroFactor yalnızca abonelikle sunulurken Nutrition MCP gerçekten ücretsiz mi?",
                a: "Evet. Nutrition MCP tamamen ücretsiz ve açık kaynak; önce deneme sonra ödeme yok, ücretsiz sürüm sınırları yok — ücretsiz sürümü olmayan ve denemesinden sonra abonelik gerektiren MacroFactor uygulamasının tersine. MCP destekleyen bir yapay zekâ uygulamasına, örneğin Claude veya ChatGPT, ve ilk bağlandığında Google ile ya da bir e-posta ve şifreyle oluşturduğun ücretsiz bir Nutrition MCP hesabına ihtiyacın var.",
            },
        ],
        freeAnswer:
            "Evet. Nutrition MCP tamamen ücretsiz ve açık kaynak, abonelik yok — MacroFactor ise ücretsiz denemesinden sonra ücretli bir abonelik gerektiriyor. MCP destekleyen bir yapay zekâ uygulamasına, örneğin Claude veya ChatGPT, ve ilk bağlandığında Google ile ya da bir e-posta ve şifreyle oluşturduğun ücretsiz bir Nutrition MCP hesabına ihtiyacın var.",
    },
    "yazio-mcp": {
        hubBlurb:
            "Resmî MCP sunucusu yok. Yemekleri ve makroları sohbet ederek takip et — ücretsiz ve açık kaynak.",
        cons: [
            "Resmî MCP sunucusu yok — günlüğünü Claude veya ChatGPT içinden kaydedemezsin",
            "Kaydettiğin her besin için veritabanında arama yapmak",
            "Yemek planları gibi bazı özellikler için ücretli PRO planı gerekiyor",
            "Yönetmen gereken ayrı bir uygulama ve hesap",
        ],
        note: "Yazio, iyi yemek planlarına sahip, cilalanmış bir takip uygulaması. Nutrition MCP ise Claude veya ChatGPT içinde yaşayan, sohbete dayalı zahmetsiz kayda odaklanır — ücretsiz ve açık kaynak.",
        migrate: {
            title: "Bir yanda planlar, diğer yanda kayıt",
            body: [
                "Yazio, takibi yapılandırılmış yemek planları, tarifler ve oruç araçlarıyla birleştiriyor; Avrupa kitlesi için cilalanmış. Seni yolda tutan şey rehberli bir planysa, Yazio bunu iyi yapıyor ve Nutrition MCP bunu denemiyor bile — bir yemek planı uygulaması değil.",
                "Yaptığı şey, işin kayıt yarısını zahmetsiz kılmak. Her malzeme için Yazio veritabanında arama yapmak yerine yemeği anlatırsın, makroları yapay zekân üstlenir — ve aynı nefeste “bugün nasıl gidiyorum?” sorusunu da yanıtlar. Zaten uyguladığın hangi beslenme planı varsa onunla birlikte kullan.",
                "Bu, aslında ikisini rakip değil birbirini tamamlayan hâle getiriyor. “Ne yemeli” tarafı için bir Yazio planını ya da herhangi bir planı uygulamaya devam et; “planda kaldım mı” tarafı için Nutrition MCP kullan — sohbet ederek kaydedilen ve ücretsiz. Yardımcı olmayacağı tek yer oruç zamanlayıcıları; o Yazio tarafının alanı, bir yemek kaydının değil.",
            ],
        },
        importSection: {
            title: "Kaydı getir, sütunları eşleştir",
            body: [
                "Yazio geçmişin gelebilir, ama işin bir kısmını sen yapacaksın. İçe aktarmayı istediğinde sohbette bir içe aktarma paneli açılır: CSV dışa aktarma dosyanı seçersin, dosya tarayıcında ayrıştırılır ve sütunlarını tarih, besin, öğün, kalori, protein, karbonhidrat, yağ, lif, toplam şeker ve kafeine kendin yönlendirirsin. Dört uygulamanın dışa aktarma dosyası — MyFitnessPal, Cronometer, Lose It! ve MacroFactor — sütun adlarından tanınır; Yazio bunlardan biri değil, yani bu eşleştirmeyi bir kez yapmayı bekle. Sonrasındaki her şey aynı: neyin ekleneceğinin önizlemesi, sonra senin onayın.",
                "Çoğu içe aktarıcıyı yenen Avrupa'ya özgü tuhaflıklar ele alınıyor. Noktalı virgülle ayrılmış ve sayılarında ondalık ayırıcı olarak virgül kullanan bir dosya — Excel tarafından Almanca veya Avusturya yerel ayarında üretilen biçim — ayırıcı ondalık nokta sanılmadan ya da her makro binle çarpılmadan doğru okunur. Eşleştiricinin bildiği başlıklar da yalnızca İngilizce değil: bir Almanca dışa aktarma dosyasındaki Datum, Kalorien, Eiweiss, Kohlenhydrate, Ballaststoffe, Zucker ve Koffein başlıklarının hepsi tanınır; lif, şeker ve kafein ayrıca İspanyolca, Fransızca, İtalyanca ve Hollandaca olarak da eşleşir — fibra, sucres, zuccheri, suikers, cafeína, caffeina — yani yerelleştirilmiş bir dosya genellikle kısmen eşleşmiş gelir ve elle ayarlayacağın sütun sayısı azalır. Tırnak içindeki alanlar, hücre içindeki satır sonları, neredeyse boş değerler ve başıboş toplam satırları da ele alınır ve yapay zekâ dosyayı hiç okumaz, yani aktarım sırasında hiçbir sayı yanlış yazılamaz.",
                "Tarihler ve enerji tahmin edilmez, onaylanır. GG/AA/YYYY biçimindeki bir sütun gün önce gelecek şekilde okunur ve değerler gerçekten karar vermeye yetmediğinde — 05/06 mayıs da haziran da olabilir — içe aktarıcı kendi okumasını senin dosyandan bir satırın yanında gösterir, böylece düzeltebilirsin. Enerji sütunu kilojul cinsindeyse kilokaloriye dönüştürülür ve birim, işlenmiş bir örneğin yanında bir denetim olarak gösterilir. Aynı dosyayı yeniden içe aktarmak hiçbir şey eklemez: her satır bir içerik parmak izi taşır, bu yüzden tekrarlar, arada saat dilimin değişmediği sürece zaten kaydedilmiş olarak geri döner.",
            ],
        },
        importFaq:
            "Evet, elle sütun eşleştirmeyle. İçe aktarmayı istediğinde sohbette bir içe aktarıcı açılır: Yazio CSV dışa aktarma dosyanı seçersin, dosya yapay zekâ tarafından okunmak yerine tarayıcında ayrıştırılır ve sütunlarını tarih, besin, öğün, kalori ve makrolara — lif, toplam şeker ve kafein de aralarında — kendin yönlendirirsin. Yazio, sütun adından tanınan dört dışa aktarma dosyasından biri değil, yani bu eşleştirme tek seferlik elle bir adım; gerçi eşleştiricinin bildiği başlıklar (Almanca olanlar ve lif, şeker, kafein için İspanyolca, Fransızca, İtalyanca ve Hollandaca olanlar) kendiliğinden dolar. Noktalı virgülle ayrılmış, ondalık ayırıcı olarak virgül kullanan Avrupa dosyaları, GG/AA/YYYY tarihleri ve kilojul birimi ele alınır ve aynı dosyayı yeniden içe aktarmak, arada saat dilimin değişmediği sürece hiçbir kopya oluşturmaz.",
        extraFaqs: [
            {
                q: "Nutrition MCP içinde Yazio PRO gibi yemek planları var mı?",
                a: "Hayır. Yazio tarafındaki yapılandırılmış yemek planları, tarifler ve oruç araçları onun güçlü yanı ve Nutrition MCP onları değiştirmeye çalışmıyor — işin kayıt yarısını üstleniyor. Çoğu kişi Yazio planını (ya da herhangi bir planı) uygulamaya devam ediyor ve burada ücretsiz olarak ona göre kayıt tutuyor.",
            },
            {
                q: "Yemekleri Yazio veritabanında aramaktan daha hızlı kaydedebilir miyim?",
                a: "Genellikle evet. Her malzeme için Yazio veritabanında arayıp porsiyon ayarlamak yerine, bitmiş yemeği bir kez anlatırsın — “yoğurtlu ve meyveli bir kâse müsli” — ve yapay zekân makroları tek adımda kaydeder; genel besinlerde USDA değerleri, eşleşme yoksa tahminler kullanılır.",
            },
        ],
    },
    "lifesum-mcp": {
        hubBlurb:
            "Resmî MCP sunucusu yok. Claude veya ChatGPT içinde yemek kaydetmenin daha yalın, ücretsiz bir yolu.",
        cons: [
            "Resmî MCP sunucusu yok — günlüğünü Claude veya ChatGPT içinden kaydedemezsin",
            "Besinleri veritabanında tek tek arayarak kaydetmek",
            "Diyet planları gibi bazı özellikler için ücretli bir plan gerekiyor",
            "Yönetmen gereken bir uygulama ve abonelik daha",
        ],
        note: "Lifesum, takibi yapılandırılmış diyet planlarıyla birleştiriyor. Nutrition MCP ise kaloriyi, makroları ve kiloyu yapay zekânla konuşarak kaydetmenin daha yalın, ücretsiz yolu.",
        migrate: {
            title: "Hakkında sorabileceğin puanlar",
            body: [
                "Lifesum yapıya ve geri bildirime yaslanıyor — diyet planları, tarifler ve yediklerine puan veren besin puanlama sistemi. Nutrition MCP besinlerine rozetle not vermez; o puanlama döngüsü seni motive ediyorsa, Lifesum bu konuda bir adım önde.",
                "Takas esneklik: sabit bir puan yerine yapay zekâna “bu, hedeflerim için iyi bir seçim mi?” diye sorup bağlamı olan gerçek bir yanıt alabilirsin. Kayıt tek bir cümle, eğilimler ve bir hedef kilo zaten var ve işe yarayan kısımları kapatan bir premium sürüm yok.",
                "Bir rozet, bir besinin 5 üzerinden 3 aldığını söyler; bir sohbet ise bunun nedenini, kendi kaydının bağlamında açıklayabilir — “pirincin yarısını yeşilliklerle değiştir, böylece bu gününe uyar.” Ayrıca Lifesum diyet planlarını ve takibin bir kısmını Premium arkasına koyduğu için, ikisi arasında ücretsiz olan seçenek Nutrition MCP.",
            ],
        },
        importSection: {
            title: "Yeniden yazılacak hiçbir şey yok",
            body: [
                "Takip uygulaması değiştirmek geçmişini de taşımak demek ve onun tek bir satırını yeniden yazmak zorunda değilsin. İçe aktarmayı istediğinde sohbette bir içe aktarma paneli açılır: Lifesum CSV dışa aktarma dosyanı seçersin, dosya tarayıcında ayrıştırılır ve sütunlarını tarih, besin, öğün, kalori, protein, karbonhidrat, yağ, lif, toplam şeker ve kafeine yönlendirirsin. Lifesum başlıkları, MyFitnessPal, Cronometer, Lose It! ve MacroFactor başlıkları gibi adından tanınmaz, yani bu eşleştirme tek seferlik elle bir adım — sonrasında neyin ekleneceğini önizleyip onaylarsın.",
                "Hiçbir şey bir varsayımın arkasına saklanmaz. Eşleştirici sana kendi dosyanı gösterir — gerçek başlıklarını, gerçek hücrelerini ve oluşturulacak satırların anlık sayısını — böylece yanlış alana yönlendirilmiş bir sütun, sonradan keşfedilmek yerine hiçbir şey yazılmadan önce görünür olur. Tırnak içindeki alanlar, hücre içindeki satır sonları, neredeyse boş değerler ve toplam satırları da ele alınır ve dosya tarayıcında okunduğu için yapay zekâ yanlış yazabileceği bir satırı hiç görmez.",
                "Avrupa dışa aktarma dosyaları da kapsanıyor: noktalı virgülle ayrılmış ve ondalık ayırıcı olarak virgül kullanan bir dosya doğru okunur, GG/AA/YYYY tarihleri sırayı onayladığında dönüştürülür ve kilojul, birim kendi ilk satırından alınmış işlenmiş bir örneğin yanında gösterilerek kilokaloriye dönüşür. Yerelleştirilmiş başlıklar da yardımcı olur — bir Almanca dışa aktarma dosyasındaki Kalorien, Kohlenhydrate, Ballaststoffe ya da Koffein kendiliğinden dolar ve lif, şeker ile kafein İspanyolca, Fransızca, İtalyanca ve Hollandaca olarak da eşleşir — yani elle eşleştirme genellikle kulağa geldiğinden kısa sürer. İçe aktarmayı iki kez çalıştır, hiçbir şey ikiye katlanmaz — her satır bir içerik parmak izi taşır, bu yüzden tekrarlar, arada saat dilimin değişmediği sürece zaten kaydedilmiş olarak bildirilir.",
            ],
        },
        importFaq:
            "Evet, elle sütun eşleştirmeyle. İçe aktarmayı istediğinde sohbette bir içe aktarıcı açılır: Lifesum CSV dışa aktarma dosyanı seçersin, dosya yapay zekâ tarafından okunmak yerine tarayıcında ayrıştırılır ve sütunlarını tarih, besin, öğün, kalori ve makrolara — lif, toplam şeker ve kafein dahil — kendin yönlendirirsin. Lifesum, sütun adından tanınan dört dışa aktarma dosyasından biri değil, yani bu eşleştirme tek seferlik elle bir adım; gerçi eşleştiricinin bildiği başlıklar kendiliğinden dolar. Noktalı virgülle ayrılmış, ondalık ayırıcı olarak virgül kullanan Avrupa dosyaları, GG/AA/YYYY tarihleri ve kilojul birimi ele alınır ve aynı dosyayı yeniden içe aktarmak, arada saat dilimin değişmediği sürece hiçbir kopya oluşturmaz.",
        extraFaqs: [
            {
                q: "Nutrition MCP, Lifesum besin puanları gibi yediklerime puan veriyor mu?",
                a: "Hayır — rozet ya da sayısal puan yok. Bunun yerine yapay zekâna “bu, hedeflerim için iyi bir seçim mi?” diye sorup, besinin kendisine sabit bir puan vermek yerine takasları açıklayan, bağlamı olan bir yanıt alabilirsin.",
            },
            {
                q: "Nutrition MCP, Lifesum Premium tarzı bir plan olmadan ücretsiz mi?",
                a: "Evet. Nutrition MCP tamamen ücretsiz ve açık kaynak, premium sürümü yok — Lifesum ise diyet planlarını ve takip özelliklerinin bir kısmını Premium aboneliğin arkasına koyuyor. MCP destekleyen bir yapay zekâ uygulamasına, örneğin Claude veya ChatGPT, ve ilk bağlandığında Google ile ya da bir e-posta ve şifreyle oluşturduğun ücretsiz bir Nutrition MCP hesabına ihtiyacın var.",
            },
        ],
    },
};
