const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const MIN_INTERVAL_MS = 60_000;

interface CoinGeckoSimplePriceResponse {
  bitcoin: { usd: number };
}

let lastRequestTime = 0;

export class CoinGeckoError extends Error {
  constructor(
    message: string,
    public readonly code: "TIMEOUT" | "RATE_LIMITED" | "API_ERROR" | "NETWORK",
  ) {
    super(message);
    this.name = "CoinGeckoError";
  }
}

function enforceRateLimit(): void {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_INTERVAL_MS) {
    throw new CoinGeckoError(
      `Rate limited. Try again in ${Math.ceil((MIN_INTERVAL_MS - elapsed) / 1000)}s.`,
      "RATE_LIMITED",
    );
  }
  lastRequestTime = now;
}

export async function fetchBtcPrice(): Promise<number> {
  enforceRateLimit();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const url = `${COINGECKO_BASE}/simple/price?ids=bitcoin&vs_currencies=usd`;
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new CoinGeckoError(
        `CoinGecko API returned ${response.status}`,
        "API_ERROR",
      );
    }

    const data = (await response.json()) as CoinGeckoSimplePriceResponse;

    if (!data?.bitcoin?.usd) {
      throw new CoinGeckoError(
        "Unexpected response format from CoinGecko",
        "API_ERROR",
      );
    }

    return data.bitcoin.usd;
  } catch (err) {
    if (err instanceof CoinGeckoError) throw err;

    if (err instanceof DOMException && err.name === "AbortError") {
      throw new CoinGeckoError(
        "CoinGecko request timed out after 10s",
        "TIMEOUT",
      );
    }

    throw new CoinGeckoError(
      `Network error: ${err instanceof Error ? err.message : String(err)}`,
      "NETWORK",
    );
  } finally {
    clearTimeout(timeout);
  }
}

export function formatBtcPrice(price: number): string {
  return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}