import { supabase } from '../config/supabase'
import type { UserAppMembership } from '../types/database.types'
import { isValidUUID, ValidationError } from '../utils/validation'
import { auditService } from './audit.service'
import { authService } from './auth.service'

export const membershipsService = {
  // ========== 用户会员管理 ==========

  // 获取所有用户会员（分页）
  async getUserMemberships(page = 1, pageSize = 10, filters?: {
    userId?: string
    applicationId?: string
    status?: string
  }) {
    // 验证筛选参数中的 UUID
    if (filters?.userId && !isValidUUID(filters.userId)) {
      throw new ValidationError('无效的用户ID格式')
    }
    if (filters?.applicationId && !isValidUUID(filters.applicationId)) {
      throw new ValidationError('无效的应用ID格式')
    }

    let query = supabase
      .from('user_app_memberships')
      .select(`
        *,
        users(email, full_name),
        applications(name, slug),
        membership_plans(display_name, plan_id)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // 应用筛选
    if (filters?.userId) {
      query = query.eq('user_id', filters.userId)
    }
    if (filters?.applicationId) {
      query = query.eq('application_id', filters.applicationId)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
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

  // 获取单个用户会员
  async getUserMembership(id: string) {
    if (!isValidUUID(id)) {
      throw new ValidationError('无效的会员ID格式')
    }

    const { data, error } = await supabase
      .from('user_app_memberships')
      .select(`
        *,
        users(email, full_name),
        applications(name, slug),
        membership_plans(display_name, plan_id)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // 创建用户会员
  async createUserMembership(membership: Omit<UserAppMembership, 'id' | 'created_at' | 'updated_at'>) {
    // 验证必要的 UUID 字段
    if (!isValidUUID(membership.user_id)) {
      throw new ValidationError('无效的用户ID格式')
    }
    if (!isValidUUID(membership.application_id)) {
      throw new ValidationError('无效的应用ID格式')
    }

    const { data, error } = await supabase
      .from('user_app_memberships')
      .insert(membership)
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
            action: 'CREATE_MEMBERSHIP',
            resource_type: 'membership',
            resource_id: data.id,
            new_data: { user_id: membership.user_id, application_id: membership.application_id, status: membership.status },
          })
        }
      }
    } catch (auditError) {
      console.error('Failed to log audit:', auditError)
    }

    return data
  },

  // 更新用户会员
  async updateUserMembership(id: string, updates: Partial<UserAppMembership>) {
    if (!isValidUUID(id)) {
      throw new ValidationError('无效的会员ID格式')
    }

    const { data, error } = await supabase
      .from('user_app_memberships')
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
            action: 'UPDATE_MEMBERSHIP',
            resource_type: 'membership',
            resource_id: id,
            new_data: { updates },
          })
        }
      }
    } catch (auditError) {
      console.error('Failed to log audit:', auditError)
    }

    return data
  },

  // 删除用户会员
  async deleteUserMembership(id: string) {
    if (!isValidUUID(id)) {
      throw new ValidationError('无效的会员ID格式')
    }

    const { error } = await supabase
      .from('user_app_memberships')
      .delete()
      .eq('id', id)

    if (error) throw error

    // 记录审计日志
    try {
      const currentUser = await authService.getCurrentUser()
      if (currentUser) {
        const admin = await authService.getAdmin(currentUser.id)
        if (admin) {
          await auditService.logAction({
            admin_id: admin.id,
            action: 'DELETE_MEMBERSHIP',
            resource_type: 'membership',
            resource_id: id,
          })
        }
      }
    } catch (auditError) {
      console.error('Failed to log audit:', auditError)
    }
  },

  // 更新会员状态
  async updateMembershipStatus(id: string, status: string) {
    if (!isValidUUID(id)) {
      throw new ValidationError('无效的会员ID格式')
    }

    const { data, error } = await supabase
      .from('user_app_memberships')
      .update({ status })
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
            action: 'UPDATE_MEMBERSHIP_STATUS',
            resource_type: 'membership',
            resource_id: id,
            new_data: { status },
          })
        }
      }
    } catch (auditError) {
      console.error('Failed to log audit:', auditError)
    }

    return data
  },
}
