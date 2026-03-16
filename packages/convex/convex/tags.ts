import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import {
  identityAvatarUrl,
  identityName,
  requireProjectAccess,
  requireTeamAccess,
  requireVideoAccess,
} from "./auth";

function normalizeTagName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function normalizeTagNameKey(name: string) {
  return normalizeTagName(name).toLowerCase();
}

function normalizeTagColor(color: string) {
  const normalized = color.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(normalized)) {
    return normalized.toUpperCase();
  }

  throw new Error("Tag color must be a 6-digit hex color");
}

async function ensureUniqueTagName(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">,
  name: string,
  excludeTagId?: Id<"tags">,
) {
  const existingTags = await ctx.db
    .query("tags")
    .withIndex("by_team", (q) => q.eq("teamId", teamId))
    .collect();

  const normalizedNameKey = normalizeTagNameKey(name);
  const duplicate = existingTags.find(
    (tag) =>
      tag._id !== excludeTagId &&
      normalizeTagNameKey(tag.name) === normalizedNameKey,
  );

  if (duplicate) {
    throw new Error("A tag with that name already exists for this team");
  }
}

async function getTeamTag(ctx: QueryCtx | MutationCtx, tagId: Id<"tags">) {
  const tag = await ctx.db.get(tagId);
  if (!tag) {
    throw new Error("Tag not found");
  }
  return tag;
}

async function getVideoTagAssignments(ctx: MutationCtx, videoIds: Id<"videos">[]) {
  const assignments = await Promise.all(
    videoIds.map(async (videoId) => ({
      videoId,
      rows: await ctx.db
        .query("videoTags")
        .withIndex("by_video", (q) => q.eq("videoId", videoId))
        .collect(),
    })),
  );

  return new Map(assignments.map((entry) => [entry.videoId, entry.rows]));
}

export const listForProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const { project } = await requireProjectAccess(ctx, args.projectId);

    const [tags, videos] = await Promise.all([
      ctx.db
        .query("tags")
        .withIndex("by_team", (q) => q.eq("teamId", project.teamId))
        .collect(),
      ctx.db
        .query("videos")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .collect(),
    ]);

    const assignmentRows = await Promise.all(
      videos.map((video) =>
        ctx.db
          .query("videoTags")
          .withIndex("by_video", (q) => q.eq("videoId", video._id))
          .collect(),
      ),
    );

    const countsByTagId = new Map<Id<"tags">, number>();
    for (const assignments of assignmentRows) {
      for (const assignment of assignments) {
        countsByTagId.set(
          assignment.tagId,
          (countsByTagId.get(assignment.tagId) ?? 0) + 1,
        );
      }
    }

    return tags
      .map((tag) => ({
        ...tag,
        videoCount: countsByTagId.get(tag._id) ?? 0,
      }))
      .sort((left, right) => left.name.localeCompare(right.name));
  },
});

export const create = mutation({
  args: {
    teamId: v.id("teams"),
    name: v.string(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireTeamAccess(ctx, args.teamId, "member");

    const name = normalizeTagName(args.name);
    const color = normalizeTagColor(args.color);

    if (!name) {
      throw new Error("Tag name cannot be empty");
    }

    await ensureUniqueTagName(ctx, args.teamId, name);

    return await ctx.db.insert("tags", {
      teamId: args.teamId,
      name,
      color,
      createdByClerkId: user.subject,
      createdByName: identityName(user),
      createdByAvatarUrl: identityAvatarUrl(user),
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    tagId: v.id("tags"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tag = await getTeamTag(ctx, args.tagId);
    await requireTeamAccess(ctx, tag.teamId, "member");

    const updates: { name?: string; color?: string } = {};

    if (args.name !== undefined) {
      const name = normalizeTagName(args.name);
      if (!name) {
        throw new Error("Tag name cannot be empty");
      }
      await ensureUniqueTagName(ctx, tag.teamId, name, tag._id);
      updates.name = name;
    }

    if (args.color !== undefined) {
      updates.color = normalizeTagColor(args.color);
    }

    await ctx.db.patch(tag._id, updates);
  },
});

export const remove = mutation({
  args: {
    tagId: v.id("tags"),
  },
  handler: async (ctx, args) => {
    const tag = await getTeamTag(ctx, args.tagId);
    await requireTeamAccess(ctx, tag.teamId, "member");

    const assignments = await ctx.db
      .query("videoTags")
      .withIndex("by_tag", (q) => q.eq("tagId", tag._id))
      .collect();

    for (const assignment of assignments) {
      await ctx.db.delete(assignment._id);
    }

    await ctx.db.delete(tag._id);
  },
});

export const applyToVideos = mutation({
  args: {
    videoIds: v.array(v.id("videos")),
    addTagIds: v.optional(v.array(v.id("tags"))),
    removeTagIds: v.optional(v.array(v.id("tags"))),
  },
  handler: async (ctx, args) => {
    const uniqueVideoIds = Array.from(new Set(args.videoIds));
    if (uniqueVideoIds.length === 0) {
      return;
    }

    const addTagIds = Array.from(new Set(args.addTagIds ?? []));
    const removeTagIds = Array.from(new Set(args.removeTagIds ?? []));

    if (addTagIds.length === 0 && removeTagIds.length === 0) {
      return;
    }

    const accessRows = await Promise.all(
      uniqueVideoIds.map((videoId) => requireVideoAccess(ctx, videoId, "member")),
    );
    const teamId = accessRows[0]?.project.teamId;

    const tagIds = Array.from(new Set([...addTagIds, ...removeTagIds]));
    const tags = await Promise.all(tagIds.map((tagId) => getTeamTag(ctx, tagId)));

    for (const access of accessRows) {
      if (access.project.teamId !== teamId) {
        throw new Error("Selected videos must belong to the same team");
      }
    }

    for (const tag of tags) {
      if (tag.teamId !== teamId) {
        throw new Error("Tag does not belong to the selected videos' team");
      }
    }

    const assignmentsByVideoId = await getVideoTagAssignments(ctx, uniqueVideoIds);
    const actorClerkId = accessRows[0].user.subject;

    for (const videoId of uniqueVideoIds) {
      const assignments = assignmentsByVideoId.get(videoId) ?? [];
      const assignmentByTagId = new Map(
        assignments.map((assignment) => [assignment.tagId, assignment]),
      );

      for (const tagId of removeTagIds) {
        const assignment = assignmentByTagId.get(tagId);
        if (assignment) {
          await ctx.db.delete(assignment._id);
        }
      }

      for (const tagId of addTagIds) {
        if (assignmentByTagId.has(tagId)) {
          continue;
        }

        await ctx.db.insert("videoTags", {
          videoId,
          tagId,
          addedByClerkId: actorClerkId,
          addedAt: Date.now(),
        });
      }
    }
  },
});
