<script lang="ts">// pragma: allowlist secret
  import { Clock, MessageSquare } from "lucide-svelte"; // pragma: allowlist secret
  import { formatTimestamp } from "@/lib/utils";

  let {
    value = $bindable(""),
    currentTime = 0,
    isSubmitting = false,
    error = null,
    signedIn = false,
    signInHref,
    submitLabel = "Post comment",
    postingLabel = "Posting...",
    placeholder = "Leave a comment...",
    onSubmit = async (_text: string) => {},
    rowsClass = "min-h-[90px]",
  }: {
    value?: string;
    currentTime?: number;
    isSubmitting?: boolean;
    error?: string | null;
    signedIn?: boolean;
    signInHref: string;
    submitLabel?: string;
    postingLabel?: string;
    placeholder?: string;
    onSubmit?: (text: string) => Promise<void> | void;
    rowsClass?: string;
  } = $props();

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!value.trim() || isSubmitting) {
      return;
    }

    await onSubmit(value.trim());
  }
</script>

{#if signedIn}
  <form class="space-y-2" onsubmit={handleSubmit}>
    <div class="flex items-center gap-2 text-xs text-[#666]">
      <Clock class="h-3.5 w-3.5" />
      Comment at {formatTimestamp(currentTime)}
    </div>

    <textarea
      bind:value
      placeholder={placeholder}
      class={`w-full border-2 border-[#1a1a1a] bg-[#f0f0e8] px-3 py-2 text-sm text-[#1a1a1a] outline-none placeholder:text-[#888] ${rowsClass}`}
    ></textarea>

    {#if error}
      <p class="text-xs text-[#dc2626]">{error}</p>
    {/if}

    <button
      type="submit"
      class="inline-flex w-full items-center justify-center gap-2 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-4 py-2 text-sm font-bold text-[#f0f0e8] transition hover:bg-[#2d5a2d] disabled:cursor-not-allowed disabled:opacity-60"
      disabled={!value.trim() || isSubmitting}
    >
      <MessageSquare class="h-4 w-4" />
      {isSubmitting ? postingLabel : submitLabel}
    </button>
  </form>
{:else}
  <a
    href={signInHref}
    class="inline-flex w-full items-center justify-center gap-2 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-4 py-2 text-sm font-bold text-[#f0f0e8] transition hover:bg-[#2d5a2d]"
  >
    <MessageSquare class="h-4 w-4" />
    Sign in to comment
  </a>
{/if}
