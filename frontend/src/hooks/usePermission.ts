import { useMemo } from 'react';
import { useAuthStore } from '@/stores/auth';
import { hasPermission, canManageTeam } from '@/lib/permissions';

/**
 * Oturumdaki kullanıcının izinlerini kontrol eden hook.
 *   const { can } = usePermission();
 *   can('inventory.view_price')
 */
export function usePermission() {
  const user = useAuthStore((s) => s.user);

  // user referansı değişmedikçe dönen fonksiyonların kimliği sabit kalır;
  // aksi halde bunları effect dep'i olarak kullanan bileşenlerde sonsuz döngü olur.
  return useMemo(
    () => ({
      user,
      can: (permission: string) => hasPermission(user, permission),
      canManageTeam: () => canManageTeam(user),
    }),
    [user],
  );
}
