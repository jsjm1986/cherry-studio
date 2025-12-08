import type { Expert } from '@renderer/types'
import type { FC, ReactNode } from 'react'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

interface ExpertContextValue {
  /** 当前选中的专家列表 */
  mentionedExperts: Expert[]
  /** 设置选中的专家 */
  setMentionedExperts: (experts: Expert[]) => void
  /** 添加专家到选中列表 */
  addMentionedExpert: (expert: Expert) => void
  /** 从选中列表移除专家 */
  removeMentionedExpert: (expertId: string) => void
  /** 切换专家选中状态 */
  toggleMentionedExpert: (expert: Expert) => void
  /** 清空选中的专家 */
  clearMentionedExperts: () => void
  /** 获取第一个选中的专家（用于消息发送） */
  getActiveExpert: () => Expert | undefined
  /** 从侧边栏点击的专家（用于快速@） */
  mentionedExpert: Expert | null
  /** 设置从侧边栏点击的专家 */
  setMentionedExpert: (expert: Expert | null) => void
}

const ExpertContext = createContext<ExpertContextValue | null>(null)

interface ExpertProviderProps {
  children: ReactNode
}

export const ExpertProvider: FC<ExpertProviderProps> = ({ children }) => {
  const [mentionedExperts, setMentionedExperts] = useState<Expert[]>([])
  // 从侧边栏点击的专家（用于快速@）
  const [mentionedExpert, setMentionedExpert] = useState<Expert | null>(null)

  const addMentionedExpert = useCallback((expert: Expert) => {
    setMentionedExperts((prev) => {
      if (prev.some((e) => e.id === expert.id)) {
        return prev
      }
      return [...prev, expert]
    })
  }, [])

  const removeMentionedExpert = useCallback((expertId: string) => {
    setMentionedExperts((prev) => prev.filter((e) => e.id !== expertId))
  }, [])

  const toggleMentionedExpert = useCallback((expert: Expert) => {
    setMentionedExperts((prev) => {
      const exists = prev.some((e) => e.id === expert.id)
      if (exists) {
        return prev.filter((e) => e.id !== expert.id)
      }
      return [...prev, expert]
    })
  }, [])

  const clearMentionedExperts = useCallback(() => {
    setMentionedExperts([])
  }, [])

  const getActiveExpert = useCallback(() => {
    return mentionedExperts[0]
  }, [mentionedExperts])

  const value = useMemo(
    () => ({
      mentionedExperts,
      setMentionedExperts,
      addMentionedExpert,
      removeMentionedExpert,
      toggleMentionedExpert,
      clearMentionedExperts,
      getActiveExpert,
      mentionedExpert,
      setMentionedExpert
    }),
    [
      mentionedExperts,
      addMentionedExpert,
      removeMentionedExpert,
      toggleMentionedExpert,
      clearMentionedExperts,
      getActiveExpert,
      mentionedExpert
    ]
  )

  return <ExpertContext.Provider value={value}>{children}</ExpertContext.Provider>
}

export const useExpertContext = (): ExpertContextValue => {
  const context = useContext(ExpertContext)
  if (!context) {
    throw new Error('useExpertContext must be used within an ExpertProvider')
  }
  return context
}

/**
 * 安全版本的 useExpertContext，在 ExpertProvider 外部使用时返回 null
 */
export const useExpertContextSafe = (): ExpertContextValue | null => {
  return useContext(ExpertContext)
}

export default ExpertContext
