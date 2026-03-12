
import { getContext, setContext } from "svelte"; 
import type { Id } from "@convex/_generated/dataModel"; 

export type UploadStatus = "pending" | "uploading" | "processing" | "complete" | "error"; 

export type ManagedUploadItem = { 
  id: string; 
  projectId: Id<"projects">; 
  file: File; 
  videoId?: Id<"videos">; 
  progress: number; 
  status: UploadStatus; 
  error?: string; 
  bytesPerSecond?: number; 
  estimatedSecondsRemaining?: number | null; 
  abortController?: AbortController; 
}; 

export type DashboardUploadContextValue = { 
  uploads: ManagedUploadItem[]; 
  requestUpload: (files: File[], preferredProjectId?: Id<"projects">) => void | Promise<void>; 
  cancelUpload: (uploadId: string) => void; 
}; 

const DASHBOARD_UPLOAD_CONTEXT = Symbol("dashboard-upload-context"); 

export function setDashboardUploadContext(value: DashboardUploadContextValue) { 
  setContext(DASHBOARD_UPLOAD_CONTEXT, value); 
  return value; 
} 

export function useDashboardUploadContext() { 
  const value = getContext<DashboardUploadContextValue>(DASHBOARD_UPLOAD_CONTEXT); 
  if (!value) { 
    throw new Error("Dashboard upload context is missing."); 
  } 
  return value; 
} 
