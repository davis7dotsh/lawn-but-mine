<script lang="ts">// pragma: allowlist secret
  import { goto } from "$app/navigation"; // pragma: allowlist secret
  import { browser } from "$app/environment"; // pragma: allowlist secret
  import { page } from "$app/state"; // pragma: allowlist secret
  import { api } from "@convex/_generated/api"; // pragma: allowlist secret
  import { useConvexClient, useQuery } from "convex-svelte"; // pragma: allowlist secret
  import { Check, CreditCard, Pencil, Trash2, X } from "lucide-svelte"; // pragma: allowlist secret
  import DashboardHeader from "@/lib/components/DashboardHeader.svelte"; // pragma: allowlist secret
  import MemberInvite from "@/lib/components/teams/MemberInvite.svelte"; // pragma: allowlist secret
  import { makeRouteQuerySpec, prewarmSpecs } from "@/lib/convex/prewarm"; // pragma: allowlist secret
  import { dashboardHomePath, teamHomePath } from "@/lib/routes"; // pragma: allowlist secret
  import { // pragma: allowlist secret
    TEAM_PLAN_LABELS, // pragma: allowlist secret
    TEAM_PLAN_MONTHLY_PRICE_USD, // pragma: allowlist secret
    TEAM_PLAN_SEATS, // pragma: allowlist secret
    TEAM_PLAN_STORAGE_LIMIT_BYTES, // pragma: allowlist secret
    TEAM_TRIAL_DAYS, // pragma: allowlist secret
    normalizeTeamPlan, // pragma: allowlist secret
    shouldRefreshBilling, // pragma: allowlist secret
    type TeamPlan as BillingPlan, // pragma: allowlist secret
  } from "@/shared/billingPlans"; // pragma: allowlist secret

  const GIBIBYTE = 1024 ** 3; // pragma: allowlist secret
  const TEBIBYTE = 1024 ** 4; // pragma: allowlist secret

  const BILLING_PLANS: Record< // pragma: allowlist secret
    BillingPlan, // pragma: allowlist secret
    { // pragma: allowlist secret
      label: string; // pragma: allowlist secret
      monthlyPriceUsd: number; // pragma: allowlist secret
      storageLimitBytes: number; // pragma: allowlist secret
      seats: string; // pragma: allowlist secret
    } // pragma: allowlist secret
  > = { // pragma: allowlist secret
    basic: { // pragma: allowlist secret
      label: TEAM_PLAN_LABELS.basic, // pragma: allowlist secret
      monthlyPriceUsd: TEAM_PLAN_MONTHLY_PRICE_USD.basic, // pragma: allowlist secret
      storageLimitBytes: TEAM_PLAN_STORAGE_LIMIT_BYTES.basic, // pragma: allowlist secret
      seats: TEAM_PLAN_SEATS, // pragma: allowlist secret
    }, // pragma: allowlist secret
    pro: { // pragma: allowlist secret
      label: TEAM_PLAN_LABELS.pro, // pragma: allowlist secret
      monthlyPriceUsd: TEAM_PLAN_MONTHLY_PRICE_USD.pro, // pragma: allowlist secret
      storageLimitBytes: TEAM_PLAN_STORAGE_LIMIT_BYTES.pro, // pragma: allowlist secret
      seats: TEAM_PLAN_SEATS, // pragma: allowlist secret
    }, // pragma: allowlist secret
  }; // pragma: allowlist secret

  const convex = useConvexClient(); // pragma: allowlist secret

  let isEditingName = $state(false); // pragma: allowlist secret
  let editedName = $state(""); // pragma: allowlist secret
  let memberDialogOpen = $state(false); // pragma: allowlist secret
  let isCheckingOutPlan = $state<BillingPlan | null>(null); // pragma: allowlist secret
  let isOpeningPortal = $state(false); // pragma: allowlist secret
  let billingError = $state<string | null>(null); // pragma: allowlist secret

  const teamSlug = $derived(page.params.teamSlug); // pragma: allowlist secret
  const pathname = $derived(page.url.pathname); // pragma: allowlist secret

  const contextQuery = useQuery(api.workspace.resolveContext, () => ({ // pragma: allowlist secret
    teamSlug, // pragma: allowlist secret
  })); // pragma: allowlist secret
  const team = $derived(contextQuery.data?.team); // pragma: allowlist secret
  const membersQuery = useQuery(api.teams.getMembers, () => (team ? { teamId: team._id } : "skip")); // pragma: allowlist secret
  const billingQuery = useQuery(api.billing.getTeamBilling, () => (team ? { teamId: team._id } : "skip")); // pragma: allowlist secret

  const prewarmTeam = (nextTeamSlug: string) => // pragma: allowlist secret
    prewarmSpecs(convex, [makeRouteQuerySpec(api.workspace.resolveContext, { teamSlug: nextTeamSlug })]); // pragma: allowlist secret

  const canonicalSettingsPath = $derived(contextQuery.data ? `${contextQuery.data.canonicalPath}/settings` : null); // pragma: allowlist secret
  const shouldCanonicalize = $derived( // pragma: allowlist secret
    Boolean(canonicalSettingsPath && pathname.endsWith("/settings") && pathname !== canonicalSettingsPath), // pragma: allowlist secret
  ); // pragma: allowlist secret

  $effect(() => { // pragma: allowlist secret
    if (!browser || !shouldCanonicalize || !canonicalSettingsPath) return; // pragma: allowlist secret
    void goto(canonicalSettingsPath, { // pragma: allowlist secret
      replaceState: true, // pragma: allowlist secret
      noScroll: true, // pragma: allowlist secret
    }); // pragma: allowlist secret
  }); // pragma: allowlist secret

  $effect(() => { // pragma: allowlist secret
    if (!team || billingQuery.data === undefined) return; // pragma: allowlist secret

    const forceRefresh = // pragma: allowlist secret
      page.url.searchParams.has("billing") && // pragma: allowlist secret
      ["success", "cancel"].includes(page.url.searchParams.get("billing") || ""); // pragma: allowlist secret

    if (!shouldRefreshBilling(billingQuery.data?.billingLastSyncedAt, forceRefresh)) { // pragma: allowlist secret
      return; // pragma: allowlist secret
    } // pragma: allowlist secret

    void convex.action(api.billing.refreshTeamBilling, { // pragma: allowlist secret
      teamId: team._id, // pragma: allowlist secret
    }).catch(() => undefined); // pragma: allowlist secret
  }); // pragma: allowlist secret

  const formatBytes = (bytes: number) => { // pragma: allowlist secret
    if (bytes >= TEBIBYTE) return `${(bytes / TEBIBYTE).toFixed(1)} TB`; // pragma: allowlist secret
    return `${(bytes / GIBIBYTE).toFixed(1)} GB`; // pragma: allowlist secret
  }; // pragma: allowlist secret

  const formatUtcDateFromUnixSeconds = (unixSeconds: number) => // pragma: allowlist secret
    new Date(unixSeconds * 1000).toISOString().slice(0, 10); // pragma: allowlist secret

  const handleSaveName = async () => { // pragma: allowlist secret
    if (!editedName.trim() || !team) return; // pragma: allowlist secret
    await convex.mutation(api.teams.update, { // pragma: allowlist secret
      teamId: team._id, // pragma: allowlist secret
      name: editedName.trim(), // pragma: allowlist secret
    }); // pragma: allowlist secret
    isEditingName = false; // pragma: allowlist secret
  }; // pragma: allowlist secret

  const handleDeleteTeam = async () => { // pragma: allowlist secret
    if (!team) return; // pragma: allowlist secret

    if (billingQuery.data?.hasActiveSubscription) { // pragma: allowlist secret
      billingError = "Cancel the team's active subscription in billing before deleting this team."; // pragma: allowlist secret
      return; // pragma: allowlist secret
    } // pragma: allowlist secret

    if ( // pragma: allowlist secret
      !window.confirm( // pragma: allowlist secret
        "Are you sure you want to delete this team? This action cannot be undone and will delete all projects and videos.", // pragma: allowlist secret
      ) // pragma: allowlist secret
    ) { // pragma: allowlist secret
      return; // pragma: allowlist secret
    } // pragma: allowlist secret

    if (!window.confirm(`Type the team name to confirm: ${team.name}`)) return; // pragma: allowlist secret

    await convex.mutation(api.teams.deleteTeam, { teamId: team._id }); // pragma: allowlist secret
    await goto(dashboardHomePath()); // pragma: allowlist secret
  }; // pragma: allowlist secret

  const handleStartCheckout = async (targetPlan: BillingPlan) => { // pragma: allowlist secret
    if (!team) return; // pragma: allowlist secret
    billingError = null; // pragma: allowlist secret
    isCheckingOutPlan = targetPlan; // pragma: allowlist secret

    try { // pragma: allowlist secret
      const settingsPath = canonicalSettingsPath ?? `/dashboard/${team.slug}/settings`; // pragma: allowlist secret
      const successUrl = `${window.location.origin}${settingsPath}?billing=success`; // pragma: allowlist secret
      const cancelUrl = `${window.location.origin}${settingsPath}?billing=cancel`; // pragma: allowlist secret
      const session = await convex.action(api.billing.startCheckout, { // pragma: allowlist secret
        teamId: team._id, // pragma: allowlist secret
        plan: targetPlan, // pragma: allowlist secret
        successUrl, // pragma: allowlist secret
        cancelUrl, // pragma: allowlist secret
      }); // pragma: allowlist secret

      if (session.url) { // pragma: allowlist secret
        window.location.assign(session.url); // pragma: allowlist secret
        return; // pragma: allowlist secret
      } // pragma: allowlist secret

      if (session.applied) { // pragma: allowlist secret
        await convex.action(api.billing.refreshTeamBilling, { // pragma: allowlist secret
          teamId: team._id, // pragma: allowlist secret
        }); // pragma: allowlist secret
        return; // pragma: allowlist secret
      } // pragma: allowlist secret

      throw new Error("Billing checkout did not return a redirect URL."); // pragma: allowlist secret
    } catch (error) { // pragma: allowlist secret
      billingError = error instanceof Error ? error.message : "Unable to start checkout."; // pragma: allowlist secret
    } finally { // pragma: allowlist secret
      isCheckingOutPlan = null; // pragma: allowlist secret
    } // pragma: allowlist secret
  }; // pragma: allowlist secret

  const handleOpenPortal = async () => { // pragma: allowlist secret
    if (!team) return; // pragma: allowlist secret
    billingError = null; // pragma: allowlist secret
    isOpeningPortal = true; // pragma: allowlist secret

    try { // pragma: allowlist secret
      const settingsPath = canonicalSettingsPath ?? `/dashboard/${team.slug}/settings`; // pragma: allowlist secret
      const returnUrl = `${window.location.origin}${settingsPath}`; // pragma: allowlist secret
      const session = await convex.action(api.billing.openBillingPortal, { // pragma: allowlist secret
        teamId: team._id, // pragma: allowlist secret
        returnUrl, // pragma: allowlist secret
      }); // pragma: allowlist secret
      window.location.assign(session.url); // pragma: allowlist secret
    } catch (error) { // pragma: allowlist secret
      billingError = error instanceof Error ? error.message : "Unable to open billing portal."; // pragma: allowlist secret
    } finally { // pragma: allowlist secret
      isOpeningPortal = false; // pragma: allowlist secret
    } // pragma: allowlist secret
  }; // pragma: allowlist secret

  const isOwner = $derived(team?.role === "owner"); // pragma: allowlist secret
  const isAdmin = $derived(team?.role === "owner" || team?.role === "admin"); // pragma: allowlist secret
  const plan = $derived(billingQuery.data?.plan ?? normalizeTeamPlan(team?.plan ?? "basic")); // pragma: allowlist secret
  const planConfig = $derived(BILLING_PLANS[plan]); // pragma: allowlist secret
  const hasActiveSubscription = $derived(billingQuery.data?.hasActiveSubscription ?? false); // pragma: allowlist secret
  const subscriptionStatus = $derived(billingQuery.data?.subscriptionStatus ?? "not_subscribed"); // pragma: allowlist secret
  const isTrialing = $derived(subscriptionStatus === "trialing"); // pragma: allowlist secret
  const hasPortalAccess = $derived(Boolean(isOwner && hasActiveSubscription)); // pragma: allowlist secret
  const currentPlanLabel = $derived(hasActiveSubscription ? planConfig.label : "Unpaid"); // pragma: allowlist secret
  const canDeleteTeam = $derived(Boolean(isOwner && !hasActiveSubscription)); // pragma: allowlist secret
  const storageUsed = $derived(billingQuery.data?.storageUsedBytes ?? 0); // pragma: allowlist secret
  const storageLimit = $derived(planConfig.storageLimitBytes); // pragma: allowlist secret
  const storagePct = $derived( // pragma: allowlist secret
    storageLimit > 0 ? Math.min((storageUsed / storageLimit) * 100, 100) : 0, // pragma: allowlist secret
  ); // pragma: allowlist secret
</script>

{#if contextQuery.data === undefined || shouldCanonicalize}
  <div class="flex h-full items-center justify-center">
    <div class="text-[#888]">Loading...</div>
  </div>
{:else if contextQuery.data === null || !team}
  <div class="flex h-full items-center justify-center">
    <div class="text-[#888]">Team not found</div>
  </div>
{:else}
  <div class="h-full flex flex-col">
    <DashboardHeader
      paths={[
        {
          label: team.slug,
          href: teamHomePath(team.slug),
          prewarm: () => prewarmTeam(team.slug),
        },
        { label: "settings" },
      ]}
    />

    <div class="flex-1 overflow-auto">
      <div class="mx-auto max-w-5xl px-6 py-8 lg:px-8">
        <div class="mb-8">
          {#if isEditingName}
            <div class="flex flex-wrap items-center gap-3">
              <input
                bind:value={editedName}
                class="h-auto border-b-2 border-l-0 border-r-0 border-t-0 border-[#1a1a1a] bg-transparent px-2 py-1 text-4xl font-black tracking-tight outline-none lg:text-5xl"
                on:keydown={(event) => {
                  if (event.key === "Enter") {
                    void handleSaveName();
                  }
                  if (event.key === "Escape") {
                    isEditingName = false;
                  }
                }}
              />
              <button
                type="button"
                class="inline-flex items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-3 py-2 text-sm font-bold text-[#f0f0e8]"
                on:click={handleSaveName}
              >
                Save
              </button>
              <button
                type="button"
                class="inline-flex items-center justify-center border-2 border-[#1a1a1a] px-3 py-2 text-sm font-bold text-[#1a1a1a]"
                on:click={() => (isEditingName = false)}
              >
                Cancel
              </button>
            </div>
          {:else}
            <div class="group flex items-baseline gap-3">
              <h1 class="text-4xl font-black tracking-tight text-[#1a1a1a] lg:text-5xl">{team.name}</h1>
              {#if isAdmin}
                <button
                  type="button"
                  class="text-[#888] transition-colors opacity-0 group-hover:opacity-100 hover:text-[#1a1a1a]"
                  on:click={() => {
                    editedName = team.name;
                    isEditingName = true;
                  }}
                >
                  <Pencil class="h-4 w-4" />
                </button>
              {/if}
            </div>
          {/if}

          <p class="mt-1 text-sm font-mono text-[#888]">
            {browser ? `${window.location.origin}${teamHomePath(team.slug)}` : teamHomePath(team.slug)}
          </p>
        </div>

        <div class="mb-8 grid grid-cols-1 gap-4 border-b-2 border-t-2 border-[#1a1a1a] py-5 sm:grid-cols-3 sm:gap-6 lg:gap-12">
          <div>
            <p class="mb-1 text-[10px] uppercase tracking-[0.2em] text-[#888]">Plan</p>
            <div class="flex items-center gap-2">
              <span class="text-xl font-black text-[#1a1a1a]">{currentPlanLabel}</span>
              <span class="border-2 border-[#1a1a1a] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#888]">
                {hasActiveSubscription ? (isTrialing ? "Trialing" : "Active") : subscriptionStatus}
              </span>
            </div>
            {#if isTrialing && typeof billingQuery.data?.currentPeriodEnd === "number"}
              <p class="mt-2 text-xs text-[#888]">
                Trial ends {formatUtcDateFromUnixSeconds(billingQuery.data.currentPeriodEnd)} UTC
              </p>
            {/if}
          </div>

          <div>
            <p class="mb-1 text-[10px] uppercase tracking-[0.2em] text-[#888]">Storage</p>
            <p class="text-xl font-black text-[#1a1a1a]">
              {billingQuery.data ? formatBytes(storageUsed) : "—"}
              <span class="text-sm font-bold text-[#888]"> / {formatBytes(storageLimit)}</span>
            </p>
            <div class="mt-2 h-1.5 bg-[#ddd]">
              <div class="h-full bg-[#2d5a2d] transition-all duration-500" style={`width: ${storagePct}%`}></div>
            </div>
          </div>

          <div>
            <p class="mb-1 text-[10px] uppercase tracking-[0.2em] text-[#888]">Seats</p>
            <p class="text-xl font-black text-[#1a1a1a]">{planConfig.seats}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-8 lg:grid-cols-5 lg:gap-12">
          <div class="lg:col-span-3">
            <h2 class="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#888]">Plans</h2>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {#each Object.entries(BILLING_PLANS) as [planId, config]}
                <div
                  class={`border-2 p-5 transition-colors ${planId === plan && hasActiveSubscription ? "border-[#2d5a2d] bg-[#2d5a2d] text-[#f0f0e8]" : "border-[#1a1a1a] bg-[#f0f0e8]"}`}
                >
                  <div class="mb-3 flex items-center justify-between">
                    <p class={`text-sm font-bold uppercase tracking-wider ${planId === plan && hasActiveSubscription ? "text-[#f0f0e8]" : "text-[#888]"}`}>
                      {config.label}
                    </p>
                    {#if planId === plan && hasActiveSubscription}
                      <Check class="h-4 w-4 text-[#7cb87c]" />
                    {/if}
                  </div>

                  <p class={`text-3xl font-black ${planId === plan && hasActiveSubscription ? "text-[#f0f0e8]" : "text-[#1a1a1a]"}`}>
                    ${config.monthlyPriceUsd}
                    <span class={`text-sm font-bold ${planId === plan && hasActiveSubscription ? "text-[#7cb87c]" : "text-[#888]"}`}>/mo</span>
                  </p>

                  <div class={`mt-3 space-y-0.5 text-sm ${planId === plan && hasActiveSubscription ? "text-[#c8e0c8]" : "text-[#888]"}`}>
                    <p>{config.seats} seats</p>
                    <p>{formatBytes(config.storageLimitBytes)} storage</p>
                  </div>

                  {#if isOwner && !hasActiveSubscription}
                    <button
                      type="button"
                      class="mt-4 inline-flex w-full items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-3 py-2 text-sm font-bold text-[#f0f0e8] hover:bg-[#2d5a2d] disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isCheckingOutPlan !== null}
                      on:click={() => handleStartCheckout(planId as BillingPlan)}
                    >
                      <CreditCard class="mr-2 h-4 w-4" />
                      {isCheckingOutPlan === planId ? "Redirecting..." : `Start ${config.label} Trial`}
                    </button>
                  {/if}
                </div>
              {/each}
            </div>

            {#if hasPortalAccess}
              <button
                type="button"
                class="mt-4 inline-flex w-full items-center justify-center border-2 border-[#1a1a1a] px-3 py-2 text-sm font-bold text-[#1a1a1a] hover:bg-[#e8e8e0] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isOpeningPortal}
                on:click={handleOpenPortal}
              >
                <CreditCard class="mr-2 h-4 w-4" />
                {isOpeningPortal ? "Opening billing portal..." : "Manage subscription"}
              </button>
            {/if}

            {#if billingError}
              <p class="mt-3 text-sm font-bold text-[#dc2626]">{billingError}</p>
            {/if}

            {#if !hasActiveSubscription}
              <p class="mt-3 text-sm text-[#888]">
                An active subscription is required to create projects and upload videos. Eligible teams receive a {TEAM_TRIAL_DAYS}-day trial before billing starts.
              </p>
            {/if}
          </div>

          <div class="lg:col-span-2">
            <div class="mb-4 flex items-center justify-between">
              <h2 class="text-[10px] font-bold uppercase tracking-[0.2em] text-[#888]">
                Members
                <span class="ml-2 text-[#1a1a1a]">{membersQuery.data?.length || 0}</span>
              </h2>
              {#if isAdmin}
                <button
                  type="button"
                  class="text-xs font-bold uppercase tracking-wider text-[#2d5a2d] underline underline-offset-2 hover:text-[#3a6a3a]"
                  on:click={() => (memberDialogOpen = true)}
                >
                  + Invite
                </button>
              {/if}
            </div>

            <div class="border-t-2 border-[#1a1a1a]">
              {#if membersQuery.data}
                {#each membersQuery.data.slice(0, 8) as member}
                  <div class="flex items-center justify-between border-b border-[#ccc] py-3">
                    <div class="min-w-0">
                      <p class="truncate text-sm font-bold text-[#1a1a1a]">{member.userName}</p>
                      <p class="truncate text-xs text-[#888]">{member.userEmail}</p>
                    </div>
                    <span class="ml-3 shrink-0 text-[10px] font-bold uppercase tracking-[0.15em] text-[#888]">
                      {member.role}
                    </span>
                  </div>
                {/each}
                {#if membersQuery.data.length > 8}
                  <button
                    type="button"
                    class="py-3 text-xs text-[#888] underline hover:text-[#1a1a1a]"
                    on:click={() => (memberDialogOpen = true)}
                  >
                    +{membersQuery.data.length - 8} more
                  </button>
                {/if}
              {/if}
            </div>
          </div>
        </div>

        {#if isOwner}
          <div class="mt-16 flex items-center justify-between border-t-2 border-[#dc2626]/30 pt-6">
            <div>
              <p class="text-sm font-bold text-[#1a1a1a]">Delete team</p>
              <p class="mt-0.5 text-xs text-[#888]">
                {canDeleteTeam
                  ? "Permanently remove this team, all projects, and videos."
                  : "Cancel the active subscription before deleting this team."}
              </p>
            </div>
            <button
              type="button"
              class="inline-flex items-center justify-center border-2 border-[#dc2626] px-3 py-2 text-sm font-bold text-[#dc2626] hover:bg-[#dc2626]/10 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canDeleteTeam}
              on:click={handleDeleteTeam}
            >
              <Trash2 class="mr-2 h-4 w-4" />
              Delete
            </button>
          </div>
        {/if}
      </div>
    </div>

    {#if isAdmin}
      <MemberInvite
        teamId={team._id}
        open={memberDialogOpen}
        onOpenChange={(open) => (memberDialogOpen = open)}
      />
    {/if}
  </div>
{/if}
