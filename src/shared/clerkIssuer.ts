export function decodeClerkIssuerDomain(publishableKey: string) {
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
}

export const resolveClerkIssuerDomain = () =>
  process.env.CLERK_JWT_ISSUER_DOMAIN ??
  decodeClerkIssuerDomain(process.env.VITE_CLERK_PUBLISHABLE_KEY ?? "") ??
  undefined;
