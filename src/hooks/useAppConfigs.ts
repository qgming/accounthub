import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { appConfigsService } from '../services/appConfigs.service'
import { message } from 'antd'
import type { AppConfig } from '../types/database.types'

export const useAppConfigs = (
  page = 1,
  pageSize = 10,
  filters?: {
    configType?: string
    isActive?: boolean
    search?: string
  }
) => {
  return useQuery({
    queryKey: ['appConfigs', page, pageSize, filters],
    queryFn: () => appConfigsService.getAppConfigs(page, pageSize, filters),
  })
}

export const useAppConfig = (id: string) => {
  return useQuery({
    queryKey: ['appConfig', id],
    queryFn: () => appConfigsService.getAppConfig(id),
    enabled: !!id,
  })
}

export const useAppConfigByKey = (configKey: string) => {
  return useQuery({
    queryKey: ['appConfig', 'key', configKey],
    queryFn: () => appConfigsService.getAppConfigByKey(configKey),
    enabled: !!configKey,
  })
}

export const useCreateAppConfig = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (config: Omit<AppConfig, 'id' | 'created_at' | 'updated_at'>) =>
      appConfigsService.createAppConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appConfigs'] })
      message.success('配置创建成功')
    },
    onError: (error: Error) => {
      message.error(`创建失败: ${error.message}`)
    },
  })
}

export const useUpdateAppConfig = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<AppConfig> }) =>
      appConfigsService.updateAppConfig(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appConfigs'] })
      queryClient.invalidateQueries({ queryKey: ['appConfig'] })
      message.success('配置更新成功')
    },
    onError: (error: Error) => {
      message.error(`更新失败: ${error.message}`)
    },
  })
}

export const useDeleteAppConfig = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => appConfigsService.deleteAppConfig(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appConfigs'] })
      message.success('配置删除成功')
    },
    onError: (error: Error) => {
      message.error(`删除失败: ${error.message}`)
    },
  })
}

export const useToggleAppConfigActive = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      appConfigsService.toggleActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appConfigs'] })
      message.success('配置状态更新成功')
    },
    onError: (error: Error) => {
      message.error(`状态更新失败: ${error.message}`)
    },
  })
}
