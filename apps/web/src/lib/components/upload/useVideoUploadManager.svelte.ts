
import { useConvexClient } from "convex-svelte"; 
import { api } from "@lawn/convex/api"; 
import type { Id } from "@lawn/convex/dataModel"; 
import type { ManagedUploadItem } from "@/lib/dashboardUploadContext.svelte"; 

function createUploadId() { 
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") { 
    return crypto.randomUUID(); 
  } 
  return Math.random().toString(36).slice(2); 
} 

export function useVideoUploadManager() { 
  const convex = useConvexClient(); 
  let uploads = $state<ManagedUploadItem[]>([]); 

  const updateUpload = (uploadId: string, updater: (upload: ManagedUploadItem) => ManagedUploadItem) => { 
    uploads = uploads.map((upload) => (upload.id === uploadId ? updater(upload) : upload)); 
  }; 

  const uploadFilesToProject = async (projectId: Id<"projects">, files: File[]) => { 
    for (const file of files) { 
      const uploadId = createUploadId(); 
      const abortController = new AbortController(); 
      const title = file.name.replace(/\.[^/.]+$/, ""); 

      uploads = [ 
        ...uploads, 
        { 
          id: uploadId, 
          projectId, 
          file, 
          progress: 0, 
          status: "pending", 
          abortController, 
        }, 
      ]; 

      let createdVideoId: Id<"videos"> | undefined; 

      try { 
        createdVideoId = await convex.mutation(api.videos.create, { 
          projectId, 
          title, 
          fileSize: file.size, 
          contentType: file.type || "video/mp4", 
        }); 

        updateUpload(uploadId, (upload) => ({ 
          ...upload, 
          videoId: createdVideoId, 
          status: "uploading", 
        })); 

        const { url } = await convex.action(api.videoActions.getUploadUrl, { 
          videoId: createdVideoId, 
          filename: file.name, 
          fileSize: file.size, 
          contentType: file.type || "video/mp4", 
        }); 

        await new Promise<void>((resolve, reject) => { 
          const xhr = new XMLHttpRequest(); 
          let lastTime = Date.now(); 
          let lastLoaded = 0; 
          const recentSpeeds: number[] = []; 

          xhr.upload.addEventListener("progress", (event) => { 
            if (!event.lengthComputable) return; 

            const percentage = Math.round((event.loaded / event.total) * 100); 
            const now = Date.now(); 
            const timeDelta = (now - lastTime) / 1000; 
            const bytesDelta = event.loaded - lastLoaded; 

            if (timeDelta > 0.1) { 
              const speed = bytesDelta / timeDelta; 
              recentSpeeds.push(speed); 
              if (recentSpeeds.length > 5) { 
                recentSpeeds.shift(); 
              } 
              lastTime = now; 
              lastLoaded = event.loaded; 
            } 

            const avgSpeed = 
              recentSpeeds.length > 0 
                ? recentSpeeds.reduce((sum, speed) => sum + speed, 0) / recentSpeeds.length 
                : 0; 
            const remaining = event.total - event.loaded; 
            const eta = avgSpeed > 0 ? Math.ceil(remaining / avgSpeed) : null; 

            updateUpload(uploadId, (upload) => ({ 
              ...upload, 
              progress: percentage, 
              bytesPerSecond: avgSpeed, 
              estimatedSecondsRemaining: eta, 
            })); 
          }); 

          xhr.addEventListener("load", () => { 
            if (xhr.status >= 200 && xhr.status < 300) { 
              resolve(); 
              return; 
            } 
            reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`)); 
          }); 

          xhr.addEventListener("error", () => { 
            reject(new Error("Upload failed: Network error")); 
          }); 

          xhr.addEventListener("abort", () => { 
            reject(new Error("Upload cancelled")); 
          }); 

          abortController.signal.addEventListener("abort", () => { 
            xhr.abort(); 
          }); 

          xhr.open("PUT", url); 
          xhr.setRequestHeader("Content-Type", file.type || "video/mp4"); 
          xhr.send(file); 
        }); 

        updateUpload(uploadId, (upload) => ({ 
          ...upload, 
          status: "processing", 
          progress: 100, 
        })); 

        await convex.action(api.videoActions.markUploadComplete, { 
          videoId: createdVideoId, 
        }); 

        updateUpload(uploadId, (upload) => ({ 
          ...upload, 
          status: "complete", 
          progress: 100, 
        })); 

        setTimeout(() => { 
          uploads = uploads.filter((upload) => upload.id !== uploadId); 
        }, 3000); 
      } catch (error) { 
        const errorMessage = error instanceof Error ? error.message : "Upload failed"; 

        updateUpload(uploadId, (upload) => ({ 
          ...upload, 
          status: "error", 
          error: errorMessage, 
        })); 

        if (createdVideoId) { 
          void convex.action(api.videoActions.markUploadFailed, { 
            videoId: createdVideoId, 
          }).catch(() => undefined); 
        } 
      } 
    } 
  }; 

  const cancelUpload = (uploadId: string) => { 
    const upload = uploads.find((item) => item.id === uploadId); 
    upload?.abortController?.abort(); 

    if (upload?.videoId) { 
      void convex.action(api.videoActions.markUploadFailed, { 
        videoId: upload.videoId, 
      }).catch(() => undefined); 
    } 

    uploads = uploads.filter((item) => item.id !== uploadId); 
  }; 

  return { 
    get uploads() { 
      return uploads; 
    }, 
    uploadFilesToProject, 
    cancelUpload, 
  }; 
} 
