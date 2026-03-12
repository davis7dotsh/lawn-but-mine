<script lang="ts">
  import MarketingLayout from "@/lib/components/MarketingLayout.svelte";
  import { seoHead } from "@/lib/seo";

  const WIPSTER_PRICE_PER_USER = 15;
  const LAWN_PRICE_FLAT = 5;

  const head = seoHead({
    title: "lawn vs Wipster",
    description:
      "A comparison of lawn and Wipster across pricing, workflow complexity, open source access, and the kind of teams each tool fits best.",
    path: "/compare/wipster",
  });

  const title = head.meta.find((tag) => "title" in tag)?.title ?? "lawn vs Wipster | lawn";
  const metaTags = head.meta.filter((tag) => !("title" in tag));

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
  <title>{title}</title>
  {#each metaTags as tag}
    <meta {...tag} />
  {/each}
  {#each head.links as link}
    <link {...link} />
  {/each}
</svelte:head>

<MarketingLayout>
  <section class="border-b-2 border-[var(--border)] bg-[var(--background)] px-6 pb-24 pt-20 md:pb-32 md:pt-28">
    <div class="mx-auto max-w-5xl">
      <h1 class="text-[14vw] font-black uppercase leading-[0.85] tracking-tighter sm:text-[10vw] md:text-[8vw]">
        lawn vs
        <br />
        Wipster
      </h1>
      <div class="mt-10 max-w-2xl md:mt-14">
        <p class="text-2xl font-black uppercase leading-tight tracking-tight md:text-3xl">
          Two video review tools
          <br />
          walk into a bar.
          <br />
          <span class="text-[var(--foreground-muted)]">One costs less. That's the whole joke.</span>
        </p>
        <p class="mt-6 max-w-lg text-lg font-medium text-[var(--foreground-muted)]">
          Wipster is a solid tool with real approval workflows and a proper feature set. lawn is smaller, cheaper, and open source. We do less for less money, and that's the whole pitch.
        </p>
      </div>
    </div>
  </section>

  <section class="border-b-2 border-[var(--border)] bg-[var(--surface-alt)] px-6 py-24 md:py-32">
    <div class="mx-auto max-w-5xl">
      <h2 class="mb-16 text-center text-5xl font-black uppercase leading-none tracking-tighter md:text-7xl">
        SIDE BY
        <br />
        SIDE.
      </h2>

      <div class="border-2 border-[var(--border)] bg-[var(--background)] shadow-[8px_8px_0px_0px_var(--shadow-color)]">
        <div class="grid grid-cols-3 border-b-2 border-[var(--border)] bg-[var(--surface-strong)] text-[var(--foreground-inverse)]">
          <div class="p-4 text-sm font-black uppercase tracking-wider md:p-6">Feature</div>
          <div class="border-l-2 border-[var(--border)] p-4 text-sm font-black uppercase tracking-wider md:p-6">
            Wipster
          </div>
          <div class="border-l-2 border-[var(--border)] p-4 text-sm font-black uppercase tracking-wider text-[var(--accent-light)] md:p-6">
            lawn
          </div>
        </div>

        {#each comparisonRows as row, index}
          <div class={`grid grid-cols-3 ${index < comparisonRows.length - 1 ? "border-b-2 border-[var(--border)]" : ""}`}>
            <div class="flex flex-col justify-center p-4 md:p-6">
              <span class="text-lg font-black uppercase tracking-tight">{row.feature}</span>
              <span class="mt-1 hidden text-xs text-[var(--foreground-muted)] md:block">{row.note}</span>
            </div>
            <div class="flex items-center border-l-2 border-[var(--border)] p-4 font-medium text-[var(--foreground-muted)] md:p-6">
              {row.wipster}
            </div>
            <div class="flex items-center border-l-2 border-[var(--border)] p-4 font-bold text-[var(--accent)] md:p-6">
              {row.lawn}
            </div>
          </div>
        {/each}
      </div>

      <p class="mt-6 text-center text-sm text-[var(--foreground-muted)] md:hidden">
        * Wipster pricing based on their per-user model. Actual pricing may vary by plan.
      </p>
    </div>
  </section>

  <section class="border-b-2 border-[var(--border)] bg-[var(--background)] px-6 py-24 md:py-32">
    <div class="mx-auto max-w-5xl">
      <h2 class="mb-4 text-center text-5xl font-black uppercase leading-none tracking-tighter md:text-7xl">
        DO THE
        <br />
        MATH.
      </h2>
      <p class="mx-auto mb-16 max-w-lg text-center text-lg font-medium text-[var(--foreground-muted)]">
        Wipster charges per user. lawn charges $5 per month total. Not per user. Just $5. The math gets increasingly silly as your team grows.
      </p>

      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {#each teamSizes as size}
          <div class="flex flex-col border-2 border-[var(--border)] bg-[var(--background)] shadow-[6px_6px_0px_0px_var(--shadow-color)] transition-all hover:translate-x-1 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_var(--shadow-color)]">
            <div class="border-b-2 border-[var(--border)] bg-[var(--surface-strong)] p-5 text-[var(--foreground-inverse)]">
              <span class="text-4xl font-black">{size}</span>
              <span class="ml-2 text-sm font-bold uppercase tracking-wider text-[var(--foreground-muted)]">people</span>
            </div>
            <div class="flex flex-grow flex-col p-5">
              <div class="mb-1 flex justify-between">
                <span class="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">Wipster</span>
                <span class="font-black text-[var(--foreground-muted)] line-through">
                  ${((WIPSTER_PRICE_PER_USER * size) * 12).toLocaleString()}/yr
                </span>
              </div>
              <div class="mb-4 flex justify-between">
                <span class="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">lawn</span>
                <span class="font-black text-[var(--accent)]">${LAWN_PRICE_FLAT * 12}/yr</span>
              </div>
              <div class="mt-auto border-t-2 border-[var(--border-subtle)] pt-4">
                <div class="text-3xl font-black text-[var(--accent)]">${annualSavings(size).toLocaleString()}</div>
                <div class="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">saved per year</div>
                <p class="mt-2 text-sm italic text-[var(--foreground-muted)]">{savingsCommentary[size]}</p>
              </div>
            </div>
          </div>
        {/each}
      </div>

      <div class="mt-16 border-2 border-[var(--accent)] bg-[var(--accent)] p-8 text-[var(--foreground-inverse)] shadow-[8px_8px_0px_0px_var(--shadow-color)]">
        <p class="mb-3 text-sm font-bold uppercase tracking-widest text-[var(--accent-light)]">THE OPEN SOURCE THING</p>
        <p class="mb-3 text-xl font-black uppercase leading-tight tracking-tight md:text-2xl">
          You can literally read our code.
        </p>
        <p class="max-w-2xl text-base font-medium opacity-90">
          lawn is fully open source. Every line. The elegant parts and the parts where we left a TODO from three months ago. No black box. No trust required. Just code you can read, fork, and judge silently.
        </p>
        <a
          href="https://github.com/pingdotgg/lawn"
          target="_blank"
          rel="noopener noreferrer"
          class="mt-4 inline-block text-sm font-black uppercase tracking-wider underline underline-offset-4 transition-colors hover:text-[var(--accent-light)]"
        >
          View on GitHub
        </a>
      </div>
    </div>
  </section>

  <section class="border-b-2 border-[var(--border)] bg-[var(--surface-alt)] px-6 py-24 md:py-32">
    <div class="mx-auto max-w-5xl">
      <h2 class="mb-4 text-center text-5xl font-black uppercase leading-none tracking-tighter md:text-7xl">
        HONEST
        <br />
        ADVICE.
      </h2>
      <p class="mx-auto mb-16 max-w-lg text-center text-lg font-medium text-[var(--foreground-muted)]">
        Wipster is genuinely good software built by people who care about video review. We just think there's room for something simpler. Here are the facts.
      </p>

      <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div class="border-2 border-[var(--border)] bg-[var(--background)] shadow-[8px_8px_0px_0px_var(--shadow-color)]">
          <div class="border-b-2 border-[var(--border)] p-6">
            <h3 class="text-2xl font-black uppercase tracking-tighter md:text-3xl">Use Wipster if...</h3>
          </div>
          <div class="p-6">
            <ul class="space-y-5">
              <li class="flex items-start gap-3">
                <span class="mt-0.5 shrink-0 text-lg font-black text-[var(--foreground-muted)]">--</span>
                <span class="font-medium">You need built-in approval workflows with multiple review stages, status tracking, and the whole production pipeline</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="mt-0.5 shrink-0 text-lg font-black text-[var(--foreground-muted)]">--</span>
                <span class="font-medium">You're an established media team that's already invested in a full review ecosystem and switching costs are real</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="mt-0.5 shrink-0 text-lg font-black text-[var(--foreground-muted)]">--</span>
                <span class="font-medium">You want deep review stages with version comparisons, granular permissions, and structured feedback rounds</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="mt-0.5 shrink-0 text-lg font-black text-[var(--foreground-muted)]">--</span>
                <span class="font-medium">Per-user pricing is fine because your budget is already approved and nobody's counting</span>
              </li>
            </ul>
            <p class="mt-6 border-t-2 border-[var(--border-subtle)] pt-4 text-sm text-[var(--foreground-muted)]">
              Seriously, Wipster is good. If this is you, go use it. We'll be here if you change your mind later.
            </p>
          </div>
        </div>

        <div class="border-2 border-[var(--border)] bg-[var(--surface-strong)] text-[var(--foreground-inverse)] shadow-[8px_8px_0px_0px_var(--shadow-accent)]">
          <div class="border-b-2 border-[var(--border)] p-6">
            <h3 class="text-2xl font-black uppercase tracking-tighter text-[var(--accent-light)] md:text-3xl">Use lawn if...</h3>
          </div>
          <div class="p-6">
            <ul class="space-y-5">
              <li class="flex items-start gap-3">
                <span class="mt-0.5 shrink-0 text-lg font-black text-[var(--accent-light)]">--</span>
                <span class="font-medium">You're a small team or agency that just needs to share cuts and collect feedback without a 45-minute onboarding</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="mt-0.5 shrink-0 text-lg font-black text-[var(--accent-light)]">--</span>
                <span class="font-medium">You hate per-seat pricing with a passion that concerns your friends and family</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="mt-0.5 shrink-0 text-lg font-black text-[var(--accent-light)]">--</span>
                <span class="font-medium">You want clients to review with just a link, no account creation, no "please check your email" nonsense</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="mt-0.5 shrink-0 text-lg font-black text-[var(--accent-light)]">--</span>
                <span class="font-medium">You value open source and want to know exactly what software you're trusting with your work</span>
              </li>
            </ul>
            <p class="mt-6 border-t border-[#333] pt-4 text-sm text-[var(--foreground-muted)]">
              We do less than Wipster. Proudly. Upload, share, comment. Go home. That's 90% of what anyone actually needs.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="bg-[var(--background)] px-6 py-32">
    <div class="mx-auto flex max-w-4xl flex-col items-center text-center">
      <h2 class="mb-4 text-7xl font-black uppercase leading-[0.8] tracking-tighter md:text-9xl">
        START
        <br />
        NOW.
      </h2>
      <p class="mb-12 max-w-md text-xl font-medium text-[var(--foreground-muted)] md:text-2xl">
        $5/month. Unlimited seats. Open source. No per-user nonsense.
      </p>
      <a
        href="/sign-up"
        class="border-2 border-[var(--border)] bg-[var(--surface-strong)] px-12 py-6 text-2xl font-black uppercase tracking-wider text-[var(--foreground-inverse)] shadow-[12px_12px_0px_0px_var(--shadow-accent)] transition-colors hover:translate-x-[2px] hover:translate-y-[2px] hover:border-[var(--accent)] hover:bg-[var(--accent)] hover:shadow-[8px_8px_0px_0px_var(--shadow-accent)]"
        data-sveltekit-preload-data="hover"
      >
        START FREE TRIAL
      </a>
      <p class="mt-6 text-sm text-[var(--foreground-muted)]">
        No credit card required. No per-seat gotchas.
        <br />
        Just video review that doesn't require a spreadsheet to budget.
      </p>
    </div>
  </section>
</MarketingLayout>
