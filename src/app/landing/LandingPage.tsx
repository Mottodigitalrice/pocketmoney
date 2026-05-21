"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useTranslation } from "@/hooks/use-translation";
import { BudouXText } from "@/components/shared/BudouXText";

// ---------------------------------------------------------------------------
// Scroll-reveal hook
// ---------------------------------------------------------------------------
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ---------------------------------------------------------------------------
// Fade-in wrapper
// ---------------------------------------------------------------------------
function FadeIn({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right";
}) {
  const { ref, visible } = useInView();
  const transforms = {
    up: "translateY(30px)",
    left: "translateX(-30px)",
    right: "translateX(30px)",
  };
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : transforms[direction],
        transition: `all 0.7s ease-out ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Wave SVG divider
// ---------------------------------------------------------------------------
function Wave({ fill, className = "" }: { fill: string; className?: string }) {
  return (
    <div className={className}>
      <svg
        viewBox="0 0 1440 60"
        preserveAspectRatio="none"
        className="block h-[40px] w-full md:h-[60px]"
      >
        <path
          d="M0,20 C320,55 640,0 960,30 C1200,50 1350,15 1440,25 L1440,60 L0,60 Z"
          fill={fill}
        />
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Phone mockup frame
// ---------------------------------------------------------------------------
function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-[260px] sm:w-[280px]">
      <div className="rounded-[36px] border-[5px] border-gray-800 bg-gray-900 p-1.5 shadow-2xl">
        <div className="mx-auto mb-1 h-5 w-20 rounded-full bg-gray-800" />
        <div className="overflow-hidden rounded-[28px]">{children}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Floating coins (hero decoration)
// ---------------------------------------------------------------------------
function FloatingCoins() {
  const coins = [
    { emoji: "🪙", cls: "text-4xl", x: "8%", y: "18%", delay: "0s", dur: "4s" },
    {
      emoji: "💴",
      cls: "text-3xl",
      x: "82%",
      y: "12%",
      delay: "1.2s",
      dur: "5s",
    },
    {
      emoji: "🪙",
      cls: "text-2xl",
      x: "72%",
      y: "62%",
      delay: "2s",
      dur: "3.5s",
    },
    {
      emoji: "💰",
      cls: "text-3xl",
      x: "15%",
      y: "68%",
      delay: "0.6s",
      dur: "4.5s",
    },
    {
      emoji: "🪙",
      cls: "text-xl",
      x: "50%",
      y: "25%",
      delay: "1.5s",
      dur: "3s",
    },
    {
      emoji: "💴",
      cls: "text-2xl",
      x: "35%",
      y: "75%",
      delay: "0.3s",
      dur: "5.5s",
    },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {coins.map((c, i) => (
        <div
          key={i}
          className={`absolute animate-coin-float ${c.cls} opacity-25`}
          style={{
            left: c.x,
            top: c.y,
            animationDelay: c.delay,
            animationDuration: c.dur,
          }}
        >
          {c.emoji}
        </div>
      ))}
    </div>
  );
}

// ===========================================================================
// SECTION: Navbar
// ===========================================================================
function Navbar() {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-slate-900/90 shadow-lg backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <span className="text-lg font-extrabold tracking-tight text-white">
          🏴‍☠️ {t("landing_brand")}
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="rounded-full px-4 py-1.5 text-sm font-semibold text-white transition hover:text-amber-200"
          >
            {t("landing_nav_sign_in")}
          </Link>
          <Link
            href="/sign-up"
            className="rounded-full bg-amber-500 px-5 py-1.5 text-sm font-bold text-gray-900 shadow-md transition hover:bg-amber-400 hover:shadow-lg active:scale-95"
          >
            {t("landing_nav_get_started")}
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ===========================================================================
// SECTION: Hero
// ===========================================================================
function HeroSection() {
  const { t } = useTranslation();
  return (
    <section className="ocean-gradient relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 pt-20 pb-32 text-center">
      <FloatingCoins />

      {/* Animated sea creatures */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute animate-float-gentle text-5xl opacity-20"
          style={{ left: "5%", top: "35%", animationDelay: "0s" }}
        >
          🦈
        </div>
        <div
          className="absolute animate-float-gentle text-4xl opacity-15"
          style={{ right: "8%", top: "45%", animationDelay: "1.5s" }}
        >
          🐬
        </div>
        <div
          className="absolute animate-float-gentle text-3xl opacity-15"
          style={{ left: "20%", bottom: "20%", animationDelay: "0.8s" }}
        >
          🐢
        </div>
        <div
          className="absolute animate-float-gentle text-4xl opacity-10"
          style={{ right: "25%", bottom: "25%", animationDelay: "2s" }}
        >
          🐙
        </div>
      </div>

      {/* Hero content. F21: above-the-fold copy renders immediately (no
          float-up entrance) so the H1 is the LCP element at first paint
          rather than being delayed by the 0.6s opacity:0→1 keyframe. */}
      <div className="relative z-10">
        <div className="mb-4 text-5xl">🏴‍☠️</div>

        <h1 className="mx-auto max-w-4xl text-5xl font-black leading-tight tracking-tight text-white drop-shadow-lg sm:text-6xl lg:text-7xl">
          <BudouXText>{t("landing_hero_title_lead")}</BudouXText>{" "}
          <span className="bg-gradient-to-r from-amber-300 to-yellow-200 bg-clip-text text-transparent">
            <BudouXText>{t("landing_hero_title_highlight")}</BudouXText>
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-white/90 sm:text-xl">
          <BudouXText>{t("landing_hero_subtitle")}</BudouXText>
        </p>

        {/* F10 1.3: hero disclaimer — make it clear the app tracks balances
            and the parent pays out real cash. */}
        <p className="mx-auto mt-3 max-w-xl text-sm font-medium text-amber-100 sm:text-base">
          <BudouXText>{t("landing_hero_disclaimer")}</BudouXText>
        </p>

        <div
          className="animate-float-up mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          style={{ animationDelay: "0.6s" }}
        >
          <Link
            href="/sign-up"
            className="group rounded-full bg-amber-500 px-8 py-4 text-lg font-bold text-gray-900 shadow-lg transition-all hover:bg-amber-400 hover:shadow-xl hover:scale-105 active:scale-95"
          >
            {t("landing_hero_cta_primary")}{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
          <a
            href="#how-it-works"
            className="rounded-full border-2 border-white/30 bg-white/10 px-8 py-4 text-lg font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
          >
            {t("landing_hero_cta_secondary")}
          </a>
        </div>

        {/* Trust signals — F10 1.2: privacy/data-stays-yours line replaces
            the "Free forever" freemium-flavoured hook, which reads as
            suspicious in JP commercial register. */}
        <div
          className="animate-float-up mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-white/90"
          style={{ animationDelay: "0.8s" }}
        >
          <span>✓ {t("landing_trust_privacy")}</span>
          <span>✓ {t("landing_trust_no_card")}</span>
          <span>✓ {t("landing_trust_quick_setup")}</span>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 animate-scroll-hint text-white/40">
        <svg
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {/* Wave transition to white */}
      <Wave fill="#ffffff" className="absolute bottom-0 left-0 right-0 z-10" />
    </section>
  );
}

// ===========================================================================
// SECTION: Stats strip
// ===========================================================================
function StatsStrip() {
  const { t } = useTranslation();
  const stats = [
    { emoji: "📋", label: t("landing_stats_chores") },
    { emoji: "🌏", label: t("landing_stats_bilingual") },
    { emoji: "💰", label: t("landing_stats_yen") },
    { emoji: "⚡", label: t("landing_stats_realtime") },
  ];
  return (
    <section className="bg-white py-10">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-6 px-5 sm:gap-10">
        {stats.map((s, i) => (
          <FadeIn key={i} delay={i * 0.1}>
            <div className="flex items-center gap-2.5 text-gray-700">
              <span className="text-2xl">{s.emoji}</span>
              <span className="text-sm font-semibold sm:text-base">
                <BudouXText>{s.label}</BudouXText>
              </span>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

// ===========================================================================
// SECTION: How It Works
// ===========================================================================
function HowItWorks() {
  const { t } = useTranslation();
  const steps = [
    {
      num: "1",
      emoji: "📋",
      title: t("landing_how_step1_title"),
      desc: t("landing_how_step1_desc"),
      color: "from-amber-500 to-orange-500",
    },
    {
      num: "2",
      emoji: "✅",
      title: t("landing_how_step2_title"),
      desc: t("landing_how_step2_desc"),
      color: "from-cyan-500 to-blue-500",
    },
    {
      num: "3",
      emoji: "💰",
      title: t("landing_how_step3_title"),
      desc: t("landing_how_step3_desc"),
      color: "from-green-500 to-emerald-500",
    },
  ];

  return (
    <section id="how-it-works" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-5">
        <FadeIn className="mb-16 text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-amber-600">
            {t("landing_how_eyebrow")}
          </p>
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl">
            {t("landing_how_title")}
          </h2>
        </FadeIn>

        <div className="grid gap-8 sm:grid-cols-3 sm:gap-6">
          {steps.map((step, i) => (
            <FadeIn key={i} delay={i * 0.15}>
              <div className="group text-center">
                {/* Number circle */}
                <div
                  className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${step.color} text-3xl shadow-lg transition-transform group-hover:scale-110`}
                >
                  {step.emoji}
                </div>
                {/* Arrow between steps (desktop only) */}
                <h3 className="mb-2 text-xl font-bold text-gray-900">
                  <BudouXText>{step.title}</BudouXText>
                </h3>
                <p className="text-gray-600">
                  <BudouXText>{step.desc}</BudouXText>
                </p>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Connection arrows (desktop) */}
        <div className="mt-4 hidden items-center justify-center gap-2 text-gray-300 sm:flex">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs font-bold text-gray-400">→ → →</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>
      </div>
    </section>
  );
}

// ===========================================================================
// SECTION: Parent Showcase
// ===========================================================================
function ParentScreenMockup() {
  const { t } = useTranslation();
  return (
    <div className="min-h-[420px] bg-gradient-to-b from-amber-900 to-amber-950 p-4">
      {/* Header */}
      <div className="mb-3 text-center">
        <p className="text-xs font-bold text-amber-300">
          🏴‍☠️ {t("landing_mock_parent_header_eyebrow")}
        </p>
        <p className="text-sm font-bold text-white">
          {t("landing_mock_parent_header_title")}
        </p>
      </div>

      {/* Week grid */}
      <div className="mb-3 rounded-xl bg-amber-800/50 p-3">
        <div className="mb-1.5 grid grid-cols-5 gap-1 text-center">
          {[
            t("landing_mock_day_mon"),
            t("landing_mock_day_tue"),
            t("landing_mock_day_wed"),
            t("landing_mock_day_thu"),
            t("landing_mock_day_fri"),
          ].map((day) => (
            <div key={day} className="text-[10px] font-bold text-amber-300">
              {day}
            </div>
          ))}
          {["👕", "🧸", "🌱", "🍽️", "📚"].map((icon, i) => (
            <div
              key={i}
              className="rounded-lg bg-amber-700/50 p-1.5 text-center text-sm"
            >
              {icon}
            </div>
          ))}
          {["🛏️", "🐾", "🧹", "👟", "🪟"].map((icon, i) => (
            <div
              key={i}
              className="mt-1 rounded-lg bg-amber-700/50 p-1.5 text-center text-sm"
            >
              {icon}
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] text-amber-200">
            🦈 {t("landing_mock_parent_bobbys_week")}
          </span>
          <span className="text-xs font-bold text-amber-300">¥850</span>
        </div>
      </div>

      {/* Approval queue */}
      <p className="mb-2 text-xs font-bold text-amber-300">
        ✅ {t("landing_mock_parent_approve_label")}
      </p>
      {[
        {
          icon: "🧸",
          title: t("landing_mock_parent_job1_title"),
          amount: 50,
          child: t("landing_mock_parent_job1_child"),
        },
        {
          icon: "🌱",
          title: t("landing_mock_parent_job2_title"),
          amount: 100,
          child: t("landing_mock_parent_job2_child"),
        },
      ].map((item, i) => (
        <div
          key={i}
          className="mb-1.5 flex items-center gap-2 rounded-lg bg-amber-800/40 p-2"
        >
          <span className="text-lg">{item.icon}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[10px] font-medium text-white">
              {item.title}
            </p>
            <p className="text-[9px] text-amber-300">
              {item.child} · ¥{item.amount}
            </p>
          </div>
          <div className="flex gap-1">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/80 text-[10px] text-white">
              ✓
            </div>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/80 text-[10px] text-white">
              ✗
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ParentShowcase() {
  const { t } = useTranslation();
  const bullets = [
    `📅 ${t("landing_parent_bullet_planner")}`,
    `💰 ${t("landing_parent_bullet_yen")}`,
    `✅ ${t("landing_parent_bullet_approve")}`,
    `🔒 ${t("landing_parent_bullet_lock")}`,
  ];
  return (
    <section className="bg-slate-900 py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-2 lg:gap-16">
        {/* Text */}
        <FadeIn direction="left">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-amber-400">
            {t("landing_parent_eyebrow")}
          </p>
          <h2 className="mb-5 text-3xl font-bold text-white sm:text-4xl">
            <BudouXText>{t("landing_parent_title")}</BudouXText>
          </h2>
          <p className="mb-8 text-lg text-slate-200">
            <BudouXText>{t("landing_parent_body")}</BudouXText>
          </p>
          <ul className="space-y-3">
            {bullets.map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-slate-100">
                <BudouXText>{item}</BudouXText>
              </li>
            ))}
          </ul>
        </FadeIn>

        {/* Phone mockup */}
        <FadeIn direction="right" delay={0.2}>
          <div className="flex justify-center">
            <PhoneFrame>
              <ParentScreenMockup />
            </PhoneFrame>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ===========================================================================
// SECTION: Kid Showcase
// ===========================================================================
function KidScreenMockup() {
  const { t } = useTranslation();
  return (
    <div className="min-h-[420px] bg-gradient-to-b from-cyan-500 to-blue-600 p-4">
      {/* Header */}
      <div className="mb-2 text-center">
        <p className="text-2xl">🦈</p>
        <p className="text-sm font-bold text-white">
          {t("landing_mock_kid_header")}
        </p>
      </div>

      {/* Weekly tracker */}
      <div className="mb-3 rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
        <div className="mb-1 flex justify-between text-[10px] text-white/80">
          <span>{t("landing_mock_kid_this_week")}</span>
          <span className="font-bold text-white">¥350 / ¥850</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-amber-400"
            style={{ width: "41%" }}
          />
        </div>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-3 gap-1.5">
        {/* To Do */}
        <div>
          <p className="mb-1 text-center text-[9px] font-bold text-white/80">
            {t("landing_mock_kid_todo")}
          </p>
          {[
            { icon: "👕", amount: 100 },
            { icon: "🍽️", amount: 100 },
          ].map((job, i) => (
            <div
              key={i}
              className="mb-1 rounded-lg bg-white/20 p-1.5 text-center"
            >
              <span className="block text-lg">{job.icon}</span>
              <span className="text-[9px] font-bold text-amber-300">
                ¥{job.amount}
              </span>
            </div>
          ))}
        </div>

        {/* Doing */}
        <div>
          <p className="mb-1 text-center text-[9px] font-bold text-white/80">
            {t("landing_mock_kid_doing")}
          </p>
          <div className="mb-1 rounded-lg border border-amber-400/50 bg-amber-400/30 p-1.5 text-center">
            <span className="block text-lg">🌱</span>
            <span className="text-[9px] font-bold text-amber-300">¥100</span>
          </div>
        </div>

        {/* Done */}
        <div>
          <p className="mb-1 text-center text-[9px] font-bold text-white/80">
            {t("landing_mock_kid_done")} ✨
          </p>
          {[
            { icon: "🧸", amount: 50 },
            { icon: "🛏️", amount: 50 },
          ].map((job, i) => (
            <div
              key={i}
              className="mb-1 rounded-lg border border-green-400/50 bg-green-400/30 p-1.5 text-center"
            >
              <span className="block text-lg">{job.icon}</span>
              <span className="text-[9px] font-bold text-green-300">
                ¥{job.amount}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Celebration hint */}
      <div className="mt-3 rounded-lg bg-white/10 p-2 text-center">
        <p className="text-[10px] text-white/80">
          🐬 {t("landing_mock_kid_surprise")}
        </p>
      </div>
    </div>
  );
}

function KidShowcase() {
  const { t } = useTranslation();
  const bullets = [
    `🎮 ${t("landing_kid_bullet_board")}`,
    `📊 ${t("landing_kid_bullet_tracker")}`,
    `🐬 ${t("landing_kid_bullet_celebration")}`,
    `🦈 ${t("landing_kid_bullet_avatar")}`,
  ];
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-2 lg:gap-16">
        {/* Phone mockup (first on mobile, second on desktop) */}
        <FadeIn direction="left" delay={0.2} className="order-2 lg:order-1">
          <div className="flex justify-center">
            <PhoneFrame>
              <KidScreenMockup />
            </PhoneFrame>
          </div>
        </FadeIn>

        {/* Text */}
        <FadeIn direction="right" className="order-1 lg:order-2">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-cyan-600">
            {t("landing_kid_eyebrow")}
          </p>
          <h2 className="mb-5 text-3xl font-bold text-gray-900 sm:text-4xl">
            <BudouXText>{t("landing_kid_title")}</BudouXText>
          </h2>
          <p className="mb-8 text-lg text-gray-600">
            <BudouXText>{t("landing_kid_body")}</BudouXText>
          </p>
          <ul className="space-y-3">
            {bullets.map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-gray-700">
                <BudouXText>{item}</BudouXText>
              </li>
            ))}
          </ul>
        </FadeIn>
      </div>
    </section>
  );
}

// ===========================================================================
// SECTION: Features Grid
// ===========================================================================
function FeaturesGrid() {
  const { t } = useTranslation();
  const features = [
    {
      emoji: "📅",
      title: t("landing_feat_planner_title"),
      desc: t("landing_feat_planner_desc"),
      bg: "bg-amber-50",
      border: "border-amber-200",
    },
    {
      emoji: "✅",
      title: t("landing_feat_approval_title"),
      desc: t("landing_feat_approval_desc"),
      bg: "bg-green-50",
      border: "border-green-200",
    },
    {
      emoji: "💰",
      title: t("landing_feat_tracker_title"),
      desc: t("landing_feat_tracker_desc"),
      bg: "bg-yellow-50",
      border: "border-yellow-200",
    },
    {
      emoji: "🎮",
      title: t("landing_feat_kidui_title"),
      desc: t("landing_feat_kidui_desc"),
      bg: "bg-cyan-50",
      border: "border-cyan-200",
    },
    {
      emoji: "🌏",
      title: t("landing_feat_bilingual_title"),
      desc: t("landing_feat_bilingual_desc"),
      bg: "bg-purple-50",
      border: "border-purple-200",
    },
    {
      emoji: "🔒",
      title: t("landing_feat_lock_title"),
      desc: t("landing_feat_lock_desc"),
      bg: "bg-red-50",
      border: "border-red-200",
    },
  ];

  return (
    <section className="bg-slate-50 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <FadeIn className="mb-16 text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-indigo-600">
            {t("landing_feat_eyebrow")}
          </p>
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl">
            <BudouXText>{t("landing_feat_title")}</BudouXText>
          </h2>
        </FadeIn>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <FadeIn key={i} delay={i * 0.08}>
              <div
                className={`rounded-2xl border ${f.border} ${f.bg} p-6 transition-all hover:-translate-y-1 hover:shadow-lg`}
              >
                <div className="mb-3 text-3xl">{f.emoji}</div>
                <h3 className="mb-1.5 text-lg font-bold text-gray-900">
                  <BudouXText>{f.title}</BudouXText>
                </h3>
                <p className="text-sm text-gray-600">
                  <BudouXText>{f.desc}</BudouXText>
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===========================================================================
// SECTION: Chore Preview
// ===========================================================================
function ChorePreview() {
  const { t } = useTranslation();
  const chores = [
    { icon: "👕", title: t("landing_chore_fold"), yen: 100 },
    { icon: "🧸", title: t("landing_chore_toys"), yen: 50 },
    { icon: "🛏️", title: t("landing_chore_bed"), yen: 50 },
    { icon: "🌱", title: t("landing_chore_water"), yen: 100 },
    { icon: "🐾", title: t("landing_chore_pets"), yen: 150 },
    { icon: "📚", title: t("landing_chore_books"), yen: 50 },
    { icon: "🧹", title: t("landing_chore_sweep"), yen: 200 },
    { icon: "🪟", title: t("landing_chore_windows"), yen: 300 },
    { icon: "🍽️", title: t("landing_chore_table"), yen: 100 },
    { icon: "🎒", title: t("landing_chore_bag"), yen: 100 },
    { icon: "🪥", title: t("landing_chore_teeth"), yen: 100 },
    { icon: "👨‍🍳", title: t("landing_chore_cook"), yen: 500 },
  ];

  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-5">
        <FadeIn className="mb-12 text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-emerald-600">
            {t("landing_chores_eyebrow")}
          </p>
          <h2 className="mb-3 text-3xl font-bold text-gray-900 sm:text-4xl">
            <BudouXText>{t("landing_chores_title")}</BudouXText>
          </h2>
          <p className="text-gray-600">
            <BudouXText>{t("landing_chores_body")}</BudouXText>
          </p>
        </FadeIn>

        <FadeIn>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {chores.map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm transition-all hover:shadow-md"
              >
                <span className="text-2xl">{c.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-800">
                    {c.title}
                  </p>
                  <p className="text-xs font-bold text-amber-600">¥{c.yen}</p>
                </div>
              </div>
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="mt-6 text-center text-sm text-gray-600">
            <BudouXText>{t("landing_chores_more")}</BudouXText>
          </p>
        </FadeIn>
      </div>
    </section>
  );
}

// ===========================================================================
// SECTION: Final CTA
// ===========================================================================
function FinalCTA() {
  const { t } = useTranslation();
  return (
    <section className="ocean-gradient relative overflow-hidden py-24 sm:py-32">
      {/* Decorative */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute animate-float-gentle text-6xl opacity-15"
          style={{ left: "10%", top: "20%" }}
        >
          🏴‍☠️
        </div>
        <div
          className="absolute animate-float-gentle text-5xl opacity-10"
          style={{ right: "15%", bottom: "25%", animationDelay: "1s" }}
        >
          🪙
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-5 text-center">
        <FadeIn>
          <h2 className="mb-5 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            <BudouXText>{t("landing_final_title_lead")}</BudouXText>{" "}
            <span className="bg-gradient-to-r from-amber-300 to-yellow-200 bg-clip-text text-transparent">
              <BudouXText>{t("landing_final_title_highlight")}</BudouXText>
            </span>
          </h2>
          <p className="mb-10 text-lg text-white/90">
            <BudouXText>{t("landing_final_body")}</BudouXText>
          </p>
          <Link
            href="/sign-up"
            className="inline-block rounded-full bg-amber-500 px-10 py-4 text-lg font-bold text-gray-900 shadow-lg transition-all hover:bg-amber-400 hover:shadow-xl hover:scale-105 active:scale-95"
          >
            {t("landing_final_cta")} →
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}

// ===========================================================================
// SECTION: Footer
// ===========================================================================
function Footer() {
  const { t } = useTranslation();
  // F10 a11y: Lighthouse `color-contrast` was failing on these three links
  // and the copyright line. text-slate-{500,600} against bg-slate-900 fall
  // below WCAG AA 4.5:1; bumping to text-slate-200 / text-slate-300 clears
  // the gate (≥7:1 for normal text, well above AAA).
  return (
    <footer className="bg-slate-900 py-8">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="text-sm font-bold text-slate-200">
            🏴‍☠️ {t("landing_brand")}
          </span>
          <div className="flex gap-6 text-sm text-slate-200">
            <Link href="/sign-in" className="transition hover:text-amber-300">
              {t("landing_nav_sign_in")}
            </Link>
            <Link href="/sign-up" className="transition hover:text-amber-300">
              {t("landing_footer_sign_up")}
            </Link>
          </div>
          <span className="text-xs text-slate-300">
            {t("landing_footer_made_by")}
          </span>
        </div>
      </div>
    </footer>
  );
}

// ===========================================================================
// MAIN LANDING PAGE
// ===========================================================================
export function LandingPage() {
  // F10 a11y: Lighthouse `landmark-one-main` was failing because no
  // <main> existed on this route. The nav and footer are now siblings
  // and the body content is wrapped in a single <main>, giving screen
  // readers an unambiguous primary landmark to jump to.
  return (
    <div className="overflow-x-hidden">
      <Navbar />
      <main id="main">
        <HeroSection />
        <StatsStrip />
        <HowItWorks />
        <Wave fill="#0f172a" className="bg-white" />
        <ParentShowcase />
        <Wave fill="#ffffff" className="bg-slate-900" />
        <KidShowcase />
        <Wave fill="#f8fafc" className="bg-white" />
        <FeaturesGrid />
        <ChorePreview />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
