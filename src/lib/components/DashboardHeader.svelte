<script lang="ts">
  import type { Snippet } from "svelte"; 
  import { browser } from "$app/environment"; 
  import { api } from "@convex/_generated/api"; 
  import { useConvexClient } from "convex-svelte"; 
  import { Moon, Sun, UserRound } from "lucide-svelte"; 
  import { makeRouteQuerySpec, prewarmIntent, prewarmSpecs } from "@/lib/convex/prewarm"; 

  export type PathSegment = { 
    label: string; 
    href?: string; 
    prewarm?: () => void | Promise<void>; 
  }; 

  let { 
    children, 
    paths = [], 
  }: { 
    children?: Snippet; 
    paths?: PathSegment[]; 
  } = $props(); 

  const convex = useConvexClient(); 
  let theme = $state<"light" | "dark">("light"); 
  let userLabel = $state("account"); 

  const prewarmHome = () => 
    prewarmSpecs(convex, [makeRouteQuerySpec(api.teams.listWithProjects, {})]); 

  const syncTheme = () => { 
    if (!browser) return; 
    theme = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light"; 
  }; 

  const toggleTheme = () => { 
    if (!browser) return; 
    const nextTheme = theme === "dark" ? "light" : "dark"; 
    document.documentElement.setAttribute("data-theme", nextTheme); 
    window.localStorage.setItem("lawn-theme", nextTheme); 
    theme = nextTheme; 
  }; 

  const openUserMenu = async () => { 
    if (!browser) return; 
    const clerk = (window as Window & { Clerk?: { openUserProfile?: () => void } }).Clerk; 
    clerk?.openUserProfile?.(); 
  }; 

  $effect(() => { 
    if (!browser) return; 
    syncTheme(); 

    const clerk = ( 
      window as Window & { 
        Clerk?: { 
          user?: { 
            firstName?: string; 
            username?: string; 
            primaryEmailAddress?: { emailAddress?: string }; 
          }; 
        }; 
      } 
    ).Clerk; 

    userLabel = 
      clerk?.user?.firstName || 
      clerk?.user?.username || 
      clerk?.user?.primaryEmailAddress?.emailAddress || 
      "account"; 
  }); 
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
