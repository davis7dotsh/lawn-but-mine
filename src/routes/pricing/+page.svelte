<script lang="ts">
  import MarketingLayout from "$lib/components/MarketingLayout.svelte";
</script>

<svelte:head>
  <title>Pricing — $5/month, unlimited seats</title>
  <meta name="description" content="lawn pricing is simple. $5/month for unlimited seats, projects, and clients. $25/month if you need more storage. No per-user fees." />
</svelte:head>

<MarketingLayout>
  <section class="px-6 pt-24 pb-16 md:pt-32 md:pb-24 bg-[#f0f0e8] border-b-2 border-[#1a1a1a]">
    <div class="max-w-5xl mx-auto">
      <h1 class="text-7xl md:text-9xl font-black uppercase tracking-tighter leading-[0.85]">
        PRICING.
      </h1>
      <p class="text-2xl md:text-3xl font-bold mt-8 max-w-2xl">
        $5/month. Not per user. Not per project. <span class="text-[#888]">Total.</span>
      </p>
    </div>
  </section>

  <section class="px-6 py-24 md:py-32 bg-[#e8e8e0] border-b-2 border-[#1a1a1a]">
    <div class="max-w-5xl mx-auto">
      <div class="flex flex-col md:flex-row gap-8 justify-center items-center">
        <div class="bg-[#f0f0e8] border-2 border-[#1a1a1a] shadow-[8px_8px_0px_0px_#1a1a1a] p-8 w-full max-w-md flex flex-col hover:-translate-y-2 hover:translate-x-2 hover:shadow-[4px_4px_0px_0px_#1a1a1a] transition-all">
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
        <div class="bg-[#1a1a1a] text-[#f0f0e8] border-2 border-[#1a1a1a] shadow-[8px_8px_0px_0px_#1a1a1a] p-8 w-full max-w-md flex flex-col transform md:-translate-y-4 hover:-translate-y-6 hover:translate-x-2 hover:shadow-[4px_4px_0px_0px_#1a1a1a] transition-all">
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
            <li class="flex items-center gap-3"><span class="text-[#7cb87c] text-2xl">✓</span> 1TB Storage</li>
          </ul>
          <a href="/sign-up" class="bg-[#f0f0e8] text-[#1a1a1a] text-center py-4 border-2 border-[#f0f0e8] font-black uppercase hover:bg-[#d8d8d0] transition-colors">Get Pro</a>
        </div>
      </div>
    </div>
  </section>

  <section class="px-6 py-24 md:py-32 bg-[#f0f0e8] border-b-2 border-[#1a1a1a]">
    <div class="max-w-4xl mx-auto">
      <h2 class="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-16">FAQ.</h2>
      <div class="divide-y-2 divide-[#1a1a1a] border-y-2 border-[#1a1a1a]">
        {#each [
          { q: "What counts as a seat?", a: "Anyone on your team. Invite everyone — editors, producers, clients. No extra charge." },
          { q: "Can clients review without an account?", a: "Yes. Send a share link. They click, watch, and comment. No sign-up required." },
          { q: "What happens if I hit the storage limit?", a: "Upgrade to Pro for more space, or delete old projects to free up room." },
          { q: "Is there a free trial?", a: "Yes. Sign up and try it. No credit card required to start." },
          { q: "Is lawn really open source?", a: "Fully. Check our GitHub. Read the code, fork it, whatever you want." },
        ] as item}
          <div class="py-8">
            <h3 class="text-xl md:text-2xl font-black uppercase tracking-tight mb-3">{item.q}</h3>
            <p class="text-lg font-medium text-[#888]">{item.a}</p>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <section class="px-6 py-32 bg-[#1a1a1a] text-[#f0f0e8]">
    <div class="max-w-4xl mx-auto text-center flex flex-col items-center">
      <h2 class="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-4">Still reading?</h2>
      <p class="text-xl text-[#888] font-medium mb-12">Just try it. No credit card. No commitment.</p>
      <a href="/sign-up" class="bg-[#f0f0e8] text-[#1a1a1a] px-12 py-6 border-2 border-[#f0f0e8] text-2xl font-black uppercase tracking-wider hover:bg-[#2d5a2d] hover:text-[#f0f0e8] hover:border-[#2d5a2d] transition-colors shadow-[8px_8px_0px_0px_rgba(45,90,45,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[4px_4px_0px_0px_rgba(45,90,45,1)]">
        START FREE TRIAL
      </a>
    </div>
  </section>
</MarketingLayout>
