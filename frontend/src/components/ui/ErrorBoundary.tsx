"use client";

import { Component, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback error={this.state.error} onRetry={this.handleRetry} />
      );
    }

    return this.props.children;
  }
}

/**
 * Hata ekranı ayrı bir fonksiyon bileşeni: sınıf bileşenlerinde hook
 * kullanılamadığı için çeviriler burada alınır.
 */
function ErrorFallback({
  error,
  onRetry,
}: {
  error: Error | null;
  onRetry: () => void;
}) {
  const t = useTranslations("ErrorBoundary");

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-8">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-semantic-error/10 mb-4">
        <AlertTriangle className="w-8 h-8 text-semantic-error" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-semibold text-primary-text mb-2">{t("title")}</h3>
      <p className="text-sm text-secondary-text text-center max-w-md mb-6">
        {t("description")}
      </p>
      {process.env.NODE_ENV === "development" && error && (
        <pre
          dir="ltr"
          className="mb-4 px-4 py-3 bg-surface-elevated rounded-lg text-xs text-semantic-error max-w-lg overflow-auto font-mono"
        >
          {error.message}
        </pre>
      )}
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent-blue text-white text-sm font-medium rounded-lg
          hover:bg-accent-blue-hover transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
      >
        <RefreshCw className="w-4 h-4" />
        {t("retry")}
      </button>
    </div>
  );
}
