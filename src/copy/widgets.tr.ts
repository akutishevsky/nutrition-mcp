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
        eyebrow: "Import meals", // i18n:pending
        eyebrowWithFile: "Import meals · {file}", // i18n:pending
        stepsLabel: "Import steps", // i18n:pending
        stepAriaDone: "Step {i} of 4: {name}, completed", // i18n:pending
        stepAriaCurrent: "Step {i} of 4: {name}, current", // i18n:pending
        stepAriaUpcoming: "Step {i} of 4: {name}", // i18n:pending
        browseFiles: "Browse files", // i18n:pending
        dropAccept: ".csv or tab-separated text", // i18n:pending
        dropAria: "Choose a CSV file, or drag it here", // i18n:pending
        privacyNote:
            "The file is read here, in this panel. Its rows never pass through the chat — the assistant only gets a one-line summary when the import finishes.", // i18n:pending
        binaryFile:
            "Could not read that file: this looks like a binary file (an Excel workbook?), not CSV text. Export it as CSV and try again.", // i18n:pending
        columnsHeading: "Columns", // i18n:pending
        fieldsMatched: {
            one: "{n} of {total} field matched",
            other: "{n} of {total} fields matched",
        }, // i18n:pending
        tableFieldHead: "Field", // i18n:pending
        tableColumnHead: "Column in your file", // i18n:pending
        tableRow1Head: "Row 1 value", // i18n:pending
        badgeNew: "new", // i18n:pending
        colNumber: "Col {n}", // i18n:pending
        colNumberAuto: "Col {n} · auto", // i18n:pending
        colNumberManual: "Col {n} · set by you", // i18n:pending
        row1Empty: "row 1 empty", // i18n:pending
        alsoUsed: "also {field}", // i18n:pending
        sameColumn: "Same column as {fields}", // i18n:pending
        columnForAria: "Column for {field}", // i18n:pending
        mapRowAria: "{field}{required}: {column}{sample}", // i18n:pending
        requiredAria: ", required", // i18n:pending
        columnAria: "column {n}, {name}", // i18n:pending
        notInFileAria: "not in this file", // i18n:pending
        sampleAria: ", {sample}", // i18n:pending
        howRead: "How values are read", // i18n:pending
        appExport: "{app} export", // i18n:pending
        tileMeals: { one: "meal to import", other: "meals to import" }, // i18n:pending
        tileKcal: "kcal total", // i18n:pending
        tileSkipped: { one: "row skipped", other: "rows skipped" }, // i18n:pending
        tileBatches: { one: "batch", other: "batches" }, // i18n:pending
        rowsHeading: "Rows", // i18n:pending
        scrollLeft: "Scroll table left", // i18n:pending
        scrollRight: "Scroll table right", // i18n:pending
        previewRegionAria: "Preview of the rows to import", // i18n:pending
        expandAllDays: "Expand all days", // i18n:pending
        collapseAllDays: "Collapse all days", // i18n:pending
        dayRows: { one: "{n} row", other: "{n} rows" }, // i18n:pending
        dayRowsKcal: {
            one: "{n} row · {kcal} kcal",
            other: "{n} rows · {kcal} kcal",
        }, // i18n:pending
        noTimeShort: "no time", // i18n:pending
        lineN: "Line {n}", // i18n:pending
        rowCardAria: "Line {line}, {when}, {meal}, {food}, {kcal}", // i18n:pending
        noMealAria: "no meal", // i18n:pending
        noKcalAria: "no calories", // i18n:pending
        noRowsToImport: "No rows to import with the current mapping.", // i18n:pending
        importOff:
            "Import is off: this host does not let this view write to your log. Ask Claude to import the file instead.", // i18n:pending
        backBusy: "Back is unavailable while batches are being sent.", // i18n:pending
        progressAria: "Import progress, batches", // i18n:pending
        failedRowsAria: "Rows that failed", // i18n:pending
        toldOnly: "The assistant was told only: {summary}", // i18n:pending
        liveStep: "Step {i} of 4, {name}.", // i18n:pending
        liveMapped: "{field}: {column}", // i18n:pending
        liveImporting: {
            one: "Importing. {n} batch.",
            other: "Importing. {n} batches.",
        }, // i18n:pending
        liveDone: {
            one: "Import complete. {n} meal imported.",
            other: "Import complete. {n} meals imported.",
        }, // i18n:pending
        liveNoWrite: "Preflight check failed. Nothing was written.", // i18n:pending
        liveFileError: "Could not use that file.", // i18n:pending
    },
};
