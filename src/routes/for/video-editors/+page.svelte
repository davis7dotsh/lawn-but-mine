<script lang="ts">
  import MarketingLayout from "@/lib/components/MarketingLayout.svelte";
  import { seoHead } from "@/lib/seo";

  const head = seoHead({
    title: "For video editors",
    description:
      "lawn gives video editors frame-accurate comments, instant playback, and flat team pricing without per-seat review tax.",
    path: "/for/video-editors",
  });

  const title = head.meta.find((tag) => "title" in tag)?.title ?? "For video editors | lawn";
  const metaTags = head.meta.filter((tag) => !("title" in tag));

  const painPoints = [
    {
      id: "01",
      title: "CLIENTS DON'T KNOW TIMECODES",
      description:
        'Your client says "around the middle somewhere, you know, after the thing." With lawn, they click on the video and their comment lands on that exact frame. No timecode math. No guessing.',
    },
    {
      id: "02",
      title: "UPLOAD, WAIT, TRANSCODE, WAIT",
      description:
        "You just exported a 12GB ProRes and now you need to wait 20 minutes for it to process. lawn uses Mux-powered playback — upload your file, get a link, share it. Seconds, not minutes.",
    },
    {
      id: "03",
      title: "GETTING NOTES BACK INTO YOUR NLE",
      description:
        "Comments are useless if you have to manually re-type them into your timeline. Export frame-accurate comments with timecodes and bring them straight back to Premiere, Resolve, or Final Cut.",
    },
    {
      id: "04",
      title: "10 REVIEWERS = 10 SEATS = $$$",
      description:
        "The director, the producer, the client, the client's wife, the intern who somehow has opinions — they all need access. lawn is $5/month flat. Invite literally everyone.",
    },
  ];

  const steps = [
    {
      step: "1",
      action: "UPLOAD YOUR CUT",
      description:
        "Drag and drop your export. H.264, ProRes, whatever. We process it instantly through Mux so playback is fast on any device, any connection.",
    },
    {
      step: "2",
      action: "SHARE A LINK",
      description:
        "Copy the review link and send it to your client. They don't need an account, they don't need to download anything. They just click and watch.",
    },
    {
      step: "3",
      action: "COLLECT & EXPORT",
      description:
        "Clients click anywhere on the video to leave comments at exact frames. You see every note with precise timecodes, ready to export back to your NLE timeline.",
    },
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
  <section class="border-b-2 border-[#1a1a1a] bg-[var(--background)] px-6 py-24 md:py-32">
    <div class="mx-auto max-w-5xl">
      <div class="mb-6 text-sm font-bold uppercase tracking-widest text-[#888]">FOR VIDEO EDITORS</div>
      <h1 class="mb-8 text-5xl font-black uppercase leading-[0.85] tracking-tighter md:text-7xl lg:text-8xl">
        VIDEO REVIEW THAT EDITORS ACTUALLY WANT TO USE.
      </h1>
      <p class="mb-12 max-w-3xl text-xl font-medium text-[#888] md:text-2xl">
        Your client said "make it pop" on a 47-minute timeline. You deserve a review tool that at least tells you where they meant. lawn gives you frame-accurate feedback, instant playback, and a workflow that doesn't fight your NLE.
      </p>
      <div class="flex flex-col gap-4 sm:flex-row">
        <a
          href="/sign-up"
          class="border-2 border-[#1a1a1a] bg-[#1a1a1a] px-8 py-4 text-center text-lg font-black uppercase tracking-wider text-[#f0f0e8] shadow-[6px_6px_0px_0px_var(--shadow-color)] transition-colors hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[#2d5a2d] hover:shadow-[4px_4px_0px_0px_var(--shadow-color)]"
          data-sveltekit-preload-data="hover"
        >
          START FREE TRIAL
        </a>
        <div class="flex items-center gap-3 px-4">
          <span class="text-2xl font-black">$5/mo</span>
          <span class="text-sm font-bold uppercase tracking-wider text-[#888]">flat, not per seat</span>
        </div>
      </div>
    </div>
  </section>

  <section class="border-b-2 border-[#1a1a1a] bg-[#e8e8e0] px-6 py-24 md:py-32">
    <div class="mx-auto max-w-7xl">
      <h2 class="mb-4 text-center text-4xl font-black uppercase leading-none tracking-tighter md:text-6xl">
        THE PAIN IS REAL.
      </h2>
      <p class="mx-auto mb-16 max-w-2xl text-center text-lg font-medium text-[#888]">
        Every editor knows these problems. We built lawn to fix them.
      </p>

      <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
        {#each painPoints as point}
          <div class="border-2 border-[#1a1a1a] bg-[#f0f0e8] shadow-[8px_8px_0px_0px_var(--shadow-color)] transition-all hover:translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_var(--shadow-color)]">
            <div class="flex items-center justify-between border-b-2 border-[#1a1a1a] px-6 py-4">
              <span class="text-sm font-black text-[#888]">/{point.id}</span>
              <span class="text-sm font-bold uppercase tracking-wider text-[#2d5a2d]">SOLVED</span>
            </div>
            <div class="p-6 md:p-8">
              <h3 class="mb-4 text-xl font-black uppercase leading-tight tracking-tight md:text-2xl">{point.title}</h3>
              <p class="text-base font-medium leading-relaxed text-[#1a1a1a]">{point.description}</p>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <section class="border-b-2 border-[#1a1a1a] bg-[var(--background)] px-6 py-24 md:py-32">
    <div class="mx-auto max-w-7xl">
      <h2 class="mb-4 text-center text-4xl font-black uppercase leading-none tracking-tighter md:text-6xl">
        HOW IT WORKS.
      </h2>
      <p class="mx-auto mb-16 max-w-2xl text-center text-lg font-medium text-[#888]">
        Three steps. No onboarding calls, no training videos, no "schedule a demo" buttons.
      </p>

      <div class="grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-12">
        {#each steps as item}
          <div class="flex flex-col border-2 border-[#1a1a1a] bg-[#f0f0e8] shadow-[12px_12px_0px_0px_var(--shadow-color)] transition-all hover:translate-x-2 hover:-translate-y-2 hover:shadow-[4px_4px_0px_0px_var(--shadow-color)]">
            <div class="flex items-end justify-between border-b-2 border-[#1a1a1a] bg-[#1a1a1a] p-6 text-[#f0f0e8]">
              <span class="text-7xl font-black leading-none">{item.step}</span>
              <span class="mb-1 text-xl font-bold tracking-widest text-[#888]">STEP</span>
            </div>
            <div class="flex flex-grow flex-col p-8">
              <h3 class="mb-4 text-2xl font-black uppercase tracking-tighter text-[#2d5a2d] md:text-3xl">{item.action}</h3>
              <p class="text-base font-medium leading-relaxed text-[#1a1a1a]">{item.description}</p>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <section class="border-b-2 border-[#1a1a1a] bg-[#2d5a2d] px-6 py-24 text-[#f0f0e8] md:py-32">
    <div class="mx-auto max-w-5xl text-center">
      <h2 class="mb-8 text-6xl font-black uppercase leading-[0.85] tracking-tighter md:text-8xl lg:text-9xl">
        $5/MONTH.
        <br />
        <span class="text-[#7cb87c]">NOT PER USER.</span>
        <br />
        TOTAL.
      </h2>
      <p class="mx-auto mb-4 max-w-2xl text-xl font-medium text-[#f0f0e8]/80 md:text-2xl">
        Unlimited seats. Unlimited projects. Unlimited reviewers. Your entire team, your clients, your client's clients — everyone gets access for one flat price.
      </p>
      <p class="text-lg font-bold text-[#7cb87c]">Stop paying per-seat tax on collaboration.</p>
    </div>
  </section>

  <section class="bg-[var(--background)] px-6 py-32">
    <div class="mx-auto flex max-w-4xl flex-col items-center text-center">
      <h2 class="mb-6 text-5xl font-black uppercase leading-[0.85] tracking-tighter md:text-7xl lg:text-8xl">
        START EDITING FASTER.
      </h2>
      <p class="mb-12 max-w-xl text-xl font-medium text-[#888]">
        Free trial, no credit card. Set up your first review in under a minute.
      </p>
      <a
        href="/sign-up"
        class="border-2 border-[#1a1a1a] bg-[#1a1a1a] px-12 py-6 text-2xl font-black uppercase tracking-wider text-[#f0f0e8] shadow-[12px_12px_0px_0px_var(--shadow-accent)] transition-colors hover:translate-x-[2px] hover:translate-y-[2px] hover:border-[#2d5a2d] hover:bg-[#2d5a2d] hover:shadow-[8px_8px_0px_0px_var(--shadow-accent)]"
        data-sveltekit-preload-data="hover"
      >
        START FREE TRIAL
      </a>
    </div>
  </section>
</MarketingLayout>
