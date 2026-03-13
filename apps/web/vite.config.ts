import path from "node:path";
import { convexLocal } from "convex-vite-plugin";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv, type PluginOption } from "vite";
import { decodeClerkIssuerDomain } from "@lawn/shared/clerkIssuer";

const workspaceRoot = path.resolve(process.cwd(), "../..");
const convexProjectDir = path.resolve(workspaceRoot, "packages/convex");

const getEnvValue = (loadedEnv: Record<string, string>, key: string) =>
  process.env[key] ?? loadedEnv[key];

const LOCAL_CONVEX_ENV_KEYS = [
  "AUTUMN_SECRET_KEY",
  "AUTUMN_URL",
  "CLERK_SECRET_KEY",
  "MUX_TOKEN_ID",
  "MUX_TOKEN_SECRET",
  "MUX_SIGNING_KEY",
  "MUX_SIGNING_KEY_ID",
  "MUX_PRIVATE_KEY",
  "MUX_SIGNING_PRIVATE_KEY",
  "MUX_WEBHOOK_SECRET",
  "RAILWAY_ACCESS_KEY_ID",
  "RAILWAY_SECRET_ACCESS_KEY",
  "RAILWAY_ENDPOINT",
  "RAILWAY_PUBLIC_URL",
  "RAILWAY_BUCKET_NAME",
  "RAILWAY_REGION",
  "RAILWAY_PUBLIC_URL_INCLUDE_BUCKET",
] as const;

const getLocalConvexEnvVars = (loadedEnv: Record<string, string>) => {
  const publishableKey = getEnvValue(loadedEnv, "VITE_CLERK_PUBLISHABLE_KEY");
  const clerkIssuerDomain =
    getEnvValue(loadedEnv, "CLERK_JWT_ISSUER_DOMAIN") ??
    (publishableKey ? decodeClerkIssuerDomain(publishableKey) : null);

  const missingVars = [
    !clerkIssuerDomain
      ? "CLERK_JWT_ISSUER_DOMAIN (or VITE_CLERK_PUBLISHABLE_KEY)"
      : null,
    !getEnvValue(loadedEnv, "AUTUMN_SECRET_KEY") ? "AUTUMN_SECRET_KEY" : null,
  ].filter(Boolean);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required env var(s) for USE_LOCAL_CONVEX=true: ${missingVars.join(", ")}`,
    );
  }

  return Object.fromEntries(
    [
      ["CLERK_JWT_ISSUER_DOMAIN", clerkIssuerDomain],
      ...LOCAL_CONVEX_ENV_KEYS.map((key) => [key, getEnvValue(loadedEnv, key)]),
    ].filter(([, value]) => typeof value === "string" && value.length > 0),
  );
};

export default defineConfig(({ mode }) => {
  const loadedEnv = loadEnv(mode, workspaceRoot, "");
  const useLocalConvex = getEnvValue(loadedEnv, "USE_LOCAL_CONVEX") === "true";
  const resetLocalBackend = getEnvValue(loadedEnv, "RESET_LOCAL_BACKEND") === "true";

  const plugins: PluginOption[] = [
    tailwindcss(),
  ];

  if (useLocalConvex) {
    plugins.push(
      convexLocal({
        port: 3210,
        siteProxyPort: 3211,
        projectDir: convexProjectDir,
        convexDir: "convex",
        reset: resetLocalBackend,
        envVars: getLocalConvexEnvVars(loadedEnv),
      }),
    );
  }

  plugins.push(
    sveltekit(),
  );

  return {
    envDir: workspaceRoot,
    plugins,
    resolve: {
      alias: {
        "@": path.resolve("./src"),
      },
    },
    server: {
      fs: {
        allow: [workspaceRoot],
      },
    },
    optimizeDeps: {
      exclude: ["@clerk/clerk-js"],
    },
  };
});
