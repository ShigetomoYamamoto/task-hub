import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
      exclude: [
        "node_modules",
        ".next",
        "src/components/ui/**",
        "**/*.config.*",
        "**/mock/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
