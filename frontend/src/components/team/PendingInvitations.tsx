"use client";

import { Mail, RotateCw, Trash2, Clock } from 'lucide-react';
import type { TeamInvitation } from '@/types';

interface PendingInvitationsProps {
  invitations: TeamInvitation[];
  onResend: (invitation: TeamInvitation) => void;
  onRevoke: (invitation: TeamInvitation) => void;
}

const ROLE_LABELS: Record<string, string> = {
  manager: 'Yönetici',
  staff: 'Çalışan',
};

export default function PendingInvitations({
  invitations,
  onResend,
  onRevoke,
}: PendingInvitationsProps) {
  if (invitations.length === 0) return null;

  return (
    <div className="bg-surface border border-border-subtle rounded-lg p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-primary-text mb-3">
        <Clock className="w-4 h-4 text-amber-400" />
        Bekleyen Davetler ({invitations.length})
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
                <span className="text-xs text-secondary-text">· {ROLE_LABELS[inv.role] ?? inv.role}</span>
              </div>
              <div className="text-xs text-secondary-text mt-0.5">
                Son geçerlilik:{' '}
                {new Date(inv.expires_at).toLocaleDateString('tr-TR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => onResend(inv)}
                title="Yeniden gönder"
                className="p-1.5 rounded-md text-secondary-text hover:text-accent-blue hover:bg-surface transition-colors"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => onRevoke(inv)}
                title="İptal et"
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
