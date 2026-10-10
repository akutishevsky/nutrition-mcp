// Turkish (tr) translation of IndexDoc for the landing page. See
// src/copy/index.ts for the full type shape and for which fields carry
// trusted HTML (`install.claude.steps`, `install.chatgpt.steps`,
// `install.other.note`, `why.noteHtml`, `faq[].visibleHtml`) — every tag
// there is kept verbatim from the English source. The hero chat and the
// example slides are structured data: `photo`, `card`, `meal.type`, `id`,
// `from`, `step`, `cards` and the `toolNotes` keys are copied verbatim; only
// the words are translated. On-screen UI labels inside the install steps
// (Customize, Connectors, Settings → Apps, …) stay English because that is
// what the Claude and ChatGPT interfaces actually show.
//
// Brand names (Nutrition MCP, Claude, ChatGPT, GitHub, Patreon, Open Food
// Facts, MyFitnessPal, …) are never given a Turkish case suffix: the sentence
// is reworded around them ("GitHub deposu", "Claude uygulamasına") because
// scripts/depersonalize.ts matches the base forms only.
//
// Numbers in the dialogue follow Turkish formatting (a period as thousands
// separator, a comma as decimal separator: 2.000, 78,4) and percentages put
// the sign first (%4), because that is how the widget cards beside them
// render; the figures themselves are unchanged.

import type { IndexDoc } from "./index.js";

export const INDEX_TR: IndexDoc = {
    title: "Nutrition MCP — Claude ve ChatGPT için Kalori ve Makro Takibi",
    metaDescription:
        "Claude veya ChatGPT ile konuşarak yemek, kalori ve makro kaydet. Kayıtlı yemekler, barkod, kilo takibi ve dışa aktarma sunan ücretsiz, açık kaynak MCP sunucusu.",
    ogDescription:
        "Claude veya ChatGPT ile konuşarak yemek, kalori ve makro kaydet. Kayıtlı yemekler, barkod, kilo takibi ve dışa aktarma sunan ücretsiz, açık kaynak MCP sunucusu.",
    keywords:
        "beslenme takibi, yemek takibi, MCP sunucusu, Claude AI, ChatGPT, kalori sayacı, makro takibi, barkod okuyucu, yemek kaydı, diyet takibi, kilo takibi, kilo kaydı, kayıtlı yemekler, yemek malzemeleri, tarif takibi, yapay zekâ beslenme, Model Context Protocol",

    hero: {
        titleBeforeEm: "Beslenmeni yapay zekânla ",
        titleEm: "konuşarak",
        titleAfterEm: " takip et.",
        lead: "Claude veya ChatGPT uygulamasını bağla, sonra sadece ne yediğini söyle. Kalori ve makrolar otomatik kaydedilir.",
        ctaPrimary: "Hızlı kurulum",
        ctaSecondary: "Destek ol",
        moreExamples: "Daha fazla örnek",
        chat: {
            photoAlt:
                "Fotoğraf: üzerine muz, orman meyveleri ve granola konmuş bir smoothie kâsesi, yanında bir americano",
            pauseLabel: "Demoyu duraklat",
            replayLabel: "Demoyu tekrar oynat",
            exchanges: [
                {
                    photo: true,
                    userText: "kahvaltı + americano",
                    aiText: "Bir smoothie kâsesi, görünüşe göre ev yapımı. Bunu daha önce iki şekilde yedin: granola ve balla ya da sadece meyveyle. Bu hangisi?",
                },
                {
                    userText: "granola ve bal, dolu bir kaşık",
                    aiText: "Anlaşıldı. Peki americano: tek mi duble mi, içinde süt var mı?",
                },
                {
                    userText: "duble, biraz yulaf sütü",
                    aiText: "Yani: bir tutam granola ve 1 yemek kaşığı balla kâse, bir de biraz yulaf sütlü duble americano. Yaklaşık 480 kcal ve 21 g protein. Kaydedeyim mi?",
                },
                {
                    userText: "evet",
                    aiText: "Kahvaltı kaydedildi: 480 kcal, 21 g protein ve 126 mg kafein. İlave şeker, 25 g sınırının 20 g'ına ulaştı, çoğu baldan; 51 g toplam şekerin geri kalanı meyve ve yoğurttan.",
                    card: "meal-logged",
                    meal: {
                        description:
                            "Smoothie kâsesi (1 kâse: Yunan yoğurdu, muz, orman meyveleri), granola (1 tutam) ve bal (1 yemek kaşığı); americano (duble shot) ve biraz yulaf sütü",
                        type: "breakfast",
                    },
                },
                {
                    userText:
                        "öğle yemeği: dün akşamdan kalan sebzeli sote, aynı porsiyon. bir de 500 ml su",
                    aiText: "Öğle yemeği kaydedildi, dün akşamla aynı: 620 kcal ve 54 g protein, ayrıca 500 ml su.",
                    meal: {
                        description:
                            "Dün akşamdan kalan sebzeli sote (1 porsiyon, dün akşamla aynı)",
                        type: "lunch",
                    },
                },
                {
                    userText:
                        "ara öğün: çocuğumun patatesinden 6 tane yürüttüm. yargılama",
                    aiText: "Yargılamıyorum. Yaklaşık 50 kcal, ara öğün olarak kaydedildi.",
                    meal: {
                        description:
                            "Patates kızartması (6 tane, çocuğumun tabağından)",
                        type: "snack",
                    },
                },
                {
                    userText: "akşam yemeği için ne kaldı?",
                    aiText: "850 kcal ve 84 g protein kaldı. İlave şeker 25 g sınırının 23 g'ında ve bugünkü 59 g toplam şekerin çoğu meyveden.",
                    card: "nutrition-summary",
                },
                {
                    userText: "kilom nasıl gidiyor?",
                    aiText: "11 Şubat'tan beri 1,4 kg düştün: 80,2 kg'dan 78,8 kg'a. 75 kg hedefine 3,8 kg kaldı.",
                    card: "weight-trends",
                },
            ],
        },
    },

    how: {
        title: "Üç adım. Öğrenilecek bir uygulama yok.",
        steps: [
            {
                title: "Bir kez bağlan",
                body: "Uzak MCP sunucularını destekleyen her yapay zekâ istemcisiyle çalışır: Claude, ChatGPT ve daha fazlası. Kurulum yok, API anahtarı yok.",
            },
            {
                title: "Sadece ne yediğini söyle",
                body: "Gündelik dille anlat; ya da yemeğinin fotoğrafını, bir yemek siparişi uygulamasından ekran görüntüsünü veya bir barkodu gönder (ürünü internetten arar). Makrolar otomatik kaydedilir.",
            },
            {
                title: "Takip et ve incele",
                body: "Günlük özetler, haftalık eğilimler, hedef durumu iste ya da kaydettiğin her şeyi CSV dosyaları olarak dışa aktar. Tamamen ücretsiz.",
            },
        ],
        counter: "{n} / 3",
    },

    install: {
        title: "Bir dakikadan kısa sürede bağlan",
        sub: "PKCE ile OAuth 2.0 destekleyen her MCP istemcisiyle çalışır. İlk bağlantıda Google ile ya da bir e-posta ve şifreyle hesap oluşturursun; verilerine erişmeyi sürdürmek için her zaman aynı yöntemle giriş yap.",
        copyAriaLabel: "Sunucu adresini kopyala",
        tabsLabel: "Yapay zekâ istemcini seç",
        claude: {
            cta: "Claude uygulamasına ekle",
            steps: [
                "Dizin sayfasında <strong>Connect</strong> düğmesine tıkla, sonra Google ile devam et ya da bir e-posta ve şifreyle giriş yap.",
                "Bitti. Hemen çalışır ve iOS ile Android uygulamalarında otomatik olarak görünür.",
            ],
            note: "Ücretsiz olan da dahil her Claude planında çalışır. Bunun yerine elle eklemek istersen Customize → Connectors → Add custom connector yolunu ve https://nutrition-mcp.com/mcp adresini kullan.",
        },
        chatgpt: {
            steps: [
                "<strong>Web üzerindeki ChatGPT</strong> → <strong>Settings</strong> → <strong>Apps</strong> yolunu aç.",
                "Açılan pencerenin altındaki <strong>Create app</strong> düğmesine tıkla. Görmüyorsan <strong>Advanced settings</strong> içinde <strong>Developer mode</strong> seçeneğini aç.",
                "Ona bir ad ver, örneğin <strong>Nutrition</strong>.",
                "<strong>Connection</strong> alanına <code>https://nutrition-mcp.com/mcp</code> adresini yapıştır.",
                "<strong>Authentication</strong> için <strong>OAuth</strong> seç; geri kalan her şeyi olduğu gibi bırak.",
                '<strong>"I understand and want to continue"</strong> seçeneğini işaretle.',
                "<strong>Create</strong> düğmesine tıkla.",
                "<strong>Sign in with Nutrition</strong> düğmesine tıkla; giriş sayfası açılır, Google ile devam et ya da bir e-posta ve şifreyle giriş yap.",
                "Bitti. Hemen çalışır ve iOS ile Android uygulamalarında otomatik olarak görünür.",
            ],
        },
        other: {
            note: "Yukarıdaki yapılandırmayı istemcine ekle (Cursor, VS Code, Claude Code ve daha fazlası). Windsurf, <code>url</code> yerine <code>serverUrl</code> kullanır. Claude Code içinde <code>claude mcp add --transport http nutrition https://nutrition-mcp.com/mcp</code> komutunu çalıştır. İstemcin OAuth girişini otomatik olarak halleder.",
        },
        otherTabLabel: "Diğer istemciler",
    },

    onboarding: {
        title: "Bir kez ayarla ya da hemen konuşmaya başla",
        sub: "Bunların hepsi tamamen isteğe bağlı: Nutrition MCP bağlandığın anda çalışır. İstersen bu üç kısa adım sonucu daha isabetli yapar, ama doğrudan kaydetmeye de geçebilirsin.",
        justSay: "Sadece şöyle de ",
        steps: [
            {
                title: "Saat dilimini ayarla",
                body: "böylece günler senin yerel gece yarında değişir ve nerede olursan ol bugünün toplamları doğru kalır.",
                say: "Saat dilimimi New York olarak ayarla",
            },
            {
                title: "Hedeflerini ayarla",
                body: "günlük kalori, makro ve su hedefleri, ayrıca isteğe bağlı bir hedef kilo ve tercih ettiğin kilo birimi (kg veya lb) — ilerlemeni bunlara göre takip etmek için.",
                say: "Günlük hedefimi 2.000 kalori ve 150 g protein yap",
            },
            {
                title: "Dilini ayarla",
                body: "sohbet içi widget'ların (paneller, grafikler) hangi dilde gösterileceği; yapay zekânın sana hangi dilde yazdığı değil.",
                say: "Widget'larımı Almanca göster",
            },
            {
                title: "Kaydetmeye başla",
                body: "sadece ne yediğini söyle, bir fotoğraf gönder ya da bir barkod okut. Hepsi bu.",
                say: "Kahvaltıda orman meyveli yulaf ezmesi yedim",
            },
        ],
        note: "Buradaki her şey isteğe bağlı. Şimdi, sonra ya da hiç yapmayabilirsin — sadece kaydetmeye başla, bunları canın ne zaman isterse ayarla.",
        toolsCta: {
            heading: "Gerçekte neler yapabildiğini merak ettin mi?",
            body: "46 aracın tamamına göz at — kaydetme, barkodlar, su, kilo ve vücut ölçüleri, hedefler ve eğilimler — her biri için bir açıklama ve örnek bir cümleyle.",
            arrow: "Araçları keşfet",
        },
    },

    examples: {
        title: "Sadece onunla konuş.",
        sub: "Yalnızca konuşarak yapabileceğin birkaç şey.",
        prevLabel: "Önceki örnek",
        nextLabel: "Sonraki örnek",
        pickerLabel: "Bir örnek seç",
        carouselLabel: "Örnekler",
        carouselRoleDescription: "karusel",
        threadLabel: "Sohbet",
        moreToolsLabel: "Ayrıca kullanır",
        toolLinkLabel: "{tool} — Araçlar sayfasında (yeni sekmede açılır)",
        photoMealAlt:
            "Fotoğraf: üzerine bir kaşık ekşi krema ve dereotu konmuş bir kâse borsç, yanında bir dilim çavdar ekmeği",
        photoPackageAlt:
            "Fotoğraf: sade Yunan yoğurdu kabının üzerindeki barkod, numarası 2001234567893",
        slides: [
            {
                id: "log-meal",
                title: "Gündelik dille kaydet",
                description:
                    "Bir arkadaşına anlatır gibi söyle. Porsiyon ya da hangi öğün olduğu eksikse tahmin etmeden önce sorar. Lif, şeker ve ilave şeker her kayda girer, kafein içeren her şeye eklenir ve “7 civarı” senin saat diliminde 07:00 olur.",
                toolNotes: {
                    log_meal:
                        "Kahvaltıyı makrolarla, lifle, şekerle, ilave şekerle ve kahvenin kafeiniyle kaydeder",
                    log_water:
                        "500 ml suyu 07:00 olarak bugünün su toplamına ekler",
                    get_current_time:
                        "“7 civarı” 07:00 olsun diye bugünün tarihini belirler",
                },
                messages: [
                    {
                        from: "user",
                        text: "kahvaltıda orman meyveli yulaf ezmesi ve bir kahve",
                    },
                    {
                        from: "ai",
                        text: "Kâse ne kadardı ve yulaf ezmesi sütle mi suyla mı yapıldı? Kahvenin içinde bir şey var mıydı?",
                    },
                    {
                        from: "user",
                        text: "normal kâse, sütle. kahve sadeydi",
                    },
                    {
                        from: "ai",
                        text: "Kahvaltı kaydedildi: yaklaşık 320 kcal, 11 g protein ve 6 g lif. Kahve, 400 mg kafein sınırının 95 mg'ına denk geliyor.",
                    },
                    {
                        from: "user",
                        text: "bir de koşumdan önce 7 civarı yarım litre kadar su içtim",
                    },
                    {
                        from: "ai",
                        text: "Bu sabah 07:00 olarak 500 ml su eklendi.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 2,
                    },
                ],
                cardMeals: [
                    "Sütle yapılmış orman meyveli yulaf ezmesi (1 kâse) ve sade kahve (1 fincan)",
                ],
            },
            {
                id: "photo-meal",
                title: "Tabağının fotoğrafını çek",
                description:
                    "Bir fotoğraf tahminle değil, bir sohbetle başlar. Yemeğin ev yapımı mı restorandan mı olduğunu sorar, fotoğrafın gösteremediğini eski kayıtlarında arar, ne kadar yediğini gündelik ölçülerle sorar ve ancak özeti onayladığında kaydeder.",
                toolNotes: {
                    search_meals:
                        "Tsybulya adlı yerdeki eski borsçunu ve içinde ne olduğunu bulur",
                    log_meal:
                        "Sen onay verdiğinde restoranın adıyla birlikte kaydeder",
                },
                messages: [
                    {
                        from: "user",
                        photo: "meal",
                        text: "öğle yemeği",
                    },
                    {
                        from: "ai",
                        text: "Ekşi kremalı borsç ve bir dilim çavdar ekmeği gibi görünüyor. Ev yapımı mı, restorandan mı? Restorandansa hangisi?",
                    },
                    {
                        from: "user",
                        text: "Tsybulya, Kiev'in Podil semtinde",
                    },
                    {
                        from: "ai",
                        text: "Tsybulya adlı yerde daha önce iki kez borsç kaydetmişsin, ikisinde de ekşi kremalı etli borsç ve bir dilim çavdar ekmeği, yaklaşık 520 kcal. Yine aynısı mı? Kâseyi ve ekmeği bitirdin mi?",
                    },
                    {
                        from: "user",
                        text: "aynısı, hepsini, ekmeği de",
                    },
                    {
                        from: "ai",
                        text: "Yani: Kiev Podil semtindeki Tsybulya adlı yerde ekşi kremalı etli borsç (1 kâse, bitirildi) ve çavdar ekmeği (1 dilim). Geçen seferle aynı: yaklaşık 520 kcal ve 24 g protein; yayımlanmış değerler değil, tahminler. Kaydedeyim mi?",
                    },
                    {
                        from: "user",
                        text: "evet",
                    },
                    {
                        from: "ai",
                        text: "Kaydedildi. Bugünkü 2.000 kcal'nin 520'si gitti, 1.480 kaldı.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 6,
                    },
                ],
                cardMeals: [
                    "Kiev Podil semtindeki Tsybulya adlı yerde ekşi kremalı etli borsç (1 kâse, bitirildi) ve çavdar ekmeği (1 dilim)",
                ],
            },
            {
                id: "scan-barcode",
                title: "Barkod okut",
                description:
                    "Ambalajın fotoğrafını çek: barkodun altındaki rakamlar Open Food Facts üzerinde aranır ve ne kadar yediğin sorulur. İlave şeker, Open Food Facts verisinde varsa oradan okunur. Open Food Facts kafein taşımaz, bu yüzden kafein etiketten ya da tipik değerlerden gelir; eksik bir lif, şeker veya ilave şeker değeri boş bırakılmaz, tahmin edilir.",
                toolNotes: {
                    lookup_barcode:
                        "Kabın etiket değerlerini ve Nutri-Score puanını Open Food Facts üzerinden getirir",
                    log_meal:
                        "100 g başına değerlerden ölçekleyip kabın tamamını kahvaltı olarak kaydeder",
                },
                messages: [
                    {
                        from: "user",
                        photo: "package",
                        text: "kahvaltıda bunu yedim. iyi bir şey mi?",
                    },
                    {
                        from: "ai",
                        text: "Bu, 150 g'lık bir sade Yunan yoğurdu kabı (%0 yağlı): 87 kcal, 15 g protein ve 5 g şeker, hiçbiri ilave değil; Open Food Facts bunu Nutri-Score A olarak değerlendiriyor. Kabın tamamını yedin mi?",
                    },
                    {
                        from: "user",
                        text: "tamamını",
                    },
                    {
                        from: "ai",
                        text: "Kahvaltı olarak kaydedildi: 87 kcal, 15 g protein ve 5 g şeker. Bugün 145 g protein kaldı.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 2,
                    },
                ],
                cardMeals: ["Sade Yunan yoğurdu %0 (150 g kap)"],
            },
            {
                id: "saved-meal",
                title: "Her zamankileri kaydet",
                description:
                    "Sık yediğin bir yemeği malzemeleriyle birlikte kaydet ve sonra adını söyleyerek yeniden kaydet. Bir malzemeyi yalnızca o seferlik çıkar ya da miktarını değiştir, istersen birden fazla porsiyon kaydet; kayıtlı yemek olduğu gibi kalır.",
                toolNotes: {
                    log_saved_meal:
                        "Kâseyi ekşi krema olmadan ve tavuğu iki katına, 240 g'a çıkararak kaydeder",
                    save_meal:
                        "Kâsenin altı malzemesini ve bir porsiyonluk değerlerini saklar; bugüne bir şey eklemez",
                },
                messages: [
                    {
                        from: "user",
                        text: "burrito kâsemi kaydet de hızlıca girebileyim: 150 g pirinç, 120 g tavuk, 100 g siyah fasulye, 60 g salsa, 30 g peynir, 30 g ekşi krema",
                    },
                    {
                        from: "ai",
                        text: "“Burrito kâsesi” 6 malzemesiyle kaydedildi, bir porsiyon: 725 kcal, 59 g protein, 22 g yağ. Kaydetmek bugüne eklemez — yediğinde adını söylemen yeter.",
                    },
                    {
                        from: "user",
                        text: "öğlen burrito kâsesini yedim. bugün ekşi krema yok, tavuk da iki kat",
                    },
                    {
                        from: "ai",
                        text: "Burrito kâsenden öğle yemeği kaydedildi, ekşi krema olmadan ve 240 g tavukla: 865 kcal ve 95 g protein. Kayıtlı kâse bir dahaki sefer için olduğu gibi duruyor.",
                    },
                    {
                        from: "user",
                        text: "proteinin çoğu nereden geliyor?",
                    },
                    {
                        from: "ai",
                        text: "Tavuktan: 95 g'ın 74 g'ı. Siyah fasulye 9 g, peynir 7 g, pirinç 4 g ve salsa 1 g ekliyor.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 2,
                    },
                ],
                cardMeals: ["Burrito kâsesi (ekşi krema yok, çift tavuk)"],
            },
            {
                id: "goals-progress",
                title: "Hedef koy, durumunu gör",
                description:
                    "Kalori ve protein gibi ulaşılacak hedefler, ilave şeker, toplam şeker, alkol ve kafein için altında kalınacak sınırlar belirle; yalnızca söylediğin değişir. Sonra herhangi bir gün için her hedefe ne kaldığını ve her sınıra göre nerede durduğunu sor.",
                toolNotes: {
                    set_nutrition_goals:
                        "Kalori ve protein hedeflerini ve 400 mg kafein sınırını kaydeder",
                    get_goal_progress:
                        "Bugünü her hedef ve sınıra göre sohbetteki bir kartta gösterir",
                },
                messages: [
                    {
                        from: "user",
                        text: "biraz incelmeye çalışıyorum. beni 2000 kalori ve 160 g proteine ayarla. bir de makul bir kafein sınırı ne olur? neredeyse kahveyle yaşıyorum",
                    },
                    {
                        from: "ai",
                        text: "Sağlıklı yetişkinler için EFSA ve FDA günde 400 mg'a kadarını, yani kabaca dört fincan filtre kahveyi uygun görüyor; EFSA gebelikte 200 mg öneriyor. Sınır senin kararın; 400 olsun mu?",
                    },
                    {
                        from: "user",
                        text: "evet 400",
                    },
                    {
                        from: "ai",
                        text: "Tamam: ulaşılacak 2.000 kcal ve 160 g protein, kafein 400 mg altında. Geri kalan her şey olduğu gibi kalıyor: 220 g karbonhidrat, 70 g yağ, 30 g lif, 2,5 L su, 25 g ilave şeker sınırın ve 75 kg hedef kilon.",
                    },
                    {
                        from: "user",
                        text: "bu akşam tatlıya yer var mı?",
                    },
                    {
                        from: "ai",
                        text: "2.000 kcal'nin 1.540'ında ve 160 g proteinin 104 g'ındasın, yani 460 kcal ve 56 g protein kaldı. İlave şeker 25 g sınırının 16 g'ında, kafein de 400 mg'ın 130 mg'ında; ikisi de altında.",
                    },
                ],
                cards: [
                    {
                        kind: "goal-progress",
                        after: 4,
                    },
                ],
            },
            {
                id: "review-week",
                title: "Haftayı incele",
                description:
                    "Haftanın nasıl geçtiğini sor; eğilimler kartı sohbette açılır ve ortalama kalori ile makrolarını hedeflerine göre, bir de kaç gün kaydettiğini gösterir. Yeni bir istek göndermeden 7, 14 ve 30 gün arasında geçiş yap. Serilerini ve hedefte kaldığın günleri de söyleyebilir.",
                toolNotes: {
                    get_trends:
                        "Son 7, 14 ve 30 gününün ortalamasını alır ve eğilimler kartını açar",
                },
                messages: [
                    {
                        from: "user",
                        text: "son iki hafta nasıl geçti? çok dağınık gibiyim",
                    },
                    {
                        from: "ai",
                        text: "14 günün 13'ünü kaydettin, son 10'u üst üste; bunların 9'u 2.000 kcal hedefinin %10 aralığında kaldı. Kaloriler günde ortalama 1.830 çıktı, ama bu hesapta atladığın gün sıfır sayılıyor.",
                    },
                    {
                        from: "user",
                        text: "şeker ne durumda?",
                    },
                    {
                        from: "ai",
                        text: "İlave şeker günde ortalama 22 g, 25 g sınırının altında; ama 13 günün 5'inde sınırı aştı. Toplam şeker ortalama 52 g, çoğu meyve ve sütten.",
                    },
                ],
                cards: [
                    {
                        kind: "trends",
                        after: 0,
                    },
                ],
            },
            {
                id: "weight-trend",
                title: "Kilo ve ölçüleri takip et",
                description:
                    "Tartı sonucunu kg veya lb cinsinden kaydet ve günlük dalgalanmanın altındaki eğilimi gör: yumuşatılmış bir ortalama, ay içindeki değişim ve hedefine kalan mesafe. Belden baldıra dokuz vücut bölgesinin mezura ölçüleri de cm veya inç cinsinden yanında durur. Kaçmış bir ondalık ayırıcı gibi imkânsız bir değer, kaydedilmeden önce yakalanır.",
                toolNotes: {
                    log_weight: "Bu sabahki 78,4 kg tartı sonucunu kaydeder",
                    get_weight_trends:
                        "Günlük dalgalanmaları bir eğilim kilosuna ve haftalık değişim hızına indirger, hedefe kalan mesafeyle birlikte",
                    log_body_measurement: "84 cm bel ölçüsünü kaydeder",
                    get_body_measurements:
                        "Karşılaştırmak için son bel kaydını bulur",
                },
                messages: [
                    {
                        from: "user",
                        text: "bu sabah 78,4 kg. eğilimim nasıl görünüyor?",
                    },
                    {
                        from: "ai",
                        text: "78,4 kg kaydedildi. 11 Şubat'tan beri 1,8 kg düştün (80,2 kg'dan) ve 7 günlük ortalaman 78,7 kg. 75 kg hedefine 3,4 kg kaldı.",
                    },
                    {
                        from: "user",
                        text: "bel de 84 cm'ydi. bu nasıl bir değişim?",
                    },
                    {
                        from: "ai",
                        text: "Belini 84 cm olarak kaydettim. Son ölçün 14 Şubat'ta 86,5 cm'ydi, yani 2,5 cm daha az.",
                    },
                ],
                cards: [
                    {
                        kind: "weight-trends",
                        after: 0,
                    },
                ],
            },
            {
                id: "meal-patterns",
                title: "Alışkanlıklarını yakala",
                description:
                    "Ne zaman daha çok yediğini sor; kendi kayıtlarını karşılaştırır: hafta içiyle hafta sonunu, kahvaltılı ve kahvaltısız günleri, büyük öğle yemeklerini, erken ve geç akşam yemeklerini. Sıra dışı günleri de işaretler ve nedenleri değil, örüntüleri bildirir.",
                toolNotes: {
                    get_meal_patterns:
                        "30 gün boyunca kahvaltıyı, akşam yemeği saatini ve hafta sonu günlerini karşılaştırır",
                },
                messages: [
                    {
                        from: "user",
                        text: "kahvaltıyı atladığım günlerde daha çok mu yiyorum? öyle geliyor",
                    },
                    {
                        from: "ai",
                        text: "Birazcık, evet. Son 30 günün 28'ini kaydettin ve 6 gün kahvaltıyı atladın. O günlerin ortalaması 2.215 kcal ve 88 g protein; kahvaltı yaptığın 22 günde ise 1.940 kcal ve 123 g.",
                    },
                    {
                        from: "user",
                        text: "geç akşam yemekleri ne olacak? spor günlerinde 9'a kadar bir şey yemiyorum",
                    },
                    {
                        from: "ai",
                        text: "Onlar da öne çıkıyor: akşam yemeğinin 20.00 veya sonrasında olduğu 9 günün ortalaması 2.165 kcal, diğer 19 günde 1.920. İkisi de kaydındaki örüntüler, birinin diğerine yol açtığının kanıtı değil.",
                    },
                    {
                        from: "user",
                        text: "hafta sonları?",
                    },
                    {
                        from: "ai",
                        text: "Neredeyse fark yok: hafta sonları ortalama 2.010 kcal, hafta içi 1.993.",
                    },
                ],
            },
            {
                id: "track-drinks",
                title: "İçkileri de takip et",
                description:
                    "Takibi açana kadar alkol gizli kalır. ABD standart içkilerini ya da Birleşik Krallık birimlerini seç; her içki, hacmi ve derecesinden gram alkol olarak hesaplanır. Sonradan kapatmak alkolü yeniden gizler, silmez.",
                toolNotes: {
                    set_alcohol_tracking:
                        "Alkolü açar; Birleşik Krallık birimlerinin yanında gram olarak gösterilir",
                    log_meal:
                        "Bira bardağını alkolüyle birlikte gram etanol olarak kaydeder (568 ml × %4 × 0,789)",
                },
                messages: [
                    {
                        from: "user",
                        text: "içkilerimi de sayar mısın? biraz azaltmaya çalışıyorum",
                    },
                    {
                        from: "ai",
                        text: "Olur. Alkolü ABD standart içkisi olarak mı, Birleşik Krallık birimi olarak mı gösterelim?",
                    },
                    {
                        from: "user",
                        text: "uk birimi, manchester'dayım",
                    },
                    {
                        from: "ai",
                        text: "Alkol takibi açık, Birleşik Krallık birimlerinin yanında gram olarak.",
                    },
                    {
                        from: "user",
                        text: "akşam yemeğinde bir pint lager içtim",
                    },
                    {
                        from: "ai",
                        text: "Kaç derecelikti? Lager genelde %4 ile %5 arasında olur, musluğun ya da kutunun üzerinde yazar.",
                    },
                    {
                        from: "user",
                        text: "%4 sanırım",
                    },
                    {
                        from: "ai",
                        text: "Akşam yemeği kaydı olarak eklendi: %4'lük 568 ml'lik bir pint 17,9 g alkol, 2,3 Birleşik Krallık birimi, yaklaşık 180 kcal.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 6,
                    },
                ],
                cardMeals: ["Lager, %4 (1 pint, 568 ml)"],
            },
            {
                id: "import-history",
                title: "Geçmişini getir",
                description:
                    "MyFitnessPal, Cronometer, Lose It! veya MacroFactor uygulamasından mı geçiyorsun? İçe aktarıcı sohbette açılır, dışa aktardığın dosyayı tarayıcıda okuyup eşler, bir ön izlemeyi onaylayana kadar hiçbir şey kaydetmez ve aynı dosyayı aynı saat dilimiyle yeniden aktarırsan bir yemeği ikiye katlamaz. Saat dilimin ayarlı değilse önce o çözülür, böylece her yemek doğru güne düşer.",
                toolNotes: {
                    get_profile:
                        "Hesapta henüz saat diliminin ayarlı olmadığını gösterir",
                    set_timezone:
                        "Yemeklerin yerel saate düşmesi için America/Chicago olarak ayarlar",
                    start_meal_import:
                        "Dışa aktardığın dosya için sohbet içi içe aktarıcıyı açar",
                    bulk_import_meals:
                        "Onaylanan satırları 50'ye kadar gruplar hâlinde kaydeder, daha önce aktarılanları atlar",
                },
                messages: [
                    {
                        from: "user",
                        text: "myfitnesspal uygulamasından geçiyorum. yemek kaydımı taşıyabilir misin? dışa aktarılmış dosya elimde",
                    },
                    {
                        from: "ai",
                        text: "İçe aktarıcıyı açmadan önce: hesabında saat dilimi ayarlı değil, bu yüzden dosyadaki tarihler UTC olarak okunur ve yemekler yanlış güne düşebilir. Önce onu ayarlamak ister misin? Hangi saat dilimindesin?",
                    },
                    {
                        from: "user",
                        text: "chicago",
                    },
                    {
                        from: "ai",
                        text: "Saat dilimi America/Chicago olarak ayarlandı ve içe aktarıcı yukarıda açık: MyFitnessPal dosyanı oradan seç. Dosya doğrudan tarayıcında okunur ve ön izlemeyi onaylayana kadar hiçbir şey kaydedilmez.",
                    },
                    {
                        from: "user",
                        text: "kolonları eşledi ama yemek adı bu dosyada yok diyor?",
                    },
                    {
                        from: "ai",
                        text: "MyFitnessPal için bu normal: dışa aktarılan dosyada gün başına öğün başına bir satır var, toplamlar var ama yemek adları yok. Yemek adı olmayan satırlar geldikleri uygulamanın adıyla etiketlenir, kalori ve makroları olduğu gibi aktarılır.",
                    },
                    {
                        from: "user",
                        text: "603 yemek. öğle vaktine kaydedilecekler diyor?",
                    },
                    {
                        from: "ai",
                        text: "Doğru, dosyada tarihler var ama öğün saatleri yok, bu yüzden her biri yerel öğle vaktine yerleştirilir. Böylece her yemek Chicago içinde doğru günde kalır; sadece gerçekte ne zaman yediğini göremezsin.",
                    },
                    {
                        from: "user",
                        text: "bitti! hepsi geldi mi?",
                    },
                    {
                        from: "ai",
                        text: "Hepsi: 603 yemek içe aktarıldı, hiçbiri başarısız olmadı.",
                    },
                ],
                cards: [
                    {
                        kind: "import-meals",
                        after: 2,
                        step: "file",
                    },
                ],
            },
            {
                id: "export-data",
                title: "Verilerini al",
                description:
                    "Tek bir istek, hakkında saklanan her şeyi — yemekler, kayıtlı yemekler ve malzemeleri, su, tartı kayıtları, vücut ölçüleri, hedefler, profil ayarları, hesap kaydın, kullanım telemetrisi ve uygulama bağlantıları — bir README ile birlikte CSV dosyalarından oluşan bir ZIP içine koyar. Zaman damgaları senin saat dilimini kullanır ve meals.csv doğrudan geri içe aktarılabilir.",
                toolNotes: {
                    export_all_data:
                        "Her CSV dosyasını ve bir README dosyasını 60 dakika geçerli bir bağlantının arkasında ZIP olarak paketler",
                },
                messages: [
                    {
                        from: "user",
                        text: "diyetisyenim yemek kaydımı görmek istiyor. tablo olarak çıkarabilir misin?",
                    },
                    {
                        from: "ai",
                        text: "Tamam. ZIP içinde 1.204 yemek, 318 su kaydı ve 64 kilo kaydı var; ayrıca beslenme hedeflerin, profil ayarların, hesap bilgilerin, araç kullanım telemetrisi ve uygulama bağlantıları. Yemek kaydın içindeki meals.csv dosyasında.",
                        link: "Dışa aktarmanı indir (bağlantı 60 dakika geçerli)",
                    },
                ],
            },
        ],
    },

    stats: {
        title: "Kahvaltı bir yerde, akşam yemeği başka bir yerde.",
        sub: "Tüm Nutrition MCP hesaplarındaki canlı beslenme istatistikleri — kalori, yemek kaydı, makrolar ve verilen kilo — her beş saniyede yenilenir.",
        liveLabel: "Canlı",
        unitGroupLabel: "Birimler",
        unitMetricLabel: "Metrik",
        unitImperialLabel: "Emperyal",
        unitKgLabel: "Metrik (kg)",
        unitLbLabel: "Emperyal (lb)",
        refreshBefore: "Her 5 sn'de yenilenir · sonraki: ",
        refreshAfter: " sn",
        sinceOpenLabel: "sen bu sayfayı açtığından beri",
        calCaption: "Kaydedilen kalori",
        cards: {
            foodLogs: "Yemek kaydı",
            protein: "Kaydedilen protein",
            carbs: "Kaydedilen karbonhidrat",
            fat: "Kaydedilen yağ",
            weightLost: "2 Temmuz 2026 tarihinden beri verilen kilo",
            water: "Kaydedilen su",
        },
        foodLogsUnit: { one: "kayıt", other: "kayıt" },
        timezonesAfter:
            " saat dilimi · günler herkesin kendi gece yarısında değişir",
        mapNote: "nokta boyutu = profillerdeki pay",
        mapAriaLabel:
            "Profillerde ayarlanmış saat dilimlerinin dünya haritası; her saat dilimi, en az üç profil onu kullandığında gösterilir",
        foot: "Tüm hesapların toplamları, yemekler kaydedildikçe güncellenir. Tek bir kişinin verisi asla gösterilmez.",
    },

    features: {
        title: "Neleri takip edebilirsin",
        cards: [
            {
                title: "Gündelik dille yemekler",
                body: "Ne yediğini anlat — yapay zekân kaloriyi, proteini, karbonhidratı, yağı, lifi, toplam şekeri, ilave şekeri ve miligram cinsinden kafeini tahmin edip kaydeder. Sık yediğin yemekleri malzemeleriyle birlikte kaydet, sonra adını söyleyerek yeniden gir.",
            },
            {
                title: "Barkod okut",
                body: "Bir ürünün barkodunu çek ya da yaz; makroları, lifi ve şekeri Open Food Facts üzerinden getir — belirtildiği yerde ilave şekeri de — ne kadar yediğine göre ölçeklenmiş olarak.",
            },
            {
                title: "Hedefler ve ilerleme",
                body: "Günlük kalori, makro, lif ve su hedefleri, ayrıca altında kalmak için ilave şeker, toplam şeker, kafein ve alkol sınırları belirle; onlara doğru ilerlemeni canlı olarak gör.",
            },
            {
                title: "Özetler ve eğilimler",
                body: "Günlük ve haftalık dökümler, 7/14/30 günlük eğilimler, seriler ve yinelenen yemek örüntüleri.",
            },
            {
                title: "Su kaydı",
                body: "Yemeklerinin yanında sıvı alımını mililitre cinsinden takip et ve güne göre incele.",
            },
            {
                title: "Kilo takibi",
                body: "Vücut kilonu kg veya lb cinsinden kaydet, tüm geçmişin boyunca yumuşatılmış eğilim kilonu ve haftalık değişim hızını gör, bir hedef kiloya doğru ilerlemeni takip et. Belden baldıra dokuz vücut bölgesinin mezura ölçüleri cm veya inç cinsinden yanında durur.",
            },
            {
                title: "Saat dilimine duyarlı",
                body: "Dünyanın neresinde olursan ol, günler senin yerel saatinde değişir.",
            },
            {
                title: "Başka bir uygulamadan içe aktar",
                body: "Yemek geçmişini MyFitnessPal, Cronometer, Lose It! veya MacroFactor uygulamasından getir — ya da kolonlarını kendin eşleyerek başka herhangi bir CSV dosyasından. Hiçbir şey kaydedilmeden önce neyin ekleneceğini sen onaylarsın.",
            },
            {
                title: "Dışa aktar, verine sahip ol",
                body: "Hakkında sakladığımız her şeyi — yemekler, kayıtlı yemekler ve malzemeleri, su, kilo, vücut ölçüleri, hedefler ve profil, ayrıca hesap kaydın, kullanım telemetrisi ve bağlı uygulamalar — CSV dosyalarından oluşan tek bir ZIP olarak al. Şimdilik geri içe aktarılabilen tek bölüm yemekler. Hesabını ve verilerini istediğin zaman sil.",
            },
        ],
    },

    why: {
        title: "Konuşmak, dokunmaktan iyidir.",
        sub: "Bir barkod okut ya da sadece ne yediğini söyle — veri tabanı karıştırmak yok, açılacak ayrı bir uygulama yok.",
        oldHeading: "Geleneksel uygulamalar",
        oldItems: [
            "Her bir öğe için veri tabanında arama yapmak",
            "Hatalı veri tabanı kayıtlarını elle düzeltmek",
            "Açılacak bir uygulama daha, çoğu zaman ödeme duvarının arkasında",
            "Yorucu, elle kayıt",
        ],
        newHeading: "Nutrition MCP",
        newItems: [
            "Yemekleri gündelik dille anlat",
            "Kalori ve makrolar senin için tahmin edilir",
            "Claude ya da ChatGPT içinde ücretsiz çalışır",
            "Eğilimleri, özetleri ve hedefleri sor",
        ],
        noteHtml:
            'Belirli bir uygulamadan mı geçiyorsun? Nutrition MCP ile <a href="/alternatives" data-link="alternatives">MyFitnessPal, Cronometer ve diğer takip uygulamalarının</a> karşılaştırmasına bak.',
    },

    trust: [
        {
            label: "Varsayılan olarak gizli",
            small: "Asla satılmaz, paylaşılmaz veya reklam için kullanılmaz.",
        },
        {
            label: "Açık kaynak",
            small: "İncele ya da kendi sunucunda barındır.",
        },
        {
            label: "İstediğin zaman dışa aktar",
            small: "Sakladığımız her şey, tek bir ZIP içinde CSV olarak.",
        },
        { label: "Anında sil", small: "Hesabını ve verilerini kaldır." },
    ],

    support: {
        title: "Ayakta kalmasına yardım et.",
        sub: "Nutrition MCP ücretsiz ve reklamsız. Sunucu ve veri tabanı masraflarını Patreon karşılıyor.",
        updatesTitle: "Patreon üzerinden en yeniler",
        updatesBadge: "Ücretsiz",
        updatesNote: "Okuması ücretsiz — üyelik gerekmez.",
        updatesPrevLabel: "Önceki güncelleme",
        updatesNextLabel: "Sonraki güncelleme",
        updatesDotLabel: "Güncelleme",
        postLinkLabel: "Patreon üzerinde oku",
        free: {
            tier: "Ücretsiz üye",
            price: "$0",
            desc: "Takipte kal — sunucu, yeni araçlar ve sırada ne olduğu hakkında haber ve güncellemeler al.",
            cta: "Patreon üzerinde takip et",
        },
        paid: {
            tier: "Ücretli üye",
            price: "İstediğin kadar öde",
            desc: "Nutrition MCP sana yarıyorsa barındırma ve veri tabanı masraflarına yardım edebilirsin. Destekçiler dahil herkes aynı özellikleri alır ve herkes için ücretsiz kalır.",
            cta: "Destekçi ol",
        },
    },

    cta: {
        title: "Bir dakikadan kısa sürede takibe başla.",
        sub: "Ücretsiz ve açık kaynak — hâlihazırda kullandığın yapay zekâyla çalışır.",
        primary: "Hızlı kurulum",
        secondary: "GitHub üzerinde yıldız ver",
    },

    contact: {
        title: "Soru ya da geri bildirim?",
        sub: "Bir hata mı buldun, bir özellik mi istiyorsun ya da aklına bir soru mu takıldı? Bana doğrudan e-posta gönder — her mesajı okuyorum.",
        cta: "E-posta gönder",
    },

    faqSection: {
        title: "Sık sorulan sorular",
    },
    faq: [
        {
            question: "Nutrition MCP nedir?",
            visibleHtml:
                "Nutrition MCP; Claude, ChatGPT ya da başka bir MCP istemcisini bir kalori ve makro takipçisine dönüştüren ücretsiz, açık kaynak bir Model Context Protocol (MCP) sunucusudur. Bir besin veri tabanında arama yapmak yerine yapay zekâna ne yediğini söylersin; o da kaloriyi, makroları, lifi, şekeri, ilave şekeri ve kafeini kendi yemek kaydına işler.",
        },
        {
            question: "Model Context Protocol (MCP) nedir?",
            visibleHtml:
                "Model Context Protocol, Claude ve ChatGPT gibi yapay zekâ asistanlarının harici araçlara ve veri kaynaklarına bağlanmasını sağlayan açık bir standarttır. Bir MCP sunucusu, yapay zekânın bir sohbet sırasında kullanabileceği belirli yetenekler sunar — burada beslenme takibi. Bunu yapay zekâ asistanları için bir eklenti sistemi olarak düşün.",
        },
        {
            question: "Claude veya ChatGPT ile kalori nasıl takip edilir?",
            visibleHtml:
                "Nutrition MCP bağlantısını bir kez kur — Claude içinde bağlayıcı dizininden, ChatGPT içinde sunucu adresiyle özel bir uygulama olarak — ve giriş yap. Sonra yapay zekâna kendi kelimelerinle ne yediğini söyle, yemeğin fotoğrafını göster ya da bir ürün barkodu ver. Yapay zekân kaloriyi, proteini, karbonhidratı, yağı, lifi, şekeri ve ilave şekeri tahmin eder, Nutrition MCP de kaydı yemek kaydına ekler. Bugünün toplamlarını, haftalık eğilimleri ya da hedeflerine ne kadar yaklaştığını istediğin zaman sor.",
        },
        {
            // Görünen yanıt sunucu adresini bilinçli olarak atlıyor (adres
            // sayfanın başka bir yerinde zaten yazılı); arama motorlarının
            // tek başına okuduğu JSON-LD yanıtı ise adresi açıkça yazıyor. Bu
            // fark İngilizce kaynakta da vardı — sessizce eşitlenmek yerine
            // olduğu gibi korundu.
            question: "ChatGPT ile çalışıyor mu?",
            visibleHtml:
                "Evet. Web üzerindeki ChatGPT içinde Settings → Apps bölümünü aç, OAuth kullanarak sunucu adresiyle özel bir uygulama oluştur ve giriş yap. Özel bir uygulama oluşturmak için ChatGPT uygulamasının Developer mode özelliği gerekir; OpenAI bunu bazı ChatGPT planlarında sunuyor.",
            jsonLdText:
                "Evet. Web üzerindeki ChatGPT içinde Settings → Apps bölümünü aç, OAuth kullanarak https://nutrition-mcp.com/mcp sunucu adresiyle özel bir uygulama oluştur ve giriş yap. Özel bir uygulama oluşturmak için ChatGPT uygulamasının Developer mode özelliği gerekir; OpenAI bunu bazı ChatGPT planlarında sunuyor.",
        },
        {
            question: "Başka hangi istemciler destekleniyor?",
            visibleHtml:
                "PKCE ile OAuth 2.0 destekleyen her MCP istemcisi — Claude.ai, Claude masaüstü ve mobil uygulamaları, Claude Code, Cursor, Windsurf ve VS Code dahil.",
        },
        {
            question: "Kendi sunucumda barındırabilir miyim?",
            visibleHtml:
                'Evet. Nutrition MCP açık kaynaktır (MIT). Kendi Supabase projenle kendi örneğini çalıştırabilirsin — <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">GitHub deposu</a> eksiksiz bir kendi sunucunda barındırma kılavuzu ve bir Dockerfile içerir.',
        },
        {
            question: "Nutrition MCP ücretsiz mi?",
            visibleHtml:
                "Evet, tamamen ücretsiz — ücretli paket yok, reklam yok, gizli masraf yok. MCP bağlayıcılarını destekleyen bir yapay zekâ uygulamasına (örneğin Claude veya ChatGPT) ve ilk bağlandığında oluşturduğun ücretsiz bir Nutrition MCP hesabına ihtiyacın var. Patreon üzerindeki gönüllü bağışlar sunucu masraflarını karşılamaya yardım eder ve hiçbir şeyin kilidini açmaz.",
        },
        {
            question: "Neleri takip edebilirim?",
            visibleHtml:
                "Her kayıt için kalori, protein, karbonhidrat, yağ, lif, toplam şeker, ilave şeker ve su — gündelik dille anlatılmış ya da Open Food Facts üzerinden bir ürün barkoduyla getirilmiş. Bir yemek malzeme malzeme, her biri kendi miktarı ve besin değerleriyle kaydedilebilir; sık yediğin bir yemek de kayıtlı yemek olarak saklanıp adıyla yeniden kaydedilebilir. Kafein de takip edilir; her etiketin kullandığı birim olan miligram cinsinden ve hiç kalori eklemeden. Alkol da takip edilebilir, saf etanol gramı olarak; alkol takibini açtığında görünür hâle gelir. Vücut kilonu kg veya lb cinsinden kaydedip bir hedef kiloya doğru eğilimleri izleyebilirsin. Vücut ölçüleri (bel, kalça, boyun, göğüs, omuz, üst kol, ön kol, uyluk ve baldır) de cm veya inç cinsinden kaydedilebilir. Günlük özetleri görüntüle, yemekleri tarih aralığına göre sorgula, eski kayıtları güncelle ya da sil, hedefler belirle ve zaman içindeki eğilimleri izle.",
        },
        {
            question:
                "Sık yediğim yemekleri ya da kendi tariflerimi kaydedebilir miyim?",
            visibleHtml:
                "Evet. Bir yemeği bir adla kaydetmesini iste — yalnızca toplamlarıyla ya da malzemeleriyle birlikte bir tarif olarak — ve bir porsiyonluk değerleri saklanır. Bir dahaki sefere adını söylemen yeter, tek adımda kaydedilir: porsiyon sayısına göre ölçeklenir, tek bir malzeme gerçekten yediğin miktara ayarlanabilir ya da çıkarılabilir. Kaydedilen yemek bir kopyadır, bu yüzden kayıtlı yemeği sonradan düzenlemek ya da silmek ondan kaydedilmiş yemekleri hiç değiştirmez. Kayıtlı yemekler veri dışa aktarımına dahildir.",
        },
        {
            question: "Kalori sayıları ne kadar isabetli?",
            visibleHtml:
                "Bunlar tahmindir. Anlattığın ya da fotoğrafladığın bir yemekte değerleri yapay zekân tahmin eder; barkodda ise değerler Open Food Facts içindeki ürün etiketi verisinden gelir ve yapay zekân bunları yediğin miktara göre ölçekler. İkisi de yanlış olabilir, bu yüzden önemli olan her şeyi kontrol et — sadece söyleyerek herhangi bir kaydı düzeltebilir ya da silebilirsin. Nutrition MCP bir kayıt aracıdır, tıbbi ya da diyet tavsiyesi değildir: sağlığınla ilgili karar vermeden önce bir doktora ya da diyetisyene danış, özellikle hamileysen, bir sağlık sorunun varsa ya da geçmişinde bir yeme bozukluğu varsa.",
        },
        {
            question: "Alkolü takip ediyor mu?",
            visibleHtml:
                "Evet, sen açarsan: alkol takibi varsayılan olarak kapalıdır ve sen açana kadar alkol yemeklerinden, hedeflerinden ve özetlerinden gizli kalır. Sonrasında içkiler saf etanol gramı olarak ve tercihine göre ABD standart içkisi ya da Birleşik Krallık birimi olarak gösterilir. Hiçbir şey senin yerine alkol çıkarımı yapmaz: alkol yalnızca kaydettiğin bir içkiden ya da içe aktardığın bir dosyadaki alkol kolonundan kaydedilir ve kaydettiğin bir içki, takip kapalıyken de saklanır. Tekrar kapatmak alkolü yeniden gizler ve içe aktarıcının alkol kolonlarını okumasını durdurur — bu bir silme düğmesi değildir ve dışa aktardığın veri her zaman kaydettiklerini içerir. Bir alkol değerini kaldırmak için ait olduğu yemeği sil.",
        },
        {
            question:
                "Geçmişimi MyFitnessPal veya başka bir uygulamadan içe aktarabilir miyim?",
            visibleHtml:
                "Evet. Geçmişini içe aktarmak istediğini söyle; sohbette bir içe aktarıcı açılır: eski uygulamanın dışa aktardığı CSV dosyasını seçersin, kolonlarının nasıl eşlendiğini kontrol edersin ve onaylamadan önce neyin ekleneceğini görürsün. MyFitnessPal, Cronometer, Lose It! ve MacroFactor dosyaları otomatik olarak tanınır; başka herhangi bir CSV dosyası da kolonları kendin eşleyerek çalışır. Dosyayı tarayıcın okur, böylece yapay zekâ satırlarını asla yeniden yazmaz. Sohbet içi panelleri olmayan istemcilerde dışa aktardığın veriyi yapıştırabilirsin — ve aynı dosyayı yeniden aktarmak, arada saat dilimin değişmediği sürece kopya oluşturmaz.",
        },
        {
            question: "Verilerim gizli mi?",
            visibleHtml:
                'Kayıtların AB içinde saklanır ve bağladığın yapay zekâ uygulamaları üzerinden eriştiğin kendi hesabına bağlıdır. Nutrition MCP verilerini asla satmaz, asla üçüncü taraflarla paylaşmaz ve asla reklam için kullanmaz; ana sayfa yalnızca site genelindeki anonim toplamları gösterir. Yapay zekânın araçlar üzerinden okuduğu her şey, o yapay zekânın sağlayıcısına seninle arasındaki anlaşma kapsamında gönderilir. Hakkında sakladığımız her şeyi istediğin zaman dışa aktarabilir ya da hesabını ve tüm verilerini silebilirsin — ayrıntılar <a href="/privacy" data-link="privacy">gizlilik politikasında</a>.',
        },
    ],
};
