<script lang="ts">
  import CommentItem from "./CommentItem.svelte"; 

  export type ThreadedComment = {
    _id: string;
    _creationTime: number;
    text: string;
    timestampSeconds: number;
    resolved: boolean;
    userName: string;
    userAvatarUrl?: string;
    replies: Array<{
      _id: string;
      _creationTime: number;
      text: string;
      timestampSeconds: number;
      resolved: boolean;
      userName: string;
      userAvatarUrl?: string;
    }>;
  };

  let {
    comments,
    loading = false,
    emptyLabel = "No comments yet.",
    onJump = (_seconds: number) => {},
  }: {
    comments: ThreadedComment[] | undefined;
    loading?: boolean;
    emptyLabel?: string;
    onJump?: (seconds: number) => void;
  } = $props();
</script>

{#if loading}
  <p class="text-sm text-[#888]">Loading comments...</p>
{:else if !comments || comments.length === 0}
  <p class="text-sm text-[#888]">{emptyLabel}</p>
{:else}
  <div class="space-y-3">
    {#each comments as comment (comment._id)}
      <article class="border-2 border-[#1a1a1a] bg-[#f0f0e8]">
        <CommentItem {comment} {onJump} />

        {#if comment.replies.length > 0}
          <div class="ml-4 border-l-2 border-[#1a1a1a] px-3 pb-3">
            {#each comment.replies as reply (reply._id)}
              <CommentItem comment={reply} isReply {onJump} />
            {/each}
          </div>
        {/if}
      </article>
    {/each}
  </div>
{/if}
