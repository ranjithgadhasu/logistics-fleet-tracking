import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), // JSX transform + fast refresh
    tailwindcss(), // Tailwind CSS v4 (reads tailwind.config.js via @config in src/index.css)
  ],
  resolve: {
    alias: {
      // lets you write: import { Button } from "@/components/ui"
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
