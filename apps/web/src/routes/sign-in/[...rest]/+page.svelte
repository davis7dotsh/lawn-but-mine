<script lang="ts">
  import { page } from "$app/state";

  import { clerkAppearance } from "@/lib/auth/clerk.svelte";
  import AuthShell from "@/lib/components/AuthShell.svelte";
  import ClerkMount from "@/lib/components/ClerkMount.svelte";
  import { seoHead } from "@/lib/seo";
  import { dashboardHomePath } from "@/lib/routes";

  const head = seoHead({
    title: "Sign in",
    description: "Sign in to lawn to review videos, manage your team, and get back to work.",
    path: "/sign-in",
    noIndex: true,
  });

  const title = head.meta.find((tag) => "title" in tag)?.title ?? "Sign in | lawn";
  const metaTags = head.meta.filter((tag) => !("title" in tag));

  const redirectUrl = $derived(page.url.searchParams.get("redirect_url") ?? dashboardHomePath());
  const widgetOptions = $derived({
    routing: "path",
    path: page.url.pathname,
    signUpUrl: "/sign-up",
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
  <ClerkMount mount="sign-in" options={widgetOptions} class="mx-auto" />
</AuthShell>
