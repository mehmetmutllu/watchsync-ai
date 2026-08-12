import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import PublicHeader from "@/components/layout/PublicHeader";
import LegalNotice from "@/components/legal/LegalNotice";
import "../landing.css";

const SECTION_COUNT = 7;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Privacy" });
  return { title: `${t("title")} — WatchSync AI`, robots: { index: true, follow: true } };
}

export default async function DatenschutzPage() {
  const t = await getTranslations("Privacy");
  const tc = await getTranslations("Legal");

  const sections = Array.from({ length: SECTION_COUNT }, (_, i) => ({
    id: i + 1,
    title: t(`s${i + 1}_title`),
    body: t(`s${i + 1}_body`),
  }));

  return (
    <>
      <PublicHeader />
      <div className="ws-landing min-h-screen px-6 py-16 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/"
            className="ws-mono text-xs tracking-[0.15em] uppercase hover:underline"
            style={{ color: "var(--ws-text-dim)" }}
          >
            {tc("back_home")}
          </Link>
          <h1 className="ws-display mt-8 text-4xl">{t("title")}</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--ws-text-dim)" }}>
            {t("subtitle")}
          </p>

          <div
            className="mt-10 flex flex-col gap-8 text-sm leading-relaxed"
            style={{ color: "var(--ws-text-dim)" }}
          >
            {sections.map((s) => (
              <section
                key={s.id}
                className="rounded-xl border p-6"
                style={{
                  borderColor: "rgba(255,255,255,0.08)",
                  backgroundColor: "rgba(255,255,255,0.02)",
                }}
              >
                <h2 className="ws-display mb-3 text-lg" style={{ color: "var(--ws-text)" }}>
                  {s.id}. {s.title}
                </h2>
                <p className="whitespace-pre-line">{s.body}</p>
              </section>
            ))}
          </div>

          <LegalNotice />
        </div>
      </div>
    </>
  );
}
