import { defineConfig } from "vite";
import { sites } from "./build/sites-vite-plugin";

export default defineConfig(async ({ mode }) => {
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";
  if (mode === "test") {
    return { plugins: [sites()] };
  }

  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    plugins: [
      sites(),
      cloudflare({
        viteEnvironment: { name: "server" },
        config: {
          main: "./worker/index.ts",
          compatibility_date: "2026-05-22",
          assets: { binding: "ASSETS" },
        },
      }),
    ],
  };
});
