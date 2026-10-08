import type { AltUiCopy } from "./alt-ui.js";

export const ALT_UI_TR: AltUiCopy = {
    breadcrumbHome: "Ana sayfa",
    breadcrumbAlternatives: "Alternatifler",
    breadcrumbAriaLabel: "Site içi konum",
    ctaQuickInstall: "Hızlı kurulum",
    ctaClosingTitle:
        "Beslenmeni zaten kullandığın yapay zekânın içinde takip et.",
    disclaimerAppHtml:
        "{app}, ilgili sahibinin ticari markasıdır. Nutrition MCP bağımsız ve açık kaynak bir projedir; {app} ile bir bağlantısı yoktur, onun tarafından onaylanmamış ve desteklenmemiştir. Karşılaştırmalar yazıldığı tarihte kamuya açık olan bilgilere dayanır ve değişebilir.",
    disclaimerHubHtml:
        "{apps} ve diğer ürün adları ilgili sahiplerinin ticari markalarıdır. Nutrition MCP bağımsız ve açık kaynak bir projedir; bu ürünlerle bir bağlantısı yoktur ve onlar tarafından onaylanmamıştır. Karşılaştırmalar yazıldığı tarihte kamuya açık olan bilgilere dayanır ve değişebilir.",

    app: {
        heroEyebrow: "{app} alternatifi",
        heroTitleHtml: "<em>{app} MCP</em> sunucusu mu arıyorsun?",
        heroLead:
            "{app} bağlanabileceğin bir sunucu yayınlamıyor, yani {app} günlüğüne Claude veya ChatGPT üzerinden kayıt giremiyorsun. Nutrition MCP aynı işi sohbet ederek yapar; hem ücretsiz hem açık kaynak.",
        ctaConnect: "Bir dakikadan kısa sürede bağlan",
        ctaSeeComparison: "Karşılaştırmayı gör",

        answerEyebrow: "Kısa cevap",
        answerTitle:
            "Hayır, {app} için resmî ve herkese açık bir MCP sunucusu yok.",
        answerBodyHtml:
            "Model Context Protocol (MCP), Claude ve ChatGPT gibi yapay zekâ asistanlarının dış araçlara bağlanmasını sağlayan açık standarttır. {app} herkese açık bir MCP sunucusu yayınlamadığı için, yapay zekân üzerinden {app} günlüğüne yemek kaydetmenin resmî bir yolu yok. &ldquo;{app} MCP&rdquo; ya da &ldquo;{app} ile Claude nasıl bağlanır&rdquo; diye aradıysan aslında aradığın şey, yapay zekânın <em>içinde</em> yaşayan bir beslenme takipçisi. Nutrition MCP tam olarak bu.",

        insteadEyebrow: "Onun yerine ne elde ediyorsun",
        insteadTitle: "Aynı takip, sadece konuşarak",
        features: [
            {
                title: "Yemekleri gündelik dille anlat",
                body: "&ldquo;Muzlu ve fıstık ezmeli yulaf lapası&rdquo; demen yeter: yapay zekân kaloriyi ve makroları, lif, toplam şeker ve kafein dahil, tahmin eder ve kaydeder. Veritabanında arama yapmana gerek yok.",
            },
            {
                title: "Barkod okutma — ücretsiz",
                body: "Bir ürünün barkodunu gönder, etiketteki makrolar Open Food Facts üzerinden gelsin; etiketinde yazıyorsa lif ve şeker de dahil. Herkese ücretsiz, abonelik yok.",
            },
            {
                title: "Kilo &amp; hedefler",
                body: "Vücut kilonu kg veya lb olarak, dokuz vücut bölgesinin mezura ölçülerini cm veya inç olarak kaydet; kalori, makro, lif, şeker, kafein ve su hedefleri belirle — lif ulaşılacak bir hedef, şeker ve kafein ise altında kalınacak sınırlar — ve hedef kiloya doğru eğilimleri izle. Alkol takibi de var: isteğe bağlı, sen açmadıkça kapalı.",
            },
            {
                title: "Özetler &amp; eğilimler",
                body: "Günlük toplamları, haftalık eğilimleri, serileri ve tekrar eden yemek alışkanlıklarını doğrudan sohbet içinde sor.",
            },
            {
                title: "Verilerini içe aktar &amp; sahibi ol",
                body: "Yemek geçmişini başka bir uygulamanın CSV dışa aktarımından içe aktar — dosya tarayıcında ayrıştırılır, yapay zekâ tarafından değil. İstediğin an her şeyi geri al: yemeklerin, suyun, kilon, vücut ölçülerin, hedeflerin ve profilin, ayrıca hesap kaydın, kullanım telemetrin ve bağlı uygulamalarının bulunduğu tek bir ZIP dosyası, CSV olarak. Şimdilik yalnızca yemekler geri içe aktarılabiliyor. Ya da hesabını sil, aynı kolaylıkla.",
            },
            {
                title: "Açık kaynak &amp; ücretsiz",
                body: "MIT lisanslı ve kendi sunucunda barındırılabilir — reklam yok, ödeme duvarı yok, üst pakete yönlendirme yok. Kodu incele veya kendi kopyanı çalıştır.",
            },
        ],

        compareEyebrow: "{app} vs. Nutrition MCP",
        otherComparisonsLabel: "Diğer karşılaştırmalar:",
        compareTitle: "Nasıl kıyaslanıyorlar",
        pros: [
            "Bir MCP sunucusu olarak yazıldı — Claude &amp; ChatGPT içinde yaşar",
            "Yemekleri gündelik dille anlat; kalori, makrolar, lif, şeker &amp; kafein senin için tahmin edilir",
            "Barkod okutma, eğilimler, CSV içe &amp; dışa aktarma — hepsi ücretsiz",
            "Ayrı bir uygulama yok, reklam yok, açık kaynak",
        ],

        movingEyebrow: "{app} uygulamasından geçiş",

        importEyebrow: "{app} geçmişin",
        importSub:
            "İçe aktarmayı istediğinde doğrudan sohbet içinde bir içe aktarma penceresi açılır: dışa aktarım dosyanı seç, kolonları eşle, nelerin ekleneceğini önizle, sonra onayla. Dosya tarayıcında okunur — yapay zekâ satırları hiç görmez. Sohbet içi panelleri olmayan istemcilerde dışa aktarımını yapıştırabilirsin.",

        switchEyebrow: "Nasıl geçilir",
        switchSub:
            "PKCE ile OAuth 2.0 destekleyen her MCP istemcisiyle çalışır. İlk bağlantıda Google ile ya da e-posta ve şifreyle bir hesap oluşturursun.",
        installSteps: [
            '<a href="https://claude.ai/directory/nutrition-mcp" target="_blank" rel="noopener noreferrer">Claude dizinindeki Nutrition MCP sayfasını</a> aç.',
            "<strong>Connect</strong> düğmesine bas ve Google ile ya da e-posta ve şifreyle giriş yap.",
            "Ne yediğini söyleyerek kaydetmeye başla.",
        ],
        installNoteTemplate:
            "Onun yerine ChatGPT veya başka bir istemci mi kullanıyorsun? {link} ChatGPT, Cursor, VS Code, Claude Code ve daha fazlasını kapsıyor.",
        installLinkText: "Ayrıntılı kurulum rehberi",

        faqEyebrow: "SSS",
        faqTitleTemplate: "{app} &amp; MCP soruları",
        faq: {
            mcpQ: "{app} için bir MCP sunucusu var mı?",
            mcpA: "Resmî olan yok. {app} herkese açık bir Model Context Protocol (MCP) sunucusu yayınlamıyor, dolayısıyla Claude, ChatGPT veya başka MCP istemcileri üzerinden {app} günlüğüne kayıt girmenin resmî bir yolu yok. Topluluğun yaptığı bazı resmî olmayan sunucular var; bunlar {app} tarafından geliştirilmiyor ve desteklenmiyor. Nutrition MCP farklı: baştan bir MCP sunucusu olarak yazılmış, kendi hesabı olan, {app} CSV dışa aktarımını içe aktarabilen ücretsiz ve açık kaynak bir takipçi.",
            connectQ: "{app} ile Claude nasıl bağlanır?",
            connectA:
                "Claude için resmî bir {app} bağlayıcısı yok, çünkü {app} herkese açık bir MCP sunucusu yayınlamıyor. Seçeneklerden biri Nutrition MCP: Claude dizininde yer alan ücretsiz bir MCP sunucusu. https://claude.ai/directory/nutrition-mcp adresinden aç, Connect düğmesine bas, giriş yap ve sohbet ederek kaydetmeye başla.",
            goodAltQ: "Nutrition MCP iyi bir {app} alternatifi mi?",
            goodAltA:
                "Ayrı bir uygulama açmadan ya da yemek veritabanında arama yapmadan kaloriyi, makroları — lif, toplam şeker ve kafein dahil — suyu ve kiloyu takip etmek istiyorsan, evet. Veritabanında dokunarak gezinmek yerine ne yediğini gündelik dille anlatıyorsun, fotoğraf gönderiyorsun ya da barkod okutuyorsun; yapay zekân da kaydediyor — tamamen ücretsiz ve açık kaynak.",
            importQ: "{app} verilerimi içe aktarabilir miyim?",
            readExportQ:
                "İçe aktarırken yapay zekâ dışa aktarım dosyamı okuyor mu?",
            readExportA:
                "İçe aktarma penceresi açıldığında okumuyor. CSV dosyasını tarayıcında ayrıştırır ve hiçbir şey yazılmadan önce nelerin ekleneceğini gösterir: kaç yemek olduğunu, kalori toplamını, işaretlemek zorunda kaldığı her şeyi ve satırların kendisini — uzun bir dosyada her satır değil, ilk satırlar ve kalanların sayısı listelenir. Yalnızca onayladığın satırlar gönderilir ve yapay zekânın yanıtı üzerinden değil, yapılandırılmış veri olarak gider; yani yolda hiçbir satır yanlış yazılamaz ya da uydurulamaz. Her satır ayrıca bir içerik parmak izi taşır; böylece aynı dosyayı yeniden çalıştırdığında, arada saat dilimin değişmediği sürece o yemekler çift kaydedilmek yerine zaten kaydedilmiş olarak bildirilir. İstemcin sohbet içi panelleri gösteremiyorsa yedek yol dışa aktarımı yapıştırmak; o yolda yapay zekâ dosyayı okur, dolayısıyla seçme şansın varsa içe aktarma penceresini tercih et.",
            freeQ: "Nutrition MCP ücretsiz mi?",
            freeAFallback:
                "Evet. Nutrition MCP tamamen ücretsizdir; premium paketi, reklamı ya da ödeme duvarı arkasındaki özellikleri yoktur — bazı özellikleri aboneliğe saklayan uygulamaların aksine. MCP destekleyen bir yapay zekâ uygulamasına, örneğin Claude veya ChatGPT, ve ücretsiz bir Nutrition MCP hesabına ihtiyacın var; hesabı ilk bağlanışında Google ile ya da e-posta ve şifreyle oluşturuyorsun.",
        },
        importFallbackNote:
            " Sohbet içi panelleri olmayan istemcilerde onun yerine dışa aktarımını yapıştırabilirsin.",

        ctaClosingSub:
            "Ücretsiz ve açık kaynak — {app} hesabı gerekmez, açılacak uygulama yok.",
        ctaOtherAlternatives: "Diğer alternatifler",
    },

    hub: {
        heroEyebrow: "MCP alternatifleri",
        heroTitleHtml:
            "Beslenme uygulamanın resmî bir <em>MCP sunucusu</em> yok.",
        heroLead:
            "MyFitnessPal, Cronometer ve Lose It! gibi uygulamalar, günlüğüne Claude veya ChatGPT üzerinden kayıt girmenin resmî bir yolunu sunmuyor. Nutrition MCP, yemekleri, makroları ve kiloyu yapay zekânla konuşarak takip etmenin ücretsiz ve açık kaynak yolu — geçmişini de içe aktarır.",
        ctaSeeExamples: "Örnekleri gör",

        appsEyebrow: "Şuradan geçiyorsan…",
        appsTitle: "Şu an kullandığın uygulamayı seç",
        appsSub:
            "Nutrition MCP bugün kullandığın takipçiyle nasıl kıyaslanıyor, kayıt tutmayı ve mevcut geçmişini yapay zekâna nasıl taşıyorsun, gör.",
        noAppNote:
            "Uygulamanı görmüyor musun? Beslenme uygulamalarının çoğu da resmî bir MCP sunucusu yayınlamıyor — hangisinden geçiyor olursan ol, Nutrition MCP aynı şekilde çalışır.",
        requestComparisonLinkText: "Karşılaştırma talep et",

        importEyebrow: "Geçmişini yanında getirmek",
        importTitle: "Sıfırdan başlamak zorunda değilsin",
        importSub:
            "İnsanları yerinde tutan şey genelde yıllardır tuttukları kayıtlardır. İçe aktarmayı istediğinde doğrudan sohbet içinde bir içe aktarma penceresi açılır: dışa aktarım dosyanı seç, kolonları eşle, nelerin ekleneceğini önizle, sonra onayla — ya da istemcinde sohbet içi panel yoksa dışa aktarımı yapıştır.",
        importBody: [
            "Dosya tarayıcında ayrıştırılır, yapay zekâ tarafından okunmaz — yani satırlar yolda yanlış yazılamaz ve hiçbiri yazılmadan önce yemekleri tam olarak görürsün. MyFitnessPal, Cronometer, Lose It! ve MacroFactor dışa aktarımlarının kolonları adlarından tanınır; başka her CSV de çalışır, eşleyiciye her kolonu bir kez göstermen yeter. Aktarılanlar: tarih ve saat, besin, yemek, kalori, protein, karbonhidrat, yağ, lif, toplam şeker ve miligram cinsinden kafein — alkol takibini önceden açtıysan alkol de.",
            "Gerçek dışa aktarım dosyalarının zahmetli yanları çözülmüş durumda: GG/AA/YYYY ve AA/GG/YYYY tarihleri, kilokalorinin yanı sıra kilojul cinsinden enerji, sayılarında ondalık ayırıcı olarak virgül kullanan noktalı virgülle ayrılmış Avrupa dosyaları, içinde satır sonu olan tırnaklı alanlar, sonda duran toplam satırları ve silinmiş satır işaretleri. Kolon başlıklarının İngilizce olması da gerekmiyor — bir Alman dışa aktarımındaki Kalorien veya Ballaststoffe tanınır; lif, şeker ve kafein İspanyolca, Fransızca, İtalyanca ve Felemenkçe olarak da eşleştirilir. Bir dosya gerçekten belirsizse — 05/06 mayıs da haziran da olabilir — içe aktarma penceresi tahmin yürütmek yerine kendi okumasını senin dosyandan bir satırın yanında gösterir ve onaylamanı ister. Her satır da bir içerik parmak izi taşır; böylece aynı dosyayı yeniden içe aktardığında, arada saat dilimin değişmediği sürece yemekler çift kaydedilmek yerine zaten kaydedilmiş olarak bildirilir.",
        ],

        ctaSub: "Ücretsiz ve açık kaynak — Claude, ChatGPT ve her MCP istemcisiyle çalışır.",
        ctaStarGithub: "GitHub üzerinde yıldız ver",
    },
};
