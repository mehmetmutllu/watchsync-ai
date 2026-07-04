'use client';

import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import WatchWizard from '@/components/inventory/wizard/WatchWizard';

export default function NewWatchPage() {
  const t = useTranslations('Wizard');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/inventory"
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-border-subtle text-secondary-text hover:text-primary-text hover:border-border-strong transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-primary-text">{t('add_title')}</h1>
          <p className="text-sm text-secondary-text">{t('add_desc')}</p>
        </div>
      </div>

      <WatchWizard />
    </div>
  );
}
