<script lang="ts">
  import MarketingLayout from "@/lib/components/MarketingLayout.svelte";
  import { seoHead } from "@/lib/seo";

  const head = seoHead({
    title: "For agencies",
    description:
      "lawn gives agencies unlimited seats, no-account client review, and flat video review pricing that does not punish team growth.",
    path: "/for/agencies",
  });

  const title = head.meta.find((tag) => "title" in tag)?.title ?? "For agencies | lawn";
  const metaTags = head.meta.filter((tag) => !("title" in tag));

  const painPoints = [
    {
      id: "01",
      title: "ADDING A FREELANCER SHOULDN'T COST $19/MO",
      description:
        `You hired them for a two-week project. Why are you paying a monthly seat fee? lawn is $5/month total. Unlimited seats. Add your whole roster — full-timers, freelancers, that one intern who's "really good at Premiere."`,
    },
    {
      id: "02",
      title: "CLIENTS NEED NO-ACCOUNT REVIEW",
      description:
        `Your client doesn't want to create an account. They want to watch the video, leave a comment at 0:47 that says "make it pop more," and move on with their day. Send a link. That's it.`,
    },
    {
      id: "03",
      title: "MANAGING 12 CLIENTS SHOULDN'T REQUIRE A PM TOOL",
      description:
        "Unlimited projects, organized by team. No per-project limits, no storage gotchas. Every client gets their own space. You get your sanity back.",
    },
    {
      id: "04",
      title: "FAST TURNAROUND MEANS FAST TOOLS",
      description:
        `Client says "I need to see it by 3pm." It's 2:47pm. You upload the cut, it plays instantly. No transcoding queue. No "processing your video" spinner. Just playback.`,
    },
  ];

  const comparisons = [
    { size: "5-PERSON TEAM", competitor: "$95", lawn: "$5", saved: "$1,080", commentary: "That's a lot of coffee." },
    { size: "10-PERSON TEAM", competitor: "$190", lawn: "$5", saved: "$2,220", commentary: "A nice camera lens, actually." },
    { size: "15 + FREELANCERS", competitor: "$285+", lawn: "$5", saved: "$3,360+", commentary: "Almost enough for one more freelancer." },
  ];
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

<MarketingLayout>
  <section class="border-b-2 border-[#1a1a1a] bg-[#f0f0e8] px-6 py-24 md:py-32">
    <div class="mx-auto max-w-7xl">
      <div class="mb-6">
        <span class="text-sm font-bold uppercase tracking-widest text-[#888]">/FOR AGENCIES</span>
      </div>
      <h1 class="text-5xl font-black uppercase leading-[0.85] tracking-tighter sm:text-7xl md:text-8xl lg:text-9xl">
        STOP PAYING
        <br />
        PER SEAT.
        <br />
        <span class="text-[#2d5a2d]">START SHIPPING</span>
        <br />
        WORK.
      </h1>
      <div class="mt-12 max-w-2xl">
        <p class="text-xl font-medium text-[#1a1a1a] md:text-2xl">
          You're a 15-person agency with 30 freelancers rotating through. Per-seat pricing wasn't built for you. It was built to charge you more.
        </p>
        <p class="mt-4 text-lg font-medium text-[#888]">
          lawn is video review for creative teams. Unlimited seats. $5/month. The whole agency, not per editor.
        </p>
      </div>
      <div class="mt-12 flex flex-col gap-4 sm:flex-row">
        <a
          href="/sign-up"
          class="border-2 border-[#1a1a1a] bg-[#1a1a1a] px-8 py-5 text-center text-lg font-black uppercase tracking-wider text-[#f0f0e8] shadow-[8px_8px_0px_0px_var(--shadow-color)] transition-colors hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[#2d5a2d] hover:shadow-[4px_4px_0px_0px_var(--shadow-color)]"
          data-sveltekit-preload-data="hover"
        >
          START YOUR TEAM
        </a>
        <div class="border-2 border-[#1a1a1a] bg-[#f0f0e8] px-8 py-5 shadow-[8px_8px_0px_0px_var(--shadow-color)]">
          <span class="block text-3xl font-black leading-none">$5/mo</span>
          <span class="mt-1 block text-xs font-bold uppercase tracking-wider text-[#888]">Unlimited seats. Seriously.</span>
        </div>
      </div>
    </div>
  </section>

  <section class="border-b-2 border-[#1a1a1a] bg-[#e8e8e0] px-6 py-24 md:py-32">
    <div class="mx-auto max-w-7xl">
      <h2 class="mb-6 text-5xl font-black uppercase leading-none tracking-tighter md:text-7xl">
        AGENCY LIFE
        <br />
        IS HARD ENOUGH.
      </h2>
      <p class="mb-16 max-w-2xl text-xl font-medium text-[#888]">
        Your video review tool shouldn't make it harder. Here are the problems we actually solve.
      </p>

      <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
        {#each painPoints as point}
          <div class="flex flex-col border-2 border-[#1a1a1a] bg-[#f0f0e8] shadow-[8px_8px_0px_0px_var(--shadow-color)] transition-all hover:translate-x-1 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_var(--shadow-color)]">
            <div class="flex items-center gap-4 border-b-2 border-[#1a1a1a] bg-[#1a1a1a] px-6 py-4 text-[#f0f0e8]">
              <span class="text-sm font-black text-[#7cb87c]">/{point.id}</span>
            </div>
            <div class="flex-grow p-6 md:p-8">
              <h3 class="mb-4 text-xl font-black uppercase leading-tight tracking-tight md:text-2xl">{point.title}</h3>
              <p class="text-base font-medium leading-relaxed text-[#1a1a1a]">{point.description}</p>
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
            DO THE
            <br />
            MATH.
          </h2>
          <p class="max-w-sm text-xl font-medium text-[#888]">
            Frame.io charges $19/user/month. lawn charges $5/month total. Here's what that looks like at agency scale.
          </p>
        </div>

        <div class="flex flex-col gap-6 lg:w-2/3">
          {#each comparisons as row}
            <div class="border-2 border-[#1a1a1a] shadow-[8px_8px_0px_0px_var(--shadow-color)] transition-all hover:translate-x-1 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_var(--shadow-color)]">
              <div class="flex flex-col md:flex-row">
                <div class="flex flex-col justify-center border-b-2 border-[#1a1a1a] bg-[#1a1a1a] p-6 text-[#f0f0e8] md:w-1/3 md:border-b-0 md:border-r-2 md:p-8">
                  <span class="mb-1 text-xs font-bold tracking-widest text-[#7cb87c]">TEAM SIZE</span>
                  <span class="text-2xl font-black uppercase leading-none tracking-tight md:text-3xl">{row.size}</span>
                </div>

                <div class="flex flex-grow flex-col sm:flex-row">
                  <div class="flex-1 border-b-2 border-[#1a1a1a] bg-[#ffffff] p-6 sm:border-b-0 sm:border-r-2 md:p-8">
                    <span class="mb-1 block text-xs font-bold tracking-widest text-[#888]">FRAME.IO</span>
                    <span class="text-3xl font-black text-[#dc2626]">{row.competitor}</span>
                    <span class="text-sm font-bold text-[#888]">/mo</span>
                  </div>
                  <div class="flex-1 border-b-2 border-[#1a1a1a] bg-[#f0f0e8] p-6 sm:border-b-0 sm:border-r-2 md:p-8">
                    <span class="mb-1 block text-xs font-bold tracking-widest text-[#888]">LAWN</span>
                    <span class="text-3xl font-black text-[#2d5a2d]">{row.lawn}</span>
                    <span class="text-sm font-bold text-[#888]">/mo</span>
                  </div>
                  <div class="flex-1 bg-[#f0f0e8] p-6 md:p-8">
                    <span class="mb-1 block text-xs font-bold tracking-widest text-[#888]">YOU SAVE / YEAR</span>
                    <span class="text-3xl font-black text-[#2d5a2d]">{row.saved}</span>
                    <p class="mt-2 text-sm font-bold text-[#888]">{row.commentary}</p>
                  </div>
                </div>
              </div>
            </div>
          {/each}

          <div class="border-2 border-[#1a1a1a] bg-[#1a1a1a] p-6 text-[#f0f0e8] md:p-8">
            <p class="text-lg font-bold">
              <span class="text-[#7cb87c]">The pattern:</span> They charge more as you grow. We don't. Your 50th seat costs the same as your first — $0 extra.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="border-b-2 border-[#1a1a1a] bg-[#2d5a2d] px-6 py-32 text-[#f0f0e8]">
    <div class="mx-auto flex max-w-4xl flex-col items-center text-center">
      <h2 class="mb-8 text-6xl font-black uppercase leading-[0.85] tracking-tighter md:text-8xl lg:text-9xl">
        START YOUR
        <br />
        TEAM.
      </h2>
      <p class="mb-4 text-xl font-medium md:text-2xl">
        $5/month. Unlimited seats. Unlimited projects. No per-user pricing. Ever.
      </p>
      <p class="mb-12 text-lg font-medium text-[#f0f0e8]/60">
        Set up takes about 2 minutes. Your first freelancer will thank you.
      </p>
      <a
        href="/sign-up"
        class="border-2 border-[#f0f0e8] bg-[#f0f0e8] px-12 py-6 text-2xl font-black uppercase tracking-wider text-[#1a1a1a] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)] transition-colors hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[#1a1a1a] hover:text-[#f0f0e8] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]"
        data-sveltekit-preload-data="hover"
      >
        START YOUR TEAM
      </a>
    </div>
  </section>
</MarketingLayout>
