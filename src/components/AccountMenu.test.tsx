import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AccountMenu from "./AccountMenu";

describe("AccountMenu", () => {
  it("shows explicit guest upgrade actions", () => {
    render(
      <AccountMenu
        label="Guest"
        detail="Anonymous access"
        isGuest
        onUpgradeWithGoogle={vi.fn()}
        onUpgradeWithEmail={vi.fn().mockResolvedValue(true)}
        onSignOut={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /open account menu/i }));

    expect(screen.getByRole("button", { name: /upgrade with google/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /upgrade with email/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/upgrade guest account email/i)).toBeInTheDocument();
  });

  it("submits the guest email upgrade flow", async () => {
    const onUpgradeWithEmail = vi.fn().mockResolvedValue(true);

    render(
      <AccountMenu
        label="Guest"
        detail="Anonymous access"
        isGuest
        onUpgradeWithGoogle={vi.fn()}
        onUpgradeWithEmail={onUpgradeWithEmail}
        onSignOut={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /open account menu/i }));
    fireEvent.change(screen.getByLabelText(/upgrade guest account email/i), {
      target: { value: "guest@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /upgrade with email/i }));

    await waitFor(() => {
      expect(onUpgradeWithEmail).toHaveBeenCalledWith("guest@example.com");
    });
  });

  it("does not show upgrade actions for a permanent account", () => {
    render(<AccountMenu label="Morgan" detail="morgan@example.com" onSignOut={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /open account menu/i }));

    expect(screen.queryByRole("button", { name: /upgrade with google/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /upgrade with email/i })).not.toBeInTheDocument();
  });
});
