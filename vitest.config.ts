import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Test-only config: keeps the app's Vite config untouched (no dev server,
// no Tailwind plugin) so the login/validation suites can run in jsdom.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
  },
});
