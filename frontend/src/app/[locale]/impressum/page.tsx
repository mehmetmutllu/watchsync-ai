import type { Metadata } from "next";
import Link from "next/link";
import "../landing.css";

export const metadata: Metadata = {
  title: "Impressum — WatchSync AI",
  robots: { index: false },
};

// Rechtstext ist bewusst nur auf Deutsch (Pflichtangaben nach § 5 TMG).
// [..]-Platzhalter werden vor dem Livegang mit den Firmendaten befüllt.
export default function ImpressumPage() {
  return (
    <div className="ws-landing min-h-screen px-6 py-24 lg:px-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="ws-mono text-xs tracking-[0.15em] uppercase" style={{ color: "var(--ws-text-dim)" }}>
          ← WatchSync AI
        </Link>
        <h1 className="ws-display mt-8 text-4xl">Impressum</h1>

        <div className="mt-10 flex flex-col gap-8 text-sm leading-relaxed" style={{ color: "var(--ws-text-dim)" }}>
          <section>
            <h2 className="ws-display mb-3 text-lg" style={{ color: "var(--ws-text)" }}>Angaben gemäß § 5 TMG</h2>
            <p>
              [Firmenname]<br />
              [Straße und Hausnummer]<br />
              [PLZ und Ort]<br />
              Deutschland
            </p>
          </section>
          <section>
            <h2 className="ws-display mb-3 text-lg" style={{ color: "var(--ws-text)" }}>Vertreten durch</h2>
            <p>[Name der vertretungsberechtigten Person]</p>
          </section>
          <section>
            <h2 className="ws-display mb-3 text-lg" style={{ color: "var(--ws-text)" }}>Kontakt</h2>
            <p>
              E-Mail: hello@watchsync.ai<br />
              Telefon: [Telefonnummer]
            </p>
          </section>
          <section>
            <h2 className="ws-display mb-3 text-lg" style={{ color: "var(--ws-text)" }}>Registereintrag</h2>
            <p>
              Handelsregister: [Registergericht, Registernummer]<br />
              Umsatzsteuer-ID gemäß § 27a UStG: [USt-IdNr.]
            </p>
          </section>
          <section>
            <h2 className="ws-display mb-3 text-lg" style={{ color: "var(--ws-text)" }}>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
            <p>[Name, Anschrift]</p>
          </section>
        </div>
      </div>
    </div>
  );
}
