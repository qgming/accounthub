// 数据库表类型定义

// 管理员类型
export interface Admin {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  last_login_at: string | null
  created_at: string
  updated_at: string
  auth_user_id: string
}

// 用户类型（普通用户数据，不能登录）
export interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  is_banned: boolean
  registered_from_app_id: string | null
  created_at: string
  updated_at: string
}

// 保留 Profile 类型以兼容旧代码（已废弃，请使用 User）
/** @deprecated 请使用 User 类型 */
export type Profile = User

export interface Application {
  id: string
  name: string
  slug: string
  app_key: string
  description: string | null
  website_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface UserAppMembership {
  id: string
  user_id: string
  application_id: string
  membership_plan_id: string | null
  status: 'active' | 'inactive' | 'expired'
  payment_status: 'paid' | 'pending' | 'failed' | 'refunded' | null
  billing_cycle: 'monthly' | 'quarterly' | 'yearly' | null
  started_at: string
  expires_at: string | null
  trial_ends_at: string | null
  cancelled_at: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface PaymentHistory {
  id: string
  membership_id: string | null
  user_id: string
  amount: number
  currency: string
  payment_method: string | null
  transaction_id: string | null
  status: 'success' | 'failed' | 'pending' | 'refunded'
  invoice_url: string | null
  paid_at: string | null
  created_at: string
}

export interface AdminAuditLog {
  id: string
  admin_id: string | null
  action: string
  resource_type: string
  resource_id: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface MembershipPlan {
  id: string
  application_id: string | null
  plan_id: string
  name: string
  display_name: string
  duration_days: number
  price: number
  currency: string
  billing_cycle: 'monthly' | 'quarterly' | 'yearly' | null
  description: string | null
  features: Record<string, unknown> | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface PaymentConfig {
  id: string
  application_id: string | null
  payment_method: 'alipay' | 'wechat' | 'stripe' | 'manual' | 'epay'
  config: Record<string, unknown>
  is_active: boolean
  is_sandbox: boolean
  created_at: string
  updated_at: string
}

export interface AppVersion {
  id: string
  application_id: string
  version_number: string
  version_code: number
  release_notes: string | null
  download_url: string | null
  file_size: number | null
  file_hash: string | null
  min_supported_version: string | null
  is_force_update: boolean
  is_published: boolean
  platform: 'android' | 'ios' | 'windows' | 'macos' | 'linux' | 'web' | 'all'
  metadata: Record<string, unknown> | null
  published_at: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

// 兑换码类型
export type RedemptionCodeType = 'single' | 'multiple' | 'batch'

// 兑换码状态
export type RedemptionCodeStatus = 'active' | 'expired' | 'exhausted' | 'disabled'

// 兑换码接口
export interface RedemptionCode {
  id: string
  code: string
  code_type: RedemptionCodeType
  application_id: string
  membership_plan_id: string
  max_uses: number
  current_uses: number
  valid_from: string
  valid_until: string | null
  is_active: boolean
  status: RedemptionCodeStatus
  description: string | null
  metadata: Record<string, unknown> | null
  created_by: string | null
  created_at: string
  updated_at: string
}

// 兑换记录接口
export interface RedemptionCodeUse {
  id: string
  redemption_code_id: string
  user_id: string
  membership_id: string | null
  redeemed_at: string
  ip_address: string | null
  user_agent: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

// 配置类型枚举
export type AppConfigType =
  | 'announcement'      // 公告
  | 'llm_config'        // 大模型配置
  | 'api_config'        // API配置
  | 'feature_flag'      // 功能开关
  | 'custom'            // 自定义

// 应用配置接口
export interface AppConfig {
  id: string
  config_key: string
  name: string
  description: string | null
  config_data: Record<string, any>  // JSONB字段
  config_type: AppConfigType | null
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string | null
}

// 配置模板字段类型
export type TemplateFieldType = 'text' | 'textarea' | 'number' | 'password' | 'date' | 'select' | 'switch'

// 配置模板字段定义
export interface TemplateField {
  key: string
  label: string
  type: TemplateFieldType
  required: boolean
  placeholder?: string
  options?: string[]  // 用于 select 类型
}

// 配置模板接口
export interface AppConfigTemplate {
  id: string
  template_name: string
  display_name: string
  description: string | null
  template_fields: TemplateField[]  // JSONB字段
  example_data: Record<string, any> | null  // JSONB字段
  icon: string | null
  category: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
  created_by: string | null
}

// 数据库类型（用于 Supabase 客户端）
export interface Database {
  public: {
    Tables: {
      admins: {
        Row: Admin
        Insert: Omit<Admin, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Admin, 'id' | 'created_at' | 'updated_at'>>
      }
      users: {
        Row: User
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>
      }
      // 保留 profiles 以兼容旧代码（已废弃）
      profiles: {
        Row: User
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>
      }
      applications: {
        Row: Application
        Insert: Omit<Application, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Application, 'id' | 'created_at' | 'updated_at'>>
      }
      user_app_memberships: {
        Row: UserAppMembership
        Insert: Omit<UserAppMembership, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserAppMembership, 'id' | 'created_at' | 'updated_at'>>
      }
      payment_history: {
        Row: PaymentHistory
        Insert: Omit<PaymentHistory, 'id' | 'created_at'>
        Update: Partial<Omit<PaymentHistory, 'id' | 'created_at'>>
      }
      admin_audit_logs: {
        Row: AdminAuditLog
        Insert: Omit<AdminAuditLog, 'id' | 'created_at'>
        Update: Partial<Omit<AdminAuditLog, 'id' | 'created_at'>>
      }
      membership_plans: {
        Row: MembershipPlan
        Insert: Omit<MembershipPlan, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<MembershipPlan, 'id' | 'created_at' | 'updated_at'>>
      }
      payment_configs: {
        Row: PaymentConfig
        Insert: Omit<PaymentConfig, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<PaymentConfig, 'id' | 'created_at' | 'updated_at'>>
      }
      app_versions: {
        Row: AppVersion
        Insert: Omit<AppVersion, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<AppVersion, 'id' | 'created_at' | 'updated_at'>>
      }
      redemption_codes: {
        Row: RedemptionCode
        Insert: Omit<RedemptionCode, 'id' | 'created_at' | 'updated_at' | 'current_uses'>
        Update: Partial<Omit<RedemptionCode, 'id' | 'created_at' | 'updated_at'>>
      }
      redemption_code_uses: {
        Row: RedemptionCodeUse
        Insert: Omit<RedemptionCodeUse, 'id' | 'created_at'>
        Update: Partial<Omit<RedemptionCodeUse, 'id' | 'created_at'>>
      }
      app_configs: {
        Row: AppConfig
        Insert: Omit<AppConfig, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<AppConfig, 'id' | 'created_at' | 'updated_at'>>
      }
      app_config_templates: {
        Row: AppConfigTemplate
        Insert: Omit<AppConfigTemplate, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<AppConfigTemplate, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}
