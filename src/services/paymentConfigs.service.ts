import { supabase } from '../config/supabase'
import type { Database } from '../types/database.types'

type PaymentConfigInsert = Database['public']['Tables']['payment_configs']['Insert']
type PaymentConfigUpdate = Database['public']['Tables']['payment_configs']['Update']

export const paymentConfigsService = {
  // 获取所有支付配置（分页）
  async getPaymentConfigs(page = 1, pageSize = 10, filters?: {
    applicationId?: string
    paymentMethod?: string
  }) {
    let query = supabase
      .from('payment_configs')
      .select(`
        *,
        applications(name, slug)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // 应用筛选
    if (filters?.applicationId) {
      query = query.eq('application_id', filters.applicationId)
    }
    if (filters?.paymentMethod) {
      query = query.eq('payment_method', filters.paymentMethod)
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

  // 获取单个支付配置
  async getPaymentConfig(id: string) {
    const { data, error } = await supabase
      .from('payment_configs')
      .select(`
        *,
        applications(name, slug)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // 创建支付配置
  async createPaymentConfig(config: PaymentConfigInsert) {
    const { data, error } = await supabase
      .from('payment_configs')
      .insert(config)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 更新支付配置
  async updatePaymentConfig(id: string, updates: PaymentConfigUpdate) {
    const { data, error } = await supabase
      .from('payment_configs')
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

  // 删除支付配置
  async deletePaymentConfig(id: string) {
    const { error } = await supabase
      .from('payment_configs')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
