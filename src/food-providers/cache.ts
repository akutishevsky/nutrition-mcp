export const FOOD_CACHE_SCHEMA_VERSION = 1;

export interface FoodCacheBackend {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T): Promise<void>;
}

export interface FoodCacheEnvelope<T> {
    schemaVersion: number;
    cachedAt: string;
    expiresAt: string;
    value: T;
}

export function foodCacheKey(
    provider: string,
    operation: string,
    identity: string,
): string {
    return [
        "food",
        `v${FOOD_CACHE_SCHEMA_VERSION}`,
        provider.trim().toLowerCase(),
        operation.trim().toLowerCase(),
        identity.trim().toLowerCase(),
    ].join(":");
}

export function createCacheEnvelope<T>(
    value: T,
    ttlMs: number,
    now = new Date(),
): FoodCacheEnvelope<T> {
    if (!Number.isFinite(ttlMs) || ttlMs <= 0) {
        throw new RangeError("Food cache TTL must be positive");
    }
    return {
        schemaVersion: FOOD_CACHE_SCHEMA_VERSION,
        cachedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
        value,
    };
}

export function readCacheEnvelope<T>(
    input: unknown,
    now = new Date(),
): T | null {
    if (!input || typeof input !== "object") return null;
    const envelope = input as Partial<FoodCacheEnvelope<T>>;
    if (envelope.schemaVersion !== FOOD_CACHE_SCHEMA_VERSION) return null;
    if (typeof envelope.expiresAt !== "string") return null;
    const expiresAt = new Date(envelope.expiresAt);
    if (!Number.isFinite(expiresAt.getTime()) || expiresAt <= now) return null;
    if (!("value" in envelope)) return null;
    return envelope.value as T;
}

export async function getOrLoadCached<T>(input: {
    backend: FoodCacheBackend;
    key: string;
    ttlMs: number;
    load: () => Promise<T>;
}): Promise<T> {
    const cached = readCacheEnvelope<T>(await input.backend.get(input.key));
    if (cached !== null) return cached;
    const value = await input.load();
    await input.backend.set(
        input.key,
        createCacheEnvelope(value, input.ttlMs),
    );
    return value;
}
