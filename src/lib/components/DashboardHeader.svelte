<script lang="ts">
  import { onMount } from "svelte";
  import { loadClerk, getClerk } from "$lib/clerk";
  import { themeState } from "$lib/theme.svelte";
  import type { Snippet } from "svelte";

  interface PathSegment {
    label: string;
    href?: string;
  }

  let { children, paths = [] }: { children?: Snippet; paths?: PathSegment[] } = $props();
  let userButtonContainer: HTMLDivElement;
  let mounted = $state(false);

  onMount(() => {
    loadClerk().then((clerk) => {
    clerk.mountUserButton(userButtonContainer, {
      appearance: {
        variables: {
          colorText: "#1a1a1a",
          colorTextSecondary: "#888",
          colorBackground: "#f0f0e8",
        },
        elements: {
          avatarBox: "w-8 h-8 rounded-none border-2 border-[#1a1a1a]",
          userButtonPopoverCard: "bg-[#f0f0e8] border-2 border-[#1a1a1a] rounded-none shadow-[8px_8px_0px_0px_var(--shadow-color)]",
          userButtonPopoverActionButton: "!text-[#1a1a1a] hover:!bg-[#e8e8e0] rounded-none",
          userButtonPopoverActionButtonText: "!text-[#1a1a1a] hover:!text-[#1a1a1a] font-mono font-bold",
          userButtonPopoverActionButtonIcon: "!text-[#1a1a1a] hover:!text-[#1a1a1a]",
          userButtonPopoverFooter: "hidden",
        },
      },
    });
    mounted = true;
    });
    return () => { getClerk().unmountUserButton(userButtonContainer); };
  });
</script>

<header class="flex-shrink-0 border-b-2 border-[#1a1a1a] bg-[#f0f0e8] grid grid-cols-[1fr_auto] sm:grid-cols-[auto_1fr_auto] items-center px-4 sm:px-6" style="--shadow-color: #1a1a1a;">
  <div class="flex items-center text-xl font-black tracking-tighter text-[#1a1a1a] min-w-0 h-11 sm:h-14">
    <a href="/dashboard" class="hover:text-[#2d5a2d] transition-colors mr-2 flex-shrink-0">
      lawn.
    </a>
    {#each paths as path, index}
      <div class={`${paths.length >= 2 && index < paths.length - 1 ? 'hidden sm:flex' : 'flex'} items-center min-w-0 flex-shrink`}>
        <span class="text-[#888] mr-2 flex-shrink-0">/</span>
        {#if path.href}
          <a href={path.href} class="hover:text-[#2d5a2d] transition-colors truncate mr-2">
            {path.label}
          </a>
        {:else}
          <div class="truncate flex items-center gap-3">
            {path.label}
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <div class="row-start-1 col-start-2 sm:col-start-3 flex items-center gap-4 pl-4 border-l-2 border-[#1a1a1a]/10 h-8">
    {#if mounted}
      <button
        onclick={() => themeState.toggle()}
        class="w-8 h-8 flex items-center justify-center text-[#888] hover:text-[#1a1a1a] hover:bg-[#e8e8e0] transition-colors"
        title="Toggle theme"
        aria-label="Toggle theme"
      >
        {#if themeState.theme === "dark"}
          <span class="text-sm">☀</span>
        {:else}
          <span class="text-sm">☽</span>
        {/if}
      </button>
    {:else}
      <div class="w-8 h-8"></div>
    {/if}
    <div bind:this={userButtonContainer}></div>
  </div>

  {#if children}
    <div class="col-span-full pb-2 sm:pb-0 sm:col-span-1 sm:col-start-2 sm:row-start-1 flex items-center gap-2 sm:gap-3 sm:justify-end sm:h-14 sm:pl-4 min-w-0">
      {@render children?.()}
    </div>
  {/if}
</header>
