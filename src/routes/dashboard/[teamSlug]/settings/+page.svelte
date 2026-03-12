<script lang="ts">
  import { goto } from "$app/navigation"; 
  import { browser } from "$app/environment"; 
  import { page } from "$app/state"; 
  import { api } from "@convex/_generated/api"; 
  import { useConvexClient, useQuery } from "convex-svelte"; 
  import { Check, CreditCard, Pencil, Trash2, X } from "lucide-svelte"; 
  import DashboardHeader from "@/lib/components/DashboardHeader.svelte"; 
  import MemberInvite from "@/lib/components/teams/MemberInvite.svelte"; 
  import { makeRouteQuerySpec, prewarmSpecs } from "@/lib/convex/prewarm"; 
  import { dashboardHomePath, teamHomePath } from "@/lib/routes"; 
  import { 
    TEAM_PLAN_LABELS, 
    TEAM_PLAN_MONTHLY_PRICE_USD, 
    TEAM_PLAN_SEATS, 
    TEAM_PLAN_STORAGE_LIMIT_BYTES, 
    TEAM_TRIAL_DAYS, 
    normalizeTeamPlan, 
    shouldRefreshBilling, 
    type TeamPlan as BillingPlan, 
  } from "@/shared/billingPlans"; 

  const GIBIBYTE = 1024 ** 3; 
  const TEBIBYTE = 1024 ** 4; 

  const BILLING_PLANS: Record< 
    BillingPlan, 
    { 
      label: string; 
      monthlyPriceUsd: number; 
      storageLimitBytes: number; 
      seats: string; 
    } 
  > = { 
    basic: { 
      label: TEAM_PLAN_LABELS.basic, 
      monthlyPriceUsd: TEAM_PLAN_MONTHLY_PRICE_USD.basic, 
      storageLimitBytes: TEAM_PLAN_STORAGE_LIMIT_BYTES.basic, 
      seats: TEAM_PLAN_SEATS, 
    }, 
    pro: { 
      label: TEAM_PLAN_LABELS.pro, 
      monthlyPriceUsd: TEAM_PLAN_MONTHLY_PRICE_USD.pro, 
      storageLimitBytes: TEAM_PLAN_STORAGE_LIMIT_BYTES.pro, 
      seats: TEAM_PLAN_SEATS, 
    }, 
  }; 

  const convex = useConvexClient(); 

  let isEditingName = $state(false); 
  let editedName = $state(""); 
  let memberDialogOpen = $state(false); 
  let isCheckingOutPlan = $state<BillingPlan | null>(null); 
  let isOpeningPortal = $state(false); 
  let billingError = $state<string | null>(null); 

  const teamSlug = $derived(page.params.teamSlug); 
  const pathname = $derived(page.url.pathname); 

  const contextQuery = useQuery(api.workspace.resolveContext, () => ({ 
    teamSlug, 
  })); 
  const team = $derived(contextQuery.data?.team); 
  const membersQuery = useQuery(api.teams.getMembers, () => (team ? { teamId: team._id } : "skip")); 
  const billingQuery = useQuery(api.billing.getTeamBilling, () => (team ? { teamId: team._id } : "skip")); 

  const prewarmTeam = (nextTeamSlug: string) => 
    prewarmSpecs(convex, [makeRouteQuerySpec(api.workspace.resolveContext, { teamSlug: nextTeamSlug })]); 

  const canonicalSettingsPath = $derived(contextQuery.data ? `${contextQuery.data.canonicalPath}/settings` : null); 
  const shouldCanonicalize = $derived( 
    Boolean(canonicalSettingsPath && pathname.endsWith("/settings") && pathname !== canonicalSettingsPath), 
  ); 

  $effect(() => { 
    if (!browser || !shouldCanonicalize || !canonicalSettingsPath) return; 
    void goto(canonicalSettingsPath, { 
      replaceState: true, 
      noScroll: true, 
    }); 
  }); 

  $effect(() => { 
    if (!team || billingQuery.data === undefined) return; 

    const forceRefresh = 
      page.url.searchParams.has("billing") && 
      ["success", "cancel"].includes(page.url.searchParams.get("billing") || ""); 

    if (!shouldRefreshBilling(billingQuery.data?.billingLastSyncedAt, forceRefresh)) { 
      return; 
    } 

    void convex.action(api.billing.refreshTeamBilling, { 
      teamId: team._id, 
    }).catch(() => undefined); 
  }); 

  const formatBytes = (bytes: number) => { 
    if (bytes >= TEBIBYTE) return `${(bytes / TEBIBYTE).toFixed(1)} TB`; 
    return `${(bytes / GIBIBYTE).toFixed(1)} GB`; 
  }; 

  const formatUtcDateFromUnixSeconds = (unixSeconds: number) => 
    new Date(unixSeconds * 1000).toISOString().slice(0, 10); 

  const handleSaveName = async () => { 
    if (!editedName.trim() || !team) return; 
    await convex.mutation(api.teams.update, { 
      teamId: team._id, 
      name: editedName.trim(), 
    }); 
    isEditingName = false; 
  }; 

  const handleDeleteTeam = async () => { 
    if (!team) return; 

    if (billingQuery.data?.hasActiveSubscription) { 
      billingError = "Cancel the team's active subscription in billing before deleting this team."; 
      return; 
    } 

    if ( 
      !window.confirm( 
        "Are you sure you want to delete this team? This action cannot be undone and will delete all projects and videos.", 
      ) 
    ) { 
      return; 
    } 

    if (!window.confirm(`Type the team name to confirm: ${team.name}`)) return; 

    await convex.mutation(api.teams.deleteTeam, { teamId: team._id }); 
    await goto(dashboardHomePath()); 
  }; 

  const handleStartCheckout = async (targetPlan: BillingPlan) => { 
    if (!team) return; 
    billingError = null; 
    isCheckingOutPlan = targetPlan; 

    try { 
      const settingsPath = canonicalSettingsPath ?? `/dashboard/${team.slug}/settings`; 
      const successUrl = `${window.location.origin}${settingsPath}?billing=success`; 
      const cancelUrl = `${window.location.origin}${settingsPath}?billing=cancel`; 
      const session = await convex.action(api.billing.startCheckout, { 
        teamId: team._id, 
        plan: targetPlan, 
        successUrl, 
        cancelUrl, 
      }); 

      if (session.url) { 
        window.location.assign(session.url); 
        return; 
      } 

      if (session.applied) { 
        await convex.action(api.billing.refreshTeamBilling, { 
          teamId: team._id, 
        }); 
        return; 
      } 

      throw new Error("Billing checkout did not return a redirect URL."); 
    } catch (error) { 
      billingError = error instanceof Error ? error.message : "Unable to start checkout."; 
    } finally { 
      isCheckingOutPlan = null; 
    } 
  }; 

  const handleOpenPortal = async () => { 
    if (!team) return; 
    billingError = null; 
    isOpeningPortal = true; 

    try { 
      const settingsPath = canonicalSettingsPath ?? `/dashboard/${team.slug}/settings`; 
      const returnUrl = `${window.location.origin}${settingsPath}`; 
      const session = await convex.action(api.billing.openBillingPortal, { 
        teamId: team._id, 
        returnUrl, 
      }); 
      window.location.assign(session.url); 
    } catch (error) { 
      billingError = error instanceof Error ? error.message : "Unable to open billing portal."; 
    } finally { 
      isOpeningPortal = false; 
    } 
  }; 

  const isOwner = $derived(team?.role === "owner"); 
  const isAdmin = $derived(team?.role === "owner" || team?.role === "admin"); 
  const plan = $derived(billingQuery.data?.plan ?? normalizeTeamPlan(team?.plan ?? "basic")); 
  const planConfig = $derived(BILLING_PLANS[plan]); 
  const hasActiveSubscription = $derived(billingQuery.data?.hasActiveSubscription ?? false); 
  const subscriptionStatus = $derived(billingQuery.data?.subscriptionStatus ?? "not_subscribed"); 
  const isTrialing = $derived(subscriptionStatus === "trialing"); 
  const hasPortalAccess = $derived(Boolean(isOwner && hasActiveSubscription)); 
  const currentPlanLabel = $derived(hasActiveSubscription ? planConfig.label : "Unpaid"); 
  const canDeleteTeam = $derived(Boolean(isOwner && !hasActiveSubscription)); 
  const storageUsed = $derived(billingQuery.data?.storageUsedBytes ?? 0); 
  const storageLimit = $derived(planConfig.storageLimitBytes); 
  const storagePct = $derived( 
    storageLimit > 0 ? Math.min((storageUsed / storageLimit) * 100, 100) : 0, 
  ); 
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
