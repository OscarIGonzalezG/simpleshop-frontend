import { User, Tenant } from './user.model';

// 🔐 Lo que enviamos al hacer Login
export interface LoginDto {
  email: string;
  password: string;
}

// 📝 Lo que enviamos al hacer Registro
export interface RegisterDto {
  fullname: string;
  email: string;
  password: string;
  businessName: string;
  slug: string;
  plan?: string;
}

// 📡 Lo que el Backend nos responde (Token + Datos)
export interface AuthResponse {
  access_token: string;
  user: User;
  tenant: Tenant | null;
}