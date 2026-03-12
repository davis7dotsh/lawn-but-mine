<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { loadClerk } from "$lib/clerk";
  import { get } from "svelte/store";

  let { children } = $props();
  let authState = $state<"loading" | "authenticated" | "unauthenticated">("loading");

  let unsubscribe: (() => void) | null = null;
  onMount(() => {
    loadClerk().then((clerk) => {
      const checkAuth = () => {
        if (clerk.user) {
          authState = "authenticated";
        } else {
          authState = "unauthenticated";
          const redirectUrl = get(page).url.pathname + get(page).url.search;
          goto(`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`);
        }
      };

      checkAuth();
      unsubscribe = clerk.addListener(checkAuth);
    });
    return () => {
      unsubscribe?.();
    };
  });
</script>

{#if authState === "loading"}
  <div class="h-full flex items-center justify-center bg-[#f0f0e8]">
    <div class="text-[#888]">Loading...</div>
  </div>
{:else if authState === "unauthenticated"}
  <div class="h-full flex items-center justify-center bg-[#f0f0e8]">
    <div class="text-[#888]">Redirecting to sign in...</div>
  </div>
{:else}
  <div class="relative h-full flex flex-col bg-[#f0f0e8]">
    <main class="flex-1 overflow-auto flex flex-col">
      {@render children()}
    </main>
  </div>
{/if}
