import { customAlphabet } from 'nanoid'

/**
 * 生成应用密钥 (App Key)
 * 格式: ak_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (35个字符)
 * 使用 nanoid 生成安全的随机字符串
 */
export function generateAppKey(): string {
  // 使用字母和数字，不包含容易混淆的字符
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  const nanoid = customAlphabet(alphabet, 32)

  return `ak_${nanoid()}`
}
