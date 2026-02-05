import { supabase } from '../config/supabase'
import type { Application } from '../types/database.types'
import { generateAppKey } from '../utils/appkey'

export const applicationsService = {
  // 获取所有应用（分页）
  async getApplications(page = 1, pageSize = 10, search?: string) {
    let query = supabase
      .from('applications')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // 搜索功能
    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%,description.ilike.%${search}%`)
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

  // 获取单个应用
  async getApplication(id: string) {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // 创建应用
  async createApplication(application: Omit<Application, 'id' | 'created_at' | 'updated_at' | 'app_key'>) {
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('applications')
      .insert({
        ...application,
        app_key: generateAppKey(),
        created_by: user?.id,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 更新应用信息
  async updateApplication(id: string, updates: Partial<Application>) {
    const { data, error } = await supabase
      .from('applications')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 删除应用
  async deleteApplication(id: string) {
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // 切换应用激活状态
  async toggleActive(id: string, isActive: boolean) {
    const { data, error } = await supabase
      .from('applications')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },
}
