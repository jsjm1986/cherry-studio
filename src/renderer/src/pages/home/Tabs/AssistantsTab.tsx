import EmojiIcon from '@renderer/components/EmojiIcon'
import Scrollbar from '@renderer/components/Scrollbar'
import { useAgents } from '@renderer/hooks/agents/useAgents'
import { useApiServer } from '@renderer/hooks/useApiServer'
import { useAssistants } from '@renderer/hooks/useAssistant'
import { useAssistantPresets } from '@renderer/hooks/useAssistantPresets'
import { useTags } from '@renderer/hooks/useTags'
import { useHosts } from '@renderer/pages/hosts/hooks/useHosts'
import { useAppDispatch } from '@renderer/store'
import { addAssistant } from '@renderer/store/assistants'
import { setActiveTopicOrSessionAction } from '@renderer/store/runtime'
import type { Assistant, Expert } from '@renderer/types'
import { getLeadingEmoji } from '@renderer/utils'
import { Input, message } from 'antd'
import { Search, X } from 'lucide-react'
import type { FC } from 'react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css, keyframes } from 'styled-components'
import { v4 as uuid } from 'uuid'

import { useActiveAgent } from './hooks/useActiveAgent'
import { useUnifiedItems } from './hooks/useUnifiedItems'
import { useUnifiedSorting } from './hooks/useUnifiedSorting'

// 复古游戏卡带贴纸颜色方案
const stickerColors = [
  { bg: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', text: '#fff' }, // 红色
  { bg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', text: '#fff' }, // 蓝色
  { bg: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', text: '#fff' }, // 紫色
  { bg: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', text: '#fff' }, // 绿色
  { bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', text: '#000' }, // 橙色
  { bg: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', text: '#fff' }, // 粉色
  { bg: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', text: '#fff' }, // 青色
  { bg: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)', text: '#000' } // 金色
]

const getStickerColor = (id: string) => {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return stickerColors[hash % stickerColors.length]
}

interface AssistantsTabProps {
  activeAssistant: Assistant
  setActiveAssistant: (assistant: Assistant) => void
  onImportCartridgeFile: (file: File) => void
  onCreateDefaultAssistant: () => void
}

const AssistantsTab: FC<AssistantsTabProps> = (props) => {
  const { activeAssistant, setActiveAssistant, onImportCartridgeFile, onCreateDefaultAssistant } = props
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { apiServerConfig } = useApiServer()
  const apiServerEnabled = apiServerConfig.enabled
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  // Agent related hooks
  const { agents, isLoading: agentsLoading, error: agentsError } = useAgents()
  useActiveAgent()

  // Assistant related hooks
  const { assistants, removeAssistant, updateAssistants } = useAssistants()
  useAssistantPresets()
  const { allTags } = useTags()
  const [dragging] = useState(false)

  // 搜索和筛选状态
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  // Hosts related hooks
  const { hosts } = useHosts()

  // 将卡带导入到房间作为专家
  const importToHost = useCallback(
    (assistant: Assistant, hostId: string) => {
      const host = hosts.find((h) => h.id === hostId)
      if (!host) return

      const expertId = uuid()
      const expert: Expert = {
        ...assistant,
        id: expertId,
        type: 'expert',
        hostId,
        handle: `@${assistant.name}`,
        triggerKeywords: [assistant.name],
        topics: []
      } as Expert

      dispatch(addAssistant(expert))
      message.success(t('assistants.cartridgeStore.importToHostSuccess', { hostName: host.name }))
    },
    [hosts, dispatch, t]
  )

  // 生成房间子菜单项 - 已隐藏
  const _getHostMenuItems = useCallback(
    (assistant: Assistant) => {
      if (hosts.length === 0) {
        return [
          {
            key: 'no-hosts',
            label: t('assistants.cartridgeStore.noHosts'),
            disabled: true
          }
        ]
      }

      return hosts.map((host) => ({
        key: host.id,
        label: (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{host.emoji || '🏠'}</span>
            <span>{host.name}</span>
          </span>
        ),
        onClick: (info: any) => {
          info.domEvent.stopPropagation()
          importToHost(assistant, host.id)
        }
      }))
    },
    [hosts, importToHost, t]
  )
  void _getHostMenuItems

  // Unified items management
  const { unifiedItems } = useUnifiedItems({
    agents,
    assistants,
    apiServerEnabled,
    agentsLoading,
    agentsError,
    updateAssistants
  })

  // Sorting
  useUnifiedSorting({
    unifiedItems,
    updateAssistants
  })

  // 删除功能已隐藏 - 仅能使用，无法增删改
  const _onDeleteAssistant = useCallback(
    (assistant: Assistant) => {
      const remaining = assistants.filter((a) => a.id !== assistant.id)
      if (assistant.id === activeAssistant?.id) {
        const newActive = remaining[remaining.length - 1]
        newActive ? setActiveAssistant(newActive) : onCreateDefaultAssistant()
      }
      removeAssistant(assistant.id)
    },
    [activeAssistant, assistants, removeAssistant, setActiveAssistant, onCreateDefaultAssistant]
  )
  void _onDeleteAssistant

  const handleCartridgeClick = useCallback(
    (assistant: Assistant) => {
      setActiveAssistant(assistant)
      dispatch(setActiveTopicOrSessionAction('topic'))
    },
    [setActiveAssistant, dispatch]
  )

  // 文件导入功能已隐藏 - 仅能使用，无法增删改
  const _handleFileInputClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])
  void _handleFileInputClick

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        onImportCartridgeFile(file)
      }
      e.target.value = ''
    },
    [onImportCartridgeFile]
  )

  // Filter to only show assistants (not agents) in the cartridge store
  const cartridges = useMemo(() => {
    let filtered = unifiedItems.filter((item) => item.type === 'assistant')

    // 搜索筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((item) => {
        const assistant = item.data as Assistant
        return (
          assistant.name?.toLowerCase().includes(query) ||
          assistant.description?.toLowerCase().includes(query) ||
          assistant.prompt?.toLowerCase().includes(query)
        )
      })
    }

    // 标签筛选
    if (selectedTag) {
      filtered = filtered.filter((item) => {
        const assistant = item.data as Assistant
        return assistant.tags?.includes(selectedTag)
      })
    }

    return filtered
  }, [unifiedItems, searchQuery, selectedTag])

  return (
    <Container className="cartridge-store-list" ref={containerRef}>
      {/* Hidden file input for MD import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".md,.markdown"
        style={{ display: 'none' }}
      />

      {/* 顶部筛选工具栏 */}
      <FilterToolbar>
        <SearchBox>
          <SearchIcon>
            <Search size={16} />
          </SearchIcon>
          <SearchInput
            placeholder={t('assistants.cartridgeStore.searchPlaceholder', { defaultValue: '搜索卡带...' })}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear={{ clearIcon: <X size={14} /> }}
          />
        </SearchBox>
        <TagsContainer>
          <TagChip $active={selectedTag === null} onClick={() => setSelectedTag(null)}>
            {t('common.all', { defaultValue: '全部' })}
          </TagChip>
          {allTags.map((tag) => (
            <TagChip key={tag} $active={selectedTag === tag} onClick={() => setSelectedTag(tag)}>
              {tag}
            </TagChip>
          ))}
        </TagsContainer>
      </FilterToolbar>

      <CartridgeGrid>
        {/* 导入卡带功能已隐藏 - 仅能使用，无法增删改 */}
        {/* <CartridgeContainer onClick={handleFileInputClick}>
          <CartridgeShell $isPlaceholder>
            <GripTexture />
            <StickerArea>
              <AddSticker>
                <AddIconWrapper>
                  <FileUp size={32} />
                </AddIconWrapper>
                <AddText>{t('assistants.cartridgeStore.importCartridge')}</AddText>
              </AddSticker>
            </StickerArea>
            <BottomSection>
              <InsertArrow />
              <InsertText>INSERT CARTRIDGE</InsertText>
              <ConnectorGap />
            </BottomSection>
          </CartridgeShell>
        </CartridgeContainer> */}

        {/* Cartridge cards */}
        {cartridges.map((item) => {
          const assistant = item.data as Assistant
          const isActive = assistant.id === activeAssistant?.id
          const assistantName = assistant.name || t('chat.default.name')
          const stickerColor = getStickerColor(assistant.id)

          return (
            <CartridgeContainer key={assistant.id} onClick={() => handleCartridgeClick(assistant)}>
              <CartridgeShell $isActive={isActive}>
                {/* 顶部防滑纹理 */}
                <GripTexture />

                {/* 贴纸凹槽区域 */}
                <StickerArea>
                  <Sticker $bgColor={stickerColor.bg}>
                    {/* 贴纸顶部条 */}
                    <StickerHeader>
                      <StickerBrand>© HER STUDIO</StickerBrand>
                      <StickerBadge>
                        {t('assistants.cartridgeStore.topicCount', { count: assistant.topics?.length || 0 })}
                      </StickerBadge>
                    </StickerHeader>

                    {/* 贴纸主内容 */}
                    <StickerContent $textColor={stickerColor.text}>
                      <PixelDots />
                      <StickerEmoji>
                        <EmojiIcon emoji={assistant.emoji || getLeadingEmoji(assistantName)} size={40} />
                      </StickerEmoji>
                      <StickerTitle>{assistantName}</StickerTitle>
                      <StickerDesc>
                        {assistant.description || assistant.prompt?.slice(0, 40) || 'No description'}
                      </StickerDesc>
                    </StickerContent>

                    {/* 贴纸底部 */}
                    <StickerFooter>
                      <FooterText>© HER STUDIO</FooterText>
                    </StickerFooter>

                    {/* 光泽反射效果 */}
                    <StickerGloss />
                  </Sticker>
                </StickerArea>

                {/* 底部插入指示 */}
                <BottomSection>
                  <InsertArrow />
                  <InsertText>INSERT THIS WAY</InsertText>
                  <ConnectorGap />
                </BottomSection>

                {/* 操作按钮覆盖层 - 编辑/删除功能已隐藏，仅能使用，无法增删改 */}
                {/* <ActionOverlay className="action-overlay" onClick={(e) => e.stopPropagation()}>
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: 'edit',
                          label: t('common.edit'),
                          onClick: (info) => {
                            info.domEvent.stopPropagation()
                            AssistantSettingsPopup.show({ assistant })
                          }
                        },
                        {
                          key: 'insert-to-host',
                          label: (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Home size={14} />
                              <span>{t('assistants.cartridgeStore.insertToHost')}</span>
                            </span>
                          ),
                          children: getHostMenuItems(assistant)
                        },
                        { type: 'divider' },
                        {
                          key: 'delete',
                          label: t('common.delete'),
                          danger: true,
                          onClick: (info) => {
                            info.domEvent.stopPropagation()
                            Modal.confirm({
                              title: t('assistants.delete.title'),
                              content: t('assistants.delete.content'),
                              okButtonProps: { danger: true },
                              onOk: () => onDeleteAssistant(assistant)
                            })
                          }
                        }
                      ]
                    }}
                    trigger={['click']}>
                    <ActionButton onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal size={20} />
                    </ActionButton>
                  </Dropdown>
                </ActionOverlay> */}
              </CartridgeShell>
              {/* 卡带倒影 */}
              <CartridgeShadow />
            </CartridgeContainer>
          )
        })}
      </CartridgeGrid>

      {!dragging && <div style={{ minHeight: 10 }}></div>}
    </Container>
  )
}

// 动画
const pulseGlow = keyframes`
  0%, 100% { box-shadow: inset 2px 2px 5px rgba(255,255,255,0.7), inset -5px -5px 10px rgba(0,0,0,0.2), 10px 10px 20px rgba(0,0,0,0.5), 0 0 20px rgba(59, 130, 246, 0.4); }
  50% { box-shadow: inset 2px 2px 5px rgba(255,255,255,0.7), inset -5px -5px 10px rgba(0,0,0,0.2), 10px 10px 20px rgba(0,0,0,0.5), 0 0 40px rgba(59, 130, 246, 0.6); }
`

const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
`

// 像素闪烁效果 - 复古 8-bit 风格
const pixelFlicker = keyframes`
  0%, 100% {
    opacity: 1;
    filter: brightness(1) saturate(1);
  }
  10% {
    opacity: 0.97;
    filter: brightness(1.08) saturate(1.1);
  }
  20% {
    opacity: 1;
    filter: brightness(1) saturate(1);
  }
  35% {
    opacity: 0.98;
    filter: brightness(1.05) saturate(1.05);
  }
  50% {
    opacity: 1;
    filter: brightness(1.12) saturate(1.15);
  }
  65% {
    opacity: 0.99;
    filter: brightness(1.02) saturate(1);
  }
  80% {
    opacity: 1;
    filter: brightness(1.06) saturate(1.08);
  }
`

// 边框像素脉冲 - 霓虹灯风格
const borderPulse = keyframes`
  0%, 100% {
    box-shadow:
      inset 2px 2px 5px rgba(255,255,255,0.7),
      inset -5px -5px 10px rgba(0,0,0,0.2),
      10px 10px 20px rgba(0,0,0,0.5),
      0 0 0 2px transparent,
      0 0 15px rgba(0, 255, 255, 0.3);
  }
  25% {
    box-shadow:
      inset 2px 2px 5px rgba(255,255,255,0.7),
      inset -5px -5px 10px rgba(0,0,0,0.2),
      10px 10px 20px rgba(0,0,0,0.5),
      0 0 0 2px rgba(0, 255, 255, 0.8),
      0 0 20px rgba(0, 255, 255, 0.5);
  }
  50% {
    box-shadow:
      inset 2px 2px 5px rgba(255,255,255,0.7),
      inset -5px -5px 10px rgba(0,0,0,0.2),
      10px 10px 20px rgba(0,0,0,0.5),
      0 0 0 2px rgba(255, 0, 255, 0.8),
      0 0 20px rgba(255, 0, 255, 0.5);
  }
  75% {
    box-shadow:
      inset 2px 2px 5px rgba(255,255,255,0.7),
      inset -5px -5px 10px rgba(0,0,0,0.2),
      10px 10px 20px rgba(0,0,0,0.5),
      0 0 0 2px rgba(255, 255, 0, 0.8),
      0 0 20px rgba(255, 255, 0, 0.5);
  }
`

// 扫描线移动效果
const scanlineMove = keyframes`
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
`

// 容器样式
const Container = styled(Scrollbar)`
  display: flex;
  flex-direction: column;
  padding: 24px;
  flex: 1;
  background: var(--color-background);
  position: relative;
`

// 筛选工具栏样式
const FilterToolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`

const SearchBox = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`

const SearchIcon = styled.div`
  position: absolute;
  left: 12px;
  color: var(--color-text-3);
  display: flex;
  align-items: center;
  pointer-events: none;
`

const SearchInput = styled(Input)`
  width: 220px;
  padding-left: 36px;
  border-radius: 8px;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  transition: all 0.2s ease;

  &:hover,
  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }

  .ant-input {
    background: transparent;
  }
`

const TagsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  flex: 1;
`

const TagChip = styled.button<{ $active?: boolean }>`
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  background: ${({ $active }) => ($active ? 'var(--color-primary)' : 'var(--color-background-soft)')};
  color: ${({ $active }) => ($active ? '#fff' : 'var(--color-text-2)')};
  border: 1px solid ${({ $active }) => ($active ? 'var(--color-primary)' : 'var(--color-border)')};

  &:hover {
    background: ${({ $active }) => ($active ? 'var(--color-primary)' : 'var(--color-background-mute)')};
    border-color: var(--color-primary);
  }
`

const CartridgeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 32px;
  width: 100%;
  perspective: 1000px;
`

// 卡带容器
const CartridgeContainer = styled.div`
  position: relative;
  cursor: pointer;
  transform-style: preserve-3d;
`

// 卡带塑料外壳 - 核心样式
const CartridgeShell = styled.div<{ $isPlaceholder?: boolean; $isActive?: boolean }>`
  position: relative;
  width: 100%;
  aspect-ratio: 0.68;
  background: #d1d5db;
  border-radius: 24px 24px 8px 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform-style: preserve-3d;

  /* 塑料质感 - 高光和阴影 */
  box-shadow:
    inset 2px 2px 5px rgba(255, 255, 255, 0.7),
    inset -5px -5px 10px rgba(0, 0, 0, 0.2),
    10px 10px 20px rgba(0, 0, 0, 0.5);

  /* 悬停像素闪烁效果 - 复古 8-bit 风格 */
  ${CartridgeContainer}:hover & {
    animation: ${pixelFlicker} 0.12s steps(3) infinite, ${borderPulse} 0.6s steps(4) infinite;

    .action-overlay {
      opacity: 1;
    }

    /* 扫描线效果 */
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: repeating-linear-gradient(
        0deg,
        rgba(0, 255, 255, 0.03) 0px,
        rgba(0, 255, 255, 0.03) 1px,
        transparent 1px,
        transparent 3px
      );
      pointer-events: none;
      z-index: 15;
      animation: ${scanlineMove} 3s linear infinite;
    }
  }

  /* 激活状态发光 */
  ${({ $isActive }) =>
    $isActive &&
    css`
      animation: ${pulseGlow} 2s ease-in-out infinite;
    `}

  /* 占位符样式 */
  ${({ $isPlaceholder }) =>
    $isPlaceholder &&
    css`
      background: #9ca3af;
      opacity: 0.8;
    `}
`

// 顶部防滑纹理
const GripTexture = styled.div`
  width: 100%;
  height: 48px;
  border-radius: 24px 24px 0 0;
  background-image: repeating-linear-gradient(
    180deg,
    transparent,
    transparent 8px,
    rgba(0, 0, 0, 0.08) 8px,
    rgba(0, 0, 0, 0.08) 12px
  );
  border-bottom: 2px solid rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
`

// 贴纸凹槽区域
const StickerArea = styled.div`
  flex: 1;
  margin: 0 12px;
  padding: 8px;
  border-radius: 12px;
  background: #e5e7eb;
  box-shadow:
    inset 3px 3px 8px rgba(0, 0, 0, 0.3),
    inset -1px -1px 2px rgba(255, 255, 255, 0.5);
`

// 贴纸
const Sticker = styled.div<{ $bgColor: string }>`
  width: 100%;
  height: 100%;
  border-radius: 8px;
  border: 2px solid rgba(0, 0, 0, 0.3);
  background: ${({ $bgColor }) => $bgColor};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
`

// 贴纸光泽反射
const StickerGloss = styled.div`
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    to bottom right,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0) 40%,
    rgba(255, 255, 255, 0.3) 50%,
    rgba(255, 255, 255, 0) 60%
  );
  transform: rotate(25deg);
  pointer-events: none;
`

// 贴纸顶部
const StickerHeader = styled.div`
  height: 28px;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
`

const StickerBrand = styled.span`
  font-size: 9px;
  font-weight: 700;
  color: #ffd700;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.5px;
  text-shadow: 0 0 4px rgba(255, 215, 0, 0.5);
`

const StickerBadge = styled.span`
  font-size: 7px;
  color: white;
  background: #ef4444;
  padding: 2px 6px;
  border-radius: 2px;
  font-family: monospace;
`

// 贴纸主内容
const StickerContent = styled.div<{ $textColor: string }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 8px;
  position: relative;
  color: ${({ $textColor }) => $textColor};
`

// 像素点背景装饰
const PixelDots = styled.div`
  position: absolute;
  inset: 0;
  opacity: 0.15;
  background-image: radial-gradient(#000 1px, transparent 1px);
  background-size: 8px 8px;
  pointer-events: none;
`

const StickerEmoji = styled.div`
  margin-bottom: 8px;
  filter: drop-shadow(2px 2px 0 rgba(0, 0, 0, 0.5));
  animation: ${bounce} 2s ease-in-out infinite;
`

const StickerTitle = styled.div`
  font-size: 14px;
  font-weight: 700;
  text-align: center;
  letter-spacing: 0.5px;
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.3);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  white-space: normal;
  max-width: 100%;
  line-height: 1.3;
`

const StickerDesc = styled.div`
  font-size: 11px;
  text-align: center;
  opacity: 0.9;
  margin-top: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  line-height: 1.4;
`

// 贴纸底部 - 已隐藏以增加文字空间
const StickerFooter = styled.div`
  display: none;
`

const FooterText = styled.span`
  font-size: 6px;
  color: #9ca3af;
  font-family: monospace;
  letter-spacing: 1px;
`

// 添加卡带贴纸 - 已隐藏
const _AddSticker = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 8px;
  border: 2px dashed rgba(0, 0, 0, 0.2);
  background: rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  ${CartridgeContainer}:hover & {
    border-color: rgba(59, 130, 246, 0.5);
    background: rgba(59, 130, 246, 0.1);
  }
`
void _AddSticker

const _AddIconWrapper = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  margin-bottom: 12px;
  transition: all 0.3s ease;

  ${CartridgeContainer}:hover & {
    background: rgba(59, 130, 246, 0.2);
    color: #3b82f6;
    transform: scale(1.1);
  }
`
void _AddIconWrapper

const _AddText = styled.div`
  font-size: 10px;
  font-weight: 600;
  color: #6b7280;
  font-family: monospace;
  text-transform: uppercase;
  letter-spacing: 1px;

  ${CartridgeContainer}:hover & {
    color: #3b82f6;
  }
`
void _AddText

// 底部区域
const BottomSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 12px 12px;
`

// 插入箭头
const InsertArrow = styled.div`
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid #9ca3af;
  filter: drop-shadow(0 1px 0 rgba(255, 255, 255, 0.5));
  margin-bottom: 4px;
`

const InsertText = styled.div`
  font-size: 7px;
  color: #9ca3af;
  font-family: monospace;
  letter-spacing: 1px;
  margin-bottom: 6px;
  opacity: 0.6;
`

// 底部接口槽
const ConnectorGap = styled.div`
  width: 90%;
  height: 12px;
  background: #1f2937;
  border-radius: 999px;
  box-shadow: inset 0 4px 8px rgba(0, 0, 0, 0.8);
`

// 卡带倒影
const CartridgeShadow = styled.div`
  width: 80%;
  height: 12px;
  background: #000;
  opacity: 0.2;
  filter: blur(12px);
  margin: 8px auto 0;
  border-radius: 999px;
  transition: all 0.4s ease;

  ${CartridgeContainer}:hover & {
    width: 70%;
    opacity: 0.15;
    margin-top: 20px;
  }
`

// 操作按钮覆盖层 - 已隐藏
const _ActionOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 24px 24px 8px 8px;
  z-index: 20;
  backdrop-filter: blur(2px);
`
void _ActionOverlay

const _ActionButton = styled.button`
  width: 48px;
  height: 48px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: #3b82f6;
    transform: scale(1.1);
  }
`
void _ActionButton

export default AssistantsTab
