import { supabase } from '../config/supabase'
import type { PaymentConfig } from '../types/database.types'
import { nanoid } from 'nanoid'
import { md5 as md5Legacy } from '@noble/hashes/legacy'

export interface PaymentTestRequest {
  config: PaymentConfig
  amount: number
}

export interface PaymentTestResponse {
  success: boolean
  paymentUrl?: string
  qrCode?: string
  orderId?: string
  message?: string
}

/**
 * MD5 哈希函数
 */
function md5Hash(str: string): string {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hash = md5Legacy(data)
  // 将字节数组转换为十六进制字符串
  const bytes = Array.from(hash) as number[]
  return bytes.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * 生成易支付签名
 * 按照易支付官方规则：
 * 1. 过滤空值和签名参数（sign、sign_type）
 * 2. 按照参数名ASCII码排序
 * 3. 拼接成URL键值对格式
 * 4. 拼接商户密钥并MD5加密（小写）
 */
function generateEpaySign(params: Record<string, string>, key: string): string {
  // 1. 过滤空值和签名参数
  const filteredParams: Record<string, string> = {}
  Object.keys(params).forEach(k => {
    const value = params[k]
    if (value !== '' && value !== null && value !== undefined &&
        k !== 'sign' && k !== 'sign_type') {
      filteredParams[k] = value
    }
  })

  // 2. 按照键名排序
  const sortedKeys = Object.keys(filteredParams).sort()

  // 3. 拼接参数
  const signStr = sortedKeys
    .map(k => `${k}=${filteredParams[k]}`)
    .join('&') + key

  // 4. MD5签名（小写）
  return md5Hash(signStr)
}

/**
 * 生成支付宝支付链接
 */
function generateAlipayUrl(config: PaymentConfig, amount: number, orderId: string): string {
  const configData = config.config as Record<string, string>
  const gateway = configData.gateway || 'https://openapi.alipay.com/gateway.do'
  const appId = configData.app_id

  // 构建支付宝请求参数
  const params = new URLSearchParams({
    app_id: appId,
    method: 'alipay.trade.page.pay',
    charset: 'utf-8',
    sign_type: 'RSA2',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    version: '1.0',
    notify_url: window.location.origin + '/api/payment/notify',
    return_url: window.location.origin + '/payment/result',
    biz_content: JSON.stringify({
      out_trade_no: orderId,
      product_code: 'FAST_INSTANT_TRADE_PAY',
      total_amount: amount.toFixed(2),
      subject: '支付测试订单',
      body: `测试订单 - ${orderId}`,
    }),
  })

  // 注意：这里没有签名，实际使用时需要在后端进行签名
  return `${gateway}?${params.toString()}`
}

/**
 * 生成易支付支付链接
 */
function generateEpayUrl(config: PaymentConfig, amount: number, orderId: string): string {
  const configData = config.config as Record<string, string>
  const apiUrl = configData.api_url
  const pid = configData.pid
  const key = configData.key
  const type = configData.type || 'alipay'

  // 构建易支付请求参数（不包含sign）
  const params: Record<string, string> = {
    pid: pid,
    type: type,
    out_trade_no: orderId,
    notify_url: window.location.origin + '/api/payment/notify',
    return_url: window.location.origin + '/payment/result',
    name: '支付测试订单',
    money: amount.toFixed(2),
    sitename: 'AccountHub',
  }

  // 生成签名
  const sign = generateEpaySign(params, key)

  // 添加签名到参数
  const urlParams = new URLSearchParams({
    ...params,
    sign: sign,
  })

  return `${apiUrl}/submit.php?${urlParams.toString()}`
}

export const paymentTestService = {
  /**
   * 发起支付测试
   * 在前端直接生成支付链接
   */
  async testPayment(request: PaymentTestRequest): Promise<PaymentTestResponse> {
    try {
      const { config, amount } = request
      const orderId = `TEST_${Date.now()}_${nanoid(8)}`

      let paymentUrl = ''

      // 根据支付方式生成对应的支付链接
      switch (config.payment_method) {
        case 'alipay':
          // 如果配置中有易支付信息，使用易支付接口
          if ((config.config as Record<string, string>).api_url) {
            paymentUrl = generateEpayUrl(config, amount, orderId)
          } else {
            paymentUrl = generateAlipayUrl(config, amount, orderId)
          }
          break
        case 'wxpay':
        case 'qqpay':
        case 'bank':
        case 'jdpay':
        case 'paypal':
          // 这些都通过易支付接口
          paymentUrl = generateEpayUrl(config, amount, orderId)
          break
        case 'epay':
          paymentUrl = generateEpayUrl(config, amount, orderId)
          break
        case 'stripe':
          return {
            success: false,
            message: 'Stripe支付暂不支持前端测试，请使用后端API',
          }
        default:
          return {
            success: false,
            message: `不支持的支付方式: ${config.payment_method}`,
          }
      }

      // 创建测试订单记录（可选）
      try {
        await supabase.from('payment_history').insert({
          user_id: '00000000-0000-0000-0000-000000000000', // 测试用户ID
          amount: amount,
          currency: 'CNY',
          payment_method: config.payment_method,
          transaction_id: orderId,
          status: 'pending',
        })
      } catch (error) {
        console.warn('创建支付记录失败:', error)
        // 不影响支付流程
      }

      return {
        success: true,
        paymentUrl,
        orderId,
        message: '支付链接已生成',
      }
    } catch (error) {
      console.error('支付测试错误:', error)
      throw error
    }
  },
}

