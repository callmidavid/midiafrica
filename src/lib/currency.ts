// Currency: NGN primary, USD secondary. Bachs wants decimal strings e.g. "75000.00".
export const DEFAULT_FX_RATE = 1500; // 1 USD = 1500 NGN (editable in Admin > Settings)

export type Currency = "NGN" | "USD";

export function ngnToUsd(ngn: number, fx = DEFAULT_FX_RATE): number {
  return Math.round((ngn / fx) * 100) / 100;
}

export function usdToNgn(usd: number, fx = DEFAULT_FX_RATE): number {
  return Math.round(usd * fx);
}

/** "75000.00" — Bachs decimal-string format, never minor units. */
export function toDecimalString(amount: number): string {
  return amount.toFixed(2);
}

export function formatPrice(amountNGN: number, currency: Currency, fx = DEFAULT_FX_RATE): string {
  if (currency === "USD") {
    const usd = ngnToUsd(amountNGN, fx);
    return `$${usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `₦${Math.round(amountNGN).toLocaleString("en-NG")}`;
}
