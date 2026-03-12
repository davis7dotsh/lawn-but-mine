<script lang="ts">
  import type { Snippet } from "svelte";

  import "../app.css";

  import { browser } from "$app/environment";
  import { onMount } from "svelte";
  import { setupConvex } from "convex-svelte";

  import { initClerk } from "@/lib/auth/clerk.svelte";
  import { initTheme, themeInitScript } from "@/lib/theme.svelte";

  let { children }: { children?: Snippet } = $props();

  const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;

  if (browser && convexUrl) {
    setupConvex(convexUrl);
  }

  onMount(() => {
    initTheme();
    void initClerk();
  });
</script>

<svelte:head>
  <title>lawn — video review for creative teams</title>
  <meta
    name="description"
    content="Video review and collaboration for creative teams. Frame-accurate comments, unlimited seats, $5/month flat. The open source Frame.io alternative."
  />
  <meta property="og:site_name" content="lawn" />
  <meta name="twitter:site" content="@theo" />
  <link rel="icon" type="image/svg+xml" href="/grass-logo.svg?v=4" />
  <link rel="icon" type="image/x-icon" href="/favicon.ico?v=4" />
  <link rel="shortcut icon" href="/favicon.ico?v=4" />
  <link rel="preconnect" href="https://stream.mux.com" crossorigin="anonymous" />
  <link rel="preconnect" href="https://image.mux.com" crossorigin="anonymous" />
  <link rel="dns-prefetch" href="//stream.mux.com" />
  <link rel="dns-prefetch" href="//image.mux.com" />
  <script>{themeInitScript}</script>
</svelte:head>

{#if children}
  {@render children()}
{/if}
