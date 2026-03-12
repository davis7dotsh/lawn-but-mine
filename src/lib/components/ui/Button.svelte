<script lang="ts">
  import { cn } from "$lib/utils";
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";

  interface Props extends HTMLButtonAttributes {
    variant?: "default" | "primary" | "outline" | "ghost" | "destructive";
    size?: "default" | "sm" | "icon";
    children: Snippet;
    class?: string;
  }

  let { variant = "default", size = "default", children, class: className, ...rest }: Props = $props();

  const variantClasses: Record<string, string> = {
    default: "bg-[#1a1a1a] text-[#f0f0e8] border-2 border-[#1a1a1a] hover:bg-[#2d5a2d] hover:border-[#2d5a2d]",
    primary: "bg-[#2d5a2d] text-[#f0f0e8] border-2 border-[#2d5a2d] hover:bg-[#3a6a3a] hover:border-[#3a6a3a]",
    outline: "bg-transparent text-[#1a1a1a] border-2 border-[#1a1a1a] hover:bg-[#e8e8e0]",
    ghost: "bg-transparent text-[#1a1a1a] border-2 border-transparent hover:bg-[#e8e8e0]",
    destructive: "bg-[#dc2626] text-white border-2 border-[#dc2626] hover:bg-[#b91c1c]",
  };

  const sizeClasses: Record<string, string> = {
    default: "px-4 py-2 text-sm font-bold",
    sm: "px-3 py-1.5 text-xs font-bold",
    icon: "h-8 w-8 flex items-center justify-center",
  };
</script>

<button
  class={cn(
    "inline-flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
    variantClasses[variant],
    sizeClasses[size],
    className
  )}
  {...rest}
>
  {@render children()}
</button>
