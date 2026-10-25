import { request } from './http';

// Spring Boot AuthController (/api/auth/*).
export type AuthUser = { id: number; fullName: string; email: string; role: string; createdAt: string };
export type AuthResponse = { tokenType: 'Bearer'; accessToken: string; expiresIn: number; refreshToken: string; user: AuthUser };

export const authApi = {
  register: (fullName: string, email: string, password: string) =>
    request<AuthResponse>('auth', '/api/auth/register', { method: 'POST', json: { fullName, email, password }, noAuth: true }),
  login: (email: string, password: string) =>
    request<AuthResponse>('auth', '/api/auth/login', { method: 'POST', json: { email, password }, noAuth: true }),
  logout: (refreshToken: string) =>
    request<void>('auth', '/api/auth/logout', { method: 'POST', json: { refreshToken }, noAuth: true }),
  me: () => request<AuthUser>('auth', '/api/auth/me'),
};
