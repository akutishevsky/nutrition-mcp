// German translation of src/copy/tools.ts's ToolsDoc. See that file's header
// for what is structural (never translated: tool names, param names,
// category slugs — kept in TOOLS/BADGE_META) versus prose (translated here).

import type { ToolsDoc } from "./tools.js";

export const TOOLS_DE: ToolsDoc = {
    meta: {
        title: "48 Werkzeuge für Kalorien, Makros, Wasser & Gewicht",
        description:
            "Alle 48 Werkzeuge für Claude, ChatGPT & Co.: Mahlzeiten erfassen, häufige Mahlzeiten speichern, Barcodes scannen, MyFitnessPal- oder Cronometer-CSV importieren, Wasser, Gewicht und Körpermaße tracken.",
        ogDescription:
            "Alle 48 Werkzeuge, die der Nutrition-MCP-Server deiner KI bereitstellt – von gespeicherten Mahlzeiten bis zum CSV-Importer für deinen Verlauf, mit Beschreibungen und Beispielsätzen.",
    },
    hero: {
        eyebrow: "Referenz",
        titleBeforeEm: "Alles, was deine KI ",
        titleEm: "kann",
        titleAfterEm: "",
        lead: "Du rufst diese Werkzeuge nie selbst auf – du sprichst einfach mit Claude, ChatGPT oder einem anderen MCP-Client, und der wählt das passende Werkzeug. Hier findest du jedes Werkzeug, das der Nutrition-MCP-Server für Mahlzeiten und gespeicherte Mahlzeiten, Kalorien und Makros, Wasser und Gewicht bereitstellt – jeweils mit Beschreibung und einem Beispielsatz, der es auslöst.",
        countBold: "48 Werkzeuge",
        countTail: "in 7 Bereichen",
    },
    categories: {
        "logging-food-meals": {
            pillLabel: "Erfassen",
            title: "Essen & Mahlzeiten erfassen",
            description:
                "Das Herzstück – halte fest, was du gegessen hast, egal wie du es beschreibst, und speichere Mahlzeiten, die du oft isst, um sie mit einer Zeile erneut zu erfassen.",
        },
        "reviewing-your-meals": {
            pillLabel: "Rückblick",
            title: "Deine Mahlzeiten im Rückblick",
            description:
                "Sieh dir an, was du erfasst hast – einen Tag oder einen ganzen Zeitraum auf einmal.",
        },
        water: {
            pillLabel: "Wasser",
            title: "Wasser-Tracking",
            description:
                "Behalte deine Flüssigkeitszufuhr neben dem Essen im Blick.",
        },
        weight: {
            pillLabel: "Körper",
            title: "Gewicht & Körpermaße",
            description:
                "Erfasse Wiegungen und Maßband-Maße, sieh sie dir an und verfolge deinen Gewichtstrend Richtung Zielgewicht.",
        },
        "goals-progress": {
            pillLabel: "Ziele",
            title: "Ziele & Fortschritt",
            description:
                "Leg Ziele fest und sieh, wie jeder Tag dabei abschneidet.",
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
                "Einstellungen, damit alle Werte stimmen, plus volle Kontrolle über deine Daten.",
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
    ui: {
        parametersLabel: "Parameter",
        requiredLabel: "erforderlich",
        optionalLabel: "optional",
        trySayingLabel: "Sag zum Beispiel",
        categoriesLabel: "Werkzeugkategorien",
    },
    tools: {
        log_meal: {
            description:
                "Erfasse, was du gegessen hast, mit Kalorien und Makros – plus gesättigten Fettsäuren und Transfetten, Ballaststoffen, Gesamt- und zugesetztem Zucker, Alkohol und Koffein, sofern die Werte vorliegen. Beschreib es ganz normal: Die KI schätzt die Werte, fragt bei unklarer Portionsgröße nach und kann vorher Nährwertangaben über einen Barcode oder aus dem Web holen. Du kannst auch die Zutaten einzeln angeben – dann ergibt die Summe der Zutaten die Gesamtwerte.",
            params: {
                description: "Was gegessen wurde",
                meal_type: "Frühstück, Mittagessen, Abendessen oder Snack",
                calories: "Kalorien insgesamt",
                protein_g: "Protein in Gramm",
                carbs_g: "Kohlenhydrate in Gramm",
                fat_g: "Fett in Gramm",
                saturated_fat_g:
                    "Optional. Gesättigte Fettsäuren in Gramm, Teil von fat_g und nie mehr als dieser Wert. Ein leeres Feld wird als nicht gemessen gespeichert und lässt den Tag aus deinem Durchschnitt und Limit für gesättigte Fettsäuren heraus; 0 ist der richtige Wert für ein Lebensmittel ohne sie.",
                trans_fat_g:
                    "Optional. <b>Transfett</b> in Gramm, eine eigene Fettart, die nicht gegen fat_g geprüft wird. Es hat kein Limit und wird nur dort angezeigt, wo es erfasst wurde; 0 ist der richtige Wert für ein Lebensmittel ohne Transfett.",
                fiber_g:
                    "Ballaststoffe in Gramm. Die KI soll das bei jeder Mahlzeit ausfüllen und den Wert aus den Zutaten schätzen, wenn kein Etikett ihn nennt, denn ein leeres Feld ist keine Null – es nimmt den ganzen Tag aus deinem Ballaststoffdurchschnitt heraus",
                sugar_g:
                    "<b>Gesamt</b>zucker in Gramm – der Wert, der auf dem Etikett unter „davon Zucker“ steht, inklusive des natürlichen Zuckers in Obst und Milch, nicht nur zugesetzter Zucker. Wird bei jeder Mahlzeit nach denselben Regeln ausgefüllt wie Ballaststoffe",
                added_sugar_g:
                    "<b>Zugesetzter</b> Zucker in Gramm – Zucker, der bei Verarbeitung oder Zubereitung hinzugefügt wird (Haushaltszucker, Sirup, Honig, der Zucker in gesüßten Getränken und Lebensmitteln). Teil des Gesamtzuckers, nie mehr als dieser. Der natürliche Zucker in ganzem Obst, Gemüse und naturbelassener Milch zählt nicht als zugesetzt, ebenso wenig 100 % Fruchtsaft. Wird bei jeder Mahlzeit nach denselben Regeln ausgefüllt wie Ballaststoffe: Unverarbeitete Lebensmittel haben 0, der Zucker eines Softdrinks ist komplett zugesetzt, und die US-Etikettenzeile „Includes Xg Added Sugars“ wird genutzt, wenn es sie gibt. Gehört zu <code>sugar_g</code>: Eine Mahlzeit mit Gesamtzucker, aber ohne zugesetzten Zucker wird unter Umständen nicht gespeichert",
                alcohol_g:
                    "Gramm <b>reinen Alkohols</b>, nicht die Menge des Getränks und nicht sein Alkoholgehalt in Prozent – die KI errechnet den Wert aus Menge und Stärke (ein 330-ml-Bier mit 5 % sind 13 g)",
                caffeine_mg:
                    "Koffein in <b>Milligramm</b>, nicht Gramm – das einzige Feld hier, das nicht in Gramm angegeben wird, weil jedes Etikett und jede Empfehlung Koffein so angibt (ein Filterkaffee hat etwa 95 mg, ein Espresso 63 mg, eine Dose Cola 34 mg). Koffein liefert keine Kalorien. Anders als Ballaststoffe und Zucker wird es nur bei Dingen gesendet, die tatsächlich Koffein enthalten – eine erfasste 0 würde in deinem Dashboard eine Koffein-Zeile für einen Nährstoff anzeigen, den du gar nicht zu dir nimmst",
                logged_at:
                    "Wann du es gegessen hast, falls nicht gerade eben – so lässt sich etwas nachträglich erfassen",
                notes: "Zusätzliche Notizen",
                items: "Zutaten, eine Zeile pro Zutat, mit Menge und Nährwerten: <code>calories</code>, <code>protein_g</code>, <code>carbs_g</code> und <code>fat_g</code> bei jeder Zutat; <code>fiber_g</code>, <code>sugar_g</code> und <code>added_sugar_g</code> bei allen Zutaten oder bei keiner; <code>alcohol_g</code> und <code>caffeine_mg</code> nur bei den Zutaten, die sie enthalten, über diese Zutaten summiert. Die Gesamtwerte der Mahlzeit ergeben sich dann aus der Summe der Zutaten, also Zutaten oder Gesamtwerte senden, nicht beides",
            },
            example:
                "Trag eine Chicken-Burrito-Bowl mit extra Guacamole als Mittagessen ein",
            photoHint:
                "…oder mach einfach ein Foto von deinem Teller – die KI benennt jedes Gericht, schätzt die Portionen in Alltagsmaßen (ein Glas, eine Handvoll), schaut nach, wie du es früher erfasst hast, und holt sich deine Bestätigung, bevor sie es einträgt.",
        },
        lookup_barcode: {
            description:
                "Hol dir die Nährwertangaben eines verpackten Produkts per Barcode (8- bis 14-stelliger EAN/UPC-Code) von Open Food Facts, dazu Nutri-Score und NOVA-Gruppe (Verarbeitungsgrad), sofern Open Food Facts sie kennt. Zugesetzter Zucker wird angezeigt, wenn Open Food Facts ihn angibt, und gekennzeichnet, wenn Open Food Facts ihn aus den Zutaten geschätzt hat. Du kannst die Ziffern eintippen oder von einem Foto der Verpackung ablesen lassen; das Ergebnis lässt sich dann erfassen, umgerechnet auf die Menge, die du gegessen hast.",
            params: {},
            example: "Scann diesen Barcode: 3017620422003",
            photoHint:
                "…oder schick ein Foto der Verpackung – die KI liest die Barcode-Ziffern davon ab.",
        },
        search_foods: {
            description:
                "Durchsucht die generischen Lebensmittel von USDA FoodData Central (Foundation-, SR-Legacy- und Survey/FNDDS-Einträge) nach englischem Lebensmittelnamen und liefert bis zu 10 Treffer, jeweils mit FoodData-Central-ID, USDA-Beschreibung, Datentyp sowie Energie und Makros pro 100 g. Die Treffer verwenden die englische Formulierung der USDA (z. B. „cooked, boiled“).",
            params: {
                query: "Der Lebensmittelname auf Englisch, bis zu 200 Zeichen, z. B. banana oder lentils, cooked",
            },
            example: "Was listet die USDA für eine rohe Banane auf?",
        },
        get_food_macros: {
            description:
                "Liefert die USDA-Werte von FoodData Central für ein generisches Lebensmittel anhand seiner FoodData-Central-ID: pro 100 g und, wenn amount_g angegeben ist, umgerechnet auf diese Menge, dazu die Portionsgrößen, die die USDA auflistet. Ein Nährstoff, den die USDA für das Lebensmittel nicht erfasst, wird als nicht erfasst angegeben, nie als 0. Enthalten ist die food_ref, die die Mahlzeiten-Werkzeuge für diese Werte annehmen.",
            params: {
                fdc_id: "Die FoodData-Central-ID des Lebensmittels, wie von search_foods aufgelistet",
                amount_g:
                    "Optionale Menge in Gramm, mehr als 0 und bis zu 5.000, auf die die Werte umgerechnet werden",
            },
            example: "Welche USDA-Makros hat die Banane bei 150 g?",
        },
        start_meal_import: {
            description:
                "Öffne im Chat einen Importer, um deinen Verlauf aus einer anderen App zu übernehmen: Wähl die CSV, die du aus MyFitnessPal, Cronometer, Lose It!, MacroFactor oder einem anderen Tracker exportiert hast, ordne ihre Spalten Kalorien, Makros, Ballaststoffen, Gesamt- und zugesetztem Zucker und Koffein zu – plus Alkohol, falls du die Alkohol-Erfassung eingeschaltet hast – und prüf in der Vorschau, was dazukommt, bevor du bestätigst. Die Datei wird in deinem Browser gelesen, gespeichert wird erst, wenn du die Vorschau bestätigst, und ein erneuter Import derselben Datei erzeugt keine Duplikate.",
            params: {},
            example: "Importier meinen Mahlzeiten-Verlauf aus MyFitnessPal",
        },
        bulk_import_meals: {
            description:
                "Füge viele vergangene Mahlzeiten auf einmal hinzu – bis zu 50 pro Aufruf –, statt sie einzeln zu erfassen. Der Importer oben speichert über dieses Werkzeug, und die KI kann es auch direkt für Mahlzeitendaten nutzen, die du in den Chat eingefügt hast. Jede Zeile wird vorab geprüft, und was nicht passt, wird Zeile für Zeile gemeldet. Dieselben Zeilen erneut zu senden ist daher sicher und verdoppelt nichts, was schon erfasst ist – solange sich deine Zeitzone zwischendurch nicht geändert hat.",
            params: {
                meals: "Die zu importierenden Zeilen in der Reihenfolge der Quelldatei (1–50 pro Aufruf). Jede Zeile kann Uhrzeit, Mahlzeitentyp, Beschreibung, Notizen und dieselben Werte wie eine erfasste Mahlzeit enthalten: <code>calories</code>, <code>protein_g</code>, <code>carbs_g</code>, <code>fat_g</code>, <code>saturated_fat_g</code>, <code>trans_fat_g</code>, <code>fiber_g</code>, <code>sugar_g</code> (Gesamtzucker), <code>added_sugar_g</code> (zugesetzter Zucker, Teil des Gesamtzuckers), <code>alcohol_g</code> (Gramm reinen Alkohols) und <code>caffeine_mg</code> (Milligramm, nicht Gramm)",
                expected_row_count:
                    "Wie viele Zeilen dieser Aufruf enthält, gezählt in der Quelldatei, damit eine verlorene Zeile auffällt",
                expected_total_kcal:
                    "Kaloriensumme aus der Quelldatei, die mit dem abgeglichen wird, was ankommt",
                dry_run:
                    "Nur melden, was passieren würde, ohne etwas zu speichern",
                on_error:
                    "Gültige Zeilen importieren und den Rest melden – oder gar nichts speichern, sobald eine Zeile fehlschlägt",
                source_app: "Aus welcher App die Datei stammt",
            },
            example:
                "Hier sind meine Mahlzeiten von letzter Woche, kopiert aus meiner alten App – trag alle ein",
        },
        update_meal: {
            description:
                "Ändere eine bereits erfasste Mahlzeit – Beschreibung, beliebige Makros, Ballaststoffe, Gesamt- oder zugesetzter Zucker, Alkohol oder Koffein, Uhrzeit oder Notizen. Darüber werden auch Lücken nachgetragen: Wurde eine Mahlzeit ohne Ballaststoffe, Zucker oder zugesetzten Zucker erfasst, weist der Server darauf hin, und die KI trägt die Werte hier nach, sobald du zustimmst. Bei einer Mahlzeit, die mit Zutaten erfasst wurde, ändern sich die Gesamtwerte über ihre Zutatenliste.",
            params: {
                id: "UUID der zu ändernden Mahlzeit",
                description: "",
                calories: "",
                protein_g: "",
                carbs_g: "",
                fat_g: "",
                saturated_fat_g:
                    "Optional. Gesättigte Fettsäuren in Gramm, Teil von fat_g und nie mehr als dieser Wert. Ein leeres Feld wird als nicht gemessen gespeichert und lässt den Tag aus deinem Durchschnitt und Limit für gesättigte Fettsäuren heraus; 0 ist der richtige Wert für ein Lebensmittel ohne sie.",
                trans_fat_g:
                    "Optional. <b>Transfett</b> in Gramm, eine eigene Fettart, die nicht gegen fat_g geprüft wird. Es hat kein Limit und wird nur dort angezeigt, wo es erfasst wurde; 0 ist der richtige Wert für ein Lebensmittel ohne Transfett.",
                fiber_g: "",
                sugar_g: "Gesamtzucker, nicht zugesetzter Zucker",
                added_sugar_g:
                    "Nur zugesetzter Zucker, nie mehr als der Gesamtzucker. Gehört zu <code>sugar_g</code>: Eine Änderung des Gesamtzuckers bei einer Mahlzeit ohne erfassten zugesetzten Zucker wird ohne diesen Wert unter Umständen nicht gespeichert",
                alcohol_g:
                    "Gramm reinen Alkohols, nicht die Menge des Getränks",
                caffeine_mg: "Milligramm, nicht Gramm",
                logged_at: "",
                notes: "",
                items: "Die vollständige Zutatenliste, die die bisherige ersetzt. Die Gesamtwerte der Mahlzeit werden zur Summe dieser Liste, daher können die Gesamtwert-Felder nicht zusammen damit gesendet werden",
            },
            example:
                "Das Mittagessen hatte eigentlich 600 Kalorien, nicht 500 – korrigier das",
        },
        delete_meal: {
            description:
                "Entferne einen versehentlich erfassten Mahlzeiten-Eintrag.",
            params: {
                id: "UUID der zu löschenden Mahlzeit",
            },
            example:
                "Lösch den Snack, den ich heute Nachmittag eingetragen habe",
        },
        save_meal: {
            description:
                "Speichere eine Mahlzeit, die du oft isst, unter einem Namen – etwa dein übliches Frühstück – mit ihren Werten für eine Portion und, falls du sie hast, ihren Zutaten. Gib die Werte selbst an oder übernimm sie aus einer bereits erfassten Mahlzeit. Das Speichern trägt nichts in dein Tagebuch ein; erfasst wird die gespeicherte Mahlzeit mit log_saved_meal, wenn du sie isst.",
            params: {
                name: "Der Name, unter dem sie gespeichert wird; er ist unter deinen gespeicherten Mahlzeiten eindeutig (1–100 Zeichen)",
                from_meal_id:
                    "UUID einer erfassten Mahlzeit, aus der Werte und Zutaten übernommen werden",
                description:
                    "Was die gespeicherte Mahlzeit ist. Standard ist ihr Name",
                meal_type:
                    "Frühstück, Mittagessen, Abendessen oder Snack – der Standard beim Erfassen",
                items: "Zutaten, eine Zeile pro Zutat, mit Menge und Nährwerten. Ihre Summe wird zu den Werten der gespeicherten Mahlzeit, also Zutaten oder Werte senden, nicht beides",
                calories: "Kalorien insgesamt für eine Portion",
                protein_g: "Protein in Gramm für eine Portion",
                carbs_g: "Kohlenhydrate in Gramm für eine Portion",
                fat_g: "Fett in Gramm für eine Portion",
                saturated_fat_g:
                    "Optional. Gesättigte Fettsäuren in Gramm, Teil von fat_g und nie mehr als dieser Wert. Ein leeres Feld wird als nicht gemessen gespeichert und lässt den Tag aus deinem Durchschnitt und Limit für gesättigte Fettsäuren heraus; 0 ist der richtige Wert für ein Lebensmittel ohne sie.",
                trans_fat_g:
                    "Optional. <b>Transfett</b> in Gramm, eine eigene Fettart, die nicht gegen fat_g geprüft wird. Es hat kein Limit und wird nur dort angezeigt, wo es erfasst wurde; 0 ist der richtige Wert für ein Lebensmittel ohne Transfett.",
                fiber_g: "Ballaststoffe in Gramm für eine Portion",
                sugar_g: "Gesamtzucker in Gramm für eine Portion",
                added_sugar_g:
                    "Zugesetzter Zucker in Gramm für eine Portion, nie mehr als der Gesamtzucker. Gehört zu <code>sugar_g</code>",
                alcohol_g:
                    "Gramm reinen Alkohols für eine Portion, nicht die Menge des Getränks",
                caffeine_mg: "Milligramm Koffein für eine Portion, nicht Gramm",
            },
            example: "Speicher das als mein übliches Frühstück",
        },
        log_saved_meal: {
            description:
                "Erfasse eine gespeicherte Mahlzeit als Mahlzeiten-Eintrag – ab jetzt oder zu einer Uhrzeit, die du angibst. Der Eintrag bekommt eine Kopie der gespeicherten Werte und Zutaten, nach Portionen skaliert; einzelne Zutaten können für dieses eine Mal optional auf die tatsächlich gegessene Menge gesetzt oder weggelassen werden. Spätere Änderungen an der gespeicherten Mahlzeit lassen bereits daraus erfasste Mahlzeiten unverändert.",
            params: {
                saved_meal:
                    "Der Name der gespeicherten Mahlzeit oder ihre ID aus get_saved_meals oder search_meals",
                servings:
                    "Wie viele Portionen erfasst werden: mehr als 0 und bis zu 20 (Standard 1)",
                item_amounts:
                    "Die in diesem Eintrag tatsächlich gegessenen Mengen einzelner Zutaten, nach Name oder Position. Zuerst skaliert die Portionenzahl die gespeicherte Mahlzeit, dann legen diese Werte die Mengen der genannten Zutaten fest; ihre Nährwerte werden anteilig skaliert",
                leave_out:
                    "Zutaten, die aus diesem Eintrag herausgenommen werden, nach Name oder Position",
                meal_type:
                    "Frühstück, Mittagessen, Abendessen oder Snack – überschreibt den Standard der gespeicherten Mahlzeit",
                description:
                    "Beschreibung für diesen Eintrag. Standard ist die Beschreibung der gespeicherten Mahlzeit",
                logged_at: "Wann du es gegessen hast, falls nicht gerade eben",
                notes: "Zusätzliche Notizen",
                idempotency_key:
                    "Ein Schlüssel, der einen wiederholten Aufruf wirkungslos macht, damit derselbe Eintrag nicht doppelt erfasst wird",
            },
            example: "Erfass mein übliches Frühstück, eine halbe Portion",
        },
        update_saved_meal: {
            description:
                "Ändere den Namen, die Beschreibung, den Standard-Mahlzeitentyp, die Zutaten oder die Werte pro Portion einer gespeicherten Mahlzeit. Mahlzeiten, die bereits daraus erfasst wurden, behalten ihre Werte.",
            params: {
                id: "UUID der zu ändernden gespeicherten Mahlzeit",
                name: "Neuer Name, unter deinen gespeicherten Mahlzeiten eindeutig",
                description: "Neue Beschreibung",
                meal_type:
                    "Neuer Standard-Mahlzeitentyp: Frühstück, Mittagessen, Abendessen oder Snack",
                items: "Die vollständige Zutatenliste, die die bisherige ersetzt. Ihre Summe wird zu den Werten der gespeicherten Mahlzeit, daher können die Werte-Felder nicht zusammen damit gesendet werden",
                calories: "Kalorien insgesamt für eine Portion",
                protein_g: "Protein in Gramm für eine Portion",
                carbs_g: "Kohlenhydrate in Gramm für eine Portion",
                fat_g: "Fett in Gramm für eine Portion",
                saturated_fat_g:
                    "Optional. Gesättigte Fettsäuren in Gramm, Teil von fat_g und nie mehr als dieser Wert. Ein leeres Feld wird als nicht gemessen gespeichert und lässt den Tag aus deinem Durchschnitt und Limit für gesättigte Fettsäuren heraus; 0 ist der richtige Wert für ein Lebensmittel ohne sie.",
                trans_fat_g:
                    "Optional. <b>Transfett</b> in Gramm, eine eigene Fettart, die nicht gegen fat_g geprüft wird. Es hat kein Limit und wird nur dort angezeigt, wo es erfasst wurde; 0 ist der richtige Wert für ein Lebensmittel ohne Transfett.",
                fiber_g: "Ballaststoffe in Gramm für eine Portion",
                sugar_g: "Gesamtzucker in Gramm für eine Portion",
                added_sugar_g:
                    "Zugesetzter Zucker in Gramm für eine Portion, nie mehr als der Gesamtzucker. Gehört zu <code>sugar_g</code>",
                alcohol_g:
                    "Gramm reinen Alkohols für eine Portion, nicht die Menge des Getränks",
                caffeine_mg: "Milligramm Koffein für eine Portion, nicht Gramm",
            },
            example:
                "Mein übliches Frühstück hat jetzt 350 Kalorien pro Portion – aktualisier es",
        },
        delete_saved_meal: {
            description:
                "Lösche eine gespeicherte Mahlzeit. Mahlzeiten, die bereits daraus erfasst wurden, behalten ihre Werte.",
            params: {
                id: "UUID der zu löschenden gespeicherten Mahlzeit",
            },
            example: "Lösch die gespeicherte Mahlzeit namens altes Mittagessen",
        },
        search_meals: {
            description:
                "Durchsuche deine bisherigen Mahlzeiten nach Stichwort, gruppiert nach den Varianten, die bei dir immer wiederkehren – wie oft jede erfasst wurde, wann zuletzt und mit wie vielen Kalorien typischerweise. So gleicht die KI ein Foto deines Tellers damit ab, wie du diese Mahlzeit bisher tatsächlich erfasst hast, und so funktioniert „trag mein übliches Frühstück ein“. Gesucht wird auch in den Namen der Zutaten einer Mahlzeit, und gespeicherte Mahlzeiten, deren Name, Beschreibung oder Zutaten passen, werden mit aufgeführt.",
            params: {
                queries:
                    "Alternative Suchbegriffe für das Lebensmittel, in jeder Sprache, in der du schon erfasst hast",
                days: "Wie weit zurückgesucht wird (Standard: ein Jahr)",
                limit: "Maximale Anzahl ausgewerteter Einträge",
            },
            example: "Trag mein übliches Frühstück ein",
        },
        get_meals_today: {
            description:
                "Sieh dir alle Mahlzeiten an, die du heute erfasst hast.",
            params: {
                detail: "<code>compact</code> (Standard) für eine Zeile pro Mahlzeit samt ID oder <code>full</code> inklusive Notizen und genauer Uhrzeiten",
            },
            example: "Was habe ich heute gegessen?",
        },
        get_meals_by_date: {
            description:
                "Sieh dir alle Mahlzeiten an, die du an einem bestimmten Tag erfasst hast.",
            params: {
                date: "Datum im Format JJJJ-MM-TT",
                detail: "<code>compact</code> (Standard) für eine Zeile pro Mahlzeit samt ID oder <code>full</code> inklusive Notizen und genauer Uhrzeiten",
            },
            example: "Zeig mir alles, was ich am 4. Juli gegessen habe",
        },
        get_meals_by_date_range: {
            description:
                "Ruf alle Mahlzeiten zwischen zwei Daten auf einmal ab – praktisch, um auf eine Woche oder einen Monat zurückzublicken. Ein Aufruf deckt bis zu 31 Tage ab; für längere Zeiträume liefern Trends und Übersichten Tagessummen.",
            params: {
                start_date: "Startdatum (JJJJ-MM-TT)",
                end_date:
                    "Enddatum (JJJJ-MM-TT), höchstens 31 Tage inklusive Starttag",
                detail: "<code>compact</code> (Standard) für eine Zeile pro Mahlzeit samt ID oder <code>full</code> inklusive Notizen und genauer Uhrzeiten",
            },
            example: "Liste meine Mahlzeiten von Montag bis Freitag auf",
        },
        get_saved_meals: {
            description:
                "Sieh dir deine gespeicherten Mahlzeiten mit ihren Werten pro Portion und ihren Zutaten an, optional nur die, deren Name einen bestimmten Text enthält.",
            params: {
                name_contains:
                    "Nur gespeicherte Mahlzeiten, deren Name diesen Text enthält",
            },
            example: "Welche Mahlzeiten habe ich gespeichert?",
        },
        export_all_data: {
            description:
                "Exportiere alles, was der Dienst über dich speichert, als eine einzige ZIP-Datei – meals.csv, meal_items.csv (die Zutaten jeder erfassten Mahlzeit), saved_meals.csv und saved_meal_items.csv (deine gespeicherten Mahlzeiten und ihre Zutaten), water.csv, weight.csv, body_measurements.csv, goals.csv, goals_history.csv (jede Änderung deiner Ziele, mit Datum), profile.csv, account.csv (dein Anmeldekonto), telemetry.csv (Aufzeichnungen zur Werkzeugnutzung), connections.csv (deine verbundenen KI-Apps und Apple Health Sync, ohne Tokens), health_sync.csv (was Apple Health Sync in den letzten 8 Tagen gesendet hat) und eine README.txt, die Spalten und Einheiten erklärt und aufzählt, was nicht enthalten ist – und erhalte einen privaten Download-Link, der 60 Minuten gültig ist. Vorerst lassen sich nur die Mahlzeiten wieder importieren.",
            params: {},
            example:
                "Exportier alle meine Daten – Mahlzeiten, Wasser, Gewicht und Ziele",
        },
        log_water: {
            description:
                "Erfasse einen Wasser-Eintrag. Die Menge kannst du in jeder Einheit angeben – Tassen, Unzen, Liter –, sie wird für dich in Milliliter umgerechnet.",
            params: {
                amount_ml: "Menge in Millilitern (ganze Zahl, &gt; 0).",
            },
            example: "Ich hab gerade eine 500-ml-Flasche Wasser getrunken",
        },
        get_water_today: {
            description:
                "Sieh dir deine heutige Wassermenge insgesamt und jeden einzelnen Eintrag an.",
            params: {},
            example: "Wie viel Wasser hatte ich heute?",
        },
        get_water_by_date: {
            description:
                "Sieh dir deine Wassermenge und die Einträge für einen bestimmten Tag an.",
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
                "Erfasse dein Körpergewicht in kg oder lb. Mehrere Messungen pro Tag sind kein Problem, und der Server speichert den Wert einheitlich, sodass deine Einheiten-Einstellung die Zahl nie verfälscht.",
            params: {
                weight: "Körpergewicht in <code>unit</code> (&gt; 0).",
            },
            example: "Trag mein Gewicht ein – heute Morgen 74,2 kg",
        },
        update_weight: {
            description:
                "Korrigiere eine bestehende Messung – den Wert, den Zeitstempel oder die Notizen.",
            params: {
                id: "UUID des zu ändernden Gewichtseintrags",
                weight: "Neuer Gewichtswert in <code>unit</code>.",
                logged_at: "ISO-8601-Zeitstempel",
                notes: "",
            },
            example: "Korrigier die Messung von heute Morgen auf 73,8 kg",
        },
        delete_weight: {
            description: "Entferne einen Gewichtseintrag.",
            params: {
                id: "UUID des zu löschenden Gewichtseintrags",
            },
            example: "Lösch den heutigen Gewichtseintrag",
        },
        get_weight_today: {
            description:
                "Sieh dir die heutigen Messungen an, angezeigt in deiner bevorzugten Einheit.",
            params: {},
            example: "Was habe ich heute gewogen?",
        },
        get_weight_by_date: {
            description:
                "Sieh dir deine Messungen für einen bestimmten Tag an.",
            params: {
                date: "Datum im Format JJJJ-MM-TT",
            },
            example: "Wie viel habe ich am 1. gewogen?",
        },
        get_weight_by_date_range: {
            description:
                "Ruf alle Messungen zwischen zwei Daten ab, gruppiert nach Tag mit dem jeweiligen Tagesdurchschnitt.",
            params: {
                start_date: "Startdatum (JJJJ-MM-TT)",
                end_date: "Enddatum (JJJJ-MM-TT)",
            },
            example: "Zeig mir meine Messungen der letzten zwei Wochen",
        },
        get_weight_trends: {
            description:
                "Sieh dir deinen Gewichtstrend über einen Zeitraum an: ein geglättetes Trendgewicht, das tägliche Schwankungen ausgleicht, deine wöchentliche Veränderungsrate, letzte Messung, Gesamtveränderung, Min./Max. und Fortschritt zu deinem Zielgewicht. Das Diagramm zeigt außerdem 90 Tage, ein Jahr oder deinen gesamten Verlauf.",
            params: {
                days: "Zeitraum in Tagen (Standard 30, maximal 365).",
            },
            example: "Wie entwickelt sich mein Gewicht diesen Monat?",
        },
        set_weight_unit: {
            description:
                "Wähl, ob Gewichte in kg oder lb angezeigt und eingegeben werden. Gespeicherte Werte bleiben unverändert – es ändert sich nur die Anzeige und wie Eingaben ohne Einheit gelesen werden.",
            params: {},
            example: "Zeig mein Gewicht ab jetzt in lb an",
        },
        log_body_measurement: {
            description:
                "Erfasse ein Maßband-Maß an einer Körperstelle – Taille, Hüfte, Hals, Brust, Schultern, Oberarm, Unterarm, Oberschenkel oder Wade – in cm oder Zoll. Der Wert wird genau so gespeichert, wie du ihn eingibst, zusammen mit einem einheitlichen Wert, sodass ein Wechsel der Einheit nie eine Zahl verschiebt. Zahlen weit außerhalb eines realistischen Bereichs für die Körperstelle werden als wahrscheinliche Tippfehler abgelehnt.",
            params: {
                kind: "Welche Körperstelle: <code>waist</code>, <code>hips</code>, <code>neck</code>, <code>chest</code>, <code>shoulders</code>, <code>upper_arm</code>, <code>forearm</code>, <code>thigh</code> oder <code>calf</code>. Ein Wert pro Körperstelle; die Seite (links/rechts) kann in die Notizen.",
                value: "Das Maß in <code>unit</code> (&gt; 0).",
                unit: "<code>cm</code> oder <code>in</code>; Standard ist deine gespeicherte Längeneinheit.",
                logged_at: "Wann gemessen wurde, falls nicht jetzt",
                notes: "Zusätzliche Notizen",
            },
            example: "Trag meinen Taillenumfang ein – heute Morgen 82 cm",
        },
        get_body_measurements: {
            description:
                "Liste deine Körpermaße nach Tagen auf, älteste zuerst, auf Wunsch nur für eine Körperstelle. Ohne Datumsangaben umfasst das die letzten 30 Tage, pro Aufruf bis zu 366 Tage.",
            params: {
                kind: "Nur diese Körperstelle (z. B. <code>waist</code>)",
                start_date: "Startdatum (JJJJ-MM-TT)",
                end_date:
                    "Enddatum (JJJJ-MM-TT), bis zu 366 Tage einschließlich des Starttags",
            },
            example: "Zeig mir meinen Taillenumfang der letzten drei Monate",
        },
        update_body_measurement: {
            description:
                "Korrigiere ein bestehendes Maß – den Wert, seine Einheit, den Zeitpunkt oder die Notizen. Die Körperstelle selbst bleibt fest; eine andere Körperstelle ist ein neuer Eintrag.",
            params: {
                id: "UUID des zu ändernden Maßes",
                value: "Neuer Wert in <code>unit</code>.",
                unit: "Standard ist die Einheit, in der der Eintrag erfasst wurde.",
                logged_at: "ISO-8601-Zeitstempel",
                notes: "Neue Notizen, die die bisherigen ersetzen",
            },
            example: "Der Hüftumfang war 98 cm, nicht 89",
        },
        delete_body_measurement: {
            description: "Entferne einen Körpermaß-Eintrag.",
            params: {
                id: "UUID des zu löschenden Maßes",
            },
            example: "Lösch das heutige Halsmaß",
        },
        set_length_unit: {
            description:
                "Wähl, ob Körpermaße in Zentimetern oder Zoll angezeigt und eingegeben werden. Unabhängig von deiner Gewichtseinheit. Gespeicherte Werte bleiben unverändert – es ändert sich nur die Anzeige und wie Eingaben ohne Einheit gelesen werden.",
            params: {},
            example: "Nimm für meine Körpermaße ab jetzt Zoll",
        },
        set_nutrition_goals: {
            description:
                "Leg deine täglichen Ziele für Kalorien, Makros, gesättigte Fettsäuren, Ballaststoffe, Zucker, zugesetzten Zucker, Alkohol, Koffein und Wasser fest, dazu optional ein Zielgewicht. Kalorien, Protein, Kohlenhydrate, Fett, Ballaststoffe und Wasser sind Ziele, die du erreichen willst; gesättigte Fettsäuren, Gesamtzucker, zugesetzter Zucker, Alkohol und Koffein sind Limits, unter denen du bleiben willst – entsprechend wird auch der Fortschritt formuliert. Geändert werden nur die Felder, die du nennst; alles andere bleibt, wie es ist.",
            params: {
                daily_calories:
                    "Tägliches Kalorienziel (kcal). Zum Löschen „null“ angeben.",
                daily_protein_g:
                    "Tägliches Proteinziel (Gramm). Zum Löschen „null“ angeben.",
                daily_carbs_g:
                    "Tägliches Kohlenhydratziel (Gramm). Zum Löschen „null“ angeben.",
                daily_fat_g:
                    "Tägliches Fettziel (Gramm). Zum Löschen „null“ angeben.",
                daily_saturated_fat_g:
                    "Tägliche Obergrenze für gesättigte Fettsäuren (Gramm). Null zum Entfernen.",
                daily_fiber_g:
                    "Tägliches Ballaststoffziel (Gramm), ein Minimum, das du erreichen willst. Zum Löschen „null“ angeben.",
                daily_sugar_g:
                    "Tägliches Limit für <b>Gesamt</b>zucker (Gramm), ein Maximum, unter dem du bleiben willst. Gesamtzucker umfasst auch den natürlichen Zucker in Obst und Milch, daher liegen offizielle Empfehlungen für zugesetzten Zucker deutlich niedriger. Zum Löschen „null“ angeben.",
                daily_added_sugar_g:
                    "Tägliches Limit für <b>zugesetzten</b> Zucker (Gramm), ein Maximum, unter dem du bleiben willst. Zählt nur zugesetzten Zucker, nicht den natürlichen Zucker in Obst und Milch; offizielle Richtwerte für Zucker beziehen sich meist auf diesen Wert (die American Heart Association empfiehlt höchstens 25 g am Tag für Frauen und 36 g für Männer). 0 ist ein echtes Limit und heißt: gar keiner. Zum Löschen „null“ angeben.",
                daily_alcohol_g:
                    "Tägliches Alkohol-Limit in Gramm <b>reinen Alkohols</b>, ein Maximum, unter dem du bleiben willst. Ein US-Standard-Drink entspricht 14 g, eine UK-Einheit 7,9 g. Zum Löschen „null“ angeben.",
                daily_caffeine_mg:
                    "Tägliches Koffein-Limit in <b>Milligramm</b>, ein Maximum, unter dem du bleiben willst. EFSA und FDA setzen die Obergrenze für gesunde Erwachsene bei 400 mg pro Tag an (etwa vier Tassen Filterkaffee); in der Schwangerschaft nennt die EFSA 200 mg. 0 ist ein echtes Limit und bedeutet: gar kein Koffein. Zum Löschen „null“ angeben.",
                daily_water_ml: "",
                target_weight: "",
            },
            example:
                "Setz meine Ziele auf 2.200 Kalorien, 160 g Protein und ein Zielgewicht von 75 kg",
        },
        get_nutrition_goals: {
            description:
                "Sieh dir deine aktuellen Tagesziele für Kalorien und Makros an, ein eventuelles Ballaststoffziel, Zucker- oder Koffein-Limit und – falls du Alkohol erfasst – dein Alkohol-Limit.",
            params: {},
            example: "Was sind meine Tagesziele?",
        },
        get_goal_progress: {
            description:
                "Sieh, wo du heute im Vergleich zu deinen Zielen stehst – Ringe für Ist- gegen Zielwert plus dein Fortschritt beim Körpergewicht. Tipp auf einen Makro-Ring, um zu sehen, welche Mahlzeiten dazu beigetragen haben.",
            params: {},
            example: "Wie sieht's heute mit meinen Zielen aus?",
        },
        get_nutrition_summary: {
            description:
                "Ruf die täglichen Nährwertsummen für einen Zeitraum als interaktives Dashboard ab: Makro-Kacheln im Vergleich zu deinen Zielen und eine Aufschlüsselung nach Tagen. Ein Aufruf deckt bis zu 92 Tage ab; für längere Zeiträume liefern Trends gleitende Durchschnitte.",
            params: {
                start_date: "Startdatum (JJJJ-MM-TT)",
                end_date:
                    "Enddatum (JJJJ-MM-TT), höchstens 92 Tage inklusive Starttag",
            },
            example: "Gib mir eine Übersicht über die letzte Woche",
        },
        get_trends: {
            description:
                "Gleitende 7/14/30-Tage-Durchschnitte, Schwankungen, Erfassungsserien, Kaloriendurchschnitte nach Wochentag sowie deine besten und schlechtesten Tage nach Kalorien – vorberechnet, damit die KI sie nur noch wiedergeben muss. Mit group_by gibt es zusätzlich Durchschnitte pro Woche, Monat, Quartal oder Jahr – pro erfasstem Tag, Tage ohne Mahlzeiten zählen also nicht mit – verglichen mit den Zielen, die damals galten, samt der Anzahl der Tage im Zielbereich und der möglicherweise unvollständigen Tage.",
            params: {
                days: "Zeitraum in Tagen (Standard 30, maximal 365).",
                group_by:
                    "<code>week</code>, <code>month</code>, <code>quarter</code> oder <code>year</code>: 26 Wochen, 24 Monate, 12 Quartale oder 5 Jahre bis einschließlich des Zeitraums, der das Enddatum enthält (standardmäßig heute). Die Spanne ist fest; <code>days</code> bestimmt weiterhin die gleitenden Durchschnitte.",
            },
            example: "Wie liefen meine Monate im Vergleich zu meinen Zielen?",
        },
        get_meal_patterns: {
            description:
                "Erkenne Muster in deinem Essverhalten: wie oft du welchen Mahlzeitentyp isst, den Frühstückseffekt, kalorienreiche Mittagessen, späte Abendessen, Werktage vs. Wochenende und Ausreißertage.",
            params: {
                days: "Zeitraum in Tagen (Standard 30, mindestens 7, maximal 365).",
            },
            example:
                "Gibt es Muster in meinem Essverhalten – etwa späte Abendessen oder ausgelassenes Frühstück?",
        },
        get_profile: {
            description:
                "Sieh deine aktuellen Einstellungen auf einen Blick: Zeitzone (plus lokales Datum und Uhrzeit), Widget-Sprache, bevorzugte Gewichts- und Längeneinheit, ob In-Chat-Widgets angezeigt werden und ob die Alkohol-Erfassung eingeschaltet ist.",
            params: {},
            example: "Welche Einstellungen habe ich gerade?",
        },
        set_timezone: {
            description:
                "Leg deine IANA-Zeitzone fest, damit der Tag um Mitternacht deiner Ortszeit wechselt – eine um 23 Uhr erfasste Mahlzeit zählt zu diesem Tag, nicht zum nächsten UTC-Tag.",
            params: {},
            example: "Ich bin in Berlin – stell meine Zeitzone ein",
        },
        set_language: {
            description:
                "Leg die Sprache der In-Chat-Widgets fest – also der Dashboards und Diagramme, nicht der Antworten der KI.",
            params: {
                locale: "ISO-639-1-Code, z. B. <code>de</code>, <code>ja</code>. Unterstützt: Englisch, Deutsch, Spanisch, Französisch, Niederländisch, Polnisch, Italienisch, Ukrainisch, Japanisch, Türkisch.",
            },
            example: "Zeig meine Widgets auf Deutsch an",
        },
        get_current_time: {
            description:
                "Frag das aktuelle Datum und die Uhrzeit in deiner Zeitzone ab, dazu den Zeitpunkt in UTC. Manche Apps verraten dem Assistenten nicht, wie spät es ist – so findet er ohne Rückfrage heraus, was „heute Morgen“ oder „heute“ bedeutet (Standard ist UTC, wenn keine Zeitzone eingestellt ist).",
            params: {},
            example: "Wie spät ist es gerade bei mir?",
        },
        set_widget_display: {
            description:
                "Schalte die visuellen In-Chat-Widgets ein oder aus – Dashboards, Ziel-Ringe und Trend-Diagramme. Sind sie aus, antworten dieselben Werkzeuge nur mit Text und Daten. Standardmäßig eingeschaltet; die Änderung gilt für neue Unterhaltungen.",
            params: {
                enabled:
                    "true zeigt Widgets an, false liefert reine Textantworten",
            },
            example: "Schalt die Widgets aus",
        },
        set_alcohol_tracking: {
            description:
                "Schalte die Alkohol-Erfassung ein oder aus und wähl, ob Getränke in US-Standard-Drinks oder UK-Einheiten gezählt werden. Standardmäßig ist sie aus, du musst sie also ausdrücklich anfordern. Schaltest du sie wieder aus, wird Alkohol in Mahlzeiten, Zielen und Fortschritt ausgeblendet, und der Datei-Importer liest die Alkohol-Spalte einer Datei nicht mehr ein – bereits Erfasstes wird nicht gelöscht, dein CSV-Export enthält es weiterhin, und es taucht wieder auf, sobald du sie erneut einschaltest. Die Änderung gilt ab deiner nächsten Nachricht, ohne Neustart.",
            params: {
                enabled:
                    "true zeigt Alkohol in Mahlzeiten, Zielen und Fortschritt an, false blendet ihn aus",
                drink_unit:
                    "Welcher Standard-Drink neben den Gramm angezeigt wird: <code>us</code> (14 g pro Drink) oder <code>uk</code> (7,9 g pro Einheit). Standard ist <code>us</code>; gespeichert wird immer die Menge in Gramm reinen Alkohols.",
            },
            example: "Erfass ab jetzt auch meinen Alkohol, in UK-Einheiten",
        },
        delete_account: {
            description:
                "Lösch dein Nutrition-MCP-Konto und alle Daten, die es über dich speichert, endgültig. Das lässt sich nicht rückgängig machen, deshalb tut das Werkzeug ohne ausdrückliche Bestätigung nichts, und die KI wird gebeten, sich diese Bestätigung vorher bei dir zu holen.",
            params: {},
            example: "Lösch mein Konto und alle meine Daten",
        },
    },
    troubleshooting: {
        pillLabel: "Hilfe",
        title: "Fehlerbehebung",
        description:
            "Etwas funktioniert nicht? Für die meisten Probleme gibt es eine schnelle Lösung.",
        stillStuck: "Kommst du nicht weiter?",
        items: {
            "cannot-connect": {
                question:
                    "Der Connector verbindet sich nicht oder will ständig, dass ich mich anmelde",
                answerHtml:
                    "Entferne den Connector und füge ihn mit genau dieser Adresse wieder hinzu: <code>https://nutrition-mcp.com/mcp</code> – das <code>/mcp</code> am Ende ist Pflicht. In Claude öffnest du <strong>Customize</strong> → <strong>Connectors</strong>, trennst Nutrition und verbindest es neu; in ChatGPT gehst du über <strong>Settings</strong> → <strong>Apps</strong>. Melde dich mit derselben E-Mail-Adresse und demselben Passwort oder demselben Google-Konto an wie zuvor: Deine Daten gehören zu deinem Konto, nicht zur Verbindung, beim erneuten Verbinden geht also nichts verloren. Ist die Verbindung einmal eingerichtet, bleibt sie bestehen, solange du sie mindestens alle 90 Tage nutzt; funktioniert sie nicht mehr, verbinde sie einfach auf dieselbe Weise neu.",
            },
            "session-expired": {
                question: 'Die Anmeldeseite zeigt {"error":"session_expired"}',
                answerHtml:
                    "Die Anmeldeseite ist nur 10 Minuten gültig und verfällt außerdem, wenn der Server für ein Update neu startet. Geh zurück zur Anmeldeseite und lade sie neu oder starte die Verbindung in deiner KI-App erneut, und melde dich dann zügig an. Steht dort stattdessen <code>session_mismatch</code>, wurde die Anmeldung in einem anderen Browser abgeschlossen als in dem, in dem sie geöffnet wurde: Starte erneut in deiner KI-App und schließ die Anmeldung im selben Browser ab.",
            },
            "cannot-sign-in": {
                question:
                    "Ich kann mich nicht anmelden oder habe mein Passwort vergessen",
                answerHtml:
                    'Nutz <strong>Anmelden</strong> für ein Konto, das du schon hast: Eine falsche E-Mail-Adresse oder ein falsches Passwort zeigt dort „Falsche E-Mail-Adresse oder falsches Passwort“ und legt nie ein neues Konto an. <strong>Konto erstellen</strong> ist nur für deinen ersten Besuch. Prüf die E-Mail-Adresse auf Tippfehler. Hast du dein Konto mit <strong>Weiter mit Google</strong> erstellt, nutz wieder diesen Button. Selbst zurücksetzen kannst du dein Passwort noch nicht: Schreib von der E-Mail-Adresse deines Kontos an <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>, dann setze ich es für dich zurück.',
            },
            "history-missing": {
                question:
                    "Ich habe mich neu verbunden und mein Verlauf ist weg",
                answerHtml:
                    'Jede E-Mail-Adresse ist ein eigenes Konto. Meldest du dich mit einer anderen an, beginnst du mit einem leeren Konto – gelöscht wurde nichts. Trenn die Verbindung und melde dich mit der Adresse an, die du ursprünglich verwendet hast. Weißt du nicht mehr genau, welche das war, schreib an <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
            },
            "tools-not-used": {
                question: "Die KI antwortet, trägt aber nichts ein",
                answerHtml:
                    "Prüf, ob der Connector für diese Unterhaltung eingeschaltet ist – in Claude siehst du das im Werkzeug-Menü des Eingabefelds – und frag direkt, zum Beispiel „trag mein Frühstück in Nutrition ein“. Fragt deine App um Erlaubnis, ein Werkzeug zu verwenden, stimm zu.",
            },
            "wrong-day": {
                question: "Meine Mahlzeiten landen am falschen Tag",
                answerHtml:
                    'Tage werden in deiner Zeitzone gezählt, und hast du nie eine festgelegt, gilt UTC. Frag „welche Zeitzone habe ich eingestellt?“ (<a href="#get_profile"><code>get_profile</code></a>) und, falls sie falsch ist, „stell meine Zeitzone auf Europe/Berlin“ (<a href="#set_timezone"><code>set_timezone</code></a>). Danach wird alles, was du erfasst hast, nach deinem lokalen Tag gruppiert, auch ältere Einträge. Die einzige Ausnahme ist ein Eintrag, dem du eine bestimmte Uhrzeit gegeben hast, während die Zeitzone falsch war: Er behält den Zeitpunkt, mit dem er gespeichert wurde, und kann deshalb weiterhin um eine Stunde oder einen Tag danebenliegen – bitte die KI, ihn auf das richtige Datum und die richtige Uhrzeit zu verschieben (<a href="#update_meal"><code>update_meal</code></a>). Leg deine Zeitzone auch fest, bevor du deinen Verlauf importierst: Importierte Mahlzeiten behalten den Zeitpunkt, mit dem sie gespeichert wurden, und importierst du die Datei einer anderen App nach einer Änderung der Zeitzone noch einmal, werden sie ein zweites Mal hinzugefügt. Ein Nutrition-MCP-Export wird erkannt und nicht verdoppelt.',
            },
            "no-widgets": {
                question: "Ich sehe nur Text, keine Diagramme oder Karten",
                answerHtml:
                    'Die visuellen Karten brauchen eine App, die interaktive MCP-Apps-Panels unterstützt, etwa Claude oder ChatGPT; andere Clients erhalten dieselben Informationen als Text. Hast du die Widgets ausgeschaltet, bitte die KI, sie wieder einzuschalten (<a href="#set_widget_display"><code>set_widget_display</code></a>), und starte eine neue Unterhaltung – ein offener Chat behält die alte Einstellung, bis er sich neu verbindet. Die kleine Karte nach dem Erfassen einer Mahlzeit erscheint erst, wenn du Tagesziele festgelegt hast (<a href="#set_nutrition_goals"><code>set_nutrition_goals</code></a>).',
            },
            "import-problems": {
                question:
                    "Der Importer öffnet sich nicht oder meldet, dass er nicht speichern kann",
                answerHtml:
                    'Das Importer-Panel braucht eine App, die interaktive Panels anzeigt, und eingeschaltete Widgets. Steht dort <em>Dieser Host erlaubt dieser Ansicht nicht, in dein Ernährungstagebuch zu schreiben</em> oder erscheint es gar nicht, bitte die KI, die Datei selbst zu importieren: Häng die CSV an oder füge sie ein, dann nutzt die KI <a href="#bulk_import_meals"><code>bulk_import_meals</code></a>. Dabei wird jede Zeile geprüft, und Duplikate werden übersprungen – erneutes Senden ist also sicher, solange sich deine Zeitzone zwischendurch nicht geändert hat. Leg deine Zeitzone vor dem ersten Import fest: Importierst du die Datei einer anderen App nach einer Änderung erneut, werden die Zeilen noch einmal hinzugefügt. Nutzt du das Importer-Panel und willst eine Alkohol-Spalte übernehmen, schalte vorher die Alkohol-Erfassung ein – das Panel überspringt diese Spalte, solange die Erfassung aus ist, und ein späterer erneuter Import trägt sie nicht nach.',
            },
            "rate-limited": {
                question:
                    "Ich sehe „Rate limit exceeded“ oder „Too many failed authentication attempts“",
                answerHtml:
                    "Jedes Konto kann 60 Anfragen pro Minute stellen, und jeder Werkzeugaufruf zählt als mindestens eine. Warte so viele Sekunden, wie die Meldung angibt, und mach dann weiter. Willst du viele Mahlzeiten nachtragen, nutz den Importer, statt sie einzeln zu erfassen. Die Anmeldeseiten erlauben 30 Anfragen pro Minute und Netzwerk. Nach 20 abgelehnten Verbindungsversuchen in Folge aus einem Netzwerk – meist ein alter, getrennter Connector, der es immer wieder versucht – werden Verbindungen aus diesem Netzwerk für 5 Minuten pausiert; wiederholte Pausen werden länger und dauern höchstens eine Stunde. Entfernst du den alten Connector und fügst ihn neu hinzu, hören die Versuche auf.",
            },
            "barcode-not-found": {
                question:
                    "Ein Barcode wird nicht gefunden, oder die Werte wirken falsch",
                answerHtml:
                    "Barcode-Daten stammen von Open Food Facts, einer von der Community gepflegten Datenbank – deshalb fehlen manche Produkte, und manche Einträge sind veraltet. Prüf, ob alle 8–14 Ziffern unter dem Barcode richtig gelesen wurden. Ist das Produkt nicht dabei, kann die KI anhand des Namens oder eines Fotos der Nährwerttabelle schätzen, und du kannst jeden Wert danach korrigieren. Wer das Produkt auf openfoodfacts.org einträgt, hilft allen. Open Food Facts hat keine Koffeindaten, deshalb stammt Koffein vom Etikett oder aus typischen Mengen.",
            },
            "usda-unavailable": {
                question: "Die KI meldet „USDA data is unavailable until …“",
                answerHtml:
                    "Generische Lebensmittel werden über USDA FoodData Central abgefragt, mit einem API-Schlüssel, den alle Nutzer dieses Servers teilen. USDA begrenzt, wie viele Anfragen dieser Schlüssel pro Stunde stellen darf. Der Server ruft USDA in drei Fällen nicht auf: nachdem USDA gemeldet hat, dass das Limit erreicht ist – dann pausiert er die Aufrufe 60 Minuten lang; solange das verbleibende Stundenkontingent des Schlüssels fast aufgebraucht ist; und sobald du in der letzten Stunde 30 USDA-Abfragen gemacht hast. Die Meldung nennt die Uhrzeit, zu der USDA wieder verfügbar ist, in der Zeitzone deines Profils (UTC, wenn keine gesetzt ist). Suchergebnisse werden nicht gespeichert, Suchen warten also bis dahin. Ein Lebensmittel, das in den letzten 30 Tagen abgefragt wurde, liegt auf dem Server und funktioniert auch während einer Pause; das Abrufen eines gespeicherten Lebensmittels zählt nicht auf deine 30 pro Stunde. USDA-Namen gibt es nur auf Englisch, suche also auf Englisch. Verpackte Produkte sind davon nicht betroffen: Schlag sie stattdessen über den Barcode nach.",
            },
            "health-sync-yesterday": {
                question: "Gestern ist noch nicht in Apple Health",
                answerHtml:
                    'Die Synchronisierung mit Apple Health sendet nur abgeschlossene Tage. Ein Tag gilt um 05:00 am nächsten Morgen in deiner Zeitzone als abgeschlossen: Gestern kommt also mit der ersten Synchronisierung nach 05:00 heute an, und heute erscheint erst morgen in Health. Eine Synchronisierung läuft, wenn eine Automation des Kurzbefehls auslöst (die Health-App öffnen, deinen Wecker beenden) oder wenn du <strong>Nutrition MCP Health</strong> in der Kurzbefehle-App ausführst und <strong>Sync now</strong> wählst. Ein verpasster Morgen wird von selbst nachgeholt: Jede Synchronisierung schaut über die letzten 7 Tage zurück. Tage richten sich nach der Zeitzone in deinem Profil (<a href="#get_profile"><code>get_profile</code></a>) oder, falls du nie eine festgelegt hast, nach der, die dein iPhone beim Verbinden gemeldet hat (<a href="#wrong-day">Mahlzeiten am falschen Tag</a>). Tage vor dem Verbinden werden nur gesendet, wenn du beim Verbinden gewählt hast, bis zu 7 frühere Tage nachzuholen.',
            },
            "health-sync-higher": {
                question: "Apple Health zeigt mehr als mein Chat",
                answerHtml:
                    "Apple Health kann einen Wert ergänzen, aber nie einen bereits vorhandenen verringern. Eine Mahlzeit, die du zu einem bereits gesendeten Tag hinzufügst, folgt als kleiner zusätzlicher Eintrag um 12:01, 12:02 und so weiter, solange der Tag innerhalb der letzten 7 Tage liegt. Löschst oder verkleinerst du eine Mahlzeit, nachdem ihr Tag gesendet wurde, bleibt Health höher, und der Kurzbefehl zeigt einen Hinweis, um wie viel. So behebst du es: Öffne die Health-App, geh zu <strong>Entdecken</strong> → <strong>Ernährung</strong>, öffne den betroffenen Wert, tippe auf <strong>Alle Daten anzeigen</strong>, lösch die Einträge dieses Tages von Kurzbefehle und trag die richtige Summe von Hand ein. Verwende nie <strong>Alle Daten von „Kurzbefehle“ löschen</strong>: Das entfernt auch, was deine anderen Kurzbefehle erfasst haben. Wirkt jeder Tag verdoppelt, schreibt eine andere App dieselben Werte, und Health addiert beide: Schalte eine davon in der Health-App unter <strong>Teilen</strong> → <strong>Apps</strong> aus.",
            },
            "health-sync-stopped": {
                question: "Die Synchronisierung mit Apple Health hat aufgehört",
                answerHtml:
                    "Öffne die Kurzbefehle-App und führe <strong>Nutrition MCP Health</strong> von Hand aus: Er sagt dir, was schiefgelaufen ist. Bittet er dich, neu zu verbinden, ist die Verbindung beendet (nach 90 Tagen ohne Synchronisierung, 365 Tage nach dem Verbinden oder nach <strong>Disconnect</strong>): Führ ihn aus, melde dich auf der Seite, die er öffnet, mit demselben Konto an wie in deiner KI-App und schließ das innerhalb von 30 Minuten ab. Synchronisiert er, wenn du ihn ausführst, aber nicht von selbst, prüf, ob seine Automationen im Tab <strong>Automation</strong> der Kurzbefehle-App eingeschaltet und auf <strong>Sofort ausführen</strong> gestellt sind. Meldet ein Hinweis, dass ein Tag Apple Health nicht erreicht hat, erlaube Kurzbefehle in der Health-App unter <strong>Teilen</strong> → <strong>Apps</strong> → <strong>Kurzbefehle</strong>, jeden Ernährungswert zu schreiben, und führ ihn erneut aus. Verbindest du ein neues iPhone, ersetzt das die Verbindung des alten.",
            },
            "export-link": {
                question: "Der Download-Link meines Exports funktioniert nicht",
                answerHtml:
                    'Export-Links laufen nach 60 Minuten ab, und jeder neue Export ersetzt die vorherige Datei. Fordere einen neuen Export an (<a href="#export_all_data"><code>export_all_data</code></a>) und lade ihn gleich herunter. Meldet der Export 0 Mahlzeiten, obwohl du deinen Verlauf erwartet hast, bist du wahrscheinlich mit einer anderen E-Mail-Adresse angemeldet – siehe <a href="#history-missing">Verlauf ist weg</a>.',
            },
            "delete-account": {
                question: "Wie lösche ich mein Konto?",
                answerHtml:
                    'Bitte die KI, dein Nutrition-MCP-Konto zu löschen (<a href="#delete_account"><code>delete_account</code></a>). Sie bittet dich um Bestätigung und löscht dann endgültig deine Mahlzeiten, deine gespeicherten Mahlzeiten, Wasser-, Gewichts- und Körpermaß-Einträge, Ziele, Einstellungen, die Aufzeichnung darüber, welche Werkzeuge deine KI-App verwendet hat, eine eventuelle Exportdatei, deine Anmeldedaten und das Konto selbst. Das lässt sich nicht rückgängig machen – exportiere deine Daten also vorher, wenn du eine Kopie behalten willst. Entferne danach den Connector aus deiner App. Meldest du dich später mit derselben E-Mail-Adresse wieder an, wird ein neues, leeres Konto angelegt.',
            },
            "report-a-problem": {
                question:
                    "Wie melde ich einen Fehler oder ein Sicherheitsproblem?",
                answerHtml:
                    'Melde Fehler über <a href="https://github.com/akutishevsky/nutrition-mcp/issues" target="_blank" rel="noopener noreferrer">GitHub Issues</a>: Schreib dazu, welche App du nutzt (Claude, ChatGPT, …), was du gefragt hast, was passiert ist und ungefähr wann. Gib nie dein Passwort an. Sicherheitsprobleme bitte nicht öffentlich melden, sondern vertraulich über die <a href="https://github.com/akutishevsky/nutrition-mcp/security/advisories/new" target="_blank" rel="noopener noreferrer">private Schwachstellenmeldung auf GitHub</a> oder per E-Mail, wie in der <a href="https://github.com/akutishevsky/nutrition-mcp/security/policy" target="_blank" rel="noopener noreferrer">Sicherheitsrichtlinie</a> beschrieben. Für alles andere schreib an <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
            },
        },
    },
};
