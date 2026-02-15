// services/backend/src/types/user.ts

// DB row for users.profiles (snake_case)
export interface DbUser {
  user_id: number;
  user_uuid: string;
  full_name: string;
  email?: string;
  phone_number: string;
  profile_picture_url?: string;
  role_name: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Canonical API user profile (camelCase)
export interface UserProfile {
  userId: number;
  userUuid: string;
  role: string;
  phoneNumber: string;
  email?: string;
  fullName: string;
  profilePictureUrl?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

// Lightweight user object attached to request after authentication
export interface RequestUser {
  userId: number;
  userUuid: string;
  role: string;
  phoneNumber?: string | null;
}
