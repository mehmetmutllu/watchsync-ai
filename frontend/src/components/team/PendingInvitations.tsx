"use client";

import { useTranslations, useLocale } from 'next-intl';
import { Mail, RotateCw, Trash2, Clock } from 'lucide-react';
import type { TeamInvitation } from '@/types';

interface PendingInvitationsProps {
  invitations: TeamInvitation[];
  onResend: (invitation: TeamInvitation) => void;
  onRevoke: (invitation: TeamInvitation) => void;
}

const LOCALE_MAP: Record<string, string> = { tr: 'tr-TR', en: 'en-US', de: 'de-DE' };

export default function PendingInvitations({
  invitations,
  onResend,
  onRevoke,
}: PendingInvitationsProps) {
  const t = useTranslations('Team');
  const locale = useLocale();
  const roleLabel = (role: string) =>
    role === 'manager' ? t('role_manager') : role === 'staff' ? t('role_staff') : role;
  if (invitations.length === 0) return null;

  return (
    <div className="bg-surface border border-border-subtle rounded-lg p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-primary-text mb-3">
        <Clock className="w-4 h-4 text-semantic-warning" />
        {t('pending_title')} ({invitations.length})
      </h3>
      <ul className="space-y-2">
        {invitations.map((inv) => (
          <li
            key={inv.id}
            className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-surface-elevated"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm text-primary-text truncate">
                <Mail className="w-4 h-4 text-secondary-text flex-shrink-0" />
                <span className="truncate">{inv.email}</span>
                <span className="text-xs text-secondary-text">· {roleLabel(inv.role)}</span>
              </div>
              <div className="text-xs text-secondary-text mt-0.5">
                {t('expires_on')}{' '}
                {new Date(inv.expires_at).toLocaleDateString(LOCALE_MAP[locale] ?? 'tr-TR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => onResend(inv)}
                title={t('action_resend')}
                className="p-1.5 rounded-md text-secondary-text hover:text-accent-blue hover:bg-surface transition-colors"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => onRevoke(inv)}
                title={t('action_revoke')}
                className="p-1.5 rounded-md text-secondary-text hover:text-red-400 hover:bg-surface transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
