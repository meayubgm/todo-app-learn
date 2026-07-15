import { describe, it, expect } from "vitest";
import { isValidTitle, TITLE_MAX_LENGTH } from "./validation";

describe("isValidTitle", () => {
  it("通常のタイトルを許可する", () => {
    expect(isValidTitle("牛乳を買う")).toBe(true);
  });

  it("空文字・空白のみを拒否する", () => {
    expect(isValidTitle("")).toBe(false);
    expect(isValidTitle("   ")).toBe(false);
  });

  it("最大長を超えるタイトルを拒否する", () => {
    expect(isValidTitle("a".repeat(TITLE_MAX_LENGTH))).toBe(true);
    expect(isValidTitle("a".repeat(TITLE_MAX_LENGTH + 1))).toBe(false);
  });
});
