"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

/**
 * Scroll-scrubbed hero that travels from the assembled watch INTO its mechanism.
 * A tall track pins two stacked clips: the watch face (phase A) and the movement
 * (phase B). Scroll position scrubs each clip's currentTime (every frame is a
 * keyframe -> smooth seeking) and cross-fades A -> B around the midpoint, so
 * scrolling reveals the mechanism. Four narrative beats fade across the journey.
 * No animation library. Reduced-motion / no-JS: posters show, beats stay legible.
 */
export default function VideoScrollytelling() {
  const t = useTranslations("Landing");
  const trackRef = useRef<HTMLDivElement>(null);
  const faceRef = useRef<HTMLVideoElement>(null);
  const moveRef = useRef<HTMLVideoElement>(null);
  const beatsRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const face = faceRef.current;
    const move = moveRef.current;
    const beatsEl = beatsRef.current;
    if (!track || !face || !move || !beatsEl) return;

    const beats = Array.from(beatsEl.querySelectorAll<HTMLElement>("[data-beat]"));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
    // smoothstep for the A->B crossfade
    const smooth = (edge0: number, edge1: number, x: number) => {
      const tt = clamp01((x - edge0) / (edge1 - edge0));
      return tt * tt * (3 - 2 * tt);
    };
    // one beat fully visible mid-segment, quick clean handoff at boundaries
    const beatOpacity = (i: number, n: number, p: number) => {
      const seg = 1 / n;
      const d = Math.abs(p - seg * (i + 0.5));
      const inner = seg * 0.32;
      const outer = seg * 0.5;
      if (d <= inner) return 1;
      if (d >= outer) return 0;
      return 1 - (d - inner) / (outer - inner);
    };

    const paintBeats = (p: number) => {
      const n = beats.length;
      beats.forEach((b, i) => {
        const o = i === 0 && p < 0.05 ? 1 : beatOpacity(i, n, p);
        b.style.opacity = o.toFixed(3);
        b.style.pointerEvents = o > 0.55 ? "auto" : "none";
      });
      if (progressRef.current) {
        progressRef.current.textContent = String(Math.round(p * 100)).padStart(3, "0");
      }
    };

    if (reduced) {
      paintBeats(0);
      return;
    }

    let durA = 0;
    let durB = 0;
    let raf = 0;
    const onMetaA = () => (durA = face.duration || 0);
    const onMetaB = () => (durB = move.duration || 0);
    face.addEventListener("loadedmetadata", onMetaA);
    move.addEventListener("loadedmetadata", onMetaB);
    if (face.readyState >= 1) onMetaA();
    if (move.readyState >= 1) onMetaB();

    const seek = (v: HTMLVideoElement, time: number) => {
      if (Math.abs(v.currentTime - time) > 0.015) v.currentTime = time;
    };

    const update = () => {
      raf = 0;
      const rect = track.getBoundingClientRect();
      const total = track.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
      const p = total > 0 ? scrolled / total : 0;

      const blend = smooth(0.44, 0.58, p); // 0 = face, 1 = movement
      move.style.opacity = blend.toFixed(3);
      face.style.opacity = (1 - blend).toFixed(3);
      // slight blur through the crossover masks the swap
      const mid = 1 - Math.abs(blend - 0.5) * 2; // 1 at the crossover
      const blur = (mid * 6).toFixed(2);
      face.style.filter = move.style.filter = `blur(${blur}px)`;

      if (durA > 0 && blend < 0.999) {
        const pa = clamp01(p / 0.5);
        seek(face, Math.min(pa * durA, durA - 0.05));
      }
      if (durB > 0 && blend > 0.001) {
        const pb = clamp01((p - 0.5) / 0.5);
        seek(move, Math.min(pb * durB, durB - 0.05));
      }

      paintBeats(p);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      face.removeEventListener("loadedmetadata", onMetaA);
      move.removeEventListener("loadedmetadata", onMetaB);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={trackRef} className="ws-vhero-track">
      <div className="ws-vhero-pin">
        <video
          ref={faceRef}
          className="ws-vhero-video"
          src="/media/watch-hero-scrub.mp4"
          poster="/media/watch-hero-poster.jpg"
          muted
          playsInline
          preload="auto"
          aria-hidden
        />
        <video
          ref={moveRef}
          className="ws-vhero-video"
          style={{ opacity: 0 }}
          src="/media/watch-movement-scrub.mp4"
          poster="/media/watch-movement-poster.jpg"
          muted
          playsInline
          preload="auto"
          aria-hidden
        />
        <div className="ws-vhero-scrim" />

        <div ref={beatsRef} className="ws-vhero-beats mx-auto max-w-7xl px-6 lg:px-12">
          {/* Beat 1 — the watch */}
          <div data-beat className="ws-vbeat">
            <span className="ws-eyebrow" data-live>
              {t("hero_status")}
            </span>
            <h1 className="ws-display mt-6 text-4xl sm:text-6xl lg:text-7xl">
              {t("hero_title_1")}
              <br />
              <span style={{ color: "var(--ws-amber)" }}>{t("hero_title_2")}</span>
            </h1>
            <p className="ws-vbeat-sub">{t("hero_desc")}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="ws-btn ws-btn-primary">
                {t("btn_trial")}
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Link>
              <Link href="/login" className="ws-btn ws-btn-ghost">
                {t("nav_start")}
              </Link>
            </div>
          </div>

          {/* Beat 2 — AI grading (still on the face) */}
          <div data-beat className="ws-vbeat">
            <span className="ws-eyebrow">{t("part_dial")}</span>
            <h2 className="ws-display mt-6 text-3xl sm:text-5xl lg:text-6xl">{t("beat2_title")}</h2>
            <p className="ws-vbeat-sub">{t("f1_desc")}</p>
          </div>

          {/* Beat 3 — into the mechanism / sync */}
          <div data-beat className="ws-vbeat">
            <span className="ws-eyebrow">{t("part_movement")}</span>
            <h2 className="ws-display mt-6 text-3xl sm:text-5xl lg:text-6xl">{t("beat3_title")}</h2>
            <p className="ws-vbeat-sub">{t("sync_desc")}</p>
          </div>

          {/* Beat 4 — the guarantee, deep in the movement */}
          <div data-beat className="ws-vbeat">
            <span className="ws-eyebrow">{t("part_caseback")}</span>
            <h2 className="ws-display mt-6 text-3xl sm:text-5xl lg:text-6xl">{t("beat4_title")}</h2>
            <p className="ws-vbeat-sub">{t("trust_point1_d")}</p>
            <div className="mt-9">
              <Link href="/register" className="ws-btn ws-btn-primary">
                {t("cta_btn")}
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            </div>
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
