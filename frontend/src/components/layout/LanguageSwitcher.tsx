"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/routing";
import { localeList, type Locale } from "@/i18n/config";
import { Check, ChevronDown, Globe, Loader2 } from "lucide-react";

type Variant = "full" | "compact" | "inline";

interface LanguageSwitcherProps {
  /**
   * full    → geniş buton (kenar çubuğu)
   * compact → sadece ikon + kod (üst bar, mobil)
   * inline  → çerçevesiz metin (footer, giriş sayfaları)
   */
  variant?: Variant;
  className?: string;
  /** Menü yukarı doğru açılsın (alt kenara yakın yerlerde) */
  dropUp?: boolean;
}

export default function LanguageSwitcher({
  variant = "full",
  className = "",
  dropUp = false,
}: LanguageSwitcherProps) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const t = useTranslations("LanguageSwitcher");
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const current = localeList.find((l) => l.code === locale) ?? localeList[0];

  // Dışarı tıklama + Escape ile kapat
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const change = (next: Locale) => {
    setOpen(false);
    if (next === locale) return;
    // Sorgu dizesi doğrudan adres çubuğundan okunur: useSearchParams() kullanmak
    // bu bileşeni içeren tüm statik sayfaları CSR'a düşürüyor ve build'i kırıyordu
    // ("useSearchParams() should be wrapped in a suspense boundary").
    const query = typeof window !== "undefined" ? window.location.search : "";
    const target = query ? `${pathname}${query}` : pathname;
    startTransition(() => {
      // params: dinamik segmentli rotalarda ([id], [token]) doğru URL'i kurar
      router.replace(
        // @ts-expect-error — dinamik rotalarda pathname string olarak geçilir
        { pathname: target, params },
        { locale: next, scroll: false }
      );
      router.refresh();
    });
  };

  const triggerClass =
    variant === "full"
      ? "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm text-secondary-text hover:text-primary-text hover:bg-surface-elevated transition-colors"
      : variant === "compact"
      ? "flex items-center gap-1.5 h-11 px-2.5 rounded-lg text-sm text-secondary-text hover:text-primary-text hover:bg-surface-elevated transition-colors"
      : "flex items-center gap-1.5 text-sm text-secondary-text hover:text-primary-text transition-colors";

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("aria_label", { language: current.nativeName })}
        title={t("choose")}
        className={triggerClass}
      >
        <span className="flex items-center gap-2 min-w-0">
          {isPending ? (
            <Loader2 className="w-4 h-4 shrink-0 animate-spin" strokeWidth={1.5} />
          ) : (
            <Globe className="w-4 h-4 shrink-0" strokeWidth={1.5} />
          )}
          {variant === "full" ? (
            <span className="truncate">{current.nativeName}</span>
          ) : (
            <span className="font-medium">{current.short}</span>
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t("choose")}
          className={`absolute z-[60] min-w-[190px] end-0 ${
            dropUp ? "bottom-full mb-2" : "top-full mt-2"
          } rounded-xl border border-border-subtle bg-surface-elevated shadow-[var(--shadow-elevated)] p-1 animate-fade-in`}
        >
          {localeList.map((l) => {
            const active = l.code === locale;
            return (
              <li key={l.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  lang={l.code}
                  dir={l.dir}
                  onClick={() => change(l.code)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-start transition-colors ${
                    active
                      ? "bg-accent-blue/10 text-accent-blue"
                      : "text-secondary-text hover:bg-surface hover:text-primary-text"
                  }`}
                >
                  <span aria-hidden="true" className="text-base leading-none">
                    {l.flag}
                  </span>
                  <span className="flex-1 truncate">{l.nativeName}</span>
                  <span className="text-[11px] tabular-nums opacity-60">{l.short}</span>
                  {active && <Check className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
