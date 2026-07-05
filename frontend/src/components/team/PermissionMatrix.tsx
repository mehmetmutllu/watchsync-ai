"use client";

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { PermissionCatalogItem } from '@/types';

interface PermissionMatrixProps {
  catalog: PermissionCatalogItem[];
  selected: string[];
  onChange: (permissions: string[]) => void;
  disabled?: boolean;
  /** Bu izinlerin dışındakiler pasifleştirilir (privilege escalation UI koruması). */
  grantable?: string[] | null;
}

const GROUP_KEYS = ['inventory', 'crm', 'invoices', 'market', 'platforms', 'ai', 'settings', 'team'];

export default function PermissionMatrix({
  catalog,
  selected,
  onChange,
  disabled = false,
  grantable = null,
}: PermissionMatrixProps) {
  const t = useTranslations('Team');
  const groupLabel = (group: string) =>
    GROUP_KEYS.includes(group) ? t(`group_${group}` as `group_${string}`) : group;
  const groups = useMemo(() => {
    const map = new Map<string, PermissionCatalogItem[]>();
    for (const item of catalog) {
      if (!map.has(item.group)) map.set(item.group, []);
      map.get(item.group)!.push(item);
    }
    return Array.from(map.entries());
  }, [catalog]);

  const toggle = (key: string) => {
    if (selected.includes(key)) {
      onChange(selected.filter((p) => p !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  const isGrantable = (key: string) => grantable === null || grantable.includes(key);

  const toggleGroup = (grantableKeys: string[], allSelected: boolean) => {
    if (allSelected) {
      const remove = new Set(grantableKeys);
      onChange(selected.filter((p) => !remove.has(p)));
    } else {
      onChange(Array.from(new Set([...selected, ...grantableKeys])));
    }
  };

  return (
    <div className="space-y-4">
      {groups.map(([group, items]) => {
        const grantableKeys = items.filter((i) => isGrantable(i.key)).map((i) => i.key);
        const allSelected = grantableKeys.length > 0 && grantableKeys.every((k) => selected.includes(k));
        return (
        <div key={group} className="border border-border-subtle rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-secondary-text">
              {groupLabel(group)}
            </h4>
            {!disabled && grantableKeys.length > 0 && (
              <button
                type="button"
                onClick={() => toggleGroup(grantableKeys, allSelected)}
                className="text-xs font-medium text-accent-blue hover:underline focus:outline-none focus:ring-2 focus:ring-accent-blue/40 rounded px-1"
              >
                {allSelected ? t('clear_group') : t('select_all')}
              </button>
            )}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {items.map((item) => {
              const checked = selected.includes(item.key);
              const allowed = isGrantable(item.key);
              return (
                <label
                  key={item.key}
                  className={`flex items-center gap-2 text-sm rounded-md px-2 py-1.5 transition-colors ${
                    disabled || !allowed
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer hover:bg-surface-elevated'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled || !allowed}
                    onChange={() => toggle(item.key)}
                    className="w-4 h-4 rounded border-border-strong accent-accent-blue"
                  />
                  <span className="text-primary-text">{item.label}</span>
                </label>
              );
            })}
          </div>
        </div>
        );
      })}
    </div>
  );
}
