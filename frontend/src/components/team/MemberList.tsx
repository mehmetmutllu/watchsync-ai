"use client";

import { useTranslations } from 'next-intl';
import type { TeamMember } from '@/types';
import MemberRow from './MemberRow';

interface MemberListProps {
  members: TeamMember[];
  currentUserId: number;
  onEditPermissions: (member: TeamMember) => void;
  onToggleStatus: (member: TeamMember) => void;
  onDelete: (member: TeamMember) => void;
}

export default function MemberList({
  members,
  currentUserId,
  onEditPermissions,
  onToggleStatus,
  onDelete,
}: MemberListProps) {
  const t = useTranslations('Team');
  return (
    <div className="bg-surface border border-border-subtle rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-start">
          <thead>
            <tr className="border-b border-border-subtle text-xs uppercase tracking-wide text-secondary-text">
              <th className="px-4 py-3 font-medium">{t('col_member')}</th>
              <th className="px-4 py-3 font-medium">{t('col_role')}</th>
              <th className="px-4 py-3 font-medium">{t('col_status')}</th>
              <th className="px-4 py-3 font-medium">{t('col_last_login')}</th>
              <th className="px-4 py-3 font-medium text-end">{t('col_actions')}</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                currentUserId={currentUserId}
                onEditPermissions={onEditPermissions}
                onToggleStatus={onToggleStatus}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
