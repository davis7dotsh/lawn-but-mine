<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";

  import { cn } from "@/lib/utils";

  type Variant = "default" | "primary" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  type Size = "default" | "sm" | "lg" | "icon";

  const variantClasses: Record<Variant, string> = {
    default:
      "bg-[#1a1a1a] text-[#f0f0e8] hover:bg-[#2d5a2d] border-2 border-[#1a1a1a] shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_var(--shadow-color)]",
    primary:
      "bg-[#2d5a2d] text-[#f0f0e8] hover:bg-[#3a6a3a] border-2 border-[#1a1a1a] shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_var(--shadow-color)]",
    destructive:
      "border-2 border-[#1a1a1a] bg-[#dc2626] text-white shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_var(--shadow-color)]",
    outline:
      "border-2 border-[#1a1a1a] bg-transparent text-[#1a1a1a] shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:translate-y-[2px] hover:translate-x-[2px] hover:bg-[#1a1a1a] hover:text-[#f0f0e8] hover:shadow-[2px_2px_0px_0px_var(--shadow-color)]",
    secondary:
      "border-2 border-[#1a1a1a] bg-[#e8e8e0] text-[#1a1a1a] shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:translate-y-[2px] hover:translate-x-[2px] hover:bg-[#d8d8d0] hover:shadow-[2px_2px_0px_0px_var(--shadow-color)]",
    ghost:
      "border-2 border-transparent text-[#1a1a1a] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:border-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-[#f0f0e8] hover:shadow-[4px_4px_0px_0px_var(--shadow-color)]",
    link: "text-[#1a1a1a] underline underline-offset-4 hover:text-[#2d5a2d]",
  };

  const sizeClasses: Record<Size, string> = {
    default: "h-10 px-5 py-2",
    sm: "h-8 px-4 text-xs",
    lg: "h-12 px-8 text-base",
    icon: "h-10 w-10",
  };

  type SharedProps = {
    href?: string;
    type?: "button" | "submit" | "reset";
    variant?: Variant;
    size?: Size;
    class?: string;
    disabled?: boolean;
    children?: Snippet;
  };

  let {
    href,
    type = "button",
    variant = "default",
    size = "default",
    class: className = "",
    disabled = false,
    children,
    ...restProps
  }: SharedProps & HTMLButtonAttributes & HTMLAnchorAttributes = $props();

  const classes = $derived(
    cn(
      "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold uppercase tracking-wider transition-all disabled:pointer-events-none disabled:opacity-40 active:translate-x-[2px] active:translate-y-[2px]",
      variantClasses[variant],
      sizeClasses[size],
      className,
    ),
  );
</script>

{#if href}
  <a
    href={href}
    class={classes}
    data-sveltekit-preload-data="hover"
    aria-disabled={disabled}
    {...restProps}
  >
    {#if children}
      {@render children()}
    {/if}
  </a>
{:else}
  <button type={type} class={classes} {disabled} {...restProps}>
    {#if children}
      {@render children()}
    {/if}
  </button>
{/if}
