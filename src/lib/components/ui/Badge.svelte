<script lang="ts">
  import { cn } from "$lib/utils";
  import type { Snippet } from "svelte";

  interface Props {
    variant?: "default" | "secondary" | "destructive" | "success" | "warning";
    children: Snippet;
    class?: string;
  }

  let { variant = "default", children, class: className }: Props = $props();

  const variantClasses: Record<string, string> = {
    default: "bg-[#1a1a1a] text-[#f0f0e8]",
    secondary: "bg-[#e8e8e0] text-[#1a1a1a]",
    destructive: "bg-[#dc2626]/10 text-[#dc2626] border border-[#dc2626]",
    success: "bg-[#16a34a]/10 text-[#16a34a] border border-[#16a34a]",
    warning: "bg-[#ca8a04]/10 text-[#ca8a04] border border-[#ca8a04]",
  };
</script>

<span class={cn("inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", variantClasses[variant], className)}>
  {@render children()}
</span>
