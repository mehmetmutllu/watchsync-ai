"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { useToastStore, type Toast as ToastType } from "@/stores/toastStore";

const TOAST_CONFIG = {
  success: {
    icon: CheckCircle2,
    bg: "bg-semantic-success/10 border-semantic-success/20",
    iconColor: "text-semantic-success",
  },
  error: {
    icon: XCircle,
    bg: "bg-semantic-error/10 border-semantic-error/20",
    iconColor: "text-semantic-error",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-semantic-warning/10 border-semantic-warning/20",
    iconColor: "text-semantic-warning",
  },
  info: {
    icon: Info,
    bg: "bg-semantic-info/10 border-semantic-info/20",
    iconColor: "text-semantic-info",
  },
} as const;

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastType;
  onDismiss: (id: string) => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const config = TOAST_CONFIG[toast.type];
  const Icon = config.icon;

  useEffect(() => {
    // Entrance animation
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 200);
  };

  return (
    <div
      className={`
        flex items-start gap-3 px-4 py-3
        bg-surface border ${config.bg} rounded-xl
        shadow-[var(--shadow-elevated)]
        backdrop-blur-lg
        transition-all duration-200 ease-out
        max-w-sm w-full
        ${isVisible && !isExiting ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
      `}
      role="alert"
    >
      <Icon
        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconColor}`}
        strokeWidth={1.5}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-primary-text">{toast.title}</p>
        {toast.message && (
          <p className="mt-0.5 text-xs text-secondary-text">{toast.message}</p>
        )}
      </div>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 p-0.5 text-disabled-text hover:text-primary-text transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  );
}
