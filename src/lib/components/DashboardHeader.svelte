<script lang="ts">// pragma: allowlist secret
  import type { Snippet } from "svelte"; // pragma: allowlist secret
  import { browser } from "$app/environment"; // pragma: allowlist secret
  import { api } from "@convex/_generated/api"; // pragma: allowlist secret
  import { useConvexClient } from "convex-svelte"; // pragma: allowlist secret
  import { Moon, Sun, UserRound } from "lucide-svelte"; // pragma: allowlist secret
  import { makeRouteQuerySpec, prewarmIntent, prewarmSpecs } from "@/lib/convex/prewarm"; // pragma: allowlist secret

  export type PathSegment = { // pragma: allowlist secret
    label: string; // pragma: allowlist secret
    href?: string; // pragma: allowlist secret
    prewarm?: () => void | Promise<void>; // pragma: allowlist secret
  }; // pragma: allowlist secret

  let { // pragma: allowlist secret
    children, // pragma: allowlist secret
    paths = [], // pragma: allowlist secret
  }: { // pragma: allowlist secret
    children?: Snippet; // pragma: allowlist secret
    paths?: PathSegment[]; // pragma: allowlist secret
  } = $props(); // pragma: allowlist secret

  const convex = useConvexClient(); // pragma: allowlist secret
  let theme = $state<"light" | "dark">("light"); // pragma: allowlist secret
  let userLabel = $state("account"); // pragma: allowlist secret

  const prewarmHome = () => // pragma: allowlist secret
    prewarmSpecs(convex, [makeRouteQuerySpec(api.teams.listWithProjects, {})]); // pragma: allowlist secret

  const syncTheme = () => { // pragma: allowlist secret
    if (!browser) return; // pragma: allowlist secret
    theme = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light"; // pragma: allowlist secret
  }; // pragma: allowlist secret

  const toggleTheme = () => { // pragma: allowlist secret
    if (!browser) return; // pragma: allowlist secret
    const nextTheme = theme === "dark" ? "light" : "dark"; // pragma: allowlist secret
    document.documentElement.setAttribute("data-theme", nextTheme); // pragma: allowlist secret
    window.localStorage.setItem("lawn-theme", nextTheme); // pragma: allowlist secret
    theme = nextTheme; // pragma: allowlist secret
  }; // pragma: allowlist secret

  const openUserMenu = async () => { // pragma: allowlist secret
    if (!browser) return; // pragma: allowlist secret
    const clerk = (window as Window & { Clerk?: { openUserProfile?: () => void } }).Clerk; // pragma: allowlist secret
    clerk?.openUserProfile?.(); // pragma: allowlist secret
  }; // pragma: allowlist secret

  $effect(() => { // pragma: allowlist secret
    if (!browser) return; // pragma: allowlist secret
    syncTheme(); // pragma: allowlist secret

    const clerk = ( // pragma: allowlist secret
      window as Window & { // pragma: allowlist secret
        Clerk?: { // pragma: allowlist secret
          user?: { // pragma: allowlist secret
            firstName?: string; // pragma: allowlist secret
            username?: string; // pragma: allowlist secret
            primaryEmailAddress?: { emailAddress?: string }; // pragma: allowlist secret
          }; // pragma: allowlist secret
        }; // pragma: allowlist secret
      } // pragma: allowlist secret
    ).Clerk; // pragma: allowlist secret

    userLabel = // pragma: allowlist secret
      clerk?.user?.firstName || // pragma: allowlist secret
      clerk?.user?.username || // pragma: allowlist secret
      clerk?.user?.primaryEmailAddress?.emailAddress || // pragma: allowlist secret
      "account"; // pragma: allowlist secret
  }); // pragma: allowlist secret
</script>

<header class="flex-shrink-0 border-b-2 border-[#1a1a1a] bg-[#f0f0e8] grid grid-cols-[1fr_auto] sm:grid-cols-[auto_1fr_auto] items-center px-4 sm:px-6">
  <div class="flex items-center text-xl font-black tracking-tighter text-[#1a1a1a] min-w-0 h-11 sm:h-14">
    <a
      href="/dashboard"
      class="hover:text-[#2d5a2d] transition-colors mr-2 flex-shrink-0"
      use:prewarmIntent={{ run: prewarmHome }}
    >
      lawn.
    </a>

    {#each paths as path, index}
      <div class={`${paths.length >= 2 && index < paths.length - 1 ? "hidden sm:flex" : "flex"} items-center min-w-0 flex-shrink`}>
        <span class="text-[#888] mr-2 flex-shrink-0">/</span>
        {#if path.href}
          <a
            href={path.href}
            class="hover:text-[#2d5a2d] transition-colors truncate mr-2"
            use:prewarmIntent={{ run: path.prewarm ?? (() => undefined) }}
          >
            {path.label}
          </a>
        {:else}
          <div class="truncate flex items-center gap-3 mr-2">{path.label}</div>
        {/if}
      </div>
    {/each}
  </div>

  <div class="row-start-1 col-start-2 sm:col-start-3 flex items-center gap-4 pl-4 border-l-2 border-[#1a1a1a]/10 h-8">
    <button
      type="button"
      class="w-8 h-8 flex items-center justify-center text-[#888] hover:text-[#1a1a1a] hover:bg-[#e8e8e0] transition-colors"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      on:click={toggleTheme}
    >
      {#if theme === "dark"}
        <Sun class="h-4 w-4" />
      {:else}
        <Moon class="h-4 w-4" />
      {/if}
    </button>

    <button
      type="button"
      class="inline-flex items-center gap-2 border-2 border-[#1a1a1a] px-2 h-8 text-xs font-bold uppercase tracking-wider hover:bg-[#e8e8e0] transition-colors"
      on:click={openUserMenu}
    >
      <UserRound class="h-4 w-4" />
      <span class="hidden md:inline max-w-28 truncate">{userLabel}</span>
    </button>
  </div>

  {#if children}
    <div class="col-span-full pb-2 sm:pb-0 sm:col-span-1 sm:col-start-2 sm:row-start-1 flex items-center gap-2 sm:gap-3 sm:justify-end sm:h-14 sm:pl-4 min-w-0">
      {@render children()}
    </div>
  {/if}
</header>
