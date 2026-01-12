import { useTheme } from '@renderer/context/ThemeProvider'
import type { Expert } from '@renderer/types'
import { Dropdown } from 'antd'
import { AtSign, Download, FileUp, MoreHorizontal, Package, Pencil, Plus, Trash2, UserPlus } from 'lucide-react'
import type { FC } from 'react'
import { useRef } from 'react'
import styled from 'styled-components'

interface Props {
  // 卡带相关
  cartridges: Expert[]
  onAddCartridge: () => void
  onImportCartridge?: () => void
  onImportCartridgeFile?: (file: File) => void
  onEditCartridge: (cartridge: Expert) => void
  onDeleteCartridge: (cartridge: Expert) => void
  onSelectCartridge: (cartridge: Expert) => void
}

const CartridgeSidebar: FC<Props> = ({
  cartridges,
  onAddCartridge,
  onImportCartridge,
  onImportCartridgeFile,
  onEditCartridge,
  onDeleteCartridge,
  onSelectCartridge
}) => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // 卡带导入文件输入
  const cartridgeInputRef = useRef<HTMLInputElement>(null)

  return (
    <Container $isDark={isDark}>
      <ScrollArea>
        {/* 固定标题：卡带商店 */}
        <TitleSection>
          <TitleIcon>
            <Package size={20} />
          </TitleIcon>
          <TitleText>卡带商店</TitleText>
        </TitleSection>

        {/* 卡带列表 */}
        <Section>
          <SectionHeader>
            <SectionHeaderLeft>
              <SectionTitle>卡带列表</SectionTitle>
              {cartridges.length > 0 && <Badge>{cartridges.length}</Badge>}
            </SectionHeaderLeft>
            <Dropdown
              trigger={['click']}
              menu={{
                items: [
                  {
                    key: 'add',
                    label: '添加卡带',
                    icon: <UserPlus size={14} />,
                    onClick: (e) => {
                      e.domEvent.stopPropagation()
                      onAddCartridge()
                    }
                  },
                  {
                    key: 'import',
                    label: '从卡带库导入',
                    icon: <Download size={14} />,
                    onClick: (e) => {
                      e.domEvent.stopPropagation()
                      onImportCartridge?.()
                    }
                  },
                  {
                    key: 'cartridge',
                    label: '从MD导入卡带',
                    icon: <FileUp size={14} />,
                    onClick: (e) => {
                      e.domEvent.stopPropagation()
                      cartridgeInputRef.current?.click()
                    }
                  }
                ]
              }}>
              <AddButton onClick={(e) => e.stopPropagation()}>
                <Plus size={12} />
              </AddButton>
            </Dropdown>
          </SectionHeader>
          <SectionContent>
            {cartridges.length === 0 ? (
              <EmptyState>暂无卡带</EmptyState>
            ) : (
              cartridges.map((cartridge) => (
                <CartridgeItem key={cartridge.id}>
                  <CartridgeInfo onClick={() => onSelectCartridge(cartridge)}>
                    <CartridgeAvatar>{cartridge.emoji || '👤'}</CartridgeAvatar>
                    <CartridgeDetails>
                      <CartridgeName>{cartridge.name}</CartridgeName>
                      <CartridgeHandle>
                        <AtSign size={10} />
                        {cartridge.handle?.replace('@', '') || cartridge.name}
                      </CartridgeHandle>
                    </CartridgeDetails>
                  </CartridgeInfo>
                  <CartridgeActions className="actions">
                    <ActionIcon onClick={() => onSelectCartridge(cartridge)} title="@提及">
                      <AtSign size={12} />
                    </ActionIcon>
                    <Dropdown
                      trigger={['click']}
                      menu={{
                        items: [
                          {
                            key: 'edit',
                            label: '编辑',
                            icon: <Pencil size={14} />,
                            onClick: () => onEditCartridge(cartridge)
                          },
                          {
                            key: 'delete',
                            label: '删除',
                            icon: <Trash2 size={14} />,
                            danger: true,
                            onClick: () => onDeleteCartridge(cartridge)
                          }
                        ]
                      }}>
                      <ActionIcon>
                        <MoreHorizontal size={12} />
                      </ActionIcon>
                    </Dropdown>
                  </CartridgeActions>
                </CartridgeItem>
              ))
            )}
          </SectionContent>
        </Section>
      </ScrollArea>

      {/* 隐藏的卡带文件输入 */}
      <input
        ref={cartridgeInputRef}
        type="file"
        accept=".md,.markdown"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file && onImportCartridgeFile) {
            onImportCartridgeFile(file)
          }
          e.target.value = '' // 重置以允许重复选择同一文件
        }}
      />
    </Container>
  )
}

// Styled Components
const Container = styled.div<{ $isDark: boolean }>`
  display: flex;
  flex-direction: column;
  width: 280px;
  min-width: 280px;
  height: 100%;
  background: ${({ $isDark }) => ($isDark ? '#0f0f1a' : '#ffffff')};
  border-radius: 12px;
  box-shadow: ${({ $isDark }) =>
    $isDark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)'};

  /* 主题变量 */
  --sidebar-bg: ${({ $isDark }) => ($isDark ? '#0f0f1a' : '#ffffff')};
  --sidebar-bg-hover: ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb')};
  --sidebar-bg-active: ${({ $isDark }) => ($isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.08)')};
  --sidebar-border: ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.06)' : '#f0f0f0')};
  --sidebar-text: ${({ $isDark }) => ($isDark ? '#ffffff' : '#1f2937')};
  --sidebar-text-secondary: ${({ $isDark }) => ($isDark ? '#9ca3af' : '#6b7280')};
  --sidebar-text-muted: ${({ $isDark }) => ($isDark ? '#6b7280' : '#9ca3af')};
  --sidebar-primary: #3b82f6;
  --sidebar-primary-soft: ${({ $isDark }) => ($isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.08)')};
`

const ScrollArea = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--sidebar-border);
    border-radius: 2px;
  }
`

const TitleSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid var(--sidebar-border);
`

const TitleIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--sidebar-primary) 0%, #2563eb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`

const TitleText = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: var(--sidebar-text);
`

const Section = styled.div`
  padding: 8px 0;
`

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
`

const SectionHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const SectionTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: var(--sidebar-text-secondary);
`

const Badge = styled.span`
  font-size: 10px;
  color: var(--sidebar-primary);
  background: var(--sidebar-primary-soft);
  padding: 2px 8px;
  border-radius: 10px;
`

const AddButton = styled.button`
  width: 24px;
  height: 24px;
  border: none;
  background: var(--sidebar-primary-soft);
  color: var(--sidebar-primary);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;

  &:hover {
    background: var(--sidebar-primary);
    color: white;
  }
`

const SectionContent = styled.div`
  padding: 0 8px;
`

const EmptyState = styled.div`
  font-size: 13px;
  color: var(--sidebar-text-muted);
  padding: 20px;
  text-align: center;
  background: var(--sidebar-bg-hover);
  border-radius: 8px;
  margin: 0 8px;
`

const CartridgeItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 8px;
  transition: all 0.15s ease;

  &:hover {
    background: var(--sidebar-bg-hover);
  }

  &:hover .actions {
    opacity: 1;
  }
`

const CartridgeInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  cursor: pointer;
  overflow: hidden;
`

const CartridgeAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
`

const CartridgeDetails = styled.div`
  overflow: hidden;
`

const CartridgeName = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: var(--sidebar-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const CartridgeHandle = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: var(--sidebar-primary);
`

const CartridgeActions = styled.div`
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s ease;
`

const ActionIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  color: var(--sidebar-text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: var(--sidebar-primary-soft);
    color: var(--sidebar-primary);
  }
`

export default CartridgeSidebar
