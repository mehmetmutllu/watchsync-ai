"use client";

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
  return (
    <div className="bg-surface border border-border-subtle rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border-subtle text-xs uppercase tracking-wide text-secondary-text">
              <th className="px-4 py-3 font-medium">Üye</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Durum</th>
              <th className="px-4 py-3 font-medium">Son Giriş</th>
              <th className="px-4 py-3 font-medium text-right">İşlemler</th>
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
