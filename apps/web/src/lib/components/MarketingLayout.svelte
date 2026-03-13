<script lang="ts">
  import type { Snippet } from "svelte";

  import MarketingFooter from "@/lib/components/MarketingFooter.svelte";
  import MarketingNav from "@/lib/components/MarketingNav.svelte";
  import { marketingThemeStyle } from "@/lib/theme.svelte";

  let { children }: { children?: Snippet } = $props();
</script>

<div
  class="min-h-screen font-mono selection:bg-[#2d5a2d] selection:text-[#f0f0e8]"
  style={`${marketingThemeStyle}; background-color: var(--background); color: var(--foreground);`}
>
  <MarketingNav />
  <main class="pt-16">
    {#if children}
      {@render children()}
    {/if}
  </main>
  <MarketingFooter />
</div>
