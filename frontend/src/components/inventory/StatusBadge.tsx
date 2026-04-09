'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { WatchStatus } from '@/types';

const STATUS_CONFIG: Record<WatchStatus, { label: string; color: string; bg: string }> = {
  draft: {
    label: 'Taslak',
    color: 'text-secondary-text',
    bg: 'bg-secondary-text/10',
  },
  active: {
    label: 'Aktif',
    color: 'text-semantic-success',
    bg: 'bg-semantic-success/10',
  },
  reserved: {
    label: 'Rezerve',
    color: 'text-semantic-warning',
    bg: 'bg-semantic-warning/10',
  },
  sold: {
    label: 'Satıldı',
    color: 'text-accent-blue',
    bg: 'bg-accent-blue/10',
  },
  maintenance: {
    label: 'Bakımda',
    color: 'text-semantic-error',
    bg: 'bg-semantic-error/10',
  },
};

interface StatusBadgeProps {
  status: WatchStatus;
  onStatusChange?: (newStatus: WatchStatus) => void;
  allowedTransitions?: WatchStatus[];
}

export default function StatusBadge({
  status,
  onStatusChange,
  allowedTransitions,
}: StatusBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const config = STATUS_CONFIG[status];
  const canChange = onStatusChange && allowedTransitions && allowedTransitions.length > 0;

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (canChange) setIsOpen(!isOpen);
        }}
        className={`
          inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
          ${config.bg} ${config.color}
          ${canChange ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}
          transition-opacity
        `}
      >
        {config.label}
        {canChange && <ChevronDown className="w-3 h-3" />}
      </button>

      {isOpen && canChange && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 w-36 bg-surface-elevated border border-border-subtle rounded-lg shadow-lg py-1 animate-fade-in">
            {allowedTransitions.map((targetStatus) => {
              const targetConfig = STATUS_CONFIG[targetStatus];
              return (
                <button
                  key={targetStatus}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(targetStatus);
                    setIsOpen(false);
                  }}
                  className={`
                    flex items-center gap-2 w-full px-3 py-2 text-sm 
                    hover:bg-surface transition-colors
                    ${targetConfig.color}
                  `}
                >
                  <span className={`w-2 h-2 rounded-full ${targetConfig.bg}`} />
                  {targetConfig.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
