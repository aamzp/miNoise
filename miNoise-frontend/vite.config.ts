import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/miNoise/visualizer/",   // 👈 GitHub Pages LO NECESITA
  plugins: [react()],
  build: {
    outDir: "../docs/visualizer",
    emptyOutDir: true,
  }
});
