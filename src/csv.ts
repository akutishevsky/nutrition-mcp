// CSV parsing for bulk meal import.
//
// Lives here rather than inline in the widget template so it can be unit-tested
// against real export quirks: a parser facing arbitrary user files is the
// riskiest part of the import, and inline template JS is only ever checked for
// syntactic validity (src/widgets.test.ts). The widget inlines the compiled
// output via an @include partial.
//
// Written as a character-level state machine because line-splitting first is
// wrong: MyFitnessPal and Cronometer both emit note columns containing quoted
// newlines, so "split on newline" corrupts those rows and every row after them.
//
// Quirks handled, each observed in a real export:
//   - UTF-8 BOM (MyFitnessPal) and UTF-16 LE/BE (some Excel "save as" paths)
//   - CRLF line endings (any Windows Excel export)
//   - quoted fields containing the delimiter, quotes ("" escape), or newlines
//   - ; delimiter with , as the decimal separator (European Excel locale)
//   - duplicate header names (Cronometer repeats "Amount") -> columns are keyed
//     by INDEX; header text is a label only
//   - blank-ish cells: empty, "n/a" (Lose It!), "-", "null"
//   - trailing blank lines and interior blank rows
//   - totals / subtotal rows (MyFitnessPal daily exports end with one)

/** Values real exports use to mean "no value". */
const BLANK_TOKENS = new Set(["", "-", "--", "n/a", "na", "null", "none"]);

/** Leading words that mark an aggregate row rather than a food row. */
const TOTALS_ROW_PREFIXES = [
    "total",
    "totals",
    "daily total",
    "grand total",
    "subtotal",
    "sub-total",
    "average",
    "averages",
];

const CANDIDATE_DELIMITERS = [",", ";", "\t", "|"] as const;

export type Delimiter = (typeof CANDIDATE_DELIMITERS)[number];
export type DecimalSeparator = "." | ",";

export interface ParsedTable {
    /** Header labels by column index. May contain duplicates or empties. */
    headers: string[];
    /** Data rows, each padded/truncated to headers.length. */
    rows: string[][];
    /** 1-based line number in the ORIGINAL text for each row in `rows`. */
    sourceLines: number[];
    delimiter: Delimiter;
    decimalSeparator: DecimalSeparator;
    encoding: string;
    /** Rows recognised as totals/aggregates and excluded from `rows`. */
    skippedTotalsRows: number;
    /** Blank rows excluded from `rows`. */
    skippedBlankRows: number;
    warnings: string[];
}

// ---------- decoding ----------

/**
 * Decode file bytes to text, honouring the BOM.
 *
 * Necessary because Blob.text() always assumes UTF-8: a UTF-16 export decodes to
 * NUL-interleaved gibberish that then "parses" into garbage rather than failing.
 */
export function decodeBytes(bytes: Uint8Array): {
    text: string;
    encoding: string;
} {
    if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
        return {
            text: new TextDecoder("utf-16").decode(bytes.subarray(2)),
            encoding: "utf-16le",
        };
    }
    if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
        // "utf-16" is the spec alias for little-endian and is the widest-typed
        // name available, so swap the byte pairs and decode as LE.
        const body = bytes.subarray(2);
        const swapped = new Uint8Array(body.length);
        for (let i = 0; i + 1 < body.length; i += 2) {
            swapped[i] = body[i + 1]!;
            swapped[i + 1] = body[i]!;
        }
        return {
            text: new TextDecoder("utf-16").decode(swapped),
            encoding: "utf-16be",
        };
    }
    if (
        bytes.length >= 3 &&
        bytes[0] === 0xef &&
        bytes[1] === 0xbb &&
        bytes[2] === 0xbf
    ) {
        return {
            text: new TextDecoder("utf-8").decode(bytes.subarray(3)),
            encoding: "utf-8-bom",
        };
    }
    return {
        text: new TextDecoder("utf-8").decode(bytes),
        encoding: "utf-8",
    };
}

/** Strip a UTF-8 BOM that survived decoding as a character. */
export function stripBom(text: string): string {
    return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

// ---------- sniffing ----------

/**
 * Pick the delimiter by counting candidates OUTSIDE quoted regions on the first
 * few lines and choosing the one with the most consistent per-line count.
 * Counting naively would pick "," for a semicolon-delimited file whose text
 * fields contain commas.
 */
export function sniffDelimiter(text: string): Delimiter {
    const sample = firstLogicalLines(text, 5);
    if (sample.length === 0) return ",";

    let best: Delimiter = ",";
    let bestScore = -1;
    for (const d of CANDIDATE_DELIMITERS) {
        const counts = sample.map((line) => countOutsideQuotes(line, d));
        const first = counts[0]!;
        if (first === 0) continue;
        // Prefer delimiters whose count is identical on every sampled line;
        // break ties by how many columns they produce.
        const consistent = counts.every((c) => c === first);
        const score = (consistent ? 1000 : 0) + first;
        if (score > bestScore) {
            bestScore = score;
            best = d;
        }
    }
    return best;
}

/**
 * Decide whether numbers use a comma decimal separator. Only meaningful when the
 * delimiter is not itself a comma. Getting this wrong scales every macro by
 * 1000x while still producing valid-looking numbers.
 */
export function sniffDecimalSeparator(
    rows: string[][],
    delimiter: Delimiter,
): DecimalSeparator {
    if (delimiter === ",") return ".";
    let commaDecimals = 0;
    let dotDecimals = 0;
    for (const row of rows.slice(0, 50)) {
        for (const cell of row) {
            const v = cell.trim();
            if (/^-?\d+,\d+$/.test(v)) commaDecimals++;
            else if (/^-?\d+\.\d+$/.test(v)) dotDecimals++;
        }
    }
    return commaDecimals > dotDecimals ? "," : ".";
}

/** Count `delimiter` occurrences outside quoted regions. */
function countOutsideQuotes(line: string, delimiter: string): number {
    let inQuotes = false;
    let count = 0;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') i++;
            else inQuotes = !inQuotes;
        } else if (ch === delimiter && !inQuotes) {
            count++;
        }
    }
    return count;
}

/** First N logical lines, respecting quoted newlines. */
function firstLogicalLines(text: string, n: number): string[] {
    const out: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < text.length && out.length < n; i++) {
        const ch = text[i]!;
        if (ch === '"') {
            if (inQuotes && text[i + 1] === '"') {
                current += '""';
                i++;
                continue;
            }
            inQuotes = !inQuotes;
            current += ch;
            continue;
        }
        if (!inQuotes && (ch === "\n" || ch === "\r")) {
            if (ch === "\r" && text[i + 1] === "\n") i++;
            out.push(current);
            current = "";
            continue;
        }
        current += ch;
    }
    if (out.length < n && current.trim() !== "") out.push(current);
    return out;
}

// ---------- the parser ----------

interface RawRow {
    fields: string[];
    /** 1-based line where the row STARTED in the original text. */
    line: number;
}

/**
 * Tokenize the whole text into rows of fields.
 *
 * Line numbers count physical newlines, so a row containing a quoted newline
 * reports the line it began on and subsequent rows keep the original file's
 * numbering — which is what makes source_line meaningful for provenance.
 */
function tokenize(text: string, delimiter: string): RawRow[] {
    const rows: RawRow[] = [];
    let fields: string[] = [];
    let field = "";
    let inQuotes = false;
    let line = 1;
    let rowStartLine = 1;
    let sawAnyChar = false;

    const endField = () => {
        fields.push(field);
        field = "";
    };
    const endRow = () => {
        endField();
        rows.push({ fields, line: rowStartLine });
        fields = [];
        rowStartLine = line;
        sawAnyChar = false;
    };

    for (let i = 0; i < text.length; i++) {
        const ch = text[i]!;

        if (inQuotes) {
            if (ch === '"') {
                if (text[i + 1] === '"') {
                    field += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                if (ch === "\n") line++;
                field += ch;
            }
            continue;
        }

        if (ch === '"' && field === "") {
            inQuotes = true;
            sawAnyChar = true;
            continue;
        }
        if (ch === delimiter) {
            endField();
            sawAnyChar = true;
            continue;
        }
        if (ch === "\r") {
            if (text[i + 1] === "\n") i++;
            line++;
            endRow();
            rowStartLine = line;
            continue;
        }
        if (ch === "\n") {
            line++;
            endRow();
            rowStartLine = line;
            continue;
        }
        field += ch;
        sawAnyChar = true;
    }

    // Trailing row without a terminating newline.
    if (field !== "" || fields.length > 0 || sawAnyChar) endRow();

    return rows;
}

export interface ParseCsvOptions {
    delimiter?: Delimiter;
    decimalSeparator?: DecimalSeparator;
    /** Keep totals/average rows instead of excluding them. */
    keepTotalsRows?: boolean;
}

export function parseCsv(
    input: string | Uint8Array,
    options: ParseCsvOptions = {},
): ParsedTable {
    const warnings: string[] = [];
    let encoding = "utf-8";
    let text: string;
    if (typeof input === "string") {
        text = stripBom(input);
    } else {
        const decoded = decodeBytes(input);
        text = stripBom(decoded.text);
        encoding = decoded.encoding;
    }

    const delimiter = options.delimiter ?? sniffDelimiter(text);
    const raw = tokenize(text, delimiter);

    // Header = first row that is not blank.
    let headerIdx = raw.findIndex((r) => !isBlankRow(r.fields));
    if (headerIdx === -1) {
        return {
            headers: [],
            rows: [],
            sourceLines: [],
            delimiter,
            decimalSeparator: options.decimalSeparator ?? ".",
            encoding,
            skippedTotalsRows: 0,
            skippedBlankRows: 0,
            warnings: ["The file contains no data."],
        };
    }
    const headers = raw[headerIdx]!.fields.map((h) => h.trim());

    const seenHeaders = new Map<string, number>();
    for (const h of headers) {
        const k = normalizeHeader(h);
        seenHeaders.set(k, (seenHeaders.get(k) ?? 0) + 1);
    }
    const duplicated = [...seenHeaders.entries()]
        .filter(([k, n]) => n > 1 && k !== "")
        .map(([k]) => k);
    if (duplicated.length > 0) {
        warnings.push(
            `Duplicate column name(s): ${duplicated.join(", ")}. Columns are matched by position, so pick the one you want by index.`,
        );
    }

    const rows: string[][] = [];
    const sourceLines: number[] = [];
    let skippedTotalsRows = 0;
    let skippedBlankRows = 0;
    let raggedRows = 0;

    for (const r of raw.slice(headerIdx + 1)) {
        if (isBlankRow(r.fields)) {
            skippedBlankRows++;
            continue;
        }
        if (!options.keepTotalsRows && isTotalsRow(r.fields)) {
            skippedTotalsRows++;
            continue;
        }
        if (r.fields.length !== headers.length) raggedRows++;
        const padded = headers.map((_, i) => (r.fields[i] ?? "").trim());
        rows.push(padded);
        sourceLines.push(r.line);
    }

    if (raggedRows > 0) {
        warnings.push(
            `${raggedRows} row(s) had a different number of columns than the header; missing cells were treated as empty.`,
        );
    }
    if (skippedTotalsRows > 0) {
        warnings.push(
            `${skippedTotalsRows} totals/average row(s) were skipped rather than imported as meals.`,
        );
    }

    const decimalSeparator =
        options.decimalSeparator ?? sniffDecimalSeparator(rows, delimiter);

    return {
        headers,
        rows,
        sourceLines,
        delimiter,
        decimalSeparator,
        encoding,
        skippedTotalsRows,
        skippedBlankRows,
        warnings,
    };
}

// ---------- cell helpers ----------

export function isBlankRow(fields: string[]): boolean {
    return fields.every((f) => f.trim() === "");
}

/** A totals/average row: an aggregate label with no other identifying text. */
export function isTotalsRow(fields: string[]): boolean {
    const firstNonEmpty = fields.find((f) => f.trim() !== "");
    if (firstNonEmpty === undefined) return false;
    const v = firstNonEmpty.trim().toLowerCase().replace(/:$/, "");
    return TOTALS_ROW_PREFIXES.includes(v);
}

/** Whether a cell means "no value" rather than a value. */
export function isBlankCell(raw: string | undefined): boolean {
    if (raw === undefined) return true;
    return BLANK_TOKENS.has(raw.trim().toLowerCase());
}

/**
 * Header text reduced to a comparison key: lowercase, unit suffixes and
 * punctuation removed, micro sign normalized. Lets "Fat (g)", "fat_g" and
 * "Fat" match without keying data by name.
 */
export function normalizeHeader(header: string): string {
    return (
        header
            .trim()
            .toLowerCase()
            .replace(/µ|μ/g, "u") // micro sign / Greek mu -> u (ug)
            // Fold accents to their base letter before the a-z sweep below, which
            // would otherwise delete them and leave a stub: "Eiweiß" became "eiwei"
            // and never matched its own "eiweiss" alias, "Größe" became "gr_e".
            // NFD splits a letter from its combining mark so the mark can be
            // dropped; ß has no decomposition, so it is spelled out separately.
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/ß/g, "ss")
            .replace(/\(([^)]*)\)/g, " $1 ")
            .replace(/[^a-z0-9]+/g, " ")
            .trim()
            .replace(/\s+/g, "_")
    );
}

/**
 * Parse a numeric cell. Returns null for blank-ish cells rather than 0, so an
 * untracked nutrient stays absent instead of being recorded as a real zero.
 */
export function parseNumber(
    raw: string | undefined,
    decimalSeparator: DecimalSeparator = ".",
): number | null {
    if (isBlankCell(raw)) return null;
    let v = raw!.trim();

    // Strip currency-ish and unit noise but keep sign, digits and separators.
    v = v.replace(/[^0-9,.\-+eE]/g, "");
    if (v === "" || v === "-" || v === "+") return null;

    if (decimalSeparator === ",") {
        // 1.234,5 -> 1234.5
        v = v.replace(/\./g, "").replace(",", ".");
    } else {
        // 1,234.5 -> 1234.5 (thousands separators only)
        if (/,\d{3}(\D|$)/.test(v) || /^\d{1,3}(,\d{3})+$/.test(v)) {
            v = v.replace(/,/g, "");
        } else {
            v = v.replace(/,/g, ".");
        }
    }

    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

/**
 * Cronometer packs an amount and its unit into one cell ("58.00 g", "1.00 cup").
 * Returns the numeric part and the trailing unit text.
 */
export function splitAmount(
    raw: string | undefined,
    decimalSeparator: DecimalSeparator = ".",
): { value: number | null; unit: string | null } {
    if (isBlankCell(raw)) return { value: null, unit: null };
    const m = /^\s*([-+]?[\d.,]+)\s*(.*)$/.exec(raw!.trim());
    if (!m) return { value: null, unit: null };
    const unit = (m[2] ?? "").trim();
    return {
        value: parseNumber(m[1], decimalSeparator),
        unit: unit === "" ? null : unit,
    };
}

/**
 * Column index for the first header matching any of `aliases` (compared with
 * normalizeHeader). Returns -1 when absent. Index-based so duplicate header
 * names cannot silently collide.
 */
export function findColumn(headers: string[], aliases: string[]): number {
    const wanted = new Set(aliases.map(normalizeHeader));
    for (let i = 0; i < headers.length; i++) {
        if (wanted.has(normalizeHeader(headers[i]!))) return i;
    }
    return -1;
}

/**
 * True when a Lose It!-style "Deleted" column marks the row as deleted. Those
 * rows must be skipped: importing them resurrects food the user deliberately
 * removed, and no control total would catch it.
 */
export function isDeletedRow(row: string[], deletedColumn: number): boolean {
    if (deletedColumn < 0) return false;
    const v = (row[deletedColumn] ?? "").trim().toLowerCase();
    return v === "true" || v === "yes" || v === "1";
}

// ---------- dates ----------
//
// The server only accepts ISO (`YYYY-MM-DD`, see resolveLoggedAt in
// src/import.ts), so a DD/MM/YYYY or MM/DD/YYYY export fails on every single
// row until the widget normalises it. Normalising needs two steps, because a
// single cell can never be trusted on its own: sniff the format across a whole
// column, then convert each cell with the format the column agreed on.

export type DateFormat = "iso" | "dmy" | "mdy";

/**
 * What to assume for a day/month-ambiguous column. Day-first is the majority
 * convention worldwide, but it is a coin flip for any individual file — which is
 * why sniffDateFormat pairs this default with `ambiguous: true` so the UI asks
 * instead of importing three weeks of meals onto the wrong days.
 */
const AMBIGUOUS_DEFAULT: DateFormat = "dmy";

/** A trailing time-of-day: "18/07/2026 08:30", "2026-07-18T08:30:00", "1:00 PM". */
const TRAILING_TIME_RE =
    /[T ]\s*\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?\s*[ap]?\.?m?\.?$/i;

/** Three numeric components separated by `/`, `.` or `-`. */
const DATE_CELL_RE = /^(\d{1,4})[/.-](\d{1,2})[/.-](\d{1,4})$/;

interface DateCell {
    year: number;
    /** First non-year component: day if day-first, month if month-first. */
    first: number;
    /** Second non-year component. */
    second: number;
    /**
     * True when the year was written with two digits and had to be expanded, so
     * the year's POSITION was assumed rather than observed. Day-vs-month can
     * still be discriminated from such a cell, but the reading is less certain,
     * which sniffDateFormat reflects by flagging it.
     */
    yearWasTwoDigit?: boolean;
    /**
     * True when the cell led with a 4-digit year, i.e. it is ISO-shaped and its
     * component order is not in question at all.
     */
    yearFirst: boolean;
}

/**
 * Split a date cell into components without deciding what they mean.
 *
 * Returns null for anything unusable, which deliberately includes 2-DIGIT YEARS
 * ("03/04/26"). Guessing a century is one bad assumption, but the real problem
 * is that all three components are then 1-2 digits, so "26/07/18" could be
 * day-first, month-first *or* year-first and no sample of the column can settle
 * it. A rejected row surfaces as a fixable error; a mis-ordered one silently
 * files a meal on the wrong day. No export we have seen uses 2-digit years, so
 * the cost of rejecting is a message the user can act on.
 *
 * A trailing time-of-day is tolerated and dropped: some exports put the whole
 * timestamp in one column, and dropping the time only costs precision (the
 * server dates a bare date at local noon and flags logged_at_from_bare_date),
 * whereas rejecting would fail every row of such a file.
 */
/**
 * Expand a two-digit year using the strftime/POSIX pivot: 00-68 map to
 * 2000-2068 and 69-99 to 1969-1999.
 *
 * A fixed pivot rather than one derived from today's date, because this module
 * is deliberately clock-free. It does not need to be clever: the import bounds
 * dates to roughly the last twenty years, so a nonsense expansion surfaces as an
 * out-of-range error on that row instead of a silently misfiled meal.
 */
function expandTwoDigitYear(yy: number): number {
    return yy <= 68 ? 2000 + yy : 1900 + yy;
}

function splitDateCell(raw: string | undefined): DateCell | null {
    if (isBlankCell(raw)) return null;
    const text = raw!.trim().replace(TRAILING_TIME_RE, "").trim();
    const m = DATE_CELL_RE.exec(text);
    if (!m) return null;
    const a = m[1]!;
    const b = m[2]!;
    const c = m[3]!;
    if (a.length === 4) {
        return {
            year: Number(a),
            first: Number(b),
            second: Number(c),
            yearFirst: true,
        };
    }
    if (c.length === 4) {
        return {
            year: Number(c),
            first: Number(a),
            second: Number(b),
            yearFirst: false,
        };
    }
    // No 4-digit year anywhere, e.g. 18/07/26. The ORDER is still recoverable —
    // that is what the caller's `format` states — so only the century is
    // genuinely unknown, and that is a solvable problem. Assume the year is last,
    // which is what "dmy" and "mdy" mean; a leading two-digit year (`26/07/18`
    // as year-first) is a shape no surveyed export uses and one we do not offer.
    return {
        year: expandTwoDigitYear(Number(c)),
        first: Number(a),
        second: Number(b),
        yearFirst: false,
        yearWasTwoDigit: true,
    };
}

/**
 * Decide which date format a column of raw cells uses.
 *
 * The only reliable discriminator is a value that cannot be read both ways: a
 * first component above 12 means day-first, a second component above 12 means
 * month-first. Frequency proves nothing, so a column of `05/06/2026` reports
 * `ambiguous: true` and the UI must ask rather than pick — an unflagged guess
 * would file every meal on the wrong day with no visible symptom.
 *
 * Blank and unparseable cells are ignored so a "n/a" or a stray note cannot
 * skew the vote.
 */
export function sniffDateFormat(values: string[]): {
    format: DateFormat;
    ambiguous: boolean;
} {
    let iso = 0;
    let dmy = 0;
    let mdy = 0;
    /** Parseable but readable both ways, e.g. 05/06/2026. */
    let either = 0;
    /** Discriminating cells whose year was written in full. */
    let fourDigitEvidence = 0;

    for (const v of values) {
        const p = splitDateCell(v);
        if (p === null) continue;
        if (p.yearFirst) {
            iso++;
        } else if (p.first > 12 && p.second > 12) {
            continue; // not a real date in either reading
        } else if (p.first > 12) {
            dmy++;
            if (!p.yearWasTwoDigit) fourDigitEvidence++;
        } else if (p.second > 12) {
            mdy++;
            if (!p.yearWasTwoDigit) fourDigitEvidence++;
        } else {
            either++;
        }
    }

    // Day-vs-month can be read off a two-digit-year cell, but the year's
    // position had to be assumed to get there. When that is the ONLY evidence,
    // report the reading and still ask the user to confirm it.
    const twoDigitOnly = dmy + mdy > 0 && fourDigitEvidence === 0;

    const nonIso = dmy + mdy + either;
    // Nothing usable in the sample: we know literally nothing, so ask.
    if (iso === 0 && nonIso === 0) return { format: "iso", ambiguous: true };
    if (nonIso === 0) return { format: "iso", ambiguous: false };

    const dayVsMonth: DateFormat =
        dmy > mdy ? "dmy" : mdy > dmy ? "mdy" : AMBIGUOUS_DEFAULT;

    // A column mixing ISO and slash forms is either a hand-edited file or an
    // export that changed format mid-history. Report the majority, but flag it.
    if (iso > 0) {
        return { format: iso >= nonIso ? "iso" : dayVsMonth, ambiguous: true };
    }
    // Both discriminators fired, so the column is not one single format.
    if (dmy > 0 && mdy > 0) return { format: dayVsMonth, ambiguous: true };
    // Order is known, century is not: usable, but say so.
    if (twoDigitOnly) return { format: dayVsMonth, ambiguous: true };
    if (dmy > 0) return { format: "dmy", ambiguous: false };
    if (mdy > 0) return { format: "mdy", ambiguous: false };
    // Every value fits both readings.
    return { format: AMBIGUOUS_DEFAULT, ambiguous: true };
}

/**
 * Reject calendar dates that do not exist. Date.UTC rolls them over silently
 * (2026-02-31 becomes 2026-03-03), which would turn a day/month swap into a
 * plausible-looking wrong date instead of an error — the same bug class
 * isRealCalendarDate guards in src/import.ts. Round-trip the components to
 * catch it.
 */
function isRealDate(year: number, month: number, day: number): boolean {
    if (month < 1 || month > 12 || day < 1 || day > 31) return false;
    const probe = new Date(Date.UTC(year, month - 1, day));
    return (
        probe.getUTCFullYear() === year &&
        probe.getUTCMonth() === month - 1 &&
        probe.getUTCDate() === day
    );
}

/**
 * Convert a raw date cell to `YYYY-MM-DD`, or null when it cannot be trusted.
 * Zero-pads, because the server's BARE_DATE_RE demands exactly 4-2-2 digits.
 */
export function toIsoDate(
    raw: string | undefined,
    format: DateFormat,
): string | null {
    const p = splitDateCell(raw);
    if (p === null) return null;

    let year: number;
    let month: number;
    let day: number;
    if (p.yearFirst) {
        // A leading 4-digit year is ISO no matter what `format` says: nothing
        // else is written year-first, so honour the cell over the column so one
        // ISO row in a day-first file still imports.
        year = p.year;
        month = p.first;
        day = p.second;
    } else if (format === "iso") {
        // Told ISO and handed 18/07/2026: we have no mandate to pick an order.
        return null;
    } else if (format === "dmy") {
        year = p.year;
        day = p.first;
        month = p.second;
    } else {
        year = p.year;
        month = p.first;
        day = p.second;
    }

    if (!isRealDate(year, month, day)) return null;
    return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// ---------- times ----------
//
// The server's LOCAL_DATETIME_RE (src/import.ts) only accepts zero-padded
// 24-hour HH:MM[:SS] — it has to, since it also parses the T-joined form of a
// full timestamp, where "9:15 AM" would be ambiguous with other fields. But
// exports hand back whatever their own locale prints: Cronometer's Time
// column is unpadded 12-hour ("9:15 AM"), and a date cell's trailing time
// (captured by CELL_TIME_RE in the widget) carries the same shapes. Sending
// either straight through made the server reject every single row.

const TIME_RE = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap])?\.?m?\.?$/i;

/**
 * Convert a raw time cell to zero-padded 24-hour `HH:MM` or `HH:MM:SS`, or
 * null when it cannot be trusted. Accepts an optional trailing am/pm marker
 * in any of the export-observed spellings ("AM", "am", "a.m.", "9:15a").
 *
 * A meridiem marker switches validation to the 12-hour range (1-12) and
 * converts to 24-hour; its absence keeps the value in 24-hour range (0-23)
 * unchanged but still zero-pads it, so an already-correct "9:15" (missing
 * only its leading zero) is not rejected for lack of an AM/PM marker.
 */
export function normalizeTime(raw: string | undefined): string | null {
    if (raw === undefined) return null;
    const text = raw.trim();
    if (text === "") return null;

    const m = TIME_RE.exec(text);
    if (!m) return null;

    let hour = Number(m[1]);
    const minute = Number(m[2]);
    const second = m[3] !== undefined ? Number(m[3]) : undefined;
    const meridiem = m[4] ? m[4].toLowerCase() : null;

    if (minute > 59) return null;
    if (second !== undefined && second > 59) return null;

    if (meridiem) {
        // A 12-hour clock never carries an hour outside 1-12 (no "00" or
        // "13 PM"); reject rather than guess what was meant.
        if (hour < 1 || hour > 12) return null;
        hour =
            meridiem === "a"
                ? hour === 12
                    ? 0
                    : hour
                : hour === 12
                  ? 12
                  : hour + 12;
    } else if (hour > 23) {
        return null;
    }

    const hh = String(hour).padStart(2, "0");
    const mm = String(minute).padStart(2, "0");
    return second === undefined
        ? `${hh}:${mm}`
        : `${hh}:${mm}:${String(second).padStart(2, "0")}`;
}

// ---------- energy ----------

export type EnergyUnit = "kcal" | "kj";

/** Thermochemical kilojoules per kilocalorie — the constant every food label uses. */
const KJ_PER_KCAL = 4.184;

/**
 * Above this median, values are read as kJ when the header says nothing.
 *
 * Be clear-eyed about this: it is a weak signal and no threshold is correct.
 * Per-meal kcal run ~50-1200, per-meal kJ ~200-5000, and a per-DAY kcal total
 * (~2000) sits squarely inside the per-meal kJ range — the ranges overlap, so
 * any threshold mislabels some real file. 2500 is chosen to fail safe: it only
 * claims kJ for values implausible as a single meal in kcal, and everything
 * below falls through to the kcal default. The header is the real signal.
 */
const KJ_MEDIAN_THRESHOLD = 2500;

const KJ_HEADER_RE = /(?:^|_)(kj|kjs|kilojoule|kilojoules|joule|joules)(?:_|$)/;
const KCAL_HEADER_RE =
    /(?:^|_)(kcal|kcals|cal|cals|calorie|calories|kilocalorie|kilocalories)(?:_|$)/;

/**
 * Decide whether an energy column is in kcal or kJ.
 *
 * The header is the primary signal because it is the one place the exporting app
 * actually states its unit; the magnitude heuristic is only a last resort (see
 * KJ_MEDIAN_THRESHOLD for why it is weak). Defaults to kcal when unsure, since
 * that is what the server stores and what most exports use — mistaking kJ for
 * kcal inflates every row 4.184x, so the UI should still show a preview of the
 * converted numbers before importing.
 *
 * A header naming both ("Calories (kJ)") is read as kJ: the parenthesised unit
 * is a deliberate statement, while "Calories" is often just the generic word for
 * an energy column.
 */
export function sniffEnergyUnit(header: string, values: number[]): EnergyUnit {
    const key = normalizeHeader(header);
    if (KJ_HEADER_RE.test(key)) return "kj";
    if (KCAL_HEADER_RE.test(key)) return "kcal";

    const usable = values
        .filter((v) => Number.isFinite(v) && v > 0)
        .sort((a, b) => a - b);
    if (usable.length === 0) return "kcal";
    const median = usable[Math.floor(usable.length / 2)]!;
    return median > KJ_MEDIAN_THRESHOLD ? "kj" : "kcal";
}

/**
 * Convert an energy value to kcal, rounded to a whole number.
 *
 * Both branches round, because the calories column is an integer in the DB:
 * rounding here keeps the widget's preview and control totals identical to what
 * the server stores. A kcal column is NOT exempt — Cronometer exports "Energy
 * (kcal)" with two decimals, and passing those through used to make Postgres
 * reject the row outright (22P02) rather than truncate it.
 */
export function toKcal(value: number, unit: EnergyUnit): number {
    if (unit === "kcal") return Math.round(value);
    return Math.round(value / KJ_PER_KCAL);
}
