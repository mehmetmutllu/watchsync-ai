"use client";

import type { ReactNode } from 'react';
import { usePermission } from '@/hooks/usePermission';

interface CanProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * İzne göre içerik gösteren sarmalayıcı.
 *   <Can permission="team.manage"><TeamLink /></Can>
 */
export default function Can({ permission, children, fallback = null }: CanProps) {
  const { can } = usePermission();
  return <>{can(permission) ? children : fallback}</>;
}
