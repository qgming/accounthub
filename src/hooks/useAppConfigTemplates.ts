import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { appConfigTemplatesService } from '../services/appConfigTemplates.service'
import { message } from 'antd'
import type { AppConfigTemplate } from '../types/database.types'

export const useAppConfigTemplates = () => {
  return useQuery({
    queryKey: ['appConfigTemplates'],
    queryFn: () => appConfigTemplatesService.getTemplates(),
  })
}

export const useAppConfigTemplate = (id: string) => {
  return useQuery({
    queryKey: ['appConfigTemplate', id],
    queryFn: () => appConfigTemplatesService.getTemplate(id),
    enabled: !!id,
  })
}

export const useAppConfigTemplateByName = (templateName: string) => {
  return useQuery({
    queryKey: ['appConfigTemplate', 'name', templateName],
    queryFn: () => appConfigTemplatesService.getTemplateByName(templateName),
    enabled: !!templateName,
  })
}

export const useCreateAppConfigTemplate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (template: Omit<AppConfigTemplate, 'id' | 'created_at' | 'updated_at'>) =>
      appConfigTemplatesService.createTemplate(template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appConfigTemplates'] })
      message.success('模板创建成功')
    },
    onError: (error: Error) => {
      message.error(`创建失败: ${error.message}`)
    },
  })
}

export const useUpdateAppConfigTemplate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<AppConfigTemplate> }) =>
      appConfigTemplatesService.updateTemplate(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appConfigTemplates'] })
      queryClient.invalidateQueries({ queryKey: ['appConfigTemplate'] })
      message.success('模板更新成功')
    },
    onError: (error: Error) => {
      message.error(`更新失败: ${error.message}`)
    },
  })
}

export const useDeleteAppConfigTemplate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => appConfigTemplatesService.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appConfigTemplates'] })
      message.success('模板删除成功')
    },
    onError: (error: Error) => {
      message.error(`删除失败: ${error.message}`)
    },
  })
}
