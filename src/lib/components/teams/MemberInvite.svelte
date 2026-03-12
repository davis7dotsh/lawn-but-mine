<script lang="ts">// pragma: allowlist secret
  import { api } from "@convex/_generated/api"; // pragma: allowlist secret
  import type { Id } from "@convex/_generated/dataModel"; // pragma: allowlist secret
  import { useConvexClient, useQuery } from "convex-svelte"; // pragma: allowlist secret
  import { Check, Copy, Trash2, UserPlus, X } from "lucide-svelte"; // pragma: allowlist secret
  import { getInitials } from "@/lib/utils"; // pragma: allowlist secret

  type Role = "admin" | "member" | "viewer"; // pragma: allowlist secret

  const roleLabels: Record<Role, string> = { // pragma: allowlist secret
    admin: "Admin", // pragma: allowlist secret
    member: "Member", // pragma: allowlist secret
    viewer: "Viewer", // pragma: allowlist secret
  }; // pragma: allowlist secret

  let { // pragma: allowlist secret
    teamId, // pragma: allowlist secret
    open, // pragma: allowlist secret
    onOpenChange, // pragma: allowlist secret
  }: { // pragma: allowlist secret
    teamId: Id<"teams">; // pragma: allowlist secret
    open: boolean; // pragma: allowlist secret
    onOpenChange: (open: boolean) => void; // pragma: allowlist secret
  } = $props(); // pragma: allowlist secret

  const convex = useConvexClient(); // pragma: allowlist secret
  const membersQuery = useQuery(api.teams.getMembers, () => (open ? { teamId } : "skip")); // pragma: allowlist secret
  const invitesQuery = useQuery(api.teams.getInvites, () => (open ? { teamId } : "skip")); // pragma: allowlist secret

  let email = $state(""); // pragma: allowlist secret
  let role = $state<Role>("member"); // pragma: allowlist secret
  let isLoading = $state(false); // pragma: allowlist secret
  let inviteLink = $state<string | null>(null); // pragma: allowlist secret
  let copied = $state(false); // pragma: allowlist secret

  const handleInvite = async (event: SubmitEvent) => { // pragma: allowlist secret
    event.preventDefault(); // pragma: allowlist secret
    if (!email.trim()) return; // pragma: allowlist secret

    isLoading = true; // pragma: allowlist secret
    try { // pragma: allowlist secret
      const token = await convex.mutation(api.teams.inviteMember, { // pragma: allowlist secret
        teamId, // pragma: allowlist secret
        email: email.trim(), // pragma: allowlist secret
        role, // pragma: allowlist secret
      }); // pragma: allowlist secret
      const baseUrl = typeof window !== "undefined" ? window.location.origin : ""; // pragma: allowlist secret
      inviteLink = `${baseUrl}/invite/${token}`; // pragma: allowlist secret
      email = ""; // pragma: allowlist secret
    } finally { // pragma: allowlist secret
      isLoading = false; // pragma: allowlist secret
    } // pragma: allowlist secret
  }; // pragma: allowlist secret

  const handleCopyLink = async () => { // pragma: allowlist secret
    if (!inviteLink) return; // pragma: allowlist secret
    await navigator.clipboard.writeText(inviteLink); // pragma: allowlist secret
    copied = true; // pragma: allowlist secret
    setTimeout(() => { // pragma: allowlist secret
      copied = false; // pragma: allowlist secret
    }, 2000); // pragma: allowlist secret
  }; // pragma: allowlist secret

  const handleRemoveMember = async (membershipId: Id<"teamMembers">) => { // pragma: allowlist secret
    await convex.mutation(api.teams.removeMember, { // pragma: allowlist secret
      teamId, // pragma: allowlist secret
      membershipId, // pragma: allowlist secret
    }); // pragma: allowlist secret
  }; // pragma: allowlist secret

  const handleUpdateRole = async (membershipId: Id<"teamMembers">, nextRole: Role) => { // pragma: allowlist secret
    await convex.mutation(api.teams.updateMemberRole, { // pragma: allowlist secret
      teamId, // pragma: allowlist secret
      membershipId, // pragma: allowlist secret
      role: nextRole, // pragma: allowlist secret
    }); // pragma: allowlist secret
  }; // pragma: allowlist secret
</script>

{#if open}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <button
      type="button"
      class="absolute inset-0 bg-[#1a1a1a]/40"
      aria-label="Close members dialog"
      on:click={() => onOpenChange(false)}
    ></button>

    <div class="relative w-full max-w-2xl border-2 border-[#1a1a1a] bg-[#f0f0e8] p-6 shadow-[8px_8px_0px_0px_var(--shadow-color)] max-h-[90vh] overflow-y-auto">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-lg font-black text-[#1a1a1a]">Team members</h2>
          <p class="mt-1 text-sm text-[#888]">Invite new members or manage existing ones.</p>
        </div>
        <button
          type="button"
          class="inline-flex h-8 w-8 items-center justify-center border-2 border-[#1a1a1a] hover:bg-[#e8e8e0]"
          aria-label="Close"
          on:click={() => onOpenChange(false)}
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <form class="mt-6 space-y-3" on:submit={handleInvite}>
        <div class="flex flex-col gap-2 sm:flex-row">
          <input
            bind:value={email}
            type="email"
            placeholder="Email address"
            class="min-w-0 flex-1 border-2 border-[#1a1a1a] bg-[#f0f0e8] px-3 py-2 text-sm outline-none"
          />
          <select
            bind:value={role}
            class="border-2 border-[#1a1a1a] bg-[#f0f0e8] px-3 py-2 text-sm font-bold outline-none"
          >
            <option value="admin">Admin</option>
            <option value="member">Member</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
        <button
          type="submit"
          class="inline-flex w-full items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-3 py-2 text-sm font-bold text-[#f0f0e8] hover:bg-[#2d5a2d] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!email.trim() || isLoading}
        >
          <UserPlus class="mr-2 h-4 w-4" />
          {isLoading ? "Sending..." : "Send invite"}
        </button>
      </form>

      {#if inviteLink}
        <div class="mt-4 border-2 border-[#1a1a1a] bg-[#e8e8e0] p-3">
          <p class="mb-2 text-sm text-[#888]">Share this link with the invitee:</p>
          <div class="flex gap-2">
            <input
              value={inviteLink}
              readonly
              class="min-w-0 flex-1 border-2 border-[#1a1a1a] bg-[#f0f0e8] px-3 py-2 text-sm outline-none"
            />
            <button
              type="button"
              class="inline-flex h-10 w-10 items-center justify-center border-2 border-[#1a1a1a] hover:bg-[#f0f0e8]"
              on:click={handleCopyLink}
            >
              {#if copied}
                <Check class="h-4 w-4" />
              {:else}
                <Copy class="h-4 w-4" />
              {/if}
            </button>
          </div>
        </div>
      {/if}

      <div class="mt-6 space-y-2">
        <h3 class="text-sm font-bold text-[#1a1a1a]">Current members</h3>
        <div class="space-y-2">
          {#if membersQuery.data}
            {#each membersQuery.data as member}
              <div class="flex items-center justify-between gap-3 border-2 border-[#1a1a1a] p-3">
                <div class="flex min-w-0 items-center gap-3">
                  {#if member.userAvatarUrl}
                    <img
                      src={member.userAvatarUrl}
                      alt={member.userName}
                      class="h-9 w-9 border-2 border-[#1a1a1a] object-cover"
                    />
                  {:else}
                    <div class="flex h-9 w-9 items-center justify-center border-2 border-[#1a1a1a] bg-[#e8e8e0] text-xs font-bold text-[#1a1a1a]">
                      {getInitials(member.userName)}
                    </div>
                  {/if}

                  <div class="min-w-0">
                    <p class="truncate text-sm font-bold text-[#1a1a1a]">{member.userName}</p>
                    <p class="truncate text-xs text-[#888]">{member.userEmail}</p>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  {#if member.role === "owner"}
                    <span class="border-2 border-[#1a1a1a] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#888]">
                      Owner
                    </span>
                  {:else}
                    <div class="flex items-center gap-2">
                      <select
                        value={member.role}
                        class="border-2 border-[#1a1a1a] bg-[#f0f0e8] px-2 py-1 text-xs font-bold outline-none"
                        on:change={(event) =>
                          handleUpdateRole(member._id, (event.currentTarget as HTMLSelectElement).value as Role)}
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <button
                        type="button"
                        class="inline-flex h-8 w-8 items-center justify-center border-2 border-[#dc2626] text-[#dc2626] hover:bg-[#dc2626]/10"
                        on:click={() => handleRemoveMember(member._id)}
                      >
                        <Trash2 class="h-4 w-4" />
                      </button>
                    </div>
                  {/if}
                </div>
              </div>
            {/each}
          {:else}
            <p class="text-sm text-[#888]">Loading members...</p>
          {/if}
        </div>
      </div>

      {#if invitesQuery.data && invitesQuery.data.length > 0}
        <div class="mt-6 space-y-2">
          <h3 class="text-sm font-bold text-[#1a1a1a]">Pending invites</h3>
          <div class="space-y-2">
            {#each invitesQuery.data as invite}
              <div class="flex items-center justify-between gap-3 border-2 border-[#1a1a1a] bg-[#e8e8e0] p-3">
                <div class="min-w-0">
                  <p class="truncate text-sm text-[#1a1a1a]">{invite.email}</p>
                  <p class="text-xs text-[#888]">Invited as {roleLabels[invite.role as Role]}</p>
                </div>
                <span class="border-2 border-[#1a1a1a] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#888]">
                  Pending
                </span>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}
