<script lang="ts">
  import type { Id } from "@lawn/convex/dataModel"; 
  import { api } from "@lawn/convex/api"; 
  import { useConvexClient, useQuery } from "convex-svelte"; 
  import { ArrowRight, Folder, Plus, Users } from "lucide-svelte"; 
  import DashboardHeader from "@/lib/components/DashboardHeader.svelte"; 
  import CreateTeamDialog from "@/lib/components/teams/CreateTeamDialog.svelte"; 
  import { makeRouteQuerySpec, prewarmIntent, prewarmSpecs } from "@/lib/convex/prewarm"; 
  import { getDashboardBillingLabel } from "@lawn/shared/billingPlans"; 
  import { projectPath, teamHomePath, teamSettingsPath } from "@/lib/routes"; 

  const convex = useConvexClient(); 
  const teamsQuery = useQuery(api.teams.listWithProjects, {}); 

  let createDialogOpen = $state(false); 
  let hasAutoOpenedCreateDialog = $state(false); 

  const prewarmProject = (teamSlug: string, projectId: Id<"projects">) => 
    prewarmSpecs(convex, [ 
      makeRouteQuerySpec(api.workspace.resolveContext, { 
        teamSlug, 
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
    if (hasAutoOpenedCreateDialog || teamsQuery.data === undefined || teamsQuery.data.length > 0) {
      return; 
    } 

    createDialogOpen = true; 
    hasAutoOpenedCreateDialog = true; 
  }); 
</script>

{#if teamsQuery.data && teamsQuery.data.length === 0}
  <div class="h-full flex flex-col">
    <DashboardHeader paths={[{ label: "dashboard" }]} />

    <div class="flex-1 flex items-center justify-center p-8 animate-in fade-in duration-300">
      <div class="max-w-sm w-full text-center border-2 border-[#1a1a1a] bg-[#f0f0e8] p-6">
        <div class="mx-auto mb-2 flex h-12 w-12 items-center justify-center bg-[#e8e8e0]">
          <Users class="h-6 w-6 text-[#888]" />
        </div>
        <h2 class="text-lg font-black text-[#1a1a1a]">Create your first team</h2>
        <p class="mt-2 text-sm text-[#888]">
          Teams help you organize projects and collaborate on video reviews.
        </p>
        <button
          type="button"
          class="mt-4 inline-flex w-full items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-3 py-2 text-sm font-bold text-[#f0f0e8] hover:bg-[#2d5a2d]"
          on:click={() => (createDialogOpen = true)}
        >
          <Plus class="mr-1.5 h-4 w-4" />
          Create a team
        </button>
      </div>
    </div>

    <CreateTeamDialog open={createDialogOpen} onOpenChange={(open) => (createDialogOpen = open)} />
  </div>
{:else}
  <div class="h-full flex flex-col">
    <DashboardHeader paths={[{ label: "dashboard" }]}>
      <button
        type="button"
        class="inline-flex items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-3 py-2 text-sm font-bold text-[#f0f0e8] hover:bg-[#2d5a2d]"
        on:click={() => (createDialogOpen = true)}
      >
        <Plus class="mr-1.5 h-4 w-4" />
        New team
      </button>
    </DashboardHeader>

    <div class="flex-1 overflow-auto p-6 space-y-12">
      <div class={`transition-opacity duration-300 ${teamsQuery.data === undefined ? "opacity-0" : "opacity-100"}`}>
        {#if teamsQuery.data}
          {#each teamsQuery.data as team}
            <div class="mb-12 last:mb-0">
              <div class="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div class="flex items-center gap-3">
                  <h2 class="text-xl font-black text-[#1a1a1a]">{team.name}</h2>
                  <span class="border-2 border-[#1a1a1a] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#888]">
                    {getDashboardBillingLabel(team.plan, team.billingStatus)}
                  </span>
                </div>
                <div class="flex items-center gap-4">
                  <a
                    href={teamSettingsPath(team.slug)}
                    class="text-[#888] hover:text-[#1a1a1a] text-sm font-bold transition-colors"
                  >
                    Billing
                  </a>
                  <a
                    href={teamHomePath(team.slug)}
                    class="text-[#888] hover:text-[#1a1a1a] text-sm font-bold flex items-center gap-1 transition-colors"
                  >
                    Manage team <ArrowRight class="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              {#if team.projects.length === 0}
                <div class="max-w-sm border-2 border-[#1a1a1a] bg-[#f0f0e8] p-6 text-center">
                  <div class="mx-auto mb-2 flex h-12 w-12 items-center justify-center bg-[#e8e8e0]">
                    <Folder class="h-6 w-6 text-[#888]" />
                  </div>
                  <h3 class="text-lg font-black text-[#1a1a1a]">No projects yet</h3>
                  <p class="mt-2 text-sm text-[#888]">
                    Head over to the team page to create your first project.
                  </p>
                  <a
                    href={teamHomePath(team.slug)}
                    class="mt-4 inline-flex w-full items-center justify-center border-2 border-[#1a1a1a] px-3 py-2 text-sm font-bold text-[#1a1a1a] hover:bg-[#e8e8e0]"
                  >
                    Open team
                  </a>
                </div>
              {:else}
                <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {#each team.projects as project}
                    <a
                      href={projectPath(team.slug, project._id)}
                      class="group cursor-pointer border-2 border-[#1a1a1a] bg-[#f0f0e8] p-5 hover:bg-[#e8e8e0] transition-colors"
                      use:prewarmIntent={{
                        run: () => prewarmProject(team.slug, project._id),
                      }}
                    >
                      <div class="flex items-start justify-between gap-3 pb-3">
                        <div class="flex-1 min-w-0">
                          <h3 class="truncate text-base font-black text-[#1a1a1a]">{project.name}</h3>
                          <p class="mt-1 text-sm text-[#888]">
                            {project.videoCount} video{project.videoCount !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div class="flex items-center justify-between text-sm text-[#888] group-hover:text-[#1a1a1a] transition-colors">
                        <span>Open project</span>
                        <ArrowRight class="h-4 w-4" />
                      </div>
                    </a>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        {/if}
      </div>
    </div>

    <CreateTeamDialog open={createDialogOpen} onOpenChange={(open) => (createDialogOpen = open)} />
  </div>
{/if}
