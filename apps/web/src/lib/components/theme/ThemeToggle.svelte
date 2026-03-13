<script lang="ts">
  import { Moon, Sun } from "lucide-svelte";

  import { themeState, toggleTheme } from "@/lib/theme.svelte";
</script>

<button
  type="button"
  class="inline-flex h-10 w-10 items-center justify-center border-2 border-[#1a1a1a] bg-[#f0f0e8] text-[#1a1a1a] shadow-[4px_4px_0px_0px_var(--shadow-color)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[#1a1a1a] hover:text-[#f0f0e8] hover:shadow-[2px_2px_0px_0px_var(--shadow-color)]"
  title={`Switch to ${themeState.theme === "dark" ? "light" : "dark"} mode (Ctrl/Cmd+Shift+L)`}
  aria-label={`Switch to ${themeState.theme === "dark" ? "light" : "dark"} mode`}
  onclick={toggleTheme}
>
  {#if themeState.theme === "dark"}
    <Sun class="h-4 w-4" />
  {:else}
    <Moon class="h-4 w-4" />
  {/if}
</button>
