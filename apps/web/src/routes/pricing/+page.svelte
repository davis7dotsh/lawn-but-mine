<script lang="ts">
  import MarketingLayout from "@/lib/components/MarketingLayout.svelte";
  import { seoHead } from "@/lib/seo";
  import { formatBytes } from "@/lib/utils";
  import {
    TEAM_PLAN_IDS,
    TEAM_PLAN_LABELS,
    TEAM_PLAN_MONTHLY_PRICE_USD,
    TEAM_PLAN_SEATS,
    TEAM_PLAN_STORAGE_LIMIT_BYTES,
  } from "@lawn/shared/billingPlans";

  const head = seoHead({
    title: "Pricing",
    description: "$5/month total for Basic, $25/month total for Pro. Unlimited seats, flat pricing, no per-user math.",
    path: "/pricing",
  });

  const title = head.meta.find((tag) => "title" in tag)?.title ?? "Pricing | lawn";
  const metaTags = head.meta.filter((tag) => !("title" in tag));

  const pricingPlans = TEAM_PLAN_IDS.map((planId) => ({
    id: planId,
    label: TEAM_PLAN_LABELS[planId],
    price: TEAM_PLAN_MONTHLY_PRICE_USD[planId],
    storage: formatBytes(TEAM_PLAN_STORAGE_LIMIT_BYTES[planId]),
    accent: planId === "pro",
  }));

  const faqs = [
    {
      q: "What counts as a seat?",
      a: `Anyone on your team. Invite everyone — editors, producers, clients. No extra charge. ${TEAM_PLAN_SEATS} seats means exactly that.`,
    },
    {
      q: "Can clients review without an account?",
      a: "Yes. Send a share link. They click, watch, and comment. No sign-up required.",
    },
    {
      q: "What happens if I hit the storage limit?",
      a: "Upgrade to Pro for more space, or delete old projects to free up room.",
    },
    {
      q: "Is there a free trial?",
      a: "Yes. Sign up and try it. No credit card required to start.",
    },
    {
      q: "Is lawn really open source?",
      a: "Fully. Check our GitHub. Read the code, fork it, whatever you want.",
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
  <section class="border-b-2 border-[#1a1a1a] bg-[#f0f0e8] px-6 pb-16 pt-24 md:pb-24 md:pt-32">
    <div class="mx-auto max-w-5xl">
      <h1 class="text-7xl font-black uppercase leading-[0.85] tracking-tighter md:text-9xl">PRICING.</h1>
      <p class="mt-8 max-w-2xl text-2xl font-bold md:text-3xl">
        $5/month. Not per user. Not per project. <span class="text-[#888]">Total.</span>
      </p>
    </div>
  </section>

  <section class="border-b-2 border-[#1a1a1a] bg-[#e8e8e0] px-6 py-24 md:py-32">
    <div class="mx-auto max-w-5xl">
      <div class="flex flex-col items-center justify-center gap-8 md:flex-row">
        {#each pricingPlans as plan}
          <div
            class={`flex w-full max-w-md flex-col border-2 border-[#1a1a1a] p-8 shadow-[8px_8px_0px_0px_#1a1a1a] transition-all ${plan.accent ? "bg-[#1a1a1a] text-[#f0f0e8] md:-translate-y-4 hover:translate-x-2 hover:-translate-y-6 hover:shadow-[4px_4px_0px_0px_#1a1a1a]" : "bg-[#f0f0e8] hover:translate-x-2 hover:-translate-y-2 hover:shadow-[4px_4px_0px_0px_#1a1a1a]"}`}
          >
            {#if plan.accent}
              <div class="mb-2 flex items-start justify-between">
                <div class="text-xl font-bold uppercase tracking-widest text-[#7cb87c]">{plan.label}</div>
                <div class="-rotate-3 bg-[#2d5a2d] px-2 py-1 text-xs font-black uppercase tracking-wider">
                  Big files
                </div>
              </div>
            {:else}
              <div class="mb-2 text-xl font-bold uppercase tracking-widest text-[#888]">{plan.label}</div>
            {/if}

            <div class="mb-4 text-6xl font-black tracking-tighter">
              ${plan.price}<span class="text-2xl text-[#888]">/mo</span>
            </div>

            <p class={`mb-8 text-lg font-medium ${plan.accent ? "" : "text-[#1a1a1a]"}`}>
              {plan.accent ? "Literally the exact same thing but more space." : "Unlimited everything, except storage."}
            </p>

            <ul class="mb-8 flex-grow space-y-4 text-lg font-bold">
              <li class="flex items-center gap-3">
                <span class={`text-2xl ${plan.accent ? "text-[#7cb87c]" : "text-[#2d5a2d]"}`}>✓</span>
                Unlimited seats
              </li>
              <li class="flex items-center gap-3">
                <span class={`text-2xl ${plan.accent ? "text-[#7cb87c]" : "text-[#2d5a2d]"}`}>✓</span>
                Unlimited projects
              </li>
              <li class="flex items-center gap-3">
                <span class={`text-2xl ${plan.accent ? "text-[#7cb87c]" : "text-[#2d5a2d]"}`}>✓</span>
                Unlimited clients
              </li>
              <li class="flex items-center gap-3">
                <span class={`text-2xl ${plan.accent ? "text-[#7cb87c]" : "text-[#2d5a2d]"}`}>✓</span>
                {plan.storage} Storage
              </li>
            </ul>

            <a
              href="/sign-up"
              class={`border-2 py-4 text-center font-black uppercase transition-colors ${plan.accent ? "border-[#f0f0e8] bg-[#f0f0e8] text-[#1a1a1a] hover:bg-[#d8d8d0]" : "border-[#1a1a1a] bg-[#1a1a1a] text-[#f0f0e8] hover:bg-[#2d5a2d]"}`}
              data-sveltekit-preload-data="hover"
            >
              {plan.accent ? "Get Pro" : "Get Basic"}
            </a>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <section class="border-b-2 border-[#1a1a1a] bg-[#f0f0e8] px-6 py-24 md:py-32">
    <div class="mx-auto max-w-4xl">
      <h2 class="mb-16 text-5xl font-black uppercase leading-none tracking-tighter md:text-7xl">FAQ.</h2>

      <div class="divide-y-2 divide-[#1a1a1a] border-y-2 border-[#1a1a1a]">
        {#each faqs as item}
          <div class="py-8">
            <h3 class="mb-3 text-xl font-black uppercase tracking-tight md:text-2xl">{item.q}</h3>
            <p class="text-lg font-medium text-[#888]">{item.a}</p>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <section class="bg-[#1a1a1a] px-6 py-32 text-[#f0f0e8]">
    <div class="mx-auto flex max-w-4xl flex-col items-center text-center">
      <h2 class="mb-4 text-5xl font-black uppercase leading-none tracking-tighter md:text-7xl">Still reading?</h2>
      <p class="mb-12 text-xl font-medium text-[#888]">Just try it. No credit card. No commitment.</p>
      <a
        href="/sign-up"
        class="border-2 border-[#f0f0e8] bg-[#f0f0e8] px-12 py-6 text-2xl font-black uppercase tracking-wider text-[#1a1a1a] shadow-[8px_8px_0px_0px_rgba(45,90,45,1)] transition-colors hover:translate-x-[2px] hover:translate-y-[2px] hover:border-[#2d5a2d] hover:bg-[#2d5a2d] hover:text-[#f0f0e8] hover:shadow-[4px_4px_0px_0px_rgba(45,90,45,1)]"
        data-sveltekit-preload-data="hover"
      >
        START FREE TRIAL
      </a>
    </div>
  </section>
</MarketingLayout>
