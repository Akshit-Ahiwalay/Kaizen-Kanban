import { fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import Index from "@/pages/Index";

describe("Index page", () => {
  it("reveals the board after entering", () => {
    render(createElement(Index));

    expect(screen.queryByText("To Do")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByText("To Do")).toBeInTheDocument();
  });
});
