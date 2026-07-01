import { useAuthStore } from '@/stores/auth';
import { hasPermission, canManageTeam } from '@/lib/permissions';

/**
 * Oturumdaki kullanıcının izinlerini kontrol eden hook.
 *   const { can } = usePermission();
 *   can('inventory.view_price')
 */
export function usePermission() {
  const user = useAuthStore((s) => s.user);

  return {
    user,
    can: (permission: string) => hasPermission(user, permission),
    canManageTeam: () => canManageTeam(user),
  };
}
