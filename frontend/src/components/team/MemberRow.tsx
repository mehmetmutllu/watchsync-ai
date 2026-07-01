"use client";

import { ShieldCheck, UserCog, User as UserIcon, Ban, CheckCircle2, Trash2, SlidersHorizontal } from 'lucide-react';
import type { TeamMember } from '@/types';

interface MemberRowProps {
  member: TeamMember;
  currentUserId: number;
  onEditPermissions: (member: TeamMember) => void;
  onToggleStatus: (member: TeamMember) => void;
  onDelete: (member: TeamMember) => void;
}

const ROLE_META: Record<string, { label: string; icon: typeof UserIcon; className: string }> = {
  owner: { label: 'Sahip', icon: ShieldCheck, className: 'text-amber-400' },
  manager: { label: 'Yönetici', icon: UserCog, className: 'text-accent-blue' },
  staff: { label: 'Çalışan', icon: UserIcon, className: 'text-secondary-text' },
};

const STATUS_META: Record<string, { label: string; className: string }> = {
  active: { label: 'Aktif', className: 'bg-emerald-500/15 text-emerald-400' },
  invited: { label: 'Davet edildi', className: 'bg-amber-500/15 text-amber-400' },
  disabled: { label: 'Pasif', className: 'bg-red-500/15 text-red-400' },
};

export default function MemberRow({
  member,
  currentUserId,
  onEditPermissions,
  onToggleStatus,
  onDelete,
}: MemberRowProps) {
  const role = ROLE_META[member.role] ?? ROLE_META.staff;
  const status = STATUS_META[member.status] ?? STATUS_META.active;
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
          {role.label}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
          {status.label}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-secondary-text">
        {member.last_login_at
          ? new Date(member.last_login_at).toLocaleDateString('tr-TR', {
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
              title="İzinleri düzenle"
              className="p-1.5 rounded-md text-secondary-text hover:text-accent-blue hover:bg-surface-elevated transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          )}
          {!isOwner && !isSelf && (
            <button
              onClick={() => onToggleStatus(member)}
              title={member.status === 'disabled' ? 'Aktifleştir' : 'Pasifleştir'}
              className="p-1.5 rounded-md text-secondary-text hover:text-amber-400 hover:bg-surface-elevated transition-colors"
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
              title="Sil"
              className="p-1.5 rounded-md text-secondary-text hover:text-red-400 hover:bg-surface-elevated transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
