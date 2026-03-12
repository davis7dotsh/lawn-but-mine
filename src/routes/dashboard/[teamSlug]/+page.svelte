<script lang="ts">
  import { goto } from "$app/navigation"; 
  import { browser } from "$app/environment"; 
  import { page } from "$app/state"; 
  import { api } from "@convex/_generated/api"; 
  import type { Id } from "@convex/_generated/dataModel"; 
  import { useConvexClient, useQuery } from "convex-svelte"; 
  import { ArrowRight, CreditCard, Folder, Plus, Trash2, Users, X } from "lucide-svelte"; 
  import DashboardHeader from "@/lib/components/DashboardHeader.svelte"; 
  import MemberInvite from "@/lib/components/teams/MemberInvite.svelte"; 
  import { makeRouteQuerySpec, prewarmIntent, prewarmSpecs } from "@/lib/convex/prewarm"; 
  import { projectPath, teamSettingsPath } from "@/lib/routes"; 
  import { shouldRefreshBilling } from "@/shared/billingPlans"; 

  const convex = useConvexClient(); 

  let createDialogOpen = $state(false); 
  let memberDialogOpen = $state(false); 
  let newProjectName = $state(""); 
  let isLoading = $state(false); 

  const teamSlug = $derived(page.params.teamSlug); 
  const pathname = $derived(page.url.pathname); 

  const contextQuery = useQuery(api.workspace.resolveContext, () => ({ 
    teamSlug, 
  })); 

  const team = $derived(contextQuery.data?.team); 
  const projectsQuery = useQuery(api.projects.list, () => 
    team ? { teamId: team._id } : "skip", 
  ); 
  const billingQuery = useQuery(api.billing.getTeamBilling, () => 
    team ? { teamId: team._id } : "skip", 
  ); 

  const shouldCanonicalize = $derived( 
    Boolean(contextQuery.data && !contextQuery.data.isCanonical && pathname !== contextQuery.data.canonicalPath), 
  ); 

  const prewarmProject = (nextTeamSlug: string, projectId: Id<"projects">) => 
    prewarmSpecs(convex, [ 
      makeRouteQuerySpec(api.workspace.resolveContext, { 
        teamSlug: nextTeamSlug, 
        projectId, 
      }), 
      makeRouteQuerySpec(api.projects.get, { 
        projectId, 
      }), 
      makeRouteQuerySpec(api.videos.list, { 
        projectId, 
      }), 
    ]); 

  $effect(() => { 
    if (!browser || !shouldCanonicalize || !contextQuery.data) return; 
    void goto(contextQuery.data.canonicalPath, { 
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

  const handleCreateProject = async (event: SubmitEvent) => { 
    event.preventDefault(); 
    if (!newProjectName.trim() || !team) return; 

    isLoading = true; 
    try { 
      const projectId = await convex.mutation(api.projects.create, { 
        teamId: team._id, 
        name: newProjectName.trim(), 
      }); 
      createDialogOpen = false; 
      newProjectName = ""; 
      await goto(projectPath(team.slug, projectId)); 
    } finally { 
      isLoading = false; 
    } 
  }; 

  const handleDeleteProject = async (projectId: Id<"projects">) => { 
    if (!window.confirm("Are you sure you want to delete this project?")) return; 
    await convex.mutation(api.projects.remove, { projectId }); 
  }; 

  const isLoadingData = $derived( 
    contextQuery.data === undefined || 
      billingQuery.data === undefined || 
      projectsQuery.data === undefined || 
      shouldCanonicalize, 
  ); 
  const canManageMembers = $derived(team?.role === "owner" || team?.role === "admin"); 
  const hasActiveSubscription = $derived(billingQuery.data?.hasActiveSubscription ?? false); 
  const canCreateProject = $derived(team?.role !== "viewer" && hasActiveSubscription); 
  const canAccessBilling = $derived(team?.role === "owner"); 
  const billingPath = $derived(team ? teamSettingsPath(team.slug) : null); 
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
