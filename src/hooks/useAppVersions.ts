import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { appVersionsService } from '../services/appVersions.service'
import type { AppVersion } from '../types/database.types'

// 获取版本列表
export const useAppVersions = (
  page = 1,
  pageSize = 10,
  filters?: {
    applicationId?: string
    platform?: string
    isPublished?: boolean
    search?: string
  }
) => {
  return useQuery({
    queryKey: ['appVersions', page, pageSize, filters],
    queryFn: () => appVersionsService.getAppVersions(page, pageSize, filters),
  })
}

// 获取单个版本
export const useAppVersion = (id: string) => {
  return useQuery({
    queryKey: ['appVersion', id],
    queryFn: () => appVersionsService.getAppVersion(id),
    enabled: !!id,
  })
}

// 获取最新版本
export const useLatestVersion = (applicationId: string, platform: string) => {
  return useQuery({
    queryKey: ['latestVersion', applicationId, platform],
    queryFn: () => appVersionsService.getLatestVersion(applicationId),
    enabled: !!applicationId && !!platform,
  })
}

// 创建版本
export const useCreateAppVersion = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (version: Omit<AppVersion, 'id' | 'created_at' | 'updated_at'>) =>
      appVersionsService.createAppVersion(version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appVersions'] })
      message.success('版本创建成功')
    },
    onError: (error: Error) => {
      message.error(`创建失败: ${error.message}`)
    },
  })
}

// 更新版本
export const useUpdateAppVersion = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<AppVersion> }) =>
      appVersionsService.updateAppVersion(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appVersions'] })
      queryClient.invalidateQueries({ queryKey: ['appVersion'] })
      message.success('版本更新成功')
    },
    onError: (error: Error) => {
      message.error(`更新失败: ${error.message}`)
    },
  })
}

// 删除版本
export const useDeleteAppVersion = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => appVersionsService.deleteAppVersion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appVersions'] })
      message.success('版本删除成功')
    },
    onError: (error: Error) => {
      message.error(`删除失败: ${error.message}`)
    },
  })
}

// 切换发布状态
export const useTogglePublished = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      appVersionsService.togglePublished(id, isPublished),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appVersions'] })
      queryClient.invalidateQueries({ queryKey: ['appVersion'] })
      message.success(variables.isPublished ? '版本已发布' : '版本已取消发布')
    },
    onError: (error: Error) => {
      message.error(`操作失败: ${error.message}`)
    },
  })
}
