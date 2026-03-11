import { resolveClerkIssuerDomain } from "../src/shared/clerkIssuer";

const issuerDomain = resolveClerkIssuerDomain();

if (!issuerDomain) {
  throw new Error(
    "Missing Clerk issuer domain. Set CLERK_JWT_ISSUER_DOMAIN or VITE_CLERK_PUBLISHABLE_KEY.",
  );
}

export default {
  providers: [
    {
      domain: issuerDomain,
      applicationID: "convex",
    },
  ],
};
