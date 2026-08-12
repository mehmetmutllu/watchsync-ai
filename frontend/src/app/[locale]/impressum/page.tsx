import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import PublicHeader from "@/components/layout/PublicHeader";
import LegalNotice from "@/components/legal/LegalNotice";
import "../landing.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Imprint" });
  return { title: `${t("title")} — WatchSync AI`, robots: { index: true, follow: true } };
}

export default async function ImpressumPage() {
  const t = await getTranslations("Imprint");
  const tc = await getTranslations("Legal");

  const cardStyle = {
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.02)",
  } as const;

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
            <section className="rounded-xl border p-6" style={cardStyle}>
              <h2 className="ws-display mb-3 text-lg" style={{ color: "var(--ws-text)" }}>
                {t("company_heading")}
              </h2>
              <p>
                <strong>WatchSync AI Technologies GmbH i.G.</strong>
                <br />
                Königsallee 60
                <br />
                40212 Düsseldorf
                <br />
                {t("country")}
              </p>
            </section>

            <section className="rounded-xl border p-6" style={cardStyle}>
              <h2 className="ws-display mb-3 text-lg" style={{ color: "var(--ws-text)" }}>
                {t("management_heading")}
              </h2>
              <p>{t("managing_director", { name: "Berat Yilmaz" })}</p>
            </section>

            <section className="rounded-xl border p-6" style={cardStyle}>
              <h2 className="ws-display mb-3 text-lg" style={{ color: "var(--ws-text)" }}>
                {t("contact_heading")}
              </h2>
              <p>
                <span className="ltr-nums" dir="ltr">
                  {t("email_label")}: support@watchsync.ai / legal@watchsync.ai
                  <br />
                  {t("phone_label")}: +49 (0) 211 9876543
                  <br />
                  {t("web_label")}: https://watchsync.ai
                </span>
              </p>
            </section>

            <section className="rounded-xl border p-6" style={cardStyle}>
              <h2 className="ws-display mb-3 text-lg" style={{ color: "var(--ws-text)" }}>
                {t("registry_heading")}
              </h2>
              <p>
                {t("registry_court")}: Amtsgericht Düsseldorf, HRB 98765
                <br />
                {t("vat_id")}: DE 345 678 901
              </p>
            </section>

            <section className="rounded-xl border p-6" style={cardStyle}>
              <h2 className="ws-display mb-3 text-lg" style={{ color: "var(--ws-text)" }}>
                {t("liability_heading")}
              </h2>
              <p>
                {t("liability_before")}{" "}
                <Link href="/agb" className="underline text-blue-400">
                  {t("terms_link")}
                </Link>{" "}
                {t("liability_and")}{" "}
                <Link href="/datenschutz" className="underline text-blue-400">
                  {t("privacy_link")}
                </Link>{" "}
                {t("liability_after")}
              </p>
            </section>
          </div>

          <LegalNotice />
        </div>
      </div>
    </>
  );
}
