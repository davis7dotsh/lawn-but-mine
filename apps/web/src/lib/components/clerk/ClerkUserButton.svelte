<script lang="ts">
  import ClerkMount from "@/lib/components/ClerkMount.svelte";
  import { clerkAppearance } from "@/lib/auth/clerk.svelte";

  let { afterSignOutUrl = "/" }: { afterSignOutUrl?: string } = $props();

  const options = $derived({
    afterSignOutUrl,
    appearance: clerkAppearance,
  });
</script>

<ClerkMount mount="user-button" options={options} />
