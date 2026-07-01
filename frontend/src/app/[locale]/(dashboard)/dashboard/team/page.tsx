"use client";

import { useEffect, useState, useCallback } from 'react';
import { Users, UserPlus, Loader2, ShieldAlert, X, Save } from 'lucide-react';
import { teamApi } from '@/lib/team-api';
import { toast } from '@/stores/toastStore';
import { usePermission } from '@/hooks/usePermission';
import MemberList from '@/components/team/MemberList';
import PendingInvitations from '@/components/team/PendingInvitations';
import InviteMemberModal from '@/components/team/InviteMemberModal';
import PermissionMatrix from '@/components/team/PermissionMatrix';
import type { TeamResponse, TeamMember, TeamInvitation } from '@/types';
import axios from 'axios';

export default function TeamPage() {
  const { user, canManageTeam } = usePermission();
  const [data, setData] = useState<TeamResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [defaultExpiry, setDefaultExpiry] = useState(7);
  const [showInvite, setShowInvite] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [editPerms, setEditPerms] = useState<string[]>([]);
  const [savingPerms, setSavingPerms] = useState(false);

  const load = useCallback(async () => {
    try {
      const [team, defaults] = await Promise.all([teamApi.get(), teamApi.getDefaults()]);
      setData(team);
      setDefaultExpiry(defaults.invitation_expiry_days);
    } catch {
      toast.error('Hata', 'Ekip bilgileri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canManageTeam()) load();
    else setLoading(false);
  }, [canManageTeam, load]);

  const openEdit = (member: TeamMember) => {
    setEditing(member);
    setEditPerms(member.permissions ?? member.effective_permissions ?? []);
  };

  const handleSavePerms = async () => {
    if (!editing) return;
    setSavingPerms(true);
    try {
      await teamApi.updateMemberPermissions(editing.id, editPerms);
      toast.success('Kaydedildi', 'İzinler güncellendi.');
      setEditing(null);
      load();
    } catch (err) {
      let message = 'İzinler güncellenemedi.';
      if (axios.isAxiosError(err) && err.response?.data?.message) message = err.response.data.message;
      toast.error('Hata', message);
    } finally {
      setSavingPerms(false);
    }
  };

  const handleToggleStatus = async (member: TeamMember) => {
    try {
      if (member.status === 'disabled') await teamApi.enableMember(member.id);
      else await teamApi.disableMember(member.id);
      toast.success('Güncellendi', `${member.name} durumu değişti.`);
      load();
    } catch (err) {
      let message = 'İşlem başarısız.';
      if (axios.isAxiosError(err) && err.response?.data?.message) message = err.response.data.message;
      toast.error('Hata', message);
    }
  };

  const handleDelete = async (member: TeamMember) => {
    if (!window.confirm(`${member.name} ekipten silinsin mi?`)) return;
    try {
      await teamApi.removeMember(member.id);
      toast.success('Silindi', `${member.name} ekipten çıkarıldı.`);
      load();
    } catch (err) {
      let message = 'Silme başarısız.';
      if (axios.isAxiosError(err) && err.response?.data?.message) message = err.response.data.message;
      toast.error('Hata', message);
    }
  };

  const handleResend = async (inv: TeamInvitation) => {
    try {
      await teamApi.resendInvitation(inv.id);
      toast.success('Gönderildi', `${inv.email} adresine davet yeniden gönderildi.`);
      load();
    } catch {
      toast.error('Hata', 'Davet yeniden gönderilemedi.');
    }
  };

  const handleRevoke = async (inv: TeamInvitation) => {
    try {
      await teamApi.revokeInvitation(inv.id);
      toast.success('İptal edildi', 'Davet iptal edildi.');
      load();
    } catch {
      toast.error('Hata', 'Davet iptal edilemedi.');
    }
  };

  if (!canManageTeam()) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ShieldAlert className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-lg font-semibold text-primary-text">Erişim Yok</h2>
        <p className="text-sm text-secondary-text mt-1">Bu sayfayı görüntüleme yetkiniz yok.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-accent-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent-blue/15 flex items-center justify-center">
            <Users className="w-5 h-5 text-accent-blue" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary-text">Ekip Yönetimi</h1>
            <p className="text-sm text-secondary-text">Üyeleri davet edin ve izinleri yönetin</p>
          </div>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent-blue text-white rounded-lg text-sm font-medium hover:bg-accent-blue/90 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Üye Davet Et
        </button>
      </div>

      {data && (
        <>
          <PendingInvitations
            invitations={data.invitations}
            onResend={handleResend}
            onRevoke={handleRevoke}
          />
          <MemberList
            members={data.members}
            currentUserId={user?.id ?? 0}
            onEditPermissions={openEdit}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDelete}
          />
        </>
      )}

      {/* Invite modal */}
      {showInvite && data && (
        <InviteMemberModal
          catalog={data.catalog}
          defaultExpiryDays={defaultExpiry}
          onClose={() => setShowInvite(false)}
          onInvited={load}
        />
      )}

      {/* Edit permissions modal */}
      {editing && data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-surface border border-border-strong rounded-xl shadow-[var(--shadow-elevated)]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle sticky top-0 bg-surface">
              <div>
                <h2 className="text-lg font-semibold text-primary-text">İzinleri Düzenle</h2>
                <p className="text-xs text-secondary-text">{editing.name} · {editing.email}</p>
              </div>
              <button
                onClick={() => setEditing(null)}
                className="text-secondary-text hover:text-primary-text"
                aria-label="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <PermissionMatrix
                catalog={data.catalog.permissions}
                selected={editPerms}
                onChange={setEditPerms}
                grantable={user && user.role === 'owner' ? null : user?.effective_permissions ?? []}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 text-sm font-medium text-secondary-text hover:text-primary-text"
                >
                  İptal
                </button>
                <button
                  onClick={handleSavePerms}
                  disabled={savingPerms}
                  className="flex items-center gap-2 px-4 py-2 bg-accent-blue text-white rounded-lg text-sm font-medium hover:bg-accent-blue/90 disabled:opacity-50 transition-colors"
                >
                  {savingPerms ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
