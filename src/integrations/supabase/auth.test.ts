import { beforeEach, describe, expect, it } from "vitest";
import {
  clearPendingAuthFlow,
  getGuestUpgradeErrorMessage,
  getGuestUpgradePendingMessage,
  getGuestUpgradeSuccessMessage,
  getPendingAuthFlow,
  readRedirectAuthError,
  type PendingAuthFlow,
} from "./auth";

const setPendingAuthFlow = (flow: PendingAuthFlow) => {
  window.sessionStorage.setItem("kanban.pending-auth-flow", JSON.stringify(flow));
};

describe("auth upgrade helpers", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState(window.history.state, "", "/");
  });

  it("reads and clears redirect auth errors from the URL", () => {
    window.history.replaceState(
      window.history.state,
      "",
      "/?error=access_denied&error_code=identity_already_exists&error_description=Already%20linked",
    );

    expect(readRedirectAuthError()).toEqual({
      error: "access_denied",
      code: "identity_already_exists",
      description: "Already linked",
    });
    expect(window.location.pathname).toBe("/");
    expect(window.location.search).toBe("");
  });

  it("returns persisted pending guest upgrade flow", () => {
    setPendingAuthFlow({
      kind: "guest-upgrade-email",
      startedAt: Date.now(),
      returnToBoard: true,
      email: "guest@example.com",
    });

    expect(getPendingAuthFlow()).toEqual({
      kind: "guest-upgrade-email",
      startedAt: expect.any(Number),
      returnToBoard: true,
      email: "guest@example.com",
    });
  });

  it("clears stale pending flows", () => {
    setPendingAuthFlow({
      kind: "guest-upgrade-google",
      startedAt: Date.now() - 1000 * 60 * 60 * 25,
      returnToBoard: true,
    });

    expect(getPendingAuthFlow()).toBeNull();
  });

  it("maps guest upgrade messages", () => {
    expect(
      getGuestUpgradePendingMessage({
        kind: "guest-upgrade-email",
        startedAt: Date.now(),
        returnToBoard: true,
      }),
    ).toBe("Check your email to finish upgrade");
    expect(
      getGuestUpgradeSuccessMessage({
        kind: "guest-upgrade-google",
        startedAt: Date.now(),
        returnToBoard: true,
      }),
    ).toBe("Google account linked");
    expect(
      getGuestUpgradeErrorMessage({ code: "identity_already_exists" }, "guest-upgrade-google"),
    ).toBe("That Google account is already linked to another account");
    expect(
      getGuestUpgradeErrorMessage({ code: "email_address_invalid" }, "guest-upgrade-email"),
    ).toBe("Enter a valid email address");
  });

  it("clears pending flow explicitly", () => {
    setPendingAuthFlow({
      kind: "guest-upgrade-google",
      startedAt: Date.now(),
      returnToBoard: true,
    });

    clearPendingAuthFlow();

    expect(getPendingAuthFlow()).toBeNull();
  });
});
