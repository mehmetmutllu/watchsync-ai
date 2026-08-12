'use client';

export default function TableSkeleton() {
  const rows = Array.from({ length: 8 });

  return (
    <div className="bg-surface border border-border-subtle rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="w-10 px-4 py-3">
                <div className="w-4 h-4 rounded bg-surface-elevated animate-pulse-soft" />
              </th>
              <th className="w-14 px-2 py-3">
                <div className="w-10 h-4 rounded bg-surface-elevated animate-pulse-soft" />
              </th>
              {['w-28', 'w-20', 'w-16', 'w-20', 'w-24', 'w-20'].map((w, i) => (
                <th key={i} className="px-4 py-3 text-start">
                  <div className={`${w} h-3 rounded bg-surface-elevated animate-pulse-soft`} />
                </th>
              ))}
              <th className="w-16 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((_, rowIndex) => (
              <tr key={rowIndex} className="border-b border-border-subtle">
                <td className="px-4 py-3">
                  <div className="w-4 h-4 rounded bg-surface-elevated animate-pulse-soft" />
                </td>
                <td className="px-2 py-3">
                  <div className="w-10 h-10 rounded-md bg-surface-elevated animate-pulse-soft" />
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-1.5">
                    <div className="w-32 h-4 rounded bg-surface-elevated animate-pulse-soft" />
                    <div className="w-16 h-3 rounded bg-surface-elevated animate-pulse-soft" />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="w-24 h-4 rounded bg-surface-elevated animate-pulse-soft" />
                </td>
                <td className="px-4 py-3">
                  <div className="w-16 h-6 rounded-full bg-surface-elevated animate-pulse-soft" />
                </td>
                <td className="px-4 py-3">
                  <div className="w-20 h-4 rounded bg-surface-elevated animate-pulse-soft" />
                </td>
                <td className="px-4 py-3">
                  <div className="w-24 h-4 rounded bg-surface-elevated animate-pulse-soft" />
                </td>
                <td className="px-4 py-3">
                  <div className="w-16 h-3 rounded bg-surface-elevated animate-pulse-soft" />
                </td>
                <td className="px-4 py-3">
                  <div className="w-6 h-6 rounded bg-surface-elevated animate-pulse-soft ms-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
