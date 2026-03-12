<script lang="ts">
  import { onMount } from "svelte";
  import { loadClerk, getClerk } from "$lib/clerk";
  import { page } from "$app/stores";

  let container: HTMLDivElement;

  onMount(() => {
    loadClerk().then((clerk) => {
      const redirectUrl = $page.url.searchParams.get("redirect_url") || "/dashboard";
      clerk.mountSignUp(container, {
        fallbackRedirectUrl: redirectUrl,
        appearance: {
        elements: {
          formButtonPrimary: "bg-[#1a1a1a] hover:bg-[#2d5a2d] text-[#f0f0e8] border-2 border-[#1a1a1a] rounded-none shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_var(--shadow-color)] font-mono font-bold uppercase text-sm transition-all",
          card: "bg-[#f0f0e8] border-2 border-[#1a1a1a] rounded-none shadow-[8px_8px_0px_0px_var(--shadow-color)]",
          headerTitle: "text-[#1a1a1a] font-black uppercase tracking-tighter text-2xl font-mono",
          headerSubtitle: "text-[#888] font-mono",
          socialButtonsBlockButton: "border-2 border-[#1a1a1a] bg-transparent hover:bg-[#1a1a1a] text-[#1a1a1a] hover:text-[#f0f0e8] rounded-none transition-all hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_var(--shadow-color)] font-mono",
          socialButtonsBlockButtonText: "!text-current font-bold uppercase font-mono",
          formFieldLabel: "text-[#1a1a1a] font-bold uppercase font-mono",
          formFieldInput: "bg-transparent border-2 border-[#1a1a1a] text-[#1a1a1a] focus:border-[#2d5a2d] focus:shadow-[4px_4px_0px_0px_var(--shadow-accent)] focus:ring-0 rounded-none font-mono",
          footerActionLink: "text-[#2d5a2d] hover:text-[#1a1a1a] font-bold font-mono",
          footerActionText: "text-[#888] font-mono",
          dividerLine: "bg-[#1a1a1a]",
          dividerText: "text-[#888] font-mono font-bold",
          footer: "hidden",
        },
        variables: {
          colorPrimary: "#2d5a2d",
          colorBackground: "#f0f0e8",
          colorInputBackground: "transparent",
          colorInputText: "#1a1a1a",
          colorText: "#1a1a1a",
          colorTextSecondary: "#888888",
          colorTextOnPrimaryBackground: "#f0f0e8",
          colorNeutral: "#1a1a1a",
          borderRadius: "0rem",
        },
      },
    });
    });
    return () => {
      getClerk().unmountSignUp(container);
    };
  });
</script>

<svelte:head><title>Sign up — lawn</title></svelte:head>

<div class="min-h-screen bg-[#f0f0e8] flex flex-col items-center justify-center p-4" style="--shadow-color: #1a1a1a; --shadow-accent: rgba(45,90,45,1);">
  <a href="/" class="text-3xl font-black tracking-tighter text-[#1a1a1a] mb-8 hover:text-[#2d5a2d] transition-colors">lawn.</a>
  <div bind:this={container}></div>
</div>
