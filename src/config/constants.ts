// 应用配置常量
export const APP_NAME = 'AccountHub'
export const APP_DESCRIPTION = '多应用账户中心管理后台'

// 分页配置
export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

// 会员状态
export const MEMBERSHIP_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  EXPIRED: 'expired',
} as const

export const MEMBERSHIP_STATUS_LABELS = {
  [MEMBERSHIP_STATUS.ACTIVE]: '正式会员',
  [MEMBERSHIP_STATUS.INACTIVE]: '无会员',
  [MEMBERSHIP_STATUS.EXPIRED]: '已过期',
}

// 支付状态
export const PAYMENT_STATUS = {
  PAID: 'paid',
  PENDING: 'pending',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const

export const PAYMENT_STATUS_LABELS = {
  [PAYMENT_STATUS.PAID]: '已支付',
  [PAYMENT_STATUS.PENDING]: '待支付',
  [PAYMENT_STATUS.FAILED]: '支付失败',
  [PAYMENT_STATUS.REFUNDED]: '已退款',
}

// 计费周期
export const BILLING_INTERVAL = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  LIFETIME: 'lifetime',
} as const

export const BILLING_INTERVAL_LABELS = {
  [BILLING_INTERVAL.MONTHLY]: '月付',
  [BILLING_INTERVAL.YEARLY]: '年付',
  [BILLING_INTERVAL.LIFETIME]: '终身',
}

// 支付方式
export const PAYMENT_METHOD = {
  STRIPE: 'stripe',
  ALIPAY: 'alipay',
  WECHAT: 'wechat',
  MANUAL: 'manual',
  EPAY: 'epay', // 易支付兼容接口（支持易支付、CodePay、VPay等）
} as const

export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHOD.STRIPE]: 'Stripe',
  [PAYMENT_METHOD.ALIPAY]: '支付宝',
  [PAYMENT_METHOD.WECHAT]: '微信支付',
  [PAYMENT_METHOD.MANUAL]: '手动',
  [PAYMENT_METHOD.EPAY]: '易支付',
}

// 订阅状态
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELLED: 'cancelled',
  UNPAID: 'unpaid',
} as const

export const SUBSCRIPTION_STATUS_LABELS = {
  [SUBSCRIPTION_STATUS.ACTIVE]: '激活',
  [SUBSCRIPTION_STATUS.PAST_DUE]: '逾期',
  [SUBSCRIPTION_STATUS.CANCELLED]: '已取消',
  [SUBSCRIPTION_STATUS.UNPAID]: '未支付',
}

// 兑换码类型
export const REDEMPTION_CODE_TYPE = {
  SINGLE: 'single',
  MULTIPLE: 'multiple',
  BATCH: 'batch',
} as const

export const REDEMPTION_CODE_TYPE_LABELS = {
  [REDEMPTION_CODE_TYPE.SINGLE]: '单次使用',
  [REDEMPTION_CODE_TYPE.MULTIPLE]: '多次使用',
  [REDEMPTION_CODE_TYPE.BATCH]: '批量生成',
}

// 兑换码状态
export const REDEMPTION_CODE_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  EXHAUSTED: 'exhausted',
  DISABLED: 'disabled',
} as const

export const REDEMPTION_CODE_STATUS_LABELS = {
  [REDEMPTION_CODE_STATUS.ACTIVE]: '有效',
  [REDEMPTION_CODE_STATUS.EXPIRED]: '已过期',
  [REDEMPTION_CODE_STATUS.EXHAUSTED]: '已用完',
  [REDEMPTION_CODE_STATUS.DISABLED]: '已禁用',
}
