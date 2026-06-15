'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import WatchWizard from '@/components/inventory/wizard/WatchWizard';

export default function NewWatchPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/inventory"
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-border-subtle text-secondary-text hover:text-primary-text hover:border-border-default transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-primary-text">Yeni Saat Ekle</h1>
          <p className="text-sm text-secondary-text">6 adımda saatinizi ekleyin ve yayınlayın.</p>
        </div>
      </div>

      <WatchWizard />
    </div>
  );
}
