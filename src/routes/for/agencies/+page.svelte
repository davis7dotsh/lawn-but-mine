<script lang="ts">
  import MarketingLayout from "$lib/components/MarketingLayout.svelte";

  const painPoints = [
    { id: "01", title: "ADDING A FREELANCER SHOULDN'T COST $19/MO", description: "You hired them for a two-week project. Why are you paying a monthly seat fee? lawn is $5/month total. Unlimited seats. Add your whole roster — full-timers, freelancers, that one intern who's \"really good at Premiere.\"" },
    { id: "02", title: "CLIENTS NEED NO-ACCOUNT REVIEW", description: 'Your client doesn\'t want to create an account. They want to watch the video, leave a comment at 0:47 that says "make it pop more," and move on with their day. Send a link. That\'s it.' },
    { id: "03", title: "MANAGING 12 CLIENTS SHOULDN'T REQUIRE A PM TOOL", description: "Unlimited projects, organized by team. No per-project limits, no storage gotchas. Every client gets their own space. You get your sanity back." },
    { id: "04", title: "FAST TURNAROUND MEANS FAST TOOLS", description: 'Client says "I need to see it by 3pm." It\'s 2:47pm. You upload the cut, it plays instantly. No transcoding queue. No "processing your video" spinner. Just playback.' },
  ];

  const comparisons = [
    { size: "5-PERSON TEAM", competitor: "$95", lawn: "$5", saved: "$1,080", commentary: "That's a lot of coffee." },
    { size: "10-PERSON TEAM", competitor: "$190", lawn: "$5", saved: "$2,220", commentary: "A nice camera lens, actually." },
    { size: "15 + FREELANCERS", competitor: "$285+", lawn: "$5", saved: "$3,360+", commentary: "Almost enough for one more freelancer." },
  ];
</script>

<svelte:head>
  <title>Video review for agencies — stop paying per seat</title>
  <meta name="description" content="Video review built for agencies. Unlimited seats for $5/month. No per-user pricing, no client accounts needed, instant sharing." />
</svelte:head>

<MarketingLayout>
  <section class="px-6 py-24 md:py-32 border-b-2 border-[#1a1a1a] bg-[#f0f0e8]">
    <div class="max-w-7xl mx-auto">
      <div class="mb-6">
        <span class="text-sm font-bold uppercase tracking-widest text-[#888]">/FOR AGENCIES</span>
      </div>
      <h1 class="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter leading-[0.85]">
        STOP PAYING<br />
        PER SEAT.<br />
        <span class="text-[#2d5a2d]">START SHIPPING</span><br />
        WORK.
      </h1>
      <div class="mt-12 max-w-2xl">
        <p class="text-xl md:text-2xl font-medium text-[#1a1a1a]">
          You're a 15-person agency with 30 freelancers rotating through. Per-seat pricing wasn't built for you. It was built to charge you more.
        </p>
        <p class="text-lg text-[#888] font-medium mt-4">
          lawn is video review for creative teams. Unlimited seats. $5/month. The whole agency, not per editor.
        </p>
      </div>
      <div class="mt-12 flex flex-col sm:flex-row gap-4">
        <a href="/sign-up" class="bg-[#1a1a1a] text-[#f0f0e8] px-8 py-5 border-2 border-[#1a1a1a] font-black text-lg uppercase tracking-wider hover:bg-[#2d5a2d] transition-colors shadow-[8px_8px_0px_0px_var(--shadow-color)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[4px_4px_0px_0px_var(--shadow-color)] text-center">
          START YOUR TEAM
        </a>
        <div class="bg-[#f0f0e8] border-2 border-[#1a1a1a] px-8 py-5 shadow-[8px_8px_0px_0px_var(--shadow-color)]">
          <span class="text-3xl font-black block leading-none">$5/mo</span>
          <span class="text-xs font-bold uppercase tracking-wider text-[#888] mt-1 block">Unlimited seats. Seriously.</span>
        </div>
      </div>
    </div>
  </section>

  <section class="px-6 py-24 md:py-32 border-b-2 border-[#1a1a1a] bg-[#e8e8e0]">
    <div class="max-w-7xl mx-auto">
      <h2 class="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-6">
        AGENCY LIFE<br />IS HARD ENOUGH.
      </h2>
      <p class="text-xl text-[#888] font-medium mb-16 max-w-2xl">
        Your video review tool shouldn't make it harder. Here are the problems we actually solve.
      </p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        {#each painPoints as point}
          <div class="bg-[#f0f0e8] border-2 border-[#1a1a1a] shadow-[8px_8px_0px_0px_var(--shadow-color)] flex flex-col hover:-translate-y-1 hover:translate-x-1 hover:shadow-[4px_4px_0px_0px_var(--shadow-color)] transition-all">
            <div class="border-b-2 border-[#1a1a1a] px-6 py-4 flex items-center gap-4 bg-[#1a1a1a] text-[#f0f0e8]">
              <span class="text-sm font-black text-[#7cb87c]">/{point.id}</span>
            </div>
            <div class="p-6 md:p-8 flex-grow">
              <h3 class="text-xl md:text-2xl font-black uppercase tracking-tight leading-tight mb-4">{point.title}</h3>
              <p class="text-base font-medium text-[#1a1a1a] leading-relaxed">{point.description}</p>
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
          <h2 class="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-6">
            DO THE<br />MATH.
          </h2>
          <p class="text-xl text-[#888] font-medium max-w-sm">
            Frame.io charges $19/user/month. lawn charges $5/month total. Here's what that looks like at agency scale.
          </p>
        </div>
        <div class="lg:w-2/3 flex flex-col gap-6">
          {#each comparisons as row}
            <div class="border-2 border-[#1a1a1a] shadow-[8px_8px_0px_0px_var(--shadow-color)] hover:-translate-y-1 hover:translate-x-1 hover:shadow-[4px_4px_0px_0px_var(--shadow-color)] transition-all">
              <div class="flex flex-col md:flex-row">
                <div class="bg-[#1a1a1a] text-[#f0f0e8] p-6 md:p-8 md:w-1/3 flex flex-col justify-center border-b-2 md:border-b-0 md:border-r-2 border-[#1a1a1a]">
                  <span class="text-xs font-bold tracking-widest text-[#7cb87c] mb-1">TEAM SIZE</span>
                  <span class="text-2xl md:text-3xl font-black uppercase tracking-tight leading-none">{row.size}</span>
                </div>
                <div class="flex flex-col sm:flex-row flex-grow">
                  <div class="p-6 md:p-8 flex-1 border-b-2 sm:border-b-0 sm:border-r-2 border-[#1a1a1a] bg-[#ffffff]">
                    <span class="text-xs font-bold tracking-widest text-[#888] block mb-1">FRAME.IO</span>
                    <span class="text-3xl font-black text-[#dc2626]">{row.competitor}</span>
                    <span class="text-sm text-[#888] font-bold">/mo</span>
                  </div>
                  <div class="p-6 md:p-8 flex-1 border-b-2 sm:border-b-0 sm:border-r-2 border-[#1a1a1a] bg-[#f0f0e8]">
                    <span class="text-xs font-bold tracking-widest text-[#888] block mb-1">LAWN</span>
                    <span class="text-3xl font-black text-[#2d5a2d]">{row.lawn}</span>
                    <span class="text-sm text-[#888] font-bold">/mo</span>
                  </div>
                  <div class="p-6 md:p-8 flex-1 bg-[#f0f0e8]">
                    <span class="text-xs font-bold tracking-widest text-[#888] block mb-1">YOU SAVE / YEAR</span>
                    <span class="text-3xl font-black text-[#2d5a2d]">{row.saved}</span>
                    <p class="text-sm font-bold text-[#888] mt-2">{row.commentary}</p>
                  </div>
                </div>
              </div>
            </div>
          {/each}
          <div class="border-2 border-[#1a1a1a] bg-[#1a1a1a] text-[#f0f0e8] p-6 md:p-8">
            <p class="text-lg font-bold">
              <span class="text-[#7cb87c]">The pattern:</span> They charge more as you grow. We don't. Your 50th seat costs the same as your first — $0 extra.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="px-6 py-32 bg-[#2d5a2d] text-[#f0f0e8] border-b-2 border-[#1a1a1a]">
    <div class="max-w-4xl mx-auto text-center flex flex-col items-center">
      <h2 class="text-6xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter leading-[0.85] mb-8">
        START YOUR<br />TEAM.
      </h2>
      <p class="text-xl md:text-2xl font-medium mb-4 max-w-lg">
        $5/month. Unlimited seats. Unlimited projects. No per-user pricing. Ever.
      </p>
      <p class="text-lg text-[#f0f0e8]/60 font-medium mb-12">
        Set up takes about 2 minutes. Your first freelancer will thank you.
      </p>
      <a href="/sign-up" class="bg-[#f0f0e8] text-[#1a1a1a] px-12 py-6 border-2 border-[#f0f0e8] text-2xl font-black uppercase tracking-wider hover:bg-[#1a1a1a] hover:text-[#f0f0e8] hover:border-[#f0f0e8] transition-colors shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
        START YOUR TEAM
      </a>
    </div>
  </section>
</MarketingLayout>
