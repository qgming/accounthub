import { supabase } from '../config/supabase'
import type { User } from '../types/database.types'
import { auditService } from './audit.service'
import { authService } from './auth.service'
import { isValidUUID, ValidationError } from '../utils/validation'

export const usersService = {
  // 获取所有用户（分页）
  async getUsers(page = 1, pageSize = 10, filters?: {
    search?: string
    applicationId?: string
  }) {
    let query = supabase
      .from('users')
      .select(`
        *,
        applications:registered_from_app_id(id, name, slug)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // 搜索功能
    if (filters?.search) {
      query = query.or(`email.ilike.%${filters.search}%,full_name.ilike.%${filters.search}%`)
    }

    // 应用筛选
    if (filters?.applicationId) {
      query = query.eq('registered_from_app_id', filters.applicationId)
    }

    // 分页
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) throw error

    return {
      data: data || [],
      total: count || 0,
      page,
      pageSize,
    }
  },

  // 获取单个用户
  async getUser(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // 更新用户信息
  async updateUser(id: string, updates: Partial<User>) {
    // 验证输入
    if (!isValidUUID(id)) {
      throw new ValidationError('无效的用户ID格式')
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // 记录审计日志
    try {
      const currentUser = await authService.getCurrentUser()
      if (currentUser) {
        const admin = await authService.getAdmin(currentUser.id)
        if (admin && data) {
          await auditService.logAction({
            admin_id: admin.id,
            action: 'UPDATE_USER',
            target_user_id: id,
            target_user_email: data.email || '',
            details: { updates }
          })
        }
      }
    } catch (auditError) {
      console.error('Failed to log audit:', auditError)
    }

    return data
  },

  // 封禁/解封用户
  async toggleBanUser(id: string, isBanned: boolean) {
    // 验证输入
    if (!isValidUUID(id)) {
      throw new ValidationError('无效的用户ID格式')
    }

    const { data, error } = await supabase
      .from('users')
      .update({ is_banned: isBanned })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // 记录审计日志
    try {
      const currentUser = await authService.getCurrentUser()
      if (currentUser) {
        const admin = await authService.getAdmin(currentUser.id)
        if (admin && data) {
          await auditService.logAction({
            admin_id: admin.id,
            action: isBanned ? 'BAN_USER' : 'UNBAN_USER',
            target_user_id: id,
            target_user_email: data.email || '',
            details: { is_banned: isBanned, reason: '管理员操作' }
          })
        }
      }
    } catch (auditError) {
      console.error('Failed to log audit:', auditError)
    }

    return data
  },
}
