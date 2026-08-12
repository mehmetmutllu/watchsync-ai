"use client";

import { Link } from "@/i18n/routing";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

/**
 * Split-stage scrollytelling (canonical Pudding/NYT layout): the watch is
 * pinned on the right, short narrative steps live in a reserved left column,
 * so copy and visual never share space. Scroll drives an Apple-style JPEG
 * frame sequence drawn to a canvas — no <video> scrubbing, which mobile
 * browsers (autoplay/seek policies) make unreliable. A piecewise timeline
 * adds dwell phases: the frame holds still while a step reads, then plays to
 * the next key pose. On small screens the split turns vertical: watch on
 * top, copy in its own band below. No animation library.
 */

// Stage plane geometry (frames are 16:9, positioned as a 1280x720 plane)
const VIDEO_W = 1280;
const VIDEO_H = 720;
// The watch occupies roughly this box centered in the frame (px in frame space)
const WATCH_W = 430;

const FRAME_COUNT = 234;
const framePath = (i: number, sm: boolean) =>
  `/media/scrolly/${sm ? "frames-sm" : "frames"}/f${String(i + 1).padStart(3, "0")}.webp`;

// [pStart, pEnd, tStart, tEnd] — scroll fraction -> frame-sequence fraction.
// Play rows are eased (smoothstep). The narrow rows spanning each dwell are
// "bridges": they dissolve across the hard cut between source clips (frames
// 53->54, 113->114, 173->174 of 234) over the whole dwell, so the tiny pose
// mismatch between AI-generated clips is never visible as a jump.
const TIMELINE: ReadonlyArray<readonly [number, number, number, number]> = [
  [0.02, 0.24, 0.0, 0.2275], // front -> three-quarter angle
  [0.24, 0.32, 0.2275, 0.2318], // bridge cut 1
  [0.32, 0.5, 0.2318, 0.485], // explode into components
  [0.5, 0.57, 0.485, 0.4893], // bridge cut 2
  [0.57, 0.73, 0.4893, 0.7425], // reassemble
  [0.73, 0.79, 0.7425, 0.7468], // bridge cut 3
  [0.79, 0.94, 0.7468, 1.0], // flip to caseback
];

// Step visibility: [fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd]
const STEP_WINDOWS: ReadonlyArray<readonly [number, number, number, number]> = [
  [0, 0, 0.2, 0.25],
  [0.26, 0.31, 0.5, 0.55],
  [0.57, 0.62, 0.74, 0.79],
  [0.81, 0.86, 1.01, 1.02],
];

const MOBILE_BP = 860;

export default function WatchScrollytelling() {
  const t = useTranslations("Landing");
  const trackRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const canvas = canvasRef.current;
    const col = colRef.current;
    if (!track || !canvas || !col) return;

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

    const timeAt = (p: number) => {
      let tf = 0;
      for (const [ps, pe, ts, te] of TIMELINE) {
        if (p >= pe) tf = te;
        else if (p > ps) {
          // smoothstep: velocity ramps from/to zero, so dwells melt into motion
          let u = (p - ps) / (pe - ps);
          u = u * u * (3 - 2 * u);
          tf = ts + u * (te - ts);
          break;
        } else break;
      }
      return tf;
    };

    const sm = window.innerWidth < MOBILE_BP;
    canvas.width = sm ? 768 : 1536;
    canvas.height = sm ? 432 : 864;
    const ctx = canvas.getContext("2d");

    const imgs: HTMLImageElement[] = [];
    const ready: boolean[] = new Array(FRAME_COUNT).fill(false);
    let targetPos = 0; // fractional frame position
    let lastDrawn = "";

    // Cross-blend the two frames around the fractional position — synthesizes
    // in-between frames so 6fps stepping reads as continuous motion. Falls
    // back to the closest loaded frame while the sequence is still arriving.
    const drawBest = () => {
      if (!ctx) return;
      const i0 = Math.min(Math.floor(targetPos), FRAME_COUNT - 1);
      const i1 = Math.min(i0 + 1, FRAME_COUNT - 1);
      const frac = targetPos - i0;
      if (ready[i0] && ready[i1]) {
        const key = `${i0}:${frac.toFixed(2)}`;
        if (key === lastDrawn) return;
        ctx.globalAlpha = 1;
        ctx.drawImage(imgs[i0], 0, 0, canvas.width, canvas.height);
        if (i1 !== i0 && frac > 0.01) {
          ctx.globalAlpha = frac;
          ctx.drawImage(imgs[i1], 0, 0, canvas.width, canvas.height);
          ctx.globalAlpha = 1;
        }
        lastDrawn = key;
        return;
      }
      let idx = -1;
      for (let i = i0; i >= 0; i--) {
        if (ready[i]) {
          idx = i;
          break;
        }
      }
      if (idx === -1 || String(idx) === lastDrawn) return;
      ctx.drawImage(imgs[idx], 0, 0, canvas.width, canvas.height);
      lastDrawn = String(idx);
    };

    for (let i = 0; i < FRAME_COUNT; i++) {
      const im = new Image();
      im.decoding = "async";
      im.onload = () => {
        ready[i] = true;
        drawBest();
      };
      im.src = framePath(i, sm);
      imgs.push(im);
    }

    let mobile = false;
    let scale = 1;
    let shiftX = 0;
    let shiftY = 0;
    const measure = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      mobile = vw < MOBILE_BP;
      if (mobile) {
        // vertical split: watch centered in the top ~54% so it clears the copy band
        scale = Math.min((vw * 0.82) / WATCH_W, (vh * 0.52) / VIDEO_H);
        scale = Math.max(scale, (vh * 0.42) / VIDEO_H);
        shiftX = 0;
        shiftY = -vh * 0.23;
      } else {
        // horizontal split: watch centered in the space beside the copy column.
        // RTL'de kopya sütunu sağa geçer, bu yüzden kaydırma aynalanır.
        const rtl = document.documentElement.dir === "rtl";
        const colW = col.offsetWidth + (rtl ? vw - col.offsetLeft - col.offsetWidth : col.offsetLeft);
        const free = vw - colW;
        scale = Math.min(vh / VIDEO_H, (free * 0.92) / WATCH_W);
        shiftX = colW + free / 2 - vw / 2;
        if (rtl) shiftX = -shiftX;
        shiftY = 0;
      }
      canvas.style.transform = `translate(calc(-50% + ${shiftX.toFixed(1)}px), calc(-50% + ${shiftY.toFixed(1)}px)) scale(${scale.toFixed(4)})`;
    };
    measure();

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = track.getBoundingClientRect();
      const total = track.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
      const p = total > 0 ? scrolled / total : 0;

      targetPos = timeAt(clamp01(p)) * (FRAME_COUNT - 1);
      drawBest();
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
      imgs.forEach((im) => (im.onload = null));
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
        <canvas ref={canvasRef} className="ws-vj-video" width={1536} height={864} aria-hidden />
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
