import { describe, expect, it } from "vitest";
import {
  formatCurrency,
  formatFileSize,
  formatShortDate,
  toTitleCase,
} from "./formatters";

describe("shared formatters", () => {
  it("formats currency with a fallback currency", () => {
    expect(formatCurrency(12.5, "USD")).toBe("$12.50");
    expect(formatCurrency(7, "")).toBe("$7.00");
  });

  it("formats short dates in a stable en-US style", () => {
    expect(formatShortDate("2026-06-15T00:00:00.000Z")).toBe("Jun 15, 2026");
  });

  it("formats file sizes for bytes, kilobytes, and megabytes", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(2 * 1024 * 1024)).toBe("2.0 MB");
  });

  it("normalizes category-like strings into title case", () => {
    expect(toTitleCase("team_dinner")).toBe("Team Dinner");
    expect(toTitleCase("late-night snacks")).toBe("Late Night Snacks");
  });
});
