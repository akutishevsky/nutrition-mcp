// Turkish /apple-health guide. See src/copy/apple-health.ts for the content
// model and which fields are raw HTML. The shortcut's name, its menu items
// (Sync now, Status, Disconnect) and the automation input `auto` stay in
// English: one shared shortcut serves every locale.

import type { AppleHealthDoc } from "./apple-health.js";

export const APPLE_HEALTH_TR: AppleHealthDoc = {
    meta: {
        title: "Apple Health eşitlemesi",
        description:
            "Ücretsiz Nutrition MCP Health kısayolunu iPhone cihazında kur: yapay zekânla sohbet ederek kaydettiğin günlük toplamları (kalori, protein, karbonhidrat, yağ, lif, kafein ve istersen su) Apple Health içine kopyalar.",
        ogDescription:
            "Yapay zekânla kaydettiğin günlük toplamları tek bir ücretsiz iPhone kısayoluyla Apple Health içine kopyala.",
    },
    tocLabel: "Bu sayfada",
    hero: {
        eyebrow: "Apple Health eşitlemesi · iPhone",
        title: "Günlük toplamların Apple Health içinde",
        lead: "Ücretsiz bir iPhone kısayolu, tamamlanan her günün toplamlarını Nutrition MCP tarafından Apple Health içine kopyalar. Kaydı yine yapay zekâ uygulaman tutar; kısayol yalnızca bitmiş günleri gönderir.",
        seeTitle: "Apple Health içinde ne göreceksin",
        seeItems: [
            "Tamamlanan her gün için besin başına bir kayıt, saat <strong>12:00</strong>'de, <strong>Kısayollar</strong> kaynağından.",
            "Bir gün, kendi saat diliminde ertesi sabah <strong>05:00</strong>'te tamamlanır; yani dün, bugün 05:00'ten sonra gelir. Bugün hiçbir zaman orada olmaz.",
        ],
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
    },
    before: {
        title: "Başlamadan önce",
        items: [
            "<strong>Kısayollar</strong> ve <strong>Sağlık</strong> uygulamalarının bulunduğu bir iPhone. İkisi de iOS ile birlikte gelir.",
            "Claude ya da ChatGPT gibi yapay zekâ uygulamana zaten bağlı bir Nutrition MCP hesabı. Kısayol tam olarak o hesapla giriş yapar.",
            "Önerilir: profilinde saat dilimini ayarla, çünkü bir günün nerede bittiğini o belirler. Sohbette <em>&ldquo;saat dilimimi ayarla&rdquo;</em> demen yeterli. Hiç ayarlamazsan, bağlanırken iPhone cihazının bildirdiği saat dilimi kullanılır.",
        ],
    },
    install: {
        title: "Kısayolu kur",
        lead: "Bağlantıyı iPhone cihazında aç ve <strong>Kısayolu Ekle</strong>'ye dokun. Kısayollar uygulamasında <strong>Nutrition MCP Health</strong> adıyla görünür.",
        button: "Kısayolu al",
        pending: "Kısayol bağlantısı yakında burada yayınlanacak.",
        leadPending:
            "Kısayol henüz yayınlanmadı. Yayınlandığında bağlantısını iPhone cihazında açacak ve <strong>Kısayolu Ekle</strong>'ye dokunacaksın; ardından Kısayollar uygulamasında <strong>Nutrition MCP Health</strong> adıyla görünecek. Aşağıdaki adımlar bundan sonra ne olacağını gösteriyor.",
        nameNote:
            "Adı tam olarak <strong>Nutrition MCP Health</strong> kalsın. Giriş sayfası kısayolu bu adla yeniden açar; adı değiştirilirse bağlanma yarı yolda durur.",
    },
    connect: {
        title: "Bağla",
        steps: [
            "Kısayollar uygulamasında <strong>Nutrition MCP Health</strong> kısayoluna dokunup çalıştır.",
            "İki soruyu yanıtla: <strong>su</strong> da gönderilsin mi (Apple Watch ya da başka bir uygulama suyu zaten kaydediyorsa kapalı bırak) ve hangi günler gönderilsin, <strong>From today</strong> mı <strong>Also the last 7 days</strong> mi.",
            "Safari bir giriş sayfası açar. <strong>Yapay zekâ uygulamanın kullandığı hesapla</strong> giriş yap. Sayfada Apple Health bağlantısıyla ilgili bir uyarı görünür: bunu az önce kendi iPhone cihazındaki kısayoldan sen başlattıysan devam et, başka durumda etme.",
            "Safari, Kısayollar uygulamasının açılmasını isteyip istemediğini sorduğunda <strong>Aç</strong>'a dokun. Kısayol bağlanmayı tamamlar.",
            "İlk gün gönderildiğinde Apple Health, Kısayollar uygulamasının neleri yazabileceğini sorar: <strong>her türü</strong> aç ve <strong>İzin Ver</strong>'e dokun. <strong>Also the last 7 days</strong> seçtiysen ve o günlerde yemek kaydettiysen bu hemen gerçekleşir. Başka durumda gönderilecek bir şey henüz yoktur; yarın 05:00'ten sonra kısayolu açıp bir kez <strong>Sync now</strong> seçeneğine dokunarak soruyu yanıtla.",
        ],
        note: "Giriş bağlantısı bir kez ve 30 dakika boyunca çalışır. Süresi dolarsa kısayolu yeniden çalıştır. İlk tamamlanan günün yarın 05:00'ten sonra gelir; son 7 günü seçtiysen onlar hemen gönderilir.",
    },
    automate: {
        title: "Otomatik hale getir",
        lead: "Paylaşılan bir kısayol otomasyonlarını yanında getirmez, bu yüzden onları Kısayollar uygulamasının <strong>Otomasyon</strong> sekmesinde bir kez oluştur. Önemli olan ilki; diğerleri, Sağlık uygulamasını açmadığın günleri telafi eder.",
        triggersLabel: "Ne zaman çalışsın",
        triggers: [
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
        stepsLabel: "Her biri için",
        steps: [
            "Kısayollar uygulamasında <strong>Otomasyon</strong> sekmesini aç ve kişisel bir otomasyon oluşturmak için <strong>+</strong>'ya dokun.",
            "Tetikleyiciyi seç, örneğin <strong>Uygulama</strong> → <strong>Sağlık</strong> → <strong>Açıldığında</strong>.",
            "<strong>Hemen Çalıştır</strong>'ı seç ve iPhone cihazın sunuyorsa <strong>Çalıştırıldığında Bildir</strong> seçeneğini kapat.",
            "<strong>Kısayol Çalıştır</strong> eylemini ekle, <strong>Nutrition MCP Health</strong> kısayolunu seç ve girdisini <code>auto</code> metni olarak ayarla.",
        ],
        note: "<code>auto</code> girdisi otomatik çalışmaları sessiz tutar: yalnızca ilgilenmen gereken bir şey olduğunda bildirim gönderirler. Kesin bir saate gerek yok: her eşitleme son 7 tamamlanmış güne geri bakar, böylece kaçırılan bir sabah kendiliğinden telafi edilir.",
    },
    everyday: {
        title: "Günlük kullanım",
        cards: [
            {
                title: "Bir şeyi kaydetmeyi unuttun mu?",
                body: "Her zamanki gibi sohbette ekle. O gün zaten gönderildiyse ve son 7 gün içindeyse, bir sonraki eşitleme günü 12:01, 12:02 gibi küçük ek kayıtlarla tamamlar. Yaklaşık 20 kcal ya da 2 g altındaki değişiklikler atlanır; çok büyük bir sıçrama ya da 9 tamamlamadan sonraki bir değişiklik, elle girmen için bildirim olarak gelir.",
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
                body: "Yapay zekâna profilini göstermesini söyle (<code>get_profile</code>): eşitlemenin ne zaman bağlandığını, hangi güne kadar gönderdiğini ve en son ne zaman çalıştığını yazar.",
            },
        ],
    },
    privacy: {
        title: "Gizlilik ve sınırlar",
        items: [
            "Sunucumuz bağlantıyı ve 8 gün boyunca gönderdiği toplamların kaydını tutar; böylece her gün bir kez gönderilir, sonrasında yalnızca tamamlanır. İkisi de veri dışa aktarmanda yer alır.",
            "Kısayol, erişim jetonunu bir dosyada değil, iPhone cihazındaki Kısayollar uygulamasının kendi deposunda tutar ve Kısayollar uygulaması bunu iCloud üzerinden diğer cihazlarına eşitleyebilir. Cihazlarında kısayolu çalıştırabilen herkes, sen bağlantıyı kesene kadar eşitlemeyi kullanabilir; bu yüzden kısayolu yalnızca kendi kullandığın cihazlarda tut.",
            "Apple tarafına hiçbir şey göndermiyoruz. Kısayol toplamlarını sunucumuzdan ister ve onları iPhone cihazındaki Sağlık uygulamasına yazar; oradan sonra kendi Apple ayarların geçerlidir.",
            "Dilediğin zaman <strong>Disconnect</strong> seçeneğini kullan; bağlantı ve kaydı hemen silinir. Ayrıca eşitleme olmadan geçen 90 günün ardından ve bağlandıktan 365 gün sonra kendiliğinden sona erer. Apple Health içinde zaten bulunanlar, sen silene kadar orada kalır.",
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
            "Kendi sunucunu mu çalıştırıyorsun? Kısayolun adım adım nasıl oluşturulduğu {link} içinde anlatılıyor.",
        linkText: "yapım kılavuzu",
    },
};
