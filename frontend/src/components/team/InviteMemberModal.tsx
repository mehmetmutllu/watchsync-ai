"use client";

import { useState, useEffect } from 'react';
import { X, Loader2, Send } from 'lucide-react';
import { teamApi } from '@/lib/team-api';
import { toast } from '@/stores/toastStore';
import { usePermission } from '@/hooks/usePermission';
import PermissionMatrix from './PermissionMatrix';
import type { PermissionCatalog } from '@/types';
import axios from 'axios';

interface InviteMemberModalProps {
  catalog: PermissionCatalog;
  defaultExpiryDays: number;
  onClose: () => void;
  onInvited: () => void;
}

export default function InviteMemberModal({
  catalog,
  defaultExpiryDays,
  onClose,
  onInvited,
}: InviteMemberModalProps) {
  const { user } = usePermission();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'manager' | 'staff'>('staff');
  const [permissions, setPermissions] = useState<string[]>(catalog.presets.staff ?? []);
  const [expiryDays, setExpiryDays] = useState<number>(defaultExpiryDays);
  const [submitting, setSubmitting] = useState(false);

  // Rol değişince preset'i başlangıç olarak uygula
  useEffect(() => {
    setPermissions(catalog.presets[role] ?? []);
  }, [role, catalog.presets]);

  // owner değilse yalnızca kendi sahip olduğu izinleri verebilir
  const grantable =
    user && user.role === 'owner' ? null : user?.effective_permissions ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await teamApi.invite({
        email,
        role,
        permissions,
        expires_in_days: expiryDays,
      });
      toast.success('Davet gönderildi', `${email} adresine davet iletildi.`);
      onInvited();
      onClose();
    } catch (err) {
      let message = 'Davet gönderilemedi.';
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        message = err.response.data.message;
      }
      toast.error('Hata', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-surface border border-border-strong rounded-xl shadow-[var(--shadow-elevated)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle sticky top-0 bg-surface">
          <h2 className="text-lg font-semibold text-primary-text">Ekip Üyesi Davet Et</h2>
          <button
            onClick={onClose}
            className="text-secondary-text hover:text-primary-text"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-text mb-1">E-posta</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="uye@ornek.com"
              className="w-full px-3 py-2 bg-surface-elevated border border-border-strong rounded-lg text-primary-text text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">Rol</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'manager' | 'staff')}
                className="w-full px-3 py-2 bg-surface-elevated border border-border-strong rounded-lg text-primary-text text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue"
              >
                <option value="staff">Çalışan</option>
                <option value="manager">Yönetici</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">
                Geçerlilik (gün)
              </label>
              <input
                type="number"
                min={1}
                max={365}
                value={expiryDays}
                onChange={(e) => setExpiryDays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-surface-elevated border border-border-strong rounded-lg text-primary-text text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-text mb-2">İzinler</label>
            <PermissionMatrix
              catalog={catalog.permissions}
              selected={permissions}
              onChange={setPermissions}
              grantable={grantable}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-secondary-text hover:text-primary-text"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-accent-blue text-white rounded-lg text-sm font-medium hover:bg-accent-blue/90 disabled:opacity-50 transition-colors"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Davet Gönder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
