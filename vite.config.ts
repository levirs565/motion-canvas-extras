import { defineConfig } from "vite";
import motionCanvas from "@motion-canvas/vite-plugin";

export default defineConfig({
  plugins: [
    motionCanvas({
      project: ["./src/tex.ts", "./src/path.ts", "./src/svg.ts"],
    }),
  ],
});
