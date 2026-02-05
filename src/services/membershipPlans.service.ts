import { supabase } from '../config/supabase'
import type { Database } from '../types/database.types'

type MembershipPlanInsert = Database['public']['Tables']['membership_plans']['Insert']
type MembershipPlanUpdate = Database['public']['Tables']['membership_plans']['Update']

export const membershipPlansService = {
  // 获取所有会员套餐（分页）
  async getMembershipPlans(page = 1, pageSize = 10, filters?: {
    applicationId?: string
    isActive?: boolean
  }) {
    let query = supabase
      .from('membership_plans')
      .select(`
        *,
        applications(name, slug)
      `, { count: 'exact' })
      .order('sort_order', { ascending: true })

    // 应用筛选
    if (filters?.applicationId) {
      query = query.eq('application_id', filters.applicationId)
    }
    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive)
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

  // 获取单个会员套餐
  async getMembershipPlan(id: string) {
    const { data, error } = await supabase
      .from('membership_plans')
      .select(`
        *,
        applications(name, slug)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // 创建会员套餐
  async createMembershipPlan(plan: MembershipPlanInsert) {
    const { data, error } = await supabase
      .from('membership_plans')
      .insert(plan)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 更新会员套餐
  async updateMembershipPlan(id: string, updates: MembershipPlanUpdate) {
    const { data, error } = await supabase
      .from('membership_plans')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 删除会员套餐
  async deleteMembershipPlan(id: string) {
    const { error } = await supabase
      .from('membership_plans')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // 更新套餐排序
  async updatePlanOrder(planId: string, newOrder: number) {
    const { data, error } = await supabase
      .from('membership_plans')
      .update({ sort_order: newOrder, updated_at: new Date().toISOString() })
      .eq('id', planId)
      .select()
      .single()

    if (error) throw error
    return data
  },
}
