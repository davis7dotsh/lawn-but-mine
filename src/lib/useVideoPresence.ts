import { browser } from "$app/environment"; // pragma: allowlist secret
import { ConvexClient } from "convex/browser"; // pragma: allowlist secret
import type { Id } from "@convex/_generated/dataModel";
import { readable } from "svelte/store";

const STORAGE_KEY_CLIENT_ID = "lawn.presence.client_id";
export const DEFAULT_HEARTBEAT_INTERVAL_MS = 15_000;
export const DISCONNECT_PATH = "videoPresence:disconnect";

type ClerkListener = () => void;

type RawClerkUser = {
  id?: string;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
  primaryEmailAddress?:
    | {
        emailAddress?: string | null;
      }
    | string
    | null;
  emailAddresses?: Array<{
    emailAddress?: string | null;
  }>;
};

type RawClerk = {
  loaded?: boolean;
  user?: RawClerkUser | null;
  session?: {
    getToken?: () => Promise<string | null>;
  } | null;
  addListener?: (listener: ClerkListener) => (() => void) | void;
  redirectToSignIn?: (options?: { afterSignInUrl?: string }) => Promise<unknown> | unknown;
  openSignIn?: (options?: { redirectUrl?: string }) => Promise<unknown> | unknown;
};

type ClerkAuthUser = {
  id: string;
  email: string | null;
  displayName: string;
  imageUrl?: string;
};

export type ClerkAuthState = {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: ClerkAuthUser | null;
  redirectToSignIn: (redirectPath: string) => void;
};

export type VideoWatcher = {
  userId: string;
  online: boolean;
  kind: "member" | "guest";
  displayName: string;
  avatarUrl?: string;
};

const convexUrl = import.meta.env.VITE_CONVEX_URL;

if (!convexUrl) {
  throw new Error("Missing VITE_CONVEX_URL");
}

const convexClient = new ConvexClient(convexUrl, {
  disabled: !browser,
  unsavedChangesWarning: false,
});

let authMode: "unknown" | "anonymous" | "authenticated" = "unknown";

declare global {
  interface Window {
    Clerk?: RawClerk;
  }
}

function getWindowClerk() {
  if (!browser) {
    return null;
  }
  return window.Clerk ?? null;
}

function getClerkEmail(user: RawClerkUser | null | undefined) {
  if (!user) {
    return null;
  }

  const primary = user.primaryEmailAddress;
  if (typeof primary === "string" && primary.length > 0) {
    return primary;
  }
  if (primary && typeof primary === "object" && primary.emailAddress) {
    return primary.emailAddress;
  }
  const fallback = user.emailAddresses?.find((entry) => entry.emailAddress)?.emailAddress;
  return fallback ?? null;
}

function getClerkDisplayName(user: RawClerkUser | null | undefined) {
  if (!user) {
    return "Guest";
  }

  if (user.fullName && user.fullName.trim().length > 0) {
    return user.fullName;
  }

  const firstName = user.firstName?.trim() ?? "";
  const lastName = user.lastName?.trim() ?? "";
  const combined = `${firstName} ${lastName}`.trim();
  if (combined.length > 0) {
    return combined;
  }

  return getClerkEmail(user) ?? "Member";
}

async function fetchClerkToken() {
  const clerk = getWindowClerk();
  if (!clerk?.session?.getToken) {
    return null;
  }

  try {
    return (await clerk.session.getToken()) ?? null;
  } catch {
    return null;
  }
}

function buildClerkAuthState(): ClerkAuthState {
  const clerk = getWindowClerk();
  const user = clerk?.user ?? null;
  const email = getClerkEmail(user);
  const isLoaded = clerk ? Boolean(clerk.loaded) : true;
  const isSignedIn = Boolean(user && clerk?.session);

  return {
    isLoaded,
    isSignedIn,
    user:
      user && user.id
        ? {
            id: user.id,
            email,
            displayName: getClerkDisplayName(user),
            imageUrl: user.imageUrl ?? undefined,
          }
        : null,
    redirectToSignIn: (redirectPath: string) => {
      const nextPath = redirectPath.startsWith("/") ? redirectPath : `/${redirectPath}`;
      const href = buildSignInHref(nextPath);
      const activeClerk = getWindowClerk();

      if (activeClerk?.redirectToSignIn) {
        void activeClerk.redirectToSignIn({ afterSignInUrl: nextPath });
        return;
      }

      if (activeClerk?.openSignIn) {
        void activeClerk.openSignIn({ redirectUrl: nextPath });
        return;
      }

      if (browser) {
        window.location.assign(href);
      }
    },
  };
}

function syncConvexAuth(state: ClerkAuthState) {
  if (!browser) {
    return;
  }

  if (state.isSignedIn) {
    if (authMode !== "authenticated") {
      convexClient.setAuth(fetchClerkToken, () => {});
      authMode = "authenticated";
    }
    return;
  }

  if (authMode !== "anonymous") {
    convexClient.setAuth(async () => null, () => {});
    authMode = "anonymous";
  }
}

export const clerkAuth = readable<ClerkAuthState>(
  {
    isLoaded: !browser,
    isSignedIn: false,
    user: null,
    redirectToSignIn: (redirectPath: string) => {
      if (!browser) {
        return;
      }
      window.location.assign(buildSignInHref(redirectPath));
    },
  },
  (set) => {
    if (!browser) {
      return () => {};
    }

    const apply = () => {
      const snapshot = buildClerkAuthState();
      syncConvexAuth(snapshot);
      set(snapshot);
    };

    apply();

    const clerk = getWindowClerk();
    const maybeUnsubscribe = clerk?.addListener?.(() => {
      apply();
    });

    const intervalId = window.setInterval(apply, 1_000);
    const handleFocus = () => apply();
    const handleVisibility = () => apply();

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (typeof maybeUnsubscribe === "function") {
        maybeUnsubscribe();
      }
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  },
);

export function getSharedConvexClient() {
  return convexClient;
}

export function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

export function buildSignInHref(redirectPath: string) {
  const nextPath = redirectPath.startsWith("/") ? redirectPath : `/${redirectPath}`;
  return `/sign-in?redirect_url=${encodeURIComponent(nextPath)}`;
}

export function createPresenceClientId() {
  return crypto.randomUUID().replace(/-/g, "");
}

export function getOrCreatePresenceClientId() {
  if (!browser) {
    return null;
  }

  const existing = window.localStorage.getItem(STORAGE_KEY_CLIENT_ID);
  if (existing && existing.trim().length > 0) {
    return existing;
  }

  const clientId = createPresenceClientId();
  window.localStorage.setItem(STORAGE_KEY_CLIENT_ID, clientId);
  return clientId;
}

export function projectWatchers(
  state:
    | Array<{
        userId: string;
        online: boolean;
        data?: {
          kind?: "member" | "guest";
          displayName?: string;
          avatarUrl?: string;
        };
      }>
    | undefined,
) {
  if (!state) {
    return [] as VideoWatcher[];
  }

  return state
    .filter((watcher) => watcher.online)
    .map((watcher) => ({
      userId: watcher.userId,
      online: watcher.online,
      kind: watcher.data?.kind ?? "member",
      displayName: watcher.data?.displayName ?? "Member",
      avatarUrl: watcher.data?.avatarUrl,
    })) satisfies VideoWatcher[];
}

export function sendPresenceDisconnect(sessionToken: string) {
  if (!browser) {
    return;
  }

  const payload = {
    path: DISCONNECT_PATH,
    args: { sessionToken },
  };

  const blob = new Blob([JSON.stringify(payload)], {
    type: "application/json",
  });
  navigator.sendBeacon(`${convexUrl}/api/mutation`, blob);
}

export type VideoPresenceInput = {
  videoId?: Id<"videos">;
  enabled?: boolean;
  shareToken?: string;
  intervalMs?: number;
};
