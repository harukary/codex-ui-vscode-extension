import { describe, expect, it, vi } from "vitest";

import { SessionStore, type Session } from "../src/sessions";

vi.mock("vscode", () => ({
  window: {
    showQuickPick: vi.fn(),
  },
}));

function makeSession(args: {
  id: string;
  backendKey: string;
  backendId: "codex" | "opencode";
  threadId: string;
}): Session {
  return {
    id: args.id,
    backendKey: args.backendKey,
    backendId: args.backendId,
    workspaceFolderUri: "file:///workspace",
    title: `session-${args.id}`,
    threadId: args.threadId,
  };
}

describe("SessionStore.getByThreadIdAcrossBackends", () => {
  it("resolves when threadId is unique across backends", () => {
    const store = new SessionStore();
    const session = makeSession({
      id: "s1",
      backendKey: '["file:///workspace","codex"]',
      backendId: "codex",
      threadId: "thread-1",
    });
    store.add(session.backendKey, session);

    expect(store.getByThreadIdAcrossBackends("thread-1")?.id).toBe("s1");
  });

  it("returns null when same threadId exists in multiple backends", () => {
    const store = new SessionStore();
    const codexSession = makeSession({
      id: "s1",
      backendKey: '["file:///workspace","codex"]',
      backendId: "codex",
      threadId: "shared-thread",
    });
    const opencodeSession = makeSession({
      id: "s2",
      backendKey: '["file:///workspace","opencode"]',
      backendId: "opencode",
      threadId: "shared-thread",
    });
    store.add(codexSession.backendKey, codexSession);
    store.add(opencodeSession.backendKey, opencodeSession);

    expect(store.getByThreadIdAcrossBackends("shared-thread")).toBeNull();
  });
});
