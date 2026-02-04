import { defineConfig } from "vite";

// Plugin to remove type="module" from script tags for file:// compatibility
function removeModuleType() {
  return {
    name: "remove-module-type",
    enforce: "post",
    transformIndexHtml(html) {
      return html.replace(/<script type="module" crossorigin/g, "<script defer");
    },
  };
}

export default defineConfig({
  plugins: [removeModuleType()],
  build: {
    // Output to dist/ folder
    outDir: "dist",
    // Target older browsers to avoid ES module output
    target: "es2015",
    // Bundle everything into a single JS file (no code splitting)
    rollupOptions: {
      output: {
        // IIFE format works with file:// (no module CORS issues)
        format: "iife",
        // Single entry bundle
        entryFileNames: "bundle.js",
        // Predictable CSS filename
        assetFileNames: "[name][extname]",
        // Inline all assets
        inlineDynamicImports: true,
      },
    },
  },
  // Use relative paths so dist/index.html works via file://
  base: "./",
});
