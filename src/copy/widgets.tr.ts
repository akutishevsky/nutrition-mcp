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
        eyebrow: "Goal progress · {when}", // i18n:pending
        today: "Today", // i18n:pending
        todayAt: "Today, {time}", // i18n:pending
        labels: {
            calories: "Calories", // i18n:pending
            protein: "Protein", // i18n:pending
            carbs: "Carbs", // i18n:pending
            fat: "Fat", // i18n:pending
            fiber: "Fiber", // i18n:pending
            sugar: "Sugar", // i18n:pending
            added_sugar: "Added sugar", // i18n:pending
            saturated: "Saturated fat", // i18n:pending
            trans: "Trans fat", // i18n:pending
            sodium: "Sodium", // i18n:pending
            caffeine: "Caffeine", // i18n:pending
            alcohol: "Alcohol", // i18n:pending
            water: "Water", // i18n:pending
        },
        names: {
            calories: "calories", // i18n:pending
            protein: "protein", // i18n:pending
            carbs: "carbs", // i18n:pending
            fat: "fat", // i18n:pending
            fiber: "fiber", // i18n:pending
            sugar: "sugar", // i18n:pending
            added_sugar: "added sugar", // i18n:pending
            saturated: "saturated fat", // i18n:pending
            trans: "trans fat", // i18n:pending
            sodium: "sodium", // i18n:pending
            caffeine: "caffeine", // i18n:pending
            alcohol: "alcohol", // i18n:pending
            water: "water", // i18n:pending
        },
        satFatShort: "Sat. fat", // i18n:pending
        kinds: { budget: "budget", target: "target", limit: "limit" }, // i18n:pending
        units: {
            kcal: "kcal", // i18n:pending
            g: "g", // i18n:pending
            mg: "mg", // i18n:pending
            L: "L", // i18n:pending
            ml: "ml", // i18n:pending
            kg: "kg", // i18n:pending
            lb: "lb", // i18n:pending
        },
        listPair: "{a} and {b}", // i18n:pending
        listMore: "{rest} and {last}", // i18n:pending
        listSep: ", ", // i18n:pending
        titleSep: " · ", // i18n:pending
        titleSepPast: ", ", // i18n:pending
        nothingToday: "Nothing logged today yet", // i18n:pending
        nothingPast: "Nothing was logged that day", // i18n:pending
        allOnTrack: {
            one: "Your {n} goal is on track", // i18n:pending
            other: "All {n} goals on track", // i18n:pending
        },
        allMet: { one: "Your {n} goal was met", other: "All {n} goals met" }, // i18n:pending
        overOne: "{a} is over", // i18n:pending
        overNamed: "{list} are over", // i18n:pending
        overMany: { one: "{n} limit is over", other: "{n} limits are over" }, // i18n:pending
        nearNamed: "{list} near the limit", // i18n:pending
        nearMany: {
            one: "{n} goal near the limit", // i18n:pending
            other: "{n} goals near the limit", // i18n:pending
        },
        toGoNamed: "{list} still to go", // i18n:pending
        toGoMany: { one: "{n} target to go", other: "{n} targets to go" }, // i18n:pending
        briefOverOne: "{a} over", // i18n:pending
        briefOverMany: { one: "{n} over", other: "{n} over" }, // i18n:pending
        briefNear: { one: "{n} near the limit", other: "{n} near the limit" }, // i18n:pending
        briefToGoOne: "{a} to go", // i18n:pending
        briefToGoMany: { one: "{n} target to go", other: "{n} targets to go" }, // i18n:pending
        pastOverNamed: "{list} went over", // i18n:pending
        pastOverMany: {
            one: "{n} limit went over", // i18n:pending
            other: "{n} limits went over", // i18n:pending
        },
        pastShortNamed: "{list} fell short", // i18n:pending
        pastShortMany: {
            one: "{n} target fell short", // i18n:pending
            other: "{n} targets fell short", // i18n:pending
        },
        pastCloseNamed: "{list} came close", // i18n:pending
        pastBriefOver: { one: "{n} over", other: "{n} over" }, // i18n:pending
        pastBriefShort: { one: "{n} short", other: "{n} short" }, // i18n:pending
        pastBriefMet: { one: "{n} met", other: "{n} met" }, // i18n:pending
        noGoalsTitle: "No daily goals set", // i18n:pending
        countersAria: "Goals by status", // i18n:pending
        counters: {
            over: "Over", // i18n:pending
            near: "Near limit", // i18n:pending
            togo: "To go", // i18n:pending
            ok: "On track", // i18n:pending
        },
        countersPast: {
            over: "Over", // i18n:pending
            near: "Near limit", // i18n:pending
            togo: "Short", // i18n:pending
            ok: "Met", // i18n:pending
        },
        counterAria: "{label}: {n}. Show them", // i18n:pending
        counterAriaZero: "{label}: {n}", // i18n:pending
        nrNoteToday: "Not recorded today, so not counted: {list}", // i18n:pending
        nrNotePast: "Not recorded that day, so not counted: {list}", // i18n:pending
        emptyToday:
            "Once a meal or water is logged, this shows what is over, what is close and what is still to go.", // i18n:pending
        emptyPast: "There is nothing to compare with the goals for that day.", // i18n:pending
        dailyGoals: "Daily goals: {list}.", // i18n:pending
        goalItem: "{value} {name}", // i18n:pending
        goalLimitItem: "{value} {name} limit", // i18n:pending
        noGoalsToday:
            "No daily goals are set, so there is nothing to compare with. Logged today: {list}.", // i18n:pending
        noGoalsPast:
            "No daily goals are set, so there is nothing to compare with. Logged that day: {list}.", // i18n:pending
        sections: {
            over: "Over the limit", // i18n:pending
            near: "Near the limit", // i18n:pending
            togo: "Still to go", // i18n:pending
            ok: "On track", // i18n:pending
            nr: "Not recorded", // i18n:pending
        },
        sectionsPast: {
            over: "Went over", // i18n:pending
            near: "Close to the limit", // i18n:pending
            togo: "Fell short", // i18n:pending
            ok: "Met", // i18n:pending
            nr: "Not recorded", // i18n:pending
        },
        showAll: "Show all goals", // i18n:pending
        showMore: "Show more", // i18n:pending
        showLess: "Show less", // i18n:pending
        collapseAll: "Collapse all", // i18n:pending
        done: "Done", // i18n:pending
        met: "Met", // i18n:pending
        toGo: "to go", // i18n:pending
        short: "short", // i18n:pending
        over: "over", // i18n:pending
        left: "left", // i18n:pending
        under: "under", // i18n:pending
        ofLimit: "of limit", // i18n:pending
        notRecorded: "not recorded", // i18n:pending
        noDayTotal: "no day total", // i18n:pending
        ofGoal: "{value} of {goal}", // i18n:pending
        rowAria: "{label} {kind}: {status}, {detail}", // i18n:pending
        restTitle: "For the rest of today", // i18n:pending
        cellCaloriesLeft: "Calories left", // i18n:pending
        cellCalories: "Calories", // i18n:pending
        cellToGo: "{label} to go", // i18n:pending
        cellOver: "+{value} over", // i18n:pending
        cellPct: "{pct}% of limit", // i18n:pending
        cellAria: "{key}: {value}", // i18n:pending
        hintOverK: "Over budget:", // i18n:pending
        hintOver: "{over} above the {goal} budget.", // i18n:pending
        hintOverWater: "{over} above the {goal} budget; water {left} to go.", // i18n:pending
        hintFoodK: "Logged before:", // i18n:pending
        hintFood: "{food} — {facts}.", // i18n:pending
        hintToGoK: "Still to go:", // i18n:pending
        hintWaterK: "Water:", // i18n:pending
        hintOverLimitK: "Over the limit:", // i18n:pending
        hintNearK: "Close to the limit:", // i18n:pending
        hintList: "{list}.", // i18n:pending
        waterLeft: {
            one: "{left} to go, about {n} glass of 250 ml.", // i18n:pending
            other: "{left} to go, about {n} glasses of 250 ml.", // i18n:pending
        },
        hintAllK: "All set:", // i18n:pending
        hintAll: "every goal is on track.", // i18n:pending
        leadK: "Biggest source:", // i18n:pending
        leadV: "{name} — {value} {nutrient}", // i18n:pending
        gapTitle: "Foods you’ve logged before", // i18n:pending
        mealsTitle: "Where it came from", // i18n:pending
        waterToday: "Logged today", // i18n:pending
        waterPast: "Logged that day", // i18n:pending
        totalOnly: "total only", // i18n:pending
        mealFallback: "Meal", // i18n:pending
        mealTypes: {
            breakfast: "Breakfast", // i18n:pending
            lunch: "Lunch", // i18n:pending
            dinner: "Dinner", // i18n:pending
            snack: "Snack", // i18n:pending
        },
        noMealsToday: "No meals logged today.", // i18n:pending
        noMealsPast: "No meals logged that day.", // i18n:pending
        noWaterToday: "No water logged today.", // i18n:pending
        noWaterPast: "No water logged that day.", // i18n:pending
        otherMealsNone: {
            one: "{n} other meal had none.", // i18n:pending
            other: "{n} other meals had none.", // i18n:pending
        },
        missingNote: {
            one: "Not recorded for {n} meal; the total counts only the meals that had it.", // i18n:pending
            other: "Not recorded for {n} meals; the total counts only the meals that had it.", // i18n:pending
        },
        nrOne: "{label} wasn’t recorded for “{meal}”, so there is no day total to compare with the {goal} {kind}.", // i18n:pending
        nrMany: {
            one: "{label} wasn’t recorded for {n} meal, so there is no day total to compare with the {goal} {kind}.", // i18n:pending
            other: "{label} wasn’t recorded for {n} meals, so there is no day total to compare with the {goal} {kind}.", // i18n:pending
        },
        sources: {
            usda: "USDA", // i18n:pending
            openfoodfacts: "Open Food Facts", // i18n:pending
            user: "your figure", // i18n:pending
            estimate: "estimate", // i18n:pending
            mixed: "mixed sources", // i18n:pending
        },
        weight: "Weight", // i18n:pending
        weightAbove: "{delta} above your {target} goal", // i18n:pending
        weightBelow: "{delta} below your {target} goal", // i18n:pending
        weightAt: "at your {target} goal", // i18n:pending
        weightNoGoal: "no goal set", // i18n:pending
        weightLatest: "latest reading, {date}", // i18n:pending
        weightNone: "no reading yet", // i18n:pending
        weightNoneGoal: "no reading yet · goal {target}", // i18n:pending
        transNote: "no limit set, shown for reference", // i18n:pending
        drinks: {
            us: { one: "{n} US drink", other: "{n} US drinks" }, // i18n:pending
            uk: { one: "{n} UK unit", other: "{n} UK units" }, // i18n:pending
        },
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
};
