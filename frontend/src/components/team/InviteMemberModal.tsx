"use client";

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('Team');
  const { user } = usePermission();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'manager' | 'staff'>('staff');
  const [permissions, setPermissions] = useState<string[]>(catalog.presets.staff ?? []);
  const [expiryDays, setExpiryDays] = useState<number>(defaultExpiryDays);
  const [submitting, setSubmitting] = useState(false);

  // Rol değişince (ve ilk açılışta) preset'i başlangıç olarak uygula.
  // catalog.presets kasıtlı olarak dep dışı: arka plan team refetch'i catalog
  // nesnesinin kimliğini değiştirdiğinde kullanıcının seçtiği izinleri sıfırlamamalı.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setPermissions(catalog.presets[role] ?? []);
  }, [role]);

  // owner değilse yalnızca kendi sahip olduğu izinleri verebilir
  const grantable =
    user && user.role === 'owner' ? null : user?.effective_permissions ?? [];

  // Seçili izinlerin rol varsayılanından (preset) sapmasını göster
  const presetDiff = useMemo(() => {
    const preset = catalog.presets[role] ?? [];
    const presetSet = new Set(preset);
    const selectedSet = new Set(permissions);
    const added = permissions.filter((p) => !presetSet.has(p)).length;
    const removed = preset.filter((p) => !selectedSet.has(p)).length;
    return { added, removed, customized: added > 0 || removed > 0 };
  }, [catalog.presets, role, permissions]);

  const resetToPreset = () => setPermissions(catalog.presets[role] ?? []);

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
      toast.success(t('invite_sent_title'), t('invite_sent_desc', { email }));
      onInvited();
      onClose();
    } catch (err) {
      let message = t('invite_error');
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        message = err.response.data.message;
      }
      toast.error(t('error'), message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-surface border border-border-strong rounded-xl shadow-[var(--shadow-elevated)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle sticky top-0 bg-surface">
          <h2 className="text-lg font-semibold text-primary-text">{t('invite_title')}</h2>
          <button
            onClick={onClose}
            className="text-secondary-text hover:text-primary-text"
            aria-label={t('close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-text mb-1">{t('email')}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('email_placeholder')}
              className="w-full px-3 py-2 bg-surface-elevated border border-border-strong rounded-lg text-primary-text text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">{t('role')}</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'manager' | 'staff')}
                className="w-full px-3 py-2 bg-surface-elevated border border-border-strong rounded-lg text-primary-text text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue"
              >
                <option value="staff">{t('role_staff')}</option>
                <option value="manager">{t('role_manager')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">
                {t('expiry_days')}
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
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-secondary-text">{t('permissions')}</label>
              {presetDiff.customized ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-accent-blue">
                    {t('preset_customized')}
                    {presetDiff.added > 0 && <span className="ml-1 tabular-nums">+{presetDiff.added}</span>}
                    {presetDiff.removed > 0 && <span className="ml-1 tabular-nums">−{presetDiff.removed}</span>}
                  </span>
                  <button
                    type="button"
                    onClick={resetToPreset}
                    className="text-xs font-medium text-secondary-text hover:text-primary-text underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-accent-blue/40 rounded"
                  >
                    {t('preset_reset')}
                  </button>
                </div>
              ) : (
                <span className="text-xs text-disabled-text">{t('preset_matches')}</span>
              )}
            </div>
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
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-accent-blue text-white rounded-lg text-sm font-medium hover:bg-accent-blue/90 disabled:opacity-50 transition-colors"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {t('send_invite')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
