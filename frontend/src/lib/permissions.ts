import type { User } from '@/types';

/**
 * İzin anahtarları (backend config/permissions.php ile eşleşir).
 */
export const PERMISSIONS = {
  inventoryView: 'inventory.view',
  inventoryCreate: 'inventory.create',
  inventoryEdit: 'inventory.edit',
  inventoryDelete: 'inventory.delete',
  inventoryPublish: 'inventory.publish',
  inventoryViewCost: 'inventory.view_cost',
  inventoryViewPrice: 'inventory.view_price',
  crmView: 'crm.view',
  crmManage: 'crm.manage',
  invoicesView: 'invoices.view',
  invoicesManage: 'invoices.manage',
  marketView: 'market.view',
  platformsManage: 'platforms.manage',
  aiUse: 'ai.use',
  settingsManage: 'settings.manage',
  teamManage: 'team.manage',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Kullanıcının belirli bir izne sahip olup olmadığını döner.
 * owner her zaman true; aksi halde backend'in verdiği effective_permissions listesine bakılır.
 */
export function hasPermission(user: User | null | undefined, permission: string): boolean {
  if (!user) return false;
  if (user.role === 'owner') return true;
  return (user.effective_permissions ?? []).includes(permission);
}

/**
 * Kullanıcının ekip yönetimine erişip erişemeyeceği.
 */
export function canManageTeam(user: User | null | undefined): boolean {
  return hasPermission(user, PERMISSIONS.teamManage);
}
