import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // 現状はDB非依存の純粋関数テストのみ。UIテスト追加時に jsdom へ切り替える
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
