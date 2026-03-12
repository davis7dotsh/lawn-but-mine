<script lang="ts">
  import { onMount } from "svelte";
  import { loadClerk, getClerk } from "$lib/clerk";

  let container: HTMLDivElement;

  onMount(() => {
    loadClerk().then((clerk) => {
      clerk.mountSignUp(container, {
        fallbackRedirectUrl: "/dashboard",
        appearance: {
          variables: { colorPrimary: "#2d5a2d", colorBackground: "#f0f0e8", borderRadius: "0rem" },
        },
      });
    });
    return () => {
      getClerk().unmountSignUp(container);
    };
  });
</script>

<div class="min-h-screen bg-[#f0f0e8] flex flex-col items-center justify-center p-4">
  <a href="/" class="text-3xl font-black tracking-tighter text-[#1a1a1a] mb-8">lawn.</a>
  <div bind:this={container}></div>
</div>
