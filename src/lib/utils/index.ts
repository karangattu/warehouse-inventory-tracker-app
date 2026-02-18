import { ulid } from "ulid";

export function generateId(): string {
  return ulid();
}

export function generateIdempotencyKey(
  userId: string,
  productId: string
): string {
  return `${userId}:${productId}:${Date.now()}`;
}

export function generateSkuCode(
  category: string,
  color: string,
  size: string,
  unit: string
): string {
  const abbr = (s: string, len: number = 3) =>
    s
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .split(" ")
      .map((w) => w.slice(0, len).toUpperCase())
      .join("");

  const parts = [
    abbr(category, 3).slice(0, 4),
    abbr(color, 3).slice(0, 3),
    size.replace(/\s+/g, "").toUpperCase().slice(0, 6),
    abbr(unit, 3).slice(0, 4),
  ];

  return parts.join("-");
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatQuantity(qty: number): string {
  return Number.isInteger(qty) ? qty.toString() : qty.toFixed(2);
}

/**
 * Normalize a size label to prevent near-duplicate entries.
 * - Trims whitespace
 * - Collapses multiple spaces to one
 * - Ensures a space between a number and a unit suffix (e.g. "9mm" → "9 mm", "25mm" → "25 mm")
 */
export function normalizeSizeLabel(raw: string): string {
  let s = raw.trim().replace(/\s+/g, " ");
  // Ensure a space between number and unit (e.g. "9mm" → "9 mm", "1.5m" → "1.5 m")
  s = s.replace(/(\d)(mm|cm|m|in|ft|kg|g|lb|oz)\b/gi, "$1 $2");
  return s;
}

/**
 * Check if two size labels are effectively the same after normalization.
 */
export function sizeLabelMatches(a: string, b: string): boolean {
  return normalizeSizeLabel(a).toLowerCase() === normalizeSizeLabel(b).toLowerCase();
}

export function formatUserDisplayName(name: string): string {
  return name.trim().toLowerCase() === "operator" ? "Madam" : name;
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
