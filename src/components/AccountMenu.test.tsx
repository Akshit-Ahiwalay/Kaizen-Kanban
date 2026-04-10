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

  it("shows workspace controls for a permanent owner", () => {
    render(
      <AccountMenu
        label="Morgan"
        detail="morgan@example.com"
        activeWorkspaceId="ws-1"
        activeWorkspaceLabel="Product council"
        activeWorkspaceDetail="Shared workspace you own | 2 members"
        isActiveSharedWorkspace
        workspaces={[
          {
            label: "Personal",
            options: [
              {
                id: "ws-1",
                label: "Personal workspace",
                description: "Private to you",
                isShared: false,
                isOwnedByCurrentUser: true,
              },
            ],
          },
          {
            label: "Shared by you",
            options: [
              {
                id: "ws-2",
                label: "Product council",
                description: "Shared workspace you own",
                isShared: true,
                isOwnedByCurrentUser: true,
              },
            ],
          },
        ]}
        workspaceMembers={[
          {
            id: "user-1",
            label: "Morgan",
            detail: "morgan@example.com",
            isOwner: true,
            isCurrentUser: true,
          },
          {
            id: "user-2",
            label: "Taylor",
            detail: "taylor@example.com",
          },
        ]}
        canManageWorkspaceInvites
        pendingInvitations={[{ id: "invite-1", invitedEmail: "teammate@example.com" }]}
        onCreateSharedWorkspace={vi.fn().mockResolvedValue(true)}
        onSelectWorkspace={vi.fn()}
        onCreateWorkspaceInvitation={vi.fn().mockResolvedValue("https://example.com/?invite=test")}
        onRevokeWorkspaceInvitation={vi.fn()}
        onSignOut={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /open account menu/i }));

    expect(screen.getByLabelText(/select workspace/i)).toBeInTheDocument();
    expect(screen.getByText(/shared workspace you own/i)).toBeInTheDocument();
    expect(screen.getByText("Taylor")).toBeInTheDocument();
    expect(screen.getByLabelText(/invite collaborator email/i)).toBeInTheDocument();
    expect(screen.getByText("teammate@example.com")).toBeInTheDocument();
  });

  it("allows creating a shared workspace from the account menu", async () => {
    const onCreateSharedWorkspace = vi.fn().mockResolvedValue(true);

    render(
      <AccountMenu
        label="Morgan"
        detail="morgan@example.com"
        activeWorkspaceId="ws-1"
        workspaces={[
          {
            label: "Personal",
            options: [
              {
                id: "ws-1",
                label: "Personal workspace",
                description: "Private to you",
                isShared: false,
                isOwnedByCurrentUser: true,
              },
            ],
          },
        ]}
        onCreateSharedWorkspace={onCreateSharedWorkspace}
        onSignOut={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /open account menu/i }));
    fireEvent.click(screen.getByRole("button", { name: /create shared/i }));
    fireEvent.change(screen.getByLabelText(/shared workspace name/i), {
      target: { value: "Launch room" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create shared workspace/i }));

    await waitFor(() => {
      expect(onCreateSharedWorkspace).toHaveBeenCalledWith("Launch room");
    });
  });

  it("hides invite controls for shared workspaces the user does not own", () => {
    render(
      <AccountMenu
        label="Morgan"
        detail="morgan@example.com"
        activeWorkspaceId="ws-2"
        activeWorkspaceLabel="Partner workspace"
        activeWorkspaceDetail="Shared workspace | 3 members"
        isActiveSharedWorkspace
        workspaces={[
          {
            label: "Shared with you",
            options: [
              {
                id: "ws-2",
                label: "Partner workspace",
                description: "Shared workspace",
                isShared: true,
                isOwnedByCurrentUser: false,
              },
            ],
          },
        ]}
        workspaceMembers={[
          {
            id: "user-1",
            label: "Morgan",
            detail: "morgan@example.com",
            isCurrentUser: true,
          },
        ]}
        onCreateSharedWorkspace={vi.fn().mockResolvedValue(true)}
        onSignOut={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /open account menu/i }));

    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.queryByLabelText(/invite collaborator email/i)).not.toBeInTheDocument();
  });
});
