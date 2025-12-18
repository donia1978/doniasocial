// User role types matching Supabase enum
export type AppRole = 'admin' | 'teacher' | 'student' | 'medical_staff' | 'parent' | 'user';

// Extended user profile interface
export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

// Role-specific profile data
export interface StudentProfile {
  grade_level: string;
  class_name: string;
  parent_id?: string;
}

export interface TeacherProfile {
  subjects: string[];
  grade_levels: string[];
  department?: string;
}

export interface MedicalProfile {
  specialty: string;
  license_number: string;
  facility_id?: string;
}

export interface ParentProfile {
  children_ids: string[];
}

// Complete user with roles and profile data
export interface User {
  id: string;
  email: string;
  name: string;
  roles: AppRole[];
  profile: UserProfile;
  roleSpecificData?: StudentProfile | TeacherProfile | MedicalProfile | ParentProfile;
  created_at: string;
  updated_at: string;
}

// Permission definitions
export type Permission = 
  | 'view_dashboard'
  | 'manage_users'
  | 'view_patients'
  | 'edit_patients'
  | 'view_courses'
  | 'create_courses'
  | 'view_students'
  | 'grade_students'
  | 'view_children'
  | 'send_messages'
  | 'view_analytics'
  | 'manage_settings';

// Role to permissions mapping
export const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  admin: [
    'view_dashboard', 'manage_users', 'view_patients', 'edit_patients',
    'view_courses', 'create_courses', 'view_students', 'grade_students',
    'view_children', 'send_messages', 'view_analytics', 'manage_settings'
  ],
  teacher: [
    'view_dashboard', 'view_courses', 'create_courses', 'view_students',
    'grade_students', 'send_messages', 'view_analytics'
  ],
  student: [
    'view_dashboard', 'view_courses', 'send_messages'
  ],
  medical_staff: [
    'view_dashboard', 'view_patients', 'edit_patients', 'send_messages', 'view_analytics'
  ],
  parent: [
    'view_dashboard', 'view_children', 'view_courses', 'send_messages'
  ],
  user: [
    'view_dashboard', 'send_messages'
  ]
};

// Mock users for testing
export const MOCK_USERS: User[] = [
  {
    id: 'mock-admin-001',
    email: 'admin@donia.com',
    name: 'Ahmed Admin',
    roles: ['admin'],
    profile: {
      id: 'mock-admin-001',
      email: 'admin@donia.com',
      full_name: 'Ahmed Admin',
      avatar_url: null,
      phone: '+216 12 345 678',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'mock-teacher-001',
    email: 'teacher@donia.com',
    name: 'Fatima Enseignante',
    roles: ['teacher'],
    profile: {
      id: 'mock-teacher-001',
      email: 'teacher@donia.com',
      full_name: 'Fatima Enseignante',
      avatar_url: null,
      phone: '+216 23 456 789',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z'
    },
    roleSpecificData: {
      subjects: ['Mathématiques', 'Physique'],
      grade_levels: ['3ème', '4ème'],
      department: 'Sciences'
    } as TeacherProfile,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  },
  {
    id: 'mock-student-001',
    email: 'student@donia.com',
    name: 'Mohamed Étudiant',
    roles: ['student'],
    profile: {
      id: 'mock-student-001',
      email: 'student@donia.com',
      full_name: 'Mohamed Étudiant',
      avatar_url: null,
      phone: null,
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z'
    },
    roleSpecificData: {
      grade_level: '4ème année',
      class_name: '4S1',
      parent_id: 'mock-parent-001'
    } as StudentProfile,
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z'
  },
  {
    id: 'mock-medical-001',
    email: 'doctor@donia.com',
    name: 'Dr. Salma Médecin',
    roles: ['medical_staff'],
    profile: {
      id: 'mock-medical-001',
      email: 'doctor@donia.com',
      full_name: 'Dr. Salma Médecin',
      avatar_url: null,
      phone: '+216 34 567 890',
      created_at: '2024-01-04T00:00:00Z',
      updated_at: '2024-01-04T00:00:00Z'
    },
    roleSpecificData: {
      specialty: 'Médecine Générale',
      license_number: 'MED-2024-001'
    } as MedicalProfile,
    created_at: '2024-01-04T00:00:00Z',
    updated_at: '2024-01-04T00:00:00Z'
  },
  {
    id: 'mock-parent-001',
    email: 'parent@donia.com',
    name: 'Leila Parent',
    roles: ['parent'],
    profile: {
      id: 'mock-parent-001',
      email: 'parent@donia.com',
      full_name: 'Leila Parent',
      avatar_url: null,
      phone: '+216 45 678 901',
      created_at: '2024-01-05T00:00:00Z',
      updated_at: '2024-01-05T00:00:00Z'
    },
    roleSpecificData: {
      children_ids: ['mock-student-001']
    } as ParentProfile,
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-01-05T00:00:00Z'
  }
];
