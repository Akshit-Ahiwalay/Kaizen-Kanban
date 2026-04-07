import { describe, expect, it } from "vitest";
import { createInitialBoardColumns } from "./data";
import { attachAssigneesToColumns } from "./assignees";
import {
  ALL_ASSIGNEES_FILTER,
  DEFAULT_BOARD_FILTERS,
  UNASSIGNED_ASSIGNEE_FILTER,
  filterBoardColumns,
  hasActiveBoardFilters,
} from "./filters";
import { createInitialTeamMembers } from "@/features/team/data";

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

  it("filters cards by assignee", () => {
    const columns = attachAssigneesToColumns(
      createInitialBoardColumns(),
      createInitialTeamMembers(),
    );

    const assignedResult = filterBoardColumns(columns, {
      ...DEFAULT_BOARD_FILTERS,
      assigneeId: "tm-2",
    });

    expect(assignedResult.flatMap((column) => column.cards).map((card) => card.id)).toEqual([
      "2",
      "4",
    ]);

    const unassignedResult = filterBoardColumns(columns, {
      ...DEFAULT_BOARD_FILTERS,
      assigneeId: UNASSIGNED_ASSIGNEE_FILTER,
    });

    expect(unassignedResult.flatMap((column) => column.cards).every((card) => !card.assigneeId)).toBe(true);
  });

  it("tracks whether any board filter is active", () => {
    expect(hasActiveBoardFilters(DEFAULT_BOARD_FILTERS)).toBe(false);
    expect(
      hasActiveBoardFilters({
        ...DEFAULT_BOARD_FILTERS,
        priority: "low",
      }),
    ).toBe(true);
    expect(
      hasActiveBoardFilters({
        ...DEFAULT_BOARD_FILTERS,
        assigneeId: ALL_ASSIGNEES_FILTER,
      }),
    ).toBe(false);
    expect(
      hasActiveBoardFilters({
        ...DEFAULT_BOARD_FILTERS,
        assigneeId: "tm-1",
      }),
    ).toBe(true);
  });
});
