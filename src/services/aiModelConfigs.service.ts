import { supabase } from '../config/supabase'
import type { AiModelConfig } from '../types/database.types'
import { isValidUUID, ValidationError } from '../utils/validation'

// 创建/更新时的参数类型（包含明文 api_key，created_by 由 service 内部从当前用户获取）
export type CreateAiModelConfigInput = Omit<AiModelConfig, 'id' | 'created_at' | 'updated_at' | 'api_key' | 'created_by'> & {
  api_key: string
}

export type UpdateAiModelConfigInput = Partial<Omit<AiModelConfig, 'id' | 'created_at' | 'updated_at' | 'api_key' | 'created_by'>> & {
  // 仅在需要更新 api_key 时传入，否则省略不更新
  api_key?: string
}

export const aiModelConfigsService = {
  // 获取模型配置列表（分页+搜索+筛选），不 select api_key 字段
  async getAiModelConfigs(
    page = 1,
    pageSize = 10,
    filters?: {
      provider?: string
      applicationId?: string | null
      isActive?: boolean
      search?: string
    }
  ) {
    let query = supabase
      .from('ai_model_configs')
      .select(
        'id, model_key, name, description, provider, base_url, model, application_id, extra_config, is_active, created_at, updated_at, created_by',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })

    if (filters?.provider) {
      query = query.eq('provider', filters.provider)
    }
    if (filters?.applicationId === null) {
      query = query.is('application_id', null)
    } else if (filters?.applicationId) {
      query = query.eq('application_id', filters.applicationId)
    }
    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive)
    }
    if (filters?.search) {
      query = query.or(
        `model_key.ilike.%${filters.search}%,name.ilike.%${filters.search}%`
      )
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) throw error

    return {
      data: (data || []) as AiModelConfig[],
      total: count || 0,
      page,
      pageSize,
    }
  },

  // 获取单个模型配置（不含 api_key）
  async getAiModelConfig(id: string) {
    if (!isValidUUID(id)) {
      throw new ValidationError('无效的配置ID格式')
    }

    const { data, error } = await supabase
      .from('ai_model_configs')
      .select(
        'id, model_key, name, description, provider, base_url, model, application_id, extra_config, is_active, created_at, updated_at, created_by'
      )
      .eq('id', id)
      .single()

    if (error) throw error
    return data as AiModelConfig
  },

  // 创建模型配置（直接写入明文 api_key，RLS 保护客户端无法读取）
  async createAiModelConfig(config: CreateAiModelConfigInput) {
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('ai_model_configs')
      .insert({
        ...config,
        created_by: user?.id,
      })
      .select(
        'id, model_key, name, description, provider, base_url, model, application_id, extra_config, is_active, created_at, updated_at, created_by'
      )
      .single()

    if (error) throw error
    return data as AiModelConfig
  },

  // 更新模型配置
  async updateAiModelConfig(id: string, updates: UpdateAiModelConfigInput) {
    if (!isValidUUID(id)) {
      throw new ValidationError('无效的配置ID格式')
    }

    const payload: Record<string, unknown> = { ...updates }
    // 未提供 api_key 时不更新该字段
    if (!updates.api_key) {
      delete payload.api_key
    }

    const { data, error } = await supabase
      .from('ai_model_configs')
      .update(payload)
      .eq('id', id)
      .select(
        'id, model_key, name, description, provider, base_url, model, application_id, extra_config, is_active, created_at, updated_at, created_by'
      )
      .single()

    if (error) throw error
    return data as AiModelConfig
  },

  // 查看单条记录的明文 api_key（仅管理员可用，用于编辑页"眼睛"功能）
  async getApiKey(id: string): Promise<string> {
    if (!isValidUUID(id)) {
      throw new ValidationError('无效的配置ID格式')
    }

    const { data, error } = await supabase
      .from('ai_model_configs')
      .select('api_key')
      .eq('id', id)
      .single()

    if (error) throw error
    return (data as { api_key: string }).api_key
  },

  // 删除模型配置
  async deleteAiModelConfig(id: string) {
    if (!isValidUUID(id)) {
      throw new ValidationError('无效的配置ID格式')
    }

    const { error } = await supabase
      .from('ai_model_configs')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // 切换激活状态
  async toggleActive(id: string, isActive: boolean) {
    if (!isValidUUID(id)) {
      throw new ValidationError('无效的配置ID格式')
    }

    const { data, error } = await supabase
      .from('ai_model_configs')
      .update({ is_active: isActive })
      .eq('id', id)
      .select(
        'id, model_key, name, description, provider, base_url, model, application_id, extra_config, is_active, created_at, updated_at, created_by'
      )
      .single()

    if (error) throw error
    return data as AiModelConfig
  },
}
