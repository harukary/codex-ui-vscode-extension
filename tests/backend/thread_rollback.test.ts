import { describe, expect, it } from "vitest";

import { computeRollbackNumTurnsForTargetTurn } from "../../src/backend/thread_rollback";
import type { Turn } from "../../src/generated/v2/Turn";

function makeTurn(id: string): Turn {
  return {
    id,
    items: [],
    status: "completed",
    tokenUsage: null,
    error: null,
  };
}

describe("thread_rollback", () => {
  it("computes numTurns including the target turn", () => {
    const turns: Turn[] = [makeTurn("t1"), makeTurn("t2"), makeTurn("t3")];
    expect(computeRollbackNumTurnsForTargetTurn(turns, "t2")).toBe(2);
  });

  it("accepts turnId with surrounding whitespace", () => {
    const turns: Turn[] = [makeTurn("t1"), makeTurn("t2")];
    expect(computeRollbackNumTurnsForTargetTurn(turns, "  t2  ")).toBe(1);
  });

  it("throws when turnId is empty", () => {
    const turns: Turn[] = [makeTurn("t1")];
    expect(() => computeRollbackNumTurnsForTargetTurn(turns, "   ")).toThrow(
      "Invalid turnId for rollback.",
    );
  });

  it("throws when target turn does not exist", () => {
    const turns: Turn[] = [makeTurn("t1"), makeTurn("t2")];
    expect(() =>
      computeRollbackNumTurnsForTargetTurn(turns, "missing"),
    ).toThrow("Cannot rewind: turn not found: missing");
  });
});
