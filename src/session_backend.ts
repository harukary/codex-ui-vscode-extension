export type SessionBackendId = "codex" | "opencode";

export function isSessionBackendId(value: string): value is SessionBackendId {
  return value === "codex" || value === "opencode";
}

export function isCodexFamilyBackend(
  value: string,
): value is "codex" {
  return value === "codex";
}

export function canReopenSessionInBackend(
  from: SessionBackendId,
  to: SessionBackendId,
): boolean {
  if (from === to) {
    return true;
  }
  return isCodexFamilyBackend(from) && isCodexFamilyBackend(to);
}

export function sessionCompatibilityMessage(backend: SessionBackendId): string {
  if (backend === "opencode") {
    return "opencode history is not compatible with codex, so this session cannot be carried over to codex.";
  }
  return "codex history is not compatible with opencode, so this session cannot be carried over to opencode.";
}
