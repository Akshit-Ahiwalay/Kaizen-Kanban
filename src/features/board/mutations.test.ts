import { describe, expect, it } from "vitest";
import { createInitialBoardColumns } from "./data";
import { deleteTask, moveTask, updateTask } from "./mutations";

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

  it("reorders a task within the same column", () => {
    const columns = createInitialBoardColumns();

    const result = moveTask(columns, {
      taskId: "1",
      targetColumnId: "todo",
      targetIndex: 1,
    });

    expect(result.find((column) => column.id === "todo")?.cards.map((card) => card.id)).toEqual([
      "2",
      "1",
      "3",
    ]);
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

    expect(
      moveTask(columns, {
        taskId: "1",
        targetColumnId: "todo",
        targetIndex: 0,
      }),
    ).toBe(columns);
  });

  it("updates task details within the same column", () => {
    const columns = createInitialBoardColumns();

    const result = updateTask(columns, {
      taskId: "3",
      title: "Project scope approved",
      description: "Final signoff received.",
      priority: "normal",
      dueDate: "2026-04-09",
      status: "todo",
      assigneeId: "tm-1",
      assignee: { id: "tm-1", name: "Aki", color: "#58644b" },
    });

    const updatedCard = result
      .find((column) => column.id === "todo")
      ?.cards.find((card) => card.id === "3");

    expect(updatedCard).toMatchObject({
      title: "Project scope approved",
      description: "Final signoff received.",
      priority: "normal",
      dueDateValue: "2026-04-09",
      dueDate: "Apr 9",
      done: false,
      assigneeId: "tm-1",
      assignee: { id: "tm-1", name: "Aki", color: "#58644b" },
    });
  });

  it("moves a task when its edited status changes", () => {
    const columns = createInitialBoardColumns();

    const result = updateTask(columns, {
      taskId: "4",
      title: "Content summary refined",
      description: undefined,
      priority: "high",
      dueDate: "2026-04-07",
      status: "done",
    });

    expect(result.find((column) => column.id === "in-progress")?.cards.map((card) => card.id)).toEqual([
      "5",
    ]);

    const movedCard = result.find((column) => column.id === "done")?.cards[0];

    expect(movedCard).toMatchObject({
      id: "4",
      title: "Content summary refined",
      priority: "high",
      dueDateValue: "2026-04-07",
      dueDate: "Apr 7",
      done: true,
    });
  });

  it("deletes a task from its source column", () => {
    const columns = createInitialBoardColumns();

    const result = deleteTask(columns, "4");

    expect(result.find((column) => column.id === "in-progress")?.cards.map((card) => card.id)).toEqual([
      "5",
    ]);
    expect(result.flatMap((column) => column.cards).some((card) => card.id === "4")).toBe(false);
  });
});
