import type { WidgetStrings } from "./widgets.js";

export const WIDGET_STRINGS_TR: WidgetStrings = {
    macros: {
        labels: {
            calories: "Kalori",
            protein_g: "Protein",
            carbs_g: "Karbonhidrat",
            fat_g: "Yağ",
            sugar_g: "Şeker",
            added_sugar_g: "İlave şeker",
            saturated_fat_g: "Doymuş yağ",
            trans_fat_g: "Trans yağ",
            alcohol_g: "Alkol",
            caffeine_mg: "Kafein",
            sodium_mg: "Sodyum",
            fiber_g: "Lif",
            water_ml: "Su",
        },
        noGoalSet: "hedef yok",
        atLimit: "sınırda",
        floorUnder: "kaldı",
        ceilingUnder: "altında",
        over: "fazla",
        limitPrefix: "sınır",
        ofPrefix: "hedef",
        drinkLabels: { us: "ABD içkisi", uk: "UK birimi" },
        units: {
            kcal: "kcal",
            g: "g",
            mg: "mg",
            ml: "ml",
            L: "L",
            kg: "kg",
            lb: "lb",
        },
        noneLogged: "kayıt yok",
        notRecorded: "kaydedilmedi",
        caloriesToday: "Bugünkü kalori",
        caloriesOn: "Kalori · {date}",
        tapHint: "Arkasındaki yemekler için bir değere dokun",
        showMealsContributed: "Katkıda bulunan yemekleri göster.",
        byMealTitle: "Yemeklere göre {label}",
        closeBreakdown: "Dökümü kapat",
        noMealsContributed: "{label} içeren kayıtlı yemek yok.",
        untitledMeal: "Adsız yemek",
        moreMeals: {
            one: "+ {n} küçük yemek daha",
            other: "+ {n} küçük yemek daha",
        },
        moreMealsAtLeast: {
            one: "+ {n} veya daha fazla küçük yemek",
            other: "+ {n} veya daha fazla küçük yemek",
        },
        moreMealsMaybe: "+ muhtemelen daha fazla küçük yemek",
        ingredientCount: {
            one: "{n} malzeme",
            other: "{n} malzeme",
        },
        sourceUsda: "USDA",
        sourceOff: "OFF",
        sourceUser: "kendi",
        sourceEst: "tahm.",
        sourceMixed: "karışık",
        sourceRecordUsda: "FoodData Central",
        sourceRecordOff: "barkod",
        sourceDataType: "veri türü",
        sourceAria: "Kaynak: {source}",
        sourceDetailsAria: "Kaynak ayrıntılarını göster",
    },
    bridge: {
        settingsFooter:
            "Bu widget'ları istediğin zaman açıp kapatabilirsin — ayarlarını güncellemeyi istemen yeterli.",
        connectFailed: "Bu görünüm bağlı olduğu uygulamaya ulaşamadı.",
    },
    nutritionSummary: {
        title: "Beslenme özeti",
        loading: "Beslenme özetin yükleniyor…",
        empty: "Bu aralıkta yemek veya su kaydı yok.",
        caloriesPerDay: "Kalori / gün",
        chartAriaLabel: "Seçili aralıkta günlük kalori",
        avg: "ort.",
        goal: "hedef",
        dailyAvgLoggedDays: "Günlük ort. · kayıtlı günler",
        total: "Toplam",
        daysLogged: {
            one: "{n} gün kayıtlı",
            other: "{n} gün kayıtlı",
        },
        daysOfLogged: "{span} günün {logged} günü kayıtlı",
        months: [
            "Oca",
            "Şub",
            "Mar",
            "Nis",
            "May",
            "Haz",
            "Tem",
            "Ağu",
            "Eyl",
            "Eki",
            "Kas",
            "Ara",
        ],
    },
    goalProgress: {
        loading: "Hedef durumun yükleniyor…",
        title: "Hedef durumu",
        empty: "Gösterilecek hedef durumu yok.",
        nothingLoggedFor: "{date} için henüz kayıt yok.",
        thisDay: "bu gün",
        mealsCount: { one: "{n} yemek", other: "{n} yemek" },
        waterCount: { one: "{n} su kaydı", other: "{n} su kaydı" },
        weightLabel: "Kilo",
        weightNoneNoTarget:
            "Henüz kilo kaydı yok. Takip için log_weight ile bir kilo kaydet.",
        weightNoneWithTarget:
            "Henüz kilo kaydı yok. {target} hedefine ilerlemeyi görmek için log_weight ile bir kilo kaydet.",
        weightNoGoal:
            "Kilo {reading} — hedef yok. İlerlemeyi burada görmek için set_nutrition_goals ile bir hedef belirle.",
        atTarget: "hedefte",
        toLose: "{amount} verilecek",
        toGain: "{amount} alınacak",
        lastLogged: "son kayıt {date}",
        weightAria: "Kilo {current}, hedef {target}, {state}{metaSuffix}",
    },
    mealLogged: {
        titleLogged: "Yemek kaydedildi",
        titleUpdated: "Yemek güncellendi",
        addedKcal: "+{kcal} kcal",
    },
    trends: {
        loading: "Trendlerin yükleniyor…",
        title: "Trendler",
        empty: "Bu aralıkta henüz yemek veya su kaydı yok.",
        avgUnder: "eksik",
        loggedOfTotal: "{logged}/{total} gün kayıtlı",
        caloriesOverRange: "Son {range} günün günlük kalorisi",
        windowAriaLabel: "Trend aralığı",
        rangeDaysAriaLabel: "{n} gün",
        avgAllDays: "{range} günlük ort. · tüm günler",
        segWeek: "Hafta",
        segMonth: "Ay",
        segQuarter: "Çeyrek",
        segYear: "Yıl",
        segDays: "Gün",
        segWeekAria: "Haftalık ortalamaları göster",
        segMonthAria: "Aylık ortalamaları göster",
        segQuarterAria: "Çeyreklik ortalamaları göster",
        segYearAria: "Yıllık ortalamaları göster",
        segDaysAria: "Günlük trendleri göster",
        periodTitleWeek: "Haftalık ortalamalar",
        periodTitleMonth: "Aylık ortalamalar",
        periodTitleQuarter: "Çeyreklik ortalamalar",
        periodTitleYear: "Yıllık ortalamalar",
        perLoggedDay: "kayıtlı gün başına",
        daysLogged: "{logged}/{total} gün",
        onTarget: "hedefte {k}/{n}",
        possiblyIncomplete: {
            one: "{n} eksik olabilir",
            other: "{n} eksik olabilir",
        },
        partial: "sürüyor",
        nothingLogged: "kayıt yok",
        targetsChanged: "hedefler dönem içinde değişti",
        targetsAssumed: "{date} öncesi hedefler kayıtlı değil",
        noTargets: "Hedef yok — yalnızca ortalamalar.",
        quarter: "Ç{q} {year}",
    },
    weightTrends: {
        loading: "Kilo trendin yükleniyor…",
        title: "Kilo",
        empty: "Bu aralıkta henüz kilo kaydı yok.",
        rangeEmpty:
            "Son {range} günde tartı kaydı yok. Daha geniş bir aralık dene.",
        windowAriaLabel: "Trend aralığı",
        rangeAriaLabel: "Son {n} gün",
        chartAriaLabel: "{from} – {to} arası kilo, son {latest}",
        trendChartAriaLabel:
            "{from} – {to} arası kilo ve yumuşatılmış trend çizgisi, son {latest}",
        latest: "Son",
        needTwo: "en az 2 tartı gerekir",
        sinceDate: "{date} tarihinden beri {change}",
        weighIns: { one: "{n} tartı", other: "{n} tartı" },
        atTarget: "hedefte",
        toLose: "{amount} verilecek",
        toGain: "{amount} alınacak",
        target: "Hedef {value}",
        noTarget: "Hedef yok",
        trend: "Trend",
        scaleToday: "Bugünkü tartı {value}",
        perWeek: "{amount}/hafta",
        rateAriaLabel: "Son 2 haftada trend haftalık {amount} değişiyor",
        rateTwoWeeks: "2 hafta hızı",
        range1y: "1 yıl",
        rangeAll: "Tümü",
        range1yAriaLabel: "Son bir yıl",
        rangeAllAriaLabel: "Tüm geçmiş",
        sinceMonth: "{date} tarihinden beri {change}",
    },
    importMeals: {
        loading: "İçe aktarma hazırlanıyor…",
        stepFile: "Dosya",
        stepMap: "Kolonları eşle",
        stepPreview: "Önizleme",
        stepImport: "İçe aktar",
        fieldLabels: {
            logged_at: "Tarih / saat",
            description: "Yemek adı",
            meal_type: "Öğün",
            calories: "Kalori",
            protein_g: "Protein (g)",
            carbs_g: "Karbonhidrat (g)",
            fat_g: "Yağ (g)",
            fiber_g: "Lif (g)",
            sugar_g: "Şeker, toplam (g)",
            added_sugar_g: "İlave şeker (g)",
            saturated_fat_g: "Doymuş yağ (g)",
            trans_fat_g: "Trans yağ (g)",
            alcohol_g: "Alkol (g)",
            caffeine_mg: "Kafein (mg)",
            sodium_mg: "Sodyum (mg)",
            notes: "Notlar",
            time: "Saat (ayrı kolon)",
            deleted: "Silindi işareti",
            source_id: "Yemek kimliği (bizim dışa aktarmadan)",
            timezone: "Saat dilimi (bizim dışa aktarmadan)",
        },
        chooseExportHeading: "Dışa aktarma dosyanı seç",
        noToolsWarning:
            "Bu uygulama bu görünümün kaydına yazmasına izin vermiyor. Bunun yerine dosyayı Claude ile içe aktar — doğrudan yapabilir.",
        emailFallback: "Claude ile de olmazsa {email} adresine e-posta gönder.",
        tzWarning:
            "Saat dilimin ayarlı değil; saatler UTC olarak okunur ve yanlış güne düşebilir. Önce saat dilimini Claude ile ayarla.",
        dropChoose: "Bir CSV dosyası seç",
        dropOr: "ya da buraya sürükle",
        recognizedHint:
            "MyFitnessPal, Cronometer, Lose It! ve MacroFactor dosyaları otomatik tanınır. Sen onaylayana kadar hiçbir şey kaydedilmez.",
        dateMapHint:
            "Dosyandaki bir değerin nasıl dönüştüğünü görmek için yukarıdan bir tarih kolonu eşle.",
        dateNoneHint: "O kolonda hiç tarih yok.",
        dateUnreadable:
            "{raw} → {format} olarak okunamıyor, bu tür satırlar atlanacak",
        dateConverted: "{raw} → {result}",
        energyMapHint:
            "Dosyandaki bir değerin nasıl dönüştüğünü görmek için yukarıdan bir kalori kolonu eşle.",
        energyNoneHint: "O kolonda hiç sayı yok.",
        energyConverted: "{v} kJ → {kcal} kcal",
        energyNoConversion: "{v} kcal → {v} kcal (dönüşüm yok)",
        dateAmbiguousWarning:
            "Bu dosyadan tarih biçimi anlaşılamadı — tarihleri hem gün önce hem ay önce olarak okumak aynı derecede mümkün. Lütfen uygulamanın hangisini verdiğini onayla: yanlış seçim, hiç hata vermeden yemekleri yanlış güne kaydeder.",
        dateFormatLabel: "Bu dosyadaki tarih biçimi",
        dateFormatYmd: "Yıl-Ay-Gün",
        dateFormatDmy: "Gün/Ay/Yıl",
        dateFormatMdy: "Ay/Gün/Yıl",
        energyUnitLabel: "Kalori kolonunun enerji birimi",
        energyUnitKcal: "Kalori",
        energyUnitKj: "Kilojul",
        mapColumnsHeading: "Kolonları eşle",
        rowsCount: { one: "{n} satır", other: "{n} satır" },
        columnsCount: { one: "{n} kolon", other: "{n} kolon" },
        delimiterLabel: "ayırıcı",
        tabLabel: "sekme",
        notInFile: "(bu dosyada yok)",
        columnFallback: "{n}. kolon",
        caffeineGramsNotice:
            "Bu dosyadaki kafein kolonu ({column}) gram cinsinden, ama kafein miligram olarak saklanıyor; bu yüzden Kafein eşlenmedi. Eşlenseydi etiketinde 180 mg yazan değer 0,18 olarak kaydedilirdi. Aynı dosyayı sonra yeniden aktarmak bunu tamamlamaz — o satırlar zaten kayıtlı olur ve kopya olarak atlanır. Kolon başlığı yanlışsa ve değerler gerçekten miligramsa kolonu yukarıdan seç; gerçekten gramsa içe aktarmadan önce dosyada 1000 ile çarp, sonradan değil.",
        alcoholNotice:
            "Bu dosyada bir alkol kolonu ({column}) var, ama bu hesapta alkol takibi kapalı; bu yüzden içe aktarılmayacak. Aynı dosyayı sonra yeniden aktarmak bunu tamamlamaz — o satırlar zaten kayıtlı olur ve kopya olarak atlanır. Bu veriyi saklamak istiyorsan içe aktarmadan önce alkol takibini (set_alcohol_tracking) açmayı Claude ile hallet.",
        sampleValue: "örn. {sample}",
        sourceAppLabel: "Kaynak uygulama (isteğe bağlı)",
        sourceAppHint:
            "Kendi yemek adı olmayan satırları etiketlemek için kullanılır.",
        previewButton: "İçe aktarmayı önizle",
        chooseAnotherButton: "Başka dosya seç",
        previewHeading: "Önizleme",
        mealsToImport: {
            one: "İçe aktarılacak {n} yemek",
            other: "İçe aktarılacak {n} yemek",
        },
        kcalTotal: "toplam {kcal} kcal",
        rowsSkipped: {
            one: "{n} satır atlandı",
            other: "{n} satır atlandı",
        },
        batchCount: { one: "{n} grup", other: "{n} grup" },
        datesReadAs: "Tarihler {format} olarak okundu; enerji {conversion}.",
        energyConvertedNote: "kJ değerleri kcal birimine dönüştürüldü",
        energyReadAsKcal: "kcal olarak okundu",
        badDatesWarning: {
            one: "{n} satır atlandı, çünkü tarihi {format} olarak okunamadı{sample}. Geri dön ve dosyana uyan tarih biçimini seç.",
            other: "{n} satır atlandı, çünkü tarihleri {format} olarak okunamadı{sample}. Geri dön ve dosyana uyan tarih biçimini seç.",
        },
        badDateSample: " (örn. satır {line}: {value})",
        noTimeWarning: {
            one: "{n} satırda tarih var ama saat yok — öğlen olarak kaydedilecek.",
            other: "{n} satırda tarih var ama saat yok — öğlen olarak kaydedilecek.",
        },
        splitDatesCount: {
            one: "{n} tarihte",
            other: "{n} tarihte",
        },
        splitDatesWarning:
            " {max} yemekten fazla kayıt var (örn. {date}) ve içe aktarma ayrı gruplara bölünmek zorunda kaldı. O tarihte yemeği, öğün türü ve makroları tamamen aynı olan iki kayıt varsa biri içe aktarılmak yerine kopya olarak atlanabilir.",
        tableAbbr: {
            protein_g: "P",
            carbs_g: "K",
            fat_g: "Y",
            fiber_g: "Lif",
            sugar_g: "Şkr",
            added_sugar_g: "İlv",
            saturated_fat_g: "Doy.",
            trans_fat_g: "Trans",
            alcohol_g: "Alk",
            caffeine_mg: "Kaf",
            sodium_mg: "Na",
        },
        tableLine: "Satır",
        tableWhen: "Zaman",
        tableMeal: "Öğün",
        tableFood: "Yemek",
        tableProblem: "Sorun",
        noNameFallback: "(ad yok — öğün türüyle etiketlenecek)",
        showingRows: "{total} satırın {shown} tanesi gösteriliyor",
        checkingRows: {
            one: "{n} satır kontrol ediliyor…",
            other: "{n} satır kontrol ediliyor…",
        },
        importingRows: {
            one: "{n} satır içe aktarılıyor…",
            other: "{n} satır içe aktarılıyor…",
        },
        batchProgress: "{label} (grup {done}/{total})",
        rowsRange: "Satır {a}–{b}: {msg}",
        preflightFailed: "Ön kontrol başarısız oldu.",
        rowsWouldFail: {
            one: "{n} satır başarısız olurdu, örn. satır {line}: {message}",
            other: "{n} satır başarısız olurdu, örn. satır {line}: {message}",
        },
        importingEllipsis: "İçe aktarılıyor…",
        importButton: {
            one: "{n} yemeği içe aktar",
            other: "{n} yemeği içe aktar",
        },
        backToMapping: "Eşlemeye dön",
        importCompleteHeading: "İçe aktarma tamamlandı",
        resultMealsImported: {
            one: "{n} yemek aktarıldı",
            other: "{n} yemek aktarıldı",
        },
        resultAlreadyLogged: {
            one: ", {n} zaten kayıtlı",
            other: ", {n} zaten kayıtlı",
        },
        resultFailed: {
            one: ", {n} başarısız",
            other: ", {n} başarısız",
        },
        resultSkipped: {
            one: ", {n} atlandı",
            other: ", {n} atlandı",
        },
        restartButton: "Başka bir dosya aktar",
        couldNotReadFile: "Dosya okunamadı: {msg}",
        noDataRows: "O dosyada veri satırı bulunamadı.",
        emailNotice:
            "Beklediğin gibi çalışmıyor mu? {email} adresine e-posta gönder ve aşağıdaki satırları ekle — sorunu anlamak için gereken her şey bu.",
    },
    digest: {
        loading: "Loading your digest…", // i18n:pending
        eyebrow: "Nutrition digest · {range}", // i18n:pending
        daySoFar: "{date} · so far, {time}", // i18n:pending
        rangeEnds: "{range} · ends yesterday", // i18n:pending
        labels: {
            calories: "Calories", // i18n:pending
            protein_g: "Protein", // i18n:pending
            carbs_g: "Carbs", // i18n:pending
            fat_g: "Fat", // i18n:pending
            fiber_g: "Fiber", // i18n:pending
            sugar_g: "Sugar", // i18n:pending
            added_sugar_g: "Added sugar", // i18n:pending
            saturated_fat_g: "Saturated fat", // i18n:pending
            trans_fat_g: "Trans fat", // i18n:pending
            sodium_mg: "Sodium", // i18n:pending
            caffeine_mg: "Caffeine", // i18n:pending
            alcohol_g: "Alcohol", // i18n:pending
            water_ml: "Water", // i18n:pending
            weight: "Weight", // i18n:pending
        },
        inline: {
            calories: "calories", // i18n:pending
            protein_g: "protein", // i18n:pending
            carbs_g: "carbs", // i18n:pending
            fat_g: "fat", // i18n:pending
            fiber_g: "fiber", // i18n:pending
            sugar_g: "sugar", // i18n:pending
            added_sugar_g: "added sugar", // i18n:pending
            saturated_fat_g: "saturated fat", // i18n:pending
            trans_fat_g: "trans fat", // i18n:pending
            sodium_mg: "sodium", // i18n:pending
            caffeine_mg: "caffeine", // i18n:pending
            alcohol_g: "alcohol", // i18n:pending
            water_ml: "water", // i18n:pending
            weight: "weight", // i18n:pending
        },
        units: {
            kcal: "kcal", // i18n:pending
            g: "g", // i18n:pending
            mg: "mg", // i18n:pending
            L: "L", // i18n:pending
            kg: "kg", // i18n:pending
            lb: "lb", // i18n:pending
        },
        drinkLabels: { us: "US drinks", uk: "UK units" }, // i18n:pending
        sep: " · ", // i18n:pending
        verdict: {
            calOverPast: "calories went over", // i18n:pending
            calOverToday: "calories over budget", // i18n:pending
            calOnTrack: "calories on track", // i18n:pending
            calOnTarget: "calories on target", // i18n:pending
            calJustUnder: "calories just under target", // i18n:pending
            calUnder: "calories under target", // i18n:pending
            calMostly: "calories mostly on target", // i18n:pending
            calOverMost: "calories over most days", // i18n:pending
            calUnderMost: "calories under target most days", // i18n:pending
            calSome: "calories on target some days", // i18n:pending
            overPast: "{list} went over", // i18n:pending
            overToday: "{list} over", // i18n:pending
            limitsOver: { one: "{n} limit over", other: "{n} limits over" }, // i18n:pending
            shortPast: "{list} fell short", // i18n:pending
            shortToday: "{list} to go", // i18n:pending
            targetsShortPast: {
                one: "{n} target fell short", // i18n:pending
                other: "{n} targets fell short", // i18n:pending
            },
            targetsShortToday: {
                one: "{n} target to go", // i18n:pending
                other: "{n} targets to go", // i18n:pending
            },
            allMetPast: "every goal met", // i18n:pending
            allMetToday: "every goal on track", // i18n:pending
            rising: "{label} rising", // i18n:pending
            falling: "{label} falling", // i18n:pending
            logged: "logged {n} of {of} days", // i18n:pending
            missTarget: "{label} short most days", // i18n:pending
            missLimit: "{label} often over", // i18n:pending
            noMiss: "no goal missed most days", // i18n:pending
        },
        emptyTitle: {
            today: "Nothing logged today yet", // i18n:pending
            yesterday: "Nothing was logged yesterday", // i18n:pending
            range: "Nothing logged in the last {n} days", // i18n:pending
        },
        emptyText: {
            today: "Meals, water and weigh-ins you log today show up here, with goals and trends.", // i18n:pending
            day: "Meals, water and weigh-ins you log for a day show up here, with goals and trends.", // i18n:pending
            range: "Meals, water and weigh-ins you log over a period show up here, with goals and trends.", // i18n:pending
        },
        intakeDay: "{kcal} kcal · {meals}", // i18n:pending
        intakeRange: "{kcal} kcal a day · logged {n} of {of} days", // i18n:pending
        mealCount: { one: "{n} meal", other: "{n} meals" }, // i18n:pending
        noGoals: "No goals set", // i18n:pending
        score: {
            met: "{n} of {of} goals met", // i18n:pending
            onTrack: "{n} of {of} goals on track", // i18n:pending
            mostly: "{n} of {of} goals mostly met", // i18n:pending
            partial: "{score} · partial logs", // i18n:pending
        },
        sections: {
            calories: "Calories", // i18n:pending
            goals: "Goals at a glance", // i18n:pending
            trends: "Trends", // i18n:pending
            nutrients: "Nutrients", // i18n:pending
            cards: "Water & weight", // i18n:pending
            cardsHidden: "Water and weight", // i18n:pending
            meals: "Meals", // i18n:pending
            highlights: "Highlights", // i18n:pending
            rest: "For the rest of today", // i18n:pending
        },
        meta: {
            final: "final", // i18n:pending
            soFar: "so far", // i18n:pending
            rightNow: "right now", // i18n:pending
            daysMet: "days met / logged", // i18n:pending
            dailyAvg: "Daily average, logged days", // i18n:pending
            dayTotal: "Day total", // i18n:pending
            soFarToday: "So far today", // i18n:pending
            tapMeal: "tap a meal for items", // i18n:pending
            habits: "logging habits", // i18n:pending
            last14: "last 14 days", // i18n:pending
            last14Today: "last 14 days · today so far", // i18n:pending
            fewDays: "few days logged · read loosely", // i18n:pending
            vsPrev: "vs previous {n} days (grey)", // i18n:pending
            waterAvg: "water: daily avg", // i18n:pending
        },
        fold: "Fold {section}", // i18n:pending
        unfold: "Unfold {section}", // i18n:pending
        showMore: "Show more", // i18n:pending
        showLess: "Show less", // i18n:pending
        collapseAll: "Collapse all", // i18n:pending
        gauge: {
            ofGoal: "of {goal} kcal", // i18n:pending
            kcal: "kcal", // i18n:pending
            aria: "{kcal} of {goal} kcal {when}, {pct}% of goal.", // i18n:pending
            ariaNoGoal: "{kcal} kcal {when}.", // i18n:pending
            onDate: "on {date}", // i18n:pending
            soFarToday: "so far today", // i18n:pending
            ariaMeals: "Meals: {list}", // i18n:pending
            ariaMeal: "{name} {kcal} kcal", // i18n:pending
            segment: "{name}, {kcal} kcal", // i18n:pending
            finished: "You finished {b} your goal", // i18n:pending
            kcalUnder: "{x} kcal under", // i18n:pending
            kcalOver: "{x} kcal over", // i18n:pending
            kcalLeft: "{x} kcal left", // i18n:pending
            todayLine: "{b} · {meals} so far", // i18n:pending
            mealsOnly: "{meals}", // i18n:pending
            hint: "Tap a meal piece for details", // i18n:pending
            popMeta: "{meta} · {pct}% of the day’s goal", // i18n:pending
            popMetaNoGoal: "{meta}", // i18n:pending
            totalOnly: "Logged as a total, no items", // i18n:pending
            closeMeal: "Close meal details", // i18n:pending
        },
        range: {
            avg: "avg", // i18n:pending
            kcalDay: "kcal/day", // i18n:pending
            rightOn: "right on your {goal} kcal goal", // i18n:pending
            overGoal: "{x} kcal over your {goal} kcal goal", // i18n:pending
            underGoal: "{x} kcal under your {goal} kcal goal", // i18n:pending
            footMet: "{met} of {n}", // i18n:pending
            footRest: "logged days on target", // i18n:pending
            footOver: "{n} over", // i18n:pending
            footUnder: "{n} under", // i18n:pending
            legendOn: "on target", // i18n:pending
            legendUnder: "under", // i18n:pending
            legendOver: "over", // i18n:pending
            zone: "Target zone {lo}–{hi} kcal", // i18n:pending
            prev: "Previous {n} days: {avg} kcal/day", // i18n:pending
            barNone: "{date}: nothing logged", // i18n:pending
            barOver: "{date}: {kcal} kcal, over goal", // i18n:pending
            barOn: "{date}: {kcal} kcal, on target", // i18n:pending
            barUnder: "{date}: {kcal} kcal, under target", // i18n:pending
            barPlain: "{date}: {kcal} kcal", // i18n:pending
            popSub: "{kcal} kcal · {meals}", // i18n:pending
            popOver: "{x} over", // i18n:pending
            nothingThisDay: "Nothing logged this day", // i18n:pending
            closeDay: "Close day details", // i18n:pending
        },
        groups: {
            over: "Over", // i18n:pending
            near: "Near limit", // i18n:pending
            short: "Short", // i18n:pending
            togo: "To go", // i18n:pending
            met: "Met", // i18n:pending
            onTrack: "On track", // i18n:pending
            mostlyMet: "Mostly met", // i18n:pending
            mixed: "Mixed", // i18n:pending
            mostlyMissed: "Mostly missed", // i18n:pending
            days: { one: "day", other: "days" }, // i18n:pending
            nrDay: {
                one: "{list} wasn’t recorded — left out of the goals.", // i18n:pending
                other: "{list} weren’t recorded — left out of the goals.", // i18n:pending
            },
            nrRange: {
                one: "{list} wasn’t recorded on any day — left out of the goals.", // i18n:pending
                other: "{list} weren’t recorded on any day — left out of the goals.", // i18n:pending
            },
        },
        trends: {
            rising: "↑ rising", // i18n:pending
            falling: "↓ falling", // i18n:pending
            noClear: "→ no clear trend", // i18n:pending
            steady: "→ steady", // i18n:pending
            avg7: "7-day avg {a}, was {b}", // i18n:pending
            todaySoFar: "Today so far {v}", // i18n:pending
            noneToday: "None so far today", // i18n:pending
            nothingToday: "Nothing logged yet today", // i18n:pending
            dayAboutAvg: "Yesterday ≈ avg", // i18n:pending
            dayVsAvg: "Yesterday {pct}% vs avg", // i18n:pending
            noneDay: "None yesterday", // i18n:pending
            notLoggedDay: "Not logged yesterday", // i18n:pending
            perDay: "{d} a day", // i18n:pending
            was: "was {b} a day", // i18n:pending
            wasAvg: "was {b} avg", // i18n:pending
            steadyNote: "Steady: {list}.", // i18n:pending
            alsoNote: "Also moving: {list}.", // i18n:pending
            mixedNote: "Up and down, no clear trend: {list}.", // i18n:pending
            fewNote: "Too few logged days to tell: {list}.", // i18n:pending
            none: "Not enough logged days yet to show trends.", // i18n:pending
            aria: "{label}: {dir}, {l1}, {l2}", // i18n:pending
            dirWord: {
                rising: "rising", // i18n:pending
                falling: "falling", // i18n:pending
                noClear: "no clear trend", // i18n:pending
                steady: "steady", // i18n:pending
            },
        },
        table: {
            noGoal: "no goal", // i18n:pending
            notRecorded: "not recorded", // i18n:pending
            notLogged: "not logged", // i18n:pending
            over: "+{x} over", // i18n:pending
            short: "{x} short", // i18n:pending
            togo: "{x} to go", // i18n:pending
            met: "met", // i18n:pending
            done: "done", // i18n:pending
            none: "none", // i18n:pending
            under: "{x} under", // i18n:pending
            left: "{x} left", // i18n:pending
            onTarget: "on target", // i18n:pending
            nearLimit: "near limit", // i18n:pending
            atLimit: "at limit", // i18n:pending
            target: "/ ≥ {g}", // i18n:pending
            limit: "/ ≤ {g}", // i18n:pending
            noGoalUnit: "{u} · no goal", // i18n:pending
            sparse: "Only {n} of {of} days logged — averages cover logged days only.", // i18n:pending
            partial: "Recorded on fewer days: {list}.", // i18n:pending
            partialItem: "{label} {n} of {of}", // i18n:pending
            ariaTarget: "{label}: {value}, target {goal}, {delta}", // i18n:pending
            ariaLimit: "{label}: {value}, limit {goal}, {delta}", // i18n:pending
            ariaPlain: "{label}: {value}", // i18n:pending
        },
        water: {
            of: "of {goal}", // i18n:pending
            aDay: "a day", // i18n:pending
            metDays: "goal met {n} of {of} days", // i18n:pending
            noneToday: "No water logged yet today", // i18n:pending
            noneDay: "No water logged that day", // i18n:pending
            noneRange: "No water logged in this period", // i18n:pending
            dot: "{date}: {v}", // i18n:pending
        },
        weight: {
            thisMorning: "Weighed in this morning", // i18n:pending
            thatMorning: "Weighed in that day", // i18n:pending
            last: "Last weigh-in {date}", // i18n:pending
            noChange: "no change", // i18n:pending
            vs: "vs {date}", // i18n:pending
            first: "first weigh-in", // i18n:pending
            latest: "Latest · {date}", // i18n:pending
            since: {
                one: "since {date} · {n} weigh‑in", // i18n:pending
                other: "since {date} · {n} weigh‑ins", // i18n:pending
            },
            only1: "only 1 weigh‑in this period", // i18n:pending
            goal: "Goal {v}", // i18n:pending
            noneRecent: "No recent weigh-in · last {v} on {date}", // i18n:pending
            noneYet: "No weigh-ins yet", // i18n:pending
            nonePeriod: "No weigh-in this period · last {v} on {date}", // i18n:pending
        },
        meals: {
            types: {
                breakfast: "Breakfast", // i18n:pending
                lunch: "Lunch", // i18n:pending
                dinner: "Dinner", // i18n:pending
                snack: "Snack", // i18n:pending
                drink: "Drink", // i18n:pending
            },
            macro: "{x} {label}", // i18n:pending
            totalOnly: "total only", // i18n:pending
            daysLogged: "Days logged", // i18n:pending
            mealsADay: "Meals a day", // i18n:pending
            ofDays: "{n} of {of}", // i18n:pending
            typical: "Typical times", // i18n:pending
            typicalItem: "{type} {time}", // i18n:pending
            topFoods: "Top foods by calories", // i18n:pending
            times: "×{n}", // i18n:pending
            best: "Best day", // i18n:pending
            tough: "Toughest day", // i18n:pending
            goalsMet: "{n} of {of} goals met", // i18n:pending
            whyOver: "{list} over", // i18n:pending
            whyLimits: { one: "{n} limit over", other: "{n} limits over" }, // i18n:pending
            whyShort: "{list} short", // i18n:pending
            whyAll: "every recorded goal met", // i18n:pending
        },
        highlights: {
            count: { one: "{n} highlight", other: "{n} highlights" }, // i18n:pending
            sugarA: "Biggest sugar source: ", // i18n:pending
            sugarAToday: "Biggest sugar source so far: ", // i18n:pending
            times: " (×{n})", // i18n:pending
            sugarDay: " — {g}, {pct}% of the day’s sugar.", // i18n:pending
            sugarToday: " — {g}, {pct}% of today’s sugar.", // i18n:pending
            sugarRange: " — {g}, {pct}% of the period’s sugar.", // i18n:pending
            streakA: "Calories in the target zone ", // i18n:pending
            streakB: { one: "{n} day in a row", other: "{n} days in a row" }, // i18n:pending
            streakToday: " up to yesterday.", // i18n:pending
            streakPast: " — the current streak.", // i18n:pending
            gapsA: "Gaps in the log: ", // i18n:pending
            gapsB: {
                one: "{n} day with nothing logged", // i18n:pending
                other: "{n} days with nothing logged", // i18n:pending
            },
            gapsC: " — averages cover logged days only.", // i18n:pending
            overRange: {
                one: "{label} went over on {n} day", // i18n:pending
                other: "{label} went over on {n} days", // i18n:pending
            },
            overToday: "{label} is over so far", // i18n:pending
            overPast: "{label} went over", // i18n:pending
            overEach: " — largest source: {name}, {x} each time (×{n}).", // i18n:pending
            overOnce: " — largest source: {name}, {x}.", // i18n:pending
            shortRange: {
                one: "{label} fell short on {n} day", // i18n:pending
                other: "{label} fell short on {n} days", // i18n:pending
            },
            shortToday: "{label} is still short", // i18n:pending
            shortPast: "{label} fell short", // i18n:pending
            shortFood: " — {name}, logged before, has {x} for {kcal} kcal.", // i18n:pending
            allMetA: "Nothing missed: ", // i18n:pending
            allMetRange: "every goal mostly met", // i18n:pending
            allMetPast: "every goal met", // i18n:pending
            allMetToday: "every goal on track", // i18n:pending
            allMetC: ".", // i18n:pending
        },
        rest: {
            kcalLeft: "Calories left", // i18n:pending
            kcalOver: "Calories over", // i18n:pending
            water: "Water still to drink", // i18n:pending
            togo: "{label} still to go", // i18n:pending
            foodLabel: "Logged before:", // i18n:pending
            food: "{name} — {x} {label}, {kcal} kcal.", // i18n:pending
            summary: {
                one: "{n} amount left", // i18n:pending
                other: "{n} amounts left", // i18n:pending
            },
            reached: "every target reached so far", // i18n:pending
        },
        facts: {
            water: "Water {v}", // i18n:pending
            waterOf: "Water {v} of {goal}", // i18n:pending
            waterDay: "Water {v} a day", // i18n:pending
            weight: "{v}", // i18n:pending
            weightChg: "{v} ({chg})", // i18n:pending
            trend: "{label} {dir}", // i18n:pending
            biggest: "Biggest meal: {name}", // i18n:pending
        },
        summaries: {
            over: "{n} over", // i18n:pending
            near: "{n} near limit", // i18n:pending
            short: "{n} short", // i18n:pending
            togo: "{n} to go", // i18n:pending
            met: "{n} met", // i18n:pending
            onTrack: "{n} on track", // i18n:pending
            mostlyMet: "{n} mostly met", // i18n:pending
            mixed: "{n} mixed", // i18n:pending
            mostlyMissed: "{n} mostly missed", // i18n:pending
            noGoals: "no goals recorded", // i18n:pending
            rising: "{n} rising", // i18n:pending
            falling: "{n} falling", // i18n:pending
            steady: "{n} steady", // i18n:pending
            notEnough: "not enough data", // i18n:pending
            metrics: { one: "{n} metric", other: "{n} metrics" }, // i18n:pending
            water: "Water {v}", // i18n:pending
            noWater: "no water", // i18n:pending
            weight: "Weight {v}", // i18n:pending
            noWeigh: "no weigh-in", // i18n:pending
            daysLogged: "{n} of {of} days logged", // i18n:pending
            mealSpan: "{meals} · {from}–{to}", // i18n:pending
        },
    },
};
