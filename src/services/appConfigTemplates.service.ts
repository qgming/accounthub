import { supabase } from '../config/supabase'
import type { AppConfigTemplate } from '../types/database.types'

export const appConfigTemplatesService = {
  // 获取所有模板
  async getTemplates() {
    const { data, error } = await supabase
      .from('app_config_templates')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return data || []
  },

  // 获取单个模板
  async getTemplate(id: string) {
    const { data, error } = await supabase
      .from('app_config_templates')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // 根据模板名称获取模板
  async getTemplateByName(templateName: string) {
    const { data, error } = await supabase
      .from('app_config_templates')
      .select('*')
      .eq('template_name', templateName)
      .single()

    if (error) throw error
    return data
  },

  // 创建模板
  async createTemplate(template: Omit<AppConfigTemplate, 'id' | 'created_at' | 'updated_at'>) {
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('app_config_templates')
      .insert({
        ...template,
        created_by: user?.id,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 更新模板
  async updateTemplate(id: string, updates: Partial<AppConfigTemplate>) {
    const { data, error } = await supabase
      .from('app_config_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 删除模板
  async deleteTemplate(id: string) {
    const { error } = await supabase
      .from('app_config_templates')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
