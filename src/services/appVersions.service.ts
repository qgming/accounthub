import { supabase } from '../config/supabase'
import type { AppVersion } from '../types/database.types'

export const appVersionsService = {
  // 获取所有版本（分页）
  async getAppVersions(
    page = 1,
    pageSize = 10,
    filters?: {
      applicationId?: string
      platform?: string
      isPublished?: boolean
      search?: string
    }
  ) {
    let query = supabase
      .from('app_versions')
      .select('*, applications(name, slug)', { count: 'exact' })
      .order('created_at', { ascending: false })

    // 应用筛选条件
    if (filters?.applicationId) {
      query = query.eq('application_id', filters.applicationId)
    }
    if (filters?.platform) {
      query = query.eq('platform', filters.platform)
    }
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
    const { data, error } = await supabase
      .from('app_versions')
      .select('*, applications(name, slug)')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // 获取最新版本（供应用端使用）
  async getLatestVersion(applicationId: string, platform: string) {
    const { data, error } = await supabase
      .from('app_versions')
      .select('*')
      .eq('application_id', applicationId)
      .eq('platform', platform)
      .eq('is_published', true)
      .order('version_code', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      // 如果没有找到特定平台的版本，尝试查找 'all' 平台的版本
      if (error.code === 'PGRST116') {
        const { data: allPlatformData, error: allPlatformError } = await supabase
          .from('app_versions')
          .select('*')
          .eq('application_id', applicationId)
          .eq('platform', 'all')
          .eq('is_published', true)
          .order('version_code', { ascending: false })
          .limit(1)
          .single()

        if (allPlatformError) throw allPlatformError
        return allPlatformData
      }
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
