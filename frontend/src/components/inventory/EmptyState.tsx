'use client';

import { Plus } from 'lucide-react';

interface EmptyStateProps {
  onAddClick: () => void;
}

function WatchIllustration() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="animate-bounce-in"
      aria-hidden="true"
    >
      {/* Watch strap top */}
      <rect x="42" y="8" width="36" height="24" rx="4" fill="#334155" />
      <rect x="46" y="12" width="28" height="16" rx="2" fill="#1e293b" />
      {/* Watch body */}
      <circle cx="60" cy="60" r="32" fill="#334155" stroke="#475569" strokeWidth="2" />
      <circle cx="60" cy="60" r="27" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
      {/* Watch face details */}
      <circle cx="60" cy="60" r="24" fill="#1e293b" />
      {/* Hour markers */}
      <rect x="59" y="38" width="2" height="5" rx="1" fill="#94a3b8" />
      <rect x="59" y="77" width="2" height="5" rx="1" fill="#94a3b8" />
      <rect x="38" y="59" width="5" height="2" rx="1" fill="#94a3b8" />
      <rect x="77" y="59" width="5" height="2" rx="1" fill="#94a3b8" />
      {/* Hour hand */}
      <rect x="59" y="48" width="2" height="14" rx="1" fill="#e2e8f0" />
      {/* Minute hand */}
      <rect x="59.5" y="43" width="1.5" height="18" rx="0.75" fill="#38bdf8" transform="rotate(30 60 60)" />
      {/* Center dot */}
      <circle cx="60" cy="60" r="2" fill="#38bdf8" />
      {/* Crown */}
      <rect x="91" y="56" width="6" height="8" rx="2" fill="#475569" />
      {/* Watch strap bottom */}
      <rect x="42" y="88" width="36" height="24" rx="4" fill="#334155" />
      <rect x="46" y="92" width="28" height="16" rx="2" fill="#1e293b" />
    </svg>
  );
}

export default function EmptyState({ onAddClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-surface border border-border-subtle rounded-lg animate-scale-in">
      <div className="mb-6">
        <WatchIllustration />
      </div>
      <h3 className="text-lg font-semibold text-primary-text mb-1">
        Henüz saat eklenmemiş
      </h3>
      <p className="text-sm text-secondary-text mb-6 max-w-sm text-center">
        Envanterinize saat ekleyerek başlayın. Saatlerinizi birden fazla platformda senkronize edin.
      </p>
      <button
        onClick={onAddClick}
        className="btn-press inline-flex items-center gap-2 px-4 py-2.5 bg-accent-blue text-white text-sm font-medium rounded-lg hover:bg-accent-blue-hover transition-colors duration-150"
      >
        <Plus className="w-4 h-4" />
        İlk Saatinizi Ekleyin
      </button>
    </div>
  );
}
