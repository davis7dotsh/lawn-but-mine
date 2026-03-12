<script lang="ts">
  import { onMount } from "svelte";

  import { clerkState, initClerk } from "@/lib/auth/clerk.svelte";

  type MountTarget = "sign-in" | "sign-up" | "user-button";

  let {
    mount,
    options = {},
    class: className = "",
  }: {
    mount: MountTarget;
    options?: Record<string, unknown>;
    class?: string;
  } = $props();

  let target: HTMLDivElement | null = null;

  function unmountCurrent() {
    if (!target || !clerkState.clerk || !clerkState.loaded) return;

    if (mount === "sign-in") {
      clerkState.clerk.unmountSignIn(target);
      return;
    }

    if (mount === "sign-up") {
      clerkState.clerk.unmountSignUp(target);
      return;
    }

    clerkState.clerk.unmountUserButton(target);
  }

  function mountCurrent() {
    if (!target || !clerkState.clerk || !clerkState.loaded) return;

    if (mount === "sign-in") {
      clerkState.clerk.mountSignIn(target, options as never);
      return;
    }

    if (mount === "sign-up") {
      clerkState.clerk.mountSignUp(target, options as never);
      return;
    }

    clerkState.clerk.mountUserButton(target, options as never);
  }

  onMount(() => {
    void initClerk();

    return () => {
      unmountCurrent();
    };
  });

  $effect(() => {
    target;
    mount;
    options;
    clerkState.clerk;
    clerkState.loaded;

    unmountCurrent();
    mountCurrent();

    return () => {
      unmountCurrent();
    };
  });
</script>

<div bind:this={target} class={className}></div>
