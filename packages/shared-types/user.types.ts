export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: "user" | "driver" | "admin";
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  phone?: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
