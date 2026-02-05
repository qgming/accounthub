import { useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { authService } from '../services/auth.service'
import type { AuthContextType, LoginCredentials } from '../types/auth.types'
import type { Admin } from '../types/database.types'
import { AuthContext } from './AuthContext.context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 检查当前会话
    authService.getCurrentUser()
      .then(async (currentUser) => {
        if (currentUser) {
          const adminData = await authService.getAdmin(currentUser.id)
          if (adminData) {
            setUser(currentUser)
            setAdmin(adminData)
          }
        }
      })
      .catch((error) => {
        // 忽略 "Auth session missing" 错误，这是正常的未登录状态
        if (error.message !== 'Auth session missing!') {
          console.error('Error checking auth session:', error)
        }
      })
      .finally(() => {
        setLoading(false)
      })

    // 监听认证状态变化
    const { data: { subscription } } = authService.onAuthStateChange(async (authUser) => {
      if (authUser) {
        const adminData = await authService.getAdmin(authUser.id)
        if (adminData) {
          setUser(authUser)
          setAdmin(adminData)
        } else {
          setUser(null)
          setAdmin(null)
        }
      } else {
        setUser(null)
        setAdmin(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (credentials: LoginCredentials) => {
    const data = await authService.signIn(credentials)
    if (data.user) {
      const adminData = await authService.getAdmin(data.user.id)
      if (adminData) {
        setUser(data.user)
        setAdmin(adminData)
      }
    }
  }

  const signOut = async () => {
    await authService.signOut()
    setUser(null)
    setAdmin(null)
  }

  const value: AuthContextType = {
    user,
    profile: admin, // 保持兼容性
    admin,
    loading,
    signIn,
    signOut,
    isAdmin: !!admin,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
