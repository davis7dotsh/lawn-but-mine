<script lang="ts">
  import { useQuery } from "convex-svelte";
  import { api } from "@convex/_generated/api";
  import Button from "$lib/components/ui/Button.svelte";
  import Card from "$lib/components/ui/Card.svelte";
  import CardHeader from "$lib/components/ui/CardHeader.svelte";
  import CardTitle from "$lib/components/ui/CardTitle.svelte";
  import CardDescription from "$lib/components/ui/CardDescription.svelte";
  import CardContent from "$lib/components/ui/CardContent.svelte";
  import Badge from "$lib/components/ui/Badge.svelte";
  import DashboardHeader from "$lib/components/DashboardHeader.svelte";
  import CreateTeamDialog from "$lib/components/CreateTeamDialog.svelte";
  import { getDashboardBillingLabel } from "$lib/shared/billingPlans";

  const teams = useQuery(api.teams.listWithProjects, {});
  let createDialogOpen = $state(false);
</script>

<svelte:head><title>Dashboard — lawn</title></svelte:head>

<div class="h-full flex flex-col">
  <DashboardHeader paths={[{ label: "dashboard" }]}>
    {#if teams.data && teams.data.length > 0}
      <Button onclick={() => (createDialogOpen = true)}>+ New team</Button>
    {/if}
  </DashboardHeader>

  {#if teams.data && teams.data.length === 0}
    <div class="flex-1 flex items-center justify-center p-8 animate-in fade-in duration-300">
      <Card class="max-w-sm w-full text-center">
        <CardHeader>
          <CardTitle>Create your first team</CardTitle>
          <CardDescription>Teams help you organize projects and collaborate on video reviews.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button class="w-full" onclick={() => (createDialogOpen = true)}>+ Create a team</Button>
        </CardContent>
      </Card>
    </div>
  {:else}
    <div class="flex-1 overflow-auto p-6 space-y-12">
      <div class={`transition-opacity duration-300 ${teams.isLoading ? "opacity-0" : "opacity-100"}`}>
        {#each teams.data ?? [] as team}
          {#if team}
            <div class="mb-12 last:mb-0">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
                <div class="flex items-center gap-3">
                  <h2 class="text-xl font-black text-[#1a1a1a]">{team.name}</h2>
                  <Badge variant="secondary">{getDashboardBillingLabel(team.plan, team.billingStatus)}</Badge>
                </div>
                <div class="flex items-center gap-4">
                  <a href={`/dashboard/${team.slug}/settings`} class="text-[#888] hover:text-[#1a1a1a] text-sm font-bold transition-colors">Billing</a>
                  <a href={`/dashboard/${team.slug}`} class="text-[#888] hover:text-[#1a1a1a] text-sm font-bold flex items-center gap-1 transition-colors">Manage team →</a>
                </div>
              </div>
              {#if team.projects.length === 0}
                <Card class="max-w-sm text-center">
                  <CardHeader>
                    <CardTitle>No projects yet</CardTitle>
                    <CardDescription>Head over to the team page to create your first project.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <a href={`/dashboard/${team.slug}`} class="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-bold bg-transparent text-[#1a1a1a] border-2 border-[#1a1a1a] hover:bg-[#e8e8e0] transition-colors">Open team</a>
                  </CardContent>
                </Card>
              {:else}
                <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {#each team.projects as project}
                    <a href={`/dashboard/${team.slug}/${project._id}`} class="block">
                      <Card class="group cursor-pointer hover:bg-[#e8e8e0] transition-colors">
                        <CardHeader>
                          <CardTitle class="text-base truncate">{project.name}</CardTitle>
                          <CardDescription>{project.videoCount} video{project.videoCount !== 1 ? "s" : ""}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div class="flex items-center justify-between text-sm text-[#888] group-hover:text-[#1a1a1a] transition-colors">
                            <span>Open project</span>
                            <span>→</span>
                          </div>
                        </CardContent>
                      </Card>
                    </a>
                  {/each}
                </div>
              {/if}
            </div>
          {/if}
        {/each}
      </div>
    </div>
  {/if}

  <CreateTeamDialog bind:open={createDialogOpen} />
</div>
