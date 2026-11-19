/**
 * Helpers for merging sparse per-locale translation overlays onto the English
 * master copy objects.
 *
 * Plain objects merge recursively by key (missing or undefined keys fall back
 * to `base`); primitives and arrays replace `base` when supplied. That lets
 * English remain the single source of truth for schema and defaults while
 * translation files carry only overridden keys.
 */

export type DeepPartial<T> = T extends readonly unknown[]
    ? T
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T;

const PLURAL_KEYS = new Set(["zero", "one", "two", "few", "many", "other"]);

function isPlainObject(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Plural-form maps (`{ one?, few?, many?, other }`) vary in which CLDR keys
 * a language carries (Japanese has only `other`, Polish adds `few`/`many`).
 * When a translation supplies a plural map, replace the whole map rather than
 * leaking English's `one` into a locale that omits it.
 */
function isPluralMap(v: Record<string, unknown>): boolean {
    const keys = Object.keys(v);
    return (
        keys.length > 0 &&
        "other" in v &&
        keys.every((k) => PLURAL_KEYS.has(k) && typeof v[k] === "string")
    );
}

/**
 * Recursively merge `overlay` onto `base`, returning a new value without
 * mutating either input. Any key omitted (or `undefined`) in `overlay` falls
 * back to `base`.
 */
export function mergeCopy<T>(base: T, overlay?: DeepPartial<NoInfer<T>>): T {
    if (overlay === undefined) return base;
    if (!isPlainObject(base) || !isPlainObject(overlay)) {
        return overlay as T;
    }
    if (isPluralMap(base) && isPluralMap(overlay)) {
        return overlay as T;
    }
    const out: Record<string, unknown> = { ...base };
    for (const key of Object.keys(overlay)) {
        const val = overlay[key];
        if (val === undefined) continue;
        const baseVal = out[key];
        out[key] =
            isPlainObject(baseVal) && isPlainObject(val)
                ? mergeCopy(baseVal, val)
                : val;
    }
    return out as T;
}

/**
 * Build a `Record<L, T>` from an English master copy and a map of sparse
 * non-English overlays.
 */
export function mergeLocaleCopy<L extends string, T>(
    en: T,
    overlays: Record<Exclude<L, "en">, DeepPartial<T> | undefined>,
): Record<L, T> {
    const out = { en } as Record<L, T>;
    for (const locale of Object.keys(overlays) as Exclude<L, "en">[]) {
        out[locale] = mergeCopy(en, overlays[locale]);
    }
    return out;
}

/**
 * Return the minimal `DeepPartial<T>` diff from `base` to `target`, omitting
 * any key or sub-object deeply equal to `base`. Used to keep translation
 * files free of untranslated/duplicated English values.
 */
export function diffCopy<T>(base: T, target: T): DeepPartial<T> | undefined {
    if (Object.is(base, target)) return undefined;
    if (Array.isArray(base) && Array.isArray(target)) {
        if (
            base.length === target.length &&
            base.every((v, i) => diffCopy(v, target[i]) === undefined)
        ) {
            return undefined;
        }
        return target as DeepPartial<T>;
    }
    if (!isPlainObject(base) || !isPlainObject(target)) {
        return target as DeepPartial<T>;
    }
    if (isPluralMap(base) && isPluralMap(target)) {
        const same =
            Object.keys(base).length === Object.keys(target).length &&
            Object.keys(target).every((k) => base[k] === target[k]);
        return same ? undefined : (target as DeepPartial<T>);
    }
    const out: Record<string, unknown> = {};
    let hasDiff = false;
    for (const key of Object.keys(target)) {
        const d = diffCopy(base[key], target[key]);
        if (d !== undefined) {
            out[key] = d;
            hasDiff = true;
        }
    }
    return hasDiff ? (out as DeepPartial<T>) : undefined;
}
