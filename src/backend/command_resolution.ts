import type { BackendId } from "../sessions";

export type CliCommandConfig = {
  codexCommand: string | undefined;
  upstreamCommand: string | undefined;
};

export type ResolvedCliCommands = {
  codex: string;
};

export function resolveCliCommands(cfg: CliCommandConfig): ResolvedCliCommands {
  return {
    codex: cfg.codexCommand ?? cfg.upstreamCommand ?? "codex",
  };
}

export function resolveBackendStartCommand(
  backendId: Exclude<BackendId, "opencode">,
  commands: ResolvedCliCommands,
): string {
  void backendId;
  return commands.codex;
}
