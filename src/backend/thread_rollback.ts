import type { Turn } from "../generated/v2/Turn";

export function computeRollbackNumTurnsForTargetTurn(
  turns: Turn[],
  targetTurnId: string,
): number {
  const normalizedTarget = targetTurnId.trim();
  if (!normalizedTarget) {
    throw new Error("Invalid turnId for rollback.");
  }

  const targetIndex = turns.findIndex(
    (turn) => String(turn.id ?? "").trim() === normalizedTarget,
  );
  if (targetIndex < 0) {
    throw new Error(`Cannot rewind: turn not found: ${normalizedTarget}`);
  }

  const numTurns = turns.length - targetIndex;
  if (!Number.isFinite(numTurns) || numTurns < 1) {
    throw new Error(
      `Invalid rollback depth computed for turnId=${normalizedTarget}.`,
    );
  }
  return numTurns;
}
