"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

/**
 * Split-stage scrollytelling (canonical Pudding/NYT layout): the watch video
 * is pinned on the right, short narrative steps live in a reserved left
 * column, so copy and visual never share space. Scroll scrubs the single
 * all-keyframe video through a piecewise timeline with dwell phases: the
 * frame holds still while a step reads, then plays to the next key pose.
 * On small screens the split turns vertical: video on top, copy in its own
 * band below. No animation library.
 */

// Source video geometry (watch-journey.mp4)
const VIDEO_W = 1280;
const VIDEO_H = 720;
// The watch occupies roughly this box centered in the frame (px in frame space)
const WATCH_W = 430;

// [pStart, pEnd, tStart, tEnd] — scroll fraction -> video time fraction.
// Gaps between rows are dwells (frame holds at previous tEnd).
const TIMELINE: ReadonlyArray<readonly [number, number, number, number]> = [
  [0.1, 0.28, 0.0, 0.2496], // front -> three-quarter angle
  [0.34, 0.5, 0.2496, 0.4992], // explode into components
  [0.56, 0.72, 0.4992, 0.7488], // reassemble
  [0.78, 0.94, 0.7488, 1.0], // flip to caseback
];

// Step visibility: [fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd]
const STEP_WINDOWS: ReadonlyArray<readonly [number, number, number, number]> = [
  [0, 0, 0.24, 0.29],
  [0.3, 0.35, 0.5, 0.55],
  [0.56, 0.61, 0.74, 0.79],
  [0.81, 0.86, 1.01, 1.02],
];

const MOBILE_BP = 860;

export default function WatchScrollytelling() {
  const t = useTranslations("Landing");
  const trackRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const colRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const video = videoRef.current;
    const col = colRef.current;
    if (!track || !video || !col) return;

    const steps = Array.from(col.querySelectorAll<HTMLElement>("[data-step]"));
    const ticks = railRef.current
      ? Array.from(railRef.current.querySelectorAll<HTMLElement>("[data-tick]"))
      : [];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
    const stepOpacity = (i: number, p: number) => {
      const [inS, inE, outS, outE] = STEP_WINDOWS[i];
      if (p <= inS) return i === 0 ? 1 : 0;
      if (p < inE) return (p - inS) / (inE - inS);
      if (p <= outS) return 1;
      if (p < outE) return 1 - (p - outS) / (outE - outS);
      return 0;
    };
    const paintSteps = (p: number) => {
      let active = 0;
      steps.forEach((s, i) => {
        const o = stepOpacity(i, p);
        if (o > 0.55) active = i;
        s.style.opacity = o.toFixed(3);
        s.style.transform = `translateY(${((1 - o) * 14).toFixed(1)}px)`;
        s.style.pointerEvents = o > 0.55 ? "auto" : "none";
      });
      ticks.forEach((tk, i) => tk.setAttribute("data-active", i === active ? "1" : "0"));
      if (progressRef.current) {
        progressRef.current.textContent = String(Math.round(p * 100)).padStart(3, "0");
      }
    };

    if (reduced) {
      paintSteps(0);
      return;
    }

    // Mobile gets the lighter encode; swap before metadata loads.
    if (window.innerWidth < MOBILE_BP) {
      video.src = "/media/scrolly/watch-journey-sm.mp4";
      video.load();
    }

    const timeAt = (p: number) => {
      let tf = 0;
      for (const [ps, pe, ts, te] of TIMELINE) {
        if (p >= pe) tf = te;
        else if (p > ps) {
          tf = ts + ((p - ps) / (pe - ps)) * (te - ts);
          break;
        } else break;
      }
      return tf;
    };

    let duration = 0;
    const onMeta = () => (duration = video.duration || 0);
    video.addEventListener("loadedmetadata", onMeta);
    if (video.readyState >= 1) onMeta();

    let mobile = false;
    let scale = 1;
    let shiftX = 0;
    let shiftY = 0;
    const measure = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      mobile = vw < MOBILE_BP;
      if (mobile) {
        // vertical split: watch centered in the top ~62% of the viewport
        scale = Math.min((vw * 0.94) / WATCH_W, (vh * 0.62) / VIDEO_H);
        scale = Math.max(scale, (vh * 0.5) / VIDEO_H);
        shiftX = 0;
        shiftY = -vh * 0.21;
      } else {
        // horizontal split: watch centered in the space right of the column
        const colW = col.offsetWidth + col.offsetLeft;
        const right = vw - colW;
        scale = Math.min(vh / VIDEO_H, (right * 0.92) / WATCH_W);
        shiftX = colW + right / 2 - vw / 2;
        shiftY = 0;
      }
      video.style.transform = `translate(calc(-50% + ${shiftX.toFixed(1)}px), calc(-50% + ${shiftY.toFixed(1)}px)) scale(${scale.toFixed(4)})`;
    };
    measure();

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = track.getBoundingClientRect();
      const total = track.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
      const p = total > 0 ? scrolled / total : 0;

      if (duration > 0) {
        const target = Math.min(timeAt(clamp01(p)) * duration, duration - 0.05);
        if (Math.abs(video.currentTime - target) > 0.02) video.currentTime = target;
      }
      paintSteps(p);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onResize = () => {
      measure();
      onScroll();
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      video.removeEventListener("loadedmetadata", onMeta);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const steps = [
    {
      eyebrow: t("hero_status"),
      live: true,
      title: (
        <h1 className="ws-display mt-5 text-4xl sm:text-5xl xl:text-6xl">
          {t("hero_title_1")}
          <br />
          <span style={{ color: "var(--ws-amber)" }}>{t("hero_title_2")}</span>
        </h1>
      ),
      line: t("hero_desc"),
      cta: (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/register" className="ws-btn ws-btn-primary">
            {t("btn_trial")}
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
          <Link href="/login" className="ws-btn ws-btn-ghost">
            {t("nav_start")}
          </Link>
        </div>
      ),
    },
    {
      eyebrow: t("part_dial"),
      title: <h2 className="ws-display mt-5 text-3xl sm:text-4xl xl:text-5xl">{t("beat2_title")}</h2>,
      line: t("beat2_line"),
    },
    {
      eyebrow: t("part_movement"),
      title: <h2 className="ws-display mt-5 text-3xl sm:text-4xl xl:text-5xl">{t("beat3_title")}</h2>,
      line: t("beat3_line"),
    },
    {
      eyebrow: t("part_caseback"),
      title: <h2 className="ws-display mt-5 text-3xl sm:text-4xl xl:text-5xl">{t("beat4_title")}</h2>,
      line: t("beat4_line"),
      cta: (
        <div className="mt-8">
          <Link href="/register" className="ws-btn ws-btn-primary">
            {t("cta_btn")}
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div ref={trackRef} className="ws-vhero-track">
      <div className="ws-vhero-pin">
        <video
          ref={videoRef}
          className="ws-vj-video"
          src="/media/scrolly/watch-journey.mp4"
          poster="/media/scrolly/journey-poster.jpg"
          muted
          playsInline
          preload="auto"
          aria-hidden
        />
        <div className="ws-vj-scrim" />

        <div ref={colRef} className="ws-vj-col">
          <div className="ws-vj-steps">
            {steps.map((s, i) => (
              <div key={i} data-step className="ws-vj-step">
                <span className="ws-eyebrow" data-live={s.live || undefined}>
                  {s.eyebrow}
                </span>
                {s.title}
                <p className="ws-vj-line">{s.line}</p>
                {s.cta}
              </div>
            ))}
          </div>
          <div ref={railRef} className="ws-vj-rail ws-mono" aria-hidden>
            {["01", "02", "03", "04"].map((n, i) => (
              <span key={n} data-tick data-active={i === 0 ? "1" : "0"}>
                {n}
              </span>
            ))}
          </div>
        </div>

        <div className="ws-vhero-hud ws-mono">
          <span>{t("scroll_hint")}</span>
          <span style={{ color: "var(--ws-amber)" }}>
            <span ref={progressRef}>000</span>%
          </span>
        </div>
      </div>
    </div>
  );
}
