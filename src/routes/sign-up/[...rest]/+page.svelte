<script lang="ts">
  import { page } from "$app/state";

  import { clerkAppearance } from "@/lib/auth/clerk.svelte";
  import AuthShell from "@/lib/components/AuthShell.svelte";
  import ClerkMount from "@/lib/components/ClerkMount.svelte";
  import { seoHead } from "@/lib/seo";
  import { dashboardHomePath } from "@/lib/routes";

  const head = seoHead({
    title: "Sign up",
    description: "Create your lawn account and start collecting video feedback without per-seat pricing.",
    path: "/sign-up",
    noIndex: true,
  });

  const title = head.meta.find((tag) => "title" in tag)?.title ?? "Sign up | lawn";
  const metaTags = head.meta.filter((tag) => !("title" in tag));

  const redirectUrl = $derived(page.url.searchParams.get("redirect_url") ?? dashboardHomePath());
  const widgetOptions = $derived({
    routing: "path",
    path: page.url.pathname,
    signInUrl: "/sign-in",
    fallbackRedirectUrl: redirectUrl,
    appearance: clerkAppearance,
  });
</script>

<svelte:head>
  <title>{title}</title>
  {#each metaTags as tag}
    <meta {...tag} />
  {/each}
  {#each head.links as link}
    <link {...link} />
  {/each}
</svelte:head>

<AuthShell>
  <ClerkMount mount="sign-up" options={widgetOptions} class="mx-auto" />
</AuthShell>
