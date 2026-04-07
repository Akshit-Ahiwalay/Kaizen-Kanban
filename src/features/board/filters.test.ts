import { describe, expect, it } from "vitest";
import { createInitialBoardColumns } from "./data";
import {
  DEFAULT_BOARD_FILTERS,
  filterBoardColumns,
  hasActiveBoardFilters,
} from "./filters";

describe("board filters", () => {
  it("filters cards by title search", () => {
    const columns = createInitialBoardColumns();

    const result = filterBoardColumns(columns, {
      ...DEFAULT_BOARD_FILTERS,
      search: "design",
    });

    expect(result.find((column) => column.id === "todo")?.cards.map((card) => card.id)).toEqual([
      "1",
    ]);
    expect(
      result.flatMap((column) => column.cards).every((card) =>
        card.title.toLowerCase().includes("design"),
      ),
    ).toBe(true);
  });

  it("filters cards by priority and status without mutating board shape", () => {
    const columns = createInitialBoardColumns();

    const result = filterBoardColumns(columns, {
      ...DEFAULT_BOARD_FILTERS,
      priority: "high",
      status: "in-review",
    });

    expect(result.map((column) => column.id)).toEqual(columns.map((column) => column.id));
    expect(
      result.find((column) => column.id === "in-review")?.cards.map((card) => card.id),
    ).toEqual(["6"]);
    expect(result.find((column) => column.id === "todo")?.cards).toEqual([]);
  });

  it("tracks whether any board filter is active", () => {
    expect(hasActiveBoardFilters(DEFAULT_BOARD_FILTERS)).toBe(false);
    expect(
      hasActiveBoardFilters({
        ...DEFAULT_BOARD_FILTERS,
        priority: "low",
      }),
    ).toBe(true);
  });
});
