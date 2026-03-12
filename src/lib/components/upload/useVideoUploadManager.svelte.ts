// pragma: allowlist secret
import { useConvexClient } from "convex-svelte"; // pragma: allowlist secret
import { api } from "@convex/_generated/api"; // pragma: allowlist secret
import type { Id } from "@convex/_generated/dataModel"; // pragma: allowlist secret
import type { ManagedUploadItem } from "@/lib/dashboardUploadContext.svelte"; // pragma: allowlist secret

function createUploadId() { // pragma: allowlist secret
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") { // pragma: allowlist secret
    return crypto.randomUUID(); // pragma: allowlist secret
  } // pragma: allowlist secret
  return Math.random().toString(36).slice(2); // pragma: allowlist secret
} // pragma: allowlist secret

export function useVideoUploadManager() { // pragma: allowlist secret
  const convex = useConvexClient(); // pragma: allowlist secret
  let uploads = $state<ManagedUploadItem[]>([]); // pragma: allowlist secret

  const updateUpload = (uploadId: string, updater: (upload: ManagedUploadItem) => ManagedUploadItem) => { // pragma: allowlist secret
    uploads = uploads.map((upload) => (upload.id === uploadId ? updater(upload) : upload)); // pragma: allowlist secret
  }; // pragma: allowlist secret

  const uploadFilesToProject = async (projectId: Id<"projects">, files: File[]) => { // pragma: allowlist secret
    for (const file of files) { // pragma: allowlist secret
      const uploadId = createUploadId(); // pragma: allowlist secret
      const abortController = new AbortController(); // pragma: allowlist secret
      const title = file.name.replace(/\.[^/.]+$/, ""); // pragma: allowlist secret

      uploads = [ // pragma: allowlist secret
        ...uploads, // pragma: allowlist secret
        { // pragma: allowlist secret
          id: uploadId, // pragma: allowlist secret
          projectId, // pragma: allowlist secret
          file, // pragma: allowlist secret
          progress: 0, // pragma: allowlist secret
          status: "pending", // pragma: allowlist secret
          abortController, // pragma: allowlist secret
        }, // pragma: allowlist secret
      ]; // pragma: allowlist secret

      let createdVideoId: Id<"videos"> | undefined; // pragma: allowlist secret

      try { // pragma: allowlist secret
        createdVideoId = await convex.mutation(api.videos.create, { // pragma: allowlist secret
          projectId, // pragma: allowlist secret
          title, // pragma: allowlist secret
          fileSize: file.size, // pragma: allowlist secret
          contentType: file.type || "video/mp4", // pragma: allowlist secret
        }); // pragma: allowlist secret

        updateUpload(uploadId, (upload) => ({ // pragma: allowlist secret
          ...upload, // pragma: allowlist secret
          videoId: createdVideoId, // pragma: allowlist secret
          status: "uploading", // pragma: allowlist secret
        })); // pragma: allowlist secret

        const { url } = await convex.action(api.videoActions.getUploadUrl, { // pragma: allowlist secret
          videoId: createdVideoId, // pragma: allowlist secret
          filename: file.name, // pragma: allowlist secret
          fileSize: file.size, // pragma: allowlist secret
          contentType: file.type || "video/mp4", // pragma: allowlist secret
        }); // pragma: allowlist secret

        await new Promise<void>((resolve, reject) => { // pragma: allowlist secret
          const xhr = new XMLHttpRequest(); // pragma: allowlist secret
          let lastTime = Date.now(); // pragma: allowlist secret
          let lastLoaded = 0; // pragma: allowlist secret
          const recentSpeeds: number[] = []; // pragma: allowlist secret

          xhr.upload.addEventListener("progress", (event) => { // pragma: allowlist secret
            if (!event.lengthComputable) return; // pragma: allowlist secret

            const percentage = Math.round((event.loaded / event.total) * 100); // pragma: allowlist secret
            const now = Date.now(); // pragma: allowlist secret
            const timeDelta = (now - lastTime) / 1000; // pragma: allowlist secret
            const bytesDelta = event.loaded - lastLoaded; // pragma: allowlist secret

            if (timeDelta > 0.1) { // pragma: allowlist secret
              const speed = bytesDelta / timeDelta; // pragma: allowlist secret
              recentSpeeds.push(speed); // pragma: allowlist secret
              if (recentSpeeds.length > 5) { // pragma: allowlist secret
                recentSpeeds.shift(); // pragma: allowlist secret
              } // pragma: allowlist secret
              lastTime = now; // pragma: allowlist secret
              lastLoaded = event.loaded; // pragma: allowlist secret
            } // pragma: allowlist secret

            const avgSpeed = // pragma: allowlist secret
              recentSpeeds.length > 0 // pragma: allowlist secret
                ? recentSpeeds.reduce((sum, speed) => sum + speed, 0) / recentSpeeds.length // pragma: allowlist secret
                : 0; // pragma: allowlist secret
            const remaining = event.total - event.loaded; // pragma: allowlist secret
            const eta = avgSpeed > 0 ? Math.ceil(remaining / avgSpeed) : null; // pragma: allowlist secret

            updateUpload(uploadId, (upload) => ({ // pragma: allowlist secret
              ...upload, // pragma: allowlist secret
              progress: percentage, // pragma: allowlist secret
              bytesPerSecond: avgSpeed, // pragma: allowlist secret
              estimatedSecondsRemaining: eta, // pragma: allowlist secret
            })); // pragma: allowlist secret
          }); // pragma: allowlist secret

          xhr.addEventListener("load", () => { // pragma: allowlist secret
            if (xhr.status >= 200 && xhr.status < 300) { // pragma: allowlist secret
              resolve(); // pragma: allowlist secret
              return; // pragma: allowlist secret
            } // pragma: allowlist secret
            reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`)); // pragma: allowlist secret
          }); // pragma: allowlist secret

          xhr.addEventListener("error", () => { // pragma: allowlist secret
            reject(new Error("Upload failed: Network error")); // pragma: allowlist secret
          }); // pragma: allowlist secret

          xhr.addEventListener("abort", () => { // pragma: allowlist secret
            reject(new Error("Upload cancelled")); // pragma: allowlist secret
          }); // pragma: allowlist secret

          abortController.signal.addEventListener("abort", () => { // pragma: allowlist secret
            xhr.abort(); // pragma: allowlist secret
          }); // pragma: allowlist secret

          xhr.open("PUT", url); // pragma: allowlist secret
          xhr.setRequestHeader("Content-Type", file.type || "video/mp4"); // pragma: allowlist secret
          xhr.send(file); // pragma: allowlist secret
        }); // pragma: allowlist secret

        updateUpload(uploadId, (upload) => ({ // pragma: allowlist secret
          ...upload, // pragma: allowlist secret
          status: "processing", // pragma: allowlist secret
          progress: 100, // pragma: allowlist secret
        })); // pragma: allowlist secret

        await convex.action(api.videoActions.markUploadComplete, { // pragma: allowlist secret
          videoId: createdVideoId, // pragma: allowlist secret
        }); // pragma: allowlist secret

        updateUpload(uploadId, (upload) => ({ // pragma: allowlist secret
          ...upload, // pragma: allowlist secret
          status: "complete", // pragma: allowlist secret
          progress: 100, // pragma: allowlist secret
        })); // pragma: allowlist secret

        setTimeout(() => { // pragma: allowlist secret
          uploads = uploads.filter((upload) => upload.id !== uploadId); // pragma: allowlist secret
        }, 3000); // pragma: allowlist secret
      } catch (error) { // pragma: allowlist secret
        const errorMessage = error instanceof Error ? error.message : "Upload failed"; // pragma: allowlist secret

        updateUpload(uploadId, (upload) => ({ // pragma: allowlist secret
          ...upload, // pragma: allowlist secret
          status: "error", // pragma: allowlist secret
          error: errorMessage, // pragma: allowlist secret
        })); // pragma: allowlist secret

        if (createdVideoId) { // pragma: allowlist secret
          void convex.action(api.videoActions.markUploadFailed, { // pragma: allowlist secret
            videoId: createdVideoId, // pragma: allowlist secret
          }).catch(() => undefined); // pragma: allowlist secret
        } // pragma: allowlist secret
      } // pragma: allowlist secret
    } // pragma: allowlist secret
  }; // pragma: allowlist secret

  const cancelUpload = (uploadId: string) => { // pragma: allowlist secret
    const upload = uploads.find((item) => item.id === uploadId); // pragma: allowlist secret
    upload?.abortController?.abort(); // pragma: allowlist secret

    if (upload?.videoId) { // pragma: allowlist secret
      void convex.action(api.videoActions.markUploadFailed, { // pragma: allowlist secret
        videoId: upload.videoId, // pragma: allowlist secret
      }).catch(() => undefined); // pragma: allowlist secret
    } // pragma: allowlist secret

    uploads = uploads.filter((item) => item.id !== uploadId); // pragma: allowlist secret
  }; // pragma: allowlist secret

  return { // pragma: allowlist secret
    get uploads() { // pragma: allowlist secret
      return uploads; // pragma: allowlist secret
    }, // pragma: allowlist secret
    uploadFilesToProject, // pragma: allowlist secret
    cancelUpload, // pragma: allowlist secret
  }; // pragma: allowlist secret
} // pragma: allowlist secret
