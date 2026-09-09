import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const siteOrigin = new URL(env.PUBLIC_SITE_URL || "http://127.0.0.1:3000")
    .origin;
  return {
    plugins: [
      react(),
      {
        name: "site-metadata",
        transformIndexHtml: (html) =>
          html.replaceAll("__SITE_ORIGIN__", siteOrigin),
      },
    ],
    server: {
      host: "127.0.0.1",
      port: 3000,
      strictPort: true,
      proxy: { "/api": "http://127.0.0.1:8888" },
    },
    preview: {
      host: "127.0.0.1",
      port: 3000,
      strictPort: true,
      proxy: { "/api": "http://127.0.0.1:8888" },
    },
    test: {
      include: ["src/**/*.test.{js,jsx}"],
      environment: "jsdom",
      setupFiles: ["./src/test/setup.js"],
    },
  };
});
