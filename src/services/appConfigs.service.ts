import { supabase } from '../config/supabase'
import type { AppConfig } from '../types/database.types'

export const appConfigsService = {
  // 获取所有配置（分页+搜索+筛选）
  async getAppConfigs(
    page = 1,
    pageSize = 10,
    filters?: {
      configType?: string
      isActive?: boolean
      search?: string
    }
  ) {
    let query = supabase
      .from('app_configs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // 应用筛选
    if (filters?.configType) {
      query = query.eq('config_type', filters.configType)
    }
    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive)
    }
    if (filters?.search) {
      query = query.or(
        `config_key.ilike.%${filters.search}%,name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      )
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

  // 获取单个配置
  async getAppConfig(id: string) {
    const { data, error } = await supabase
      .from('app_configs')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // 根据config_key获取配置
  async getAppConfigByKey(configKey: string) {
    const { data, error } = await supabase
      .from('app_configs')
      .select('*')
      .eq('config_key', configKey)
      .eq('is_active', true)
      .single()

    if (error) throw error
    return data
  },

  // 创建配置
  async createAppConfig(config: Omit<AppConfig, 'id' | 'created_at' | 'updated_at'>) {
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('app_configs')
      .insert({
        ...config,
        created_by: user?.id,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 更新配置
  async updateAppConfig(id: string, updates: Partial<AppConfig>) {
    const { data, error } = await supabase
      .from('app_configs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 删除配置
  async deleteAppConfig(id: string) {
    const { error } = await supabase
      .from('app_configs')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // 切换激活状态
  async toggleActive(id: string, isActive: boolean) {
    const { data, error } = await supabase
      .from('app_configs')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },
}
