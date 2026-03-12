<script lang="ts">// pragma: allowlist secret
  import { formatRelativeTime, formatTimestamp, getInitials } from "@/lib/utils"; // pragma: allowlist secret

  type CommentEntry = {
    _id: string;
    _creationTime: number;
    text: string;
    timestampSeconds: number;
    resolved: boolean;
    userName: string;
    userAvatarUrl?: string;
  };

  let {
    comment,
    isReply = false,
    onJump = (_seconds: number) => {},
  }: {
    comment: CommentEntry;
    isReply?: boolean;
    onJump?: (seconds: number) => void;
  } = $props();
</script>

<article
  class={[
    "transition-all",
    isReply ? "py-2" : "p-3",
    comment.resolved ? "opacity-60" : "",
  ].join(" ")}
>
  <div class="flex items-start gap-3">
    <div class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden border-2 border-[#1a1a1a] bg-[#e8e8e0] text-[10px] font-bold text-[#1a1a1a]">
      {#if comment.userAvatarUrl}
        <img
          src={comment.userAvatarUrl}
          alt={comment.userName}
          class="h-full w-full object-cover"
        />
      {:else}
        {getInitials(comment.userName)}
      {/if}
    </div>

    <div class="min-w-0 flex-1">
      <div class="flex items-center justify-between gap-2">
        <div class="flex min-w-0 items-center gap-2">
          <span class="truncate text-sm font-bold text-[#1a1a1a]">{comment.userName}</span>
          <button
            type="button"
            class="shrink-0 font-mono text-xs font-bold text-[#2d5a2d] hover:text-[#1a1a1a]"
            onclick={() => onJump(comment.timestampSeconds)}
          >
            {formatTimestamp(comment.timestampSeconds)}
          </button>
          {#if comment.resolved}
            <span class="shrink-0 border border-[#2d5a2d] bg-[#2d5a2d]/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#2d5a2d]">
              Resolved
            </span>
          {/if}
        </div>
      </div>

      <p class="mt-1 whitespace-pre-wrap break-words text-sm text-[#1a1a1a]">{comment.text}</p>
      <p class="mt-1 text-[11px] text-[#888]">{formatRelativeTime(comment._creationTime)}</p>
    </div>
  </div>
</article>
