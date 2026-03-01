import { supabase } from '../config/supabase'
import type { Database } from '../types/database.types'
import { customAlphabet } from 'nanoid'
import { isValidUUID, ValidationError } from '../utils/validation'
import { auditService } from './audit.service'
import { authService } from './auth.service'

type RedemptionCodeInsert = Database['public']['Tables']['redemption_codes']['Insert']
type RedemptionCodeUpdate = Database['public']['Tables']['redemption_codes']['Update']

// 使用 nanoid 生成兑换码，去除易混淆字符 I、O、0、1
const generateNanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 16)

// 生成格式化兑换码（XXXX-XXXX-XXXX-XXXX）
function generateCode(): string {
  const raw = generateNanoid()
  return raw.match(/.{1,4}/g)?.join('-') || raw
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
    if (!isValidUUID(id)) {
      throw new ValidationError('无效的兑换码ID格式')
    }

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
      created_by: user?.id || null,
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

    // 记录审计日志
    try {
      if (user) {
        const admin = await authService.getAdmin(user.id)
        if (admin && data) {
          await auditService.logAction({
            admin_id: admin.id,
            action: 'CREATE_REDEMPTION_CODE',
            resource_type: 'redemption_code',
            resource_id: data.id,
            new_data: { code: data.code, application_id: data.application_id },
          })
        }
      }
    } catch (auditError) {
      console.error('Failed to log audit:', auditError)
    }

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
        created_by: user?.id || null,
      })
    }

    const { data, error } = await supabase.from('redemption_codes').insert(codes).select()

    if (error) throw error
    return data
  },

  // 更新兑换码
  async updateRedemptionCode(id: string, updates: RedemptionCodeUpdate) {
    if (!isValidUUID(id)) {
      throw new ValidationError('无效的兑换码ID格式')
    }

    const { data, error } = await supabase
      .from('redemption_codes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // 记录审计日志（禁用操作使用特定 action 标识）
    try {
      const currentUser = await authService.getCurrentUser()
      if (currentUser) {
        const admin = await authService.getAdmin(currentUser.id)
        if (admin && data) {
          const action = updates.status === 'disabled' ? 'DISABLE_REDEMPTION_CODE' : 'UPDATE_REDEMPTION_CODE'
          await auditService.logAction({
            admin_id: admin.id,
            action,
            resource_type: 'redemption_code',
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

  // 删除兑换码
  async deleteRedemptionCode(id: string) {
    if (!isValidUUID(id)) {
      throw new ValidationError('无效的兑换码ID格式')
    }

    const { error } = await supabase.from('redemption_codes').delete().eq('id', id)

    if (error) throw error
  },

  // 获取兑换码使用记录
  async getRedemptionCodeUses(codeId: string, page = 1, pageSize = 10) {
    if (!isValidUUID(codeId)) {
      throw new ValidationError('无效的兑换码ID格式')
    }
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
      (async () => {
        let activeQuery = supabase
          .from('redemption_codes')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
        if (applicationId) {
          activeQuery = activeQuery.eq('application_id', applicationId)
        }
        return activeQuery
      })(),
      (async () => {
        let expiredQuery = supabase
          .from('redemption_codes')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'expired')
        if (applicationId) {
          expiredQuery = expiredQuery.eq('application_id', applicationId)
        }
        return expiredQuery
      })(),
      (async () => {
        let exhaustedQuery = supabase
          .from('redemption_codes')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'exhausted')
        if (applicationId) {
          exhaustedQuery = exhaustedQuery.eq('application_id', applicationId)
        }
        return exhaustedQuery
      })(),
    ])

    return {
      total: totalResult.count || 0,
      active: activeResult.count || 0,
      expired: expiredResult.count || 0,
      exhausted: exhaustedResult.count || 0,
    }
  },
}
