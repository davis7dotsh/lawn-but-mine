<script lang="ts">
  import { seoHead } from "@/lib/seo";
  import MarketingFooter from "@/lib/components/MarketingFooter.svelte";
  import { marketingThemeStyle } from "@/lib/theme.svelte";

  let scrolled = $state(false);

  const head = seoHead({
    title: "lawn — video review for creative teams",
    description:
      "Video review and collaboration for creative teams. Frame-accurate comments, unlimited seats, flat pricing.",
    path: "/",
  });

  const title = head.meta.find((tag) => "title" in tag)?.title ?? "lawn";
  const metaTags = head.meta.filter((tag) => !("title" in tag));

  const valueProps = [
    { id: "01", title: "OPEN SOURCE", desc: "Fully open source. Read the code, fork it, make it yours." },
    { id: "02", title: "ACTUALLY FAST", desc: "Instant playback. Built for speed, not loading spinners." },
    { id: "03", title: "FLAT PRICING", desc: "$5 covers the whole agency. Stop counting seats." },
    { id: "04", title: "SIMPLE SHARING", desc: "Just copy the link and send it to your client." },
  ];

  const steps = [
    { step: "1", action: "UPLOAD", desc: "Drag and drop your cut. We process it instantly." },
    { step: "2", action: "SHARE", desc: "Send a link. No account required for clients." },
    { step: "3", action: "REVIEW", desc: "Click to comment on exact frames. Export to your NLE." },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "lawn",
    description:
      "Video review and collaboration for creative teams. Frame-accurate comments, unlimited seats, flat pricing.",
    url: "https://lawn.video",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    offers: [
      {
        "@type": "Offer",
        name: "Basic",
        price: "5.00",
        priceCurrency: "USD",
        description: "Unlimited seats, unlimited projects, unlimited clients, 100GB storage",
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "25.00",
        priceCurrency: "USD",
        description: "Unlimited seats, unlimited projects, unlimited clients, 1TB storage",
      },
    ],
    creator: {
      "@type": "Person",
      name: "Theo",
      url: "https://x.com/theo",
    },
  };

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

<svelte:head>
  <title>{title}</title>
  {#each metaTags as tag}
    <meta {...tag} />
  {/each}
  {#each head.links as link}
    <link {...link} />
  {/each}
  <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
</svelte:head>

<div
  class="min-h-screen font-mono selection:bg-[#2d5a2d] selection:text-[#f0f0e8]"
  style={`${marketingThemeStyle}; background-color: var(--background); color: var(--foreground);`}
>
  <nav
    class={`fixed top-0 z-50 flex w-full items-center justify-between px-6 py-4 transition-all duration-200 ${scrolled ? "border-b-2 border-[#1a1a1a] bg-[#f0f0e8] text-[#1a1a1a]" : "bg-transparent text-[#f0f0e8] drop-shadow-md"}`}
  >
    <div class="flex items-center gap-4">
      <span class={`text-xl font-black tracking-tighter transition-opacity duration-200 ${scrolled ? "opacity-100" : "opacity-0"}`}>
        lawn.
      </span>
    </div>
    <div class="flex items-center gap-6 text-sm font-bold uppercase tracking-wide">
      <a href="#pricing" class="hover:underline underline-offset-4">Pricing</a>
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
        class={`border-2 px-4 py-2 transition-colors ${scrolled ? "border-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-[#f0f0e8]" : "border-[#f0f0e8] hover:bg-[#f0f0e8] hover:text-[#1a1a1a]"}`}
        data-sveltekit-preload-data="hover"
      >
        Start
      </a>
    </div>
  </nav>

  <section
    class="relative flex min-h-[85vh] flex-col justify-end overflow-x-clip border-b-2 border-[#1a1a1a] bg-center bg-no-repeat px-6 pb-32 pt-32 text-[#f0f0e8] md:pb-24"
    style="background: linear-gradient(180deg, #88a570 0%, #6e8d62 24%, #f0f0e8 72%)"
  >
    <div class="pointer-events-none absolute inset-0 bg-black/10"></div>

    <div class="relative z-10 mx-auto w-full max-w-7xl">
      <h1
        class="ml-[-0.5vw] text-[25vw] font-black leading-[0.75] tracking-tighter sm:text-[22vw]"
        style="text-shadow: 8px 8px 0 #1a1a1a, 0 20px 40px rgba(0,0,0,0.5)"
      >
        lawn
      </h1>

      <div class="mt-20 flex flex-col gap-12 lg:mt-24 lg:flex-row lg:items-end lg:justify-between">
        <div class="flex max-w-full flex-col items-start gap-4 md:gap-6">
          <div class="-rotate-2 origin-bottom-left max-w-full border-2 border-[#1a1a1a] bg-[#f0f0e8] px-5 py-3 text-[#1a1a1a] shadow-[6px_6px_0px_0px_var(--shadow-color)] md:px-8 md:py-4 md:shadow-[8px_8px_0px_0px_var(--shadow-color)]">
            <p class="text-2xl font-black uppercase leading-tight tracking-tight sm:text-3xl md:text-4xl md:leading-none">
              Video review for creative teams.
            </p>
          </div>
          <div class="ml-2 max-w-full rotate-1 origin-top-left border-2 border-[#1a1a1a] bg-[#2d5a2d] px-5 py-3 text-[#f0f0e8] shadow-[6px_6px_0px_0px_var(--shadow-color)] md:ml-8 md:px-8 md:py-4 md:shadow-[8px_8px_0px_0px_var(--shadow-color)]">
            <p class="text-xl font-black uppercase leading-tight tracking-tight sm:text-2xl md:text-3xl md:leading-none">
              Less features. No bull$#!t.
            </p>
          </div>
        </div>

        <div class="mt-4 flex flex-col gap-6 sm:flex-row lg:mt-0 lg:justify-end">
          <div class="self-start border-2 border-[#1a1a1a] bg-[#f0f0e8] px-6 py-4 text-[#1a1a1a] shadow-[6px_6px_0px_0px_var(--shadow-color)] md:px-8 md:py-5 md:shadow-[8px_8px_0px_0px_var(--shadow-color)] sm:self-auto">
            <span class="block text-3xl font-black leading-none md:text-4xl">$5/mo</span>
            <span class="mt-1 block text-xs font-bold uppercase tracking-wider text-[#888] md:mt-2 md:text-sm">
              Unlimited seats
            </span>
          </div>

          <a
            href="/sign-up"
            class="flex self-start items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-6 py-4 text-lg font-black text-[#f0f0e8] shadow-[6px_6px_0px_0px_var(--shadow-color)] transition-colors hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[#2d5a2d] hover:shadow-[4px_4px_0px_0px_var(--shadow-color)] md:px-8 md:py-5 md:text-xl md:shadow-[8px_8px_0px_0px_var(--shadow-color)] md:hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] sm:self-auto"
            data-sveltekit-preload-data="hover"
          >
            START FREE TRIAL →
          </a>
        </div>
      </div>
    </div>
  </section>

  <section class="border-b-2 border-[#1a1a1a] bg-[#f0f0e8]">
    <div class="grid grid-cols-1 divide-y-2 divide-[#1a1a1a] md:grid-cols-2 md:divide-x-2 md:divide-y-0 xl:grid-cols-4">
      {#each valueProps as item}
        <div class="group flex flex-col p-8 transition-colors hover:bg-[#1a1a1a] hover:text-[#f0f0e8] lg:p-12">
          <div class="mb-8 text-sm font-black text-[#888] group-hover:text-[#7cb87c]">/{item.id}</div>
          <h3 class="mb-4 text-3xl font-black uppercase leading-none tracking-tighter lg:text-4xl">{item.title}</h3>
          <p class="mt-auto text-lg font-medium opacity-80">{item.desc}</p>
        </div>
      {/each}
    </div>
  </section>

  <section class="border-b-2 border-[#1a1a1a] bg-[#e8e8e0] px-6 py-24 md:py-32">
    <div class="mx-auto max-w-7xl">
      <h2 class="mb-16 text-center text-5xl font-black uppercase leading-none tracking-tighter md:text-7xl">
        HOW IT WORKS.
      </h2>

      <div class="grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-12">
        {#each steps as item}
          <div class="flex flex-col border-2 border-[#1a1a1a] bg-[#f0f0e8] shadow-[12px_12px_0px_0px_var(--shadow-color)] transition-all hover:translate-x-2 hover:-translate-y-2 hover:shadow-[4px_4px_0px_0px_var(--shadow-color)]">
            <div class="flex items-end justify-between border-b-2 border-[#1a1a1a] bg-[#1a1a1a] p-6 text-[#f0f0e8]">
              <span class="text-7xl font-black leading-none">{item.step}</span>
              <span class="mb-1 text-xl font-bold tracking-widest text-[#888]">STEP</span>
            </div>
            <div class="flex flex-grow flex-col p-8">
              <h3 class="mb-4 text-3xl font-black uppercase tracking-tighter text-[#2d5a2d] md:text-4xl">
                {item.action}
              </h3>
              <p class="text-lg font-medium text-[#1a1a1a]">{item.desc}</p>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <section class="border-b-2 border-[#1a1a1a] bg-[#f0f0e8] px-6 py-24 md:py-32">
    <div class="mx-auto max-w-7xl">
      <div class="flex flex-col gap-16 lg:flex-row">
        <div class="lg:w-1/3">
          <h2 class="mb-6 text-5xl font-black uppercase leading-none tracking-tighter md:text-7xl">
            THE<br />RIVAL.
          </h2>
          <p class="max-w-sm text-xl font-medium text-[#888]">
            Frame.io is solid software. But you're paying for enterprise features you don't need.
          </p>
        </div>

        <div class="lg:w-2/3">
          <div class="grid grid-cols-1 border-2 border-[#1a1a1a] shadow-[12px_12px_0px_0px_var(--shadow-color)] md:grid-cols-2">
            <div class="border-b-2 border-[#1a1a1a] bg-[#ffffff] p-8 md:border-b-0 md:border-r-2 md:p-12">
              <div class="mb-2 text-sm font-bold tracking-widest text-[#888]">THE OTHER GUYS</div>
              <div class="mb-8 text-5xl font-black tracking-tighter">Frame.io</div>

              <div class="mb-8">
                <div class="text-3xl font-black">$19</div>
                <div class="text-sm font-bold uppercase tracking-wider text-[#888]">Per user / month</div>
              </div>

              <ul class="space-y-4 text-lg font-medium text-[#1a1a1a]">
                <li class="flex items-start gap-3"><span class="font-black text-[#dc2626]">×</span>Complex interface</li>
                <li class="flex items-start gap-3"><span class="font-black text-[#dc2626]">×</span>Punishes you for growing</li>
                <li class="flex items-start gap-3"><span class="font-black text-[#dc2626]">×</span>Bloated ecosystem</li>
                <li class="flex items-start gap-3"><span class="font-black text-[#dc2626]">×</span>Closed source</li>
              </ul>
            </div>

            <div class="bg-[#1a1a1a] p-8 text-[#f0f0e8] md:p-12">
              <div class="mb-2 text-sm font-bold tracking-widest text-[#7cb87c]">THE SOLUTION</div>
              <div class="mb-8 text-5xl font-black tracking-tighter text-[#7cb87c]">lawn</div>

              <div class="mb-8">
                <div class="text-3xl font-black text-[#7cb87c]">$5</div>
                <div class="text-sm font-bold uppercase tracking-wider text-[#888]">Flat total / month</div>
              </div>

              <ul class="space-y-4 text-lg font-medium">
                <li class="flex items-start gap-3"><span class="font-black text-[#7cb87c]">✓</span>Stupidly fast</li>
                <li class="flex items-start gap-3"><span class="font-black text-[#7cb87c]">✓</span>Invite the whole team</li>
                <li class="flex items-start gap-3"><span class="font-black text-[#7cb87c]">✓</span>Just what you need</li>
                <li class="flex items-start gap-3"><span class="font-black text-[#7cb87c]">✓</span>Fully open source</li>
              </ul>

              <div class="mt-12 border-t border-[#333] pt-6">
                <span class="mb-1 block text-sm font-bold uppercase tracking-wider text-[#888]">Yearly savings (5 users)</span>
                <span class="text-4xl font-black text-[#7cb87c]">$1,080</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="border-b-2 border-[#1a1a1a] bg-[#2d5a2d] px-6 py-32 text-[#f0f0e8]">
    <div class="mx-auto max-w-5xl text-center">
      <blockquote class="mb-8 text-4xl font-black uppercase leading-tight tracking-tighter md:text-6xl">
        "I built lawn because I got tired of waiting for Frame.io to load. Video review should be instant."
      </blockquote>
      <a
        href="https://x.com/theo"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-block border-2 border-[#f0f0e8] px-6 py-3 font-bold uppercase tracking-wider transition-colors hover:bg-[#f0f0e8] hover:text-[#2d5a2d]"
      >
        — Theo
      </a>
    </div>
  </section>

  <section id="pricing" class="border-b-2 border-[#1a1a1a] bg-[#e8e8e0] px-6 py-24 md:py-32">
    <div class="mx-auto max-w-6xl">
      <h2 class="mb-16 text-center text-5xl font-black uppercase leading-none tracking-tighter md:text-7xl">
        PRICING.
      </h2>

      <div class="flex flex-col items-center justify-center gap-8 md:flex-row">
        <div class="flex w-full max-w-md flex-col border-2 border-[#1a1a1a] bg-[#f0f0e8] p-8 shadow-[8px_8px_0px_0px_var(--shadow-color)] transition-all hover:translate-x-2 hover:-translate-y-2 hover:shadow-[4px_4px_0px_0px_var(--shadow-color)]">
          <div class="mb-2 text-xl font-bold uppercase tracking-widest text-[#888]">Basic</div>
          <div class="mb-4 text-6xl font-black tracking-tighter">$5<span class="text-2xl text-[#888]">/mo</span></div>
          <p class="mb-8 text-lg font-medium text-[#1a1a1a]">Unlimited everything, except storage.</p>

          <ul class="mb-8 flex-grow space-y-4 text-lg font-bold">
            <li class="flex items-center gap-3"><span class="text-2xl text-[#2d5a2d]">✓</span> Unlimited seats</li>
            <li class="flex items-center gap-3"><span class="text-2xl text-[#2d5a2d]">✓</span> Unlimited projects</li>
            <li class="flex items-center gap-3"><span class="text-2xl text-[#2d5a2d]">✓</span> Unlimited clients</li>
            <li class="flex items-center gap-3"><span class="text-2xl text-[#2d5a2d]">✓</span> 100GB Storage</li>
          </ul>

          <a
            href="/sign-up"
            class="border-2 border-[#1a1a1a] bg-[#1a1a1a] py-4 text-center font-black uppercase text-[#f0f0e8] transition-colors hover:bg-[#2d5a2d]"
            data-sveltekit-preload-data="hover"
          >
            Get Basic
          </a>
        </div>

        <div class="flex w-full max-w-md flex-col border-2 border-[#1a1a1a] bg-[#1a1a1a] p-8 text-[#f0f0e8] shadow-[8px_8px_0px_0px_var(--shadow-color)] transition-all md:-translate-y-4 hover:translate-x-2 hover:-translate-y-6 hover:shadow-[4px_4px_0px_0px_var(--shadow-color)]">
          <div class="mb-2 flex items-start justify-between">
            <div class="text-xl font-bold uppercase tracking-widest text-[#7cb87c]">Pro</div>
            <div class="-rotate-3 bg-[#2d5a2d] px-2 py-1 text-xs font-black uppercase tracking-wider">Big files</div>
          </div>
          <div class="mb-4 text-6xl font-black tracking-tighter">$25<span class="text-2xl text-[#888]">/mo</span></div>
          <p class="mb-8 text-lg font-medium">Literally the exact same thing but more space.</p>

          <ul class="mb-8 flex-grow space-y-4 text-lg font-bold">
            <li class="flex items-center gap-3"><span class="text-2xl text-[#7cb87c]">✓</span> Unlimited seats</li>
            <li class="flex items-center gap-3"><span class="text-2xl text-[#7cb87c]">✓</span> Unlimited projects</li>
            <li class="flex items-center gap-3"><span class="text-2xl text-[#7cb87c]">✓</span> Unlimited clients</li>
            <li class="flex items-center gap-3"><span class="text-2xl text-[#7cb87c]">✓</span> 1TB Storage (Whoa)</li>
          </ul>

          <a
            href="/sign-up"
            class="border-2 border-[#f0f0e8] bg-[#f0f0e8] py-4 text-center font-black uppercase text-[#1a1a1a] transition-colors hover:bg-[#d8d8d0]"
            data-sveltekit-preload-data="hover"
          >
            Get Pro
          </a>
        </div>
      </div>
    </div>
  </section>

  <section class="bg-[#f0f0e8] px-6 py-32">
    <div class="mx-auto flex max-w-4xl flex-col items-center text-center">
      <h2 class="mb-8 text-7xl font-black uppercase leading-[0.8] tracking-tighter md:text-9xl">
        START<br />NOW.
      </h2>
      <p class="mb-12 text-2xl font-medium text-[#888]">Basic is $5/month. Pro is $25/month.</p>
      <a
        href="/sign-up"
        class="border-2 border-[#1a1a1a] bg-[#1a1a1a] px-12 py-6 text-2xl font-black uppercase tracking-wider text-[#f0f0e8] shadow-[12px_12px_0px_0px_var(--shadow-accent)] transition-colors hover:translate-x-[2px] hover:translate-y-[2px] hover:border-[#2d5a2d] hover:bg-[#2d5a2d] hover:shadow-[8px_8px_0px_0px_var(--shadow-accent)]"
        data-sveltekit-preload-data="hover"
      >
        CREATE YOUR TEAM
      </a>
    </div>
  </section>

  <MarketingFooter />
</div>
