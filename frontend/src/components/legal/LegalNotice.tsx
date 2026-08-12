import { getLocale, getTranslations } from "next-intl/server";

/**
 * Yasal metinlerin çevirisi bilgilendirme amaçlıdır; bağlayıcı olan Almanca
 * asıl metindir. Almanca görüntülenirken bu uyarı gösterilmez.
 */
export default async function LegalNotice() {
  const locale = await getLocale();
  if (locale === "de") return null;
  const t = await getTranslations("Legal");

  return (
    <p
      className="mt-10 rounded-xl border p-4 text-xs leading-relaxed"
      style={{
        borderColor: "rgba(255,255,255,0.08)",
        backgroundColor: "rgba(255,255,255,0.02)",
        color: "var(--ws-text-faint)",
      }}
    >
      {t("translation_disclaimer")}
    </p>
  );
}
