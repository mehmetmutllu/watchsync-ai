"use client";

import { useMemo } from 'react';
import type { PermissionCatalogItem } from '@/types';

interface PermissionMatrixProps {
  catalog: PermissionCatalogItem[];
  selected: string[];
  onChange: (permissions: string[]) => void;
  disabled?: boolean;
  /** Bu izinlerin dışındakiler pasifleştirilir (privilege escalation UI koruması). */
  grantable?: string[] | null;
}

const GROUP_LABELS: Record<string, string> = {
  inventory: 'Envanter',
  crm: 'Müşteriler',
  invoices: 'Faturalar',
  market: 'Pazar',
  platforms: 'Platformlar',
  ai: 'AI',
  settings: 'Ayarlar',
  team: 'Ekip',
};

export default function PermissionMatrix({
  catalog,
  selected,
  onChange,
  disabled = false,
  grantable = null,
}: PermissionMatrixProps) {
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

  return (
    <div className="space-y-4">
      {groups.map(([group, items]) => (
        <div key={group} className="border border-border-subtle rounded-lg p-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-secondary-text mb-2">
            {GROUP_LABELS[group] ?? group}
          </h4>
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
      ))}
    </div>
  );
}
