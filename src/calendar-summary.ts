/**
 * Today-navigation calendar (brief items 1–2): the month summary that
 * backs the Today header calendar's data dots. One lightweight payload
 * per visible month — the dates that carry anything logged (meals,
 * water, weight) with per-kind counts — never a per-day fetch loop.
 *
 * The assembly here is pure so it is unit-testable without a database;
 * src/app/repository.ts runs the three grouped count queries and hands
 * their rows in.
 */

export interface CalendarMonth {
    /** Canonical "YYYY-MM". */
    month: string;
    /** First day of the month, "YYYY-MM-DD". */
    firstDate: string;
    /** Last day of the month, "YYYY-MM-DD". */
    lastDate: string;
    /** First day of the following month, "YYYY-MM-DD" (exclusive end). */
    nextMonthFirstDate: string;
}

const MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

export function parseCalendarMonth(value: string): CalendarMonth {
    const match = MONTH_PATTERN.exec(String(value ?? "").trim());
    if (!match) {
        throw new Error("Month must use YYYY-MM format");
    }
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (month < 1 || month > 12) {
        throw new Error("Month must use YYYY-MM format");
    }
    const pad = (part: number) => String(part).padStart(2, "0");
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const nextYear = month === 12 ? year + 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;
    return {
        month: `${year}-${pad(month)}`,
        firstDate: `${year}-${pad(month)}-01`,
        lastDate: `${year}-${pad(month)}-${pad(lastDay)}`,
        nextMonthFirstDate: `${nextYear}-${pad(nextMonth)}-01`,
    };
}

export interface CalendarDayCounts {
    date: string;
    meals: number;
    water: number;
    weight: number;
}

export interface CalendarCountRow {
    date: string;
    count: number;
}

/**
 * Merge the per-kind count rows into one sparse day list: only days
 * carrying at least one entry of any kind appear, sorted by date.
 */
export function assembleCalendarMonthDays(input: {
    meals: readonly CalendarCountRow[];
    water: readonly CalendarCountRow[];
    weight: readonly CalendarCountRow[];
}): CalendarDayCounts[] {
    const byDate = new Map<string, CalendarDayCounts>();
    const apply = (
        rows: readonly CalendarCountRow[],
        kind: "meals" | "water" | "weight",
    ) => {
        for (const row of rows) {
            if (!row.date || !(row.count > 0)) continue;
            const day = byDate.get(row.date) ?? {
                date: row.date,
                meals: 0,
                water: 0,
                weight: 0,
            };
            day[kind] += row.count;
            byDate.set(row.date, day);
        }
    };
    apply(input.meals, "meals");
    apply(input.water, "water");
    apply(input.weight, "weight");
    return [...byDate.values()].sort((a, b) =>
        a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
    );
}
