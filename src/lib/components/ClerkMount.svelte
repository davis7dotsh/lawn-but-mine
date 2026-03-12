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
  let ready = $state(false);
  let retryTimeoutId: ReturnType<typeof setTimeout> | null = null;

  function unmountCurrent() {
    if (retryTimeoutId) {
      clearTimeout(retryTimeoutId);
      retryTimeoutId = null;
    }

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
    try {
      if (mount === "sign-in") {
        clerkState.clerk.mountSignIn(target, options as never);
        return;
      }

      if (mount === "sign-up") {
        clerkState.clerk.mountSignUp(target, options as never);
        return;
      }

      clerkState.clerk.mountUserButton(target, options as never);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("not loaded with UI components")
      ) {
        retryTimeoutId = setTimeout(() => {
          retryTimeoutId = null;
          mountCurrent();
        }, 100);
        return;
      }

      throw error;
    }
  }

  onMount(() => {
    let active = true;

    void initClerk().then(async () => {
      if (active) {
        await Promise.resolve();
        ready = true;
      }
    });

    return () => {
      active = false;
      unmountCurrent();
    };
  });

  $effect(() => {
    target;
    mount;
    options;
    ready;
    clerkState.clerk;
    clerkState.loaded;

    if (!ready) {
      return;
    }

    unmountCurrent();
    mountCurrent();

    return () => {
      unmountCurrent();
    };
  });
</script>

<div bind:this={target} class={className}></div>
