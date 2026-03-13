<script lang="ts">
  import MarketingLayout from "@/lib/components/MarketingLayout.svelte";
  import { seoHead } from "@/lib/seo";

  const FRAMEIO_PRICE_PER_USER = 19;
  const LAWN_PRICE_FLAT = 5;

  const head = seoHead({
    title: "lawn vs Frame.io",
    description:
      "A blunt comparison of lawn and Frame.io on pricing, speed, open source access, and who each product is actually for.",
    path: "/compare/frameio",
  });

  const title = head.meta.find((tag) => "title" in tag)?.title ?? "lawn vs Frame.io | lawn";
  const metaTags = head.meta.filter((tag) => !("title" in tag));

  const comparisonRows = [
    { feature: "Price", frameio: "$19/user/month", lawn: "$5/month. Total.", note: "Math is hard, but not that hard." },
    { feature: "Seats", frameio: "Limited by plan tier", lawn: "Unlimited", note: "Your intern deserves access too." },
    { feature: "Speed", frameio: "It's... fine", lawn: "Actually fast", note: "We obsess over this so you don't wait." },
    { feature: "Open source", frameio: "No", lawn: "Yes", note: "Read our code. Judge us." },
    { feature: "Sharing", frameio: "Account required", lawn: "Just a link", note: "Your clients don't want another login." },
    { feature: "Setup", frameio: "Call sales for enterprise", lawn: "Sign up and upload", note: "Under 60 seconds or your money back." },
  ];

  const teamSizes = [3, 5, 10, 20];
  const savingsCommentary: Record<number, string> = {
    3: "That's a lot of burritos.",
    5: "A nice weekend trip for the team.",
    10: "A used car. A really used car.",
    20: "You could hire another freelancer with that.",
  };

  function annualSavings(teamSize: number) {
    return (FRAMEIO_PRICE_PER_USER * teamSize - LAWN_PRICE_FLAT) * 12;
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
        Frame.io
      </h1>
      <div class="mt-10 max-w-2xl md:mt-14">
        <p class="text-2xl font-black uppercase leading-tight tracking-tight md:text-3xl">
          We're not better.
          <br />
          We're cheaper and faster.
          <br />
          <span class="text-[var(--foreground-muted)]">That might be better.</span>
        </p>
        <p class="mt-6 max-w-lg text-lg font-medium text-[var(--foreground-muted)]">
          Frame.io is a great product built for enterprise teams with enterprise budgets. lawn is a scrappy little tool that does the important stuff for $5/month flat. No per-seat math. No PhD in procurement required.
        </p>
      </div>
    </div>
  </section>

  <section class="border-b-2 border-[var(--border)] bg-[var(--surface-alt)] px-6 py-24 md:py-32">
    <div class="mx-auto max-w-5xl">
      <h2 class="mb-16 text-center text-5xl font-black uppercase leading-none tracking-tighter md:text-7xl">
        FEATURE
        <br />
        FIGHT.
      </h2>

      <div class="border-2 border-[var(--border)] bg-[var(--background)] shadow-[8px_8px_0px_0px_var(--shadow-color)]">
        <div class="grid grid-cols-3 border-b-2 border-[var(--border)] bg-[var(--surface-strong)] text-[var(--foreground-inverse)]">
          <div class="p-4 text-sm font-black uppercase tracking-wider md:p-6">Feature</div>
          <div class="border-l-2 border-[var(--border)] p-4 text-sm font-black uppercase tracking-wider md:p-6">
            Frame.io
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
              {row.frameio}
            </div>
            <div class="flex items-center border-l-2 border-[var(--border)] p-4 font-bold text-[var(--accent)] md:p-6">
              {row.lawn}
            </div>
          </div>
        {/each}
      </div>

      <p class="mt-6 text-center text-sm text-[var(--foreground-muted)] md:hidden">
        * Frame.io pricing based on their Team plan at $19/user/month.
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
        Frame.io charges $19 per user per month. lawn charges $5 per month. Not per user. Just $5. Here's what that means annually.
      </p>

      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {#each teamSizes as size}
          <div class="flex flex-col border-2 border-[var(--border)] bg-[var(--background)] shadow-[6px_6px_0px_0px_var(--shadow-color)] transition-all hover:translate-x-1 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_var(--shadow-color)]">
            <div class="border-b-2 border-[var(--border)] bg-[var(--surface-strong)] p-5 text-[var(--foreground-inverse)]">
              <span class="text-4xl font-black">{size}</span>
              <span class="ml-2 text-sm font-bold uppercase tracking-wider text-[var(--foreground-muted)]">
                {size === 1 ? "person" : "people"}
              </span>
            </div>
            <div class="flex flex-grow flex-col p-5">
              <div class="mb-1 flex justify-between">
                <span class="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">Frame.io</span>
                <span class="font-black text-[var(--foreground-muted)] line-through">
                  ${((FRAMEIO_PRICE_PER_USER * size) * 12).toLocaleString()}/yr
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
        We could trash-talk Frame.io but that would be dishonest and also they have way more employees than us. Here's the real deal.
      </p>

      <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div class="border-2 border-[var(--border)] bg-[var(--background)] shadow-[8px_8px_0px_0px_var(--shadow-color)]">
          <div class="border-b-2 border-[var(--border)] p-6">
            <h3 class="text-2xl font-black uppercase tracking-tighter md:text-3xl">Use Frame.io if...</h3>
          </div>
          <div class="p-6">
            <ul class="space-y-5">
              <li class="flex items-start gap-3">
                <span class="mt-0.5 shrink-0 text-lg font-black text-[var(--foreground-muted)]">--</span>
                <span class="font-medium">You need enterprise compliance docs (SOC 2, etc.) for your procurement team to approve anything</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="mt-0.5 shrink-0 text-lg font-black text-[var(--foreground-muted)]">--</span>
                <span class="font-medium">You're deeply embedded in Adobe Premiere and After Effects and need native panel integration</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="mt-0.5 shrink-0 text-lg font-black text-[var(--foreground-muted)]">--</span>
                <span class="font-medium">You have 100+ people with complex multi-stage approval workflows and version trees</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="mt-0.5 shrink-0 text-lg font-black text-[var(--foreground-muted)]">--</span>
                <span class="font-medium">Budget isn't a concern and you want every feature imaginable, even the ones you'll never use</span>
              </li>
            </ul>
            <p class="mt-6 border-t-2 border-[var(--border-subtle)] pt-4 text-sm text-[var(--foreground-muted)]">
              Genuinely, Frame.io is solid software. If this is you, go use it. We won't be offended. (Okay maybe a little.)
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
                <span class="font-medium">You're a small-to-mid team that just needs to share cuts and collect feedback without a NASA control panel</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="mt-0.5 shrink-0 text-lg font-black text-[var(--accent-light)]">--</span>
                <span class="font-medium">You're an agency tired of doing per-seat multiplication every time you onboard a client</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="mt-0.5 shrink-0 text-lg font-black text-[var(--accent-light)]">--</span>
                <span class="font-medium">You're a freelancer who just needs to show a cut to a client without making them create yet another account</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="mt-0.5 shrink-0 text-lg font-black text-[var(--accent-light)]">--</span>
                <span class="font-medium">You value speed and simplicity over a feature checklist that makes the marketing site look impressive</span>
              </li>
            </ul>
            <p class="mt-6 border-t border-[#333] pt-4 text-sm text-[var(--foreground-muted)]">
              We do less than Frame.io. Proudly. Turns out "upload, share, comment" is 90% of what anyone actually needs.
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
        $5/month. Unlimited seats. No sales call required. No credit card to start.
      </p>
      <a
        href="/sign-up"
        class="border-2 border-[var(--border)] bg-[var(--surface-strong)] px-12 py-6 text-2xl font-black uppercase tracking-wider text-[var(--foreground-inverse)] shadow-[12px_12px_0px_0px_var(--shadow-accent)] transition-colors hover:translate-x-[2px] hover:translate-y-[2px] hover:border-[var(--accent)] hover:bg-[var(--accent)] hover:shadow-[8px_8px_0px_0px_var(--shadow-accent)]"
        data-sveltekit-preload-data="hover"
      >
        TRY LAWN FREE
      </a>
      <p class="mt-6 text-sm text-[var(--foreground-muted)]">
        Or keep paying $19/user/month. We don't judge.
        <br />
        (We judge a little.)
      </p>
    </div>
  </section>
</MarketingLayout>
