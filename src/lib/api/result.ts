/**
 * Result<T, E> — a discriminated union for "operation succeeded with T, or failed with E."
 *
 * Pattern borrowed from Rust, Swift, and most functional languages. Used here so
 * API functions return failure as data rather than thrown exceptions. Forces the
 * caller to handle both branches explicitly. No silent crashes, no surprise throws.
 *
 * USAGE:
 *   const r = await fetchProducts();
 *   if (!r.ok) {
 *     // r.error is fully typed
 *     return showErrorToast(r.error.message);
 *   }
 *   // r.value is fully typed and definitely present
 *   return r.value;
 */

export type Result<T, E = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

/**
 * Standard error shape for all sandbox API/network/validation failures.
 * The `code` field lets callers branch on specific error categories without
 * matching on stringified messages.
 */
export interface AppError {
  code:
    | "network_error"
    | "shopify_error"
    | "validation_error"
    | "not_found"
    | "unknown_error";
  message: string;
  // Original error object for debugging, never displayed to users.
  cause?: unknown;
}

export function appError(
  code: AppError["code"],
  message: string,
  cause?: unknown,
): AppError {
  return { code, message, cause };
}
