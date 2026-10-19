import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialBoardColumns } from "./data";
import { getBoardStats } from "./stats";

describe("board stats", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 7, 12));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("derives summary counts from board columns", () => {
    const columns = createInitialBoardColumns();

    expect(getBoardStats(columns)).toEqual({
      totalTasks: 8,
      doneTasks: 4,
      overdueTasks: 2,
      inProgressTasks: 2,
    });
  });
});
