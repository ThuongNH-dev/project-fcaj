export type Currency = "VND" | "USD";

export function formatCurrency(amount: number, currency: Currency): string;
export function formatCurrency(amount: number, currency: string): string;
export function formatCurrency(amount: number, currency: string) {
  const normalizedCurrency = (currency?.toUpperCase() === "VND" ? "VND" : "USD") as Currency;
  const isVnd = normalizedCurrency === "VND";

  return new Intl.NumberFormat(isVnd ? "vi-VN" : "en-US", {
    style: "currency",
    currency: normalizedCurrency,
    minimumFractionDigits: isVnd ? 0 : 2,
    maximumFractionDigits: isVnd ? 0 : 2,
  })
    .format(amount)
    .replace(/\u00A0/g, " ");
}

export function formatDateTime(dateValue: string) {
  return new Date(dateValue).toLocaleString();
}

export function formatLocalDate(dateValue: string) {
  return new Date(dateValue).toLocaleDateString();
}

export function formatShortDate(dateValue: string) {
  return new Date(dateValue).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatFileSize(sizeInBytes: number) {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  }

  if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function toTitleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
