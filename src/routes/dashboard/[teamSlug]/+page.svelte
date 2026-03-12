<script lang="ts">
  import { useQuery, useConvexClient } from "convex-svelte";
  import { api } from "@convex/_generated/api";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import Button from "$lib/components/ui/Button.svelte";
  import Input from "$lib/components/ui/Input.svelte";
  import Card from "$lib/components/ui/Card.svelte";
  import CardHeader from "$lib/components/ui/CardHeader.svelte";
  import CardTitle from "$lib/components/ui/CardTitle.svelte";
  import CardDescription from "$lib/components/ui/CardDescription.svelte";
  import CardContent from "$lib/components/ui/CardContent.svelte";
  import Dialog from "$lib/components/ui/Dialog.svelte";
  import DashboardHeader from "$lib/components/DashboardHeader.svelte";
  import { shouldRefreshBilling } from "$lib/shared/billingPlans";

  let teamSlug = $derived($page.params.teamSlug);
  const client = useConvexClient();

  const context = useQuery(api.workspace.resolveContext, () => ({ teamSlug }));
  const team = $derived(context.data?.team);
  const projects = useQuery(api.projects.list, () => team ? { teamId: team._id } : "skip");
  const billing = useQuery(api.billing.getTeamBilling, () => team ? { teamId: team._id } : "skip");

  let createDialogOpen = $state(false);
  let memberDialogOpen = $state(false);
  let newProjectName = $state("");
  let isLoading = $state(false);

  $effect(() => {
    if (!team || billing.data === undefined) return;
    const search = typeof window === "undefined" ? "" : window.location.search;
    const forceRefresh = search.includes("billing=success") || search.includes("billing=cancel");
    if (!shouldRefreshBilling(billing.data?.billingLastSyncedAt, forceRefresh)) return;
    client.action(api.billing.refreshTeamBilling, { teamId: team._id }).catch((error: unknown) => {
      console.warn("Billing refresh failed", error);
    });
  });

  const canManageMembers = $derived(team?.role === "owner" || team?.role === "admin");
  const hasActiveSubscription = $derived(billing.data?.hasActiveSubscription ?? false);
  const canCreateProject = $derived(team?.role !== "viewer" && hasActiveSubscription);
  const canAccessBilling = $derived(team?.role === "owner");
  const isLoadingData = $derived(context.data === undefined || billing.data === undefined || projects.data === undefined);

  async function handleCreateProject(e: SubmitEvent) {
    e.preventDefault();
    if (!newProjectName.trim() || !team) return;
    isLoading = true;
    try {
      const projectId = await client.mutation(api.projects.create, { teamId: team._id, name: newProjectName.trim() });
      createDialogOpen = false;
      newProjectName = "";
      goto(`/dashboard/${team.slug}/${projectId}`);
    } catch (error) {
      console.error("Failed to create project:", error);
    } finally {
      isLoading = false;
    }
  }

  async function handleDeleteProject(projectId: string) {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await client.mutation(api.projects.remove, { projectId: projectId as any });
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  }
</script>

<div class="h-full flex flex-col">
  <DashboardHeader paths={[{ label: team?.slug ?? "team" }]}>
    {#if canAccessBilling && team}
      <Button variant="outline" onclick={() => goto(`/dashboard/${team.slug}/settings`)}>Billing</Button>
    {/if}
    {#if canCreateProject}
      <Button onclick={() => createDialogOpen = true}>+ New project</Button>
    {/if}
  </DashboardHeader>

  <div class="flex-1 overflow-auto p-6">
    {#if context.data === null}
      <div class="flex items-center justify-center h-full">
        <div class="text-[#888]">Team not found</div>
      </div>
    {:else if !isLoadingData && (projects.data?.length ?? 0) === 0}
      <div class="h-full flex items-center justify-center animate-in fade-in duration-300">
        <Card class="max-w-sm text-center">
          <CardHeader>
            <CardTitle>No projects yet</CardTitle>
            <CardDescription>
              {hasActiveSubscription ? "Create your first project to start uploading videos." : "Activate billing first, then create your first project."}
            </CardDescription>
          </CardHeader>
          {#if canCreateProject}
            <CardContent>
              <Button class="w-full" onclick={() => createDialogOpen = true}>+ Create project</Button>
            </CardContent>
          {:else if canAccessBilling}
            <CardContent>
              <Button variant="primary" class="w-full" onclick={() => goto(`/dashboard/${team?.slug}/settings`)}>Go to Billing</Button>
            </CardContent>
          {/if}
        </Card>
      </div>
    {:else}
      <div class={`grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 transition-opacity duration-300 ${isLoadingData ? 'opacity-0' : 'opacity-100'}`}>
        {#each projects.data ?? [] as project}
          <Card class="group cursor-pointer hover:bg-[#e8e8e0] transition-colors" onclick={() => goto(`/dashboard/${team?.slug}/${project._id}`)}>
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
        {/each}
      </div>
    {/if}
  </div>

  <Dialog open={createDialogOpen} onclose={() => createDialogOpen = false}>
    <form onsubmit={handleCreateProject}>
      <h2 class="text-xl font-black text-[#1a1a1a]">Create project</h2>
      <p class="text-sm text-[#888] mt-1">Projects help you organize related videos together.</p>
      <div class="py-4">
        <Input placeholder="Project name" value={newProjectName} oninput={(e) => newProjectName = e.currentTarget.value} autofocus />
      </div>
      <div class="flex gap-3">
        <Button type="button" variant="outline" onclick={() => createDialogOpen = false}>Cancel</Button>
        <Button type="submit" disabled={!newProjectName.trim() || isLoading}>{isLoading ? "Creating..." : "Create"}</Button>
      </div>
    </form>
  </Dialog>
</div>
