import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { applicationsService } from '../services/applications.service'
import { message } from 'antd'
import type { Application } from '../types/database.types'

export const useApplications = (page = 1, pageSize = 10, search?: string) => {
  return useQuery({
    queryKey: ['applications', page, pageSize, search],
    queryFn: () => applicationsService.getApplications(page, pageSize, search),
  })
}

export const useApplication = (id: string) => {
  return useQuery({
    queryKey: ['applications', id],
    queryFn: () => applicationsService.getApplication(id),
    enabled: !!id,
  })
}

export const useCreateApplication = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (application: Omit<Application, 'id' | 'created_at' | 'updated_at'>) =>
      applicationsService.createApplication(application),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      message.success('应用创建成功')
    },
    onError: (error: Error) => {
      message.error(`创建失败: ${error.message}`)
    },
  })
}

export const useUpdateApplication = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Application> }) =>
      applicationsService.updateApplication(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      message.success('应用更新成功')
    },
    onError: (error: Error) => {
      message.error(`更新失败: ${error.message}`)
    },
  })
}

export const useDeleteApplication = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => applicationsService.deleteApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      message.success('应用删除成功')
    },
    onError: (error: Error) => {
      message.error(`删除失败: ${error.message}`)
    },
  })
}

export const useToggleApplicationActive = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      applicationsService.toggleActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      message.success('应用状态更新成功')
    },
    onError: (error: Error) => {
      message.error(`状态更新失败: ${error.message}`)
    },
  })
}
