import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

export async function deleteVideoTagLinks(
  ctx: MutationCtx,
  videoId: Id<"videos">,
) {
  const videoTags = await ctx.db
    .query("videoTags")
    .withIndex("by_video", (q) => q.eq("videoId", videoId))
    .collect();

  for (const videoTag of videoTags) {
    await ctx.db.delete(videoTag._id);
  }
}
