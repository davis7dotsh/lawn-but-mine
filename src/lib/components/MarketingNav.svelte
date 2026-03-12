<script lang="ts">
  let scrolled = $state(false);

  $effect(() => {
    const handleScroll = () => { scrolled = window.scrollY > 50; };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  });
</script>

<nav
  class={`fixed w-full top-0 z-50 px-6 py-4 flex justify-between items-center transition-all duration-200 ${scrolled ? "bg-[#f0f0e8] text-[#1a1a1a] border-b-2 border-[#1a1a1a]" : "bg-[#f0f0e8] text-[#1a1a1a] border-b-2 border-[#1a1a1a]"}`}
>
  <div class="flex items-center gap-4">
    <a href="/" class="text-xl font-black tracking-tighter">lawn.</a>
  </div>
  <div class="flex gap-6 items-center text-sm font-bold uppercase tracking-wide">
    <a href="/pricing" class="hover:underline underline-offset-4 hidden sm:block">Pricing</a>
    <a href="/compare/frameio" class="hover:underline underline-offset-4 hidden sm:block">Compare</a>
    <a href="/sign-in" class="hover:underline underline-offset-4">Log in</a>
    <a href="/sign-up" class="px-4 py-2 border-2 border-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-[#f0f0e8] transition-colors">Start</a>
  </div>
</nav>
