import * as fs from "node:fs/promises";
import * as path from "node:path";

import { describe, expect, it } from "vitest";

describe("assistant delta contract", () => {
  it("upserts assistant block on first delta before append-only path", async () => {
    const filePath = path.resolve(__dirname, "../../src/extension.ts");
    const src = await fs.readFile(filePath, "utf8");

    expect(src).toContain("const existed = rt.blockIndexById.has(id);");
    expect(src).toContain("if (!existed) block.text += delta;");
    expect(src).toContain("if (!existed) {");
    expect(src).toContain("chatView?.postBlockUpsert(sessionId, block);");
    expect(src).toContain("rt.pendingAssistantDeltas.set(id, prev ? prev + delta : delta);");
  });

  it("anchors tool items by turnId when possible", async () => {
    const filePath = path.resolve(__dirname, "../../src/extension.ts");
    const src = await fs.readFile(filePath, "utf8");

    expect(src).toContain("let insertAt = rt.blocks.length;");
    expect(src).toContain("if (turnId) {");
    expect(src).toContain("candidateTurnId === turnId");
    expect(src).toContain("rt.blocks.splice(insertAt, 0, block);");
    expect(src).toContain("rebuildBlockIndex(rt);");
  });
});
