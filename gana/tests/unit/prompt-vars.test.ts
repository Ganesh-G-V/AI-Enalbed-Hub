import { describe, it, expect } from "vitest";
import {
  substituteVariables,
  extractVariables,
  validateVariables,
} from "@/server/services/prompts.service";

describe("prompt variable substitution", () => {
  it("replaces known placeholders and escapes HTML", () => {
    const out = substituteVariables("Hello {{NAME}}, code: {{CODE}}", {
      NAME: "<script>alert('x')</script>",
      CODE: "const x = 1;",
    });
    expect(out).toContain("&lt;script&gt;");
    expect(out).toContain("const x = 1;");
  });

  it("leaves unknown placeholders intact", () => {
    expect(substituteVariables("{{UNKNOWN}} here", {})).toBe("{{UNKNOWN}} here");
  });

  it("extracts variables in order of first appearance", () => {
    expect(extractVariables("{{B}} and {{A}} and {{B}}")).toEqual(["B", "A"]);
  });

  it("validates missing variables", () => {
    expect(validateVariables("{{A}} {{B}}", { A: "1" })).toEqual({
      valid: false,
      missing: ["B"],
    });
    expect(validateVariables("{{A}}", { A: "1" })).toEqual({
      valid: true,
      missing: [],
    });
  });
});
