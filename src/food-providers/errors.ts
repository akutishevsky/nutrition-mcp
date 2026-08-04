export type FoodProviderErrorCode =
    | "invalid_request"
    | "not_found"
    | "rate_limited"
    | "provider_unavailable"
    | "invalid_provider_response"
    | "configuration_missing";

export class FoodProviderError extends Error {
    readonly code: FoodProviderErrorCode;
    readonly provider?: string;
    readonly retryAfterSeconds?: number;

    constructor(
        code: FoodProviderErrorCode,
        message: string,
        options: {
            provider?: string;
            retryAfterSeconds?: number;
            cause?: unknown;
        } = {},
    ) {
        super(message, { cause: options.cause });
        this.name = "FoodProviderError";
        this.code = code;
        this.provider = options.provider;
        this.retryAfterSeconds = options.retryAfterSeconds;
    }
}

export function asFoodProviderError(
    error: unknown,
    provider?: string,
): FoodProviderError {
    if (error instanceof FoodProviderError) {
        if (error.provider || !provider) return error;
        return new FoodProviderError(error.code, error.message, {
            provider,
            retryAfterSeconds: error.retryAfterSeconds,
            cause: error.cause,
        });
    }
    return new FoodProviderError(
        "provider_unavailable",
        error instanceof Error ? error.message : "Food provider request failed",
        { provider, cause: error },
    );
}
