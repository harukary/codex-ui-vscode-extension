import { describe, expect, it } from "vitest";

import {
  decideLoadHistoryPostHydrationAction,
  decideSessionSelection,
  shouldForceLoadHistoryForRewind,
} from "../../src/commands/session_selection";

describe("session_selection", () => {
  it("decides alreadyLoaded when conversation blocks exist", () => {
    expect(decideSessionSelection(true)).toBe("alreadyLoaded");
  });

  it("decides loadHistory when conversation blocks are missing", () => {
    expect(decideSessionSelection(false)).toBe("loadHistory");
  });

  it("refreshes when loadHistory target is already active", () => {
    expect(
      decideLoadHistoryPostHydrationAction({
        activeSessionId: "s1",
        targetSessionId: "s1",
      }),
    ).toBe("refresh");
  });

  it("activates when loadHistory target differs from active session", () => {
    expect(
      decideLoadHistoryPostHydrationAction({
        activeSessionId: "s1",
        targetSessionId: "s2",
      }),
    ).toBe("activate");
  });

  it("activates when no active session exists", () => {
    expect(
      decideLoadHistoryPostHydrationAction({
        activeSessionId: null,
        targetSessionId: "s2",
      }),
    ).toBe("activate");
  });

  it("forces load history for codex/opencode when user blocks miss turnId", () => {
    expect(
      shouldForceLoadHistoryForRewind({
        backendId: "codex",
        hasUserBlockWithoutTurnId: true,
      }),
    ).toBe(true);
    expect(
      shouldForceLoadHistoryForRewind({
        backendId: "opencode",
        hasUserBlockWithoutTurnId: true,
      }),
    ).toBe(true);
  });

  it("does not force load history when turnId exists", () => {
    expect(
      shouldForceLoadHistoryForRewind({
        backendId: "codex",
        hasUserBlockWithoutTurnId: false,
      }),
    ).toBe(false);
    expect(
      shouldForceLoadHistoryForRewind({
        backendId: "opencode",
        hasUserBlockWithoutTurnId: false,
      }),
    ).toBe(false);
  });
});
