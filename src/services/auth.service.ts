import { supabase } from '../config/supabase'
import type { LoginCredentials } from '../types/auth.types'
import type { Admin } from '../types/database.types'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { isValidUUID, ValidationError } from '../utils/validation'

/**
 * Custom error class for authentication errors
 */
class AuthError extends Error {
  code?: string

  constructor(message: string, code?: string) {
    super(message)
    this.name = 'AuthError'
    this.code = code
  }
}

export const authService = {
  /**
   * Sign in with email and password
   * @throws {AuthError} If authentication fails or user is not an admin
   */
  async signIn(credentials: LoginCredentials) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) {
        throw new AuthError('登录失败，请检查邮箱和密码', error.message)
      }

      if (!data.user) {
        throw new AuthError('登录失败，未返回用户信息')
      }

      // Check if user is admin
      const admin = await this.getAdmin(data.user.id)
      if (!admin) {
        await this.signOut()
        throw new AuthError('您没有权限访问此系统', 'INSUFFICIENT_PERMISSIONS')
      }

      // Update last login time
      await supabase
        .from('admins')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', admin.id)

      return data
    } catch (error) {
      if (error instanceof AuthError) {
        throw error
      }
      throw new AuthError('登录过程中发生错误')
    }
  },

  /**
   * Sign out current user
   * @throws {AuthError} If sign out fails
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw new AuthError('登出失败', error.message)
      }
    } catch (error) {
      if (error instanceof AuthError) {
        throw error
      }
      throw new AuthError('登出过程中发生错误')
    }
  },

  /**
   * Get current authenticated user
   * @throws {AuthError} If unable to fetch user
   */
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) {
        // 如果是 "Auth session missing" 错误，返回 null 而不是抛出错误
        if (error.message === 'Auth session missing!') {
          return null
        }
        throw new AuthError('获取用户信息失败', error.message)
      }
      return user
    } catch (error) {
      if (error instanceof AuthError) {
        throw error
      }
      throw new AuthError('获取用户信息过程中发生错误')
    }
  },

  /**
   * Get admin by auth user ID
   * @throws {ValidationError} If userId is invalid
   * @throws {AuthError} If unable to fetch admin
   */
  async getAdmin(authUserId: string): Promise<Admin | null> {
    // Validate input
    if (!isValidUUID(authUserId)) {
      throw new ValidationError('无效的用户ID格式')
    }

    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single()

      if (error) {
        // Handle "not found" gracefully
        if (error.code === 'PGRST116') {
          return null
        }

        // Log detailed error for debugging
        console.error('Admin fetch error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          authUserId
        })

        // Check for RLS policy errors
        if (error.code === '42501' || error.message?.includes('policy')) {
          throw new AuthError('权限不足，无法访问管理员资料')
        }

        throw new AuthError('获取管理员资料失败')
      }

      return data
    } catch (error) {
      if (error instanceof ValidationError || error instanceof AuthError) {
        throw error
      }
      console.error('Unexpected error in getAdmin:', error)
      throw new AuthError('获取管理员资料过程中发生错误')
    }
  },

  /**
   * Listen to authentication state changes
   */
  onAuthStateChange(callback: (user: SupabaseUser | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null)
    })
  },
}
