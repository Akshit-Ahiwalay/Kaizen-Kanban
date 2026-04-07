import { describe, expect, it } from "vitest";
import { formatDueDate, getDueDateState } from "./due-dates";

describe("due date helpers", () => {
  const referenceDate = new Date(2026, 3, 6, 9, 0, 0);

  it("formats stored due dates for cards", () => {
    expect(formatDueDate("2026-04-09")).toBe("Apr 9");
    expect(formatDueDate(undefined)).toBeUndefined();
  });

  it("classifies overdue, today, soon, and quiet due dates", () => {
    expect(getDueDateState(undefined, referenceDate)).toBe("none");
    expect(getDueDateState("2026-04-05", referenceDate)).toBe("overdue");
    expect(getDueDateState("2026-04-06", referenceDate)).toBe("today");
    expect(getDueDateState("2026-04-08", referenceDate)).toBe("soon");
    expect(getDueDateState("2026-04-12", referenceDate)).toBe("none");
  });

  it("treats invalid date values as quiet", () => {
    expect(getDueDateState("not-a-date", referenceDate)).toBe("none");
  });
});
