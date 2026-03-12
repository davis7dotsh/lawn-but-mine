import { browser } from "$app/environment";
import { Clerk } from "@clerk/clerk-js";
import type { ConvexClient } from "convex/browser";

type ClerkClient = Clerk;

export const clerkAppearance = {
  elements: {
    formButtonPrimary:
      "bg-[#1a1a1a] hover:bg-[#2d5a2d] text-[#f0f0e8] border-2 border-[#1a1a1a] rounded-none shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_var(--shadow-color)] font-mono font-bold uppercase text-sm transition-all",
    card: "bg-[#f0f0e8] border-2 border-[#1a1a1a] rounded-none shadow-[8px_8px_0px_0px_var(--shadow-color)]",
    headerTitle: "text-[#1a1a1a] font-black uppercase tracking-tighter text-2xl font-mono",
    headerSubtitle: "text-[#888] font-mono",
    socialButtonsBlockButton:
      "border-2 border-[#1a1a1a] bg-transparent hover:bg-[#1a1a1a] text-[#1a1a1a] hover:text-[#f0f0e8] rounded-none transition-all hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_var(--shadow-color)] font-mono",
    socialButtonsBlockButtonText: "!text-current font-bold uppercase font-mono",
    socialButtonsBlockButtonArrow: "text-current",
    formFieldLabel: "text-[#1a1a1a] font-bold uppercase font-mono",
    formFieldInput:
      "bg-transparent border-2 border-[#1a1a1a] text-[#1a1a1a] focus:border-[#2d5a2d] focus:shadow-[4px_4px_0px_0px_var(--shadow-accent)] focus:ring-0 rounded-none font-mono",
    footerActionLink: "text-[#2d5a2d] hover:text-[#1a1a1a] font-bold font-mono",
    footerActionText: "text-[#888] font-mono",
    dividerLine: "bg-[#1a1a1a]",
    dividerText: "text-[#888] font-mono font-bold",
    identityPreviewText: "text-[#1a1a1a] font-mono",
    identityPreviewEditButton: "text-[#2d5a2d] hover:text-[#1a1a1a]",
    formFieldInputShowPasswordButton: "text-[#888] hover:text-[#1a1a1a]",
    footer: "hidden",
    internal: "text-[#1a1a1a]",
    userButtonAvatarBox: "w-9 h-9 border-2 border-[#1a1a1a] shadow-[4px_4px_0px_0px_var(--shadow-color)]",
    userButtonTrigger:
      "rounded-none transition-all hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_var(--shadow-color)]",
    userPreviewMainIdentifier: "font-mono font-bold",
    userPreviewSecondaryIdentifier: "font-mono text-[#888]",
  },
  variables: {
    colorPrimary: "#2d5a2d",
    colorBackground: "#f0f0e8",
    colorInputBackground: "transparent",
    colorInputText: "#1a1a1a",
    colorText: "#1a1a1a",
    colorTextSecondary: "#888888",
    colorTextOnPrimaryBackground: "#f0f0e8",
    colorNeutral: "#1a1a1a",
    borderRadius: "0rem",
  },
} as const;

export const clerkState = $state({
  clerk: null as ClerkClient | null,
  session: null as ClerkClient["session"],
  user: null as ClerkClient["user"],
  loaded: false,
});

const boundClients = new WeakSet<ConvexClient>();

let initPromise: Promise<ClerkClient> | null = null;
let unsubscribe: (() => void) | null = null;

function syncState(clerk: ClerkClient) {
  clerkState.clerk = clerk;
  clerkState.session = clerk.session ?? null;
  clerkState.user = clerk.user ?? null;
  clerkState.loaded = clerk.loaded;
}

export async function initClerk() {
  if (!browser) return null;

  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
  if (!publishableKey) {
    throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
  }

  if (!initPromise) {
    initPromise = (async () => {
      const clerk = new Clerk(publishableKey);
      await clerk.load({
        signInUrl: "/sign-in",
        signUpUrl: "/sign-up",
      });

      syncState(clerk);
      unsubscribe?.();
      unsubscribe = clerk.addListener(() => {
        syncState(clerk);
      });

      return clerk;
    })();
  }

  return initPromise;
}

export async function bindConvexAuth(client: ConvexClient) {
  if (boundClients.has(client)) return;

  const clerk = await initClerk();
  if (!clerk) return;

  client.setAuth(async () => {
    if (!clerk.session) return null;
    return clerk.session.getToken({ template: "convex" });
  });

  boundClients.add(client);
}
