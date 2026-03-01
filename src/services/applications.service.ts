import { supabase } from '../config/supabase'
import type { Application } from '../types/database.types'
import { generateAppKey } from '../utils/appkey'
import { isValidUUID, ValidationError } from '../utils/validation'
import { auditService } from './audit.service'
import { authService } from './auth.service'

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
    if (!isValidUUID(id)) {
      throw new ValidationError('无效的应用ID格式')
    }

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

    // 记录审计日志
    try {
      if (user) {
        const admin = await authService.getAdmin(user.id)
        if (admin && data) {
          await auditService.logAction({
            admin_id: admin.id,
            action: 'CREATE_APPLICATION',
            resource_type: 'application',
            resource_id: data.id,
            new_data: { name: data.name, slug: data.slug },
          })
        }
      }
    } catch (auditError) {
      console.error('Failed to log audit:', auditError)
    }

    return data
  },

  // 更新应用信息
  async updateApplication(id: string, updates: Partial<Application>) {
    if (!isValidUUID(id)) {
      throw new ValidationError('无效的应用ID格式')
    }

    const { data, error } = await supabase
      .from('applications')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // 记录审计日志
    try {
      const currentUser = await authService.getCurrentUser()
      if (currentUser) {
        const admin = await authService.getAdmin(currentUser.id)
        if (admin && data) {
          await auditService.logAction({
            admin_id: admin.id,
            action: 'UPDATE_APPLICATION',
            resource_type: 'application',
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

  // 删除应用
  async deleteApplication(id: string) {
    if (!isValidUUID(id)) {
      throw new ValidationError('无效的应用ID格式')
    }

    // 删除前先获取应用信息用于审计
    const { data: existing } = await supabase
      .from('applications')
      .select('name, slug')
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', id)

    if (error) throw error

    // 记录审计日志
    try {
      const currentUser = await authService.getCurrentUser()
      if (currentUser) {
        const admin = await authService.getAdmin(currentUser.id)
        if (admin) {
          await auditService.logAction({
            admin_id: admin.id,
            action: 'DELETE_APPLICATION',
            resource_type: 'application',
            resource_id: id,
            old_data: existing ? { name: existing.name, slug: existing.slug } : undefined,
          })
        }
      }
    } catch (auditError) {
      console.error('Failed to log audit:', auditError)
    }
  },

  // 切换应用激活状态
  async toggleActive(id: string, isActive: boolean) {
    if (!isValidUUID(id)) {
      throw new ValidationError('无效的应用ID格式')
    }

    const { data, error } = await supabase
      .from('applications')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // 记录审计日志
    try {
      const currentUser = await authService.getCurrentUser()
      if (currentUser) {
        const admin = await authService.getAdmin(currentUser.id)
        if (admin && data) {
          await auditService.logAction({
            admin_id: admin.id,
            action: isActive ? 'ACTIVATE_APPLICATION' : 'DEACTIVATE_APPLICATION',
            resource_type: 'application',
            resource_id: id,
            new_data: { is_active: isActive },
          })
        }
      }
    } catch (auditError) {
      console.error('Failed to log audit:', auditError)
    }

    return data
  },
}
