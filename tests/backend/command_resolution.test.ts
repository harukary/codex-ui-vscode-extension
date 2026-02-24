import { describe, expect, it } from "vitest";

import {
  resolveBackendStartCommand,
  resolveCliCommands,
} from "../../src/backend/command_resolution";

describe("command_resolution", () => {
  it("prefers explicit codex command key", () => {
    const commands = resolveCliCommands({
      codexCommand: "codex-stable",
      upstreamCommand: "legacy-upstream",
    });
    expect(commands).toEqual({
      codex: "codex-stable",
    });
  });

  it("falls back to legacy key when new key is not set", () => {
    const commands = resolveCliCommands({
      codexCommand: undefined,
      upstreamCommand: "codex-legacy",
    });
    expect(commands).toEqual({
      codex: "codex-legacy",
    });
  });

  it("falls back to built-in defaults when no config exists", () => {
    const commands = resolveCliCommands({
      codexCommand: undefined,
      upstreamCommand: undefined,
    });
    expect(commands).toEqual({
      codex: "codex",
    });
  });

  it("always selects codex command", () => {
    const commands = { codex: "codex-stable" };
    expect(resolveBackendStartCommand("codex", commands)).toBe("codex-stable");
  });
});
