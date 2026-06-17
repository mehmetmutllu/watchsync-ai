"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { ChangeEvent, useTransition } from "react";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const onSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = e.target.value;
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <div className="flex items-center gap-2 text-sm text-secondary-text hover:text-primary-text transition-colors">
      <Globe className="w-4 h-4" />
      <select
        defaultValue={locale}
        disabled={isPending}
        onChange={onSelectChange}
        className="bg-transparent outline-none cursor-pointer appearance-none"
      >
        <option value="en" className="bg-midnight">EN</option>
        <option value="tr" className="bg-midnight">TR</option>
        <option value="de" className="bg-midnight">DE</option>
      </select>
    </div>
  );
}
