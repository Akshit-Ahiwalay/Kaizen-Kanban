import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  it("creates a member, assigns a task, and filters by assignee", async () => {
    render(createElement(Index));

    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("button", { name: /manage team members/i }));

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Mina" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add member/i }));

    expect(await screen.findByText("Mina")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^close$/i }));
    fireEvent.click(screen.getByRole("button", { name: /open task design landing page/i }));
    const assigneeSelect = screen.getByLabelText("Assignee") as HTMLSelectElement;
    const minaOption = Array.from(assigneeSelect.options).find((option) => option.text === "Mina");

    expect(minaOption?.value).toBeTruthy();

    fireEvent.change(assigneeSelect, {
      target: { value: minaOption?.value },
    });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(await screen.findByLabelText("Assignee Mina")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /toggle search and filters/i }));
    fireEvent.change(screen.getByLabelText("Filter by assignee"), {
      target: { value: minaOption?.value },
    });

    expect(screen.getByText("Design landing page")).toBeInTheDocument();
    expect(screen.queryByText("Database setup")).not.toBeInTheDocument();
  });

  it("opens a task and saves edited details", async () => {
    render(createElement(Index));

    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("button", { name: /open task design landing page/i }));

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Design landing page v2" },
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "Bring task editing into the flow." },
    });
    fireEvent.change(screen.getByLabelText("Priority"), {
      target: { value: "normal" },
    });
    fireEvent.change(screen.getByLabelText("Status"), {
      target: { value: "in-review" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(await screen.findByText("Design landing page v2")).toBeInTheDocument();
    expect(screen.queryByText("Design landing page")).not.toBeInTheDocument();
  });

  it("deletes a task from the detail dialog after confirmation", async () => {
    render(createElement(Index));

    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("button", { name: /open task design landing page/i }));

    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirm delete/i }));

    await waitFor(() => {
      expect(screen.queryByText("Edit Task")).not.toBeInTheDocument();
      expect(screen.queryByText("Design landing page")).not.toBeInTheDocument();
    });
  });
});
