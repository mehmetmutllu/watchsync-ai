import type { Metadata } from "next";
import Link from "next/link";
import "../landing.css";

export const metadata: Metadata = {
  title: "Datenschutzerklärung — WatchSync AI",
  robots: { index: false },
};

// DSGVO-Gerüst; [..]-Platzhalter werden vor dem Livegang befüllt und der
// Text von einer fachkundigen Stelle geprüft.
export default function DatenschutzPage() {
  const sections = [
    {
      t: "1. Verantwortlicher",
      p: "Verantwortlich für die Datenverarbeitung auf dieser Website ist: [Firmenname, Anschrift, E-Mail]. Siehe auch unser Impressum.",
    },
    {
      t: "2. Welche Daten wir verarbeiten",
      p: "Bei der Nutzung von WatchSync verarbeiten wir Konto- und Bestandsdaten, die Sie selbst eingeben (z. B. Uhren, Preise, Kundendaten), sowie technische Zugriffsdaten (IP-Adresse, Zeitpunkt, Browser), die zur sicheren Bereitstellung des Dienstes erforderlich sind.",
    },
    {
      t: "3. Zwecke und Rechtsgrundlagen",
      p: "Die Verarbeitung erfolgt zur Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO), zur Wahrung berechtigter Interessen wie Sicherheit und Missbrauchsvermeidung (Art. 6 Abs. 1 lit. f DSGVO) und — soweit erteilt — auf Grundlage Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO).",
    },
    {
      t: "4. Marktplatz-Anbindungen",
      p: "Wenn Sie eBay, Chrono24 oder Shopify verbinden, werden Angebots- und Bestandsdaten zwischen WatchSync und dem jeweiligen Marktplatz übertragen. Es gelten zusätzlich die Datenschutzbestimmungen des jeweiligen Anbieters.",
    },
    {
      t: "5. Speicherdauer",
      p: "Wir speichern personenbezogene Daten nur so lange, wie es für die genannten Zwecke erforderlich ist oder gesetzliche Aufbewahrungspflichten bestehen.",
    },
    {
      t: "6. Ihre Rechte",
      p: "Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit sowie Widerspruch (Art. 15–21 DSGVO). Außerdem können Sie sich bei einer Aufsichtsbehörde beschweren.",
    },
    {
      t: "7. Kontakt",
      p: "Für Datenschutzanfragen erreichen Sie uns unter: hello@watchsync.ai",
    },
  ];

  return (
    <div className="ws-landing min-h-screen px-6 py-24 lg:px-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="ws-mono text-xs tracking-[0.15em] uppercase" style={{ color: "var(--ws-text-dim)" }}>
          ← WatchSync AI
        </Link>
        <h1 className="ws-display mt-8 text-4xl">Datenschutzerklärung</h1>

        <div className="mt-10 flex flex-col gap-8 text-sm leading-relaxed" style={{ color: "var(--ws-text-dim)" }}>
          {sections.map((s) => (
            <section key={s.t}>
              <h2 className="ws-display mb-3 text-lg" style={{ color: "var(--ws-text)" }}>{s.t}</h2>
              <p>{s.p}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
