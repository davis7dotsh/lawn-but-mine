<script lang="ts">
  import MarketingLayout from "$lib/components/MarketingLayout.svelte";

  const painPoints = [
    { id: "01", title: "CLIENTS DON'T KNOW TIMECODES", description: 'Your client says "around the middle somewhere, you know, after the thing." With lawn, they click on the video and their comment lands on that exact frame. No timecode math. No guessing.' },
    { id: "02", title: "UPLOAD, WAIT, TRANSCODE, WAIT", description: "You just exported a 12GB ProRes and now you need to wait 20 minutes for it to process. lawn uses Mux-powered playback — upload your file, get a link, share it. Seconds, not minutes." },
    { id: "03", title: "GETTING NOTES BACK INTO YOUR NLE", description: "Comments are useless if you have to manually re-type them into your timeline. Export frame-accurate comments with timecodes and bring them straight back to Premiere, Resolve, or Final Cut." },
    { id: "04", title: "10 REVIEWERS = 10 SEATS = $$$", description: "The director, the producer, the client, the client's wife, the intern who somehow has opinions — they all need access. lawn is $5/month flat. Invite literally everyone." },
  ];

  const steps = [
    { step: "1", action: "UPLOAD YOUR CUT", description: "Drag and drop your export. H.264, ProRes, whatever. We process it instantly through Mux so playback is fast on any device, any connection." },
    { step: "2", action: "SHARE A LINK", description: "Copy the review link and send it to your client. They don't need an account, they don't need to download anything. They just click and watch." },
    { step: "3", action: "COLLECT & EXPORT", description: "Clients click anywhere on the video to leave comments at exact frames. You see every note with precise timecodes, ready to export back to your NLE timeline." },
  ];
</script>

<svelte:head>
  <title>Video review for editors — frame-accurate feedback</title>
  <meta name="description" content="Video review built for editors. Frame-accurate comments, instant playback, no account required for reviewers. $5/month flat." />
</svelte:head>

<MarketingLayout>
  <section class="px-6 py-24 md:py-32 border-b-2 border-[#1a1a1a] bg-[var(--background)]">
    <div class="max-w-5xl mx-auto">
      <div class="text-sm font-bold uppercase tracking-widest text-[#888] mb-6">FOR VIDEO EDITORS</div>
      <h1 class="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.85] mb-8">
        VIDEO REVIEW THAT EDITORS ACTUALLY WANT TO USE.
      </h1>
      <p class="text-xl md:text-2xl font-medium text-[#888] max-w-3xl mb-12">
        Your client said "make it pop" on a 47-minute timeline. You deserve a review tool that at least tells you where they meant. lawn gives you frame-accurate feedback, instant playback, and a workflow that doesn't fight your NLE.
      </p>
      <div class="flex flex-col sm:flex-row gap-4">
        <a href="/sign-up" class="bg-[#1a1a1a] text-[#f0f0e8] px-8 py-4 border-2 border-[#1a1a1a] font-black text-lg uppercase tracking-wider hover:bg-[#2d5a2d] transition-colors shadow-[6px_6px_0px_0px_var(--shadow-color)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[4px_4px_0px_0px_var(--shadow-color)] text-center">
          START FREE TRIAL
        </a>
        <div class="flex items-center gap-3 px-4">
          <span class="text-2xl font-black">$5/mo</span>
          <span class="text-sm font-bold text-[#888] uppercase tracking-wider">flat, not per seat</span>
        </div>
      </div>
    </div>
  </section>

  <section class="px-6 py-24 md:py-32 border-b-2 border-[#1a1a1a] bg-[#e8e8e0]">
    <div class="max-w-7xl mx-auto">
      <h2 class="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-4 text-center">THE PAIN IS REAL.</h2>
      <p class="text-lg text-[#888] font-medium text-center mb-16 max-w-2xl mx-auto">Every editor knows these problems. We built lawn to fix them.</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        {#each painPoints as point}
          <div class="bg-[#f0f0e8] border-2 border-[#1a1a1a] shadow-[8px_8px_0px_0px_var(--shadow-color)] hover:-translate-y-1 hover:translate-x-1 hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] transition-all">
            <div class="border-b-2 border-[#1a1a1a] px-6 py-4 flex justify-between items-center">
              <span class="text-sm font-black text-[#888]">/{point.id}</span>
              <span class="text-sm font-bold text-[#2d5a2d] uppercase tracking-wider">SOLVED</span>
            </div>
            <div class="p-6 md:p-8">
              <h3 class="text-xl md:text-2xl font-black uppercase tracking-tight mb-4 leading-tight">{point.title}</h3>
              <p class="text-base font-medium text-[#1a1a1a] leading-relaxed">{point.description}</p>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <section class="px-6 py-24 md:py-32 border-b-2 border-[#1a1a1a] bg-[var(--background)]">
    <div class="max-w-7xl mx-auto">
      <h2 class="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-4 text-center">HOW IT WORKS.</h2>
      <p class="text-lg text-[#888] font-medium text-center mb-16 max-w-2xl mx-auto">
        Three steps. No onboarding calls, no training videos, no "schedule a demo" buttons.
      </p>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
        {#each steps as item}
          <div class="bg-[#f0f0e8] border-2 border-[#1a1a1a] shadow-[12px_12px_0px_0px_var(--shadow-color)] flex flex-col hover:-translate-y-2 hover:translate-x-2 hover:shadow-[4px_4px_0px_0px_var(--shadow-color)] transition-all">
            <div class="border-b-2 border-[#1a1a1a] bg-[#1a1a1a] text-[#f0f0e8] p-6 flex justify-between items-end">
              <span class="text-7xl font-black leading-none">{item.step}</span>
              <span class="text-xl font-bold tracking-widest text-[#888] mb-1">STEP</span>
            </div>
            <div class="p-8 flex-grow flex flex-col">
              <h3 class="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-4 text-[#2d5a2d]">{item.action}</h3>
              <p class="text-base font-medium text-[#1a1a1a] leading-relaxed">{item.description}</p>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <section class="px-6 py-24 md:py-32 border-b-2 border-[#1a1a1a] bg-[#2d5a2d] text-[#f0f0e8]">
    <div class="max-w-5xl mx-auto text-center">
      <h2 class="text-6xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter leading-[0.85] mb-8">
        $5/MONTH.<br />
        <span class="text-[#7cb87c]">NOT PER USER.</span><br />
        TOTAL.
      </h2>
      <p class="text-xl md:text-2xl font-medium max-w-2xl mx-auto mb-4 text-[#f0f0e8]/80">
        Unlimited seats. Unlimited projects. Unlimited reviewers. Your entire team, your clients, your client's clients — everyone gets access for one flat price.
      </p>
      <p class="text-lg font-bold text-[#7cb87c]">Stop paying per-seat tax on collaboration.</p>
    </div>
  </section>

  <section class="px-6 py-32 bg-[var(--background)]">
    <div class="max-w-4xl mx-auto text-center flex flex-col items-center">
      <h2 class="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.85] mb-6">START EDITING FASTER.</h2>
      <p class="text-xl text-[#888] font-medium mb-12 max-w-xl">
        Free trial, no credit card. Set up your first review in under a minute.
      </p>
      <a href="/sign-up" class="bg-[#1a1a1a] text-[#f0f0e8] px-12 py-6 border-2 border-[#1a1a1a] text-2xl font-black uppercase tracking-wider hover:bg-[#2d5a2d] hover:border-[#2d5a2d] transition-colors shadow-[12px_12px_0px_0px_var(--shadow-accent)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[8px_8px_0px_0px_var(--shadow-accent)]">
        START FREE TRIAL
      </a>
    </div>
  </section>
</MarketingLayout>
