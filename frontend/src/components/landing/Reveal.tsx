"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Fades + lifts its children into view once, via IntersectionObserver.
 * The visual transition lives in landing.css ([data-reveal] / [data-inview]);
 * reduced-motion users get the content immediately (handled in CSS too).
 */
export default function Reveal({
  children,
  className,
  delay,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: 1 | 2 | 3 | 4 | 5;
  as?: "div" | "section" | "li" | "article";
}) {
  const ref = useRef<HTMLElement>(null);
  const [inview, setInview] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setInview(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Tag = as as "div";
  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement>}
      data-reveal=""
      data-reveal-delay={delay}
      data-inview={inview ? "" : undefined}
      className={className}
    >
      {children}
    </Tag>
  );
}
