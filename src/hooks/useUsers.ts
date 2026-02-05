import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersService } from '../services/users.service'
import { message } from 'antd'
import type { User } from '../types/database.types'

// 获取用户列表
export const useUsers = (
  page = 1,
  pageSize = 10,
  filters?: {
    search?: string
    applicationId?: string
  }
) => {
  return useQuery({
    queryKey: ['users', page, pageSize, filters],
    queryFn: () => usersService.getUsers(page, pageSize, filters),
  })
}

// 获取单个用户
export const useUser = (id: string) => {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => usersService.getUser(id),
    enabled: !!id,
  })
}

// 更新用户
export const useUpdateUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<User> }) =>
      usersService.updateUser(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      message.success('用户更新成功')
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : '更新用户失败'
      message.error(errorMessage)
    },
  })
}

// 封禁/解封用户
export const useToggleBanUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isBanned }: { id: string; isBanned: boolean }) =>
      usersService.toggleBanUser(id, isBanned),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      message.success('用户状态更新成功')
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : '更新用户状态失败'
      message.error(errorMessage)
    },
  })
}
