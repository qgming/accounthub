import type { User } from '@supabase/supabase-js'
import type { Admin, User as UserProfile } from './database.types'

export interface AuthUser extends User {
  admin?: Admin
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignUpCredentials extends LoginCredentials {
  full_name?: string
}

export interface AuthContextType {
  user: AuthUser | null
  profile: Admin | UserProfile | null // 保持兼容性
  admin?: Admin | null
  loading: boolean
  signIn: (credentials: LoginCredentials) => Promise<void>
  signOut: () => Promise<void>
  isAdmin: boolean
}
