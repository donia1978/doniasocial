import { useCallback } from 'react';
import { useUser } from '@/contexts/UserContext';
import { AppRole, Permission, ROLE_PERMISSIONS } from '@/types/user';

/**
 * Hook providing convenient user helper functions
 * Can be used as an alternative to useUser() for simpler access patterns
 */
export function useUserHelpers() {
  const { 
    user, 
    roles, 
    hasPermission, 
    hasRole, 
    hasAnyRole,
    loading 
  } = useUser();

  /**
   * Get the current authenticated user
   */
  const getCurrentUser = useCallback(() => {
    return user;
  }, [user]);

  /**
   * Get the primary role of the current user
   * Returns the highest priority role if user has multiple
   */
  const getUserRole = useCallback((): AppRole | null => {
    if (roles.length === 0) return null;
    const priority: AppRole[] = ['admin', 'medical_staff', 'teacher', 'parent', 'student', 'user'];
    return priority.find(r => roles.includes(r)) || roles[0];
  }, [roles]);

  /**
   * Check if user has a specific permission
   */
  const checkPermission = useCallback((permission: Permission): boolean => {
    return hasPermission(permission);
  }, [hasPermission]);

  /**
   * Check if user has any of the specified roles
   */
  const checkRoles = useCallback((checkRoles: AppRole[]): boolean => {
    return hasAnyRole(checkRoles);
  }, [hasAnyRole]);

  /**
   * Get all permissions for the current user based on their roles
   */
  const getAllPermissions = useCallback((): Permission[] => {
    const permissions = new Set<Permission>();
    roles.forEach(role => {
      ROLE_PERMISSIONS[role]?.forEach(p => permissions.add(p));
    });
    return Array.from(permissions);
  }, [roles]);

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = useCallback((): boolean => {
    return !!user;
  }, [user]);

  /**
   * Check if user is an admin
   */
  const isAdmin = useCallback((): boolean => {
    return hasRole('admin');
  }, [hasRole]);

  /**
   * Check if user is medical staff
   */
  const isMedicalStaff = useCallback((): boolean => {
    return hasRole('medical_staff') || hasRole('admin');
  }, [hasRole]);

  /**
   * Check if user is a teacher
   */
  const isTeacher = useCallback((): boolean => {
    return hasRole('teacher') || hasRole('admin');
  }, [hasRole]);

  /**
   * Check if user is a student
   */
  const isStudent = useCallback((): boolean => {
    return hasRole('student');
  }, [hasRole]);

  /**
   * Check if user is a parent
   */
  const isParent = useCallback((): boolean => {
    return hasRole('parent');
  }, [hasRole]);

  /**
   * Get display name for user's primary role
   */
  const getRoleDisplayName = useCallback((): string => {
    const role = getUserRole();
    const roleNames: Record<AppRole, string> = {
      admin: 'Administrateur',
      teacher: 'Enseignant',
      student: 'Étudiant',
      medical_staff: 'Personnel Médical',
      parent: 'Parent',
      user: 'Utilisateur'
    };
    return role ? roleNames[role] : 'Non défini';
  }, [getUserRole]);

  /**
   * Get role badge color class
   */
  const getRoleBadgeColor = useCallback((): string => {
    const role = getUserRole();
    const colors: Record<AppRole, string> = {
      admin: 'bg-red-500/20 text-red-400 border-red-500/30',
      teacher: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      student: 'bg-green-500/20 text-green-400 border-green-500/30',
      medical_staff: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      parent: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      user: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return role ? colors[role] : colors.user;
  }, [getUserRole]);

  return {
    // User data
    user,
    roles,
    loading,
    
    // Helper functions
    getCurrentUser,
    getUserRole,
    checkPermission,
    checkRoles,
    getAllPermissions,
    
    // Convenience checks
    isAuthenticated,
    isAdmin,
    isMedicalStaff,
    isTeacher,
    isStudent,
    isParent,
    
    // Display helpers
    getRoleDisplayName,
    getRoleBadgeColor
  };
}
