import ModelAvatar from '@renderer/components/Avatar/ModelAvatar'
import EmojiIcon from '@renderer/components/EmojiIcon'
// 编辑、删除功能已隐藏，以下导入暂时保留但未使用
// import { CopyIcon, DeleteIcon, EditIcon } from '@renderer/components/Icons'
// import PromptPopup from '@renderer/components/Popups/PromptPopup'
import { useAssistant, useAssistants } from '@renderer/hooks/useAssistant'
import { useSettings } from '@renderer/hooks/useSettings'
import { useTags } from '@renderer/hooks/useTags'
// import AssistantSettingsPopup from '@renderer/pages/settings/AssistantSettings'
import { getDefaultModel } from '@renderer/services/AssistantService'
import { EVENT_NAMES, EventEmitter } from '@renderer/services/EventService'
import { useAppDispatch } from '@renderer/store'
import { setActiveTopicOrSessionAction } from '@renderer/store/runtime'
import type { Assistant, AssistantsSortType } from '@renderer/types'
import { cn, getLeadingEmoji } from '@renderer/utils'
import { hasTopicPendingRequests } from '@renderer/utils/queue'
import type { MenuProps } from 'antd'
import { Dropdown } from 'antd'
// import { omit } from 'lodash'
import {
  AlignJustify,
  ArrowDownAZ,
  ArrowUpAZ,
  // BrushCleaning,
  // Check,
  // Plus,
  // Save,
  // Settings2,
  Smile,
  // Tag,
  Tags
} from 'lucide-react'
import type { FC, PropsWithChildren } from 'react'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as tinyPinyin from 'tiny-pinyin'

// import AssistantTagsPopup from './AssistantTagsPopup'

interface AssistantItemProps {
  assistant: Assistant
  isActive: boolean
  sortBy: AssistantsSortType
  onSwitch: (assistant: Assistant) => void
  onDelete: (assistant: Assistant) => void
  onCreateDefaultAssistant: () => void
  addPreset: (agent: any) => void
  copyAssistant: (assistant: Assistant) => void
  onTagClick?: (tag: string) => void
  handleSortByChange?: (sortType: AssistantsSortType) => void
  sortByPinyinAsc?: () => void
  sortByPinyinDesc?: () => void
}

const AssistantItem: FC<AssistantItemProps> = ({
  assistant,
  isActive,
  sortBy,
  onSwitch,
  onDelete,
  addPreset,
  copyAssistant,
  handleSortByChange,
  sortByPinyinAsc: externalSortByPinyinAsc,
  sortByPinyinDesc: externalSortByPinyinDesc
}) => {
  const { t } = useTranslation()
  const { allTags } = useTags()
  const { removeAllTopics } = useAssistant(assistant.id)
  const { clickAssistantToShowTopic, topicPosition, assistantIconType, setAssistantIconType } = useSettings()
  const defaultModel = getDefaultModel()
  const { assistants, updateAssistants } = useAssistants()

  const [isPending, setIsPending] = useState(false)
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (isActive) {
      setIsPending(false)
      return
    }

    const hasPending = assistant.topics.some((topic) => hasTopicPendingRequests(topic.id))
    setIsPending(hasPending)
  }, [isActive, assistant.topics])

  // Local sort functions
  const localSortByPinyinAsc = useCallback(() => {
    updateAssistants(sortAssistantsByPinyin(assistants, true))
  }, [assistants, updateAssistants])

  const localSortByPinyinDesc = useCallback(() => {
    updateAssistants(sortAssistantsByPinyin(assistants, false))
  }, [assistants, updateAssistants])

  // Use external sort functions if provided, otherwise use local ones
  const sortByPinyinAsc = externalSortByPinyinAsc || localSortByPinyinAsc
  const sortByPinyinDesc = externalSortByPinyinDesc || localSortByPinyinDesc

  const menuItems = useMemo(
    () =>
      getMenuItems({
        assistant,
        t,
        allTags,
        assistants,
        updateAssistants,
        addPreset,
        copyAssistant,
        onSwitch,
        onDelete,
        removeAllTopics,
        setAssistantIconType,
        sortBy,
        handleSortByChange,
        sortByPinyinAsc,
        sortByPinyinDesc
      }),
    [
      assistant,
      t,
      allTags,
      assistants,
      updateAssistants,
      addPreset,
      copyAssistant,
      onSwitch,
      onDelete,
      removeAllTopics,
      setAssistantIconType,
      sortBy,
      handleSortByChange,
      sortByPinyinAsc,
      sortByPinyinDesc
    ]
  )

  const handleSwitch = useCallback(async () => {
    if (clickAssistantToShowTopic) {
      if (topicPosition === 'left') {
        EventEmitter.emit(EVENT_NAMES.SWITCH_TOPIC_SIDEBAR)
      }
    }
    onSwitch(assistant)
    dispatch(setActiveTopicOrSessionAction('topic'))
  }, [clickAssistantToShowTopic, onSwitch, assistant, dispatch, topicPosition])

  const assistantName = useMemo(() => assistant.name || t('chat.default.name'), [assistant.name, t])
  const fullAssistantName = useMemo(
    () => (assistant.emoji ? `${assistant.emoji} ${assistantName}` : assistantName),
    [assistant.emoji, assistantName]
  )

  return (
    <Dropdown
      menu={{ items: menuItems }}
      trigger={['contextMenu']}
      popupRender={(menu) => <div onPointerDown={(e) => e.stopPropagation()}>{menu}</div>}>
      <Container onClick={handleSwitch} isActive={isActive}>
        <AssistantNameRow className="name" title={fullAssistantName}>
          {assistantIconType === 'model' ? (
            <ModelAvatar
              model={assistant.model || defaultModel}
              size={24}
              className={isPending && !isActive ? 'animation-pulse' : ''}
            />
          ) : (
            assistantIconType === 'emoji' && (
              <EmojiIcon
                emoji={assistant.emoji || getLeadingEmoji(assistantName)}
                className={isPending && !isActive ? 'animation-pulse' : ''}
              />
            )
          )}
          <AssistantName className="text-nowrap">{assistantName}</AssistantName>
        </AssistantNameRow>
        {isActive && (
          <MenuButton onClick={() => EventEmitter.emit(EVENT_NAMES.SWITCH_TOPIC_SIDEBAR)}>
            <TopicCount className="topics-count">{assistant.topics.length}</TopicCount>
          </MenuButton>
        )}
      </Container>
    </Dropdown>
  )
}

// 提取排序相关的工具函数
const sortAssistantsByPinyin = (assistants: Assistant[], isAscending: boolean) => {
  return [...assistants].sort((a, b) => {
    const pinyinA = tinyPinyin.convertToPinyin(a.name, '', true)
    const pinyinB = tinyPinyin.convertToPinyin(b.name, '', true)
    return isAscending ? pinyinA.localeCompare(pinyinB) : pinyinB.localeCompare(pinyinA)
  })
}

/* 提取标签相关的操作函数 - 已隐藏
const handleTagOperation = (
  tag: string,
  assistant: Assistant,
  assistants: Assistant[],
  updateAssistants: (assistants: Assistant[]) => void
) => {
  const removeTag = () => updateAssistants(assistants.map((a) => (a.id === assistant.id ? { ...a, tags: [] } : a)))
  const addTag = () => updateAssistants(assistants.map((a) => (a.id === assistant.id ? { ...a, tags: [tag] } : a)))
  const hasTag = assistant.tags?.includes(tag)
  hasTag ? removeTag() : addTag()
}
*/

/* 提取创建菜单项的函数 - 已隐藏，标记为未使用
const createTagMenuItems = (
  allTags: string[],
  assistant: Assistant,
  assistants: Assistant[],
  updateAssistants: (assistants: Assistant[]) => void,
  t: (key: string) => string
): MenuProps['items'] => {
  const items: MenuProps['items'] = [
    ...allTags.map((tag) => ({
      label: tag,
      icon: assistant.tags?.includes(tag) ? <Check size={14} /> : <Tag size={14} />,
      key: `all-tag-${tag}`,
      onClick: () => handleTagOperation(tag, assistant, assistants, updateAssistants)
    }))
  ]

  if (allTags.length > 0) {
    items.push({ type: 'divider' })
  }

  items.push({
    label: t('assistants.tags.add'),
    key: 'new-tag',
    icon: <Plus size={14} />,
    onClick: async () => {
      const tagName = await PromptPopup.show({
        title: t('assistants.tags.add'),
        message: ''
      })

      if (tagName && tagName.trim()) {
        updateAssistants(assistants.map((a) => (a.id === assistant.id ? { ...a, tags: [tagName.trim()] } : a)))
      }
    }
  })

  if (allTags.length > 0) {
    items.push({
      label: t('assistants.tags.manage'),
      key: 'manage-tags',
      icon: <Settings2 size={14} />,
      onClick: () => {
        AssistantTagsPopup.show({ title: t('assistants.tags.manage') })
      }
    })
  }

  return items
}
*/

// 提取创建菜单配置的函数
function getMenuItems({
  assistant: _assistant,
  t,
  allTags: _allTags,
  assistants: _assistants,
  updateAssistants: _updateAssistants,
  addPreset: _addPreset,
  copyAssistant: _copyAssistant,
  onSwitch: _onSwitch,
  onDelete: _onDelete,
  removeAllTopics: _removeAllTopics,
  setAssistantIconType,
  sortBy,
  handleSortByChange,
  sortByPinyinAsc,
  sortByPinyinDesc
}): MenuProps['items'] {
  // 标记未使用的参数
  void _assistant
  void _allTags
  void _assistants
  void _updateAssistants
  void _addPreset
  void _copyAssistant
  void _onSwitch
  void _onDelete
  void _removeAllTopics
  // 编辑、删除、复制、清空、保存等功能已隐藏 - 仅能使用，无法增删改
  // 保留图标类型切换、排序等查看功能
  return [
    {
      label: t('assistants.icon.type'),
      key: 'icon-type',
      icon: <Smile size={14} />,
      children: [
        {
          label: t('settings.assistant.icon.type.model'),
          key: 'model',
          onClick: () => setAssistantIconType('model')
        },
        {
          label: t('settings.assistant.icon.type.emoji'),
          key: 'emoji',
          onClick: () => setAssistantIconType('emoji')
        },
        {
          label: t('settings.assistant.icon.type.none'),
          key: 'none',
          onClick: () => setAssistantIconType('none')
        }
      ]
    },
    {
      type: 'divider'
    },
    {
      label: sortBy === 'list' ? t('assistants.list.showByTags') : t('assistants.list.showByList'),
      key: 'switch-view',
      icon: sortBy === 'list' ? <Tags size={14} /> : <AlignJustify size={14} />,
      onClick: () => {
        sortBy === 'list' ? handleSortByChange?.('tags') : handleSortByChange?.('list')
      }
    },
    {
      label: t('common.sort.pinyin.asc'),
      key: 'sort-asc',
      icon: <ArrowDownAZ size={14} />,
      onClick: sortByPinyinAsc
    },
    {
      label: t('common.sort.pinyin.desc'),
      key: 'sort-desc',
      icon: <ArrowUpAZ size={14} />,
      onClick: sortByPinyinDesc
    }
    // 删除功能已隐藏 - 仅能使用，无法增删改
  ]
}

const Container = ({
  children,
  isActive,
  className,
  ...props
}: PropsWithChildren<{ isActive?: boolean } & React.HTMLAttributes<HTMLDivElement>>) => (
  <div
    {...props}
    className={cn(
      'relative flex h-[37px] w-[calc(var(--assistants-width)-20px)] cursor-pointer flex-row justify-between rounded-[var(--list-item-border-radius)] border-[0.5px] border-transparent px-2',
      !isActive && 'hover:bg-[var(--color-list-item-hover)]',
      isActive && 'bg-[var(--color-list-item)] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]',
      className
    )}>
    {children}
  </div>
)

const AssistantNameRow = ({
  children,
  className,
  ...props
}: PropsWithChildren<{} & React.HTMLAttributes<HTMLDivElement>>) => (
  <div
    {...props}
    className={cn('flex min-w-0 flex-1 flex-row items-center gap-2 text-[13px] text-[var(--color-text)]', className)}>
    {children}
  </div>
)

const AssistantName = ({
  children,
  className,
  ...props
}: PropsWithChildren<{} & React.HTMLAttributes<HTMLDivElement>>) => (
  <div
    {...props}
    className={cn('min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[13px]', className)}>
    {children}
  </div>
)

const MenuButton = ({
  children,
  className,
  ...props
}: PropsWithChildren<{} & React.HTMLAttributes<HTMLDivElement>>) => (
  <div
    {...props}
    className={cn(
      'absolute top-[6px] right-[9px] flex h-[22px] min-h-[22px] min-w-[22px] flex-row items-center justify-center rounded-[11px] border-[0.5px] border-[var(--color-border)] bg-[var(--color-background)] px-[5px]',
      className
    )}>
    {children}
  </div>
)

const TopicCount = ({
  children,
  className,
  ...props
}: PropsWithChildren<{} & React.HTMLAttributes<HTMLDivElement>>) => (
  <div
    {...props}
    className={cn(
      'flex flex-row items-center justify-center rounded-[10px] text-[10px] text-[var(--color-text)]',
      className
    )}>
    {children}
  </div>
)

export default memo(AssistantItem)
