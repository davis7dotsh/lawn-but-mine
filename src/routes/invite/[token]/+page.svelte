<script lang="ts">
  import { useQuery, useConvexClient } from "convex-svelte";
  import { api } from "@convex/_generated/api";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { loadClerk } from "$lib/clerk";
  import Button from "$lib/components/ui/Button.svelte";
  import Card from "$lib/components/ui/Card.svelte";
  import CardHeader from "$lib/components/ui/CardHeader.svelte";
  import CardTitle from "$lib/components/ui/CardTitle.svelte";
  import CardDescription from "$lib/components/ui/CardDescription.svelte";
  import CardContent from "$lib/components/ui/CardContent.svelte";

  let token = $derived($page.params.token ?? "");
  const client = useConvexClient();

  const invite = useQuery(api.teams.getInviteByToken, () => token ? { token } : "skip");

  let isAccepting = $state(false);
  let acceptError = $state<string | null>(null);
  let isUserSignedIn = $state(false);
  let userEmail = $state<string | null>(null);

  onMount(async () => {
    try {
      const clerk = await loadClerk();
      isUserSignedIn = !!clerk.user;
      userEmail = clerk.user?.primaryEmailAddress?.emailAddress ?? null;
      clerk.addListener(() => {
        isUserSignedIn = !!clerk.user;
        userEmail = clerk.user?.primaryEmailAddress?.emailAddress ?? null;
      });
    } catch {}
  });

  async function handleAccept() {
    if (isAccepting) return;
    isAccepting = true;
    acceptError = null;
    try {
      const team = await client.mutation(api.teams.acceptInvite, { token: token as string });
      if (team?.slug) {
        goto(`/dashboard/${team.slug}`);
      } else {
        goto("/dashboard");
      }
    } catch (error) {
      acceptError = error instanceof Error ? error.message : "Failed to accept invite.";
    } finally {
      isAccepting = false;
    }
  }
</script>

<svelte:head><title>Team Invite — lawn</title></svelte:head>

<div class="min-h-screen bg-[#f0f0e8] flex items-center justify-center p-4">
  {#if invite.data === undefined}
    <div class="text-[#888]">Loading...</div>
  {:else if invite.data === null}
    <Card class="max-w-md w-full">
      <CardHeader class="text-center">
        <CardTitle>Invite not found</CardTitle>
        <CardDescription>This invite link is invalid or has expired.</CardDescription>
      </CardHeader>
      <CardContent>
        <a href="/" class="block"><Button variant="outline" class="w-full">Go to lawn</Button></a>
      </CardContent>
    </Card>
  {:else}
    <Card class="max-w-md w-full">
      <CardHeader class="text-center">
        <CardTitle>Join {invite.data.team?.name ?? "a team"}</CardTitle>
        <CardDescription>
          {invite.data.invitedBy} invited {invite.data.email} to join as <span class="font-bold text-[#1a1a1a]">{invite.data.role}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {#if !isUserSignedIn}
          <div class="space-y-4">
            <p class="text-sm text-[#888] text-center">Sign in with <span class="font-bold text-[#1a1a1a]">{invite.data.email}</span> to accept this invite.</p>
            <a href={`/sign-in?redirect_url=${encodeURIComponent(`/invite/${token}`)}`} class="block">
              <Button class="w-full">Sign in</Button>
            </a>
            <a href={`/sign-up?redirect_url=${encodeURIComponent(`/invite/${token}`)}`} class="block">
              <Button variant="outline" class="w-full">Create account</Button>
            </a>
          </div>
        {:else}
          <div class="space-y-4">
            {#if userEmail && userEmail.toLowerCase() !== invite.data.email.toLowerCase()}
              <div class="border-2 border-[#ca8a04] bg-[#ca8a04]/10 p-3">
                <p class="text-sm font-bold text-[#ca8a04]">Email mismatch</p>
                <p class="text-xs text-[#888] mt-1">You're signed in as <span class="font-bold text-[#1a1a1a]">{userEmail}</span>, but this invite is for <span class="font-bold text-[#1a1a1a]">{invite.data.email}</span>.</p>
              </div>
            {/if}
            {#if acceptError}
              <p class="text-sm font-bold text-[#dc2626]">{acceptError}</p>
            {/if}
            <Button class="w-full" onclick={handleAccept} disabled={isAccepting}>
              {isAccepting ? "Joining..." : `Join ${invite.data.team?.name ?? "team"}`}
            </Button>
            <a href="/dashboard" class="block">
              <Button variant="ghost" class="w-full">Back to dashboard</Button>
            </a>
          </div>
        {/if}
      </CardContent>
    </Card>
  {/if}
</div>
