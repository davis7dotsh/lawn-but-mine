<script lang="ts">
  import { useQuery, useConvexClient } from "convex-svelte";
  import { api } from "@convex/_generated/api";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import Button from "$lib/components/ui/Button.svelte";
  import Input from "$lib/components/ui/Input.svelte";
  import Badge from "$lib/components/ui/Badge.svelte";
  import DashboardHeader from "$lib/components/DashboardHeader.svelte";
  import { TEAM_PLAN_LABELS, TEAM_PLAN_MONTHLY_PRICE_USD, TEAM_PLAN_STORAGE_LIMIT_BYTES, TEAM_PLAN_SEATS, TEAM_TRIAL_DAYS, normalizeTeamPlan, shouldRefreshBilling } from "$lib/shared/billingPlans";
  import type { TeamPlan } from "$lib/shared/billingPlans";

  let teamSlug = $derived($page.params.teamSlug);
  const client = useConvexClient();

  const context = useQuery(api.workspace.resolveContext, () => ({ teamSlug }));
  const team = $derived(context.data?.team);
  const members = useQuery(api.teams.getMembers, () => team ? { teamId: team._id } : "skip");
  const billing = useQuery(api.billing.getTeamBilling, () => team ? { teamId: team._id } : "skip");

  let isEditingName = $state(false);
  let editedName = $state("");
  let isCheckingOutPlan = $state<string | null>(null);
  let isOpeningPortal = $state(false);
  let billingError = $state<string | null>(null);

  $effect(() => {
    if (!team || billing.data === undefined) return;
    const search = typeof window === "undefined" ? "" : window.location.search;
    const forceRefresh = search.includes("billing=success") || search.includes("billing=cancel");
    if (!shouldRefreshBilling(billing.data?.billingLastSyncedAt, forceRefresh)) return;
    client.action(api.billing.refreshTeamBilling, { teamId: team._id }).catch((error: unknown) => {
      console.warn("Billing refresh failed", error);
    });
  });

  const isOwner = $derived(team?.role === "owner");
  const plan = $derived(billing.data?.plan ?? normalizeTeamPlan(team?.plan ?? "basic"));
  const hasActiveSubscription = $derived(billing.data?.hasActiveSubscription ?? false);
  const subscriptionStatus = $derived(billing.data?.subscriptionStatus ?? "not_subscribed");
  const isTrialing = $derived(subscriptionStatus === "trialing");

  const GIBIBYTE = 1024 ** 3;
  const TEBIBYTE = 1024 ** 4;
  function formatBytes(bytes: number): string {
    if (bytes >= TEBIBYTE) return `${(bytes / TEBIBYTE).toFixed(1)} TB`;
    return `${(bytes / GIBIBYTE).toFixed(1)} GB`;
  }

  const storageUsed = $derived(billing.data?.storageUsedBytes ?? 0);
  const storageLimit = $derived(TEAM_PLAN_STORAGE_LIMIT_BYTES[plan as TeamPlan] ?? TEAM_PLAN_STORAGE_LIMIT_BYTES.basic);
  const storagePct = $derived(storageLimit > 0 ? Math.min((storageUsed / storageLimit) * 100, 100) : 0);

  async function handleSaveName() {
    if (!editedName.trim() || !team) return;
    try {
      await client.mutation(api.teams.update, { teamId: team._id, name: editedName.trim() });
      isEditingName = false;
    } catch (error) {
      console.error("Failed to update team name:", error);
    }
  }

  async function handleStartCheckout(targetPlan: string) {
    if (typeof window === "undefined" || !team) return;
    billingError = null;
    isCheckingOutPlan = targetPlan;
    try {
      const settingsPath = `/dashboard/${team.slug}/settings`;
      const successUrl = `${window.location.origin}${settingsPath}?billing=success`;
      const cancelUrl = `${window.location.origin}${settingsPath}?billing=cancel`;
      const session = await client.action(api.billing.startCheckout, { teamId: team._id, plan: targetPlan as any, successUrl, cancelUrl });
      if (session.url) { window.location.assign(session.url); return; }
      if (session.applied) { await client.action(api.billing.refreshTeamBilling, { teamId: team._id }); return; }
      throw new Error("Billing checkout did not return a redirect URL.");
    } catch (error) {
      billingError = error instanceof Error ? error.message : "Unable to start checkout.";
    } finally {
      isCheckingOutPlan = null;
    }
  }

  async function handleOpenPortal() {
    if (typeof window === "undefined" || !team) return;
    billingError = null;
    isOpeningPortal = true;
    try {
      const returnUrl = `${window.location.origin}/dashboard/${team.slug}/settings`;
      const session = await client.action(api.billing.openBillingPortal, { teamId: team._id, returnUrl });
      window.location.assign(session.url);
    } catch (error) {
      billingError = error instanceof Error ? error.message : "Unable to open billing portal.";
    } finally {
      isOpeningPortal = false;
    }
  }

  async function handleDeleteTeam() {
    if (!team || hasActiveSubscription) return;
    if (!confirm("Are you sure you want to delete this team? This action cannot be undone.")) return;
    try {
      await client.mutation(api.teams.deleteTeam, { teamId: team._id });
      goto("/dashboard");
    } catch (error) {
      console.error("Failed to delete team:", error);
    }
  }
</script>

<svelte:head><title>Settings — {team?.name ?? "Team"} — lawn</title></svelte:head>

{#if context.data === undefined}
  <div class="flex items-center justify-center h-full"><div class="text-[#888]">Loading...</div></div>
{:else if context.data === null}
  <div class="flex items-center justify-center h-full"><div class="text-[#888]">Team not found</div></div>
{:else}
  <div class="h-full flex flex-col">
    <DashboardHeader paths={[{ label: team?.slug ?? "team", href: `/dashboard/${team?.slug}` }, { label: "settings" }]} />

    <div class="flex-1 overflow-auto">
      <div class="max-w-5xl mx-auto px-6 lg:px-8 py-8">
        <div class="mb-8">
          {#if isEditingName}
            <div class="flex items-center gap-3">
              <Input value={editedName} oninput={(e) => editedName = e.currentTarget.value} class="text-4xl font-black" autofocus onkeydown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") isEditingName = false; }} />
              <Button size="sm" onclick={handleSaveName}>Save</Button>
              <Button size="sm" variant="ghost" onclick={() => isEditingName = false}>Cancel</Button>
            </div>
          {:else}
            <div class="flex items-baseline gap-3 group">
              <h1 class="text-4xl lg:text-5xl font-black tracking-tight text-[#1a1a1a]">{team?.name}</h1>
              {#if isOwner}
                <button onclick={() => { editedName = team?.name ?? ""; isEditingName = true; }} class="text-[#888] hover:text-[#1a1a1a] transition-colors opacity-0 group-hover:opacity-100">✏</button>
              {/if}
            </div>
          {/if}
        </div>

        <div class="border-t-2 border-b-2 border-[#1a1a1a] py-5 mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-12">
          <div>
            <p class="text-[10px] uppercase tracking-[0.2em] text-[#888] mb-1">Plan</p>
            <div class="flex items-center gap-2">
              <span class="text-xl font-black text-[#1a1a1a]">{hasActiveSubscription ? TEAM_PLAN_LABELS[plan as TeamPlan] ?? plan : "Unpaid"}</span>
              {#if hasActiveSubscription}
                <Badge variant={isTrialing ? "warning" : "success"}>{isTrialing ? "Trialing" : "Active"}</Badge>
              {:else}
                <Badge variant="warning">{subscriptionStatus}</Badge>
              {/if}
            </div>
          </div>
          <div>
            <p class="text-[10px] uppercase tracking-[0.2em] text-[#888] mb-1">Storage</p>
            <p class="text-xl font-black text-[#1a1a1a]">{billing.data ? formatBytes(storageUsed) : "—"} <span class="text-sm font-bold text-[#888]">/ {formatBytes(storageLimit)}</span></p>
            <div class="h-1.5 bg-[#ddd] mt-2"><div class="h-full bg-[#2d5a2d] transition-all duration-500" style="width: {storagePct}%"></div></div>
          </div>
          <div>
            <p class="text-[10px] uppercase tracking-[0.2em] text-[#888] mb-1">Seats</p>
            <p class="text-xl font-black text-[#1a1a1a]">{TEAM_PLAN_SEATS}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          <div class="lg:col-span-3">
            <h2 class="text-[10px] uppercase tracking-[0.2em] font-bold text-[#888] mb-4">Plans</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {#each (["basic", "pro"] as const) as planId}
                {@const isCurrentPlan = planId === plan && hasActiveSubscription}
                <div class={`border-2 p-5 transition-colors ${isCurrentPlan ? "border-[#2d5a2d] bg-[#2d5a2d] text-[#f0f0e8]" : "border-[#1a1a1a] bg-[#f0f0e8]"}`}>
                  <div class="flex items-center justify-between mb-3">
                    <p class={`text-sm font-bold uppercase tracking-wider ${isCurrentPlan ? "text-[#f0f0e8]" : "text-[#888]"}`}>{TEAM_PLAN_LABELS[planId]}</p>
                    {#if isCurrentPlan}<span class="text-[#7cb87c]">✓</span>{/if}
                  </div>
                  <p class={`text-3xl font-black ${isCurrentPlan ? "text-[#f0f0e8]" : "text-[#1a1a1a]"}`}>${TEAM_PLAN_MONTHLY_PRICE_USD[planId]}<span class={`text-sm font-bold ${isCurrentPlan ? "text-[#7cb87c]" : "text-[#888]"}`}>/mo</span></p>
                  <div class={`text-sm mt-3 space-y-0.5 ${isCurrentPlan ? "text-[#c8e0c8]" : "text-[#888]"}`}>
                    <p>{TEAM_PLAN_SEATS} seats</p>
                    <p>{formatBytes(TEAM_PLAN_STORAGE_LIMIT_BYTES[planId])} storage</p>
                  </div>
                  {#if isOwner && !hasActiveSubscription}
                    <Button variant={planId === "pro" ? "primary" : "default"} class="w-full mt-4" disabled={isCheckingOutPlan !== null} onclick={() => handleStartCheckout(planId)}>
                      {isCheckingOutPlan === planId ? "Redirecting..." : `Start ${TEAM_PLAN_LABELS[planId]} Trial`}
                    </Button>
                  {/if}
                </div>
              {/each}
            </div>
            {#if isOwner && hasActiveSubscription}
              <Button variant="outline" class="w-full mt-4" disabled={isOpeningPortal} onclick={handleOpenPortal}>
                {isOpeningPortal ? "Opening billing portal..." : "Manage subscription"}
              </Button>
            {/if}
            {#if billingError}
              <p class="text-sm font-bold text-[#dc2626] mt-3">{billingError}</p>
            {/if}
          </div>

          <div class="lg:col-span-2">
            <h2 class="text-[10px] uppercase tracking-[0.2em] font-bold text-[#888] mb-4">Members <span class="ml-2 text-[#1a1a1a]">{members.data?.length ?? 0}</span></h2>
            <div class="border-t-2 border-[#1a1a1a]">
              {#each (members.data ?? []).slice(0, 8) as member}
                <div class="flex items-center justify-between py-3 border-b border-[#ccc]">
                  <div class="min-w-0">
                    <p class="font-bold text-sm text-[#1a1a1a] truncate">{member.userName}</p>
                    <p class="text-xs text-[#888] truncate">{member.userEmail}</p>
                  </div>
                  <span class="text-[10px] font-bold uppercase tracking-[0.15em] text-[#888] shrink-0 ml-3">{member.role}</span>
                </div>
              {/each}
            </div>
          </div>
        </div>

        {#if isOwner}
          <div class="border-t-2 border-[#dc2626]/30 mt-16 pt-6 flex items-center justify-between">
            <div>
              <p class="text-sm font-bold text-[#1a1a1a]">Delete team</p>
              <p class="text-xs text-[#888] mt-0.5">{!hasActiveSubscription ? "Permanently remove this team." : "Cancel subscription first."}</p>
            </div>
            <Button variant="destructive" size="sm" onclick={handleDeleteTeam} disabled={hasActiveSubscription}>Delete</Button>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
