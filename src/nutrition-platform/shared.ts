import { createHash } from "node:crypto";

export function deriveIdempotencyKey(
    parts: Array<string | number | null | undefined>,
): string {
    const digest = createHash("sha256")
        .update(parts.map((part) => part ?? "").join("\u0000"), "utf8")
        .digest("hex");
    return `auto:${digest}`;
}

export function isoTimestamp(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value);
    if (!Number.isFinite(date.getTime())) {
        throw new Error("Database returned an invalid timestamp");
    }
    return date.toISOString();
}

export function nullableNumber(value: unknown): number | null {
    if (value == null) return null;
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(parsed)) {
        throw new Error("Database returned an invalid numeric value");
    }
    return parsed;
}

export function requiredNumber(value: unknown): number {
    const parsed = nullableNumber(value);
    if (parsed == null) {
        throw new Error("Database returned a missing numeric value");
    }
    return parsed;
}

export function stringOrNull(value: unknown): string | null {
    return value == null ? null : String(value);
}

export function booleanValue(value: unknown, fallback: boolean): boolean {
    return typeof value === "boolean" ? value : fallback;
}
