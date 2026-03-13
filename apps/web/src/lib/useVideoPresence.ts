import { browser } from "$app/environment";
import { ConvexClient } from "convex/browser";
import type { Id } from "@lawn/convex/dataModel";
import { readable } from "svelte/store";

import { clerkState, initClerk } from "@/lib/auth/clerk.svelte";

const STORAGE_KEY_CLIENT_ID = "lawn.presence.client_id";
export const DEFAULT_HEARTBEAT_INTERVAL_MS = 15_000;
export const DISCONNECT_PATH = "videoPresence:disconnect";

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

function getClerkEmail(user: unknown) {
  if (!user || typeof user !== "object") {
    return null;
  }

  const record = user as {
    primaryEmailAddress?: { emailAddress?: string | null } | null;
    emailAddresses?: Array<{ emailAddress?: string | null }>;
  };

  const primary = record.primaryEmailAddress?.emailAddress;
  if (primary) {
    return primary;
  }

  return record.emailAddresses?.find((entry) => entry.emailAddress)?.emailAddress ?? null;
}

function getClerkDisplayName(user: unknown) {
  if (!user || typeof user !== "object") {
    return "Guest";
  }

  const record = user as {
    fullName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  };

  if (record.fullName && record.fullName.trim().length > 0) {
    return record.fullName;
  }

  const combined = `${record.firstName ?? ""} ${record.lastName ?? ""}`.trim();
  if (combined.length > 0) {
    return combined;
  }

  return getClerkEmail(user) ?? "Member";
}

function buildClerkAuthState(): ClerkAuthState {
  const user = clerkState.user;
  const isLoaded = browser ? clerkState.loaded : true;
  const isSignedIn = Boolean(user && clerkState.session);

  return {
    isLoaded,
    isSignedIn,
    user:
      user && user.id
        ? {
            id: user.id,
            email: getClerkEmail(user),
            displayName: getClerkDisplayName(user),
            imageUrl:
              "imageUrl" in user && typeof user.imageUrl === "string"
                ? user.imageUrl
                : undefined,
          }
        : null,
    redirectToSignIn: (redirectPath: string) => {
      if (!browser) {
        return;
      }

      window.location.assign(buildSignInHref(redirectPath));
    },
  };
}

function syncConvexAuth(state: ClerkAuthState) {
  if (!browser) return;

  if (state.isSignedIn) {
    if (authMode !== "authenticated") {
      convexClient.setAuth(async ({ forceRefreshToken }) => {
        if (!clerkState.session) {
          return null;
        }

        return (
          (await clerkState.session.getToken({
            template: "convex",
            skipCache: forceRefreshToken,
          })) ?? null
        );
      });
      authMode = "authenticated";
    }
    return;
  }

  if (authMode !== "anonymous") {
    convexClient.setAuth(async () => null);
    authMode = "anonymous";
  }
}

export const clerkAuth = readable<ClerkAuthState>(
  {
    isLoaded: !browser,
    isSignedIn: false,
    user: null,
    redirectToSignIn: (redirectPath: string) => {
      if (!browser) return;
      window.location.assign(buildSignInHref(redirectPath));
    },
  },
  (set) => {
    if (!browser) {
      return () => {};
    }

    void initClerk();

    const apply = () => {
      const snapshot = buildClerkAuthState();
      syncConvexAuth(snapshot);
      set(snapshot);
    };

    apply();

    const intervalId = window.setInterval(apply, 150);
    const handleFocus = () => apply();
    const handleVisibility = () => apply();

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
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
