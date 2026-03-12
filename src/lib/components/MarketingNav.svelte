<script lang="ts">
  let scrolled = $state(false);

  $effect(() => {
    const handleScroll = () => {
      scrolled = window.scrollY > 50;
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  });
</script>

<nav
  class={`fixed top-0 z-50 flex w-full items-center justify-between px-6 py-4 transition-all duration-200 ${scrolled ? "border-b-2 border-[#1a1a1a] bg-[#f0f0e8] text-[#1a1a1a]" : "border-b-2 border-[#1a1a1a] bg-[#f0f0e8] text-[#1a1a1a]"}`}
>
  <div class="flex items-center gap-4">
    <a
      href="/"
      class="text-xl font-black tracking-tighter"
      data-sveltekit-preload-data="hover"
    >
      lawn.
    </a>
  </div>

  <div class="flex items-center gap-6 text-sm font-bold uppercase tracking-wide">
    <a
      href="/pricing"
      class="hidden hover:underline underline-offset-4 sm:block"
      data-sveltekit-preload-data="hover"
    >
      Pricing
    </a>
    <a
      href="/compare/frameio"
      class="hidden hover:underline underline-offset-4 sm:block"
      data-sveltekit-preload-data="hover"
    >
      Compare
    </a>
    <a href="/sign-in" class="hover:underline underline-offset-4" data-sveltekit-preload-data="hover">
      Log in
    </a>
    <a
      href="/sign-up"
      class="border-2 border-[#1a1a1a] px-4 py-2 transition-colors hover:bg-[#1a1a1a] hover:text-[#f0f0e8]"
      data-sveltekit-preload-data="hover"
    >
      Start
    </a>
  </div>
</nav>
