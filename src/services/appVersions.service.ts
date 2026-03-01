import { supabase } from '../config/supabase'
import type { AppVersion } from '../types/database.types'
import { isValidUUID, ValidationError } from '../utils/validation'

export const appVersionsService = {
  // 获取所有版本（分页）
  async getAppVersions(
    page = 1,
    pageSize = 10,
    filters?: {
      applicationId?: string
      isPublished?: boolean
      search?: string
    }
  ) {
    // 验证 applicationId
    if (filters?.applicationId && !isValidUUID(filters.applicationId)) {
      throw new ValidationError('无效的应用ID格式')
    }

    let query = supabase
      .from('app_versions')
      .select('*, applications(name, slug)', { count: 'exact' })
      .order('created_at', { ascending: false })

    // 应用筛选条件
    if (filters?.applicationId) {
      query = query.eq('application_id', filters.applicationId)
    }
    // 注意：数据库 app_versions 表不含 platform 字段，已移除平台筛选
    if (filters?.isPublished !== undefined) {
      query = query.eq('is_published', filters.isPublished)
    }
    if (filters?.search) {
      query = query.or(`version_number.ilike.%${filters.search}%,release_notes.ilike.%${filters.search}%`)
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

  // 获取单个版本
  async getAppVersion(id: string) {
    if (!isValidUUID(id)) {
      throw new ValidationError('无效的版本ID格式')
    }

    const { data, error } = await supabase
      .from('app_versions')
      .select('*, applications(name, slug)')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // 获取最新版本（供应用端使用，数据库无 platform 字段，返回最新已发布版本）
  async getLatestVersion(applicationId: string) {
    if (!isValidUUID(applicationId)) {
      throw new ValidationError('无效的应用ID格式')
    }

    const { data, error } = await supabase
      .from('app_versions')
      .select('*')
      .eq('application_id', applicationId)
      .eq('is_published', true)
      .order('version_code', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },

  // 创建版本
  async createAppVersion(version: Omit<AppVersion, 'id' | 'created_at' | 'updated_at'>) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('app_versions')
      .insert({
        ...version,
        created_by: user?.id,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 更新版本信息
  async updateAppVersion(id: string, updates: Partial<AppVersion>) {
    if (!isValidUUID(id)) {
      throw new ValidationError('无效的版本ID格式')
    }

    const { data, error } = await supabase
      .from('app_versions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 删除版本
  async deleteAppVersion(id: string) {
    if (!isValidUUID(id)) {
      throw new ValidationError('无效的版本ID格式')
    }

    const { error } = await supabase.from('app_versions').delete().eq('id', id)

    if (error) throw error
  },

  // 发布版本
  async publishVersion(id: string) {
    const { data, error } = await supabase
      .from('app_versions')
      .update({
        is_published: true,
        published_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 取消发布
  async unpublishVersion(id: string) {
    const { data, error } = await supabase
      .from('app_versions')
      .update({
        is_published: false,
        published_at: null,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 切换发布状态
  async togglePublished(id: string, isPublished: boolean) {
    if (isPublished) {
      return this.publishVersion(id)
    } else {
      return this.unpublishVersion(id)
    }
  },
}
