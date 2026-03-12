<script lang="ts">
  import MarketingLayout from "$lib/components/MarketingLayout.svelte";

  const WIPSTER_PRICE_PER_USER = 15;
  const LAWN_PRICE_FLAT = 5;

  const comparisonRows = [
    { feature: "Pricing", wipster: "Per-user/month", lawn: "$5/month. Total.", note: "Your accountant will love you." },
    { feature: "Open source", wipster: "No", lawn: "Yes", note: "You can literally read our code." },
    { feature: "Speed", wipster: "Solid, no complaints", lawn: "Instant Mux playback", note: "We're unreasonably competitive about this." },
    { feature: "Sharing", wipster: "Invite to workspace", lawn: "Just a link", note: "Your clients don't want another login." },
    { feature: "Simplicity", wipster: "Full-featured platform", lawn: "Fewer features (on purpose)", note: "We call this a feature, not a bug." },
    { feature: "Approvals", wipster: "Built-in workflows", lawn: "Comments + thumbs up", note: "If that's not enough, we respect that." },
  ];

  const teamSizes = [3, 5, 10, 25];
  const savingsCommentary: Record<number, string> = {
    3: "A very nice dinner for the team.",
    5: "That's a new camera lens.",
    10: "A weekend at a cabin to celebrate shipping.",
    25: "Genuinely, that's a lot of money.",
  };

  function annualSavings(teamSize: number) {
    return (WIPSTER_PRICE_PER_USER * teamSize - LAWN_PRICE_FLAT) * 12;
  }
</script>

<svelte:head>
  <title>lawn vs Wipster — simpler video review, flat pricing</title>
  <meta name="description" content="Compare lawn and Wipster. Flat $5/month vs per-user pricing. Open source, instant playback, unlimited seats. The simpler alternative." />
</svelte:head>

<MarketingLayout>
  <section class="px-6 pt-20 pb-24 md:pt-28 md:pb-32 border-b-2 border-[var(--border)] bg-[var(--background)]">
    <div class="max-w-5xl mx-auto">
      <h1 class="text-[14vw] sm:text-[10vw] md:text-[8vw] font-black leading-[0.85] tracking-tighter uppercase">
        lawn vs<br />Wipster
      </h1>
      <div class="mt-10 md:mt-14 max-w-2xl">
        <p class="text-2xl md:text-3xl font-black uppercase tracking-tight leading-tight">
          Two video review tools<br />
          walk into a bar.<br />
          <span class="text-[var(--foreground-muted)]">One costs less. That's the whole joke.</span>
        </p>
        <p class="mt-6 text-lg text-[var(--foreground-muted)] font-medium max-w-lg">
          Wipster is a solid tool with real approval workflows and a proper feature set. lawn is smaller, cheaper, and open source. We do less for less money, and that's the whole pitch.
        </p>
      </div>
    </div>
  </section>

  <section class="px-6 py-24 md:py-32 border-b-2 border-[var(--border)] bg-[var(--surface-alt)]">
    <div class="max-w-5xl mx-auto">
      <h2 class="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-16 text-center">
        SIDE BY<br />SIDE.
      </h2>
      <div class="border-2 border-[var(--border)] shadow-[8px_8px_0px_0px_var(--shadow-color)] bg-[var(--background)]">
        <div class="grid grid-cols-3 border-b-2 border-[var(--border)] bg-[var(--surface-strong)] text-[var(--foreground-inverse)]">
          <div class="p-4 md:p-6 font-black uppercase tracking-wider text-sm">Feature</div>
          <div class="p-4 md:p-6 font-black uppercase tracking-wider text-sm border-l-2 border-[var(--border)]">Wipster</div>
          <div class="p-4 md:p-6 font-black uppercase tracking-wider text-sm border-l-2 border-[var(--border)] text-[var(--accent-light)]">lawn</div>
        </div>
        {#each comparisonRows as row, i}
          <div class="grid grid-cols-3 {i < comparisonRows.length - 1 ? 'border-b-2 border-[var(--border)]' : ''}">
            <div class="p-4 md:p-6 flex flex-col justify-center">
              <span class="font-black uppercase tracking-tight text-lg">{row.feature}</span>
              <span class="text-xs text-[var(--foreground-muted)] mt-1 hidden md:block">{row.note}</span>
            </div>
            <div class="p-4 md:p-6 border-l-2 border-[var(--border)] flex items-center text-[var(--foreground-muted)] font-medium">{row.wipster}</div>
            <div class="p-4 md:p-6 border-l-2 border-[var(--border)] flex items-center font-bold text-[var(--accent)]">{row.lawn}</div>
          </div>
        {/each}
      </div>
      <p class="text-center text-sm text-[var(--foreground-muted)] mt-6 md:hidden">* Wipster pricing based on their per-user model. Actual pricing may vary by plan.</p>
    </div>
  </section>

  <section class="px-6 py-24 md:py-32 border-b-2 border-[var(--border)] bg-[var(--background)]">
    <div class="max-w-5xl mx-auto">
      <h2 class="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-4 text-center">
        DO THE<br />MATH.
      </h2>
      <p class="text-center text-lg text-[var(--foreground-muted)] font-medium mb-16 max-w-lg mx-auto">
        Wipster charges per user. lawn charges $5 per month total. Not per user. Just $5. The math gets increasingly silly as your team grows.
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {#each teamSizes as size}
          {@const savings = annualSavings(size)}
          {@const wipsterAnnual = WIPSTER_PRICE_PER_USER * size * 12}
          {@const lawnAnnual = LAWN_PRICE_FLAT * 12}
          <div class="border-2 border-[var(--border)] bg-[var(--background)] shadow-[6px_6px_0px_0px_var(--shadow-color)] hover:-translate-y-1 hover:translate-x-1 hover:shadow-[4px_4px_0px_0px_var(--shadow-color)] transition-all flex flex-col">
            <div class="border-b-2 border-[var(--border)] bg-[var(--surface-strong)] text-[var(--foreground-inverse)] p-5">
              <span class="text-4xl font-black">{size}</span>
              <span class="text-sm font-bold uppercase tracking-wider text-[var(--foreground-muted)] ml-2">people</span>
            </div>
            <div class="p-5 flex flex-col flex-grow">
              <div class="flex justify-between items-baseline mb-1">
                <span class="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">Wipster</span>
                <span class="font-black text-[var(--foreground-muted)] line-through">${wipsterAnnual.toLocaleString()}/yr</span>
              </div>
              <div class="flex justify-between items-baseline mb-4">
                <span class="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">lawn</span>
                <span class="font-black text-[var(--accent)]">${lawnAnnual}/yr</span>
              </div>
              <div class="border-t-2 border-[var(--border-subtle)] pt-4 mt-auto">
                <div class="text-3xl font-black text-[var(--accent)]">${savings.toLocaleString()}</div>
                <div class="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">saved per year</div>
                <p class="text-sm text-[var(--foreground-muted)] mt-2 italic">{savingsCommentary[size]}</p>
              </div>
            </div>
          </div>
        {/each}
      </div>
      <div class="mt-16 border-2 border-[var(--accent)] bg-[var(--accent)] text-[var(--foreground-inverse)] p-8 shadow-[8px_8px_0px_0px_var(--shadow-color)]">
        <p class="text-sm font-bold uppercase tracking-widest mb-3 text-[var(--accent-light)]">THE OPEN SOURCE THING</p>
        <p class="text-xl md:text-2xl font-black uppercase tracking-tight leading-tight mb-3">You can literally read our code.</p>
        <p class="text-base font-medium opacity-90 max-w-2xl">
          lawn is fully open source. Every line. The elegant parts and the parts where we left a TODO from three months ago. No black box. No trust required. Just code you can read, fork, and judge silently.
        </p>
        <a href="https://github.com/pingdotgg/lawn" target="_blank" rel="noopener noreferrer" class="inline-block mt-4 text-sm font-black uppercase tracking-wider underline underline-offset-4 hover:text-[var(--accent-light)] transition-colors">
          View on GitHub
        </a>
      </div>
    </div>
  </section>

  <section class="px-6 py-24 md:py-32 border-b-2 border-[var(--border)] bg-[var(--surface-alt)]">
    <div class="max-w-5xl mx-auto">
      <h2 class="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-4 text-center">
        HONEST<br />ADVICE.
      </h2>
      <p class="text-center text-lg text-[var(--foreground-muted)] font-medium mb-16 max-w-lg mx-auto">
        Wipster is genuinely good software built by people who care about video review. We just think there's room for something simpler. Here are the facts.
      </p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div class="border-2 border-[var(--border)] bg-[var(--background)] shadow-[8px_8px_0px_0px_var(--shadow-color)]">
          <div class="border-b-2 border-[var(--border)] p-6">
            <h3 class="text-2xl md:text-3xl font-black uppercase tracking-tighter">Use Wipster if...</h3>
          </div>
          <div class="p-6">
            <ul class="space-y-5">
              <li class="flex items-start gap-3"><span class="text-[var(--foreground-muted)] font-black text-lg shrink-0 mt-0.5">--</span><span class="font-medium">You need built-in approval workflows with multiple review stages, status tracking, and the whole production pipeline</span></li>
              <li class="flex items-start gap-3"><span class="text-[var(--foreground-muted)] font-black text-lg shrink-0 mt-0.5">--</span><span class="font-medium">You're an established media team that's already invested in a full review ecosystem and switching costs are real</span></li>
              <li class="flex items-start gap-3"><span class="text-[var(--foreground-muted)] font-black text-lg shrink-0 mt-0.5">--</span><span class="font-medium">You want deep review stages with version comparisons, granular permissions, and structured feedback rounds</span></li>
              <li class="flex items-start gap-3"><span class="text-[var(--foreground-muted)] font-black text-lg shrink-0 mt-0.5">--</span><span class="font-medium">Per-user pricing is fine because your budget is already approved and nobody's counting</span></li>
            </ul>
            <p class="text-sm text-[var(--foreground-muted)] mt-6 pt-4 border-t-2 border-[var(--border-subtle)]">Seriously, Wipster is good. If this is you, go use it. We'll be here if you change your mind later.</p>
          </div>
        </div>
        <div class="border-2 border-[var(--border)] bg-[var(--surface-strong)] text-[var(--foreground-inverse)] shadow-[8px_8px_0px_0px_var(--shadow-accent)]">
          <div class="border-b-2 border-[var(--border)] p-6">
            <h3 class="text-2xl md:text-3xl font-black uppercase tracking-tighter text-[var(--accent-light)]">Use lawn if...</h3>
          </div>
          <div class="p-6">
            <ul class="space-y-5">
              <li class="flex items-start gap-3"><span class="text-[var(--accent-light)] font-black text-lg shrink-0 mt-0.5">--</span><span class="font-medium">You're a small team or agency that just needs to share cuts and collect feedback without a 45-minute onboarding</span></li>
              <li class="flex items-start gap-3"><span class="text-[var(--accent-light)] font-black text-lg shrink-0 mt-0.5">--</span><span class="font-medium">You hate per-seat pricing with a passion that concerns your friends and family</span></li>
              <li class="flex items-start gap-3"><span class="text-[var(--accent-light)] font-black text-lg shrink-0 mt-0.5">--</span><span class="font-medium">You want clients to review with just a link, no account creation, no "please check your email" nonsense</span></li>
              <li class="flex items-start gap-3"><span class="text-[var(--accent-light)] font-black text-lg shrink-0 mt-0.5">--</span><span class="font-medium">You value open source and want to know exactly what software you're trusting with your work</span></li>
            </ul>
            <p class="text-sm text-[var(--foreground-muted)] mt-6 pt-4 border-t border-[#333]">We do less than Wipster. Proudly. Upload, share, comment. Go home. That's 90% of what anyone actually needs.</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="px-6 py-32 bg-[var(--background)]">
    <div class="max-w-4xl mx-auto text-center flex flex-col items-center">
      <h2 class="text-7xl md:text-9xl font-black uppercase tracking-tighter leading-[0.8] mb-4">START<br />NOW.</h2>
      <p class="text-xl md:text-2xl text-[var(--foreground-muted)] font-medium mb-12 max-w-md">
        $5/month. Unlimited seats. Open source. No per-user nonsense.
      </p>
      <a href="/sign-up" class="bg-[var(--surface-strong)] text-[var(--foreground-inverse)] px-12 py-6 border-2 border-[var(--border)] text-2xl font-black uppercase tracking-wider hover:bg-[var(--accent)] hover:border-[var(--accent)] transition-colors shadow-[12px_12px_0px_0px_var(--shadow-accent)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[8px_8px_0px_0px_var(--shadow-accent)]">
        START FREE TRIAL
      </a>
      <p class="text-sm text-[var(--foreground-muted)] mt-6">
        No credit card required. No per-seat gotchas.<br />Just video review that doesn't require a spreadsheet to budget.
      </p>
    </div>
  </section>
</MarketingLayout>
