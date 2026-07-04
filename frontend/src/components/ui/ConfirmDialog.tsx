"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useConfirmStore } from "@/stores/confirmStore";

export default function ConfirmDialog() {
  const t = useTranslations("Common");
  const open = useConfirmStore((s) => s.open);
  const options = useConfirmStore((s) => s.options);
  const respond = useConfirmStore((s) => s.respond);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") respond(false);
      if (e.key === "Enter") respond(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, respond]);

  if (!open || !options) return null;

  const { title, message, confirmLabel, cancelLabel, danger } = options;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={() => respond(false)}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-sm bg-surface border border-border-subtle rounded-2xl shadow-[var(--shadow-elevated)] p-6 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              danger ? "bg-semantic-error/10 text-semantic-error" : "bg-accent-blue/10 text-accent-blue"
            }`}
          >
            <AlertTriangle className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-primary-text">{title}</h2>
            {message && <p className="mt-1 text-sm text-secondary-text">{message}</p>}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={() => respond(false)}
            className="px-4 py-2 text-sm font-medium text-secondary-text hover:text-primary-text hover:bg-surface-elevated rounded-lg transition-colors"
          >
            {cancelLabel ?? t("cancel")}
          </button>
          <button
            onClick={() => respond(true)}
            autoFocus
            className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors ${
              danger ? "bg-semantic-error hover:bg-semantic-error/90" : "bg-accent-blue hover:bg-accent-blue/90"
            }`}
          >
            {confirmLabel ?? t("confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
