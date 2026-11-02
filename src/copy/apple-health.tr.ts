// Turkish /apple-health guide. See src/copy/apple-health.ts for the content
// model and which fields are raw HTML. The shortcut's name, its menu items
// (Sync now, Status, Disconnect) and the automation input `auto` stay in
// English: one shared shortcut serves every locale.

import type { AppleHealthDoc } from "./apple-health.js";

export const APPLE_HEALTH_TR: AppleHealthDoc = {
    meta: {
        title: "Apple Health kısayolları",
        description:
            "Nutrition MCP ile Apple Health arasında bağlantı kuran iki ücretsiz iPhone kısayolu: Nutrition MCP Health, yapay zekânla sohbet ederek kaydettiğin günlük toplamları (kalori, protein, karbonhidrat, yağ, lif, kafein ve istersen su) Apple Health içine kopyalar; Nutrition MCP Activity ise günlük Aktif Enerjini aktif kalori olarak geri getirir.",
        ogDescription:
            "Günlük toplamlar Apple Health içine, Aktif Enerji ise Nutrition MCP içine: iki ücretsiz iPhone kısayolu, birini ya da ikisini birden kullan.",
    },
    tocLabel: "Bu sayfada",
    hero: {
        eyebrow: "Apple Health · iPhone",
        title: "Nutrition MCP ve Apple Health, iki yönde",
        lead: "İki ücretsiz iPhone kısayolu, her yön için biri. Biri yediklerini Apple Health içine kopyalar, öteki yaktığın enerjiyi Nutrition MCP'ye geri getirir. Birini ya da ikisini birden kullan: kendi başlarına bağlanır, eşitlenir ve bağlantıları kesilir.",
        health: {
            flow: "Nutrition MCP → Apple Health",
            title: "Günlük toplamların, Apple Health içinde",
            items: [
                "Tamamlanan her gün için besin başına bir kayıt, saat <strong>12:00</strong>'de, <strong>Kısayollar</strong> kaynağından.",
                "Bir gün, kendi saat diliminde ertesi sabah <strong>05:00</strong>'te tamamlanır; yani dün, bugün 05:00'ten sonra gelir. Bugün hiçbir zaman orada olmaz.",
            ],
        },
        activity: {
            flow: "Apple Health → Nutrition MCP",
            title: "Aktif Enerjin, aktif kalori olarak",
            items: [
                "Bugün ve önceki 2 gün için <strong>Aktif Enerji</strong> toplamın, yediklerinin yanında gösterilir. Kalori hedefin asla değişmez.",
                "Her gün tek bir kayıt, her eşitlemede yenilenir; bu yüzden sık eşitlemek bir günü asla iki kez saymaz.",
            ],
        },
        nutrientsLabel: "Her gün gönderilenler",
        nutrients: {
            energy_kcal: "Beslenme Enerjisi",
            protein_g: "Protein",
            carbohydrates_g: "Karbonhidratlar",
            fat_g: "Toplam Yağ",
            fiber_g: "Lif",
            caffeine_mg: "Kafein",
            water_ml: "Su",
        },
        waterNote: "istersen",
        alcoholNote: "Alkol hiçbir zaman gönderilmez.",
        readLabel: "Her eşitlemede okunan",
        activeEnergy: "Aktif Enerji",
    },
    before: {
        title: "Başlamadan önce",
        items: [
            "<strong>Kısayollar</strong> ve <strong>Sağlık</strong> uygulamalarının bulunduğu bir iPhone. İkisi de iOS ile birlikte gelir.",
            "Claude ya da ChatGPT gibi yapay zekâ uygulamana zaten bağlı bir Nutrition MCP hesabı. İki kısayol da tam olarak o hesapla giriş yapar.",
            "Önerilir: profilinde saat dilimini ayarla, çünkü bir günün nerede bittiğini o belirler. Sohbette <em>&ldquo;saat dilimimi ayarla&rdquo;</em> demen yeterli. Hiç ayarlamazsan, bağlanırken iPhone cihazının bildirdiği saat dilimi kullanılır.",
        ],
    },
    install: {
        title: "Kısayolları kur",
        lead: "Birini ya da ikisini birden kur. iPhone cihazında bir bağlantı aç ve <strong>Kısayolu Ekle</strong>'ye dokun; kısayol Kısayollar uygulamasında kendi adıyla görünür.",
        button: "Kısayolu al",
        pending: "Bağlantı yakında burada yayınlanacak.",
        leadPending:
            "Kısayollar henüz yayınlanmadı. Yayınlandığında iPhone cihazında bir bağlantı açacak ve <strong>Kısayolu Ekle</strong>'ye dokunacaksın; kısayol Kısayollar uygulamasında kendi adıyla görünecek. Aşağıdaki adımlar bundan sonra ne olacağını gösteriyor.",
        healthBlurb: "Günlük toplamları Apple Health içine gönderir.",
        activityBlurb: "Aktif Enerjini Apple Health içinden okur.",
        nameNote:
            "Adları tam olarak <strong>Nutrition MCP Health</strong> ve <strong>Nutrition MCP Activity</strong> kalsın. Giriş sayfası her kısayolu adıyla yeniden açar; biri yeniden adlandırılırsa bağlanma yarı yolda durur.",
    },
    connect: {
        title: "Kısayolları bağla",
        steps: [
            "Kısayollar uygulamasında kısayola dokunup çalıştır.",
            "Sorularını yanıtla (aşağıda), ardından Safari bir giriş sayfası açar. <strong>Yapay zekâ uygulamanın kullandığı hesapla</strong> giriş yap. Sayfada Apple Health bağlantısıyla ilgili bir uyarı görünür: bunu az önce kendi iPhone cihazındaki kısayoldan sen başlattıysan devam et, başka durumda etme.",
            "Safari, Kısayollar uygulamasının açılmasını isteyip istemediğini sorduğunda <strong>Aç</strong>'a dokun. Kısayol bağlanmayı tamamlar.",
        ],
        health: {
            label: "Nutrition MCP Health sorar",
            items: [
                "<strong>su</strong> da gönderilsin mi (Apple Watch ya da başka bir uygulama suyu zaten kaydediyorsa kapalı bırak) ve hangi günler gönderilsin, <strong>From today</strong> mı <strong>Also the last 7 days</strong> mi.",
                "İlk gün gönderildiğinde Apple Health, Kısayollar uygulamasının neleri yazabileceğini sorar: <strong>her türü</strong> aç ve <strong>İzin Ver</strong>'e dokun. <strong>Also the last 7 days</strong> seçtiysen ve o günlerde yemek kaydettiysen bu hemen gerçekleşir. Başka durumda gönderilecek bir şey henüz yoktur; yarın 05:00'ten sonra kısayolu açıp bir kez <strong>Sync now</strong> seçeneğine dokunarak soruyu yanıtla.",
            ],
        },
        activity: {
            label: "Nutrition MCP Activity sorar",
            items: [
                "Giriş öncesinde hiçbir şey, yalnızca neyi okuduğunu kısaca anlatan bir uyarı. İlk eşitlemesi bağlandıktan hemen sonra çalışır.",
                "Apple Health, Kısayollar uygulamasının <strong>Aktif Enerji</strong> okumasına izin verip vermeyeceğini sorar: <strong>İzin Ver</strong>'e dokun. Ardından iOS, kısayolun sağlık örneklerini nutrition-mcp.com sunucusuna gönderip gönderemeyeceğini sorar: <strong>Her Zaman İzin Ver</strong>'i seç, yoksa her otomatik çalışma bu soruda durur.",
            ],
        },
        note: "Her giriş bağlantısı bir kez ve 30 dakika boyunca çalışır. Süresi dolarsa kısayolu yeniden çalıştır. İki kısayolu birbiri ardına bağla, aynı anda değil. Nutrition MCP Health ile ilk tamamlanan günün yarın 05:00'ten sonra gelir; son 7 günü seçtiysen onlar hemen gönderilir.",
    },
    automate: {
        title: "Otomatik hale getir",
        lead: "Paylaşılan bir kısayol otomasyonlarını yanında getirmez, bu yüzden kullandığın her kısayol için onları Kısayollar uygulamasının <strong>Otomasyon</strong> sekmesinde bir kez oluştur. Her birinin ilk tetikleyicisi önemli olanıdır; diğerleri onu telafi eder.",
        healthLabel: "Nutrition MCP Health",
        healthTriggers: [
            {
                when: "Uygulama → Sağlık → Açıldığında",
                tag: "Ana",
                body: "Sağlık uygulamasını açtığın an, verilerin güncel olmasını istediğin tam o andır.",
            },
            {
                when: "Alarm → Durdurulduğunda",
                tag: "Sabah telafisi",
                body: "05:00'ten sonra durdurulan bir alarm, örneğin uyanma alarmın, dünü tamamlanır tamamlanmaz gönderir.",
            },
            {
                when: "Şarj Aleti → Bağlandığında",
                tag: "İsteğe bağlı",
                body: "Geceleyin ya da masanda şarja takmak, eşitlemek için bir şans daha.",
            },
        ],
        activityLabel: "Nutrition MCP Activity",
        activityTriggers: [
            {
                when: "Uygulama → Claude ya da ChatGPT → Açıldığında",
                tag: "Ana",
                body: "Yapay zekâ uygulamanı açtığın an, günün nasıl geçtiğini sormak üzeresindir; böylece sormadan önce bugünün yakımı güncel olur.",
            },
            {
                when: "Uygulama → Sağlık ya da Fitness → Açıldığında",
                tag: "Bir de",
                body: "Halkalarına ya da antrenmanlarına baktığın her an, eşitlemek için bir şans daha.",
            },
            {
                when: "Günün saati",
                tag: "Gün boyunca",
                body: "&ldquo;Her saat&rdquo; tetikleyicisi yok; bu yüzden birkaç tane ekle, örneğin 12:00, 18:00 ve 22:00'de, iki uygulamayı da açmadığın günleri yakalamak için.",
            },
        ],
        stepsLabel: "Her biri için",
        steps: [
            "Kısayollar uygulamasında <strong>Otomasyon</strong> sekmesini aç ve kişisel bir otomasyon oluşturmak için <strong>+</strong>'ya dokun.",
            "Tetikleyiciyi seç, örneğin <strong>Uygulama</strong> → <strong>Sağlık</strong> → <strong>Açıldığında</strong>.",
            "<strong>Hemen Çalıştır</strong>'ı seç ve iPhone cihazın sunuyorsa <strong>Çalıştırıldığında Bildir</strong> seçeneğini kapat.",
            "<strong>Kısayol Çalıştır</strong> eylemini ekle, <strong>Nutrition MCP Health</strong> ya da <strong>Nutrition MCP Activity</strong> kısayolunu seç ve girdisini <code>auto</code> metni olarak ayarla.",
        ],
        note: "<code>auto</code> girdisi otomatik çalışmaları sessiz tutar: yalnızca ilgilenmen gereken bir şey olduğunda bildirim gönderirler. Kesin bir saate gerek yok: Nutrition MCP Health her eşitlemede son 7 tamamlanmış güne geri bakar, Nutrition MCP Activity ise bugünü ve önceki 2 günü yeniden gönderir; böylece kaçırılan bir çalışma kendiliğinden telafi edilir.",
    },
    everyday: {
        title: "Günlük kullanım",
        healthLabel: "Nutrition MCP Health",
        healthCards: [
            {
                title: "Bir şeyi kaydetmeyi unuttun mu?",
                body: "Her zamanki gibi sohbette ekle. O gün zaten gönderildiyse ve son 7 gün içindeyse, bir sonraki eşitleme günü 12:01, 12:02 gibi küçük ek kayıtlarla tamamlar. Yaklaşık 20 kcal ya da 2 g altındaki değişiklikler atlanır; çok büyük bir sıçrama ya da 9 ek kayıttan sonraki bir değişiklik, elle girmen için bildirim olarak gelir.",
            },
            {
                title: "Bir yemeği sildin ya da azalttın mı?",
                body: "Apple Health bir değere ekleme yapabilir ama bir değeri düşüremez, bu yüzden günün şimdi ne kadar yüksek kaldığını söyleyen bir bildirim alırsın. Düzeltmek için Sağlık uygulamasında <strong>Göz At</strong> → <strong>Beslenme</strong> yolunu izle, türü seç, <strong>Tüm Verileri Göster</strong>'e dokun ve o güne ait Kısayollar kayıtlarının üzerinde sola kaydırıp onları sil, sonra bildirimdeki doğru toplamı elle gir. <strong>Kısayollar Uygulamasındaki Tüm Verileri Sil</strong> seçeneğini asla kullanma: o, diğer kısayollarının kaydettiklerini de siler.",
            },
            {
                title: "Elle çalıştır",
                body: "Menüsü için Kısayollar uygulamasında <strong>Nutrition MCP Health</strong> kısayoluna dokun: <strong>Sync now</strong> bekleyen her şeyi gönderir, <strong>Status</strong> gönderilen son günü ve bir sonrakinin ne zaman hazır olacağını gösterir, <strong>Disconnect</strong> ise bağlantıyı sona erdirir.",
            },
            {
                title: "Yapay zekâ uygulamandan kontrol et",
                body: "Yapay zekâna profilini göstermesini söyle (<code>get_profile</code>): her kısayolun ne zaman bağlandığını, Nutrition MCP Health için hangi güne kadar gönderildiğini ve her birinin en son ne zaman çalıştığını yazar.",
            },
        ],
        activityLabel: "Nutrition MCP Activity",
        activityCards: [
            {
                title: "Göndermek istediğinde büyük kalori sayıları mı görünüyor?",
                body: "Merak etme. Göndermeden önce iOS, Sağlık uygulamasındaki ham günlük toplamları, tüm ondalıklarıyla ve bölgenin sayı biçiminde gösterir; ondalık ayracı virgül olduğu için <strong>922,774 kcal</strong> yazıyorsa bu, yaklaşık 923 kilokalori demektir. Kısayol her günü göndermeden önce tam kilokaloriye yuvarlar; listelenen <strong>0 kcal</strong> kayıtları ise hiçbir şey eklemez.",
            },
            {
                title: "Sohbette bir antrenman da kaydettin mi?",
                body: "Kısayolun gönderdiği bir günde Apple Health toplamı sayılır; sohbette kaydettiğin antrenmanlar kayıtlarında kalır ama üstüne eklenmez, çünkü saatinin Aktif Enerji değeri bunları zaten içerir. Diğer günlerde normal şekilde sayılırlar.",
            },
            {
                title: "Bir gün 0 mı görünüyor?",
                body: "Aktif Enerji değeri olmayan ya da Sağlık uygulamasının kısayola okuma izni vermediği bir gün hiçbir şey göndermez ve hiçbir şeyi değiştirmez. Her gün 0'da kalıyorsa, Sağlık → <strong>Paylaşım</strong> → <strong>Uygulamalar</strong> → <strong>Kısayollar</strong> yolunda Kısayollar uygulamasına Aktif Enerji verisini okuma izni ver.",
            },
            {
                title: "Elle çalıştır",
                body: "Menüsü için Kısayollar uygulamasında <strong>Nutrition MCP Activity</strong> kısayoluna dokun: <strong>Sync now</strong> bugünü ve önceki 2 günü gönderir, <strong>Status</strong> gönderilen son günü gösterir, <strong>Disconnect</strong> ise onun bağlantısını sona erdirir ve <strong>Nutrition MCP Health</strong> bağlı kalır.",
            },
        ],
    },
    privacy: {
        title: "Gizlilik ve sınırlar",
        items: [
            "Nutrition MCP Health: sunucumuz bağlantıyı ve 8 gün boyunca gönderdiği toplamların kaydını tutar; böylece her gün bir kez gönderilir, sonrasında yalnızca tamamlanır. Apple tarafına hiçbir şey göndermeyiz; kısayol toplamlarını sunucumuzdan ister ve onları iPhone cihazındaki Sağlık uygulamasına yazar, orada kendi Apple ayarların geçerlidir.",
            "Nutrition MCP Activity yalnızca günlük <strong>Aktif Enerji</strong> toplamını okur; Sağlık uygulamasından başka hiçbir şey okumaz. Sunucumuz bu toplamları aktif kalori olarak saklar; veri dışa aktarmanda yer alır ve hesabınla birlikte silinir, tıpkı sohbette kaydettiklerin gibi.",
            "Her kısayol kendi erişim jetonunu, iPhone cihazındaki Kısayollar uygulamasının kendi deposunda tutar; bir dosyada değil. Kısayollar uygulaması bunu iCloud üzerinden diğer cihazlarına eşitleyebilir. Cihazlarında bir kısayolu çalıştırabilen herkes, sen bağlantıyı kesene kadar onun eşitlemesini kullanabilir; bu yüzden kısayolları yalnızca kendi kullandığın cihazlarda tut.",
            "Dilediğin zaman bir kısayolun <strong>Disconnect</strong> seçeneğini kullan; o kısayolun bağlantısı hemen silinir, Nutrition MCP Health için de kaydı. Her bağlantı ayrıca eşitleme olmadan 90 gün geçtiğinde ve bağlandıktan 365 gün sonra kendiliğinden sona erer. Apple Health içinde zaten olanlar, sen silene kadar orada kalır; gönderilmiş aktif kaloriler de sen silene kadar kalır.",
        ],
        policyLink: "Gizlilik politikasını oku",
    },
    troubleshooting: {
        title: "Sorun giderme",
        lead: "Bir şey tutmuyor mu? Bu yanıtlar sık görülen durumları kapsıyor.",
        readMore: "Yanıtı oku",
    },
    selfHost: {
        textHtml:
            "Kendi sunucunu mu çalıştırıyorsun? Kısayolların adım adım nasıl oluşturulduğu {link} ve {activityLink} içinde anlatılıyor.",
        linkText: "Nutrition MCP Health yapım kılavuzu",
        activityLinkText: "Nutrition MCP Activity yapım kılavuzu",
    },
};
