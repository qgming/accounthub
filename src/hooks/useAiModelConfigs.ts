import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { aiModelConfigsService, type CreateAiModelConfigInput, type UpdateAiModelConfigInput } from '../services/aiModelConfigs.service'

export const useAiModelConfigs = (
  page = 1,
  pageSize = 10,
  filters?: {
    provider?: string
    applicationId?: string | null
    isActive?: boolean
    search?: string
  }
) => {
  return useQuery({
    queryKey: ['aiModelConfigs', page, pageSize, filters],
    queryFn: () => aiModelConfigsService.getAiModelConfigs(page, pageSize, filters),
  })
}

export const useAiModelConfig = (id: string) => {
  return useQuery({
    queryKey: ['aiModelConfig', id],
    queryFn: () => aiModelConfigsService.getAiModelConfig(id),
    enabled: !!id,
  })
}

export const useCreateAiModelConfig = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (config: CreateAiModelConfigInput) =>
      aiModelConfigsService.createAiModelConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiModelConfigs'] })
      message.success('模型配置创建成功')
    },
    onError: (error: Error) => {
      message.error(`创建失败: ${error.message}`)
    },
  })
}

export const useUpdateAiModelConfig = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateAiModelConfigInput }) =>
      aiModelConfigsService.updateAiModelConfig(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiModelConfigs'] })
      queryClient.invalidateQueries({ queryKey: ['aiModelConfig'] })
      message.success('模型配置更新成功')
    },
    onError: (error: Error) => {
      message.error(`更新失败: ${error.message}`)
    },
  })
}

export const useDeleteAiModelConfig = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => aiModelConfigsService.deleteAiModelConfig(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiModelConfigs'] })
      message.success('模型配置删除成功')
    },
    onError: (error: Error) => {
      message.error(`删除失败: ${error.message}`)
    },
  })
}

export const useToggleAiModelConfigActive = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      aiModelConfigsService.toggleActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiModelConfigs'] })
      message.success('状态更新成功')
    },
    onError: (error: Error) => {
      message.error(`状态更新失败: ${error.message}`)
    },
  })
}
