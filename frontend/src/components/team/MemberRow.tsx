"use client";

import { useTranslations, useLocale } from 'next-intl';
import { ShieldCheck, UserCog, User as UserIcon, Ban, CheckCircle2, Trash2, SlidersHorizontal } from 'lucide-react';
import type { TeamMember } from '@/types';

interface MemberRowProps {
  member: TeamMember;
  currentUserId: number;
  onEditPermissions: (member: TeamMember) => void;
  onToggleStatus: (member: TeamMember) => void;
  onDelete: (member: TeamMember) => void;
}

const ROLE_META: Record<string, { icon: typeof UserIcon; className: string }> = {
  owner: { icon: ShieldCheck, className: 'text-accent-gold' },
  manager: { icon: UserCog, className: 'text-accent-blue' },
  staff: { icon: UserIcon, className: 'text-secondary-text' },
};

const STATUS_META: Record<string, { className: string }> = {
  active: { className: 'bg-semantic-success/15 text-semantic-success' },
  invited: { className: 'bg-semantic-warning/15 text-semantic-warning' },
  disabled: { className: 'bg-semantic-error/15 text-semantic-error' },
};

const LOCALE_MAP: Record<string, string> = { tr: 'tr-TR', en: 'en-US', de: 'de-DE' };

export default function MemberRow({
  member,
  currentUserId,
  onEditPermissions,
  onToggleStatus,
  onDelete,
}: MemberRowProps) {
  const t = useTranslations('Team');
  const locale = useLocale();
  const role = ROLE_META[member.role] ?? ROLE_META.staff;
  const status = STATUS_META[member.status] ?? STATUS_META.active;
  const roleLabel = t(`role_${member.role in ROLE_META ? member.role : 'staff'}` as 'role_owner' | 'role_manager' | 'role_staff');
  const statusLabel = t(`status_${member.status in STATUS_META ? member.status : 'active'}` as 'status_active' | 'status_invited' | 'status_disabled');
  const RoleIcon = role.icon;
  const isOwner = member.role === 'owner';
  const isSelf = member.id === currentUserId;

  return (
    <tr className="border-b border-border-subtle hover:bg-surface-elevated/50 transition-colors">
      <td className="px-4 py-3">
        <div className="font-medium text-primary-text">{member.name}</div>
        <div className="text-xs text-secondary-text">{member.email}</div>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 text-sm ${role.className}`}>
          <RoleIcon className="w-4 h-4" />
          {roleLabel}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
          {statusLabel}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-secondary-text">
        {member.last_login_at
          ? new Date(member.last_login_at).toLocaleDateString(LOCALE_MAP[locale] ?? 'tr-TR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : '—'}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          {!isOwner && (
            <button
              onClick={() => onEditPermissions(member)}
              title={t('action_edit_permissions')}
              aria-label={t('action_edit_permissions')}
              className="p-1.5 rounded-md text-secondary-text hover:text-accent-blue hover:bg-surface-elevated transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          )}
          {!isOwner && !isSelf && (
            <button
              onClick={() => onToggleStatus(member)}
              title={member.status === 'disabled' ? t('action_activate') : t('action_deactivate')}
              aria-label={member.status === 'disabled' ? t('action_activate') : t('action_deactivate')}
              className="p-1.5 rounded-md text-secondary-text hover:text-semantic-warning hover:bg-surface-elevated transition-colors"
            >
              {member.status === 'disabled' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Ban className="w-4 h-4" />
              )}
            </button>
          )}
          {!isOwner && !isSelf && (
            <button
              onClick={() => onDelete(member)}
              title={t('action_delete')}
              aria-label={t('action_delete')}
              className="p-1.5 rounded-md text-secondary-text hover:text-semantic-error hover:bg-surface-elevated transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
