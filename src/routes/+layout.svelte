<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { setupConvex, useConvexClient } from "convex-svelte";
  import { loadClerk } from "$lib/clerk";

  let { children } = $props();

  const convexUrl = import.meta.env.VITE_CONVEX_URL;
  setupConvex(convexUrl);

  onMount(() => {
    const client = useConvexClient();
    loadClerk().then((clerk) => {
      const syncAuth = () => {
        const session = clerk.session;
        if (session) {
          client.setAuth(async () => {
            const token = await session.getToken({ template: "convex" });
            return token ?? null;
          });
        } else {
          client.setAuth(null as unknown as Parameters<typeof client.setAuth>[0]);
        }
      };
      syncAuth();
      clerk.addListener(() => syncAuth());
    });
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
</svelte:head>

{@render children()}
