import { test, expect } from "bun:test";
import { chunkRows } from "./chunk.js";

interface Row {
    logged_at: string;
    n: number;
}

/** `count` rows for `date`, numbered from `startN` so order is checkable. */
function dayRows(date: string, count: number, startN = 0): Row[] {
    return Array.from({ length: count }, (_, i) => ({
        logged_at: `${date}T${String(i % 24).padStart(2, "0")}:00`,
        n: startN + i,
    }));
}

function assertNoOversizedChunk(chunks: Row[][], max: number) {
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(max);
}

/** Flattening every chunk back together must reproduce the input exactly —
 *  proves chunking neither drops, duplicates, nor reorders rows. */
function assertRoundTrips(chunks: Row[][], original: Row[]) {
    expect(chunks.flat().map((r) => r.n)).toEqual(original.map((r) => r.n));
}

test("empty input produces no chunks and no split dates", () => {
    const { chunks, splitDates } = chunkRows([], 50);
    expect(chunks).toEqual([]);
    expect(splitDates).toEqual([]);
});

test("fewer rows than max stay in one chunk", () => {
    const rows = dayRows("2026-01-01", 5);
    const { chunks, splitDates } = chunkRows(rows, 50);
    expect(chunks).toHaveLength(1);
    assertRoundTrips(chunks, rows);
    expect(splitDates).toEqual([]);
});

test("the reported bug: a 50-row boundary falling mid-date no longer overflows", () => {
    // 120 rows at 4/day (30 days) — rows 49-52 share a date, exactly the
    // failure scenario from issue #65. The old implementation only closed a
    // chunk on a date change, so this date's rows kept accumulating past 50.
    const rows = Array.from({ length: 30 }, (_, d) =>
        dayRows(`2026-01-${String(d + 1).padStart(2, "0")}`, 4, d * 4),
    ).flat();
    expect(rows).toHaveLength(120);

    const { chunks, splitDates } = chunkRows(rows, 50);
    assertNoOversizedChunk(chunks, 50);
    assertRoundTrips(chunks, rows);
    // No single date has more than 50 rows, so nothing should have needed
    // splitting — every chunk boundary falls between dates.
    expect(splitDates).toEqual([]);
});

test("a date boundary landing exactly on the cap keeps working", () => {
    // Regression guard: the previous implementation's happy path (date
    // change lines up with a multiple of max) must still produce one chunk
    // per day-group and never merge across the cap.
    const rows = [...dayRows("2026-02-01", 50), ...dayRows("2026-02-02", 50)];
    const { chunks, splitDates } = chunkRows(rows, 50);
    expect(chunks.map((c) => c.length)).toEqual([50, 50]);
    assertRoundTrips(chunks, rows);
    expect(splitDates).toEqual([]);
});

test("a single date alone over the cap is split, and reported in splitDates", () => {
    // The "unsatisfiable constraint" case flagged in the issue: one calendar
    // date with more rows than max. The cap wins — the server hard-rejects
    // an over-large call regardless of date grouping — so this date has to
    // be split, and callers need to know it happened.
    const rows = dayRows("2026-03-01", 61);
    const { chunks, splitDates } = chunkRows(rows, 50);
    assertNoOversizedChunk(chunks, 50);
    assertRoundTrips(chunks, rows);
    expect(chunks.map((c) => c.length)).toEqual([50, 11]);
    expect(splitDates).toEqual(["2026-03-01"]);
});

test("an oversized date closes the preceding chunk before splitting", () => {
    // A partially-filled chunk must not silently absorb part of the next
    // (oversized) date's rows — that would just reintroduce the same bug for
    // a differently-shaped input.
    const rows = [...dayRows("2026-04-01", 10), ...dayRows("2026-04-02", 55)];
    const { chunks, splitDates } = chunkRows(rows, 50);
    assertNoOversizedChunk(chunks, 50);
    assertRoundTrips(chunks, rows);
    expect(chunks.map((c) => c.length)).toEqual([10, 50, 5]);
    expect(splitDates).toEqual(["2026-04-02"]);
});

test("an oversized date is followed by normal dates that chunk independently", () => {
    const rows = [
        ...dayRows("2026-05-01", 55),
        ...dayRows("2026-05-02", 10),
        ...dayRows("2026-05-03", 10),
    ];
    const { chunks, splitDates } = chunkRows(rows, 50);
    assertNoOversizedChunk(chunks, 50);
    assertRoundTrips(chunks, rows);
    // 55 splits into 50 + 5 as two already-closed chunks; the trailing 5 is
    // not reopened to absorb later dates, so 05-02 and 05-03 group on their
    // own (5 + 10 + 10 would still fit under 50, but simplicity over packing
    // efficiency here — this is an already-rare edge case).
    expect(chunks.map((c) => c.length)).toEqual([50, 5, 20]);
    expect(splitDates).toEqual(["2026-05-01"]);
});

test("multiple oversized dates are each reported", () => {
    const rows = [...dayRows("2026-06-01", 52), ...dayRows("2026-06-02", 51)];
    const { chunks, splitDates } = chunkRows(rows, 50);
    assertNoOversizedChunk(chunks, 50);
    assertRoundTrips(chunks, rows);
    expect(splitDates).toEqual(["2026-06-01", "2026-06-02"]);
});

test("a bare date (no time) is still grouped correctly", () => {
    // logged_at can be a plain YYYY-MM-DD with no time component; dayOf must
    // not choke on the missing "T...".
    const rows = [
        { logged_at: "2026-07-01", n: 0 },
        { logged_at: "2026-07-01", n: 1 },
        { logged_at: "2026-07-02", n: 2 },
    ];
    const { chunks } = chunkRows(rows, 50);
    expect(chunks).toHaveLength(1);
    assertRoundTrips(chunks, rows);
});

test("respects a custom max", () => {
    const rows = dayRows("2026-08-01", 7);
    const { chunks } = chunkRows(rows, 3);
    expect(chunks.map((c) => c.length)).toEqual([3, 3, 1]);
    assertRoundTrips(chunks, rows);
});
