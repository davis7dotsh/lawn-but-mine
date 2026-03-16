<script lang="ts">
  import { ChevronDown } from "lucide-svelte";

  import { cn } from "@/lib/utils";

  type Option = {
    value: string;
    label: string;
  };

  type Size = "default" | "sm";

  let {
    value = $bindable(),
    options,
    id,
    size = "default",
    class: className = "",
  }: {
    value: string;
    options: Option[];
    id?: string;
    size?: Size;
    class?: string;
  } = $props();

  const isSmall = $derived(size === "sm");

  let isOpen = $state(false);
  let triggerEl = $state<HTMLButtonElement | null>(null);
  let listEl = $state<HTMLUListElement | null>(null);
  let focusedIndex = $state(-1);

  const selectedLabel = $derived(
    options.find((opt) => opt.value === value)?.label ?? "",
  );

  const open = () => {
    isOpen = true;
    focusedIndex = options.findIndex((opt) => opt.value === value);
  };

  const close = () => {
    isOpen = false;
    focusedIndex = -1;
  };

  const toggle = () => {
    if (isOpen) close();
    else open();
  };

  const select = (opt: Option) => {
    value = opt.value;
    close();
    triggerEl?.focus();
  };

  const handleTriggerKeydown = (event: KeyboardEvent) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) open();
    } else if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      close();
    }
  };

  const handleListKeydown = (event: KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusedIndex = (focusedIndex + 1) % options.length;
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusedIndex = (focusedIndex - 1 + options.length) % options.length;
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < options.length) {
        select(options[focusedIndex]);
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
      triggerEl?.focus();
    } else if (event.key === "Tab") {
      close();
    }
  };

  $effect(() => {
    if (!isOpen || !listEl) return;
    const idx = focusedIndex >= 0 ? focusedIndex : 0;
    const item = listEl.children[idx] as HTMLElement | undefined;
    item?.focus();
    item?.scrollIntoView({ block: "nearest" });
  });

  const handleClickOutside = (event: MouseEvent) => {
    if (!isOpen) return;
    const target = event.target as Node;
    if (triggerEl?.contains(target) || listEl?.contains(target)) return;
    close();
  };
</script>

<svelte:window onclick={handleClickOutside} />

<div class={cn("relative", className)}>
  <button
    bind:this={triggerEl}
    {id}
    type="button"
    class={cn(
      "flex w-full items-center justify-between gap-1.5 border-2 border-[#1a1a1a] bg-[#f0f0e8] text-left font-bold text-[#1a1a1a] outline-none transition-colors hover:bg-[#e8e8e0]",
      isSmall ? "h-8 px-2.5 text-xs" : "h-10 px-3 text-sm",
    )}
    aria-haspopup="listbox"
    aria-expanded={isOpen}
    onclick={toggle}
    onkeydown={handleTriggerKeydown}
  >
    <span class="truncate">{selectedLabel}</span>
    <ChevronDown class={cn("shrink-0 text-[#888] transition-transform", isSmall ? "h-3.5 w-3.5" : "h-4 w-4", isOpen && "rotate-180")} />
  </button>

  {#if isOpen}
    <ul
      bind:this={listEl}
      role="listbox"
      class="absolute left-0 top-[calc(100%+2px)] z-50 max-h-60 w-full overflow-auto border-2 border-[#1a1a1a] bg-[#f0f0e8] shadow-[4px_4px_0px_0px_var(--shadow-color)]"
    >
      {#each options as opt, i (opt.value)}
        <li
          role="option"
          aria-selected={opt.value === value}
          tabindex={focusedIndex === i ? 0 : -1}
          class={cn(
            "flex cursor-pointer items-center font-bold text-[#1a1a1a] outline-none transition-colors",
            isSmall ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm",
            opt.value === value && "bg-[#1a1a1a] text-[#f0f0e8]",
            opt.value !== value && focusedIndex === i && "bg-[#e8e8e0]",
            opt.value !== value && focusedIndex !== i && "hover:bg-[#e8e8e0]",
          )}
          onclick={() => select(opt)}
          onkeydown={handleListKeydown}
          onmouseenter={() => (focusedIndex = i)}
          onfocus={() => (focusedIndex = i)}
        >
          {opt.label}
        </li>
      {/each}
    </ul>
  {/if}
</div>
