import { useAppDispatch, useAppSelector } from '@renderer/store'
import {
  addAssistant,
  addHost,
  removeAssistant,
  removeHost,
  selectExpertsByHostId,
  selectHosts,
  updateAssistant
} from '@renderer/store/assistants'
import type { Assistant, Expert, Host } from '@renderer/types'
import { DEFAULT_ASSISTANT_SETTINGS, getDefaultTopic } from '@renderer/services/AssistantService'
import { useCallback, useMemo } from 'react'
import { v4 as uuid } from 'uuid'

/**
 * 主机管理 Hook
 */
export function useHosts() {
  const dispatch = useAppDispatch()
  const hosts = useAppSelector(selectHosts)

  /** 创建新主机 */
  const createHost = useCallback(
    (data: { name: string; emoji?: string; description?: string; welcomeMessage?: string }) => {
      const hostId = uuid()
      const defaultTopic = getDefaultTopic(hostId)

      const host: Host = {
        id: hostId,
        name: data.name,
        emoji: data.emoji || '🏠',
        description: data.description || '',
        prompt: data.description || '',
        welcomeMessage: data.welcomeMessage || '',
        type: 'host',
        topics: [defaultTopic],
        // 添加默认设置，确保主机可以使用工具（如 web search）
        settings: DEFAULT_ASSISTANT_SETTINGS
      } as Host

      dispatch(addHost(host))
      return host
    },
    [dispatch]
  )

  /** 更新主机 */
  const updateHost = useCallback(
    (id: string, data: Partial<Host>) => {
      dispatch(
        updateAssistant({
          id,
          ...data
        })
      )
    },
    [dispatch]
  )

  /** 删除主机 */
  const deleteHost = useCallback(
    (id: string) => {
      dispatch(removeHost({ id }))
    },
    [dispatch]
  )

  return {
    hosts,
    createHost,
    updateHost,
    deleteHost
  }
}

/**
 * 专家管理 Hook
 */
export function useExperts(hostId: string) {
  const dispatch = useAppDispatch()
  const selectExperts = useMemo(() => selectExpertsByHostId(hostId), [hostId])
  const experts = useAppSelector(selectExperts)

  /** 创建新专家 */
  const createExpert = useCallback(
    (data: {
      name: string
      emoji?: string
      description?: string
      handle?: string
      triggerKeywords?: string[]
      prompt?: string
    }) => {
      const expertId = uuid()

      const expert: Expert = {
        id: expertId,
        hostId,
        name: data.name,
        emoji: data.emoji || '👤',
        description: data.description || '',
        handle: data.handle || `@${data.name}`,
        triggerKeywords: data.triggerKeywords || [data.name],
        prompt: data.prompt || '',
        type: 'expert',
        topics: [], // 专家不独立存储 topics
        // 添加默认设置，确保专家可以使用工具（如 web search）
        settings: DEFAULT_ASSISTANT_SETTINGS
      } as Expert

      dispatch(addAssistant(expert))
      return expert
    },
    [dispatch, hostId]
  )

  /** 更新专家 */
  const updateExpert = useCallback(
    (id: string, data: Partial<Expert>) => {
      dispatch(
        updateAssistant({
          id,
          ...data
        })
      )
    },
    [dispatch]
  )

  /** 删除专家 */
  const deleteExpert = useCallback(
    (id: string) => {
      dispatch(removeAssistant({ id }))
    },
    [dispatch]
  )

  /** 从助手导入为专家 */
  const importExpertsFromAssistants = useCallback(
    (assistants: Assistant[]): Expert[] => {
      const importedExperts: Expert[] = []

      for (const assistant of assistants) {
        const expertId = uuid()

        const expert: Expert = {
          // 复制助手的所有配置
          ...assistant,
          // 设置新的 ID 和类型
          id: expertId,
          type: 'expert',
          hostId,
          // 设置专家特有的字段
          handle: `@${assistant.name}`,
          triggerKeywords: [assistant.name],
          // 专家不独立存储 topics
          topics: []
        } as Expert

        dispatch(addAssistant(expert))
        importedExperts.push(expert)
      }

      return importedExperts
    },
    [dispatch, hostId]
  )

  return {
    experts,
    createExpert,
    updateExpert,
    deleteExpert,
    importExpertsFromAssistants
  }
}

export default useHosts
