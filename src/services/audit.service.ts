import { supabase } from '../config/supabase'
import { isValidUUID, ValidationError } from '../utils/validation'

/**
 * 审计日志服务 - 记录管理员操作
 * 对应数据库 admin_audit_logs 表字段：
 * id, admin_id, action, resource_type, resource_id,
 * old_data, new_data, ip_address, user_agent, created_at
 */

export interface AuditLogEntry {
  admin_id: string
  action: string
  resource_type: string
  resource_id?: string
  old_data?: Record<string, unknown>
  new_data?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
}

/**
 * Custom error class for audit errors
 */
class AuditError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuditError'
  }
}

export const auditService = {
  /**
   * Log an administrative action
   * @throws {ValidationError} If input validation fails
   * @throws {AuditError} If logging fails
   */
  async logAction(entry: AuditLogEntry): Promise<void> {
    // Validate admin_id
    if (!isValidUUID(entry.admin_id)) {
      throw new ValidationError('无效的管理员ID格式')
    }

    // Validate resource_id if provided
    if (entry.resource_id && !isValidUUID(entry.resource_id)) {
      throw new ValidationError('无效的资源ID格式')
    }

    try {
      const { error } = await supabase
        .from('admin_audit_logs')
        .insert({
          admin_id: entry.admin_id,
          action: entry.action,
          resource_type: entry.resource_type,
          resource_id: entry.resource_id || null,
          old_data: entry.old_data || null,
          new_data: entry.new_data || null,
          ip_address: entry.ip_address || null,
          user_agent: entry.user_agent || null,
        })

      if (error) {
        throw new AuditError(`记录审计日志失败: ${error.message}`)
      }
    } catch (error) {
      if (error instanceof ValidationError || error instanceof AuditError) {
        throw error
      }
      throw new AuditError('记录审计日志过程中发生错误')
    }
  },

  /**
   * Get audit logs with pagination
   * @throws {ValidationError} If pagination parameters are invalid
   * @throws {AuditError} If fetching fails
   */
  async getLogs(options?: {
    adminId?: string
    action?: string
    resourceType?: string
    limit?: number
    offset?: number
  }) {
    try {
      let query = supabase
        .from('admin_audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      // Filter by admin_id if provided
      if (options?.adminId) {
        if (!isValidUUID(options.adminId)) {
          throw new ValidationError('无效的管理员ID格式')
        }
        query = query.eq('admin_id', options.adminId)
      }

      // Filter by action if provided
      if (options?.action) {
        query = query.eq('action', options.action)
      }

      // Filter by resource_type if provided
      if (options?.resourceType) {
        query = query.eq('resource_type', options.resourceType)
      }

      // Apply pagination
      const limit = Math.min(options?.limit || 50, 100)
      const offset = Math.max(options?.offset || 0, 0)
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) {
        throw new AuditError(`获取审计日志失败: ${error.message}`)
      }

      return {
        data: data || [],
        count: count || 0,
        limit,
        offset,
      }
    } catch (error) {
      if (error instanceof ValidationError || error instanceof AuditError) {
        throw error
      }
      throw new AuditError('获取审计日志过程中发生错误')
    }
  },

  /**
   * Get audit logs for a specific resource
   * @throws {ValidationError} If resourceId is invalid
   * @throws {AuditError} If fetching fails
   */
  async getLogsByResource(resourceId: string, limit = 50) {
    if (!isValidUUID(resourceId)) {
      throw new ValidationError('无效的资源ID格式')
    }

    try {
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .eq('resource_id', resourceId)
        .order('created_at', { ascending: false })
        .limit(Math.min(limit, 100))

      if (error) {
        throw new AuditError(`获取资源审计日志失败: ${error.message}`)
      }

      return data || []
    } catch (error) {
      if (error instanceof ValidationError || error instanceof AuditError) {
        throw error
      }
      throw new AuditError('获取资源审计日志过程中发生错误')
    }
  },

  /**
   * Get recent audit logs
   * @throws {AuditError} If fetching fails
   */
  async getRecentLogs(limit = 20) {
    try {
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(Math.min(limit, 100))

      if (error) {
        throw new AuditError(`获取最近审计日志失败: ${error.message}`)
      }

      return data || []
    } catch (error) {
      if (error instanceof AuditError) {
        throw error
      }
      throw new AuditError('获取最近审计日志过程中发生错误')
    }
  },
}
