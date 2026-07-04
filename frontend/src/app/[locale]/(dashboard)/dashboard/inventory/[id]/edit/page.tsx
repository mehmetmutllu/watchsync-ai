'use client';

import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';
import WatchWizard from '@/components/inventory/wizard/WatchWizard';
import WatchSyncPanel from '@/components/inventory/WatchSyncPanel';

interface EditWatchPageProps {
  params: Promise<{ id: string }>;
}

export default function EditWatchPage({ params }: EditWatchPageProps) {
  const t = useTranslations('Wizard');
  const { id } = use(params);
  const watchId = parseInt(id, 10);

  if (isNaN(watchId)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-semantic-error">{t('invalid_id')}</p>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-primary-text">{t('edit_title')}</h1>
          <p className="text-sm text-secondary-text">{t('edit_desc')}</p>
        </div>
      </div>

      <WatchWizard watchId={watchId} />

      <div className="mt-8 pt-8 border-t border-border-subtle">
        <WatchSyncPanel watchId={watchId} />
      </div>
    </div>
  );
}
