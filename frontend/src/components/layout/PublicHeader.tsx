import { Watch } from "lucide-react";
import { Link } from "@/i18n/routing";
import LanguageSwitcher from "./LanguageSwitcher";

/**
 * Genel (giriş gerektirmeyen) sayfalar için üst bar: logo + dil seçici.
 * Yasal sayfalar ve benzeri tekil sayfalarda kullanılır — dil değiştirici
 * uygulamanın her sayfasından erişilebilir olmalı.
 */
export default function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 glass-strong border-b border-border-subtle">
      <div className="mx-auto max-w-content flex items-center justify-between gap-4 px-4 sm:px-6 h-16">
        <Link href="/" className="flex items-center gap-3 min-w-0">
          <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-accent-blue/20 flex items-center justify-center">
            <Watch className="w-5 h-5 text-accent-blue" strokeWidth={1.5} />
          </span>
          <span className="text-lg font-bold tracking-tight text-primary-text truncate">
            WatchSync<span className="text-accent-blue"> AI</span>
          </span>
        </Link>
        <LanguageSwitcher variant="compact" />
      </div>
    </header>
  );
}
