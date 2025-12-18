import React from 'react';
import { useUser } from '@/contexts/UserContext';
import { AppRole, Permission } from '@/types/user';
import { Shield, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface RoleGuardProps {
  children: React.ReactNode;
  /** Required roles (user must have at least one) */
  roles?: AppRole[];
  /** Required permissions (user must have all) */
  permissions?: Permission[];
  /** Show fallback UI when access denied */
  showFallback?: boolean;
  /** Custom fallback component */
  fallback?: React.ReactNode;
  /** Require all roles instead of any */
  requireAllRoles?: boolean;
}

export function RoleGuard({
  children,
  roles,
  permissions,
  showFallback = false,
  fallback,
  requireAllRoles = false
}: RoleGuardProps) {
  const { hasRole, hasAnyRole, hasPermission, loading, user } = useUser();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check role requirements
  let hasRequiredRole = true;
  if (roles && roles.length > 0) {
    if (requireAllRoles) {
      hasRequiredRole = roles.every(role => hasRole(role));
    } else {
      hasRequiredRole = hasAnyRole(roles);
    }
  }

  // Check permission requirements
  let hasRequiredPermissions = true;
  if (permissions && permissions.length > 0) {
    hasRequiredPermissions = permissions.every(permission => hasPermission(permission));
  }

  const hasAccess = hasRequiredRole && hasRequiredPermissions;

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showFallback) {
      return (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <Lock className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Accès Restreint
            </h3>
            <p className="text-muted-foreground text-sm max-w-md">
              Vous n'avez pas les permissions nécessaires pour accéder à ce contenu.
              {roles && roles.length > 0 && (
                <span className="block mt-2">
                  Rôles requis: {roles.join(', ')}
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      );
    }

    return null;
  }

  return <>{children}</>;
}

// Convenience components for common role checks
export function AdminOnly({ children, showFallback }: { children: React.ReactNode; showFallback?: boolean }) {
  return (
    <RoleGuard roles={['admin']} showFallback={showFallback}>
      {children}
    </RoleGuard>
  );
}

export function MedicalOnly({ children, showFallback }: { children: React.ReactNode; showFallback?: boolean }) {
  return (
    <RoleGuard roles={['medical_staff', 'admin']} showFallback={showFallback}>
      {children}
    </RoleGuard>
  );
}

export function TeacherOnly({ children, showFallback }: { children: React.ReactNode; showFallback?: boolean }) {
  return (
    <RoleGuard roles={['teacher', 'admin']} showFallback={showFallback}>
      {children}
    </RoleGuard>
  );
}

export function StudentOnly({ children, showFallback }: { children: React.ReactNode; showFallback?: boolean }) {
  return (
    <RoleGuard roles={['student']} showFallback={showFallback}>
      {children}
    </RoleGuard>
  );
}

export function ParentOnly({ children, showFallback }: { children: React.ReactNode; showFallback?: boolean }) {
  return (
    <RoleGuard roles={['parent', 'admin']} showFallback={showFallback}>
      {children}
    </RoleGuard>
  );
}

// Permission-based guards
export function CanManageUsers({ children, showFallback }: { children: React.ReactNode; showFallback?: boolean }) {
  return (
    <RoleGuard permissions={['manage_users']} showFallback={showFallback}>
      {children}
    </RoleGuard>
  );
}

export function CanViewPatients({ children, showFallback }: { children: React.ReactNode; showFallback?: boolean }) {
  return (
    <RoleGuard permissions={['view_patients']} showFallback={showFallback}>
      {children}
    </RoleGuard>
  );
}

export function CanEditPatients({ children, showFallback }: { children: React.ReactNode; showFallback?: boolean }) {
  return (
    <RoleGuard permissions={['edit_patients']} showFallback={showFallback}>
      {children}
    </RoleGuard>
  );
}

export function CanViewAnalytics({ children, showFallback }: { children: React.ReactNode; showFallback?: boolean }) {
  return (
    <RoleGuard permissions={['view_analytics']} showFallback={showFallback}>
      {children}
    </RoleGuard>
  );
}
