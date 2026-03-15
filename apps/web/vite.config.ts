import childProcess from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { convexLocal } from "convex-vite-plugin";
import { generateAdminKey } from "convex-vite-plugin/lib";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv, type PluginOption } from "vite";
import { decodeClerkIssuerDomain } from "@lawn/shared/clerkIssuer";

const workspaceRoot = path.resolve(process.cwd(), "../..");
const convexProjectDir = path.resolve(workspaceRoot, "packages/convex");
const localConvexStateVersion = "issuer-env-v1";
const defaultLocalConvexPort = 3210;
const maxLocalPortAttempts = 100;

const getEnvValue = (loadedEnv: Record<string, string>, key: string) =>
  process.env[key] ?? loadedEnv[key];

const isPortAvailableSync = (port: number) => {
  if (process.platform === "win32") {
    const result = childProcess.spawnSync("netstat", ["-an"], {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    });

    if (result.status !== 0) {
      return true;
    }

    return !result.stdout?.includes(`:${port} `);
  }

  const result = childProcess.spawnSync("lsof", ["-i", `:${port}`, "-sTCP:LISTEN"], {
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "ignore"],
  });

  return result.status !== 0 || !result.stdout?.trim();
};

const findAvailablePortSync = (startPort: number) => {
  for (let attempt = 0; attempt < maxLocalPortAttempts; attempt += 1) {
    const port = startPort + attempt;

    if (isPortAvailableSync(port)) {
      return port;
    }
  }

  throw new Error(
    `Could not find an available local Convex port after checking ${maxLocalPortAttempts} ports starting at ${startPort}.`,
  );
};

const computeLocalConvexStateId = (projectDir: string, suffix?: string) => {
  let gitBranch = "unknown";

  try {
    const result = childProcess.spawnSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      cwd: projectDir,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    });

    if (result.status === 0 && result.stdout) {
      gitBranch = result.stdout.trim();
    }
  } catch {
    // Ignore git errors and fall back to "unknown" like the plugin does.
  }

  const input = suffix ? `${gitBranch}:${projectDir}:${suffix}` : `${gitBranch}:${projectDir}`;
  const hash = crypto.createHash("sha256").update(input).digest("hex").slice(0, 16);
  const sanitizedBranch = gitBranch.replace(/[^a-zA-Z0-9-]/g, "-");
  const sanitizedSuffix = suffix ? `-${suffix.replace(/[^a-zA-Z0-9-]/g, "-")}` : "";

  return `${sanitizedBranch}${sanitizedSuffix}-${hash}`;
};

const getClerkIssuerDomain = (loadedEnv: Record<string, string>) => {
  const publishableKey = getEnvValue(loadedEnv, "VITE_CLERK_PUBLISHABLE_KEY");
  return (
    getEnvValue(loadedEnv, "CLERK_JWT_ISSUER_DOMAIN") ??
    (publishableKey ? decodeClerkIssuerDomain(publishableKey) : null)
  );
};

const refreshPersistedConvexAdminKey = (projectDir: string, suffix?: string) => {
  const stateId = computeLocalConvexStateId(projectDir, suffix);
  const keysPath = path.join(projectDir, ".convex", stateId, "keys.json");

  if (!fs.existsSync(keysPath)) {
    return;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(keysPath, "utf8")) as {
      adminKey?: string;
      instanceName?: string;
      instanceSecret?: string;
    };

    if (!parsed.instanceName || !parsed.instanceSecret) {
      return;
    }

    const adminKey = generateAdminKey(parsed.instanceSecret, parsed.instanceName);

    if (parsed.adminKey === adminKey) {
      return;
    }

    fs.writeFileSync(
      keysPath,
      JSON.stringify(
        {
          ...parsed,
          adminKey,
        },
        null,
        2,
      ),
    );
  } catch {
    // Leave malformed state alone and let the plugin handle it normally.
  }
};

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
  const clerkIssuerDomain = getClerkIssuerDomain(loadedEnv);

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
  const clerkIssuerDomain = getClerkIssuerDomain(loadedEnv);
  const localConvexPort = useLocalConvex ? findAvailablePortSync(defaultLocalConvexPort) : null;
  const localConvexSiteProxyPort =
    localConvexPort !== null ? findAvailablePortSync(localConvexPort + 1) : null;

  if (clerkIssuerDomain) {
    // Convex deploy inherits process.env, so set the issuer here instead of
    // pushing it through the local backend env API.
    process.env.CLERK_JWT_ISSUER_DOMAIN = clerkIssuerDomain;
  }

  if (useLocalConvex && !resetLocalBackend) {
    refreshPersistedConvexAdminKey(convexProjectDir, localConvexStateVersion);
  }

  if (localConvexPort !== null && localConvexPort !== defaultLocalConvexPort) {
    console.warn(
      `[convex] Port ${defaultLocalConvexPort} is already in use, so the local backend will start on ${localConvexPort} instead.`,
    );
  }

  const plugins: PluginOption[] = [
    tailwindcss(),
  ];

  if (useLocalConvex) {
    plugins.push(
      convexLocal({
        port: localConvexPort,
        siteProxyPort: localConvexSiteProxyPort,
        projectDir: convexProjectDir,
        convexDir: "convex",
        stateIdSuffix: localConvexStateVersion,
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
