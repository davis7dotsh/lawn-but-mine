import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const envLocalPath = path.join(cwd, ".env.local");
const envPath = path.join(cwd, ".env");

const readEnvFile = (filePath: string) => {
  if (!existsSync(filePath)) return new Map<string, string>();

  return readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .reduce((entries, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return entries;

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) return entries;

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();
      if (!key) return entries;

      entries.set(key, value);
      return entries;
    }, new Map<string, string>());
};

const decodeClerkIssuerDomain = (publishableKey: string) => {
  const encodedPart = publishableKey.trim().replace(/^pk_(test|live)_/, "").split("$")[0];
  if (!encodedPart) return null;

  const base64 = encodedPart.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4 || 4)) % 4);

  try {
    const decoded = Buffer.from(padded, "base64").toString("utf8").replace(/\$/g, "").trim();
    if (!decoded.includes(".")) return null;
    return decoded.startsWith("http://") || decoded.startsWith("https://")
      ? decoded
      : `https://${decoded}`;
  } catch {
    return null;
  }
};

const env = new Map<string, string>([
  ...readEnvFile(envPath),
  ...readEnvFile(envLocalPath),
]);

for (const [key, value] of Object.entries(process.env)) {
  if (typeof value === "string" && value.length > 0) {
    env.set(key, value);
  }
}

if (env.has("CLERK_JWT_ISSUER_DOMAIN")) process.exit(0);

const publishableKey = env.get("VITE_CLERK_PUBLISHABLE_KEY");
if (!publishableKey) {
  console.warn(
    "Skipping local Convex Clerk env prep: VITE_CLERK_PUBLISHABLE_KEY is not set.",
  );
  process.exit(0);
}

const issuerDomain = decodeClerkIssuerDomain(publishableKey);
if (!issuerDomain) {
  console.warn(
    "Skipping local Convex Clerk env prep: could not derive CLERK_JWT_ISSUER_DOMAIN from VITE_CLERK_PUBLISHABLE_KEY.",
  );
  process.exit(0);
}

const current = existsSync(envLocalPath) ? readFileSync(envLocalPath, "utf8") : "";
const lines = current ? current.split(/\r?\n/) : [];
const hasTrailingNewline = current.endsWith("\n");

let updated = false;
const nextLines = lines.map((line) => {
  if (!line.startsWith("CLERK_JWT_ISSUER_DOMAIN=")) return line;
  updated = true;
  return `CLERK_JWT_ISSUER_DOMAIN=${issuerDomain}`;
});

if (!updated) {
  const prefix = nextLines.length > 0 && nextLines[nextLines.length - 1] !== "" ? [""] : [];
  nextLines.push(...prefix, "# Derived for local Convex auth", `CLERK_JWT_ISSUER_DOMAIN=${issuerDomain}`);
}

const nextContent = nextLines.join("\n");
writeFileSync(envLocalPath, `${nextContent}${hasTrailingNewline || !nextContent ? "" : "\n"}`);

