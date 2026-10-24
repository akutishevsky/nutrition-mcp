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
        empty: "Bu aralıkta henüz kilo kaydı yok.",
        eyebrowToday: "Weight · today", // i18n:pending
        eyebrowLast: "Weight · last weigh-in {date}", // i18n:pending
        titleFirst: "First weigh-in logged", // i18n:pending
        titleFew: "A few weigh-ins so far", // i18n:pending
        titleNoRate: "Not enough recent weigh-ins for a weekly rate", // i18n:pending
        titleSteady: "Holding steady", // i18n:pending
        titleDown: "Trending down", // i18n:pending
        titleUp: "Trending up", // i18n:pending
        titleGoalReached: "Goal reached", // i18n:pending
        titleAway: "Drifting away from your goal", // i18n:pending
        titleOnTrack: "On track for your goal", // i18n:pending
        titleShortSteady: "Holding steady, short of your goal", // i18n:pending
        rangeGroupAriaLabel: "Range", // i18n:pending
        ranges: {
            // i18n:pending
            "7": {
                // i18n:pending
                label: "7d", // i18n:pending
                aria: "Show last 7 days", // i18n:pending
                word: "the last 7 days", // i18n:pending
                inRange: "in 7 days", // i18n:pending
                heading: "last 7 days", // i18n:pending
                chip: "7 d", // i18n:pending
            }, // i18n:pending
            "30": {
                // i18n:pending
                label: "30d", // i18n:pending
                aria: "Show last 30 days", // i18n:pending
                word: "the last 30 days", // i18n:pending
                inRange: "in 30 days", // i18n:pending
                heading: "last 30 days", // i18n:pending
                chip: "30 d", // i18n:pending
            }, // i18n:pending
            "90": {
                // i18n:pending
                label: "90d", // i18n:pending
                aria: "Show last 90 days", // i18n:pending
                word: "the last 90 days", // i18n:pending
                inRange: "in 90 days", // i18n:pending
                heading: "last 90 days", // i18n:pending
                chip: "90 d", // i18n:pending
            }, // i18n:pending
            "1y": {
                // i18n:pending
                label: "1y", // i18n:pending
                aria: "Show last year", // i18n:pending
                word: "the last year", // i18n:pending
                inRange: "in a year", // i18n:pending
                heading: "last year", // i18n:pending
                chip: "1 y", // i18n:pending
            }, // i18n:pending
            all: {
                // i18n:pending
                label: "All", // i18n:pending
                aria: "Show all time", // i18n:pending
                word: "all time", // i18n:pending
                inRange: "overall", // i18n:pending
                heading: "all time", // i18n:pending
                chip: "All", // i18n:pending
            }, // i18n:pending
        }, // i18n:pending
        chip: "{change} · {range}", // i18n:pending
        perWeek: "{amount} per week", // i18n:pending
        perWeekAvg: "{amount} per week on average", // i18n:pending
        toGoal: "{value} to goal", // i18n:pending
        weeksApprox: { one: "~{n} week", other: "~{n} weeks" }, // i18n:pending
        yearsPlus: "2+ years", // i18n:pending
        reachedOn: "reached on {date}", // i18n:pending
        movingAway: "moving away from goal", // i18n:pending
        tooFlat: "too flat to project a goal date", // i18n:pending
        hintFew: "A trend line needs at least 4 weigh-ins in the range", // i18n:pending
        hintNoRate: "The weekly rate needs 4 weigh-ins in the last 3 weeks", // i18n:pending
        statPerWeek: "Per week", // i18n:pending
        statGoalPace: "Goal at this pace", // i18n:pending
        statGoalReached: "Goal reached", // i18n:pending
        statToGoal: "To goal", // i18n:pending
        statSince: "Since {date}", // i18n:pending
        unitWeeks: { one: "week", other: "weeks" }, // i18n:pending
        unitYears: "years", // i18n:pending
        goalPill: "Goal {goal} · {left} to go", // i18n:pending
        goalPillReached: "Goal {goal} ✓", // i18n:pending
        goalBelow: "Goal {goal}  ↓ {left} below", // i18n:pending
        goalAbove: "Goal {goal}  ↑ {left} above", // i18n:pending
        today: "Today", // i18n:pending
        yesterday: "Yesterday", // i18n:pending
        whenTime: "{date}, {time}", // i18n:pending
        scrubAvg: "{value} (avg of {n})", // i18n:pending
        hitLabel: "{date}, {value}", // i18n:pending
        hitLabelAvg: "{date}, {value}, average of {n}", // i18n:pending
        chartAriaLabel:
            "Weight chart, latest {latest}{goal}{change}. Tap a day to read its value.", // i18n:pending
        chartAriaGoal: ", goal {goal}", // i18n:pending
        chartAriaChange: ", {change} {range}", // i18n:pending
        close: "Close", // i18n:pending
        oneTitleFirst: "Your trend starts here", // i18n:pending
        oneTitle: "Only one weigh-in in {range}", // i18n:pending
        oneFirst: "First weigh-in · {when} · {value}", // i18n:pending
        oneLine: "{when} · {value}", // i18n:pending
        oneHintFirst: "The chart starts with a second weigh-in", // i18n:pending
        oneHintEarlier: {
            one: "{n} earlier weigh-in day in longer ranges",
            other: "{n} earlier weigh-in days in longer ranges",
        }, // i18n:pending
        emptyRange: "No weigh-ins in {range}.", // i18n:pending
        emptyRangeLast: "No weigh-ins in {range}. The last one was on {date}.", // i18n:pending
        showMore: "Show more", // i18n:pending
        showLess: "Show less", // i18n:pending
        detailsAria: "{action}: weigh-ins and measurements", // i18n:pending
        detailsAriaWeighIns: "{action}: weigh-ins", // i18n:pending
        collapseAll: "Collapse all", // i18n:pending
        sectionWeighIns: "Weigh-ins", // i18n:pending
        sectionMeasurements: "Body measurements · {range}", // i18n:pending
        accLabel: {
            one: "{n} weigh-in {range}",
            other: "{n} weigh-ins {range}",
        }, // i18n:pending
        accEmpty: "No weigh-ins {range}", // i18n:pending
        accAvgRange: "avg {avg} · range {min}–{max}", // i18n:pending
        loggedToday: "logged today", // i18n:pending
        loggedYesterday: "logged yesterday", // i18n:pending
        loggedOn: "logged on {date}", // i18n:pending
        weekThis: "This week", // i18n:pending
        weekLast: "Last week", // i18n:pending
        weekAvg: "avg {value}", // i18n:pending
        weekVsLast: "{change} vs last week", // i18n:pending
        weekVsBefore: "{change} vs week before", // i18n:pending
        dayMulti: {
            one: "{n} weigh-in · averaged",
            other: "{n} weigh-ins · averaged",
        }, // i18n:pending
        showEarlierWeeks: {
            one: "Show {n} earlier week",
            other: "Show {n} earlier weeks",
        }, // i18n:pending
        sites: {
            // i18n:pending
            waist: "Waist", // i18n:pending
            hips: "Hips", // i18n:pending
            neck: "Neck", // i18n:pending
            chest: "Chest", // i18n:pending
            shoulders: "Shoulders", // i18n:pending
            upper_arm: "Upper arm", // i18n:pending
            forearm: "Forearm", // i18n:pending
            thigh: "Thigh", // i18n:pending
            calf: "Calf", // i18n:pending
        }, // i18n:pending
        measSince: "{change} since {date}", // i18n:pending
        changeDown: "↓ {delta}", // i18n:pending
        changeUp: "↑ {delta}", // i18n:pending
        changeFlat: "→ no change", // i18n:pending
        measFirst: "first measurement · {date}", // i18n:pending
        measFirstRow: "first", // i18n:pending
        measStale: "not measured in this range · last on {date}", // i18n:pending
        measEarlier: "Earlier measurements", // i18n:pending
        measHeading: "{site} · {range}", // i18n:pending
        showMoreN: { one: "Show {n} more", other: "Show {n} more" }, // i18n:pending
        noMeasurements:
            "No body measurements in the last year. Waist, hips and seven other sites can be tracked in centimetres or inches.", // i18n:pending
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
