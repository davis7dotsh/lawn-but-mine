<script lang="ts">// pragma: allowlist secret
  import { goto } from "$app/navigation"; // pragma: allowlist secret
  import { browser } from "$app/environment"; // pragma: allowlist secret
  import { page } from "$app/state"; // pragma: allowlist secret
  import { api } from "@convex/_generated/api"; // pragma: allowlist secret
  import type { Id } from "@convex/_generated/dataModel"; // pragma: allowlist secret
  import { useConvexClient, useQuery } from "convex-svelte"; // pragma: allowlist secret
  import { ArrowRight, CreditCard, Folder, Plus, Trash2, Users, X } from "lucide-svelte"; // pragma: allowlist secret
  import DashboardHeader from "@/lib/components/DashboardHeader.svelte"; // pragma: allowlist secret
  import MemberInvite from "@/lib/components/teams/MemberInvite.svelte"; // pragma: allowlist secret
  import { makeRouteQuerySpec, prewarmIntent, prewarmSpecs } from "@/lib/convex/prewarm"; // pragma: allowlist secret
  import { projectPath, teamSettingsPath } from "@/lib/routes"; // pragma: allowlist secret
  import { shouldRefreshBilling } from "@/shared/billingPlans"; // pragma: allowlist secret

  const convex = useConvexClient(); // pragma: allowlist secret

  let createDialogOpen = $state(false); // pragma: allowlist secret
  let memberDialogOpen = $state(false); // pragma: allowlist secret
  let newProjectName = $state(""); // pragma: allowlist secret
  let isLoading = $state(false); // pragma: allowlist secret

  const teamSlug = $derived(page.params.teamSlug); // pragma: allowlist secret
  const pathname = $derived(page.url.pathname); // pragma: allowlist secret

  const contextQuery = useQuery(api.workspace.resolveContext, () => ({ // pragma: allowlist secret
    teamSlug, // pragma: allowlist secret
  })); // pragma: allowlist secret

  const team = $derived(contextQuery.data?.team); // pragma: allowlist secret
  const projectsQuery = useQuery(api.projects.list, () => // pragma: allowlist secret
    team ? { teamId: team._id } : "skip", // pragma: allowlist secret
  ); // pragma: allowlist secret
  const billingQuery = useQuery(api.billing.getTeamBilling, () => // pragma: allowlist secret
    team ? { teamId: team._id } : "skip", // pragma: allowlist secret
  ); // pragma: allowlist secret

  const shouldCanonicalize = $derived( // pragma: allowlist secret
    Boolean(contextQuery.data && !contextQuery.data.isCanonical && pathname !== contextQuery.data.canonicalPath), // pragma: allowlist secret
  ); // pragma: allowlist secret

  const prewarmProject = (nextTeamSlug: string, projectId: Id<"projects">) => // pragma: allowlist secret
    prewarmSpecs(convex, [ // pragma: allowlist secret
      makeRouteQuerySpec(api.workspace.resolveContext, { // pragma: allowlist secret
        teamSlug: nextTeamSlug, // pragma: allowlist secret
        projectId, // pragma: allowlist secret
      }), // pragma: allowlist secret
      makeRouteQuerySpec(api.projects.get, { // pragma: allowlist secret
        projectId, // pragma: allowlist secret
      }), // pragma: allowlist secret
      makeRouteQuerySpec(api.videos.list, { // pragma: allowlist secret
        projectId, // pragma: allowlist secret
      }), // pragma: allowlist secret
    ]); // pragma: allowlist secret

  $effect(() => { // pragma: allowlist secret
    if (!browser || !shouldCanonicalize || !contextQuery.data) return; // pragma: allowlist secret
    void goto(contextQuery.data.canonicalPath, { // pragma: allowlist secret
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

  const handleCreateProject = async (event: SubmitEvent) => { // pragma: allowlist secret
    event.preventDefault(); // pragma: allowlist secret
    if (!newProjectName.trim() || !team) return; // pragma: allowlist secret

    isLoading = true; // pragma: allowlist secret
    try { // pragma: allowlist secret
      const projectId = await convex.mutation(api.projects.create, { // pragma: allowlist secret
        teamId: team._id, // pragma: allowlist secret
        name: newProjectName.trim(), // pragma: allowlist secret
      }); // pragma: allowlist secret
      createDialogOpen = false; // pragma: allowlist secret
      newProjectName = ""; // pragma: allowlist secret
      await goto(projectPath(team.slug, projectId)); // pragma: allowlist secret
    } finally { // pragma: allowlist secret
      isLoading = false; // pragma: allowlist secret
    } // pragma: allowlist secret
  }; // pragma: allowlist secret

  const handleDeleteProject = async (projectId: Id<"projects">) => { // pragma: allowlist secret
    if (!window.confirm("Are you sure you want to delete this project?")) return; // pragma: allowlist secret
    await convex.mutation(api.projects.remove, { projectId }); // pragma: allowlist secret
  }; // pragma: allowlist secret

  const isLoadingData = $derived( // pragma: allowlist secret
    contextQuery.data === undefined || // pragma: allowlist secret
      billingQuery.data === undefined || // pragma: allowlist secret
      projectsQuery.data === undefined || // pragma: allowlist secret
      shouldCanonicalize, // pragma: allowlist secret
  ); // pragma: allowlist secret
  const canManageMembers = $derived(team?.role === "owner" || team?.role === "admin"); // pragma: allowlist secret
  const hasActiveSubscription = $derived(billingQuery.data?.hasActiveSubscription ?? false); // pragma: allowlist secret
  const canCreateProject = $derived(team?.role !== "viewer" && hasActiveSubscription); // pragma: allowlist secret
  const canAccessBilling = $derived(team?.role === "owner"); // pragma: allowlist secret
  const billingPath = $derived(team ? teamSettingsPath(team.slug) : null); // pragma: allowlist secret
</script>

{#if contextQuery.data === null}
  <div class="flex h-full items-center justify-center">
    <div class="text-[#888]">Team not found</div>
  </div>
{:else}
  <div class="h-full flex flex-col">
    <DashboardHeader paths={[{ label: team?.slug ?? "team" }]}>
      {#if canAccessBilling && team}
        <a
          href={billingPath ?? teamSettingsPath(team.slug)}
          class="inline-flex items-center justify-center border-2 border-[#1a1a1a] px-3 py-2 text-sm font-bold text-[#1a1a1a] hover:bg-[#e8e8e0]"
        >
          <CreditCard class="sm:mr-1.5 h-4 w-4" />
          <span class="hidden sm:inline">Billing</span>
        </a>
      {/if}
      {#if canManageMembers}
        <button
          type="button"
          class="inline-flex items-center justify-center border-2 border-[#1a1a1a] px-3 py-2 text-sm font-bold text-[#1a1a1a] hover:bg-[#e8e8e0]"
          on:click={() => (memberDialogOpen = true)}
        >
          <Users class="sm:mr-1.5 h-4 w-4" />
          <span class="hidden sm:inline">Members</span>
        </button>
      {/if}
      {#if canCreateProject}
        <button
          type="button"
          class="inline-flex items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-3 py-2 text-sm font-bold text-[#f0f0e8] hover:bg-[#2d5a2d]"
          on:click={() => (createDialogOpen = true)}
        >
          <Plus class="sm:mr-1.5 h-4 w-4" />
          <span class="hidden sm:inline">New project</span>
        </button>
      {/if}
    </DashboardHeader>

    <div class="flex-1 overflow-auto p-6">
      {#if !isLoadingData && !hasActiveSubscription && canAccessBilling}
        <div class="mb-6 border-2 border-[#1a1a1a] bg-[#f0f0e8] p-6">
          <h2 class="text-lg font-black text-[#1a1a1a]">Set up billing to create projects</h2>
          <p class="mt-2 text-sm text-[#888]">
            This team has no active subscription. Go to Billing to start Basic or Pro before
            creating projects.
          </p>
          <a
            href={billingPath ?? "#"}
            class="mt-4 inline-flex items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-3 py-2 text-sm font-bold text-[#f0f0e8] hover:bg-[#2d5a2d]"
          >
            Go to Billing
          </a>
        </div>
      {/if}

      {#if !isLoadingData && projectsQuery.data && projectsQuery.data.length === 0}
        <div class="h-full flex items-center justify-center animate-in fade-in duration-300">
          <div class="max-w-sm border-2 border-[#1a1a1a] bg-[#f0f0e8] p-6 text-center">
            <div class="mx-auto mb-2 flex h-12 w-12 items-center justify-center bg-[#e8e8e0]">
              <Folder class="h-6 w-6 text-[#888]" />
            </div>
            <h2 class="text-lg font-black text-[#1a1a1a]">No projects yet</h2>
            <p class="mt-2 text-sm text-[#888]">
              {hasActiveSubscription
                ? "Create your first project to start uploading videos."
                : "Activate billing first, then create your first project."}
            </p>

            {#if canCreateProject}
              <button
                type="button"
                class="mt-4 inline-flex w-full items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-3 py-2 text-sm font-bold text-[#f0f0e8] hover:bg-[#2d5a2d]"
                on:click={() => (createDialogOpen = true)}
              >
                <Plus class="mr-1.5 h-4 w-4" />
                Create project
              </button>
            {:else if canAccessBilling}
              <a
                href={billingPath ?? "#"}
                class="mt-4 inline-flex w-full items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-3 py-2 text-sm font-bold text-[#f0f0e8] hover:bg-[#2d5a2d]"
              >
                Go to Billing
              </a>
            {/if}
          </div>
        </div>
      {:else}
        <div class={`grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 transition-opacity duration-300 ${isLoadingData ? "opacity-0" : "opacity-100"}`}>
          {#if projectsQuery.data && team}
            {#each projectsQuery.data as project}
              <div class="group border-2 border-[#1a1a1a] bg-[#f0f0e8] p-5 hover:bg-[#e8e8e0] transition-colors">
                <div class="flex items-start justify-between gap-3 pb-3">
                  <a
                    href={projectPath(team.slug, project._id)}
                    class="flex-1 min-w-0"
                    use:prewarmIntent={{ run: () => prewarmProject(team.slug, project._id) }}
                  >
                    <h3 class="truncate text-base font-black text-[#1a1a1a]">{project.name}</h3>
                    <p class="mt-1 text-sm text-[#888]">
                      {project.videoCount} video{project.videoCount !== 1 ? "s" : ""}
                    </p>
                  </a>

                  {#if canCreateProject}
                    <button
                      type="button"
                      class="inline-flex h-8 w-8 items-center justify-center text-[#dc2626] hover:bg-[#dc2626]/10"
                      on:click={() => handleDeleteProject(project._id)}
                    >
                      <Trash2 class="h-4 w-4" />
                    </button>
                  {/if}
                </div>

                <a
                  href={projectPath(team.slug, project._id)}
                  class="flex items-center justify-between text-sm text-[#888] group-hover:text-[#1a1a1a] transition-colors"
                  use:prewarmIntent={{ run: () => prewarmProject(team.slug, project._id) }}
                >
                  <span>Open project</span>
                  <ArrowRight class="h-4 w-4" />
                </a>
              </div>
            {/each}
          {/if}
        </div>
      {/if}
    </div>

    {#if createDialogOpen}
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <button
          type="button"
          class="absolute inset-0 bg-[#1a1a1a]/40"
          aria-label="Close create project dialog"
          on:click={() => (createDialogOpen = false)}
        ></button>

        <div class="relative w-full max-w-md border-2 border-[#1a1a1a] bg-[#f0f0e8] p-6 shadow-[8px_8px_0px_0px_var(--shadow-color)]">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-lg font-black text-[#1a1a1a]">Create project</h2>
              <p class="mt-1 text-sm text-[#888]">
                Projects help you organize related videos together.
              </p>
            </div>
            <button
              type="button"
              class="inline-flex h-8 w-8 items-center justify-center border-2 border-[#1a1a1a] hover:bg-[#e8e8e0]"
              on:click={() => (createDialogOpen = false)}
            >
              <X class="h-4 w-4" />
            </button>
          </div>

          <form class="mt-6" on:submit={handleCreateProject}>
            <input
              bind:value={newProjectName}
              placeholder="Project name"
              class="w-full border-2 border-[#1a1a1a] bg-[#f0f0e8] px-3 py-2 text-sm outline-none"
            />

            <div class="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                class="inline-flex items-center justify-center border-2 border-[#1a1a1a] px-3 py-2 text-sm font-bold text-[#1a1a1a] hover:bg-[#e8e8e0]"
                on:click={() => (createDialogOpen = false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                class="inline-flex items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-3 py-2 text-sm font-bold text-[#f0f0e8] hover:bg-[#2d5a2d] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!newProjectName.trim() || isLoading}
              >
                {isLoading ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    {/if}

    {#if canManageMembers && team}
      <MemberInvite
        teamId={team._id}
        open={memberDialogOpen}
        onOpenChange={(open) => (memberDialogOpen = open)}
      />
    {/if}
  </div>
{/if}
