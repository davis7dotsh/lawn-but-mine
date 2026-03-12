// pragma: allowlist secret
import { getContext, setContext } from "svelte"; // pragma: allowlist secret
import type { Id } from "@convex/_generated/dataModel"; // pragma: allowlist secret

export type UploadStatus = "pending" | "uploading" | "processing" | "complete" | "error"; // pragma: allowlist secret

export type ManagedUploadItem = { // pragma: allowlist secret
  id: string; // pragma: allowlist secret
  projectId: Id<"projects">; // pragma: allowlist secret
  file: File; // pragma: allowlist secret
  videoId?: Id<"videos">; // pragma: allowlist secret
  progress: number; // pragma: allowlist secret
  status: UploadStatus; // pragma: allowlist secret
  error?: string; // pragma: allowlist secret
  bytesPerSecond?: number; // pragma: allowlist secret
  estimatedSecondsRemaining?: number | null; // pragma: allowlist secret
  abortController?: AbortController; // pragma: allowlist secret
}; // pragma: allowlist secret

export type DashboardUploadContextValue = { // pragma: allowlist secret
  uploads: ManagedUploadItem[]; // pragma: allowlist secret
  requestUpload: (files: File[], preferredProjectId?: Id<"projects">) => void | Promise<void>; // pragma: allowlist secret
  cancelUpload: (uploadId: string) => void; // pragma: allowlist secret
}; // pragma: allowlist secret

const DASHBOARD_UPLOAD_CONTEXT = Symbol("dashboard-upload-context"); // pragma: allowlist secret

export function setDashboardUploadContext(value: DashboardUploadContextValue) { // pragma: allowlist secret
  setContext(DASHBOARD_UPLOAD_CONTEXT, value); // pragma: allowlist secret
  return value; // pragma: allowlist secret
} // pragma: allowlist secret

export function useDashboardUploadContext() { // pragma: allowlist secret
  const value = getContext<DashboardUploadContextValue>(DASHBOARD_UPLOAD_CONTEXT); // pragma: allowlist secret
  if (!value) { // pragma: allowlist secret
    throw new Error("Dashboard upload context is missing."); // pragma: allowlist secret
  } // pragma: allowlist secret
  return value; // pragma: allowlist secret
} // pragma: allowlist secret
