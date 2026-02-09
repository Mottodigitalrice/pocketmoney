# PocketMoney Family Business Plan

> A family-built, family-run app that teaches kids about money — and funds their future.

**Last Updated:** February 2026
**Status:** Pre-revenue, product built, ready for launch planning

---

## Table of Contents

1. [The Family](#the-family)
2. [Product Status Assessment](#product-status-assessment)
3. [Questions to Answer Together](#questions-to-answer-together)
4. [Business Structure & Legal](#business-structure--legal)
5. [Revenue Model & Financial Projections](#revenue-model--financial-projections)
6. [Kids' Fund Structure](#kids-fund-structure)
7. [Phased Action Plan](#phased-action-plan)

---

## The Family

| Name | Age | Role | Responsibilities |
|------|-----|------|-----------------|
| **Daddy** | 36 | Founder / Lead Developer | Product development, technical decisions, business strategy |
| **Ami** | 38 | Co-founder / Operations | Japan-side operations, content, marketing, user research |
| **Jaden** | 7 | Junior Product Advisor | Product testing, naming features, design input, brand content |
| **Tyler** | 4 | Chief Smile Officer | Color picking, reaction testing, joy quality assurance |

---

## Product Status Assessment

### What We've Built

PocketMoney is a **gamified chore and allowance management app** for families. Parents create jobs with yen amounts, assign them to children, and approve completions. Kids see their jobs on a fun drag-and-drop board and track their weekly earnings. The whole thing is wrapped in an ocean theme with sea creature avatars.

### Feature Inventory

| Feature | Status | Notes |
|---------|--------|-------|
| User authentication (Clerk) | ✅ Done | Sign-in, sign-up, session management |
| Multi-child family accounts | ✅ Done | Up to 6 children per family |
| Job library (create, edit, delete) | ✅ Done | Custom emoji icons, yen amounts |
| Week planner (assign jobs to days) | ✅ Done | Full week view for parents |
| Quick assign (jobs for today) | ✅ Done | Fast one-tap assignment |
| One-off tasks | ✅ Done | Temporary jobs on the fly |
| Kid dashboard (kanban board) | ✅ Done | Drag-and-drop: Available → In Progress → Done |
| Parent approval queue | ✅ Done | Review and approve/reject submissions |
| Weekly earnings tracker | ✅ Done | Potential vs actual earnings per child |
| Bilingual UI (English + Japanese) | ✅ Done | Full coverage, 215+ translation keys |
| AI-powered translation | ✅ Done | Real-time EN↔JA job name translation via OpenRouter |
| Ocean theme with animations | ✅ Done | Waves, bubbles, sea creatures, celebrations |
| 8 sea creature avatars | ✅ Done | Shark, dolphin, turtle, octopus, starfish, whale, crab, fish |
| Parent access gate | ✅ Done | Math challenge keeps little fingers out |
| Mobile-responsive design | ✅ Done | Works on phones, tablets, desktops |
| Onboarding flow | ✅ Done | 5-step guided setup for new families |
| Landing page | ✅ Done | Public marketing page |
| Deployment setup (Vercel) | ✅ Done | Production-ready |

### What's Missing (For a Launchable Product)

| Feature | Priority | Why It Matters |
|---------|----------|---------------|
| Payment system (Stripe) | High | Can't make money without it |
| Subscription tiers / premium features | High | Revenue model |
| Savings goals for kids | High | Key differentiator — kids save toward something |
| Analytics dashboard for parents | Medium | Track spending/earning patterns over time |
| Automated tests | Medium | Confidence for ongoing development |
| Push notifications / reminders | Medium | Engagement and retention |
| PWA / mobile app wrapper | Medium | App store presence, offline support |
| Dark mode | Low | Nice to have |
| Additional languages | Low | Future expansion |
| Streak/achievement system | Medium | Gamification for retention |
| Family savings jar (shared goals) | Medium | Unique family feature |

### Technical Health

- **Codebase:** ~9,200 lines of TypeScript, clean architecture, zero tech debt
- **Stack:** Next.js 16, React 19, Convex, Clerk, Tailwind v4, shadcn/ui — all current
- **Database:** Well-indexed Convex schema, real-time sync
- **Code quality:** Full TypeScript, Zod validation, no `any` types
- **Deployment:** Vercel-ready, environment configured
- **Weakness:** No automated tests yet

**Bottom line:** The core product works. The gap between "built" and "revenue" is primarily a payment system and premium feature tier.

---

## Questions to Answer Together

We'll work through these in batches during family meetings. Answers get filled in as we decide.

### Batch 1: Fun Family Stuff 🎨

> *Do this one together at the kitchen table. Let Jaden and Tyler participate.*

#### 1. One-Sentence Pitch
_Have Jaden try to explain it to his friends. Kids are brilliant simplifiers._

**Options to discuss:**
- "An app where kids do jobs and earn real money!"
- "A fun game that teaches kids about money by doing chores!"
- "The app that turns chores into an adventure!"

**Our pitch:** `_________________________________`

#### 2. Brand Story Direction
_How do we want people to feel when they discover PocketMoney?_

| Option | Vibe | Example |
|--------|------|---------|
| **Family-forward** | "We're a real family who built this together" | Photos of family, behind-the-scenes, the kids' involvement |
| **Product-forward** | "This is the best allowance app, made by parents who get it" | Focus on features, clean marketing, family is secondary |
| **Mission-forward** | "We believe every kid deserves to learn about money early" | Focus on financial education, the why behind the product |

**Our choice:** `_________________________________`

#### 3. How Do Jaden and Tyler Participate?

**Jaden (7) — Junior Product Advisor:**
- [ ] Test new features before release (official bug finder)
- [ ] Name features and characters
- [ ] Draw mascot ideas and design concepts
- [ ] Help pick UI designs (A/B testing, kid-style)
- [ ] Explain the app to other kids (pitch practice)
- [ ] Monthly "business meeting" role (age-appropriate agenda)

**Tyler (4) — Chief Smile Officer:**
- [ ] Pick colors for new themes
- [ ] Reaction testing ("Does this make you happy or confused?")
- [ ] Choose which sea creature is the best (brand mascot vote)
- [ ] Stamp of approval on new features (happy face / sad face)
- [ ] Monthly meeting participant (drawing, stickers, simple votes)

**Both:**
- [ ] Monthly family business meeting (pizza included)
- [ ] Appear in brand content (depending on privacy decision below)
- [ ] Get a "salary" from the app (paid in their own PocketMoney accounts — dogfooding!)

#### 4. Kids' Public Visibility

| Level | What It Means |
|-------|--------------|
| **Full family brand** | Names, faces, stories in marketing. Most relatable, most exposure |
| **First names only** | Names and voices but no recognizable photos. Moderate |
| **Behind the scenes** | "Built with input from our kids" but no names/faces public |
| **Completely private** | No mention of specific kids. Family angle is generic |

**Our choice:** `_________________________________`

**Things to consider:**
- Japan has strong privacy norms — many Japanese parents keep kids offline
- International audiences may respond more to family brand
- Can always start private and open up later; can't easily go the other way
- Jaden will be old enough to have opinions about this soon

---

### Batch 2: Revenue & Money Questions 💰

> *Daddy and Ami discussion. Maybe over dinner after the kids are in bed.*

#### 5. Monetization Model

**Recommended approach: Freemium with subscription tiers**

| Tier | Price | What You Get |
|------|-------|-------------|
| **Free** | ¥0 | 1 child, 5 custom jobs, basic dashboard, weekly view |
| **Family** | ¥480/month (¥4,800/year) | Up to 6 children, unlimited jobs, AI translation, analytics |
| **Family+** | ¥980/month (¥9,800/year) | Everything + savings goals, achievements, export data, priority support |

**Why this model:**
- Free tier lets families try it with zero risk
- ¥480/month is less than a kids' manga magazine — easy to justify
- Annual discount encourages commitment
- AI features (translation) have actual cost, so they belong in paid tier

**Our decision:** `_________________________________`

#### 6. Revenue Targets (Conservative)

| Period | Free Users | Paid Users | Monthly Revenue | Annual Revenue |
|--------|-----------|------------|-----------------|---------------|
| **Year 1** | 500 | 25 (5% conversion) | ~¥12,000 | ~¥144,000 |
| **Year 2** | 2,000 | 150 (7.5% conversion) | ~¥72,000 | ~¥864,000 |
| **Year 3** | 5,000 | 500 (10% conversion) | ~¥240,000 | ~¥2,880,000 |

_These are conservative. 5% freemium conversion is below industry average (typically 5-10%). Growth assumes steady organic + some marketing._

#### 7. Startup Budget

| Item | Monthly Cost | Notes |
|------|-------------|-------|
| Convex (database) | ¥0 → ~¥3,500 | Free tier covers early stage |
| Clerk (auth) | ¥0 → ~¥3,500 | Free up to 10K MAUs |
| Vercel (hosting) | ¥0 → ~¥2,800 | Free tier is generous |
| OpenRouter (AI) | ~¥1,500 | Translation API calls |
| Domain + email | ~¥1,500 | Annual cost amortized |
| Apple Developer | ~¥1,700 | ¥14,000/year if we do iOS |
| Google Play | ~¥400 | One-time ¥3,700, amortized |
| Design tools | ¥0 | Use free tools to start |
| **Total (early)** | **~¥3,000/month** | Minimal spend pre-revenue |
| **Total (scaling)** | **~¥15,000/month** | Once we hit paid tiers on services |

---

### Batch 3: Market & Customers 🎯

#### 8. Target Customer

**Primary:** Japanese families with children ages 4-12
**Secondary:** English-speaking expat families in Japan
**Future:** International families (EN-speaking markets)

**Why Japan first:**
- We live here, we understand the market
- Bilingual gives us expat community as easy early adopters
- Japanese parents value financial education (お金の教育)
- Less competition in JP app store for this category
- Cultural fit: otetsudai (お手伝い / helping with chores) is deeply embedded in Japanese parenting

#### 9. Competitive Advantage

| Us | Them |
|----|------|
| Bilingual (JP + EN) from day one | Most allowance apps are English-only |
| Ocean-themed, fun for kids | Most are boring parent-focused UIs |
| Real-time sync (Convex) | Many use local storage only |
| Built by a real family, for real families | Built by companies |
| Drag-and-drop kanban for kids | Simple checklists |
| AI-powered features | No AI integration |
| Web-first, works on any device | App-store dependent |

#### 10. Geography & Languages

**Phase 1:** Japan (JP + EN) — already built
**Phase 2:** Add Simplified Chinese, Korean (large East Asian market overlap)
**Phase 3:** Full English international launch

---

### Batch 4: Product Roadmap 🛣️

#### 11. MVP vs Nice-to-Have

**MVP (what's needed to charge money):**
- [x] Core chore/job workflow
- [x] Parent + kid dashboards
- [x] Multi-child support
- [x] Bilingual UI
- [ ] Payment system (Stripe)
- [ ] Free vs paid tier gating
- [ ] Savings goals for kids
- [ ] Terms of service + privacy policy

**Nice-to-have (post-launch):**
- [ ] Achievement/streak system
- [ ] Family savings jar
- [ ] Parent analytics dashboard
- [ ] Push notifications
- [ ] PWA / app store listing
- [ ] Dark mode
- [ ] More languages
- [ ] Export data (CSV/PDF)
- [ ] Family leaderboard

#### 12. Mobile Strategy

**Recommendation: PWA first, native apps later**

| Approach | Pros | Cons |
|----------|------|------|
| **PWA (Progressive Web App)** | No app store fees, ship fast, works now | No push notifications on iOS (limited), less discoverable |
| **Native wrapper (Capacitor)** | App store presence, push notifications | 15-30% revenue cut, review process, maintenance cost |
| **Full native (React Native)** | Best UX, full platform access | Significant development time, separate codebase |

**Phase 1:** Ship as PWA (add manifest, service worker, install prompt)
**Phase 2:** Wrap with Capacitor for app stores once we have paying users
**Phase 3:** Consider React Native only if revenue justifies it

---

### Batch 5: Family & Financial Structure 🏦

#### 13. Time Investment

| Person | Hours/Week | Focus |
|--------|-----------|-------|
| Daddy | 5-10 hrs | Development, technical decisions |
| Ami | 3-5 hrs | Content, social media, user research, operations |
| Jaden | 30 min | Monthly meeting + testing sessions |
| Tyler | 15 min | Monthly meeting participation |
| **Family total** | ~10-15 hrs/week | |

#### 14. Kids' Fund Split

**Recommended structure:**

```
Monthly Profit
├── 50% → Business reinvestment (marketing, tools, growth)
├── 25% → Jaden's fund
└── 25% → Tyler's fund
```

**When profit exceeds ¥100,000/month:**
```
Monthly Profit
├── 40% → Business reinvestment
├── 20% → Jaden's fund
├── 20% → Tyler's fund
└── 20% → Family fund (savings, family activities)
```

**Investment vehicles for kids' funds:**
1. **Children's NISA (2026~):** ¥600,000/year cap, ¥6,000,000 lifetime cap, tax-free gains
2. **Regular savings:** For amounts exceeding NISA caps
3. **Gift tax consideration:** Stay under ¥1,100,000/year per child to avoid gift tax

#### 15. GK Transition Trigger

**Consider setting up a dedicated Godo Kaisha (GK) when:**
- Monthly revenue consistently exceeds ¥200,000
- OR annual revenue exceeds ¥2,000,000
- OR there's a strategic reason to separate from the existing KK
- Kids would hold membership interests (legal representative: parents)
- GK is simpler and cheaper to maintain than KK for a family business

---

### Batch 6: Marketing & Launch 🚀

#### 16. Launch Strategy

**Recommendation: Soft launch → Community → Public**

| Phase | Timeline | Actions |
|-------|----------|---------|
| **Private beta** | Month 1-2 | 10-20 families (friends, school parents, expat groups) |
| **Soft launch** | Month 3-4 | Open registration, gather feedback, fix issues |
| **Public launch** | Month 5-6 | Marketing push, app store if ready, PR |

#### 17. Marketing Channels

| Channel | Cost | Effort | Expected Impact |
|---------|------|--------|----------------|
| **Word of mouth (school parents)** | Free | Low | High for initial users |
| **Expat Facebook/LINE groups** | Free | Low | High for early adopters |
| **Japanese parenting blogs/forums** | Free | Medium | Medium-high |
| **X (Twitter) / Instagram** | Free | Medium | Medium (build over time) |
| **App Store optimization** | Low | Medium | High once listed |
| **Content marketing (blog)** | Free | High | Long-term SEO value |
| **Paid social ads** | ¥10,000+/month | Low | Test when profitable |

#### 18. Family Story Sharing

| Content Type | Risk Level | Value |
|-------------|-----------|-------|
| "Built by a family" messaging | None | High — differentiator |
| Development behind-the-scenes | Low | Medium — engaging content |
| Kids' involvement (anonymous) | Low | High — relatable |
| Kids' names/faces | Medium | High but irreversible |
| Family financial transparency | Medium | Very high if comfortable |

---

## Business Structure & Legal

### Current Setup
```
Existing KK (Kabushiki Kaisha)
└── PocketMoney project
    ├── Revenue declared as KK income
    ├── Expenses deducted through KK
    └── Profits distributed to kids' funds
```

### Future Setup (When Revenue Justifies It)
```
New GK (Godo Kaisha) — "PocketMoney GK"
├── Daddy: Representative Member (業務執行社員)
├── Ami: Member (社員)
├── Jaden: Member (社員) — parent as legal representative
├── Tyler: Member (社員) — parent as legal representative
└── Membership interests transferred via annual gifts (≤¥1.1M each)
```

### Legal Checklist
- [ ] Draft Terms of Service (利用規約)
- [ ] Draft Privacy Policy (プライバシーポリシー) — extra important with children as users
- [ ] COPPA compliance (if targeting US users)
- [ ] Japan's Act on Protection of Personal Information (個人情報保護法) compliance
- [ ] Tokushoho (特定商取引法) display for commercial transactions
- [ ] Confirm KK accounting treatment with tax advisor
- [ ] Set up Stripe account under KK

---

## Revenue Model & Financial Projections

### Conservative 3-Year Projection

**Assumptions:**
- Freemium model, ¥480/month (Family) and ¥980/month (Family+)
- 60% Family / 40% Family+ split among paid users
- 5% → 7.5% → 10% conversion rate over 3 years
- Stripe fee: 3.6% + ¥40 per transaction
- Churn: 5% monthly for monthly subscribers, 1% monthly for annual

| Metric | Year 1 | Year 2 | Year 3 |
|--------|--------|--------|--------|
| **Total registered users** | 500 | 2,000 | 5,000 |
| **Paying users (end of year)** | 25 | 150 | 500 |
| **Avg revenue per paying user/month** | ¥680 | ¥680 | ¥680 |
| **Monthly revenue (end of year)** | ¥17,000 | ¥102,000 | ¥340,000 |
| **Annual revenue** | ~¥100,000 | ~¥750,000 | ~¥3,000,000 |
| **Monthly costs** | ~¥5,000 | ~¥15,000 | ~¥30,000 |
| **Annual costs** | ~¥60,000 | ~¥180,000 | ~¥360,000 |
| **Annual profit** | ~¥40,000 | ~¥570,000 | ~¥2,640,000 |

### Year 3 Kids' Fund Projection (if targets met)

At ¥2,640,000 annual profit with 25%/25% split:
- **Jaden's fund:** ~¥660,000/year
- **Tyler's fund:** ~¥660,000/year
- Both fit within NISA limits (¥600,000/year) + small overflow to savings
- Both fit within gift tax exemption (¥1,100,000/year)

### Break-Even Point

With ~¥5,000/month in costs at the start, we need roughly **8-10 paying users** to break even. That's realistic within the first few months of soft launch.

---

## Kids' Fund Structure

### Vehicle Comparison

| Vehicle | Annual Limit | Tax Treatment | Accessibility | Best For |
|---------|-------------|--------------|---------------|----------|
| **Children's NISA (2026~)** | ¥600,000 | Tax-free gains | Restricted until 18 | Long-term growth |
| **Regular savings** | Unlimited | Taxable | Anytime | Liquidity, overflow |
| **GK membership interest** | N/A | Gift tax on transfer | Business value | Ownership, education |
| **Family trust (信託)** | N/A | Complex tax rules | Trustee controls | Estate planning |

### Recommended Phased Approach

**Phase 1 (Now → Year 1):** Simple savings accounts for each child
**Phase 2 (Year 1-2):** Open Children's NISA accounts, start investing profits
**Phase 3 (Year 2-3):** If revenue justifies, set up GK and transfer membership interests
**Phase 4 (Long-term):** Consider family trust structure as amounts grow

---

## Phased Action Plan

### This Week (Week of Feb 10, 2026)

- [ ] **Family meeting:** Do Batch 1 (Fun Stuff) at the kitchen table
  - Try the one-sentence pitch exercise with Jaden
  - Let Tyler pick his favorite sea creature for mascot vote
  - Decide on brand story direction
  - Discuss kids' visibility level
- [ ] **Daddy:** Set up a shared family Notion or doc for business decisions
- [ ] **Ami:** Research 5 competing allowance/chore apps in Japan

### This Month (February 2026)

- [ ] **Complete Batch 2-3 decisions** (Revenue model, target customer)
- [ ] **Daddy:** Add Terms of Service and Privacy Policy pages
- [ ] **Daddy:** Implement free-tier feature gating (prep for monetization)
- [ ] **Daddy:** Add basic savings goals feature (key differentiator)
- [ ] **Ami:** Identify 10-20 families for private beta
- [ ] **Both:** Set up social media accounts (if decided to go public)

### Month 2-3 (March-April 2026)

- [ ] **Daddy:** Integrate Stripe for payments
- [ ] **Daddy:** Implement subscription tiers
- [ ] **Daddy:** Add PWA support (manifest, service worker, install prompt)
- [ ] **Daddy:** Set up basic analytics (privacy-respecting)
- [ ] **Ami:** Launch private beta with 10-20 families
- [ ] **Ami:** Collect feedback, document pain points
- [ ] **Both:** Monthly family business meeting #1 with Jaden and Tyler
- [ ] **Jaden:** Official first bug testing session

### Month 4-6 (May-July 2026)

- [ ] **Soft launch** — open registration
- [ ] **Daddy:** Achievement/streak system
- [ ] **Daddy:** Parent analytics dashboard
- [ ] **Ami:** Begin marketing (chosen channels from Batch 6)
- [ ] **Both:** Open Children's NISA accounts for Jaden and Tyler
- [ ] **Both:** First revenue check — are we hitting early targets?
- [ ] **Evaluate:** Do we need app store presence? (Capacitor wrap)

### Month 7-12 (Aug 2026 - Jan 2027)

- [ ] **Scale based on data** — what's working, what's not
- [ ] **Daddy:** Features based on user feedback
- [ ] **Ami:** Content marketing, community building
- [ ] **Both:** Quarterly family business review
- [ ] **Evaluate:** GK setup timing
- [ ] **Year 1 retrospective:** Revenue, users, lessons learned

---

## Decision Log

_Record decisions as we make them. Date + what we decided + why._

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-09 | Created business plan | Organizing our approach before launch |
| | | |
| | | |

---

## Open Questions

_Things we need to figure out but aren't urgent:_

1. Do we want to explore partnerships with Japanese schools or educational organizations?
2. Should we consider a B2B angle (schools, juku, after-school programs)?
3. What happens when Jaden is old enough to actually contribute code?
4. Do we want to open-source any part of this?
5. Insurance considerations for a digital product business?

---

## Family Mission Statement

> _To be written together at our first family business meeting._
>
> "We are the _____________ family. We built PocketMoney because _________________.
> Our goal is to help families _________________ while building something together
> that funds Jaden and Tyler's future."

---

*This is a living document. We'll update it as we make decisions and learn from our users.*

*Built with love by the whole family. 🌊*
