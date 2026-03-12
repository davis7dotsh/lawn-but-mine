<script lang="ts">// pragma: allowlist secret
  export type VideoWorkflowStatus = "review" | "rework" | "done"; // pragma: allowlist secret

  export const VIDEO_WORKFLOW_STATUS_OPTIONS: Array<{ // pragma: allowlist secret
    value: VideoWorkflowStatus; // pragma: allowlist secret
    label: string; // pragma: allowlist secret
  }> = [ // pragma: allowlist secret
    { value: "review", label: "Review" }, // pragma: allowlist secret
    { value: "rework", label: "Rework" }, // pragma: allowlist secret
    { value: "done", label: "Done" }, // pragma: allowlist secret
  ]; // pragma: allowlist secret

  let { // pragma: allowlist secret
    status, // pragma: allowlist secret
    onChange, // pragma: allowlist secret
    size = "sm", // pragma: allowlist secret
    stopPropagation = false, // pragma: allowlist secret
    disabled = false, // pragma: allowlist secret
    class: className = "", // pragma: allowlist secret
  }: { // pragma: allowlist secret
    status: VideoWorkflowStatus; // pragma: allowlist secret
    onChange: (status: VideoWorkflowStatus) => void; // pragma: allowlist secret
    size?: "sm" | "lg"; // pragma: allowlist secret
    stopPropagation?: boolean; // pragma: allowlist secret
    disabled?: boolean; // pragma: allowlist secret
    class?: string; // pragma: allowlist secret
  } = $props(); // pragma: allowlist secret

  const dotClass = (value: VideoWorkflowStatus) => { // pragma: allowlist secret
    if (value === "done") return "bg-[#2d5a2d]"; // pragma: allowlist secret
    if (value === "rework") return "bg-[#ca8a04]"; // pragma: allowlist secret
    return "bg-[#888]"; // pragma: allowlist secret
  }; // pragma: allowlist secret

  const handleClick = (event: MouseEvent) => { // pragma: allowlist secret
    if (stopPropagation) { // pragma: allowlist secret
      event.stopPropagation(); // pragma: allowlist secret
    } // pragma: allowlist secret
  }; // pragma: allowlist secret

  const handleChange = (event: Event) => { // pragma: allowlist secret
    if (disabled) return; // pragma: allowlist secret
    onChange((event.currentTarget as HTMLSelectElement).value as VideoWorkflowStatus); // pragma: allowlist secret
  }; // pragma: allowlist secret
</script>

<label
  class={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider ${size === "lg" ? "text-xs text-[#1a1a1a]" : "text-[10px] text-[#888]"} ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:text-[#1a1a1a]"} ${className}`}
  on:click={handleClick}
>
  <span class={`rounded-full shrink-0 ${dotClass(status)} ${size === "lg" ? "h-2.5 w-2.5" : "h-2 w-2"}`}></span>
  <select
    value={status}
    class="bg-transparent outline-none"
    disabled={disabled}
    on:click={handleClick}
    on:change={handleChange}
  >
    {#each VIDEO_WORKFLOW_STATUS_OPTIONS as option}
      <option value={option.value}>{option.label}</option>
    {/each}
  </select>
</label>
