import { Clerk } from "@clerk/clerk-js";

let clerkInstance: Clerk | null = null;
let clerkLoadPromise: Promise<void> | null = null;

export function getClerk(): Clerk {
  if (!clerkInstance) {
    const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
    if (!publishableKey) throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
    clerkInstance = new Clerk(publishableKey);
  }
  return clerkInstance;
}

export async function loadClerk(): Promise<Clerk> {
  const clerk = getClerk();
  if (!clerkLoadPromise) {
    clerkLoadPromise = clerk.load();
  }
  await clerkLoadPromise;
  return clerk;
}

export function getClerkToken(): Promise<string | null> {
  const clerk = getClerk();
  const session = clerk.session;
  if (!session) return Promise.resolve(null);
  return session.getToken({ template: "convex" });
}
