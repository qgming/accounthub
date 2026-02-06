import { supabase } from '../config/supabase'
import type { Database } from '../types/database.types'

type RedemptionCodeInsert = Database['public']['Tables']['redemption_codes']['Insert']
type RedemptionCodeUpdate = Database['public']['Tables']['redemption_codes']['Update']

// 生成随机兑换码
function generateCode(length = 16): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 去除易混淆字符I、O、0、1
  let code = ''
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  // 格式化为 XXXX-XXXX-XXXX-XXXX
  return code.match(/.{1,4}/g)?.join('-') || code
}

export const redemptionCodesService = {
  // 获取兑换码列表（分页）
  async getRedemptionCodes(
    page = 1,
    pageSize = 10,
    filters?: {
      applicationId?: string
      status?: string
      codeType?: string
      search?: string
    }
  ) {
    let query = supabase
      .from('redemption_codes')
      .select(
        `
        *,
        applications(name, slug),
        membership_plans(plan_id, display_name, price, currency)
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })

    // 应用筛选
    if (filters?.applicationId) {
      query = query.eq('application_id', filters.applicationId)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.codeType) {
      query = query.eq('code_type', filters.codeType)
    }
    if (filters?.search) {
      query = query.or(`code.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
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

  // 获取单个兑换码
  async getRedemptionCode(id: string) {
    const { data, error } = await supabase
      .from('redemption_codes')
      .select(
        `
        *,
        applications(name, slug),
        membership_plans(plan_id, display_name, price, currency, duration_days)
      `
      )
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // 创建兑换码
  async createRedemptionCode(code: RedemptionCodeInsert & { auto_generate?: boolean }) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const codeData: RedemptionCodeInsert = {
      ...code,
      code: code.auto_generate ? generateCode() : code.code,
      created_by: user?.id,
    }

    // 移除 auto_generate 字段
    const { auto_generate, ...insertData } = codeData as RedemptionCodeInsert & {
      auto_generate?: boolean
    }

    const { data, error } = await supabase
      .from('redemption_codes')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 批量生成兑换码
  async batchCreateRedemptionCodes(count: number, template: Omit<RedemptionCodeInsert, 'code'>) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const codes: RedemptionCodeInsert[] = []
    for (let i = 0; i < count; i++) {
      codes.push({
        ...template,
        code: generateCode(),
        created_by: user?.id,
      })
    }

    const { data, error } = await supabase.from('redemption_codes').insert(codes).select()

    if (error) throw error
    return data
  },

  // 更新兑换码
  async updateRedemptionCode(id: string, updates: RedemptionCodeUpdate) {
    const { data, error } = await supabase
      .from('redemption_codes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 删除兑换码
  async deleteRedemptionCode(id: string) {
    const { error } = await supabase.from('redemption_codes').delete().eq('id', id)

    if (error) throw error
  },

  // 获取兑换码使用记录
  async getRedemptionCodeUses(codeId: string, page = 1, pageSize = 10) {
    let query = supabase
      .from('redemption_code_uses')
      .select(
        `
        *,
        users(email, full_name),
        user_app_memberships(status, expires_at)
      `,
        { count: 'exact' }
      )
      .eq('redemption_code_id', codeId)
      .order('redeemed_at', { ascending: false })

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

  // 导出兑换码（包含关联数据）
  async exportRedemptionCodes(filters?: { applicationId?: string; status?: string }) {
    let query = supabase
      .from('redemption_codes')
      .select(
        `
        *,
        applications(name),
        membership_plans(display_name)
      `
      )
      .order('created_at', { ascending: false })

    if (filters?.applicationId) {
      query = query.eq('application_id', filters.applicationId)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query

    if (error) throw error

    // 格式化数据，添加应用名称和套餐名称字段
    return data?.map((item: any) => ({
      ...item,
      application_name: item.applications?.name || '-',
      plan_name: item.membership_plans?.display_name || '-',
    }))
  },

  // 获取兑换码统计
  async getRedemptionCodeStats(applicationId?: string) {
    let query = supabase.from('redemption_codes').select('status', { count: 'exact', head: true })

    if (applicationId) {
      query = query.eq('application_id', applicationId)
    }

    const [totalResult, activeResult, expiredResult, exhaustedResult] = await Promise.all([
      query,
      supabase
        .from('redemption_codes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .then((r) => (applicationId ? r.eq('application_id', applicationId) : r)),
      supabase
        .from('redemption_codes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'expired')
        .then((r) => (applicationId ? r.eq('application_id', applicationId) : r)),
      supabase
        .from('redemption_codes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'exhausted')
        .then((r) => (applicationId ? r.eq('application_id', applicationId) : r)),
    ])

    return {
      total: totalResult.count || 0,
      active: activeResult.count || 0,
      expired: expiredResult.count || 0,
      exhausted: exhaustedResult.count || 0,
    }
  },
}
