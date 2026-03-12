<script lang="ts">
  import { seoHead } from "@/lib/seo";

  let scrolled = $state(false);

  const head = seoHead({
    title: "mono",
    description: "A stripped-down lawn landing page focused on fast video review, flat pricing, and simple sharing.",
    path: "/mono",
  });

  const title = head.meta.find((tag) => "title" in tag)?.title ?? "mono | lawn";
  const metaTags = head.meta.filter((tag) => !("title" in tag));

  const valueProps = [
    { title: "Frame-accurate", desc: "Comments on exact frames" },
    { title: "Unlimited seats", desc: "One price for everyone" },
    { title: "0.3s response", desc: "Built for speed" },
    { title: "Any NLE", desc: "No lock-in" },
  ];

  const steps = [
    { step: "1", action: "Upload", desc: "your video" },
    { step: "2", action: "Share", desc: "the link" },
    { step: "3", action: "Click", desc: "to comment" },
  ];

  $effect(() => {
    const handleScroll = () => {
      scrolled = window.scrollY > 200;
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  });
</script>

<svelte:head>
  <title>{title}</title>
  {#each metaTags as tag}
    <meta {...tag} />
  {/each}
  {#each head.links as link}
    <link {...link} />
  {/each}
</svelte:head>

<div class="min-h-screen bg-[#f0f0e8] font-mono text-[#1a1a1a]">
  <nav class="sticky top-0 z-50 flex items-center justify-between bg-[#f0f0e8] px-6 py-4">
    <div class="flex items-center gap-4">
      <span class={`text-xl font-black transition-opacity duration-200 ${scrolled ? "opacity-100" : "opacity-0"}`}>
        lawn
      </span>
      <span
        class={`hidden border-l border-[#ccc] pl-4 text-xs text-[#888] transition-opacity duration-200 sm:inline ${scrolled ? "opacity-100" : "opacity-0"}`}
      >
        video review
      </span>
    </div>
    <div class="flex gap-4 text-sm">
      <a href="/sign-in" class="hover:underline" data-sveltekit-preload-data="hover">Sign In</a>
      <a href="/sign-up" class="font-bold underline underline-offset-4" data-sveltekit-preload-data="hover">
        Start
      </a>
    </div>
  </nav>

  <section class="px-6 pb-16 pt-8">
    <div class="mx-auto max-w-6xl">
      <h1 class="text-[20vw] font-black leading-[0.85] tracking-tight sm:text-[18vw]">lawn</h1>

      <div class="mt-8 max-w-2xl">
        <p class="text-2xl font-bold leading-tight sm:text-3xl">
          Video review for creative teams.
          <br />
          <span class="text-[#2d5a2d]">Less features. No bull$#!t.</span>
        </p>
      </div>

      <div class="mt-12 flex flex-wrap items-center gap-6">
        <div class="bg-[#2d5a2d] px-6 py-4 text-[#f0f0e8]">
          <span class="text-3xl font-black">$5/mo</span>
          <span class="ml-2 text-sm opacity-70">unlimited seats</span>
        </div>

        <a
          href="/sign-up"
          class="border-2 border-[#1a1a1a] px-6 py-4 font-bold transition-colors hover:bg-[#1a1a1a] hover:text-[#f0f0e8]"
          data-sveltekit-preload-data="hover"
        >
          Get Started →
        </a>
      </div>
    </div>
  </section>

  <section class="border-y-2 border-[#1a1a1a]">
    <div class="mx-auto grid max-w-6xl grid-cols-2 lg:grid-cols-4">
      {#each valueProps as item, index}
        <div
          class={`p-6 ${index < 3 ? "border-r-2 border-[#1a1a1a]" : ""} ${index < 2 ? "lg:border-r-2" : "lg:border-r-0"}`}
        >
          <div class="font-black">{item.title}</div>
          <div class="text-sm text-[#888]">{item.desc}</div>
        </div>
      {/each}
    </div>
  </section>

  <section class="px-6 py-16">
    <div class="mx-auto max-w-4xl">
      <h2 class="mb-2 text-2xl font-black">How lawn compares</h2>
      <p class="mb-8 text-[#888]">Frame.io is solid software. Here's where we differ.</p>

      <div class="space-y-6">
        <div class="bg-[#1a1a1a] p-8 text-[#f0f0e8]">
          <div class="mb-4 text-sm tracking-widest text-[#7cb87c]">PRICING MODEL</div>
          <div class="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div>
              <div class="mb-1 text-sm text-[#888]">Frame.io</div>
              <div class="text-2xl font-black">$19/editor/mo</div>
              <div class="mt-2 text-sm text-[#888]">Team of 5 = $1,140/year</div>
            </div>
            <div>
              <div class="mb-1 text-sm text-[#7cb87c]">lawn</div>
              <div class="text-2xl font-black text-[#7cb87c]">$5/mo total</div>
              <div class="mt-2 text-sm text-[#888]">Team of 5 = $60/year</div>
            </div>
          </div>
          <div class="mt-6 border-t border-[#333] pt-6">
            <span class="text-sm text-[#888]">Annual savings with 5 users: </span>
            <span class="text-xl font-black text-[#7cb87c]">$1,080</span>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="border-2 border-[#1a1a1a] p-6">
            <div class="mb-2 font-black">Frame.io</div>
            <ul class="space-y-1 text-sm text-[#888]">
              <li>• Deep Adobe integration</li>
              <li>• More enterprise features</li>
              <li>• Larger ecosystem</li>
            </ul>
          </div>
          <div class="border-2 border-[#2d5a2d] p-6">
            <div class="mb-2 font-black text-[#2d5a2d]">lawn</div>
            <ul class="space-y-1 text-sm">
              <li>• Works with any software</li>
              <li>• Simpler, faster interface</li>
              <li>• No per-seat pricing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="bg-[#1a1a1a] px-6 py-16 text-[#f0f0e8]">
    <div class="mx-auto max-w-4xl">
      <h2 class="mb-12 text-2xl font-black">How it works</h2>

      <div class="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
        {#each steps as item}
          <div class="flex items-center gap-4">
            <span class="flex h-16 w-16 items-center justify-center bg-[#2d5a2d] text-3xl font-black">
              {item.step}
            </span>
            <div>
              <div class="text-xl font-black">{item.action}</div>
              <div class="text-sm text-[#888]">{item.desc}</div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <section class="border-b-2 border-[#1a1a1a] px-6 py-16">
    <div class="mx-auto max-w-3xl text-center">
      <blockquote class="text-2xl font-bold leading-tight sm:text-3xl">
        "I built lawn because I got tired of waiting for Frame.io to load. Video review should be instant."
      </blockquote>
      <p class="mt-4 text-[#888]">
        —
        <a href="https://x.com/theo" target="_blank" rel="noopener noreferrer" class="underline hover:text-[#1a1a1a]">
          Theo
        </a>
      </p>
    </div>
  </section>

  <section class="px-6 py-24">
    <div class="mx-auto max-w-3xl text-center">
      <h2 class="text-5xl font-black sm:text-6xl">Pick your plan</h2>
      <p class="mb-8 mt-4 text-xl text-[#888]">Basic is $5/month. Pro is $25/month.</p>
      <a
        href="/sign-up"
        class="inline-block bg-[#2d5a2d] px-12 py-5 text-xl font-black text-[#f0f0e8] transition-colors hover:bg-[#3a6a3a]"
        data-sveltekit-preload-data="hover"
      >
        Start with Basic
      </a>
      <p class="mt-4 text-sm text-[#888]">Upgrade to Pro anytime</p>
    </div>
  </section>

  <footer class="border-t-2 border-[#1a1a1a] px-6 py-8">
    <div class="mx-auto flex max-w-5xl items-center justify-between text-sm">
      <span class="text-xl font-black">lawn</span>
      <div class="flex gap-6 text-[#888]">
        <a href="/github" class="hover:text-[#1a1a1a]">GitHub</a>
      </div>
    </div>
  </footer>
</div>
