import { test, expect } from "bun:test";
import type { MealInput } from "./supabase.js";
import { runImport, resolveLoggedAt } from "./import.js";
import {
    parseCsv,
    decodeBytes,
    stripBom,
    sniffDelimiter,
    sniffDecimalSeparator,
    normalizeHeader,
    parseNumber,
    splitAmount,
    findColumn,
    isBlankCell,
    isTotalsRow,
    isDeletedRow,
    sniffDateFormat,
    toIsoDate,
    normalizeTime,
    sniffEnergyUnit,
    toKcal,
} from "./csv.js";

// ---------- RFC 4180 core ----------

test("parses quoted fields containing delimiters, quotes and newlines", () => {
    // The case that forbids splitting on newlines first: a note column with an
    // embedded newline, which MyFitnessPal and Cronometer both emit.
    const csv = [
        "Date,Food,Note",
        '2026-01-15,"Rice, cooked","line one',
        'line two"',
        '2026-01-16,"He said ""hi""",plain',
    ].join("\n");

    const t = parseCsv(csv);
    expect(t.headers).toEqual(["Date", "Food", "Note"]);
    expect(t.rows).toHaveLength(2);
    expect(t.rows[0]).toEqual([
        "2026-01-15",
        "Rice, cooked",
        "line one\nline two",
    ]);
    expect(t.rows[1]).toEqual(["2026-01-16", 'He said "hi"', "plain"]);
});

test("source line numbers survive a quoted newline", () => {
    // The row after a multi-line field must report its real file line, or
    // source_line provenance silently drifts for the rest of the file.
    const csv = [
        "Date,Note", // line 1
        '2026-01-15,"a', // line 2
        'b"', // line 3
        "2026-01-16,plain", // line 4
    ].join("\n");

    const t = parseCsv(csv);
    expect(t.sourceLines).toEqual([2, 4]);
});

test("handles CRLF without leaving carriage returns in the last cell", () => {
    // Untreated, "120\r" makes Number() return NaN and "snack\r" fails to match
    // any meal type — a silently-wrong import rather than a loud failure.
    const t = parseCsv("Date,Meal,Calories\r\n2026-01-15,snack,120\r\n");
    expect(t.rows[0]).toEqual(["2026-01-15", "snack", "120"]);
    expect(parseNumber(t.rows[0]![2])).toBe(120);
});

test("handles a final row with no trailing newline", () => {
    const t = parseCsv("A,B\n1,2");
    expect(t.rows).toEqual([["1", "2"]]);
});

test("skips blank rows and trailing blank lines", () => {
    const t = parseCsv("A,B\n1,2\n\n3,4\n\n\n");
    expect(t.rows).toEqual([
        ["1", "2"],
        ["3", "4"],
    ]);
    expect(t.skippedBlankRows).toBe(3);
});

test("pads ragged rows and warns", () => {
    const t = parseCsv("A,B,C\n1,2\n1,2,3,4");
    expect(t.rows[0]).toEqual(["1", "2", ""]);
    expect(t.rows[1]).toEqual(["1", "2", "3"]);
    expect(t.warnings.some((w) => /different number of columns/.test(w))).toBe(
        true,
    );
});

test("an empty or header-only file yields no rows", () => {
    expect(parseCsv("").rows).toEqual([]);
    expect(parseCsv("").warnings.some((w) => /no data/.test(w))).toBe(true);
    expect(parseCsv("A,B\n").rows).toEqual([]);
});

// ---------- encoding ----------

test("decodeBytes honours the BOM, including UTF-16", () => {
    const utf8 = new TextEncoder().encode("Fat");
    expect(decodeBytes(utf8)).toEqual({ text: "Fat", encoding: "utf-8" });

    const withBom = new Uint8Array([0xef, 0xbb, 0xbf, ...utf8]);
    const decodedBom = decodeBytes(withBom);
    expect(decodedBom.text).toBe("Fat");
    expect(decodedBom.encoding).toBe("utf-8-bom");

    // "Hi" little-endian, then big-endian. Decoded as UTF-8 these would be
    // NUL-interleaved gibberish that still "parses".
    const le = new Uint8Array([0xff, 0xfe, 0x48, 0x00, 0x69, 0x00]);
    expect(decodeBytes(le)).toEqual({ text: "Hi", encoding: "utf-16le" });
    const be = new Uint8Array([0xfe, 0xff, 0x00, 0x48, 0x00, 0x69]);
    expect(decodeBytes(be)).toEqual({ text: "Hi", encoding: "utf-16be" });
});

test("a UTF-8 BOM does not become part of the first header name", () => {
    // MyFitnessPal exports carry one; unstripped, the first column is named
    // "﻿Date" and never matches a "date" alias.
    const bytes = new Uint8Array([
        0xef,
        0xbb,
        0xbf,
        ...new TextEncoder().encode("Date,Meal\n2026-01-15,snack\n"),
    ]);
    const t = parseCsv(bytes);
    expect(t.headers[0]).toBe("Date");
    expect(findColumn(t.headers, ["date"])).toBe(0);
});

test("stripBom only removes a leading BOM", () => {
    expect(stripBom("﻿A")).toBe("A");
    expect(stripBom("A﻿B")).toBe("A﻿B");
});

// ---------- delimiter and decimal sniffing ----------

test("sniffs a semicolon delimiter even when text fields contain commas", () => {
    // European Excel locale. Counting commas naively would pick "," and produce
    // one giant mis-split column.
    const csv = [
        "Datum;Mahlzeit;Kalorien",
        "2026-01-15;Reis, gekocht;120",
        "2026-01-16;Brot, dunkel;240",
    ].join("\n");
    expect(sniffDelimiter(csv)).toBe(";");

    const t = parseCsv(csv);
    expect(t.delimiter).toBe(";");
    expect(t.rows[0]).toEqual(["2026-01-15", "Reis, gekocht", "120"]);
});

test("sniffs tab-delimited files", () => {
    const t = parseCsv("A\tB\n1\t2");
    expect(t.delimiter).toBe("\t");
    expect(t.rows[0]).toEqual(["1", "2"]);
});

test("detects a comma decimal separator and parses it correctly", () => {
    // The 1000x error: 62,5 g of fat read as 625 g still validates.
    const csv = [
        "Datum;Fett;Protein",
        "2026-01-15;62,5;120,25",
        "2026-01-16;58,0;110,5",
    ].join("\n");
    const t = parseCsv(csv);
    expect(t.decimalSeparator).toBe(",");
    expect(parseNumber(t.rows[0]![1], t.decimalSeparator)).toBe(62.5);
    expect(parseNumber(t.rows[0]![2], t.decimalSeparator)).toBe(120.25);

    // A comma-delimited file never uses a comma decimal.
    expect(sniffDecimalSeparator([["1,5"]], ",")).toBe(".");
});

// ---------- numbers and cells ----------

test("parseNumber distinguishes absent from zero", () => {
    // MyFitnessPal writes 0.0 for untracked nutrients, but an EMPTY cell must
    // stay absent rather than being recorded as a real zero.
    expect(parseNumber("")).toBeNull();
    expect(parseNumber(undefined)).toBeNull();
    expect(parseNumber("n/a")).toBeNull(); // Lose It!
    expect(parseNumber("N/A")).toBeNull();
    expect(parseNumber("-")).toBeNull();
    expect(parseNumber("0")).toBe(0);
    expect(parseNumber("0.0")).toBe(0);
});

test("parseNumber strips units and thousands separators", () => {
    expect(parseNumber("120 kcal")).toBe(120);
    expect(parseNumber("1,234")).toBe(1234);
    expect(parseNumber("1,234.5")).toBe(1234.5);
    expect(parseNumber("2.5g")).toBe(2.5);
    expect(parseNumber("-3.5")).toBe(-3.5);
    expect(parseNumber("1.234,5", ",")).toBe(1234.5);
    expect(parseNumber("abc")).toBeNull();
});

test("isBlankCell recognises the tokens real exports use", () => {
    for (const v of ["", "  ", "n/a", "N/A", "na", "-", "--", "null", "none"]) {
        expect(isBlankCell(v)).toBe(true);
    }
    expect(isBlankCell("0")).toBe(false);
    expect(isBlankCell("Oatmeal")).toBe(false);
});

test("splitAmount unpacks Cronometer's value-plus-unit cell", () => {
    expect(splitAmount("58.00 g")).toEqual({ value: 58, unit: "g" });
    expect(splitAmount("1.00 cup")).toEqual({ value: 1, unit: "cup" });
    expect(splitAmount('2 medium (7" long)')).toEqual({
        value: 2,
        unit: 'medium (7" long)',
    });
    expect(splitAmount("120")).toEqual({ value: 120, unit: null });
    expect(splitAmount("")).toEqual({ value: null, unit: null });
    expect(splitAmount("58,00 g", ",")).toEqual({ value: 58, unit: "g" });
});

// ---------- headers ----------

test("normalizeHeader folds unit suffixes and the micro sign", () => {
    expect(normalizeHeader("Fat (g)")).toBe("fat_g");
    expect(normalizeHeader("fat_g")).toBe("fat_g");
    expect(normalizeHeader("  FAT  ")).toBe("fat");
    expect(normalizeHeader("Energy (kcal)")).toBe("energy_kcal");
    // Greek mu and the micro sign both fold to u, so ug and µg match.
    expect(normalizeHeader("B12 (µg)")).toBe(normalizeHeader("B12 (ug)"));
    expect(normalizeHeader("B12 (μg)")).toBe(normalizeHeader("B12 (ug)"));
});

test("normalizeHeader folds accents so an accented header matches its alias", () => {
    // The bug this guards: the a-z sweep deleted diacritics outright, so the
    // German protein header reduced to "eiwei" and could never match the
    // "eiweiss" alias the widget ships — the column just came through unmapped.
    expect(normalizeHeader("Eiweiß")).toBe("eiweiss");
    expect(normalizeHeader("Eiweiß")).toBe(normalizeHeader("Eiweiss"));
    // Accents elsewhere reduced to stubs the same way ("Größe" -> "gr_e").
    expect(normalizeHeader("Größe")).toBe("grosse");
    expect(normalizeHeader("Protéines")).toBe("proteines");
    expect(normalizeHeader("Calorías")).toBe("calorias");
    // Folding must not disturb headers that were already plain ASCII.
    expect(normalizeHeader("Fat (g)")).toBe("fat_g");
    expect(normalizeHeader("Kohlenhydrate")).toBe("kohlenhydrate");
    // An accented header now resolves through findColumn, which is the point.
    expect(
        findColumn(["Datum", "Eiweiß", "Fett"], ["protein", "eiweiss"]),
    ).toBe(1);
});

test("duplicate header names are kept positional and warned about", () => {
    // Cronometer repeats "Amount". Keying data by name would silently drop one.
    const t = parseCsv("Food,Amount,Amount\nRice,58.00 g,1 cup");
    expect(t.headers).toEqual(["Food", "Amount", "Amount"]);
    expect(t.rows[0]).toEqual(["Rice", "58.00 g", "1 cup"]);
    expect(t.warnings.some((w) => /Duplicate column/.test(w))).toBe(true);
    // findColumn returns the FIRST match; callers wanting the second use index.
    expect(findColumn(t.headers, ["amount"])).toBe(1);
});

test("findColumn matches across alias spellings and reports absence", () => {
    const headers = ["Date", "Meal", "Carbohydrates (g)", "Protein (g)"];
    expect(findColumn(headers, ["carbs_g", "carbohydrates_g"])).toBe(2);
    expect(findColumn(headers, ["protein", "protein_g"])).toBe(3);
    expect(findColumn(headers, ["fat_g"])).toBe(-1);
});

// ---------- aggregate and deleted rows ----------

test("totals rows are excluded rather than imported as a phantom meal", () => {
    // A MyFitnessPal daily export ends with one; imported, it doubles the day.
    const csv = [
        "Date,Meal,Calories",
        "2026-01-15,Breakfast,300",
        "2026-01-15,Lunch,700",
        "Totals,,1000",
    ].join("\n");
    const t = parseCsv(csv);
    expect(t.rows).toHaveLength(2);
    expect(t.skippedTotalsRows).toBe(1);
    expect(t.warnings.some((w) => /totals\/average row/.test(w))).toBe(true);

    // Recoverable when a caller genuinely wants them.
    expect(parseCsv(csv, { keepTotalsRows: true }).rows).toHaveLength(3);
});

test("isTotalsRow does not fire on a food that merely starts with the word", () => {
    expect(isTotalsRow(["Total", "", "1000"])).toBe(true);
    expect(isTotalsRow(["Totals:", "", "1000"])).toBe(true);
    expect(isTotalsRow(["Average", "", "900"])).toBe(true);
    expect(isTotalsRow(["Total Cereal, 1 cup", "", "120"])).toBe(false);
    expect(isTotalsRow(["", "", ""])).toBe(false);
});

test("isDeletedRow reads a Lose It! style Deleted column", () => {
    // Importing deleted rows resurrects food the user removed on purpose, and no
    // control total would catch it.
    const t = parseCsv(
        "Date,Name,Deleted,Calories\n2026-01-15,Apple,false,95\n2026-01-15,Cake,true,400",
    );
    const del = findColumn(t.headers, ["deleted"]);
    expect(del).toBe(2);
    expect(isDeletedRow(t.rows[0]!, del)).toBe(false);
    expect(isDeletedRow(t.rows[1]!, del)).toBe(true);
    // No such column: nothing is deleted.
    expect(isDeletedRow(t.rows[0]!, -1)).toBe(false);
});

// ---------- realistic export shapes ----------

test("parses a MyFitnessPal-shaped export (meal-level rows, BOM, CRLF)", () => {
    const body =
        "Date,Meal,Calories,Fat (g),Saturated Fat,Carbohydrates (g),Protein (g),Note\r\n" +
        "2026-01-15,Breakfast,300,8,2,45,12,\r\n" +
        "2026-01-15,Lunch,700,20,6,80,35,busy day\r\n" +
        "Totals,,1000,28,8,125,47,\r\n";
    const bytes = new Uint8Array([
        0xef,
        0xbb,
        0xbf,
        ...new TextEncoder().encode(body),
    ]);

    const t = parseCsv(bytes);
    expect(t.encoding).toBe("utf-8-bom");
    expect(t.delimiter).toBe(",");
    expect(t.rows).toHaveLength(2);
    expect(t.skippedTotalsRows).toBe(1);
    // No Food column at all — the aggregation-level problem, visible here.
    expect(findColumn(t.headers, ["food", "food_name"])).toBe(-1);
    expect(findColumn(t.headers, ["meal"])).toBe(1);
    expect(parseNumber(t.rows[1]![2])).toBe(700);
});

test("parses a Cronometer-shaped export (Day/Time, packed Amount, dup columns)", () => {
    const csv = [
        "Day,Time,Group,Food Name,Amount,Energy (kcal),Carbs (g),Fat (g),B12 (µg),Category",
        '2026-01-15,9:15 AM,Breakfast,"Oats, rolled",58.00 g,220,37.5,4.1,0.00,Cereal Grains',
        '2026-01-15,1:00 PM,Lunch,"Chicken breast, roasted",120.00 g,198,0,4.3,0.30,Poultry',
    ].join("\n");

    const t = parseCsv(csv);
    expect(t.rows).toHaveLength(2);
    expect(findColumn(t.headers, ["day", "date"])).toBe(0);
    expect(findColumn(t.headers, ["food_name"])).toBe(3);
    expect(splitAmount(t.rows[0]![4])).toEqual({ value: 58, unit: "g" });
    expect(t.rows[0]![3]).toBe("Oats, rolled");
    // The micro sign in the header still matches a plain-ASCII alias.
    expect(findColumn(t.headers, ["b12_ug"])).toBe(8);
});

test("parses a Lose It!-shaped export (MM/DD/YYYY, n/a, Deleted)", () => {
    const csv = [
        "Date,Name,Icon,Type,Quantity,Units,Calories,Deleted,Fat (g),Protein (g)",
        "01/15/2026,Apple,fruit,Snacks,1,Fruit,95,false,0.3,0.5",
        "01/15/2026,Cake,dessert,Snacks,1,Slice,400,true,18,4",
        "01/16/2026,Oatmeal,grain,Breakfast,1,Cup,150,false,n/a,5",
    ].join("\n");

    const t = parseCsv(csv);
    expect(t.rows).toHaveLength(3);
    const del = findColumn(t.headers, ["deleted"]);
    const kept = t.rows.filter((r) => !isDeletedRow(r, del));
    expect(kept).toHaveLength(2);
    // "n/a" is absent, not zero.
    const fat = findColumn(t.headers, ["fat_g"]);
    expect(parseNumber(kept[1]![fat])).toBeNull();
    // The date format is ambiguous here; that is resolveLoggedAt's problem, but
    // the parser must hand it over untouched rather than guessing.
    expect(kept[0]![0]).toBe("01/15/2026");
});

test("parses a MacroFactor-shaped export whose header contains a comma", () => {
    // "B12, Cobalamin (mcg)" is a single quoted header; a naive split makes
    // every subsequent column off by one.
    const csv = [
        'Date,Time,Food Name,Serving Size,Calories (kcal),"B12, Cobalamin (mcg)",Protein (g)',
        "2026-01-15,08:30,Yogurt,1 cup,150,1.2,12",
    ].join("\n");

    const t = parseCsv(csv);
    expect(t.headers).toHaveLength(7);
    expect(t.headers[5]).toBe("B12, Cobalamin (mcg)");
    expect(findColumn(t.headers, ["protein_g"])).toBe(6);
    expect(t.rows[0]).toEqual([
        "2026-01-15",
        "08:30",
        "Yogurt",
        "1 cup",
        "150",
        "1.2",
        "12",
    ]);
});

test("a parsed export feeds straight into runImport", async () => {
    // The integration that matters: everything the widget will do client-side
    // (parse, map columns, build rows) followed by the server-side import. Proves
    // the two modules actually compose, including the local-wall-clock handoff.
    const csv = [
        "id,logged_at,timezone,meal_type,description,calories,protein_g,carbs_g,fat_g,notes",
        "abc-1,2026-01-15 08:30:00,Europe/Kyiv,breakfast,Oatmeal,300,12,45,8,",
        'abc-2,2026-01-15 13:00:00,Europe/Kyiv,lunch,"Rice, cooked",400,10,80,2,tasty',
        "abc-3,2026-01-16 19:00:00,Europe/Kyiv,dinner,Soup,250,8,30,6,",
    ].join("\n");

    const t = parseCsv(csv);
    const col = {
        logged_at: findColumn(t.headers, ["logged_at"]),
        meal_type: findColumn(t.headers, ["meal_type"]),
        description: findColumn(t.headers, ["description"]),
        calories: findColumn(t.headers, ["calories"]),
        protein_g: findColumn(t.headers, ["protein_g"]),
        carbs_g: findColumn(t.headers, ["carbs_g"]),
        fat_g: findColumn(t.headers, ["fat_g"]),
        notes: findColumn(t.headers, ["notes"]),
    };

    const num = (row: string[], i: number) => {
        const v = parseNumber(row[i], t.decimalSeparator);
        return v === null ? undefined : v;
    };
    const str = (row: string[], i: number) =>
        isBlankCell(row[i]) ? undefined : row[i]!.trim();

    const meals = t.rows.map((row, i) => ({
        source_line: t.sourceLines[i]!,
        logged_at: str(row, col.logged_at),
        meal_type: str(row, col.meal_type),
        description: str(row, col.description),
        calories: num(row, col.calories),
        protein_g: num(row, col.protein_g),
        carbs_g: num(row, col.carbs_g),
        fat_g: num(row, col.fat_g),
        notes: str(row, col.notes),
    }));

    // Control totals computed from the PARSED source, which is what the tool
    // description demands (and what the widget will do).
    const expectedKcal = meals.reduce((a, m) => a + (m.calories ?? 0), 0);

    const inserted: MealInput[] = [];
    const result = await runImport(
        {
            meals,
            expected_row_count: meals.length,
            expected_total_kcal: expectedKcal,
        },
        {
            userId: "user-1",
            tz: "Europe/Kyiv",
            tzConfigured: true,
            nowMs: Date.parse("2026-07-25T12:00:00Z"),
            async insert(input) {
                inserted.push(input);
                return {
                    meal: { id: `m${inserted.length}`, ...input } as never,
                    deduplicated: false,
                };
            },
            async existingKeys() {
                return new Set<string>();
            },
        },
    );

    expect(result.status).toBe("success");
    expect(result.summary.created).toBe(3);
    expect(result.summary.failed).toBe(0);
    // Local wall clock resolved in the profile timezone: Kyiv is +02:00 in
    // January, so 08:30 local is 06:30Z — no client-side offset math anywhere.
    expect(inserted[0]!.logged_at).toBe("2026-01-15T06:30:00.000Z");
    expect(inserted[2]!.logged_at).toBe("2026-01-16T17:00:00.000Z");
    expect(inserted[1]!.description).toBe("Rice, cooked");
    expect(inserted[1]!.notes).toBe("tasty");
    // Provenance: real times, so nothing was inferred or synthesized.
    expect(result.results.every((r) => !r.logged_at_from_bare_date)).toBe(true);
    expect(result.results.every((r) => !r.meal_type_inferred)).toBe(true);
    expect(t.sourceLines).toEqual([2, 3, 4]);
});

test("parses the server's own export format round-trip", () => {
    // src/export.ts writes: id, logged_at (local wall clock), timezone, ...
    const csv = [
        "id,logged_at,timezone,meal_type,description,calories,protein_g,carbs_g,fat_g,notes",
        "abc-1,2026-01-15 08:30:00,Europe/Kyiv,breakfast,Oatmeal,300,12,45,8,",
        'abc-2,2026-01-15 13:00:00,Europe/Kyiv,lunch,"Rice, cooked",400,10,80,2,tasty',
    ].join("\n");

    const t = parseCsv(csv);
    expect(t.rows).toHaveLength(2);
    expect(findColumn(t.headers, ["logged_at"])).toBe(1);
    expect(findColumn(t.headers, ["description"])).toBe(4);
    expect(t.rows[1]![4]).toBe("Rice, cooked");
    // The wall-clock form is exactly what resolveLoggedAt's local-time branch
    // accepts, so an export re-imports without offset math.
    expect(t.rows[0]![1]).toBe("2026-01-15 08:30:00");
});

// ---------- date format sniffing ----------

test("sniffDateFormat detects day-first from a value whose day exceeds 12", () => {
    // The export that motivated this: DD/MM/YYYY, which the server rejects on
    // every row. One value above 12 in the first position is the whole proof.
    for (const sample of [
        ["05/06/2026", "18/07/2026", "01/01/2026"],
        ["05.06.2026", "18.07.2026"], // German Excel locale
        ["05-06-2026", "18-07-2026"], // dashes, but day-first not ISO
    ]) {
        expect(sniffDateFormat(sample)).toEqual({
            format: "dmy",
            ambiguous: false,
        });
    }
});

test("sniffDateFormat detects month-first and plain ISO", () => {
    // Lose It! writes MM/DD/YYYY: the 15 in second position is the discriminator.
    expect(sniffDateFormat(["01/15/2026", "01/16/2026"])).toEqual({
        format: "mdy",
        ambiguous: false,
    });
    // A 4-digit leading year is unambiguous, so no question to ask.
    expect(sniffDateFormat(["2026-01-15", "2026-07-18"])).toEqual({
        format: "iso",
        ambiguous: false,
    });
    // Some exports write ISO with slashes.
    expect(sniffDateFormat(["2026/01/15"])).toEqual({
        format: "iso",
        ambiguous: false,
    });
});

test("sniffDateFormat flags samples it cannot decide so the UI must ask", () => {
    // The case that must never be answered silently: every value reads fine both
    // ways, so a guess files three weeks of meals on the wrong days unflagged.
    expect(sniffDateFormat(["05/06/2026", "01/02/2026", "12/11/2026"])).toEqual(
        {
            format: "dmy",
            ambiguous: true,
        },
    );
    // Nothing usable at all.
    expect(sniffDateFormat([])).toEqual({ format: "iso", ambiguous: true });
    expect(sniffDateFormat(["n/a", "-", "Breakfast"])).toEqual({
        format: "iso",
        ambiguous: true,
    });
    // Both discriminators fire: the column is not one single format.
    expect(sniffDateFormat(["18/07/2026", "01/15/2026"])).toEqual({
        format: "dmy",
        ambiguous: true,
    });
    // Mixed ISO and slash forms (hand-edited file, or a format change mid-file).
    expect(sniffDateFormat(["2026-01-15", "2026-01-16", "18/07/2026"])).toEqual(
        { format: "iso", ambiguous: true },
    );
});

test("sniffDateFormat ignores blank and unparseable cells rather than skewing", () => {
    // A "n/a" date or a stray note cell must not outvote the one row that
    // actually disambiguates the column.
    expect(
        sniffDateFormat([
            "",
            "  ",
            "n/a",
            "null",
            "yesterday",
            "13/13/2026", // impossible in either reading
            "26/07/18", // 2-digit year: could be any of three orders
            "18/07/2026",
        ]),
    ).toEqual({ format: "dmy", ambiguous: false });
});

// ---------- date conversion ----------

test("toIsoDate converts both component orders and zero-pads", () => {
    // The server's BARE_DATE_RE demands exactly 4-2-2 digits, so "2026-7-8"
    // would be rejected even though it is the right day.
    expect(toIsoDate("18/07/2026", "dmy")).toBe("2026-07-18");
    expect(toIsoDate("5/6/2026", "dmy")).toBe("2026-06-05");
    expect(toIsoDate("01/15/2026", "mdy")).toBe("2026-01-15");
    expect(toIsoDate("7.8.2026", "mdy")).toBe("2026-07-08");
    expect(toIsoDate("2026-07-18", "iso")).toBe("2026-07-18");
    // A year-first cell stays ISO even under a day-first column format: nothing
    // is written year-first, so one ISO row in a DD/MM file still imports.
    expect(toIsoDate("2026-07-18", "dmy")).toBe("2026-07-18");
    // ...but the reverse is not guessed: told ISO, handed a slash date.
    expect(toIsoDate("18/07/2026", "iso")).toBeNull();
    // A trailing time is dropped rather than failing the row.
    expect(toIsoDate("18/07/2026 08:30", "dmy")).toBe("2026-07-18");
    expect(toIsoDate("15/01/2026 1:00 PM", "dmy")).toBe("2026-01-15");
    // Blank-ish and junk cells.
    for (const v of ["", "  ", "n/a", "-", undefined, "Breakfast", "07/2026"]) {
        expect(toIsoDate(v, "dmy")).toBeNull();
    }
});

test("toIsoDate rejects dates that do not exist instead of rolling over", () => {
    // Date.UTC turns 2026-02-31 into 2026-03-03 silently, which would convert a
    // day/month swap into a plausible wrong date rather than an error. The same
    // bug class isRealCalendarDate guards server-side.
    expect(toIsoDate("31/02/2026", "dmy")).toBeNull();
    expect(toIsoDate("29/02/2026", "dmy")).toBeNull(); // 2026 is not a leap year
    expect(toIsoDate("29/02/2024", "dmy")).toBe("2024-02-29"); // but 2024 is
    expect(toIsoDate("31/13/2026", "dmy")).toBeNull(); // month 13
    expect(toIsoDate("00/07/2026", "dmy")).toBeNull(); // day 0
    expect(toIsoDate("2026-02-30", "iso")).toBeNull();
    // Reading a real MM/DD date as day-first produces an impossible date, which
    // is exactly the loud failure we want when the format was chosen wrongly.
    expect(toIsoDate("01/15/2026", "dmy")).toBeNull();
});

test("toIsoDate expands a 2-digit year once the format states the order", () => {
    // Sniffing cannot resolve "26/07/18" — it could be day-, month- or
    // year-first. But once the user has CHOSEN day-first, the order is no longer
    // in question and only the century is, which is solvable. Rejecting outright
    // would hard-fail every row of such an export with no recourse in the UI.
    expect(toIsoDate("18/07/26", "dmy")).toBe("2026-07-18");
    expect(toIsoDate("07/18/26", "mdy")).toBe("2026-07-18");
    expect(toIsoDate("1.2.26", "dmy")).toBe("2026-02-01");
    expect(toIsoDate("1-2-26", "mdy")).toBe("2026-01-02");

    // POSIX pivot, asserted at the boundary so a change is deliberate.
    expect(toIsoDate("01/01/68", "dmy")).toBe("2068-01-01");
    expect(toIsoDate("01/01/69", "dmy")).toBe("1969-01-01");

    // Still no mandate to invent an order when told the file is ISO.
    expect(toIsoDate("18/07/26", "iso")).toBeNull();
    // And a date that does not exist is still refused, expanded year or not.
    expect(toIsoDate("31/02/26", "dmy")).toBeNull();
    expect(toIsoDate("29/02/27", "dmy")).toBeNull();
});

test("sniffDateFormat reads day-vs-month from 2-digit years but flags the guess", () => {
    // 18 cannot be a month, so day-first is certain; the year's POSITION was
    // assumed to get there, so the UI must still confirm.
    expect(sniffDateFormat(["18/07/26", "19/07/26"])).toEqual({
        format: "dmy",
        ambiguous: true,
    });
    expect(sniffDateFormat(["07/18/26", "01/15/26"])).toEqual({
        format: "mdy",
        ambiguous: true,
    });
    // One full-year cell settles it, so the column stops being a guess.
    expect(sniffDateFormat(["18/07/26", "19/07/2026"])).toEqual({
        format: "dmy",
        ambiguous: false,
    });
});

test("toIsoDate output is accepted by the server's resolveLoggedAt", () => {
    // The contract that matters: normalising client-side is pointless unless the
    // result lands in resolveLoggedAt's bare-date branch untouched.
    const iso = toIsoDate("18/07/2026", "dmy");
    expect(iso).toBe("2026-07-18");
    const r = resolveLoggedAt(
        iso!,
        "Europe/Kyiv",
        Date.parse("2026-07-25T12:00:00Z"),
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
        expect(r.value.fromBareDate).toBe(true);
        // Kyiv is +03:00 in July, so local noon is 09:00Z.
        expect(r.value.iso).toBe("2026-07-18T09:00:00.000Z");
    }
    // And the raw DD/MM/YYYY the widget started with is rejected server-side,
    // which is why the conversion exists at all.
    expect(resolveLoggedAt("18/07/2026", "Europe/Kyiv", Date.now()).ok).toBe(
        false,
    );
});

// ---------- time conversion ----------

test("normalizeTime pads an unpadded 24-hour hour", () => {
    // The server's LOCAL_DATETIME_RE demands exactly 2-2 digits, so "9:15"
    // would be rejected even though it names a real time.
    expect(normalizeTime("9:15")).toBe("09:15");
    expect(normalizeTime("0:05")).toBe("00:05");
    // Already padded: unchanged.
    expect(normalizeTime("09:15")).toBe("09:15");
    expect(normalizeTime("23:15")).toBe("23:15");
    expect(normalizeTime("00:00")).toBe("00:00");
});

test("normalizeTime converts 12-hour AM/PM to 24-hour", () => {
    // Cronometer's Time column shape — the exact case from issue #64.
    expect(normalizeTime("9:15 AM")).toBe("09:15");
    expect(normalizeTime("1:00 PM")).toBe("13:00");
    // The two hours a 12-hour clock spells unintuitively.
    expect(normalizeTime("12:00 AM")).toBe("00:00"); // midnight
    expect(normalizeTime("12:00 PM")).toBe("12:00"); // noon
    expect(normalizeTime("12:30 AM")).toBe("00:30");
    expect(normalizeTime("12:30 PM")).toBe("12:30");
    expect(normalizeTime("11:59 PM")).toBe("23:59");
});

test("normalizeTime accepts the export-observed AM/PM spellings", () => {
    for (const v of [
        "9:15 AM",
        "9:15AM",
        "9:15am",
        "9:15 am",
        "9:15 a.m.",
        "9:15a.m.",
        "9:15a",
    ]) {
        expect(normalizeTime(v)).toBe("09:15");
    }
    for (const v of ["1:00 PM", "1:00pm", "1:00 p.m.", "1:00p"]) {
        expect(normalizeTime(v)).toBe("13:00");
    }
});

test("normalizeTime preserves seconds when present", () => {
    expect(normalizeTime("9:15:07")).toBe("09:15:07");
    expect(normalizeTime("9:15:07 AM")).toBe("09:15:07");
    expect(normalizeTime("11:59:59 PM")).toBe("23:59:59");
});

test("normalizeTime rejects out-of-range and unparseable values", () => {
    // Minutes/seconds out of range.
    expect(normalizeTime("9:60")).toBeNull();
    expect(normalizeTime("9:15:60")).toBeNull();
    // 24-hour value out of range with no meridiem to reinterpret it by.
    expect(normalizeTime("24:00")).toBeNull();
    expect(normalizeTime("25:15")).toBeNull();
    // A 12-hour clock never carries these hours.
    expect(normalizeTime("13:00 PM")).toBeNull();
    expect(normalizeTime("00:15 AM")).toBeNull();
    expect(normalizeTime("0:15 PM")).toBeNull();
    // Blank-ish and junk cells.
    for (const v of ["", "  ", "n/a", "-", undefined, "Breakfast", "9"]) {
        expect(normalizeTime(v)).toBeNull();
    }
});

test("normalizeTime output is accepted by the server's resolveLoggedAt", () => {
    // The contract that matters, mirroring the toIsoDate test above: normalising
    // client-side is pointless unless the result actually lands in
    // resolveLoggedAt's local-time branch. This is issue #64 end-to-end — a
    // Cronometer row with a "9:15 AM" Time column, reproduced from the
    // Cronometer-shaped fixture earlier in this file.
    const iso = toIsoDate("2026-01-15", "iso");
    const time = normalizeTime("9:15 AM");
    expect(iso).toBe("2026-01-15");
    expect(time).toBe("09:15");

    const r = resolveLoggedAt(
        `${iso} ${time}`,
        "Europe/Kyiv",
        Date.parse("2026-01-20T12:00:00Z"),
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
        expect(r.value.fromBareDate).toBe(false);
        // Kyiv is +02:00 in January, so 09:15 local is 07:15Z.
        expect(r.value.iso).toBe("2026-01-15T07:15:00.000Z");
    }

    // And the raw, un-normalized cell the widget used to send is rejected
    // server-side — every single row, which is exactly issue #64's failure.
    expect(
        resolveLoggedAt(`${iso} 9:15 AM`, "Europe/Kyiv", Date.now()).ok,
    ).toBe(false);
});

// ---------- energy units ----------

test("sniffEnergyUnit reads the unit from the header first", () => {
    // The header is the one place the exporting app states its unit. Mapping a
    // kJ column to calories inflates every row 4.184x with no visible symptom.
    for (const h of [
        "Energy (kJ)",
        "energy_kj",
        "kJ",
        "Kilojoules",
        "Energy, kilojoule",
    ]) {
        expect(sniffEnergyUnit(h, [1500, 1600])).toBe("kj");
    }
    for (const h of [
        "Energy (kcal)",
        "Calories",
        "calories_kcal",
        "Cals",
        "Calorie",
    ]) {
        expect(sniffEnergyUnit(h, [220, 198])).toBe("kcal");
    }
    // Both named: the parenthesised unit is a deliberate statement, the word
    // "Calories" is often just the generic name for an energy column.
    expect(sniffEnergyUnit("Calories (kJ)", [900])).toBe("kj");
});

test("sniffEnergyUnit falls back to magnitude only for an uninformative header", () => {
    // Weak by design: per-meal kcal and per-meal kJ overlap, so this only claims
    // kJ for values implausible as one meal in kcal, and defaults to kcal
    // otherwise. A daily kcal total is the known blind spot.
    expect(sniffEnergyUnit("Energy", [2900, 3400, 4200])).toBe("kj");
    expect(sniffEnergyUnit("Amount", [220, 198, 640])).toBe("kcal");
    // The other half of the caveat: a small-meal kJ column looks exactly like a
    // kcal column, so it is missed and needs the header or the user.
    expect(sniffEnergyUnit("Energy", [900, 1200, 1500])).toBe("kcal");
    // No usable values at all -> the safe default.
    expect(sniffEnergyUnit("Energy", [])).toBe("kcal");
    expect(sniffEnergyUnit("Energy", [0, NaN])).toBe("kcal");
    // The blind spot, stated out loud: a day's totals in kcal read as kcal only
    // because they sit under the threshold, not because anything proved it.
    expect(sniffEnergyUnit("Energy", [1900, 2100, 2300])).toBe("kcal");
});

test("toKcal divides kJ by 4.184 and rounds to a whole kcal", () => {
    // The calories column is an integer in the DB, so rounding here keeps the
    // widget's preview and control totals identical to what the server stores.
    expect(toKcal(1000, "kj")).toBe(239); // 239.005...
    expect(toKcal(920, "kj")).toBe(220); // 219.88 -> a Cronometer-sized meal
    expect(toKcal(8368, "kj")).toBe(2000); // exactly 2000 kcal
    expect(toKcal(0, "kj")).toBe(0);
});

test("toKcal rounds a kcal column too", () => {
    // Not a formality: Cronometer's "Energy (kcal)" carries two decimals, and
    // an integer column rejects those outright (22P02) instead of truncating,
    // so a passed-through 388.54 failed the whole row.
    expect(toKcal(220, "kcal")).toBe(220);
    expect(toKcal(388.54, "kcal")).toBe(389);
    expect(toKcal(219.88, "kcal")).toBe(220);
    expect(toKcal(0.4, "kcal")).toBe(0);
});
