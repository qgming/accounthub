import { supabase } from '../config/supabase'
import type { UserAppMembership } from '../types/database.types'

export const membershipsService = {
  // ========== 用户会员管理 ==========

  // 获取所有用户会员（分页）
  async getUserMemberships(page = 1, pageSize = 10, filters?: {
    userId?: string
    applicationId?: string
    status?: string
  }) {
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
    const { data, error } = await supabase
      .from('user_app_memberships')
      .insert(membership)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 更新用户会员
  async updateUserMembership(id: string, updates: Partial<UserAppMembership>) {
    const { data, error } = await supabase
      .from('user_app_memberships')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 删除用户会员
  async deleteUserMembership(id: string) {
    const { error } = await supabase
      .from('user_app_memberships')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // 更新会员状态
  async updateMembershipStatus(id: string, status: string) {
    const { data, error } = await supabase
      .from('user_app_memberships')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },
}
