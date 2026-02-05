import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  const missingVars = []
  if (!supabaseUrl) missingVars.push('VITE_SUPABASE_URL')
  if (!supabaseAnonKey) missingVars.push('VITE_SUPABASE_ANON_KEY')

  throw new Error(
    `缺少 Supabase 环境变量: ${missingVars.join(', ')}\n` +
    `开发环境: 请检查 .env.local 文件\n` +
    `生产环境: 请在 Cloudflare Pages 的 Settings → Environment variables 中配置这些变量`
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

