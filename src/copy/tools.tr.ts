// Turkish (tr) translation of ToolsDoc for /tools. See src/copy/tools.ts for
// the structural types (TOOLS, BADGE_META, CategoryId, BadgeKind) — those
// stay untranslated and shared across every locale. Only this file's
// prose is new. Tool names, parameter names, and category slugs are never
// translated; see tools.ts's header comment for the full reasoning.

import type { ToolsDoc } from "./tools.js";

export const TOOLS_TR: ToolsDoc = {
    meta: {
        title: "Kalori, makro, su ve kilo için 48 araç",
        description:
            "Claude, ChatGPT ve diğerleri için 48 Nutrition MCP aracının tamamı: yemek kaydet, sık yediğin yemekleri kayıtlı yemek olarak sakla, barkod tara, MyFitnessPal veya Cronometer CSV dosyası içe aktar, su, kilo ve vücut ölçülerini takip et.",
        ogDescription:
            "Nutrition MCP sunucusunun yapay zekâna sunduğu 48 aracın tamamı — kayıtlı yemeklerden geçmişin için bir CSV içe aktarıcıya kadar — açıklamaları ve örnek cümleleriyle.",
    },
    hero: {
        eyebrow: "Başvuru",
        titleBeforeEm: "Yapay zekânın yapabildiği ",
        titleEm: "her şey",
        titleAfterEm: "",
        lead: "Bu araçları hiçbir zaman kendin çağırmazsın: sadece Claude, ChatGPT ya da başka bir MCP istemcisiyle konuşursun, o da doğru aracı seçer. Aşağıda Nutrition MCP sunucusunun yemekler ve kayıtlı yemekler, kalori ve makrolar, su ve kilo için sunduğu her araç var; her birinin ne yaptığı ve onu çalıştıran bir cümleyle birlikte.",
        countBold: "48 araç",
        countTail: "7 alana yayılmış",
    },
    categories: {
        "logging-food-meals": {
            pillLabel: "Kayıt",
            title: "Yemek kaydı",
            description:
                "Temel döngü: ne yediğini, nasıl anlatırsan anlat, kayda geçir; sık yediğin yemekleri de kaydet, sonra tek satırla yeniden gir.",
        },
        "reviewing-your-meals": {
            pillLabel: "İnceleme",
            title: "Yemeklerini incele",
            description:
                "Kaydettiklerine geri dön: bir gün ya da bütün bir aralık.",
        },
        water: {
            pillLabel: "Su",
            title: "Su takibi",
            description: "Yemeklerinin yanında sıvı alımını da takip et.",
        },
        weight: {
            pillLabel: "Vücut",
            title: "Kilo ve vücut ölçüleri",
            description:
                "Tartı ve mezura ölçümlerini kaydet, geri dönüp incele ve kilonun hedefine doğru nasıl gittiğini izle.",
        },
        "goals-progress": {
            pillLabel: "Hedefler",
            title: "Hedefler ve ilerleme",
            description: "Hedef belirle ve her günün nasıl geçtiğini gör.",
        },
        "insights-trends": {
            pillLabel: "İçgörüler",
            title: "İçgörüler ve eğilimler",
            description:
                "Önceden hesaplanmış analizler; böylece yapay zekâ aritmetik yapmadan örüntüleri yakalar.",
        },
        "settings-account": {
            pillLabel: "Ayarlar",
            title: "Ayarlar ve hesap",
            description:
                "Her şeyi doğru tutan tercihler ve verilerin üzerinde tam kontrol.",
        },
    },
    badges: {
        log: "Kaydet",
        widget: "Etkileşimli arayüz",
        lookup: "Sorgula",
        import: "İçe aktar",
        edit: "Düzenle",
        remove: "Sil",
        view: "Görüntüle",
        export: "Dışa aktar",
        setting: "Ayar",
    },
    ui: {
        parametersLabel: "Parametreler",
        requiredLabel: "zorunlu",
        optionalLabel: "isteğe bağlı",
        trySayingLabel: "Şöyle söyle",
        categoriesLabel: "Araç kategorileri",
    },
    tools: {
        log_meal: {
            description:
                "Ne yediğini kalori ve makrolarla kaydet; sayılar varsa lif, toplam ve ilave şeker, alkol ve kafeinle birlikte. Günlük dille anlatman yeterli: yapay zekâ sayıları tahmin eder, porsiyon belirsizse sorar ve önce bir barkoddan ya da internetten etiket bilgisi çekebilir. Malzemeleri de tek tek verebilirsin; o zaman toplamlar bu malzemelerin toplamı olur.",
            params: {
                description: "Ne yenildi",
                meal_type: "kahvaltı, öğle yemeği, akşam yemeği ya da ara öğün",
                calories: "Toplam kalori",
                protein_g: "Gram cinsinden protein",
                carbs_g: "Gram cinsinden karbonhidrat",
                fat_g: "Gram cinsinden yağ",
                fiber_g:
                    "Gram cinsinden lif. Yapay zekâdan bunu her yemekte doldurması, etiket değeri yoksa malzemelerden tahmin etmesi istenir; çünkü boş bir alan sıfır demek değildir ve o günün tamamını lif ortalamandan çıkarır",
                sugar_g:
                    "<b>Toplam</b> şeker, gram cinsinden: etiketlerin “Şeker” satırında yazan değer, yani yalnızca ilave şeker değil, meyve ve sütteki doğal şeker de dahil. Lifle aynı koşullarda her yemekte doldurulur",
                added_sugar_g:
                    "<b>İlave</b> şeker, gram cinsinden: işleme ya da hazırlama sırasında eklenen şeker (çay şekeri, şuruplar, bal, şekerli içecek ve yiyeceklerdeki şeker). Toplam şekerin bir parçasıdır, ondan asla fazla olamaz. Bütün meyvedeki, sebzedeki ve sade sütteki doğal şeker ilave sayılmaz; %100 meyve suyu da sayılmaz. Lifle aynı koşullarda her yemekte doldurulur: işlenmemiş yiyeceklerde 0, bir gazlı içecekteki şekerin tamamı ilavedir ve bir ABD etiketinde “Includes Xg Added Sugars” satırı varsa o kullanılır. <code>sugar_g</code> ile birlikte gider: toplam şekeri verilip ilave şekeri verilmeyen bir yemek kaydedilmeyebilir",
                alcohol_g:
                    "<b>Saf etanol</b> gramı; içeceğin hacmi ya da alkol derecesi değil. Yapay zekâ bunu kadeh ölçüsü ve sertlikten hesaplar (330 ml %5 bira 13 g eder)",
                caffeine_mg:
                    "Kafein, <b>miligram</b> cinsinden, gram değil: buradaki gram olmayan tek alan, çünkü her etiket ve kılavuz böyle belirtir (bir filtre kahve yaklaşık 95 mg, bir espresso 63 mg, bir kutu kola 34 mg). Kafein kalori eklemez. Lif ve şekerden farklı olarak yalnızca gerçekten kafein içeren şeyler için gönderilir; kaydedilmiş bir 0, hiç tüketmediğin bir besin için paneline kafein satırı ekler",
                logged_at:
                    "Şimdi değilse, ne zaman yediğin: sonradan kaydetmeni sağlar",
                notes: "Ek notlar",
                items: "Malzemeler, her satırda kendi miktarı ve besin değerleriyle. Her malzemede <code>calories</code>, <code>protein_g</code>, <code>carbs_g</code> ve <code>fat_g</code> bulunmalı; <code>fiber_g</code>, <code>sugar_g</code> ve <code>added_sugar_g</code> ya her malzemede ya hiçbirinde bulunmalı; <code>alcohol_g</code> ve <code>caffeine_mg</code> yalnızca onları içeren malzemelerde bulunur ve bu malzemeler üzerinden toplanır. Yemeğin toplamları o zaman malzemelerin toplamı olur, bu yüzden malzemeleri ya da toplamları gönder, ikisini birden değil",
            },
            example:
                "Öğle yemeğine ekstra guacamoleli tavuklu burrito bowl kaydet",
            photoHint:
                "…ya da tabağının fotoğrafını çek: yapay zekâ her yemeği adlandırır, porsiyonları günlük ölçülerle (bir bardak, bir tutam) tahmin eder, daha önce nasıl kaydettiğine bakar ve kaydetmeden önce sana onaylatır.",
        },
        lookup_barcode: {
            description:
                "Paketli bir ürünün etiket besin değerlerini barkodundan (8–14 haneli EAN/UPC) Open Food Facts üzerinden getir; varsa Nutri-Score ve NOVA işleme grubuyla birlikte. İlave şeker, Open Food Facts bu değeri listelediğinde gösterilir ve malzemelerden tahmin edilmişse bu belirtilir. Haneleri yazabilir ya da paketin fotoğrafından okutabilirsin; sonuç, yediğin miktara ölçeklenerek kaydedilebilir.",
            params: {},
            example: "Şu barkodu tara: 3017620422003",
            photoHint:
                "…ya da paketin fotoğrafını gönder: yapay zekâ barkod hanelerini fotoğraftan okur.",
        },
        search_foods: {
            description:
                "USDA FoodData Central genel gıdalarını (Foundation, SR Legacy ve Survey/FNDDS kayıtları) İngilizce gıda adına göre arar; her biri FoodData Central kimliği, USDA açıklaması, veri türü ile 100 g başına enerji ve makroları içeren en fazla 10 aday döndürür. Eşleşmeler USDA'nın İngilizce ifadelerini kullanır (ör. 'cooked, boiled').",
            params: {
                query: "İngilizce gıda adı, en fazla 200 karakter; ör. banana veya lentils, cooked",
            },
            example: "USDA çiğ muz için ne listeliyor?",
        },
        get_food_macros: {
            description:
                "Genel bir gıdanın USDA FoodData Central değerlerini FoodData Central kimliğiyle döndürür: 100 g başına ve amount_g verildiğinde o miktara ölçeklenmiş olarak, USDA'nın listelediği porsiyon boyutlarıyla birlikte. USDA'nın gıda için kaydetmediği bir besin öğesi, asla sıfır değil, kaydedilmemiş olarak bildirilir. Öğün araçlarının bu değerler için kabul ettiği food_ref'i de içerir.",
            params: {
                fdc_id: "Gıdanın FoodData Central kimliği; search_foods'un listelediği gibi",
                amount_g:
                    "İsteğe bağlı gram cinsinden miktar; 0'dan büyük ve 5.000'e kadar, değerlerin ölçekleneceği",
            },
            example: "Şu muzun 150 g'ı için USDA makroları nedir?",
        },
        start_meal_import: {
            description:
                "Geçmişini başka bir uygulamadan taşımak için sohbette bir içe aktarıcı aç: MyFitnessPal, Cronometer, Lose It!, MacroFactor ya da başka bir takip uygulamasından aldığın CSV dosyasını seç, kolonlarını kaloriye, makrolara, life, toplam ve ilave şekere ve kafeine — alkol takibini açtıysan alkole de — eşle ve onaylamadan önce nelerin ekleneceğini gözden geçir. Dosya tarayıcında okunur, önizlemeyi onaylamadan hiçbir şey kaydedilmez ve aynı dosyayı tekrar aktarmak kopya oluşturmaz.",
            params: {},
            example: "Yemek geçmişimi MyFitnessPal uygulamasından içe aktar",
        },
        bulk_import_meals: {
            description:
                "Geçmiş yemekleri tek tek kaydetmek yerine toplu olarak ekle: bir seferde en fazla 50 tane. Yukarıdaki içe aktarıcı da bunun üzerinden yazar ve yapay zekâ, sohbete yapıştırdığın yemek verileri için bu aracı doğrudan kullanabilir. Her satır önce denetlenir ve uymayan her şey satır satır bildirilir; böylece aynı satırları tekrar göndermek güvenlidir ve saat dilimin bu arada değişmediği sürece hâlihazırda kayıtlı olanı kopyalamaz.",
            params: {
                meals: "İçe aktarılacak satırlar, kaynak dosyadaki sırayla (çağrı başına 1–50). Her satır bir saat, yemek türü, açıklama, notlar ve kayıtlı bir yemekle aynı sayıları taşıyabilir: <code>calories</code>, <code>protein_g</code>, <code>carbs_g</code>, <code>fat_g</code>, <code>fiber_g</code>, <code>sugar_g</code> (toplam şeker), <code>added_sugar_g</code> (ilave şeker, toplamın bir parçası), <code>alcohol_g</code> (saf etanol gramı) ve <code>caffeine_mg</code> (miligram, gram değil)",
                expected_row_count:
                    "Bu çağrının kaç satır taşıdığı, kaynak dosyadan sayılmış hâliyle; böylece düşen bir satır yakalanır",
                expected_total_kcal:
                    "Kaynak dosyadaki kalori toplamı, gelenle karşılaştırılır",
                dry_run: "Hiçbir şey yazmadan ne olacağını bildir",
                on_error:
                    "Geçerli satırları aktarıp kalanları bildir ya da herhangi bir satır başarısız olursa hiçbir şey yazma",
                source_app: "Dosyanın hangi uygulamadan geldiği",
            },
            example:
                "Eski uygulamamdan yapıştırdığım geçen haftanın yemekleri — hepsini ekle",
        },
        update_meal: {
            description:
                "Kaydettiğin bir yemeğin ayrıntılarını değiştir: açıklamasını, herhangi bir makroyu, lifi, toplam ya da ilave şekeri, alkolü ya da kafeini, saatini ya da notlarını. Eksikler de burada tamamlanır: bir yemek lifi, şekeri ya da ilave şekeri olmadan girildiyse sunucu bunu söyler ve sen kabul edince yapay zekâ buradan doldurur. Malzemeyle kaydedilmiş bir yemekte toplamlar malzeme listesi üzerinden değişir.",
            params: {
                id: "Güncellenecek yemeğin UUID değeri",
                description: "",
                calories: "",
                protein_g: "",
                carbs_g: "",
                fat_g: "",
                fiber_g: "",
                sugar_g: "Toplam şeker, ilave şeker değil",
                added_sugar_g:
                    "Yalnızca ilave şeker; toplam şekerden asla fazla olamaz. <code>sugar_g</code> ile birlikte gider: ilave şekeri kayıtlı olmayan bir yemekte toplam şekeri değiştirmek, bu alan olmadan kaydedilmeyebilir",
                alcohol_g: "Saf etanol gramı, içeceğin hacmi değil",
                caffeine_mg: "Miligram, gram değil",
                logged_at: "",
                notes: "",
                items: "Tam malzeme listesi; mevcut listenin yerini alır. Yemeğin toplamları bu listenin toplamı olur, bu yüzden toplam alanları bununla birlikte gönderilemez",
            },
            example: "Aslında o öğle yemeği 500 değil 600 kaloriydi, düzelt",
        },
        delete_meal: {
            description: "Yanlışlıkla kaydettiğin bir yemek kaydını sil.",
            params: {
                id: "Silinecek yemeğin UUID değeri",
            },
            example: "Bu öğleden sonra kaydettiğim ara öğünü sil",
        },
        save_meal: {
            description:
                "Sık yediğin bir yemeği, örneğin her zamanki kahvaltını, bir adla kaydet; bir porsiyon için değerleri ve varsa malzemeleriyle birlikte. Değerleri kendin ver ya da zaten kaydettiğin bir yemekten kopyala. Kaydetmek günlüğüne bir şey eklemez; yediğinde kayıtlı yemeği log_saved_meal ile kaydet.",
            params: {
                name: "Altında kaydedileceği ad; kayıtlı yemeklerin arasında benzersiz olmalı (1–100 karakter)",
                from_meal_id:
                    "Değerlerini ve malzemelerini kopyalayacağın kaydettiğin bir yemeğin UUID değeri",
                description: "Kayıtlı yemeğin ne olduğu. Varsayılan olarak adı",
                meal_type:
                    "kahvaltı, öğle yemeği, akşam yemeği ya da ara öğün — kaydederken varsayılan olarak kullanılır",
                items: "Malzemeler, her satırda kendi miktarı ve besin değerleriyle. Toplamları kayıtlı yemeğin değerleri olur; bu yüzden malzemeleri ya da değerleri gönder, ikisini birden değil",
                calories: "Bir porsiyon için toplam kalori",
                protein_g: "Bir porsiyon için gram cinsinden protein",
                carbs_g: "Bir porsiyon için gram cinsinden karbonhidrat",
                fat_g: "Bir porsiyon için gram cinsinden yağ",
                fiber_g: "Bir porsiyon için gram cinsinden lif",
                sugar_g: "Bir porsiyon için gram cinsinden toplam şeker",
                added_sugar_g:
                    "Bir porsiyon için gram cinsinden ilave şeker; asla toplam şekerden fazla olamaz. <code>sugar_g</code> ile birlikte gider",
                alcohol_g:
                    "Bir porsiyon için saf etanol gramı, içeceğin hacmi değil",
                caffeine_mg:
                    "Bir porsiyon için miligram cinsinden kafein, gram değil",
            },
            example: "Bunu her zamanki kahvaltım olarak kaydet",
        },
        log_saved_meal: {
            description:
                "Kayıtlı bir yemeği, şimdi ya da verdiğin bir zamandan itibaren yemek kaydı olarak kaydet. Kayıt, kayıtlı değerlerin ve malzemelerinin bir kopyasını alır; porsiyon sayısına göre ölçeklenir ve tek seferlik olarak tek tek malzemeler gerçekten yenen miktara ayarlanabilir ya da çıkarılabilir. Kayıtlı yemekte sonradan yapılan değişiklikler, ondan kaydedilmiş yemekleri olduğu gibi bırakır.",
            params: {
                saved_meal:
                    "Kayıtlı yemeğin adı ya da get_saved_meals veya search_meals'ten gelen kimliği",
                servings:
                    "Kaç porsiyon kaydedileceği: 0'dan büyük ve en fazla 20 (varsayılan 1)",
                item_amounts:
                    "Bu kayıtta tek tek malzemelerden gerçekten yenen miktarlar, ad ya da sıra numarasıyla. Önce porsiyon sayısı kayıtlı yemeği ölçekler, sonra bu değerler belirtilen malzemelerin miktarını belirler; besin değerleri oranına göre ölçeklenir",
                leave_out:
                    "Bu kayıttan çıkarılacak malzemeler, ad ya da sıra numarasıyla",
                meal_type:
                    "kahvaltı, öğle yemeği, akşam yemeği ya da ara öğün — kayıtlı yemeğin varsayılanının yerine geçer",
                description:
                    "Bu kayıt için açıklama. Varsayılan olarak kayıtlı yemeğin açıklaması",
                logged_at: "Ne zaman yediğin, şimdi değilse",
                notes: "Ek notlar",
                idempotency_key:
                    "Tekrar deneyen bir çağrıyı etkisiz kılan anahtar; böylece aynı kayıt iki kez eklenmez",
            },
            example: "Her zamanki kahvaltımı kaydet, yarım porsiyon",
        },
        update_saved_meal: {
            description:
                "Kayıtlı bir yemeğin adını, açıklamasını, varsayılan yemek türünü, malzemelerini ya da porsiyon başına değerlerini değiştir. Ondan kaydedilmiş yemekler kendi değerlerini korur.",
            params: {
                id: "Güncellenecek kayıtlı yemeğin UUID değeri",
                name: "Yeni ad; kayıtlı yemeklerin arasında benzersiz olmalı",
                description: "Yeni açıklama",
                meal_type:
                    "Yeni varsayılan yemek türü: kahvaltı, öğle yemeği, akşam yemeği ya da ara öğün",
                items: "Tam malzeme listesi; mevcut listenin yerini alır. Toplamı kayıtlı yemeğin değerleri olur; bu yüzden değer alanları bununla birlikte gönderilemez",
                calories: "Bir porsiyon için toplam kalori",
                protein_g: "Bir porsiyon için gram cinsinden protein",
                carbs_g: "Bir porsiyon için gram cinsinden karbonhidrat",
                fat_g: "Bir porsiyon için gram cinsinden yağ",
                fiber_g: "Bir porsiyon için gram cinsinden lif",
                sugar_g: "Bir porsiyon için gram cinsinden toplam şeker",
                added_sugar_g:
                    "Bir porsiyon için gram cinsinden ilave şeker; asla toplam şekerden fazla olamaz. <code>sugar_g</code> ile birlikte gider",
                alcohol_g:
                    "Bir porsiyon için saf etanol gramı, içeceğin hacmi değil",
                caffeine_mg:
                    "Bir porsiyon için miligram cinsinden kafein, gram değil",
            },
            example:
                "Her zamanki kahvaltımın porsiyonu artık 350 kalori — güncelle",
        },
        delete_saved_meal: {
            description:
                "Kayıtlı bir yemeği sil. Ondan kaydedilmiş yemekler kendi değerlerini korur.",
            params: {
                id: "Silinecek kayıtlı yemeğin UUID değeri",
            },
            example: "Eski öğle yemeği adlı kayıtlı yemeği sil",
        },
        search_meals: {
            description:
                "Geçmiş yemeklerini anahtar kelimeyle ara ve tekrarlayan varyasyonlarına gruplanmış hâlde gör: her birinin kaç kez kaydedildiği, en son ne zaman kaydedildiği ve tipik kalorisi. Yapay zekâ tabağının fotoğrafını o yemeği daha önce nasıl kaydettiğinle böyle karşılaştırır, “her zamanki kahvaltımı kaydet” de böyle çalışır. Bir yemeğin malzeme adlarında da arar ve adı, açıklaması ya da malzemeleri eşleşen kayıtlı yemeklerini de listeler.",
            params: {
                queries:
                    "Yemek anahtar kelimesi alternatifleri, kayıt tuttuğun herhangi bir dilde",
                days: "Ne kadar geriye bakılacağı (varsayılan bir yıl)",
                limit: "İncelenecek en fazla kayıt sayısı",
            },
            example: "Her zamanki kahvaltımı kaydet",
        },
        get_meals_today: {
            description: "Bugün kaydettiğin her yemeği gör.",
            params: {
                detail: "Her yemek için kimliğiyle birlikte tek satır isteniyorsa <code>compact</code> (varsayılan), notlar ve tam saatler de isteniyorsa <code>full</code>",
            },
            example: "Bugün ne yedim?",
        },
        get_meals_by_date: {
            description: "Belirli bir günde kaydettiğin tüm yemekleri gör.",
            params: {
                date: "YYYY-MM-DD biçiminde tarih",
                detail: "Her yemek için kimliğiyle birlikte tek satır isteniyorsa <code>compact</code> (varsayılan), notlar ve tam saatler de isteniyorsa <code>full</code>",
            },
            example: "4 Temmuz günü yediğim her şeyi göster",
        },
        get_meals_by_date_range: {
            description:
                "İki tarih arasındaki tüm yemekleri tek seferde çek; bir haftayı ya da bir ayı gözden geçirmek için kullanışlı. Bir çağrı en fazla 31 günü kapsar; daha uzun aralıklarda eğilimler ve özetler sana günlük toplamları verir.",
            params: {
                start_date: "Başlangıç tarihi (YYYY-MM-DD)",
                end_date:
                    "Bitiş tarihi (YYYY-MM-DD), başlangıç dahil en fazla 31 gün",
                detail: "Her yemek için kimliğiyle birlikte tek satır isteniyorsa <code>compact</code> (varsayılan), notlar ve tam saatler de isteniyorsa <code>full</code>",
            },
            example: "Pazartesiden cumaya yemeklerimi listele",
        },
        get_saved_meals: {
            description:
                "Kayıtlı yemeklerini, porsiyon başına değerleri ve malzemeleriyle gör; istersen yalnızca adında belirli bir metin geçenleri.",
            params: {
                name_contains:
                    "Yalnızca adında bu metin geçen kayıtlı yemekler",
            },
            example: "Hangi yemekleri kaydettim?",
        },
        export_all_data: {
            description:
                "Servisin senin hakkında sakladığı her şeyi tek bir ZIP olarak dışa aktar: meals.csv, meal_items.csv (kaydettiğin yemeklerin malzemeleri), saved_meals.csv ve saved_meal_items.csv (kayıtlı yemeklerin ve malzemelerinin), water.csv, weight.csv, body_measurements.csv, goals.csv, goals_history.csv (hedeflerindeki her değişiklik, tarihiyle), profile.csv, account.csv (giriş hesabın), telemetry.csv (araç kullanım kayıtları), connections.csv (bağlı yapay zekâ uygulamaların ve Apple Health eşitlemesi, hiçbir token olmadan), health_sync.csv (Apple Health eşitlemesinin son 8 günde gönderdikleri) ve kolonları, birimleri ve neyin dahil olmadığını anlatan bir README.txt. Ardından 60 dakika geçerli, özel bir indirme bağlantısı verir. Şimdilik geri aktarılabilen tek bölüm yemekler.",
            params: {},
            example:
                "Tüm verilerimi dışa aktar: yemekler, su, kilo ve hedefler",
        },
        log_water: {
            description:
                "Bir su kaydı ekle. Hangi birimde istersen ver — bardak, ons, litre — senin için mililitreye çevrilir.",
            params: {
                amount_ml: "Mililitre cinsinden miktar (tam sayı, &gt; 0).",
            },
            example: "Az önce 500 ml su içtim",
        },
        get_water_today: {
            description: "Bugünün toplam su alımını ve her kaydı gör.",
            params: {},
            example: "Bugün ne kadar su içtim?",
        },
        get_water_by_date: {
            description:
                "Belirli bir güne ait su toplamını ve kayıtlarını gör.",
            params: {
                date: "YYYY-MM-DD biçiminde tarih",
            },
            example: "Dün ne kadar su içmişim?",
        },
        delete_water: {
            description: "Yanlışlıkla eklediğin bir su kaydını sil.",
            params: {
                id: "Silinecek su kaydının UUID değeri",
            },
            example: "Son su kaydını sil",
        },
        log_weight: {
            description:
                "kg ya da lb cinsinden bir vücut ağırlığı ölçümü kaydet. Günde birkaç kez tartılmak sorun değil; sunucu değeri standart biçimde sakladığı için birim tercihin sayıyı asla bozmaz.",
            params: {
                weight: "Vücut ağırlığı değeri, <code>unit</code> biriminde (&gt; 0).",
            },
            example: "Kilomu kaydet, bu sabah 74.2 kg",
        },
        update_weight: {
            description:
                "Var olan bir tartı kaydını düzelt: değerini, zamanını ya da notlarını.",
            params: {
                id: "Güncellenecek kilo kaydının UUID değeri",
                weight: "Yeni kilo değeri, <code>unit</code> biriminde.",
                logged_at: "ISO 8601 zaman damgası",
                notes: "",
            },
            example: "Bu sabahki tartıyı 73.8 kg olarak düzelt",
        },
        delete_weight: {
            description: "Bir kilo kaydını sil.",
            params: {
                id: "Silinecek kilo kaydının UUID değeri",
            },
            example: "Bugünün kilo kaydını sil",
        },
        get_weight_today: {
            description: "Bugünün tartılarını tercih ettiğin birimde gör.",
            params: {},
            example: "Bugün kaç kiloydum?",
        },
        get_weight_by_date: {
            description: "Belirli bir güne ait tartılarını gör.",
            params: {
                date: "YYYY-MM-DD biçiminde tarih",
            },
            example: "Ayın birinde kilom neydi?",
        },
        get_weight_by_date_range: {
            description:
                "İki tarih arasındaki her tartıyı, güne göre gruplanmış ve her günün ortalamasıyla birlikte al.",
            params: {
                start_date: "Başlangıç tarihi (YYYY-MM-DD)",
                end_date: "Bitiş tarihi (YYYY-MM-DD)",
            },
            example: "Son iki haftanın tartılarını göster",
        },
        get_weight_trends: {
            description:
                "Bir dönem boyunca kilo eğilimini gör: günlük dalgalanmaları yumuşatan düzleştirilmiş eğilim kilosu, haftalık değişim hızın, en son ölçüm, toplam değişim, en düşük ve en yüksek değer ve hedef kilona doğru ilerlemen. Grafik 90 güne, bir yıla ya da tüm geçmişine de uzaklaşabilir.",
            params: {
                days: "Gün cinsinden dönem uzunluğu (varsayılan 30, en fazla 365).",
            },
            example: "Bu ay kilom ne yönde gidiyor?",
        },
        set_weight_unit: {
            description:
                "Kiloların kg ya da lb cinsinden gösterilip girilmesini seç. Kayıtlı değerler etkilenmez; yalnızca görüntü ve varsayılan okuma biçimi değişir.",
            params: {},
            example: "Bundan sonra kilom için pound kullan",
        },
        log_body_measurement: {
            description:
                "Tek bir vücut bölgesinin mezura ölçümünü — bel, kalça, boyun, göğüs, omuz, üst kol, ön kol, uyluk ya da baldır — cm veya inç cinsinden kaydet. Girdiğin gibi, standart bir değerle birlikte saklanır; böylece birim değiştirmek hiçbir sayıyı kaydırmaz. Bölge için gerçekçi aralığın çok dışındaki sayılar, muhtemelen yazım hatası oldukları için geri çevrilir.",
            params: {
                kind: "Hangi bölge: <code>waist</code>, <code>hips</code>, <code>neck</code>, <code>chest</code>, <code>shoulders</code>, <code>upper_arm</code>, <code>forearm</code>, <code>thigh</code> ya da <code>calf</code>. Bölge başına tek değer; taraf (sol/sağ) notlara yazılabilir.",
                value: "Ölçüm değeri, <code>unit</code> biriminde (&gt; 0).",
                unit: "<code>cm</code> ya da <code>in</code>; varsayılan olarak kayıtlı uzunluk birimin.",
                logged_at: "Şimdi değilse, ne zaman ölçüldüğü",
                notes: "Ek notlar",
            },
            example: "Belimi kaydet, bu sabah 82 cm",
        },
        get_body_measurements: {
            description:
                "Vücut ölçülerini güne göre, en eskiden başlayarak listele; istersen yalnızca tek bir bölge için. Tarih vermezsen son 30 günü kapsar, çağrı başına en fazla 366 gün.",
            params: {
                kind: "Yalnızca bu bölge (örn. <code>waist</code>)",
                start_date: "Başlangıç tarihi (YYYY-MM-DD)",
                end_date:
                    "Bitiş tarihi (YYYY-MM-DD), başlangıç dahil en fazla 366 gün",
            },
            example: "Son üç ayın bel ölçülerimi göster",
        },
        update_body_measurement: {
            description:
                "Var olan bir ölçümü düzelt: değerini, birimini, saatini ya da notlarını. Bölgenin kendisi sabittir; farklı bir bölge yeni bir kayıttır.",
            params: {
                id: "Güncellenecek ölçümün UUID değeri",
                value: "Yeni değer, <code>unit</code> biriminde.",
                unit: "Varsayılan olarak kaydın girildiği birim.",
                logged_at: "ISO 8601 zaman damgası",
                notes: "Notların yerine yazılacak metin",
            },
            example: "O kalça ölçüsü 89 değil 98 cm olacaktı",
        },
        delete_body_measurement: {
            description: "Bir vücut ölçüsü kaydını sil.",
            params: {
                id: "Silinecek ölçümün UUID değeri",
            },
            example: "Bugünün boyun ölçümünü sil",
        },
        set_length_unit: {
            description:
                "Vücut ölçülerinin santimetre ya da inç cinsinden gösterilip girilmesini seç. Kilo biriminden ayrıdır. Kayıtlı değerler etkilenmez; yalnızca görüntü ve varsayılan okuma biçimi değişir.",
            params: {},
            example: "Ölçülerim için inç kullan",
        },
        set_nutrition_goals: {
            description:
                "Günlük kalori, makro, lif, şeker, ilave şeker, alkol, kafein ve su hedeflerini, istersen bir de hedef vücut ağırlığını belirle. Kalori, protein, karbonhidrat, yağ, lif ve su ulaşılacak hedeflerdir; toplam şeker, ilave şeker, alkol ve kafein ise altında kalınacak sınırlardır ve ilerleme buna göre ifade edilir. Yalnızca adını verdiğin alanlar güncellenir, kalanlar olduğu gibi durur.",
            params: {
                daily_calories:
                    "Günlük kalori hedefi (kcal). Temizlemek için null.",
                daily_protein_g:
                    "Günlük protein hedefi (gram). Temizlemek için null.",
                daily_carbs_g:
                    "Günlük karbonhidrat hedefi (gram). Temizlemek için null.",
                daily_fat_g: "Günlük yağ hedefi (gram). Temizlemek için null.",
                daily_fiber_g:
                    "Günlük lif hedefi (gram), ulaşılacak bir alt sınır. Temizlemek için null.",
                daily_sugar_g:
                    "<b>Toplam</b> şeker için günlük sınır (gram), altında kalınacak bir üst sınır. Toplam şeker meyve ve sütteki doğal şekeri de içerir, bu yüzden ilave şeker için verilen genel öneriler çok daha düşük bir sayıdır. Temizlemek için null.",
                daily_added_sugar_g:
                    "<b>İlave</b> şeker için günlük sınır (gram), altında kalınacak bir üst sınır. Yalnızca ilave şekeri sayar, meyve ve sütteki doğal şekeri saymaz; şekerle ilgili genel öneri değerleri çoğunlukla bu ölçüyü kasteder (American Heart Association kadınlar için günde en fazla 25 g, erkekler için 36 g öneriyor). 0 gerçek bir sınırdır ve hiç olmaması anlamına gelir. Temizlemek için null.",
                daily_alcohol_g:
                    "Günlük alkol sınırı, <b>saf etanol</b> gramı cinsinden, altında kalınacak bir üst sınır. Bir ABD standart içkisi 14 g, bir Birleşik Krallık birimi 7.9 g eder. Temizlemek için null.",
                daily_caffeine_mg:
                    "Günlük kafein sınırı, <b>miligram</b> cinsinden, altında kalınacak bir üst sınır. EFSA ve FDA sağlıklı yetişkinler için üst sınırı günde 400 mg olarak veriyor (kabaca dört filtre kahve); gebelik için EFSA tarafından verilen değer 200 mg. 0 gerçek bir sınırdır ve hiç olmaması anlamına gelir. Temizlemek için null.",
                daily_water_ml: "",
                target_weight: "",
            },
            example:
                "Hedeflerimi 2200 kalori, 160 g protein ve 75 kg hedef kilo olarak ayarla",
        },
        get_nutrition_goals: {
            description:
                "Güncel günlük kalori ve makro hedeflerini, varsa lif hedefini ve şeker ya da kafein sınırını, alkol takibi yapıyorsan alkol sınırını da gör.",
            params: {},
            example: "Günlük hedeflerim neler?",
        },
        get_goal_progress: {
            description:
                "Bugünün alımının hedeflerine göre nasıl gittiğini gör: alım ve hedef halkaları ile vücut ağırlığı ilerlemesi. Hangi yemeklerin katkıda bulunduğunu görmek için bir makro halkasına dokun.",
            params: {},
            example: "Bugün hedeflerime göre nasıl gidiyorum?",
        },
        get_nutrition_summary: {
            description:
                "Bir tarih aralığındaki günlük besin toplamlarını etkileşimli bir panel olarak al: hedeflere karşı makro kartları ve gün gün dağılım. Bir çağrı en fazla 92 günü kapsar; daha uzun aralıklarda eğilimler sana hareketli ortalamaları verir.",
            params: {
                start_date: "Başlangıç tarihi (YYYY-MM-DD)",
                end_date:
                    "Bitiş tarihi (YYYY-MM-DD), başlangıç dahil en fazla 92 gün",
            },
            example: "Geçen haftanın özetini ver",
        },
        get_trends: {
            description:
                "Hareketli 7/14/30 günlük ortalamalar, değişkenlik, kayıt serileri, haftanın günlerine göre kalori ortalamaları ve kaloriye göre en iyi ve en kötü günlerin — hepsi önceden hesaplanmış, böylece yapay zekâ yalnızca anlatır. group_by ile haftaya, aya, çeyreğe ya da yıla göre ortalamalar da verir — kayıt yapılan günler üzerinden, yani yemek girilmeyen günler dışarıda kalır — ve bunları o dönemde geçerli olan hedeflerle karşılaştırır; kaç günün hedefte olduğunu ve kaçının eksik göründüğünü de söyler.",
            params: {
                days: "Gün cinsinden dönem uzunluğu (varsayılan 30, en fazla 365).",
                group_by:
                    "<code>week</code>, <code>month</code>, <code>quarter</code> ya da <code>year</code>: 26 hafta, 24 ay, 12 çeyrek ya da 5 yıl; bitiş tarihini (varsayılan olarak bugünü) içeren dönemle sona erer. Kapsam sabittir; hareketli ortalamaları yine <code>days</code> belirler.",
            },
            example: "Aylarım hedeflerime göre nasıl geçti?",
        },
        get_meal_patterns: {
            description:
                "Davranış örüntülerini çıkar: her yemek türünü ne sıklıkla yediğin, kahvaltı etkisi, yüksek kalorili öğle yemekleri, geç akşam yemekleri, hafta içi ve hafta sonu karşılaştırması ve sıra dışı günler.",
            params: {
                days: "Gün cinsinden dönem uzunluğu (varsayılan 30, en az 7, en fazla 365).",
            },
            example:
                "Yeme düzenimde bir örüntü var mı; geç akşam yemekleri ya da kahvaltıyı atlamak gibi?",
        },
        get_profile: {
            description:
                "Güncel ayarlarını tek seferde gör: saat dilimi (ayrıca yerel tarih ve saat), widget dili, tercih ettiğin kilo ve uzunluk birimleri, sohbet içi widget'ların gösterilip gösterilmediği ve alkol takibinin açık olup olmadığı.",
            params: {},
            example: "Güncel ayarlarım neler?",
        },
        set_timezone: {
            description:
                "IANA saat dilimini ayarla, böylece günler kendi yerel gece yarında değişsin: gece 23:00'te kaydedilen bir yemek o güne sayılır, bir sonraki UTC gününe değil.",
            params: {},
            example: "Berlin'deyim, saat dilimimi ayarla",
        },
        set_language: {
            description:
                "Sohbet içi widget'ların arayüz dilini ayarla: panolar ve grafikler, yapay zekânın sana yazdıkları değil.",
            params: {
                locale: "ISO 639-1 kodu, örn. <code>de</code>, <code>ja</code>. Desteklenenler: İngilizce, Almanca, İspanyolca, Fransızca, Felemenkçe, Lehçe, İtalyanca, Ukraynaca, Japonca, Türkçe.",
            },
            example: "Widget'larımı Almanca göster",
        },
        get_current_time: {
            description:
                "Saat dilimindeki şu anki tarih ve saati, ayrıca UTC anını gör. Bazı uygulamalar asistana saatin kaç olduğunu söylemez; “bu sabah” ya da “bugün” ne demek, sana sormadan böyle anlaşılır (saat dilimi ayarlı değilse varsayılan olarak UTC kullanılır).",
            params: {},
            example: "Bende şu an saat kaç?",
        },
        set_widget_display: {
            description:
                "Sohbet içi görsel widget'ları aç ya da kapat: panolar, hedef halkaları ve eğilim grafikleri. Kapalıyken aynı araçlar yalnızca metin ve veriyle yanıt verir. Varsayılan olarak açıktır; değişiklik yeni sohbetlerde geçerli olur.",
            params: {
                enabled:
                    "widget'ları göstermek için true, yalnızca metin yanıtları için false",
            },
            example: "Widget'ları kapat",
        },
        set_alcohol_tracking: {
            description:
                "Alkol takibini aç ya da kapat ve içkilerin ABD standart içkisi mi Birleşik Krallık birimi mi olarak sayılacağını seç. Varsayılan olarak kapalıdır, yani istemen gerekir. Tekrar kapatmak alkolü yemeklerden, hedeflerden ve ilerlemeden gizler ve dosya içe aktarıcısının bir dosyadaki alkol kolonunu okumasını durdurur. Kayıtlı hiçbir şey silinmez, CSV dışa aktarman alkolü içermeye devam eder ve takibi yeniden açarsan geri gelir. Değişiklik bir sonraki mesajından itibaren geçerlidir, yeniden başlatılacak bir şey yoktur.",
            params: {
                enabled:
                    "alkolü yemeklerde, hedeflerde ve ilerlemede göstermek için true, gizlemek için false",
                drink_unit:
                    "Gramların yanında hangi standart içkinin gösterileceği: <code>us</code> (içki başına 14 g) ya da <code>uk</code> (birim başına 7.9 g). Varsayılan <code>us</code>; asıl saklanan şey saf etanol gramıdır.",
            },
            example:
                "Alkol tüketimimi takip etmeye başla, Birleşik Krallık birimleriyle",
        },
        delete_account: {
            description:
                "Nutrition MCP hesabını ve senin hakkında sakladığı tüm verileri kalıcı olarak sil. Bu geri alınamaz, bu yüzden araç açık bir onay olmadan hiçbir şey yapmaz ve yapay zekânın göndermeden önce sana sorması istenir.",
            params: {},
            example: "Hesabımı ve tüm verilerimi sil",
        },
    },
    troubleshooting: {
        pillLabel: "Yardım",
        title: "Sorun giderme",
        description:
            "Bir şey çalışmıyor mu? Çoğu sorunun hızlı bir çözümü var.",
        stillStuck: "Hâlâ çözemedin mi?",
        items: {
            "cannot-connect": {
                question:
                    "Konektör bağlanmıyor ya da sürekli giriş yapmamı istiyor",
                answerHtml:
                    "Konektörü kaldır ve tam olarak <code>https://nutrition-mcp.com/mcp</code> adresiyle tekrar ekle; <code>/mcp</code> kısmı zorunludur. Claude uygulamasında <strong>Customize</strong> → <strong>Connectors</strong> bölümünü aç, Nutrition bağlantısını kes ve tekrar bağlan; ChatGPT uygulamasında <strong>Settings</strong> → <strong>Apps</strong> bölümünü kullan. Daha önce kullandığın e-posta ve şifreyle ya da aynı Google hesabıyla giriş yap: verilerin bağlantıya değil hesabına aittir, bu yüzden yeniden bağlanırken hiçbir şey kaybolmaz. Bağlandıktan sonra, en az 90 günde bir kullandığın sürece bağlı kalır; çalışmayı bırakırsa aynı şekilde yeniden bağlanmak sorunu çözer.",
            },
            "session-expired": {
                question:
                    'Giriş sayfası {"error":"session_expired"} gösteriyor',
                answerHtml:
                    "Giriş sayfası yalnızca 10 dakika geçerlidir ve sunucu bir güncelleme için yeniden başladığında da sıfırlanır. Giriş sayfasına dönüp yenile ya da yapay zekâ uygulamandan bağlanmaya yeniden başla, sonra uzun bir ara vermeden giriş yap. Bunun yerine <code>session_mismatch</code> yazıyorsa giriş, sayfayı açan tarayıcıdan farklı bir tarayıcıda tamamlanmış demektir: yapay zekâ uygulamandan yeniden başla ve aynı tarayıcıda tamamla.",
            },
            "cannot-sign-in": {
                question: "Giriş yapamıyorum ya da şifremi unuttum",
                answerHtml:
                    'Zaten bir hesabın varsa <strong>Giriş yap</strong> seçeneğini kullan: orada yanlış bir e-posta ya da şifre “E-posta veya şifre yanlış.” uyarısı verir ve asla yeni bir hesap oluşturmaz. <strong>Hesap oluştur</strong> yalnızca ilk ziyaretin içindir. E-postada yazım hatası olup olmadığını kontrol et. Hesabını <strong>Google ile devam et</strong> ile oluşturduysan yine o düğmeyi kullan. Henüz kendi kendine şifre sıfırlama yok: hesabındaki adresten <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a> adresine yaz, ben sıfırlarım.',
            },
            "history-missing": {
                question: "Yeniden bağlandım ve geçmişim kayboldu",
                answerHtml:
                    'Her e-posta adresi ayrı bir hesaptır, bu yüzden farklı bir e-postayla giriş yapmak boş bir hesap başlatır; hiçbir şey silinmedi. Bağlantıyı kes ve en başta kullandığın adresle tekrar giriş yap. Hangisi olduğundan emin değilsen <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a> adresine yaz.',
            },
            "tools-not-used": {
                question: "Yapay zekâ yanıt veriyor ama hiçbir şey kaydetmiyor",
                answerHtml:
                    "Konektörün bu sohbet için açık olduğundan emin ol — Claude uygulamasında mesaj kutusundaki araçlar menüsüne bak — ve isteğini doğrudan söyle, örneğin “kahvaltımı Nutrition üzerinde kaydet”. Uygulaman bir aracı kullanmak için izin isterse onayla.",
            },
            "wrong-day": {
                question: "Yemeklerim yanlış günde görünüyor",
                answerHtml:
                    'Günler senin saat diliminde sayılır; hiç ayarlamadıysan UTC kullanılır. “Hangi saat dilimi ayarlı?” diye sor (<a href="#get_profile"><code>get_profile</code></a>) ve yanlışsa “saat dilimimi Europe/Berlin yap” de (<a href="#set_timezone"><code>set_timezone</code></a>). Kaydettiğin her şey bundan sonra yerel gününe göre gruplanır, eski kayıtlar dahil. Tek istisna, saat dilimi yanlışken belirli bir saat verdiğin bir kayıttır: kaydedildiği anı koruduğu için hâlâ bir saat ya da bir gün kaymış durabilir; yapay zekâdan onu doğru tarih ve saate taşımasını iste (<a href="#update_meal"><code>update_meal</code></a>). Geçmişini içe aktarmadan önce de saat dilimini ayarla: içe aktarılan yemekler yerleştirildikleri anı korur ve saat dilimini değiştirdikten sonra başka bir uygulamanın dosyasını yeniden aktarmak onları ikinci kez ekler. Nutrition MCP dışa aktarması tanınır ve kopyalanmaz.',
            },
            "no-widgets": {
                question: "Yalnızca metin görüyorum, grafik ya da kart yok",
                answerHtml:
                    'Görsel kartlar, etkileşimli MCP Apps panellerini destekleyen bir uygulama gerektirir; Claude ya da ChatGPT gibi. Diğer istemciler aynı bilgiyi metin olarak alır. Widget\'ları kapattıysan tekrar açılmasını iste (<a href="#set_widget_display"><code>set_widget_display</code></a>) ve yeni bir sohbet başlat: açık bir sohbet yeniden bağlanana kadar eski ayarını korur. Bir yemeği kaydettikten sonra çıkan küçük kart, yalnızca günlük hedefler belirledikten sonra görünür (<a href="#set_nutrition_goals"><code>set_nutrition_goals</code></a>).',
            },
            "import-problems": {
                question:
                    "İçe aktarıcı açılmıyor ya da kaydedemediğini söylüyor",
                answerHtml:
                    'İçe aktarma paneli, etkileşimli panelleri gösteren ve widget\'ları açık olan bir uygulama gerektirir. <em>Bu ana uygulama bu görünümün kaydına yazmasına izin vermiyor</em> yazıyorsa ya da panel hiç çıkmıyorsa yapay zekâdan dosyayı kendisinin aktarmasını iste: CSV dosyasını ekle ya da yapıştır, <a href="#bulk_import_meals"><code>bulk_import_meals</code></a> aracını kullanır; bu araç her satırı denetler ve kopyaları atlar, bu yüzden saat dilimin bu arada değişmediği sürece tekrar göndermek güvenlidir. İlk içe aktarmadan önce saat dilimini ayarla: bir değişiklikten sonra başka bir uygulamanın dosyasını yeniden aktarmak satırları tekrar ekler. İçe aktarma panelini kullanıyorsan ve bir alkol kolonunun korunmasını istiyorsan önce alkol takibini aç: takip kapalıyken panel o kolonu atlar ve sonradan yeniden aktarmak onu doldurmaz.',
            },
            "rate-limited": {
                question:
                    "“Rate limit exceeded” ya da “Too many failed authentication attempts” görüyorum",
                answerHtml:
                    "Her hesap dakikada 60 istek yapabilir ve her araç çağrısı en az bir istek sayılır. Mesajda yazan saniye kadar bekle, sonra devam et. Çok sayıda yemeği sonradan eklemek için tek tek kaydetmek yerine içe aktarıcıyı kullan. Giriş sayfaları her ağ için dakikada 30 isteğe izin verir. Bir ağdan üst üste 20 reddedilen bağlantı denemesinden sonra — genellikle bağlantısı kesilmiş eski bir konektör hâlâ denemeye devam ettiği için — o ağdan gelen bağlantılar 5 dakika duraklatılır; duraklamalar tekrarlanırsa en fazla bir saate kadar uzar. Eski konektörü kaldırıp tekrar eklemek bu denemeleri durdurur.",
            },
            "barcode-not-found": {
                question:
                    "Bir barkod bulunamıyor ya da değerleri yanlış görünüyor",
                answerHtml:
                    "Barkod verileri, bir topluluk veritabanı olan Open Food Facts kaynağından gelir; bu yüzden bazı ürünler eksiktir ve bazı kayıtlar güncelliğini yitirmiştir. Barkodun altındaki 8–14 hanenin tamamının doğru okunduğundan emin ol. Ürün orada yoksa yapay zekâ addan ya da besin etiketinin fotoğrafından tahmin edebilir ve sonrasında her değeri düzeltebilirsin. Ürünü openfoodfacts.org üzerinde eklemek herkesin işine yarar. Open Food Facts kafein verisi tutmadığı için kafein, etiketten ya da tipik miktarlardan gelir.",
            },
            "health-sync-yesterday": {
                question: "Dün hâlâ Apple Health içinde görünmüyor",
                answerHtml:
                    'Apple Health eşitlemesi yalnızca kapanmış günleri gönderir. Bir gün, senin saat diliminde ertesi sabah 05:00\'te kapanmış sayılır; bu yüzden dün, bugün 05:00 sonrasındaki ilk eşitlemeyle gelir ve bugün yarına kadar Sağlık uygulamasında hiç görünmez. Kısayolun otomasyonlarından biri tetiklendiğinde (Sağlık uygulamasını açmak, alarmını kapatmak) ya da Kısayollar uygulamasında <strong>Nutrition MCP Health</strong> kısayolunu çalıştırıp <strong>Sync now</strong> seçtiğinde bir eşitleme çalışır. Kaçırılan bir sabah kendiliğinden telafi edilir: her eşitleme son 7 güne geri bakar. Günler profilindeki saat dilimini izler (<a href="#get_profile"><code>get_profile</code></a>) ya da hiç ayarlamadıysan bağlanırken iPhone cihazının bildirdiği saat dilimini (<a href="#wrong-day">yemekler yanlış günde</a>). Bağlanmadan önceki günler yalnızca, bağlanırken önceki 7 güne kadarını geri getirmeyi seçtiysen gönderilir.',
            },
            "health-sync-higher": {
                question: "Apple Health sohbetimden daha fazlasını gösteriyor",
                answerHtml:
                    "Apple Health bir değere ekleme yapabilir ama elinde tuttuğu bir değeri asla düşüremez. Zaten gönderilmiş bir güne eklediğin bir yemek, o gün son 7 gün içindeyse 12:01, 12:02 diye devam eden küçük ek bir kayıt olarak arkasından gider. Günü gönderildikten sonra sildiğin ya da küçülttüğün bir yemek ise Sağlık tarafını yüksek bırakır ve kısayol, farkın ne kadar olduğunu söyleyen bir bildirim gösterir. Düzeltmek için Sağlık uygulamasını aç, <strong>Göz At</strong> → <strong>Beslenme</strong> bölümüne git, ilgili türü aç (örneğin Besinsel Enerji), <strong>Tüm Verileri Göster</strong> seçeneğine dokun, o güne ait Kısayollar kayıtlarını sil ve doğru toplamı elle gir. Asla <strong>Kısayollar'dan Tüm Verileri Sil</strong> seçeneğini kullanma: diğer kısayollarının kaydettiklerini de siler. Her gün iki katına çıkmış görünüyorsa başka bir uygulama da aynı türleri yazıyor ve Sağlık ikisini topluyor demektir: Sağlık uygulamasında <strong>Paylaşım</strong> → <strong>Uygulamalar</strong> altından birini kapat.",
            },
            "health-sync-stopped": {
                question: "Apple Health eşitlemesi durdu",
                answerHtml:
                    "Kısayollar uygulamasını aç ve <strong>Nutrition MCP Health</strong> kısayolunu elle çalıştır: neyin ters gittiğini söyler. Yeniden bağlanmanı istiyorsa bağlantı sona ermiştir (eşitleme olmadan 90 gün geçtiğinde, bağlandıktan 365 gün sonra ya da <strong>Disconnect</strong> seçeneğinden sonra): kısayolu çalıştır, açtığı sayfada yapay zekâ uygulamandakiyle aynı hesapla giriş yap ve 30 dakika içinde tamamla. Elle çalıştırdığında eşitliyor ama kendiliğinden eşitlemiyorsa, Kısayollar uygulamasının <strong>Otomasyon</strong> sekmesindeki otomasyonlarının açık ve <strong>Hemen Çalıştır</strong> olarak ayarlı olduğunu kontrol et. Bir bildirim, bir günün Apple Health tarafına ulaşmadığını söylüyorsa Sağlık uygulamasında <strong>Paylaşım</strong> → <strong>Uygulamalar</strong> → <strong>Kısayollar</strong> altından her besin türünü yazma izni ver ve kısayolu tekrar çalıştır. Yeni bir iPhone bağlamak eskisinin bağlantısının yerine geçer.",
            },
            "export-link": {
                question: "Dışa aktarma indirme bağlantım çalışmıyor",
                answerHtml:
                    'Dışa aktarma bağlantıları 60 dakika sonra sona erer ve her yeni dışa aktarma önceki dosyanın yerini alır. Yeni bir dışa aktarma iste (<a href="#export_all_data"><code>export_all_data</code></a>) ve hemen indir. Geçmişini beklerken dışa aktarma 0 yemek bildiriyorsa büyük olasılıkla farklı bir e-postayla giriş yapmışsın; bkz. <a href="#history-missing">geçmişim kayboldu</a>.',
            },
            "delete-account": {
                question: "Hesabımı nasıl silerim?",
                answerHtml:
                    'Yapay zekâdan Nutrition MCP hesabını silmesini iste (<a href="#delete_account"><code>delete_account</code></a>). Onaylamanı ister, sonra yemeklerini, kayıtlı yemeklerini, suyunu, kilonu, vücut ölçülerini, hedeflerini, ayarlarını, yapay zekâ uygulamanın hangi araçları kullandığına dair kaydı, varsa dışa aktarma dosyanı, girişini ve hesabın kendisini kalıcı olarak siler. Bu geri alınamaz, bu yüzden bir kopya istiyorsan önce verilerini dışa aktar. Ardından konektörü uygulamandan kaldır. Daha sonra aynı e-postayla tekrar giriş yapmak yeni ve boş bir hesap oluşturur.',
            },
            "report-a-problem": {
                question:
                    "Bir hatayı ya da güvenlik sorununu nasıl bildiririm?",
                answerHtml:
                    'Hataları <a href="https://github.com/akutishevsky/nutrition-mcp/issues" target="_blank" rel="noopener noreferrer">GitHub Issues</a> üzerinden bildir: hangi uygulamayı kullandığını (Claude, ChatGPT, …), ne sorduğunu, ne olduğunu ve kabaca ne zaman olduğunu yaz. Şifreni asla ekleme. Güvenlik sorunlarını lütfen herkese açık biçimde bildirme: <a href="https://github.com/akutishevsky/nutrition-mcp/security/advisories/new" target="_blank" rel="noopener noreferrer">GitHub özel güvenlik açığı bildirimi</a> üzerinden ya da e-postayla, <a href="https://github.com/akutishevsky/nutrition-mcp/security/policy" target="_blank" rel="noopener noreferrer">güvenlik politikasında</a> anlatıldığı şekilde özel olarak bildir. Bunların dışındaki her şey için <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a> adresine yaz.',
            },
        },
    },
};
