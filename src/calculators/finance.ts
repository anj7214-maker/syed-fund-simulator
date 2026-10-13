export const ENGINE_VERSION = "pull-1.0";
export type CashFlow = { date: string; cents: number };
export type MathStep = { date: string; label: string; formula: string; lp: number; gp: number; remaining: number };
const LIMIT = 100_000_000_000_000;
export function amount(n: number) {
  if (!Number.isSafeInteger(n) || Math.abs(n) > LIMIT) throw new Error("Amounts must be whole cents within the supported range.");
  return n;
}
export function parseMoney(value: string) {
  if (!/^-?\d{1,12}(\.\d{0,2})?$/.test(value)) throw new Error("Use a monetary value with at most two decimal places.");
  const negative = value.startsWith("-");
  const [whole, decimal = ""] = value.replace("-", "").split(".");
  return amount(Number(BigInt(whole) * 100n + BigInt(decimal.padEnd(2, "0"))) * (negative ? -1 : 1));
}
export function parsePercent(value: string) { return parseMoney(value); }
export function ratio(n: number, numerator: number, denominator = 10000) {
  amount(n);
  if (!Number.isSafeInteger(numerator) || !Number.isSafeInteger(denominator) || denominator <= 0) throw new Error("Invalid financial ratio.");
  return divide(BigInt(n) * BigInt(numerator), BigInt(denominator));
}
export function divide(n: bigint, d: bigint) {
  if (d <= 0n) throw new Error("Invalid denominator.");
  const sign = n < 0n ? -1 : 1;
  const v = n < 0n ? -n : n;
  return amount(Number((v + d / 2n) / d) * sign);
}
export function accrual(capital: number, bps: number, dayCount: number) {
  return divide(BigInt(amount(capital)) * BigInt(bps) * BigInt(dayCount), 3650000n);
}
export function day(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Use a valid ISO date.");
  const t = Date.parse(date + "T00:00:00Z");
  if (!Number.isFinite(t) || new Date(t).toISOString().slice(0, 10) !== date || date < "1900-01-01" || date > "2100-12-31") throw new Error("Date is invalid or outside 1900-2100.");
  return t / 86400000;
}
export const days = (start: string, end: string) => day(end) - day(start);
export const total = (values: number[]) => values.reduce((a, b) => amount(a + amount(b)), 0);
export const usd = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount(cents) / 100);
export const percent = (value: number | null) => value === null ? "Not defined" : `${(value * 100).toFixed(2)}%`;
export function rate(bps: number, min = 0, max = 10000) {
  if (!Number.isInteger(bps) || bps < min || bps > max) throw new Error(`Rate must be between ${(min / 100).toFixed(2)}% and ${(max / 100).toFixed(2)}%.`);
}
// These models permit one initial outflow and nonnegative subsequent distributions.
// Reject non-conventional series rather than selecting an arbitrary IRR root.
export function xirr(flows: CashFlow[]): number | null {
  if (flows.length < 2) return null;
  const sorted = [...flows].sort((a, b) => day(a.date) - day(b.date));
  if (sorted[0].cents >= 0 || sorted.slice(1).some(f => f.cents < 0) || !sorted.some(f => f.cents > 0)) return null;
  const base = day(sorted[0].date);
  if (sorted.some(f => !Number.isSafeInteger(f.cents)) || day(sorted.at(-1)!.date) <= base) return null;
  const npv = (r: number) => sorted.reduce((v, f) => v + f.cents / Math.pow(1 + r, (day(f.date) - base) / 365), 0);
  let low = -0.999999, high = 1;
  while (npv(high) > 0 && high < 1000000) high *= 2;
  if (npv(low) < 0 || npv(high) > 0) return null;
  for (let i = 0; i < 160; i++) {
    const middle = (low + high) / 2;
    if (npv(middle) > 0) low = middle; else high = middle;
  }
  const result = (low + high) / 2;
  return Number.isFinite(result) && Math.abs(npv(result)) <= 1 ? result : null;
}
export function paymentToTarget(flows: CashFlow[], date: string, targetBps: number) {
  const future = flows.reduce((sum, f) => sum + f.cents * Math.pow(1 + targetBps / 10000, days(f.date, date) / 365), 0);
  // Fractional-year IRR uses numerical exponentiation; settle once to a cent.
  return amount(Math.min(LIMIT, Math.max(0, Math.ceil(-future - 1e-7))));
}
