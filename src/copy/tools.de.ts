// German translation of src/copy/tools.ts's ToolsDoc. See that file's header
// for what is structural (never translated: tool names, param names,
// category slugs — kept in TOOLS/BADGE_META) versus prose (translated here).

import type { ToolsDoc } from "./tools.js";

export const TOOLS_DE: ToolsDoc = {
    meta: {
        title: "Werkzeug-Referenz: Alle 38 Werkzeuge",
        description:
            "Alle 38 Werkzeuge, die der Nutrition-MCP-Server deiner KI gibt — Mahlzeiten erfassen, Barcodes scannen, deine Historie aus einer anderen App importieren, Wasser und Gewicht verfolgen, Ziele festlegen und Trends auswerten. Vollständige Referenz mit Beschreibungen und Beispielsätzen.",
        ogDescription:
            "Alle 38 Werkzeuge, die der Nutrition-MCP-Server deiner KI gibt, inklusive eines CSV-Importers für deine Historie aus einer anderen App — mit Beschreibungen und Beispielsätzen.",
    },
    hero: {
        eyebrow: "Referenz",
        title: "Alles, was deine KI kann",
        lead: "Du rufst diese Werkzeuge nie selbst auf — du sprichst einfach, und der Assistent wählt das richtige Werkzeug. Hier ist die vollständige Liste, die der Nutrition-MCP-Server bereitstellt, mit dem, was jedes tut, und einem Satz, der es auslöst.",
        countBold: "38 Werkzeuge",
        countTail: "in 7 Bereichen",
    },
    categories: {
        "logging-food-meals": {
            pillLabel: "Erfassen",
            title: "Essen & Mahlzeiten erfassen",
            description:
                "Der Kern — halte fest, was du gegessen hast, egal wie du es beschreibst.",
        },
        "reviewing-your-meals": {
            pillLabel: "Auswerten",
            title: "Deine Mahlzeiten durchsehen",
            description:
                "Sieh dir an, was du erfasst hast — einen Tag oder einen ganzen Zeitraum auf einmal.",
        },
        water: {
            pillLabel: "Wasser",
            title: "Wasser",
            description:
                "Verfolge deine Flüssigkeitszufuhr neben deinem Essen.",
        },
        weight: {
            pillLabel: "Gewicht",
            title: "Gewicht",
            description:
                "Erfasse Wiegungen, sieh sie dir an und beobachte den Trend zu deinem Ziel.",
        },
        "goals-progress": {
            pillLabel: "Ziele",
            title: "Ziele & Fortschritt",
            description:
                "Leg Ziele fest und sieh, wie jeder Tag im Vergleich abschneidet.",
        },
        "insights-trends": {
            pillLabel: "Einblicke",
            title: "Einblicke & Trends",
            description:
                "Vorberechnete Auswertungen, damit die KI Muster erkennt, ohne selbst zu rechnen.",
        },
        "settings-account": {
            pillLabel: "Einstellungen",
            title: "Einstellungen & Konto",
            description:
                "Einstellungen, die alles genau halten, plus volle Kontrolle über deine Daten.",
        },
    },
    badges: {
        log: "Erfassen",
        widget: "Interaktive UI",
        lookup: "Nachschlagen",
        import: "Import",
        edit: "Bearbeiten",
        remove: "Entfernen",
        view: "Ansehen",
        export: "Export",
        setting: "Einstellung",
    },
    tools: {
        log_meal: {
            description:
                "Erfasse, was du gegessen hast, mit Kalorien und Makros — plus Ballaststoffe, Gesamtzucker, Alkohol und Koffein, wenn die Zahlen vorliegen. Beschreib es in normaler Sprache — die KI schätzt die Zahlen, fragt bei Unklarheit nach der Portionsgröße und kann vorab Angaben von einem Barcode oder aus dem Web holen.",
            params: {
                description: "Was gegessen wurde",
                meal_type: "Frühstück, Mittagessen, Abendessen oder Snack",
                calories: "Kalorien insgesamt",
                protein_g: "Protein in Gramm",
                carbs_g: "Kohlenhydrate in Gramm",
                fat_g: "Fett in Gramm",
                fiber_g:
                    "Ballaststoffe in Gramm. Die KI wird angewiesen, dies bei jeder Mahlzeit auszufüllen und bei fehlender Etikettenangabe aus den Zutaten zu schätzen, denn ein leeres Feld ist keine Null — es lässt den ganzen Tag aus deinem Ballaststoff-Durchschnitt herausfallen",
                sugar_g:
                    '<b>Gesamt</b>zucker in Gramm — die Zahl, die ein Etikett unter „Zucker" angibt, einschließlich des natürlich in Obst und Milch enthaltenen Zuckers, nicht nur zugesetzter Zucker. Wird bei jeder Mahlzeit unter den gleichen Bedingungen wie Ballaststoffe ausgefüllt',
                alcohol_g:
                    "Gramm <b>reinen Alkohols</b>, nicht die Menge des Getränks und nicht sein Alkoholgehalt in Prozent — die KI errechnet es aus Menge und Stärke (ein 330-ml-Bier mit 5 % ergibt 13 g)",
                caffeine_mg:
                    "Koffein in <b>Milligramm</b>, nicht Gramm — das einzige Feld hier, das nicht in Gramm ist, weil so jedes Etikett und jede Richtlinie es angibt (ein gebrühter Kaffee hat etwa 95 mg, ein Espresso 63 mg, eine Dose Cola 34 mg). Koffein liefert keine Kalorien. Anders als Ballaststoffe und Zucker wird es nur bei Dingen gesendet, die tatsächlich Koffein enthalten — eine erfasste 0 würde eine Koffein-Zeile in deinem Dashboard für einen Nährstoff anzeigen, den du nie konsumierst",
                logged_at:
                    "Wann du es gegessen hast, falls nicht jetzt — erlaubt das nachträgliche Erfassen",
                notes: "Zusätzliche Notizen",
            },
            example:
                "Erfasse eine Chicken-Burrito-Bowl mit extra Guacamole zum Mittagessen",
            photoHint:
                "…oder mach einfach ein Foto von deinem Teller — die KI benennt jedes Gericht, schätzt Portionen in alltäglichen Maßen (ein Glas, eine Handvoll), prüft, wie du es früher erfasst hast, und bestätigt mit dir, bevor sie es erfasst.",
        },
        lookup_barcode: {
            description:
                "Ruf die Nährwertangaben eines verpackten Produkts anhand seines Barcodes (8–14-stelliger EAN/UPC) von Open Food Facts ab. Du kannst die Ziffern eintippen oder sie von einem Foto der Verpackung ablesen lassen; das Ergebnis kann dann erfasst werden, skaliert auf die gegessene Menge.",
            params: {},
            example: "Scanne diesen Barcode: 3017620422003",
            photoHint:
                "…oder schick ein Foto der Verpackung — die KI liest die Barcode-Ziffern davon ab.",
        },
        start_meal_import: {
            description:
                "Öffne einen Importer im Chat, um deine Historie aus einer anderen App zu übernehmen — wähl die Datei, die du aus MyFitnessPal, Cronometer, Lose It! oder MacroFactor exportiert hast, ordne ihre Spalten Kalorien, Makros, Ballaststoffen, Zucker und Koffein zu — plus Alkohol, falls du die Alkohol-Erfassung aktiviert hast — und sieh dir an, was hinzugefügt wird, bevor du bestätigst. Die Datei wird in deinem Browser gelesen, nichts wird gespeichert, bis du die Vorschau bestätigst, und ein erneuter Import derselben Datei erzeugt keine Duplikate.",
            params: {},
            example: "Importiere meine Mahlzeiten-Historie aus MyFitnessPal",
        },
        bulk_import_meals: {
            description:
                "Füge eine Reihe vergangener Mahlzeiten auf einmal hinzu — bis zu 50 pro Aufruf — statt sie einzeln zu erfassen. Der Importer oben schreibt darüber, und die KI kann es direkt für Mahlzeitendaten nutzen, die du in den Chat eingefügt hast. Jede Zeile wird zuerst geprüft, und alles, was nicht passt, wird zeilenweise gemeldet, sodass ein erneutes Senden derselben Zeilen sicher ist und nichts verdoppelt, was bereits erfasst ist.",
            params: {
                meals: "Die zu importierenden Zeilen, in der Reihenfolge der Quelldatei (1–50 pro Aufruf). Jede Zeile kann eine Uhrzeit, einen Mahlzeitentyp, eine Beschreibung, Notizen und dieselben Zahlen wie eine erfasste Mahlzeit tragen: <code>calories</code>, <code>protein_g</code>, <code>carbs_g</code>, <code>fat_g</code>, <code>fiber_g</code>, <code>sugar_g</code> (Gesamtzucker), <code>alcohol_g</code> (Gramm reinen Alkohols) und <code>caffeine_mg</code> (Milligramm, nicht Gramm)",
                expected_row_count:
                    "Wie viele Zeilen dieser Aufruf trägt, gezählt aus der Quelldatei, damit eine verlorene Zeile auffällt",
                expected_total_kcal:
                    "Kalorien-Gesamtsumme aus der Quelldatei, abgeglichen mit dem, was ankommt",
                dry_run: "Melde, was passieren würde, ohne etwas zu schreiben",
                on_error:
                    "Importiere die gültigen Zeilen und melde den Rest, oder schreibe nichts, falls eine Zeile fehlschlägt",
                source_app: "Aus welcher App die Datei stammt",
            },
            example:
                "Hier sind die Mahlzeiten der letzten Woche aus meiner alten App — trag sie alle ein",
        },
        update_meal: {
            description:
                "Ändere die Details einer bereits erfassten Mahlzeit — ihre Beschreibung, jeden Makro-, Ballaststoff-, Zucker-, Alkohol- oder Koffeinwert, die Uhrzeit oder Notizen. So wird auch eine Lücke nachträglich gefüllt: Ist eine Mahlzeit ohne Ballaststoffe oder Zucker erfasst worden, weist der Server darauf hin, und die KI trägt es hier nach.",
            params: {
                id: "UUID der zu aktualisierenden Mahlzeit",
                description: "",
                calories: "",
                protein_g: "",
                carbs_g: "",
                fat_g: "",
                fiber_g: "",
                sugar_g: "Gesamtzucker, nicht zugesetzter Zucker",
                alcohol_g:
                    "Gramm reinen Alkohols, nicht die Menge des Getränks",
                caffeine_mg: "Milligramm, nicht Gramm",
                logged_at: "",
                notes: "",
            },
            example:
                "Das Mittagessen waren eigentlich 600 Kalorien, nicht 500 — korrigier das",
        },
        delete_meal: {
            description:
                "Entferne einen versehentlich erfassten Mahlzeiten-Eintrag.",
            params: {
                id: "UUID der zu löschenden Mahlzeit",
            },
            example: "Lösch den Snack, den ich heute Nachmittag erfasst habe",
        },
        search_meals: {
            description:
                'Durchsuche deine vergangenen Mahlzeiten nach Stichwort und sieh sie gruppiert nach wiederkehrenden Varianten — wie oft jede erfasst wurde, wann zuletzt, und ihre typischen Kalorien. So gleicht die KI ein Foto deines Tellers damit ab, wie du diese Mahlzeit tatsächlich früher erfasst hast, und so funktioniert „erfasse mein übliches Frühstück".',
            params: {
                queries:
                    "Alternative Stichwörter für das Lebensmittel, in jeder Sprache, in der du erfasst hast",
                days: "Wie weit zurückgeschaut wird (Standard ein Jahr)",
                limit: "Maximal zu analysierende Einträge",
            },
            example: "Erfasse mein übliches Frühstück",
        },
        get_meals_today: {
            description: "Sieh alle Mahlzeiten, die du heute erfasst hast.",
            params: {},
            example: "Was habe ich heute gegessen?",
        },
        get_meals_by_date: {
            description:
                "Sieh alle Mahlzeiten, die du an einem bestimmten Tag erfasst hast.",
            params: {
                date: "Datum im Format JJJJ-MM-TT",
            },
            example: "Zeig mir alles, was ich am 4. Juli gegessen habe",
        },
        get_meals_by_date_range: {
            description:
                "Ruf alle Mahlzeiten zwischen zwei Daten auf einmal ab — praktisch, um eine Woche oder einen Monat auszuwerten.",
            params: {
                start_date: "Startdatum (JJJJ-MM-TT)",
                end_date: "Enddatum (JJJJ-MM-TT)",
            },
            example: "List meine Mahlzeiten von Montag bis Freitag auf",
        },
        export_all_data: {
            description:
                "Exportiere alles, was du erfasst hast, als ein einziges ZIP — meals.csv, water.csv, weight.csv, goals.csv, profile.csv und eine README.txt, die die Spalten und Einheiten erklärt — mit demselben privaten Link, 60 Minuten gültig. Mahlzeiten sind bisher der einzige Teil, der sich zurück importieren lässt.",
            params: {},
            example:
                "Exportier alle meine Daten — Mahlzeiten, Wasser, Gewicht und Ziele",
        },
        log_water: {
            description:
                "Erfasse einen Flüssigkeitseintrag. Gib ihn in jeder Einheit an — Tassen, Unzen, Liter — er wird für dich in Milliliter umgerechnet.",
            params: {
                amount_ml: "Menge in Millilitern (ganze Zahl, &gt; 0).",
            },
            example: "Ich hab gerade eine 500-ml-Flasche Wasser getrunken",
        },
        get_water_today: {
            description:
                "Sieh die heutige Gesamt-Wassermenge und jeden Eintrag.",
            params: {},
            example: "Wie viel Wasser hatte ich heute?",
        },
        get_water_by_date: {
            description:
                "Sieh deine Wassermenge und Einträge für einen bestimmten Tag.",
            params: {
                date: "Datum im Format JJJJ-MM-TT",
            },
            example: "Wie viel habe ich gestern getrunken?",
        },
        delete_water: {
            description:
                "Entferne einen versehentlich hinzugefügten Wasser-Eintrag.",
            params: {
                id: "UUID des zu löschenden Wasser-Eintrags",
            },
            example: "Entfern den letzten Wasser-Eintrag",
        },
        log_weight: {
            description:
                "Erfasse eine Körpergewichts-Messung in kg oder lb. Mehrere Wiegungen pro Tag sind kein Problem, und der Server speichert es kanonisch, sodass deine Einheiten-Einstellung die Zahl nie verfälscht.",
            params: {
                weight: "Körpergewichtswert, in `unit` (&gt; 0).",
            },
            example: "Erfasse mein Gewicht — heute Morgen 74,2 kg",
        },
        update_weight: {
            description:
                "Korrigiere eine bestehende Wiegung — den Wert, den Zeitstempel oder ihre Notizen.",
            params: {
                id: "UUID des zu aktualisierenden Gewichts-Eintrags",
                weight: "Neuer Gewichtswert, in `unit`.",
                logged_at: "ISO-8601-Zeitstempel",
                notes: "",
            },
            example: "Korrigier die heutige Morgen-Wiegung auf 73,8 kg",
        },
        delete_weight: {
            description: "Entferne einen Gewichts-Eintrag.",
            params: {
                id: "UUID des zu löschenden Gewichts-Eintrags",
            },
            example: "Lösch den heutigen Gewichts-Eintrag",
        },
        get_weight_today: {
            description:
                "Sieh die heutigen Wiegungen, angezeigt in deiner bevorzugten Einheit.",
            params: {},
            example: "Was habe ich heute gewogen?",
        },
        get_weight_by_date: {
            description: "Sieh deine Wiegungen für einen bestimmten Tag.",
            params: {
                date: "Datum im Format JJJJ-MM-TT",
            },
            example: "Was war mein Gewicht am 1.?",
        },
        get_weight_by_date_range: {
            description:
                "Ruf jede Wiegung zwischen zwei Daten ab, gruppiert nach Tag mit dem Durchschnitt jedes Tages.",
            params: {
                start_date: "Startdatum (JJJJ-MM-TT)",
                end_date: "Enddatum (JJJJ-MM-TT)",
            },
            example: "Zeig meine Wiegungen der letzten zwei Wochen",
        },
        get_weight_trends: {
            description:
                "Sieh deinen Gewichtstrend über ein Zeitfenster: letzte Messung, Gesamtveränderung, 7/14/30-Tage-Durchschnitte, Min/Max und Fortschritt zu deinem Zielgewicht.",
            params: {
                days: "Fenstergröße in Tagen (Standard 30, maximal 365).",
            },
            example: "Wie entwickelt sich mein Gewicht diesen Monat?",
        },
        set_weight_unit: {
            description:
                "Wähl, ob Gewichte in kg oder lb angezeigt und eingegeben werden. Gespeicherte Werte sind davon nicht betroffen — nur Anzeige und Standard-Auswertung ändern sich.",
            params: {},
            example: "Verwende ab jetzt Pfund für mein Gewicht",
        },
        get_weight_unit: {
            description: "Prüf, welche Gewichtseinheit du gerade verwendest.",
            params: {},
            example: "Welche Gewichtseinheit verwende ich?",
        },
        set_nutrition_goals: {
            description:
                "Leg deine täglichen Ziele für Kalorien, Makros, Ballaststoffe, Zucker, Alkohol, Koffein und Wasser fest, plus optional ein Ziel-Körpergewicht. Kalorien, Protein, Kohlenhydrate, Fett, Ballaststoffe und Wasser sind Ziele, die du erreichen willst; Zucker, Alkohol und Koffein sind Grenzwerte, die du unterschreiten willst, und der Fortschritt wird entsprechend formuliert. Aktualisiert werden nur die genannten Felder; der Rest bleibt unverändert.",
            params: {
                daily_calories:
                    "Tägliches Kalorienziel (kcal). Null zum Löschen.",
                daily_protein_g:
                    "Tägliches Proteinziel (Gramm). Null zum Löschen.",
                daily_carbs_g:
                    "Tägliches Kohlenhydratziel (Gramm). Null zum Löschen.",
                daily_fat_g: "Tägliches Fettziel (Gramm). Null zum Löschen.",
                daily_fiber_g:
                    "Tägliches Ballaststoffziel (Gramm), ein Minimum, das erreicht werden soll. Null zum Löschen.",
                daily_sugar_g:
                    "Tägliches Limit für <b>Gesamt</b>zucker (Gramm), ein Maximum, das unterschritten werden soll. Gesamtzucker umfasst den natürlich in Obst und Milch enthaltenen Zucker, daher liegen öffentliche Empfehlungen zu zugesetztem Zucker deutlich niedriger. Null zum Löschen.",
                daily_alcohol_g:
                    "Tägliches Alkohol-Limit in Gramm <b>reinen Alkohols</b>, ein Maximum, das unterschritten werden soll. Ein US-Standard-Drink sind 14 g, eine UK-Einheit 7,9 g. Null zum Löschen.",
                daily_caffeine_mg:
                    "Tägliches Koffein-Limit in <b>Milligramm</b>, ein Maximum, das unterschritten werden soll. Die EFSA- und FDA-Obergrenze für gesunde Erwachsene liegt bei 400 mg pro Tag (etwa vier gebrühte Kaffees) und bei 200 mg in der Schwangerschaft. 0 ist ein echtes Limit und bedeutet gar keins. Null zum Löschen.",
                daily_water_ml: "",
                target_weight: "",
            },
            example:
                "Setz meine Ziele auf 2.200 Kalorien, 160 g Protein und ein Zielgewicht von 75 kg",
        },
        get_nutrition_goals: {
            description:
                "Sieh deine aktuellen täglichen Kalorien- und Makro-Ziele, ein eventuelles Ballaststoffziel sowie Zucker- oder Koffein-Limit und — falls du Alkohol erfasst — dein Alkohol-Limit.",
            params: {},
            example: "Was sind meine täglichen Ziele?",
        },
        get_goal_progress: {
            description:
                "Sieh, wie die heutige Aufnahme im Vergleich zu deinen Zielen abschneidet — Aufnahme-vs-Ziel-Ringe plus Fortschritt beim Körpergewicht. Tipp auf einen Makro-Ring, um zu sehen, welche Mahlzeiten dazu beigetragen haben.",
            params: {},
            example: "Wie stehe ich heute im Vergleich zu meinen Zielen da?",
        },
        get_nutrition_summary: {
            description:
                "Ruf tägliche Ernährungssummen über einen Datumsbereich als interaktives Dashboard ab: Makro-Kacheln im Vergleich zu Zielen und eine Aufschlüsselung nach Tag.",
            params: {
                start_date: "Startdatum (JJJJ-MM-TT)",
                end_date: "Enddatum (JJJJ-MM-TT)",
            },
            example: "Gib mir eine Übersicht über die letzte Woche",
        },
        get_trends: {
            description:
                "Gleitende 7/14/30-Tage-Durchschnitte, Schwankungsbreite, Erfassungsserien, Aufschlüsselung nach Wochentag sowie deine besten und schlechtesten Tage für Kalorien und jeden Makro — vorberechnet, damit die KI sie nur noch erzählen muss.",
            params: {
                days: "Fenstergröße in Tagen (Standard 30, maximal 365).",
            },
            example:
                "Wie sehen meine Kalorien- und Makro-Trends der letzten 30 Tage aus?",
        },
        get_meal_patterns: {
            description:
                "Zeig Verhaltensmuster auf: wie oft du jeden Mahlzeitentyp isst, den Frühstückseffekt, kalorienreiche Mittagessen, späte Abendessen, Wochentag vs. Wochenende und auffällige Tage.",
            params: {
                days: "Fenstergröße in Tagen (Standard 30, minimal 7, maximal 365).",
            },
            example:
                "Gibt es Muster darin, wie ich esse — wie späte Abendessen oder ausgelassenes Frühstück?",
        },
        set_timezone: {
            description:
                "Leg deine IANA-Zeitzone fest, damit der Tag um deine lokale Mitternacht wechselt — eine um 23 Uhr erfasste Mahlzeit zählt zu diesem Tag, nicht zum nächsten UTC-Tag.",
            params: {},
            example: "Ich bin in Berlin — stell meine Zeitzone ein",
        },
        get_timezone: {
            description:
                "Prüf, auf welche Zeitzone du eingestellt bist, zusammen mit deinem aktuellen lokalen Datum und der Uhrzeit (Standard UTC, falls nicht eingestellt).",
            params: {},
            example: "Auf welche Zeitzone bin ich eingestellt?",
        },
        get_current_time: {
            description:
                'Prüf das aktuelle Datum und die Uhrzeit in deiner Zeitzone, plus den UTC-Zeitpunkt. Manche Apps sagen dem Assistenten nicht, wie spät es ist — so findet er ohne Nachfrage heraus, was „heute Morgen" oder „heute" bedeutet (Standard UTC, falls keine Zeitzone eingestellt ist).',
            params: {},
            example: "Wie spät ist es gerade bei mir?",
        },
        set_widget_display: {
            description:
                "Schalte die visuellen In-Chat-Widgets ein oder aus — die Dashboards, Ziel-Ringe und Trend-Diagramme. Ausgeschaltet antworten dieselben Werkzeuge nur mit Text und Daten. Standardmäßig aktiviert; die Änderung gilt für neue Unterhaltungen.",
            params: {
                enabled:
                    "true zum Anzeigen der Widgets, false für reine Textantworten",
            },
            example: "Schalt die Widgets aus",
        },
        get_widget_display: {
            description:
                "Prüf, ob die visuellen In-Chat-Widgets derzeit aktiviert sind.",
            params: {},
            example: "Sind die Widgets eingeschaltet?",
        },
        set_alcohol_tracking: {
            description:
                "Schalte die Alkohol-Erfassung ein oder aus und wähl, ob Getränke in US-Standard-Drinks oder UK-Einheiten gezählt werden. Standardmäßig ausgeschaltet, du musst also aktiv danach fragen. Schaltest du es wieder aus, wird Alkohol in Mahlzeiten, Zielen und Fortschritt ausgeblendet, und der Datei-Importer liest die Alkohol-Spalte einer Datei nicht mehr — nichts bereits Erfasstes wird gelöscht, dein CSV-Export enthält es weiterhin, und es taucht wieder auf, wenn du es erneut einschaltest. Die Änderung gilt ab deiner nächsten Nachricht, ohne dass etwas neu gestartet werden muss.",
            params: {
                enabled:
                    "true, um Alkohol in Mahlzeiten, Zielen und Fortschritt anzuzeigen, false, um es auszublenden",
                drink_unit:
                    "Welcher Standard-Drink neben den Gramm angezeigt wird: <code>us</code> (14 g pro Drink) oder <code>uk</code> (7,9 g pro Einheit). Standard <code>us</code>; gespeichert werden tatsächlich Gramm reinen Alkohols.",
            },
            example:
                "Fang an, meinen Alkoholkonsum zu erfassen, in UK-Einheiten",
        },
        get_alcohol_tracking: {
            description:
                "Prüf, ob die Alkohol-Erfassung aktiviert ist und neben welchem Standard-Drink deine Gramm angezeigt werden.",
            params: {},
            example: "Erfasse ich Alkohol?",
        },
        delete_account: {
            description:
                "Lösch dein Konto und alle zugehörigen Daten dauerhaft. Das ist unumkehrbar — die KI bestätigt immer zuerst mit dir.",
            params: {},
            example: "Lösch mein Konto und alle meine Daten",
        },
    },
};
