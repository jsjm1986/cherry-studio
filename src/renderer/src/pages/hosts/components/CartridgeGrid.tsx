import { useTheme } from '@renderer/context/ThemeProvider'
import type { Expert } from '@renderer/types'
import { Dropdown } from 'antd'
import { AtSign, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import type { FC } from 'react'
import styled, { keyframes } from 'styled-components'

interface Props {
  cartridges: Expert[]
  onEdit: (cartridge: Expert) => void
  onDelete: (cartridge: Expert) => void
  onMention: (cartridge: Expert) => void
}

// 随机颜色生成器 - 复古游戏卡带常见颜色
const cartridgeColors = [
  { shell: '#2d2d2d', label: '#e74c3c', accent: '#c0392b' }, // 黑色+红色
  { shell: '#34495e', label: '#3498db', accent: '#2980b9' }, // 深蓝灰+蓝色
  { shell: '#1a1a2e', label: '#9b59b6', accent: '#8e44ad' }, // 深紫+紫色
  { shell: '#2c3e50', label: '#1abc9c', accent: '#16a085' }, // 深蓝+青色
  { shell: '#3d3d3d', label: '#f39c12', accent: '#d68910' }, // 灰色+橙色
  { shell: '#1e272e', label: '#e84393', accent: '#c44569' }, // 深灰+粉色
  { shell: '#2d3436', label: '#00b894', accent: '#00a085' }, // 深灰+绿色
  { shell: '#192a56', label: '#ffc312', accent: '#f79f1f' } // 深蓝+金色
]

const getCartridgeColor = (id: string) => {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return cartridgeColors[hash % cartridgeColors.length]
}

const CartridgeGrid: FC<Props> = ({ cartridges, onEdit, onDelete, onMention }) => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  if (cartridges.length === 0) {
    return (
      <EmptyContainer $isDark={isDark}>
        <EmptyCartridge>
          <CartridgeShellEmpty>
            <CartridgeGripEmpty />
            <CartridgeLabelEmpty>
              <EmptyText>INSERT</EmptyText>
              <EmptySubText>CARTRIDGE</EmptySubText>
            </CartridgeLabelEmpty>
            <CartridgeConnectorEmpty />
          </CartridgeShellEmpty>
        </EmptyCartridge>
        <EmptyTitle>卡带商店</EmptyTitle>
        <EmptyDesc>暂无卡带，点击左侧添加按钮创建新卡带</EmptyDesc>
      </EmptyContainer>
    )
  }

  return (
    <Container $isDark={isDark}>
      <Header>
        <Title>
          <TitleIcon>🎮</TitleIcon>
          卡带列表
        </Title>
        <Count>{cartridges.length} 个卡带</Count>
      </Header>
      <Grid>
        {cartridges.map((cartridge) => {
          const colors = getCartridgeColor(cartridge.id)
          return (
            <CartridgeWrapper key={cartridge.id}>
              <CartridgeShell $shellColor={colors.shell}>
                {/* CRT扫描线效果 */}
                <ScanlineOverlay />

                {/* 顶部握把纹理 */}
                <CartridgeGrip $shellColor={colors.shell} />

                {/* 外壳高光 */}
                <ShellHighlight />

                {/* 标签区域 */}
                <CartridgeLabel $labelColor={colors.label}>
                  {/* 贴纸光泽效果 */}
                  <LabelGloss />

                  {/* 内容 */}
                  <LabelContent>
                    <LabelEmoji>{cartridge.emoji || '👤'}</LabelEmoji>
                    <LabelTitle>{cartridge.name}</LabelTitle>
                    <LabelHandle>
                      <AtSign size={10} />
                      {cartridge.handle?.replace('@', '') || cartridge.name}
                    </LabelHandle>
                    {cartridge.description && <LabelDesc>{cartridge.description}</LabelDesc>}
                  </LabelContent>

                  {/* 标签装饰线 */}
                  <LabelStripe $accentColor={colors.accent} />
                </CartridgeLabel>

                {/* 关键词标签 */}
                {cartridge.triggerKeywords && cartridge.triggerKeywords.length > 0 && (
                  <KeywordBadge>
                    {cartridge.triggerKeywords.slice(0, 2).map((keyword, i) => (
                      <KeywordTag key={i}>{keyword}</KeywordTag>
                    ))}
                    {cartridge.triggerKeywords.length > 2 && (
                      <KeywordTag>+{cartridge.triggerKeywords.length - 2}</KeywordTag>
                    )}
                  </KeywordBadge>
                )}

                {/* 底部金色连接器 */}
                <CartridgeConnector />

                {/* 操作按钮 - 悬停显示 */}
                <ActionOverlay className="action-overlay">
                  <ActionButton onClick={() => onMention(cartridge)} title="@提及">
                    <AtSign size={16} />
                  </ActionButton>
                  <Dropdown
                    trigger={['click']}
                    menu={{
                      items: [
                        {
                          key: 'edit',
                          label: '编辑',
                          icon: <Pencil size={14} />,
                          onClick: () => onEdit(cartridge)
                        },
                        {
                          key: 'delete',
                          label: '删除',
                          icon: <Trash2 size={14} />,
                          danger: true,
                          onClick: () => onDelete(cartridge)
                        }
                      ]
                    }}>
                    <ActionButton>
                      <MoreHorizontal size={16} />
                    </ActionButton>
                  </Dropdown>
                </ActionOverlay>
              </CartridgeShell>
            </CartridgeWrapper>
          )
        })}
      </Grid>

      {/* 全局CRT效果 */}
      <CRTEffect />
    </Container>
  )
}

// 动画
const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`

const floatAnimation = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
`

// 像素闪烁效果 - 复古 8-bit 风格
const pixelFlicker = keyframes`
  0%, 100% {
    opacity: 1;
    filter: brightness(1) saturate(1);
  }
  10% {
    opacity: 0.95;
    filter: brightness(1.1) saturate(1.1);
  }
  20% {
    opacity: 1;
    filter: brightness(1) saturate(1);
  }
  30% {
    opacity: 0.98;
    filter: brightness(1.05) saturate(1.05);
  }
  50% {
    opacity: 1;
    filter: brightness(1.15) saturate(1.2);
  }
  70% {
    opacity: 0.97;
    filter: brightness(1.02) saturate(1);
  }
  90% {
    opacity: 1;
    filter: brightness(1.08) saturate(1.1);
  }
`

// RGB 色彩偏移效果
const rgbShift = keyframes`
  0%, 100% {
    text-shadow:
      1px 0 0 rgba(255, 0, 0, 0),
      -1px 0 0 rgba(0, 255, 255, 0);
  }
  25% {
    text-shadow:
      2px 0 0 rgba(255, 0, 0, 0.3),
      -2px 0 0 rgba(0, 255, 255, 0.3);
  }
  50% {
    text-shadow:
      1px 0 0 rgba(255, 0, 0, 0.2),
      -1px 0 0 rgba(0, 255, 255, 0.2);
  }
  75% {
    text-shadow:
      3px 0 0 rgba(255, 0, 0, 0.4),
      -3px 0 0 rgba(0, 255, 255, 0.4);
  }
`

// 边框像素脉冲
const borderPulse = keyframes`
  0%, 100% {
    box-shadow:
      inset 2px 2px 4px rgba(255, 255, 255, 0.1),
      inset -2px -2px 4px rgba(0, 0, 0, 0.3),
      0 8px 24px rgba(0, 0, 0, 0.4),
      0 0 0 2px transparent;
  }
  25% {
    box-shadow:
      inset 2px 2px 4px rgba(255, 255, 255, 0.1),
      inset -2px -2px 4px rgba(0, 0, 0, 0.3),
      0 8px 24px rgba(0, 0, 0, 0.4),
      0 0 0 2px rgba(0, 255, 255, 0.6);
  }
  50% {
    box-shadow:
      inset 2px 2px 4px rgba(255, 255, 255, 0.1),
      inset -2px -2px 4px rgba(0, 0, 0, 0.3),
      0 8px 24px rgba(0, 0, 0, 0.4),
      0 0 0 2px rgba(255, 0, 255, 0.6);
  }
  75% {
    box-shadow:
      inset 2px 2px 4px rgba(255, 255, 255, 0.1),
      inset -2px -2px 4px rgba(0, 0, 0, 0.3),
      0 8px 24px rgba(0, 0, 0, 0.4),
      0 0 0 2px rgba(255, 255, 0, 0.6);
  }
`

// 扫描线增强动画
const scanlineMove = keyframes`
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 0 100%;
  }
`

// 容器样式
const Container = styled.div<{ $isDark: boolean }>`
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: ${({ $isDark }) =>
    $isDark
      ? 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0f0f1a 100%)'
      : 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 50%, #f0f0f0 100%)'};
  position: relative;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')};
    border-radius: 3px;
  }
`

const CRTEffect = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.03) 0px,
    rgba(0, 0, 0, 0.03) 1px,
    transparent 1px,
    transparent 2px
  );
  z-index: 1000;
  opacity: 0.3;
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`

const Title = styled.h2`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 700;
  color: var(--hosts-text);
  margin: 0;
  font-family: 'Press Start 2P', 'Courier New', monospace;
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.3);
  letter-spacing: 1px;
`

const TitleIcon = styled.span`
  font-size: 24px;
  animation: ${floatAnimation} 2s ease-in-out infinite;
`

const Count = styled.span`
  font-size: 12px;
  color: var(--hosts-text-secondary);
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 12px;
  border-radius: 12px;
  font-family: monospace;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 24px;
  perspective: 1000px;
`

// 卡带外壳 - 像素闪烁悬停效果
const CartridgeWrapper = styled.div`
  position: relative;

  &:hover {
    /* 像素闪烁动画 */
    animation: ${pixelFlicker} 0.15s steps(2) infinite;

    .action-overlay {
      opacity: 1;
    }

    /* 悬停时增强扫描线 */
    .scanline-hover {
      opacity: 1;
    }

    /* RGB 色彩偏移 */
    .label-title {
      animation: ${rgbShift} 0.3s steps(4) infinite;
    }
  }
`

const CartridgeShell = styled.div<{ $shellColor: string }>`
  position: relative;
  width: 100%;
  aspect-ratio: 0.75;
  background: ${({ $shellColor }) => $shellColor};
  border-radius: 8px 8px 4px 4px;
  box-shadow:
    inset 2px 2px 4px rgba(255, 255, 255, 0.1),
    inset -2px -2px 4px rgba(0, 0, 0, 0.3),
    0 8px 24px rgba(0, 0, 0, 0.4),
    0 2px 4px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.1s steps(2);

  /* 悬停时边框像素脉冲 */
  ${CartridgeWrapper}:hover & {
    animation: ${borderPulse} 0.5s steps(4) infinite;
  }
`

const ScanlineOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.1) 0px,
    rgba(0, 0, 0, 0.1) 1px,
    transparent 1px,
    transparent 3px
  );
  pointer-events: none;
  z-index: 10;
  transition: opacity 0.1s;

  /* 悬停时扫描线增强并移动 */
  ${CartridgeWrapper}:hover & {
    background: repeating-linear-gradient(
      0deg,
      rgba(0, 255, 255, 0.08) 0px,
      rgba(0, 255, 255, 0.08) 1px,
      transparent 1px,
      transparent 3px
    );
    animation: ${scanlineMove} 2s linear infinite;
  }
`

const ShellHighlight = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, transparent 100%);
  pointer-events: none;
  z-index: 5;
`

// 握把纹理
const CartridgeGrip = styled.div<{ $shellColor: string }>`
  height: 20px;
  background: repeating-linear-gradient(
    90deg,
    ${({ $shellColor }) => $shellColor} 0px,
    ${({ $shellColor }) => $shellColor} 3px,
    rgba(0, 0, 0, 0.3) 3px,
    rgba(0, 0, 0, 0.3) 6px
  );
  border-bottom: 2px solid rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
`

// 标签区域
const CartridgeLabel = styled.div<{ $labelColor: string }>`
  flex: 1;
  margin: 12px;
  background: ${({ $labelColor }) => $labelColor};
  border-radius: 4px;
  position: relative;
  overflow: hidden;
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.2),
    inset 0 -1px 2px rgba(255, 255, 255, 0.1);
`

const LabelGloss = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 40%;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.3) 0%,
    rgba(255, 255, 255, 0.1) 50%,
    transparent 100%
  );
  pointer-events: none;
`

const LabelStripe = styled.div<{ $accentColor: string }>`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: ${({ $accentColor }) => $accentColor};
`

const LabelContent = styled.div`
  position: relative;
  z-index: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
`

const LabelEmoji = styled.div`
  font-size: 32px;
  margin-bottom: 8px;
  filter: drop-shadow(2px 2px 2px rgba(0, 0, 0, 0.3));
  transition: filter 0.1s steps(2);

  /* 悬停时发光效果 */
  ${CartridgeWrapper}:hover & {
    filter: drop-shadow(2px 2px 2px rgba(0, 0, 0, 0.3)) drop-shadow(0 0 8px rgba(255, 255, 255, 0.6));
  }
`

const LabelTitle = styled.div`
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  font-family: 'Press Start 2P', 'Courier New', monospace;
  font-size: 10px;
  letter-spacing: 0.5px;

  /* 悬停时 RGB 色彩偏移 */
  ${CartridgeWrapper}:hover & {
    animation: ${rgbShift} 0.3s steps(4) infinite;
  }
`

const LabelHandle = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 9px;
  opacity: 0.9;
  font-family: monospace;
`

const LabelDesc = styled.div`
  font-size: 8px;
  opacity: 0.8;
  text-align: center;
  margin-top: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.3;
`

// 关键词标签
const KeywordBadge = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 0 12px;
  margin-bottom: 8px;
  justify-content: center;
`

const KeywordTag = styled.span`
  font-size: 8px;
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  font-family: monospace;
`

// 金色连接器
const CartridgeConnector = styled.div`
  height: 16px;
  margin: 0 16px;
  background: linear-gradient(
    90deg,
    #8b7355 0%,
    #d4af37 20%,
    #ffd700 50%,
    #d4af37 80%,
    #8b7355 100%
  );
  border-radius: 0 0 2px 2px;
  position: relative;
  flex-shrink: 0;

  &::before {
    content: '';
    position: absolute;
    top: 2px;
    left: 4px;
    right: 4px;
    height: 2px;
    background: repeating-linear-gradient(
      90deg,
      #654321 0px,
      #654321 4px,
      transparent 4px,
      transparent 8px
    );
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 2px;
    left: 4px;
    right: 4px;
    height: 2px;
    background: repeating-linear-gradient(
      90deg,
      #654321 0px,
      #654321 4px,
      transparent 4px,
      transparent 8px
    );
  }
`

// 操作按钮覆盖层
const ActionOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  opacity: 0;
  transition: opacity 0.2s ease;
  border-radius: 8px 8px 4px 4px;
  z-index: 20;
`

const ActionButton = styled.button`
  width: 40px;
  height: 40px;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  backdrop-filter: blur(4px);

  &:hover {
    background: var(--hosts-primary);
    transform: scale(1.1);
  }
`

// 空状态样式
const EmptyContainer = styled.div<{ $isDark: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 40px;
  background: ${({ $isDark }) =>
    $isDark
      ? 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0f0f1a 100%)'
      : 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 50%, #f0f0f0 100%)'};
`

const EmptyCartridge = styled.div`
  width: 160px;
  margin-bottom: 24px;
  animation: ${floatAnimation} 3s ease-in-out infinite;
`

const CartridgeShellEmpty = styled.div`
  width: 100%;
  aspect-ratio: 0.75;
  background: #2d2d2d;
  border-radius: 8px 8px 4px 4px;
  box-shadow:
    inset 2px 2px 4px rgba(255, 255, 255, 0.1),
    inset -2px -2px 4px rgba(0, 0, 0, 0.3),
    0 8px 24px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

const CartridgeGripEmpty = styled.div`
  height: 20px;
  background: repeating-linear-gradient(90deg, #2d2d2d 0px, #2d2d2d 3px, rgba(0, 0, 0, 0.3) 3px, rgba(0, 0, 0, 0.3) 6px);
  border-bottom: 2px solid rgba(0, 0, 0, 0.2);
`

const CartridgeLabelEmpty = styled.div`
  flex: 1;
  margin: 12px;
  background: #444;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
`

const EmptyText = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.5);
  font-family: 'Press Start 2P', 'Courier New', monospace;
  letter-spacing: 2px;
  animation: ${shimmer} 2s ease-in-out infinite;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.3) 0%,
    rgba(255, 255, 255, 0.6) 50%,
    rgba(255, 255, 255, 0.3) 100%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`

const EmptySubText = styled.div`
  font-size: 10px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.4);
  font-family: 'Press Start 2P', 'Courier New', monospace;
  letter-spacing: 1px;
  margin-top: 4px;
`

const CartridgeConnectorEmpty = styled.div`
  height: 16px;
  margin: 0 16px;
  background: linear-gradient(90deg, #555 0%, #888 50%, #555 100%);
  border-radius: 0 0 2px 2px;
`

const EmptyTitle = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: var(--hosts-text);
  margin-bottom: 8px;
  font-family: 'Press Start 2P', 'Courier New', monospace;
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.2);
`

const EmptyDesc = styled.div`
  font-size: 14px;
  color: var(--hosts-text-secondary);
  text-align: center;
  max-width: 300px;
  line-height: 1.6;
`

export default CartridgeGrid
