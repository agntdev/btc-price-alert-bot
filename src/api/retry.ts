export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  onRetry?: (attempt: number, error: unknown) => void;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 3;
  const baseDelayMs = options?.baseDelayMs ?? 1_000;
  const maxDelayMs = options?.maxDelayMs ?? 30_000;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries) throw err;
      const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
      options?.onRetry?.(attempt + 1, err);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("unreachable");
}

export interface CooldownState {
  consecutiveFailures: number;
  baseIntervalMs: number;
  currentIntervalMs: number;
  maxIntervalMs: number;
  backoffMultiplier: number;
}

export function createCooldownState(
  baseIntervalMs: number,
  maxIntervalMs: number,
  backoffMultiplier = 2,
): CooldownState {
  return {
    consecutiveFailures: 0,
    baseIntervalMs,
    currentIntervalMs: baseIntervalMs,
    maxIntervalMs,
    backoffMultiplier,
  };
}

export function recordSuccess(state: CooldownState): void {
  state.consecutiveFailures = 0;
  state.currentIntervalMs = state.baseIntervalMs;
}

export function recordFailure(state: CooldownState): number {
  state.consecutiveFailures++;
  state.currentIntervalMs = Math.min(
    state.baseIntervalMs *
      Math.pow(state.backoffMultiplier, state.consecutiveFailures),
    state.maxIntervalMs,
  );
  return state.currentIntervalMs;
}