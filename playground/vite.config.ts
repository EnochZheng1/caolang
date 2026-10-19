import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  // Relative asset paths, so it works under a GitHub Pages project URL (/caolang/)
  base: "./",
  resolve: {
    alias: {
      "@caolang": resolve(__dirname, "../src"),
    },
  },
  server: {
    // examples/ lives outside the playground folder
    fs: { allow: [".."] },
  },
  build: {
    target: "es2022",
    outDir: "dist",
  },
});
