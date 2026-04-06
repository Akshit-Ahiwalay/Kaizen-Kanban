import { describe, expect, it } from "vitest";
import { createInitialBoardColumns } from "./data";
import { moveTask } from "./mutations";

describe("board mutations", () => {
  it("moves a task into a target column at the top by default", () => {
    const columns = createInitialBoardColumns();

    const result = moveTask(columns, {
      taskId: "1",
      targetColumnId: "in-progress",
    });

    expect(result.find((column) => column.id === "todo")?.cards.map((card) => card.id)).toEqual([
      "2",
      "3",
    ]);
    expect(
      result.find((column) => column.id === "in-progress")?.cards.map((card) => card.id),
    ).toEqual(["1", "4", "5"]);
  });

  it("moves a task into a target column at the requested index", () => {
    const columns = createInitialBoardColumns();

    const result = moveTask(columns, {
      taskId: "1",
      targetColumnId: "in-progress",
      targetIndex: 1,
    });

    expect(
      result.find((column) => column.id === "in-progress")?.cards.map((card) => card.id),
    ).toEqual(["4", "1", "5"]);
  });

  it("returns the original columns for safe no-op cases", () => {
    const columns = createInitialBoardColumns();

    expect(
      moveTask(columns, {
        taskId: "missing-task",
        targetColumnId: "done",
      }),
    ).toBe(columns);

    expect(
      moveTask(columns, {
        taskId: "1",
        targetColumnId: "missing-column",
      }),
    ).toBe(columns);

    expect(
      moveTask(columns, {
        taskId: "1",
        targetColumnId: "todo",
      }),
    ).toBe(columns);
  });
});
