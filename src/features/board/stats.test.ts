import { describe, expect, it } from "vitest";
import { createInitialBoardColumns } from "./data";
import { getBoardStats } from "./stats";

describe("board stats", () => {
  it("derives summary counts from board columns", () => {
    const columns = createInitialBoardColumns();

    expect(getBoardStats(columns)).toEqual({
      totalTasks: 8,
      doneTasks: 4,
      overdueTasks: 1,
      inProgressTasks: 2,
    });
  });
});
