export type UserRole =
  | 'ADMIN'
  | 'MANAGER'
  | 'NETWORK_ENGINEER'
  | 'FIELD_ENGINEER'
  | 'AUDITOR';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface User {
  userId: number;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
}

export interface UserRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole | string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
  newPassword: string;
}
