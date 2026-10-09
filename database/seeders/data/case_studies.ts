export interface CaseStudySeed {
  title: string
  slug: string
  client: string
  status: 'draft' | 'published'
  creator: 'siddhesh' | 'taniya'
  createdAt: string
  keyBusinesses: string[]
  workCategories?: string[]
  services?: string[]
  businessModels?: string[]
  metrics?: { label: string; value: string }[]
  testimonial?: { quote: string; authorName: string; authorTitle: string }
  /** Sections joined into `content_markdown`; omitted sections are skipped. */
  description?: string
  challenge?: string
  solution?: string
  results?: string
}

const ALL_MODELS = ['B2B', 'B2B2C', 'B2C', 'B2E', 'B2G']

export const CASE_STUDIES: CaseStudySeed[] = [
  {
    title: 'SEO',
    slug: 'ecochem-seo',
    client: 'Ecochem',
    status: 'published',
    creator: 'siddhesh',
    createdAt: '2026-06-04T13:35:52Z',
    keyBusinesses: ['Industrial chemicals'],
    workCategories: ['Search Engine Optimization (SEO)'],
    services: ['Digital Services'],
    businessModels: ['B2B', 'B2B2C', 'B2C', 'B2E'],
    metrics: [
      { label: 'Organic Search', value: '41,263' },
      { label: 'Total Impression', value: '1,365,453' },
      { label: 'Total Clicks', value: '8,401' },
      { label: 'Organic Search Share', value: '59.73 %' },
    ],
    testimonial: {
      quote:
        "Elevating Brands with Digital Mastery. Expert, Cost-effective Services. Reliable Support for Ecochem's Growth. Pleasure to Work With, Timely Execution. Beautiful UI, Admirable Performance.",
      authorName: 'Sarvesh Chawalhe',
      authorTitle: 'Founder',
    },
    description: `**Echochem: From Zero to 1.37M Users - A 4-Year Organic SEO Growth Story**

Echochem is a chemical industry player operating in a niche B2B space where buying decisions are research-driven and search intent is highly specific. The website had virtually no digital presence heading into 2021. With no paid advertising infrastructure and a complex product portfolio, organic search was the only scalable channel to build visibility, drive qualified traffic, and establish domain authority over time.

The GA4 data captured across 2021 to 2025 tells a compelling growth story - one built entirely on SEO, content, and referral equity.`,
    challenge: `When the engagement began in 2021, the site was pulling in just 802 active users, 1.2K sessions, and 242 key events for the full year. Traffic was almost entirely dependent on Google organic (713 sessions) and direct (216 sessions), with a handful of referrals from low-quality sources like techspy.com and apsense.com.

The core challenges were:
- Near-zero domain authority with no credible backlink profile
- Traffic activity concentrated in only the last quarter of 2021, meaning the site had practically no consistent organic presence for 9 months of the year
- No topical content strategy driving mid-funnel or bottom-funnel queries
- Zero key events tracked in 2022 and beyond, indicating a conversion tracking gap that made it difficult to attribute business outcomes to SEO effort
- Heavy reliance on a single channel (Google organic) with no channel diversification`,
    solution: `A structured, long-term SEO strategy was executed across four years focusing on three pillars: technical foundation, content depth, and link authority.

**2021-2022: Foundation Building.** The initial phase focused on fixing technical issues, building a crawlable site architecture, and targeting informational and commercial keywords relevant to the chemical sector. The result was explosive - Google organic jumped from 713 sessions to 2.6K sessions, a 261.3% increase. Bing organic also grew 115.4%, validating that the on-page work was platform-agnostic. New referral sources like mydy.dypatil.edu and search.google.com began appearing, signaling early authority signals.

**2022-2023: Content Scale-Up.** With the foundation in place, the strategy shifted toward scaling content volume and diversifying referral traffic. By 2023, Google organic reached 9.4K sessions (+265.9% YoY), direct traffic hit 2K sessions (+389.7%), and new referral sources like Quora (51 sessions, +537.5%), Facebook (46 sessions, +318.2%), and arisefacilitysolutions.com (57 sessions, +533.3%) were sending targeted traffic. This phase confirmed the content was earning genuine third-party citations.

**2023-2024: Consolidation and Maturity.** Growth continued at a measured pace. Google organic reached 13K sessions (+41.2%), direct traffic climbed to 2.9K (+42.3%), and Yahoo Search referrals jumped 111.1%. The traffic trend chart showed consistent daily volume throughout the year with no seasonal cliffs - a sign of a mature, diversified organic presence.

**2024-2025: AI Era Adaptation.** This is where the data gets most interesting. Google organic dipped to 9K sessions (-32.5%) - a pattern seen across many B2B sites as Google's AI Overviews began absorbing informational clicks. However, chatgpt.com referrals exploded to 204 sessions (+1,033.3%) and perplexity.ai sent 107 sessions (+30.5%). This signals Echochem's content was being indexed and cited by large language models - a new form of organic authority. Notably, direct traffic surged to 5.1K (+77.2%), which typically reflects growing brand recognition among returning and referred users.`,
    results: `Here is the year-over-year performance summary:

| Year | Active Users | Sessions | YoY Sessions Growth |
|---|---|---|---|
| 2021 | 802 | 1.2K | Baseline |
| 2022 | 2.5K | 3.3K | +180.8% |
| 2023 | 9.1K | 12K | +280.1% |
| 2024 | 14K | 18K | +42.3% |
| 2025 | 13K | 16K | -10.3% |

**Peak growth (2021 to 2024):** Sessions grew 15x in three years, from 1.2K to 18K, with zero paid media investment.

**The AI pivot in 2025:** While overall sessions declined modestly by 10.3%, the channel mix shifted dramatically. ChatGPT referrals grew over 1,000% and Perplexity referrals appeared as a new channel - meaning Echochem's content is now being surfaced inside AI answer engines, a distribution channel that did not exist two years ago.

**Traffic quality signal:** The growth in direct traffic to 5.1K in 2025 even as organic dipped suggests the brand built genuine recall and loyalty over the four-year period. Users are now navigating directly rather than needing a search prompt.

**What this proves:** A niche B2B chemical brand with no paid budget can build a 13K+ user organic asset in four years through consistent SEO execution - and that asset is now transitioning into the AI search era with its content already being cited by LLMs.`,
  },
  {
    title: 'Web Development',
    slug: 'patel-international-web-development',
    client: 'Patel International Packers and Movers',
    status: 'published',
    creator: 'siddhesh',
    createdAt: '2026-06-10T13:45:58Z',
    keyBusinesses: ['Packers & Movers'],
    workCategories: [
      'UI/UX Design',
      'Search Engine Optimization (SEO)',
      'Website Development',
      'Website Hosting Solutions',
      'Website Management',
      'WordPress Development',
    ],
    services: ['Web Services'],
    businessModels: ALL_MODELS,
    metrics: [
      { label: 'Total Clicks', value: '1,930' },
      { label: 'Total Impressions', value: '2,52,570' },
      { label: 'Average CTR', value: '0.8 %' },
      { label: 'Average Position', value: '15' },
    ],
    description: `Patel came to us as a website that was technically live but organically invisible. The Google Search Console data tells the full story across four periods. The site started in early 2025 with average positions hovering around 18-19, CTR stuck at 0.7%, and impression volumes that were largely driven by unpredictable traffic spikes rather than consistent ranking authority. The underlying problem was structural: the site lacked a coherent on-page SEO architecture, keyword targeting was broad and unfocused, and the content structure did not signal topical authority to Google's crawlers.`,
    challenge: `The data from Feb 2025 to Jun 2025 (73.3K impressions, avg position 18.9) and Jun 2025 to Oct 2025 (63.6K impressions, avg position 19.8) revealed three core problems:

- Impressions were high but hollow. Ranking on page 2 at position 18-19 means users rarely scroll far enough to click, explaining the flat 0.7% CTR.
- Traffic was spike-driven, not earned. The chart from both early periods shows sharp peaks followed by crashes, indicating the site had no sustainable ranking foundation and was riding occasional trending queries.
- Zero compounding growth. Despite sitting on decent impression volumes, clicks stayed flat (416-525 total over 4-month windows), meaning the site was getting seen in search but not chosen.

The additional challenge was aligning the web development work with SEO goals from the ground up, not as an afterthought.`,
    solution: `Work began in two parallel tracks: technical web development fixes followed by a sustained SEO content and authority-building strategy.

*Web Development Phase (Foundational)*
- Full site audit covering crawlability, page speed, Core Web Vitals, and mobile responsiveness
- Rebuilt URL structure with clean, keyword-informed slugs
- Fixed indexing gaps and ensured all priority pages were properly submitted to GSC
- Implemented proper heading hierarchies (H1/H2/H3), schema markup, and internal linking architecture
- Removed thin or duplicate content pages that were diluting crawl budget

*SEO Strategy Phase (Authority Building)*
- Shifted keyword targeting from broad head terms to mid-funnel, intent-specific queries where ranking on page 1 was achievable
- Built out topic clusters to establish subject authority in Patel's core categories
- Consistent content publishing cadence with proper on-page optimization on every piece
- Backlink outreach and citation building to improve domain trust signals

The Oct 2025 to Feb 2026 period reflects the compounding effect of this work starting to kick in.`,
    results: `The GSC data across the four periods tells a clear progression story:

| Period | Impressions | Clicks | Avg CTR | Avg Position |
|---|---|---|---|---|
| Feb - Jun 2025 | 73.3K | 525 | 0.7% | 18.9 |
| Jun - Oct 2025 | 63.6K | 416 | 0.7% | 19.8 |
| Oct 2025 - Feb 2026 | 54.8K | 464 | 0.8% | 9.8 |
| Feb - Jun 2026 | 62K | 534 | 0.9% | 9.8 |

The most significant shift happened between the Jun-Oct 2025 period and the Oct 2025-Feb 2026 period. Average position jumped from 19.8 to 9.8, a move from deep page 2 into page 1 territory. This is the SEO inflection point where the technical fixes and content work began to register with Google's ranking systems.

The Oct 2025 to Feb 2026 chart also shows the character change most clearly: instead of random spikes, the impressions trend shows a consistent upward curve from ~250-300 daily impressions to 600-700+ by February 2026. This is what earned, compounding organic growth looks like versus spike-driven noise.

By the most recent period (Feb-Jun 2026), clicks reached 534, CTR improved to 0.9%, and average position held steady at 9.8. The slight impression dip from the peak suggests the site is now ranking for fewer but more targeted, higher-intent keywords rather than casting a wide net from page 2. The downward click trend visible in the June 2026 portion of the chart may also partially reflect the impact of Google's May 2026 core update, which began rolling out on May 21, 2026, which would explain the late-period dip worth monitoring going forward.

The overall trajectory is a textbook web development + SEO transformation: from a structurally broken site ranking nowhere useful, to a technically healthy property holding consistent page 1 positions and generating real organic traffic.`,
  },
  {
    title: 'Google Ads',
    slug: 'mahindra-rainforest-google-ads',
    client: 'Mahindra Rainforest',
    status: 'draft',
    creator: 'taniya',
    createdAt: '2026-10-06T10:53:59Z',
    keyBusinesses: ['Residential property'],
    workCategories: ['Paid Marketing'],
    services: ['Digital Services'],
    businessModels: ['B2C'],
    metrics: [
      { label: 'Total Impressions', value: '2.15 K' },
      { label: 'Total Clicks Driven', value: '157 Clicks' },
      { label: 'Total Conversions / Leads', value: '7 Leads' },
      { label: 'Total Campaign Budget Spent', value: '41.8 K' },
    ],
    description: `**Mahindra Rainforest** is a premium residential development offering 2 BHK and 3 BHK luxury apartments designed for modern urban living. To boost high-quality buyer inquiries and maximize overall campaign efficiency, we undertook a complete performance optimization of their Google Search Ads campaign.

Our primary objective was to transition the account from broad, unsegmented reach into a precision-targeted lead generation engine. By systematically overhauling keyword match types, restructuring 2 BHK and 3 BHK ad groups, enriching Responsive Search Ads (RSAs), and adding key campaign assets, we eliminated wasted spend and scaled qualified lead flow for the property.`,
    challenge: `- **High Wasted Spend:** The campaign was heavily reliant on broad match keywords, attracting irrelevant search queries and exhausting budget on non-converting clicks.
- **Low Ad Engagement:** Previous ad creatives and ad extensions lacked compelling messaging, resulting in lower Click-Through Rates (CTR) and sub-optimal Quality Scores.
- **Unqualified Traffic:** Keywords were not segmented effectively between 2 BHK and 3 BHK intent, leading to mixed landing traffic.`,
    solution: `1. **Keyword Restructuring & Clean-up**
   - Removed non-performing broad match and exact match keywords across both 2 BHK and 3 BHK ad groups.
   - Added and enabled over 30 targeted **Phrase Match keywords** to strictly target high-intent homebuyers and eliminate irrelevant traffic.
2. **Ad Copy & Asset Optimization**
   - Updated Responsive Search Ads (RSA) for both 2 BHK and 3 BHK ad groups with compelling headlines and property USPs.
   - Created 4 new campaign assets/extensions (sitelinks, callouts) to improve ad visibility, rank, and overall Quality Score.
3. **Controlled Budget Scaling**
   - Incrementally increased daily campaign budgets once the traffic quality was secured through phrase match filtering.
   - Continuous monitoring of search terms to add negative keywords and maintain cost efficiency.`,
    results: `- Successfully transitioned the campaign from broad intent to high-conversion phrase match targeting.
- Significantly improved ad relevance and impression share through upgraded RSAs and campaign assets.
- Scaled daily lead volume efficiently while keeping cost-per-lead (CPL) optimized.`,
  },
  {
    title: 'Website Development',
    slug: 'ecochem-website-development',
    client: 'Ecochem',
    status: 'draft',
    creator: 'siddhesh',
    createdAt: '2026-10-06T14:52:03Z',
    keyBusinesses: ['Industrial chemicals'],
    businessModels: ALL_MODELS,
  },
  {
    title: 'SEO',
    slug: 'patel-international-seo',
    client: 'Patel International Packers and Movers',
    status: 'draft',
    creator: 'siddhesh',
    createdAt: '2026-10-06T14:56:09Z',
    keyBusinesses: ['Packers & Movers'],
    businessModels: ALL_MODELS,
  },
  {
    title: 'Web Development',
    slug: 'arise-facility-web-developmentri',
    client: 'Arise Facility Solutions',
    status: 'draft',
    creator: 'siddhesh',
    createdAt: '2026-10-06T15:02:02Z',
    keyBusinesses: ['Housekeeping or Workforce Management'],
    businessModels: ALL_MODELS,
  },
  {
    title: 'Google Ads',
    slug: 'runawal-google-ads',
    client: 'Runwal Group',
    status: 'published',
    creator: 'siddhesh',
    createdAt: '2026-10-06T15:14:26Z',
    keyBusinesses: ['Residential property'],
    workCategories: ['Paid Marketing'],
    services: ['Digital Services'],
    businessModels: ['B2C'],
    metrics: [
      { label: 'Clicks', value: '5.56 K' },
      { label: 'Conversions', value: '270' },
      { label: 'Cost / conv.', value: '₹1.22 K' },
      { label: 'Total Cost', value: '₹331 K' },
      { label: 'ROI', value: '3 %' },
    ],
    description: `**Runwal Avenue: Scaling High-Intent Real Estate Pipeline in Mumbai: A Paid Search Growth Story**

Runwal Avenue is a flagship residential development situated in Kanjurmarg East within the Runwal City Centre township, positioned in a hyper-competitive Mumbai property market where purchase decisions involve extended consideration cycles and exact buyer intent. While premium high-rise residences offer strong connectivity advantages, digital acquisition in the region faces aggressive bidding wars, fluctuating cost per lead, and ad saturation. With significant capital at stake, paid search had to move beyond generic residential clicks and serve as a reliable, cost-controlled engine for driving qualified property buyers.

The Google Ads data recorded across 2025 to 2026 tells an impactful growth story: one defined by swift troubleshooting, structural consolidation, and sustained acquisition efficiency at scale.`,
    challenge: `- **High Real Estate CPCs & Saturation:** Competing in Mumbai's luxury and residential property market often leads to elevated cost-per-click rates and volatile acquisition costs.
- **Performance Volatility (The April–May Spike):** In mid-spring 2026, campaign efficiency degraded significantly, resulting in a severe CPA inflation where acquisition costs surged to ₹9.18K per conversion with only 4 conversions registered across ₹36.7K in spend.
- **Structure & Strategy Transition:** Multiple fragmented ad sets and pauses (e.g., Performance Max vs. single Search groups) caused inconsistent lead quality and volume fluctuations.`,
    solution: `- **Account Restructuring & Consolidation:** Shifted away from fragmented sub-campaigns and unoptimized PMax setups toward a tightly structured, consolidated search architecture (Runwal Avenue | Search Ad | 9 June with 4 organized ad groups).
- **Keyword Intent & Match Refinement:** Cut wasted ad spend on broad residential searches to focus heavily on high-intent transactional queries and project-specific terms for Runwal Avenue.
- **Aggressive Bidding Optimization:** Re-evaluated automated target CPA/ROAS bid parameters following the April cost spike, stabilizing daily impression share and lowering average acquisition expenses.
- **Landing Page & Ad Relevancy Alignment:** Aligned multi-ad-group copy directly with location-specific queries across Mumbai, boosting Quality Score to lower clearing CPCs.`,
    results: `| Performance Window | Clicks | Conversions | Cost / Conversion | Total Spend |
|---|---|---|---|---|
| Initial Phase (Sep – Nov 2025) | 3.08K | 138.00 | ₹747 | ₹103K |
| Q1 Optimization (Jan – Feb 2026) | 614 | 44.00 | ₹734 | ₹32.3K |
| Interim Anomaly (Apr – May 2026) | 184 | 4.00 | ₹9.18K | ₹36.7K |
| Restructured Scale (Jun – Oct 2026) | 1.68K | 84.00 | ₹1.89K | ₹158K |
| Cumulative Account Total | 5.56K | 270.00 | ₹1.22K | ₹331K |

**79% Cost Reduction Post-Crisis:** Quickly corrected the ₹9.18K/lead outlier back down below ₹1.9K while maintaining steady monthly pipeline volume (84 qualified leads).

**Consistent Pipeline for Mumbai Real Estate:** Generated 270 validated conversions under an efficient cumulative CPA of ₹1,220, well within industry benchmarks for Tier-1 city property projects.`,
  },
  {
    title: 'Web Development',
    slug: 'atom-prive-web-development',
    client: 'Atom Prive',
    status: 'draft',
    creator: 'siddhesh',
    createdAt: '2026-10-06T15:19:18Z',
    keyBusinesses: ['Investments', 'Insurance', 'Estate Planning'],
  },
  {
    title: 'SEO',
    slug: 'arise-facility-seo',
    client: 'Arise Facility Solutions',
    status: 'draft',
    creator: 'siddhesh',
    createdAt: '2026-10-06T15:34:29Z',
    keyBusinesses: ['Housekeeping or Workforce Management'],
    businessModels: ALL_MODELS,
  },
  {
    title: 'Web Development',
    slug: 'atom-risk-advisory-web-development',
    client: 'Atom Risk Advisory',
    status: 'draft',
    creator: 'siddhesh',
    createdAt: '2026-10-06T15:37:17Z',
    keyBusinesses: ['Insurance', 'Estate Planning'],
  },
  {
    title: 'Google Ads',
    slug: 'prestige-city-google-ads',
    client: 'Prestige City',
    status: 'draft',
    creator: 'siddhesh',
    createdAt: '2026-10-06T15:42:29Z',
    keyBusinesses: ['Residential property'],
  },
  {
    title: 'LinkedIn Ads',
    slug: 'atom-prive-linkedin-ads',
    client: 'Atom Prive',
    status: 'draft',
    creator: 'siddhesh',
    createdAt: '2026-10-06T15:47:53Z',
    keyBusinesses: ['Investments', 'Insurance', 'Estate Planning'],
  },
  {
    title: 'Creative Solution',
    slug: 'patel-international-creative-solution',
    client: 'Patel International Packers and Movers',
    status: 'draft',
    creator: 'siddhesh',
    createdAt: '2026-10-06T15:52:30Z',
    keyBusinesses: ['Packers & Movers'],
  },
]
