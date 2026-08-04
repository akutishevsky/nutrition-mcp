// Row chunking for the bulk-import widget's per-call requests.
//
// Lives here rather than hand-written inline in the widget template so the
// boundary logic that decides which rows land in which server call is
// actually unit-tested. It used to be inline-only, untested JS, and the
// inline version had a real bug (issue #65): it only closed a chunk when the
// calendar date changed, so a run of same-date rows straddling `max` kept
// growing past it — the server hard-rejects anything over MAX_ROWS_PER_CALL
// (src/import.ts), so those oversized chunks always failed. The widget
// inlines this file's compiled output via @inlinets (src/widgets.ts).

export interface ChunkedRows<T> {
    /** Each chunk has at most `max` rows, in the caller's original order. */
    chunks: T[][];
    /**
     * Calendar dates (YYYY-MM-DD, read from `logged_at`) that alone had more
     * rows than `max` and therefore had to be split across more than one
     * call. `max` rows-per-call and "never split a date" cannot both hold
     * for such a date, and the cap is the one the server actually enforces,
     * so it wins — but splitting loosens the per-call dedup guarantee for
     * that date: two byte-identical rows land in different calls, each the
     * only occurrence of its content in its own call, so both independently
     * compute occurrence-ordinal 0 and produce the SAME idempotency key
     * (`import:<digest>:0`, see rowContentDigest in src/import.ts) — the
     * second call's copy then dedupes against the first as if it were a
     * re-import, instead of writing a second row. Callers should warn the
     * user when this list is non-empty.
     */
    splitDates: string[];
}

/**
 * Split `rows` into calls of at most `max` rows each, keeping every calendar
 * date together in one call whenever that fits within `max`. `rows` is
 * assumed to already be in date order (the widget's parsed rows are, and
 * splitting only groups RUNS of consecutive same-date rows — it does not
 * reorder rows to merge non-adjacent same-date runs).
 */
export function chunkRows<T extends { logged_at: unknown }>(
    rows: T[],
    max: number,
): ChunkedRows<T> {
    const dayOf = (r: T) => String(r.logged_at).slice(0, 10);
    const chunks: T[][] = [];
    const splitDates: string[] = [];
    let cur: T[] = [];
    let i = 0;

    while (i < rows.length) {
        const day = dayOf(rows[i]!);
        let j = i;
        while (j < rows.length && dayOf(rows[j]!) === day) j++;
        const run = rows.slice(i, j);
        i = j;

        if (run.length > max) {
            // This date alone exceeds the cap: split it, closing whatever
            // chunk was already open so the split pieces start on a clean
            // boundary.
            if (cur.length) {
                chunks.push(cur);
                cur = [];
            }
            splitDates.push(day);
            for (let k = 0; k < run.length; k += max) {
                chunks.push(run.slice(k, k + max));
            }
            continue;
        }

        if (cur.length + run.length > max) {
            chunks.push(cur);
            cur = [];
        }
        cur.push(...run);
    }
    if (cur.length) chunks.push(cur);
    return { chunks, splitDates };
}
