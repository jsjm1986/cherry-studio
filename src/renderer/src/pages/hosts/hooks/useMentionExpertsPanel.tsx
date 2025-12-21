import type { QuickPanelListItem } from '@renderer/components/QuickPanel'
import type { ToolQuickPanelApi, ToolQuickPanelController } from '@renderer/pages/home/Inputbar/types'
import type { Expert } from '@renderer/types'
import { sortBy } from 'lodash'
import { CircleX } from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

export type MentionExpertTriggerInfo = { type: 'input' | 'button'; position?: number; originalText?: string }

/** 专家 @ 提及的自定义符号 */
export const MENTION_EXPERTS_SYMBOL = 'mention-experts'

interface Params {
  quickPanel: ToolQuickPanelApi
  quickPanelController: ToolQuickPanelController
  experts: Expert[]
  recentExpertIds: string[]
  selectedExpert: Expert | null
  setSelectedExpert: (expert: Expert | null) => void
  setText: React.Dispatch<React.SetStateAction<string>>
}

export const useMentionExpertsPanel = (params: Params, role: 'button' | 'manager' = 'button') => {
  const { quickPanel, quickPanelController, experts, recentExpertIds, selectedExpert, setSelectedExpert, setText } =
    params
  const { registerTrigger } = quickPanel
  const { open, close, updateList, isVisible, symbol } = quickPanelController
  const { t } = useTranslation()

  const hasExpertActionRef = useRef(false)
  const triggerInfoRef = useRef<MentionExpertTriggerInfo | undefined>(undefined)

  // 移除 @ 符号和搜索文本
  const removeAtSymbolAndText = useCallback(
    (currentText: string, caretPosition: number, searchText?: string, fallbackPosition?: number) => {
      const safeCaret = Math.max(0, Math.min(caretPosition ?? 0, currentText.length))

      if (searchText !== undefined) {
        const pattern = '@' + searchText
        const fromIndex = Math.max(0, safeCaret - 1)
        const start = currentText.lastIndexOf(pattern, fromIndex)
        if (start !== -1) {
          const end = start + pattern.length
          return currentText.slice(0, start) + currentText.slice(end)
        }

        if (typeof fallbackPosition === 'number' && currentText[fallbackPosition] === '@') {
          const expected = pattern
          const actual = currentText.slice(fallbackPosition, fallbackPosition + expected.length)
          if (actual === expected) {
            return currentText.slice(0, fallbackPosition) + currentText.slice(fallbackPosition + expected.length)
          }
          return currentText.slice(0, fallbackPosition) + currentText.slice(fallbackPosition + 1)
        }

        return currentText
      }

      const fromIndex = Math.max(0, safeCaret - 1)
      const start = currentText.lastIndexOf('@', fromIndex)
      if (start === -1) {
        if (typeof fallbackPosition === 'number' && currentText[fallbackPosition] === '@') {
          let endPos = fallbackPosition + 1
          while (endPos < currentText.length && !/\s/.test(currentText[endPos])) {
            endPos++
          }
          return currentText.slice(0, fallbackPosition) + currentText.slice(endPos)
        }
        return currentText
      }

      let endPos = start + 1
      while (endPos < currentText.length && !/\s/.test(currentText[endPos])) {
        endPos++
      }
      return currentText.slice(0, start) + currentText.slice(endPos)
    },
    []
  )

  // 选择专家
  const onSelectExpert = useCallback(
    (expert: Expert) => {
      setSelectedExpert(expert)
      hasExpertActionRef.current = true

      // 插入 @handle 文本
      const handle = expert.handle?.replace('@', '') || expert.name
      setText((currentText) => {
        const textArea = document.querySelector('.inputbar textarea') as HTMLTextAreaElement | null
        const caret = textArea ? (textArea.selectionStart ?? currentText.length) : currentText.length

        // 移除已输入的 @ 和搜索文本
        const cleanedText = removeAtSymbolAndText(currentText, caret, undefined, triggerInfoRef.current?.position)
        // 在原位置插入 @handle + 空格
        return cleanedText + `@${handle} `
      })
    },
    [setSelectedExpert, setText, removeAtSymbolAndText]
  )

  // 清除选中的专家
  const onClearSelectedExpert = useCallback(() => {
    setSelectedExpert(null)
  }, [setSelectedExpert])

  // 构建专家列表项
  const expertItems = useMemo(() => {
    const items: QuickPanelListItem[] = []

    // 按最近使用排序
    const sortedExperts = sortBy(experts, (e) => {
      const recentIndex = recentExpertIds.indexOf(e.id)
      return recentIndex === -1 ? Infinity : recentIndex
    })

    // 构建列表项
    sortedExperts.forEach((expert) => {
      items.push({
        label: (
          <ExpertLabel>
            <AtSymbol>@</AtSymbol>
            <span>{expert.handle?.replace('@', '') || expert.name}</span>
          </ExpertLabel>
        ),
        description: expert.description || '',
        icon: <ExpertEmoji>{expert.emoji || '👤'}</ExpertEmoji>,
        filterText: `${expert.name} ${expert.handle || ''} ${expert.triggerKeywords?.join(' ') || ''}`,
        isSelected: selectedExpert?.id === expert.id,
        action: () => onSelectExpert(expert)
      })
    })

    // 添加清除按钮
    items.unshift({
      label: t('settings.input.clear.all'),
      description: t('experts.clear_selection'),
      icon: <CircleX size={16} />,
      alwaysVisible: true,
      isSelected: false,
      action: ({ context }) => {
        onClearSelectedExpert()

        if (triggerInfoRef.current?.type === 'input') {
          setText((currentText) => {
            const textArea = document.querySelector('.inputbar textarea') as HTMLTextAreaElement | null
            const caret = textArea ? (textArea.selectionStart ?? currentText.length) : currentText.length
            return removeAtSymbolAndText(currentText, caret, undefined, triggerInfoRef.current?.position)
          })
        }

        context.close()
      }
    })

    return items
  }, [
    experts,
    recentExpertIds,
    selectedExpert,
    onSelectExpert,
    onClearSelectedExpert,
    removeAtSymbolAndText,
    setText,
    t
  ])

  // 打开 QuickPanel
  const openQuickPanel = useCallback(
    (triggerInfo?: MentionExpertTriggerInfo) => {
      hasExpertActionRef.current = false
      triggerInfoRef.current = triggerInfo

      open({
        title: t('experts.select_expert'),
        list: expertItems,
        symbol: MENTION_EXPERTS_SYMBOL,
        multiple: false,
        triggerInfo: triggerInfo || { type: 'button' },
        afterAction({ item }) {
          item.isSelected = !item.isSelected
        },
        onClose({ action, searchText, context }) {
          if (action === 'esc') {
            const trigger = context?.triggerInfo ?? triggerInfoRef.current
            if (hasExpertActionRef.current && trigger?.type === 'input' && trigger?.position !== undefined) {
              setText((currentText) => {
                const textArea = document.querySelector('.inputbar textarea') as HTMLTextAreaElement | null
                const caret = textArea ? (textArea.selectionStart ?? currentText.length) : currentText.length
                return removeAtSymbolAndText(currentText, caret, searchText || '', trigger?.position!)
              })
            }
          }
          triggerInfoRef.current = undefined
        }
      })
    },
    [expertItems, open, removeAtSymbolAndText, setText, t]
  )

  // 切换 QuickPanel 显示
  const handleOpenQuickPanel = useCallback(() => {
    if (isVisible && symbol === MENTION_EXPERTS_SYMBOL) {
      close()
    } else {
      openQuickPanel({ type: 'button' })
    }
  }, [close, isVisible, openQuickPanel, symbol])

  // 动态更新列表
  useEffect(() => {
    if (role !== 'manager') return
    if (isVisible && symbol === MENTION_EXPERTS_SYMBOL) {
      updateList(expertItems)
    }
  }, [isVisible, expertItems, role, symbol, updateList])

  // 注册触发器
  useEffect(() => {
    if (role !== 'manager') return

    const disposeTrigger = registerTrigger(MENTION_EXPERTS_SYMBOL as any, (payload) => {
      const trigger = (payload || {}) as MentionExpertTriggerInfo
      openQuickPanel(trigger)
    })

    return () => {
      disposeTrigger()
    }
  }, [openQuickPanel, registerTrigger, role])

  return {
    handleOpenQuickPanel,
    openQuickPanel
  }
}

const ExpertLabel = styled.span`
  display: flex;
  align-items: center;
  gap: 2px;
`

const AtSymbol = styled.span`
  color: var(--color-primary);
  font-weight: 600;
`

const ExpertEmoji = styled.span`
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
`
