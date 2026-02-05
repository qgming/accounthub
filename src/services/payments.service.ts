import { supabase } from '../config/supabase'
import type { PaymentHistory } from '../types/database.types'

export const paymentsService = {
  // 获取所有支付历史（分页）
  async getPayments(page = 1, pageSize = 10, filters?: {
    userId?: string
    membershipId?: string
    status?: string
  }) {
    let query = supabase
      .from('payment_history')
      .select(`
        *,
        users(email, full_name),
        user_app_memberships(
          id,
          users(email, full_name),
          applications(name, slug)
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // 应用筛选
    if (filters?.userId) {
      query = query.eq('user_id', filters.userId)
    }
    if (filters?.membershipId) {
      query = query.eq('membership_id', filters.membershipId)
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

  // 获取单个支付记录
  async getPayment(id: string) {
    const { data, error } = await supabase
      .from('payment_history')
      .select(`
        *,
        users(email, full_name),
        user_app_memberships(
          id,
          users(email, full_name),
          applications(name, slug)
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // 创建支付记录
  async createPayment(payment: Omit<PaymentHistory, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('payment_history')
      .insert(payment)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 更新支付记录
  async updatePayment(id: string, updates: Partial<PaymentHistory>) {
    const { data, error } = await supabase
      .from('payment_history')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 删除支付记录
  async deletePayment(id: string) {
    const { error } = await supabase
      .from('payment_history')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
