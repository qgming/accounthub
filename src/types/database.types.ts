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
    }
  }
}
