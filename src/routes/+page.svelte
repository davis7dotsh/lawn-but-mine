<script lang="ts">
  import MarketingFooter from "$lib/components/MarketingFooter.svelte";

  let scrolled = $state(false);

  $effect(() => {
    const handleScroll = () => { scrolled = window.scrollY > 50; };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  });
</script>

<svelte:head>
  <title>lawn — video review for creative teams</title>
  <meta name="description" content="Video review and collaboration for creative teams. Frame-accurate comments, unlimited seats, $5/month flat. The open source Frame.io alternative." />
</svelte:head>

<div
  class="min-h-screen font-mono selection:bg-[#2d5a2d] selection:text-[#f0f0e8]"
  style="--background: #f0f0e8; --background-alt: #1a1a1a; --surface: #ffffff; --surface-alt: #e8e8e0; --surface-strong: #1a1a1a; --surface-muted: #d8d8d0; --foreground: #1a1a1a; --foreground-muted: #888888; --foreground-subtle: #aaaaaa; --foreground-inverse: #f0f0e8; --border: #1a1a1a; --border-subtle: #cccccc; --accent: #2d5a2d; --accent-hover: #3a6a3a; --accent-light: #7cb87c; --shadow-color: #1a1a1a; --shadow-accent: rgba(45,90,45,1); background-color: var(--background); color: var(--foreground);"
>
  <nav class={`fixed w-full top-0 z-50 px-6 py-4 flex justify-between items-center transition-all duration-200 ${scrolled ? 'bg-[#f0f0e8] text-[#1a1a1a] border-b-2 border-[#1a1a1a]' : 'bg-transparent text-[#f0f0e8] drop-shadow-md'}`}>
    <div class="flex items-center gap-4">
      <span class={`text-xl font-black tracking-tighter transition-opacity duration-200 ${scrolled ? 'opacity-100' : 'opacity-0'}`}>lawn.</span>
    </div>
    <div class="flex gap-6 items-center text-sm font-bold uppercase tracking-wide">
      <a href="#pricing" class="hover:underline underline-offset-4">Pricing</a>
      <a href="/compare/frameio" class={`hover:underline underline-offset-4 hidden sm:block`}>Compare</a>
      <a href="/sign-in" class="hover:underline underline-offset-4">Log in</a>
      <a href="/sign-up" class={`px-4 py-2 border-2 transition-colors ${scrolled ? 'border-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-[#f0f0e8]' : 'border-[#f0f0e8] hover:bg-[#f0f0e8] hover:text-[#1a1a1a]'}`}>Start</a>
    </div>
  </nav>

  <section
    class="relative px-6 pt-32 pb-32 md:pb-24 min-h-[85vh] flex flex-col justify-end bg-cover bg-center bg-no-repeat text-[#f0f0e8] border-b-2 border-[#1a1a1a] overflow-x-clip"
    style="background-image: url('/grassy-bg.avif')"
  >
    <div class="absolute inset-0 bg-black/10 pointer-events-none"></div>
    <div class="relative z-10 w-full max-w-7xl mx-auto">
      <h1
        class="text-[25vw] sm:text-[22vw] font-black leading-[0.75] tracking-tighter ml-[-0.5vw]"
        style="text-shadow: 8px 8px 0 #1a1a1a, 0 20px 40px rgba(0,0,0,0.5)"
      >lawn</h1>
      <div class="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-12 mt-20 md:mt-24">
        <div class="flex flex-col items-start gap-4 md:gap-6 max-w-full">
          <div class="bg-[#f0f0e8] text-[#1a1a1a] px-5 py-3 md:px-8 md:py-4 border-2 border-[#1a1a1a] shadow-[6px_6px_0px_0px_var(--shadow-color)] md:shadow-[8px_8px_0px_0px_var(--shadow-color)] -rotate-2 origin-bottom-left max-w-full">
            <p class="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight md:leading-none">Video review for creative teams.</p>
          </div>
          <div class="bg-[#2d5a2d] text-[#f0f0e8] px-5 py-3 md:px-8 md:py-4 border-2 border-[#1a1a1a] shadow-[6px_6px_0px_0px_var(--shadow-color)] md:shadow-[8px_8px_0px_0px_var(--shadow-color)] rotate-1 origin-top-left ml-2 md:ml-8 max-w-full">
            <p class="text-xl sm:text-2xl md:text-3xl font-black tracking-tight uppercase leading-tight md:leading-none">Less features. No bull$#!t.</p>
          </div>
        </div>
        <div class="flex flex-col sm:flex-row gap-6 lg:justify-end pb-2 mt-4 lg:mt-0">
          <div class="bg-[#f0f0e8] text-[#1a1a1a] px-6 py-4 md:px-8 md:py-5 border-2 border-[#1a1a1a] shadow-[6px_6px_0px_0px_var(--shadow-color)] md:shadow-[8px_8px_0px_0px_var(--shadow-color)] self-start sm:self-auto">
            <span class="text-3xl md:text-4xl font-black block leading-none">$5/mo</span>
            <span class="block text-xs md:text-sm font-bold uppercase tracking-wider text-[#888] mt-1 md:mt-2">Unlimited seats</span>
          </div>
          <a href="/sign-up" class="bg-[#1a1a1a] text-[#f0f0e8] px-6 py-4 md:px-8 md:py-5 border-2 border-[#1a1a1a] font-black text-lg md:text-xl hover:bg-[#2d5a2d] transition-colors flex items-center justify-center shadow-[6px_6px_0px_0px_var(--shadow-color)] md:shadow-[8px_8px_0px_0px_var(--shadow-color)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[4px_4px_0px_0px_var(--shadow-color)] md:hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] self-start sm:self-auto">
            START FREE TRIAL →
          </a>
        </div>
      </div>
    </div>
  </section>

  <section class="border-b-2 border-[#1a1a1a] bg-[#f0f0e8]">
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 divide-y-2 md:divide-y-0 md:divide-x-2 divide-[#1a1a1a]">
      {#each [
        { id: "01", title: "OPEN SOURCE", desc: "Fully open source. Read the code, fork it, make it yours." },
        { id: "02", title: "ACTUALLY FAST", desc: "Instant playback. Built for speed, not loading spinners." },
        { id: "03", title: "FLAT PRICING", desc: "$5 covers the whole agency. Stop counting seats." },
        { id: "04", title: "SIMPLE SHARING", desc: "Just copy the link and send it to your client." },
      ] as item}
        <div class="p-8 lg:p-12 group hover:bg-[#1a1a1a] hover:text-[#f0f0e8] transition-colors flex flex-col">
          <div class="text-sm font-black text-[#888] group-hover:text-[#7cb87c] mb-8">/{item.id}</div>
          <h3 class="text-3xl lg:text-4xl font-black mb-4 uppercase tracking-tighter leading-none">{item.title}</h3>
          <p class="text-lg font-medium opacity-80 mt-auto">{item.desc}</p>
        </div>
      {/each}
    </div>
  </section>

  <section class="border-b-2 border-[#1a1a1a] bg-[#e8e8e0] px-6 py-24 md:py-32">
    <div class="max-w-7xl mx-auto">
      <h2 class="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-16 text-center">HOW IT WORKS.</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
        {#each [
          { step: "1", action: "UPLOAD", desc: "Drag and drop your cut. We process it instantly." },
          { step: "2", action: "SHARE", desc: "Send a link. No account required for clients." },
          { step: "3", action: "REVIEW", desc: "Click to comment on exact frames. Export to your NLE." },
        ] as item}
          <div class="bg-[#f0f0e8] border-2 border-[#1a1a1a] shadow-[12px_12px_0px_0px_var(--shadow-color)] flex flex-col hover:-translate-y-2 hover:translate-x-2 hover:shadow-[4px_4px_0px_0px_var(--shadow-color)] transition-all">
            <div class="border-b-2 border-[#1a1a1a] bg-[#1a1a1a] text-[#f0f0e8] p-6 flex justify-between items-end">
              <span class="text-7xl font-black leading-none">{item.step}</span>
              <span class="text-xl font-bold tracking-widest text-[#888] mb-1">STEP</span>
            </div>
            <div class="p-8 flex-grow flex flex-col">
              <h3 class="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-4 text-[#2d5a2d]">{item.action}</h3>
              <p class="text-lg font-medium text-[#1a1a1a]">{item.desc}</p>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <section class="px-6 py-24 md:py-32 border-b-2 border-[#1a1a1a] bg-[#f0f0e8]">
    <div class="max-w-7xl mx-auto">
      <div class="flex flex-col lg:flex-row gap-16">
        <div class="lg:w-1/3">
          <h2 class="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-6">THE<br/>RIVAL.</h2>
          <p class="text-xl text-[#888] font-medium max-w-sm">Frame.io is solid software. But you're paying for enterprise features you don't need.</p>
        </div>
        <div class="lg:w-2/3">
          <div class="grid grid-cols-1 md:grid-cols-2 border-2 border-[#1a1a1a] shadow-[12px_12px_0px_0px_var(--shadow-color)]">
            <div class="p-8 md:p-12 border-b-2 md:border-b-0 md:border-r-2 border-[#1a1a1a] bg-[#ffffff]">
              <div class="text-sm font-bold tracking-widest text-[#888] mb-2">THE OTHER GUYS</div>
              <div class="text-5xl font-black tracking-tighter mb-8">Frame.io</div>
              <div class="mb-8">
                <div class="text-3xl font-black">$19</div>
                <div class="text-[#888] font-bold uppercase text-sm tracking-wider">Per user / month</div>
              </div>
              <ul class="space-y-4 text-lg font-medium text-[#1a1a1a]">
                <li class="flex items-start gap-3"><span class="text-[#dc2626] font-black">×</span> Complex interface</li>
                <li class="flex items-start gap-3"><span class="text-[#dc2626] font-black">×</span> Punishes you for growing</li>
                <li class="flex items-start gap-3"><span class="text-[#dc2626] font-black">×</span> Bloated ecosystem</li>
                <li class="flex items-start gap-3"><span class="text-[#dc2626] font-black">×</span> Closed source</li>
              </ul>
            </div>
            <div class="p-8 md:p-12 bg-[#1a1a1a] text-[#f0f0e8]">
              <div class="text-sm font-bold tracking-widest text-[#7cb87c] mb-2">THE SOLUTION</div>
              <div class="text-5xl font-black tracking-tighter mb-8 text-[#7cb87c]">lawn</div>
              <div class="mb-8">
                <div class="text-3xl font-black text-[#7cb87c]">$5</div>
                <div class="text-[#888] font-bold uppercase text-sm tracking-wider">Flat total / month</div>
              </div>
              <ul class="space-y-4 text-lg font-medium">
                <li class="flex items-start gap-3"><span class="text-[#7cb87c] font-black">✓</span> Stupidly fast</li>
                <li class="flex items-start gap-3"><span class="text-[#7cb87c] font-black">✓</span> Invite the whole team</li>
                <li class="flex items-start gap-3"><span class="text-[#7cb87c] font-black">✓</span> Just what you need</li>
                <li class="flex items-start gap-3"><span class="text-[#7cb87c] font-black">✓</span> Fully open source</li>
              </ul>
              <div class="mt-12 pt-6 border-t border-[#333]">
                <span class="block text-sm font-bold text-[#888] uppercase tracking-wider mb-1">Yearly savings (5 users)</span>
                <span class="text-4xl font-black text-[#7cb87c]">$1,080</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="px-6 py-32 bg-[#2d5a2d] text-[#f0f0e8] border-b-2 border-[#1a1a1a]">
    <div class="max-w-5xl mx-auto text-center">
      <blockquote class="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-tight mb-8">"I built lawn because I got tired of waiting for Frame.io to load. Video review should be instant."</blockquote>
      <a href="https://x.com/theo" target="_blank" rel="noopener noreferrer" class="inline-block border-2 border-[#f0f0e8] px-6 py-3 font-bold uppercase tracking-wider hover:bg-[#f0f0e8] hover:text-[#2d5a2d] transition-colors">— Theo</a>
    </div>
  </section>

  <section id="pricing" class="px-6 py-24 md:py-32 border-b-2 border-[#1a1a1a] bg-[#e8e8e0]">
    <div class="max-w-6xl mx-auto">
      <h2 class="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-16 text-center">PRICING.</h2>
      <div class="flex flex-col md:flex-row gap-8 justify-center items-center">
        <div class="bg-[#f0f0e8] border-2 border-[#1a1a1a] shadow-[8px_8px_0px_0px_var(--shadow-color)] p-8 w-full max-w-md flex flex-col hover:-translate-y-2 hover:translate-x-2 hover:shadow-[4px_4px_0px_0px_var(--shadow-color)] transition-all">
          <div class="text-xl font-bold uppercase tracking-widest text-[#888] mb-2">Basic</div>
          <div class="text-6xl font-black tracking-tighter mb-4">$5<span class="text-2xl text-[#888]">/mo</span></div>
          <p class="text-lg font-medium text-[#1a1a1a] mb-8">Unlimited everything, except storage.</p>
          <ul class="space-y-4 text-lg font-bold flex-grow mb-8">
            <li class="flex items-center gap-3"><span class="text-[#2d5a2d] text-2xl">✓</span> Unlimited seats</li>
            <li class="flex items-center gap-3"><span class="text-[#2d5a2d] text-2xl">✓</span> Unlimited projects</li>
            <li class="flex items-center gap-3"><span class="text-[#2d5a2d] text-2xl">✓</span> Unlimited clients</li>
            <li class="flex items-center gap-3"><span class="text-[#2d5a2d] text-2xl">✓</span> 100GB Storage</li>
          </ul>
          <a href="/sign-up" class="bg-[#1a1a1a] text-[#f0f0e8] text-center py-4 border-2 border-[#1a1a1a] font-black uppercase hover:bg-[#2d5a2d] transition-colors">Get Basic</a>
        </div>
        <div class="bg-[#1a1a1a] text-[#f0f0e8] border-2 border-[#1a1a1a] shadow-[8px_8px_0px_0px_var(--shadow-color)] p-8 w-full max-w-md flex flex-col transform md:-translate-y-4 hover:-translate-y-6 hover:translate-x-2 hover:shadow-[4px_4px_0px_0px_var(--shadow-color)] transition-all">
          <div class="flex justify-between items-start mb-2">
            <div class="text-xl font-bold uppercase tracking-widest text-[#7cb87c]">Pro</div>
            <div class="bg-[#2d5a2d] text-xs font-black px-2 py-1 uppercase tracking-wider -rotate-3">Big files</div>
          </div>
          <div class="text-6xl font-black tracking-tighter mb-4">$25<span class="text-2xl text-[#888]">/mo</span></div>
          <p class="text-lg font-medium mb-8">Literally the exact same thing but more space.</p>
          <ul class="space-y-4 text-lg font-bold flex-grow mb-8">
            <li class="flex items-center gap-3"><span class="text-[#7cb87c] text-2xl">✓</span> Unlimited seats</li>
            <li class="flex items-center gap-3"><span class="text-[#7cb87c] text-2xl">✓</span> Unlimited projects</li>
            <li class="flex items-center gap-3"><span class="text-[#7cb87c] text-2xl">✓</span> Unlimited clients</li>
            <li class="flex items-center gap-3"><span class="text-[#7cb87c] text-2xl">✓</span> 1TB Storage (Whoa)</li>
          </ul>
          <a href="/sign-up" class="bg-[#f0f0e8] text-[#1a1a1a] text-center py-4 border-2 border-[#f0f0e8] font-black uppercase hover:bg-[#d8d8d0] transition-colors">Get Pro</a>
        </div>
      </div>
    </div>
  </section>

  <section class="px-6 py-32 bg-[#f0f0e8]">
    <div class="max-w-4xl mx-auto text-center flex flex-col items-center">
      <h2 class="text-7xl md:text-9xl font-black uppercase tracking-tighter leading-[0.8] mb-8">START<br/>NOW.</h2>
      <p class="text-2xl text-[#888] font-medium mb-12">Basic is $5/month. Pro is $25/month.</p>
      <a href="/sign-up" class="bg-[#1a1a1a] text-[#f0f0e8] px-12 py-6 border-2 border-[#1a1a1a] text-2xl font-black uppercase tracking-wider hover:bg-[#2d5a2d] hover:border-[#2d5a2d] transition-colors shadow-[12px_12px_0px_0px_var(--shadow-accent)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[8px_8px_0px_0px_var(--shadow-accent)]">CREATE YOUR TEAM</a>
    </div>
  </section>

  <MarketingFooter />

  {@html `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "lawn",
    description: "Video review and collaboration for creative teams. Frame-accurate comments, unlimited seats, flat pricing.",
    url: "https://lawn.video",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    offers: [
      { "@type": "Offer", name: "Basic", price: "5.00", priceCurrency: "USD", description: "Unlimited seats, unlimited projects, unlimited clients, 100GB storage" },
      { "@type": "Offer", name: "Pro", price: "25.00", priceCurrency: "USD", description: "Unlimited seats, unlimited projects, unlimited clients, 1TB storage" },
    ],
    creator: { "@type": "Person", name: "Theo", url: "https://x.com/theo" },
  })}</script>`}
</div>
