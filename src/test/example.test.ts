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

  it("creates a new task in the To Do column", () => {
    render(createElement(Index));

    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("button", { name: /new task/i }));

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Refine card creation flow" },
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "Keep the current aesthetic intact." },
    });
    fireEvent.change(screen.getByLabelText("Priority"), {
      target: { value: "high" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add to do/i }));

    expect(screen.getByText("Refine card creation flow")).toBeInTheDocument();
  });

  it("filters visible tasks by title, priority, and status", () => {
    render(createElement(Index));

    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("button", { name: /toggle search and filters/i }));

    fireEvent.change(screen.getByLabelText("Search task titles"), {
      target: { value: "documentation" },
    });

    expect(screen.getByText("Write documentation")).toBeInTheDocument();
    expect(screen.queryByText("Design landing page")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Filter by priority"), {
      target: { value: "high" },
    });
    fireEvent.change(screen.getByLabelText("Filter by status"), {
      target: { value: "in-review" },
    });

    expect(screen.getByText("Write documentation")).toBeInTheDocument();
    expect(screen.queryByText("Content summary")).not.toBeInTheDocument();
  });
});
