<script lang="ts">// pragma: allowlist secret
  import { goto } from "$app/navigation"; // pragma: allowlist secret
  import { page } from "$app/state";
  import { setConvexClientContext, useQuery } from "convex-svelte";
  import { AlertCircle, Check, Mail, Users } from "lucide-svelte";
  import { api } from "@convex/_generated/api";
  import { teamHomePath } from "@/lib/routes";
  import {
    buildSignInHref,
    clerkAuth,
    getSharedConvexClient,
    normalizeEmail,
  } from "@/lib/useVideoPresence";

  const convex = getSharedConvexClient();
  setConvexClientContext(convex);

  const auth = clerkAuth;
  const token = $derived(page.params.token ?? "");
  const signInHref = $derived(buildSignInHref(`/invite/${token}`));

  const inviteQuery = useQuery(api.teams.getInviteByToken, () =>
    token ? { token } : "skip",
  );

  const invite = $derived(inviteQuery.data);
  const signedInEmail = $derived(normalizeEmail($auth.user?.email));

  let isAccepting = $state(false);
  let error = $state<string | null>(null);

  async function acceptInvite() {
    if (!token || isAccepting) {
      return;
    }

    isAccepting = true;
    error = null;

    try {
      const team = await convex.mutation(api.teams.acceptInvite, { token });
      if (team?.slug) {
        await goto(teamHomePath(team.slug));
      }
    } catch (cause) {
      error = cause instanceof Error ? cause.message : "Failed to accept invite";
    } finally {
      isAccepting = false;
    }
  }
</script>

<svelte:head>
  <title>Join team</title>
  <meta name="description" content="Accept your team invitation on lawn." />
  <meta name="robots" content="noindex" />
</svelte:head>

{#if invite === undefined || !$auth.isLoaded}
  <div class="flex min-h-screen items-center justify-center bg-[#f0f0e8]">
    <div class="text-[#888]">Loading...</div>
  </div>
{:else if invite === null}
  <div class="flex min-h-screen items-center justify-center bg-[#f0f0e8] p-4">
    <div class="w-full max-w-md border-2 border-[#1a1a1a] bg-[#f0f0e8] p-6">
      <div class="text-center">
        <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center border-2 border-[#dc2626] bg-[#dc2626]/10">
          <AlertCircle class="h-6 w-6 text-[#dc2626]" />
        </div>
        <h1 class="text-xl font-black text-[#1a1a1a]">Invalid or expired invite</h1>
        <p class="mt-2 text-sm text-[#888]">
          This invite link is no longer valid. Please ask for a new invitation.
        </p>
      </div>

      <a
        href="/"
        class="mt-6 inline-flex w-full items-center justify-center border-2 border-[#1a1a1a] px-4 py-2 text-sm font-bold text-[#1a1a1a] transition hover:bg-[#1a1a1a] hover:text-[#f0f0e8]"
      >
        Go to lawn
      </a>
    </div>
  </div>
{:else if !$auth.isSignedIn}
  <div class="flex min-h-screen items-center justify-center bg-[#f0f0e8] p-4">
    <div class="w-full max-w-md border-2 border-[#1a1a1a] bg-[#f0f0e8] p-6">
      <div class="text-center">
        <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center border-2 border-[#1a1a1a] bg-[#e8e8e0]">
          <Users class="h-6 w-6 text-[#888]" />
        </div>
        <h1 class="text-xl font-black text-[#1a1a1a]">You're invited to {invite.team?.name}</h1>
        <p class="mt-2 text-sm text-[#888]">
          {invite.invitedBy} has invited you to join as a {invite.role}.
        </p>
      </div>

      <div class="mt-6 space-y-4">
        <div class="flex items-center gap-3 border-2 border-[#1a1a1a] bg-[#e8e8e0] p-3">
          <Mail class="h-5 w-5 text-[#888]" />
          <div>
            <p class="text-sm text-[#888]">Invited email</p>
            <p class="font-bold text-[#1a1a1a]">{invite.email}</p>
          </div>
        </div>

        <p class="text-center text-sm text-[#888]">
          Sign in with the email address above to accept this invite.
        </p>

        <a
          href={signInHref}
          class="inline-flex w-full items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-4 py-2 text-sm font-bold text-[#f0f0e8] transition hover:bg-[#2d5a2d]"
        >
          Sign in to accept
        </a>
      </div>
    </div>
  </div>
{:else if signedInEmail !== normalizeEmail(invite.email)}
  <div class="flex min-h-screen items-center justify-center bg-[#f0f0e8] p-4">
    <div class="w-full max-w-md border-2 border-[#1a1a1a] bg-[#f0f0e8] p-6">
      <div class="text-center">
        <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center border-2 border-[#ca8a04] bg-[#ca8a04]/10">
          <AlertCircle class="h-6 w-6 text-[#ca8a04]" />
        </div>
        <h1 class="text-xl font-black text-[#1a1a1a]">Different email address</h1>
        <p class="mt-2 text-sm text-[#888]">
          This invite was sent to {invite.email}, but you're signed in as {$auth.user?.email}.
        </p>
      </div>

      <div class="mt-6 space-y-4">
        <p class="text-center text-sm text-[#888]">
          Please sign in with the correct email address to accept this invite.
        </p>

        <a
          href={signInHref}
          class="inline-flex w-full items-center justify-center border-2 border-[#1a1a1a] px-4 py-2 text-sm font-bold text-[#1a1a1a] transition hover:bg-[#1a1a1a] hover:text-[#f0f0e8]"
        >
          Sign in with different account
        </a>
      </div>
    </div>
  </div>
{:else}
  <div class="flex min-h-screen items-center justify-center bg-[#f0f0e8] p-4">
    <div class="w-full max-w-md border-2 border-[#1a1a1a] bg-[#f0f0e8] p-6">
      <div class="text-center">
        <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center border-2 border-[#1a1a1a] bg-[#e8e8e0]">
          <Users class="h-6 w-6 text-[#888]" />
        </div>
        <h1 class="text-xl font-black text-[#1a1a1a]">Join {invite.team?.name}</h1>
        <p class="mt-2 text-sm text-[#888]">
          {invite.invitedBy} has invited you to join as a
          <span class="ml-2 inline-flex border border-[#1a1a1a] bg-[#e8e8e0] px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-[#1a1a1a]">
            {invite.role}
          </span>
        </p>
      </div>

      <div class="mt-6 space-y-4">
        {#if error}
          <div class="border-2 border-[#dc2626] bg-[#dc2626]/10 p-3 text-sm text-[#dc2626]">
            {error}
          </div>
        {/if}

        <button
          type="button"
          class="inline-flex w-full items-center justify-center gap-2 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-4 py-2 text-sm font-bold text-[#f0f0e8] transition hover:bg-[#2d5a2d] disabled:cursor-not-allowed disabled:opacity-60"
          onclick={acceptInvite}
          disabled={isAccepting}
        >
          {#if isAccepting}
            Joining...
          {:else}
            <Check class="h-4 w-4" />
            Accept invitation
          {/if}
        </button>

        <a
          href="/"
          class="inline-flex w-full items-center justify-center border-2 border-transparent px-4 py-2 text-sm font-bold text-[#1a1a1a] transition hover:border-[#1a1a1a]"
        >
          Decline
        </a>
      </div>
    </div>
  </div>
{/if}
