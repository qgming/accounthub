import { supabase } from '../config/supabase'
import { isValidUUID, ValidationError } from '../utils/validation'

/**
 * Audit service for logging administrative actions
 */

export interface AuditLogEntry {
  admin_id: string
  action: string
  target_user_id?: string
  target_user_email?: string
  details?: Record<string, unknown>
  ip_address?: string
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

    // Validate target_user_id if provided
    if (entry.target_user_id && !isValidUUID(entry.target_user_id)) {
      throw new ValidationError('无效的目标用户ID格式')
    }

    try {
      const { error } = await supabase
        .from('admin_audit_logs')
        .insert({
          admin_id: entry.admin_id,
          action: entry.action,
          target_user_id: entry.target_user_id || null,
          target_user_email: entry.target_user_email || null,
          details: entry.details || null,
          ip_address: entry.ip_address || null,
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
   * Get audit logs for a specific user
   * @throws {ValidationError} If userId is invalid
   * @throws {AuditError} If fetching fails
   */
  async getLogsByTargetUser(userId: string, limit = 50) {
    if (!isValidUUID(userId)) {
      throw new ValidationError('无效的用户ID格式')
    }

    try {
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .eq('target_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(Math.min(limit, 100))

      if (error) {
        throw new AuditError(`获取用户审计日志失败: ${error.message}`)
      }

      return data || []
    } catch (error) {
      if (error instanceof ValidationError || error instanceof AuditError) {
        throw error
      }
      throw new AuditError('获取用户审计日志过程中发生错误')
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
