import { FC, useState } from 'react'
import styled from 'styled-components'
import {
  Moon,
  Sun,
  Sparkles,
  Send,
  Settings,
  User,
  Search,
  BookOpen,
  Mic,
  Layers,
  ChevronRight,
  Plus,
  FileText,
  Zap,
  Globe
} from 'lucide-react'

/**
 * 墨韵设计系统 Demo 页面 v2.0
 * 参考现代 SaaS 设计风格 - 干净、轻盈、专业
 */
const MoYunDemo: FC = () => {
  const [isDark, setIsDark] = useState(false) // 默认亮色模式
  const [selectedRoom, setSelectedRoom] = useState('writing')

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    document.documentElement.setAttribute('theme-mode', newTheme ? 'dark' : 'light')
  }

  const rooms = [
    { id: 'script', name: '编剧顾问', desc: '剧本创作各类专家...', color: '#f59e0b', icon: BookOpen },
    { id: 'study', name: '学习房间', desc: '各类学习思维模型专家...', color: '#3b82f6', icon: Layers },
    { id: 'predict', name: '预测房间', desc: '中西方各类预测/占卜...', color: '#8b5cf6', icon: Globe },
    { id: 'writing', name: '写作房间', desc: '用于各类不同风格的文章...', color: '#3b82f6', icon: FileText }
  ]

  const experts = [
    { id: 'science', name: '科普作家', handle: '@科普作家', icon: Zap, color: '#3b82f6' },
    { id: 'style', name: '文风提取', handle: '@文风提取', icon: FileText, color: '#f59e0b' },
    { id: 'speech', name: '演讲助手', handle: '@演讲助手', icon: Mic, color: '#ef4444' }
  ]

  const conversations = [
    { title: '默认话题', desc: '写作房间：欢迎来到写作房间！', time: '29分钟前', isToday: true },
    { title: '关于AI的未来讨论', desc: '科普作家：AI的发展速度惊人...', time: '2小时前', isToday: true },
    { title: '科幻小说大纲', desc: '文风提取：赛博朋克风格的大纲...', time: '5小时前', isToday: true },
    { title: '演讲稿优化', desc: '演讲助手：建议增加一些情感共鸣...', time: '昨天 14:30', isYesterday: true },
    { title: '新媒体文案生成', desc: '写作房间：已为您生成3个标题...', time: '昨天 09:15', isYesterday: true }
  ]

  return (
    <Container $isDark={isDark}>
      {/* 左侧边栏 */}
      <LeftSidebar $isDark={isDark}>
        <SidebarHeader>
          <RoomTitle $isDark={isDark}>写作房间</RoomTitle>
          <CollapseButton $isDark={isDark}>
            <ChevronRight size={16} />
          </CollapseButton>
        </SidebarHeader>

        <ProfileSection>
          <ProfileAvatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" />
          <ProfileName $isDark={isDark}>写作顾问</ProfileName>
          <ProfileBadge>用于各类不同风格的文章...</ProfileBadge>
        </ProfileSection>

        <SearchBox $isDark={isDark}>
          <Search size={16} />
          <input placeholder="搜索" />
        </SearchBox>

        <SectionHeader $isDark={isDark}>
          <ChevronRight size={14} style={{ transform: 'rotate(90deg)' }} />
          <span>房间列表</span>
          <PlusButton $isDark={isDark}>
            <Plus size={14} />
          </PlusButton>
        </SectionHeader>

        <RoomList>
          {rooms.map((room) => (
            <RoomItem
              key={room.id}
              $isDark={isDark}
              $selected={selectedRoom === room.id}
              onClick={() => setSelectedRoom(room.id)}>
              <RoomIcon $color={room.color}>
                <room.icon size={18} />
              </RoomIcon>
              <RoomInfo>
                <RoomName $isDark={isDark}>{room.name}</RoomName>
                <RoomDesc $isDark={isDark} $selected={selectedRoom === room.id}>
                  {room.desc}
                </RoomDesc>
              </RoomInfo>
            </RoomItem>
          ))}
        </RoomList>

        <SectionHeader $isDark={isDark}>
          <ChevronRight size={14} style={{ transform: 'rotate(90deg)' }} />
          <span>专家列表</span>
          <ExpertCount>3</ExpertCount>
          <PlusButton $isDark={isDark}>
            <Plus size={14} />
          </PlusButton>
        </SectionHeader>

        <ExpertList>
          {experts.map((expert) => (
            <ExpertItem key={expert.id} $isDark={isDark}>
              <ExpertIcon $color={expert.color}>
                <expert.icon size={16} />
              </ExpertIcon>
              <ExpertInfo>
                <ExpertName $isDark={isDark}>{expert.name}</ExpertName>
                <ExpertHandle>{expert.handle}</ExpertHandle>
              </ExpertInfo>
            </ExpertItem>
          ))}
        </ExpertList>
      </LeftSidebar>

      {/* 中间主内容区 */}
      <MainContent $isDark={isDark}>
        <ChatHeader $isDark={isDark}>
          <ChatTitle>
            <h2>写作房间</h2>
            <ChatSubtitle $isDark={isDark}>已添加 3 位专家，使用 @ 提及专家开始对话</ChatSubtitle>
          </ChatTitle>
          <ChatActions>
            <ActionIcon $isDark={isDark} $color="#3b82f6">
              <User size={18} />
            </ActionIcon>
            <ActionIcon $isDark={isDark} $color="#f59e0b">
              <FileText size={18} />
            </ActionIcon>
            <ActionIcon $isDark={isDark} $color="#ef4444">
              <Mic size={18} />
            </ActionIcon>
            <ActionIcon $isDark={isDark}>
              <Settings size={18} />
            </ActionIcon>
          </ChatActions>
        </ChatHeader>

        <ChatMessages>
          <WelcomeMessage $isDark={isDark}>
            <WelcomeAvatar $color="#3b82f6">
              <FileText size={20} />
            </WelcomeAvatar>
            <WelcomeContent>
              <WelcomeName $isDark={isDark}>
                写作房间 <WelcomeTime $isDark={isDark}>刚刚</WelcomeTime>
              </WelcomeName>
              <WelcomeText $isDark={isDark}>
                欢迎来到写作房间！我是您的智能写作助手。您可以随时 @ 专家来协助您创作。
              </WelcomeText>
            </WelcomeContent>
          </WelcomeMessage>
        </ChatMessages>

        <ChatInputArea $isDark={isDark}>
          <ChatInputBox $isDark={isDark}>
            <input placeholder="在这里输入消息，按 Enter 发送 - @ 选择模型，/ 选择工具" />
          </ChatInputBox>
          <ChatToolbar>
            <ToolbarLeft>
              <ToolbarIcon $isDark={isDark}>
                <Plus size={18} />
              </ToolbarIcon>
              <ToolbarIcon $isDark={isDark}>
                <FileText size={18} />
              </ToolbarIcon>
              <ToolbarIcon $isDark={isDark}>
                <Mic size={18} />
              </ToolbarIcon>
              <ToolbarIcon $isDark={isDark}>
                <Globe size={18} />
              </ToolbarIcon>
              <ToolbarIcon $isDark={isDark}>
                <Sparkles size={18} />
              </ToolbarIcon>
            </ToolbarLeft>
            <ToolbarRight>
              <SelectExpertBtn>
                <Globe size={14} />
                选择专家
                <ChevronRight size={14} style={{ transform: 'rotate(90deg)' }} />
              </SelectExpertBtn>
              <CharCount $isDark={isDark}>0 / 5</CharCount>
              <CharCount $isDark={isDark}>24 / 24</CharCount>
              <LangSwitch $isDark={isDark}>A 中</LangSwitch>
              <SendButton>
                <Send size={16} />
              </SendButton>
            </ToolbarRight>
          </ChatToolbar>
        </ChatInputArea>
      </MainContent>

      {/* 右侧边栏 - 对话记录 */}
      <RightSidebar $isDark={isDark}>
        <RightHeader $isDark={isDark}>
          <ChevronRight size={16} />
          <span>对话记录</span>
        </RightHeader>

        <TimeGroup>
          <TimeLabel $isDark={isDark}>今天</TimeLabel>
          {conversations
            .filter((c) => c.isToday)
            .map((conv, i) => (
              <ConversationItem key={i} $isDark={isDark}>
                <ConvTitle $isDark={isDark}>{conv.title}</ConvTitle>
                <ConvTime $isDark={isDark}>{conv.time}</ConvTime>
                <ConvDesc $isDark={isDark}>{conv.desc}</ConvDesc>
              </ConversationItem>
            ))}
        </TimeGroup>

        <TimeGroup>
          <TimeLabel $isDark={isDark}>昨天</TimeLabel>
          {conversations
            .filter((c) => c.isYesterday)
            .map((conv, i) => (
              <ConversationItem key={i} $isDark={isDark}>
                <ConvTitle $isDark={isDark}>{conv.title}</ConvTitle>
                <ConvTime $isDark={isDark}>{conv.time}</ConvTime>
                <ConvDesc $isDark={isDark}>{conv.desc}</ConvDesc>
              </ConversationItem>
            ))}
        </TimeGroup>

        {/* 主题切换按钮 */}
        <ThemeToggleFloat onClick={toggleTheme} $isDark={isDark}>
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </ThemeToggleFloat>
      </RightSidebar>
    </Container>
  )
}

// ============================================
// Styled Components - 墨韵设计系统 v2.0
// 现代 SaaS 风格 - 干净、轻盈、专业
// ============================================

const Container = styled.div<{ $isDark: boolean }>`
  display: flex;
  min-height: 100vh;
  background: ${({ $isDark }) => ($isDark ? '#1a1a2e' : '#f8fafc')};
  transition: all 0.3s ease;
`

// ===== 左侧边栏 =====
const LeftSidebar = styled.div<{ $isDark: boolean }>`
  width: 280px;
  min-width: 280px;
  background: ${({ $isDark }) => ($isDark ? '#0f0f1a' : '#ffffff')};
  border-right: 1px solid ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.06)' : '#f0f0f0')};
  display: flex;
  flex-direction: column;
  padding: 20px 16px;
  overflow-y: auto;
`

const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`

const RoomTitle = styled.h1<{ $isDark: boolean }>`
  font-size: 18px;
  font-weight: 600;
  color: ${({ $isDark }) => ($isDark ? '#ffffff' : '#1f2937')};
  margin: 0;
`

const CollapseButton = styled.button<{ $isDark: boolean }>`
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: ${({ $isDark }) => ($isDark ? '#6b7280' : '#9ca3af')};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6')};
  }
`

const ProfileSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
  margin-bottom: 16px;
`

const ProfileAvatar = styled.img`
  width: 72px;
  height: 72px;
  border-radius: 50%;
  margin-bottom: 12px;
  border: 3px solid rgba(59, 130, 246, 0.2);
`

const ProfileName = styled.h2<{ $isDark: boolean }>`
  font-size: 16px;
  font-weight: 600;
  color: ${({ $isDark }) => ($isDark ? '#ffffff' : '#1f2937')};
  margin: 0 0 8px;
`

const ProfileBadge = styled.span`
  font-size: 12px;
  color: #3b82f6;
  padding: 4px 12px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 20px;
`

const SearchBox = styled.div<{ $isDark: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 10px;
  background: ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6')};
  margin-bottom: 20px;

  svg {
    color: ${({ $isDark }) => ($isDark ? '#6b7280' : '#9ca3af')};
  }

  input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 14px;
    color: ${({ $isDark }) => ($isDark ? '#ffffff' : '#1f2937')};
    outline: none;

    &::placeholder {
      color: ${({ $isDark }) => ($isDark ? '#6b7280' : '#9ca3af')};
    }
  }
`

const SectionHeader = styled.div<{ $isDark: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 0;
  font-size: 13px;
  font-weight: 500;
  color: ${({ $isDark }) => ($isDark ? '#9ca3af' : '#6b7280')};
  cursor: pointer;

  span {
    flex: 1;
  }
`

const PlusButton = styled.button<{ $isDark: boolean }>`
  width: 22px;
  height: 22px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: ${({ $isDark }) => ($isDark ? '#6b7280' : '#9ca3af')};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.05)' : '#e5e7eb')};
    color: #3b82f6;
  }
`

const ExpertCount = styled.span`
  font-size: 11px;
  padding: 2px 6px;
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border-radius: 10px;
`

const RoomList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 16px;
`

const RoomItem = styled.div<{ $isDark: boolean; $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
  background: ${({ $selected, $isDark }) =>
    $selected ? ($isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)') : 'transparent'};
  border: 1px solid ${({ $selected }) => ($selected ? 'rgba(59, 130, 246, 0.3)' : 'transparent')};

  &:hover {
    background: ${({ $isDark, $selected }) =>
      $selected
        ? $isDark
          ? 'rgba(59, 130, 246, 0.15)'
          : 'rgba(59, 130, 246, 0.08)'
        : $isDark
          ? 'rgba(255,255,255,0.03)'
          : '#f9fafb'};
  }
`

const RoomIcon = styled.div<{ $color: string }>`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: ${({ $color }) => `${$color}15`};
  color: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
`

const RoomInfo = styled.div`
  flex: 1;
  min-width: 0;
`

const RoomName = styled.div<{ $isDark: boolean }>`
  font-size: 14px;
  font-weight: 500;
  color: ${({ $isDark }) => ($isDark ? '#ffffff' : '#1f2937')};
  margin-bottom: 2px;
`

const RoomDesc = styled.div<{ $isDark: boolean; $selected: boolean }>`
  font-size: 12px;
  color: ${({ $selected }) => ($selected ? '#3b82f6' : '#9ca3af')};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const ExpertList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const ExpertItem = styled.div<{ $isDark: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb')};
  }
`

const ExpertIcon = styled.div<{ $color: string }>`
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: ${({ $color }) => `${$color}15`};
  color: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
`

const ExpertInfo = styled.div`
  flex: 1;
`

const ExpertName = styled.div<{ $isDark: boolean }>`
  font-size: 13px;
  font-weight: 500;
  color: ${({ $isDark }) => ($isDark ? '#ffffff' : '#1f2937')};
`

const ExpertHandle = styled.div`
  font-size: 12px;
  color: #3b82f6;
`

// ===== 中间主内容区 =====
const MainContent = styled.div<{ $isDark: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: ${({ $isDark }) => ($isDark ? '#1a1a2e' : '#ffffff')};
`

const ChatHeader = styled.div<{ $isDark: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.06)' : '#f0f0f0')};
`

const ChatTitle = styled.div`
  h2 {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 4px;
  }
`

const ChatSubtitle = styled.div<{ $isDark: boolean }>`
  font-size: 13px;
  color: ${({ $isDark }) => ($isDark ? '#9ca3af' : '#6b7280')};
`

const ChatActions = styled.div`
  display: flex;
  gap: 8px;
`

const ActionIcon = styled.button<{ $isDark: boolean; $color?: string }>`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: ${({ $color }) => ($color ? `${$color}10` : 'transparent')};
  color: ${({ $color, $isDark }) => $color || ($isDark ? '#9ca3af' : '#6b7280')};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ $color, $isDark }) => ($color ? `${$color}20` : $isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6')};
  }
`

const ChatMessages = styled.div`
  flex: 1;
  padding: 24px;
  overflow-y: auto;
`

const WelcomeMessage = styled.div<{ $isDark: boolean }>`
  display: flex;
  gap: 14px;
  max-width: 600px;
`

const WelcomeAvatar = styled.div<{ $color: string }>`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${({ $color }) => `${$color}15`};
  color: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`

const WelcomeContent = styled.div`
  flex: 1;
`

const WelcomeName = styled.div<{ $isDark: boolean }>`
  font-size: 14px;
  font-weight: 600;
  color: ${({ $isDark }) => ($isDark ? '#ffffff' : '#1f2937')};
  margin-bottom: 6px;
`

const WelcomeTime = styled.span<{ $isDark: boolean }>`
  font-weight: 400;
  font-size: 12px;
  color: ${({ $isDark }) => ($isDark ? '#6b7280' : '#9ca3af')};
  margin-left: 8px;
`

const WelcomeText = styled.div<{ $isDark: boolean }>`
  font-size: 14px;
  line-height: 1.6;
  color: ${({ $isDark }) => ($isDark ? '#d1d5db' : '#4b5563')};
  padding: 12px 16px;
  background: ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb')};
  border-radius: 12px;
`

const ChatInputArea = styled.div<{ $isDark: boolean }>`
  padding: 16px 24px;
  border-top: 1px solid ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.06)' : '#f0f0f0')};
`

const ChatInputBox = styled.div<{ $isDark: boolean }>`
  padding: 14px 16px;
  border-radius: 12px;
  background: ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb')};
  border: 1px solid ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb')};
  margin-bottom: 12px;

  input {
    width: 100%;
    border: none;
    background: transparent;
    font-size: 14px;
    color: ${({ $isDark }) => ($isDark ? '#ffffff' : '#1f2937')};
    outline: none;

    &::placeholder {
      color: ${({ $isDark }) => ($isDark ? '#6b7280' : '#9ca3af')};
    }
  }
`

const ChatToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const ToolbarLeft = styled.div`
  display: flex;
  gap: 4px;
`

const ToolbarIcon = styled.button<{ $isDark: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: ${({ $isDark }) => ($isDark ? '#9ca3af' : '#6b7280')};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6')};
    color: #3b82f6;
  }
`

const ToolbarRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const SelectExpertBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  border: none;
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(59, 130, 246, 0.15);
  }
`

const CharCount = styled.span<{ $isDark: boolean }>`
  font-size: 12px;
  color: ${({ $isDark }) => ($isDark ? '#6b7280' : '#9ca3af')};
`

const LangSwitch = styled.button<{ $isDark: boolean }>`
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb')};
  background: transparent;
  font-size: 12px;
  color: ${({ $isDark }) => ($isDark ? '#9ca3af' : '#6b7280')};
  cursor: pointer;
`

const SendButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: #3b82f6;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);

  &:hover {
    background: #2563eb;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    transform: translateY(-1px);
  }
`

// ===== 右侧边栏 =====
const RightSidebar = styled.div<{ $isDark: boolean }>`
  width: 280px;
  min-width: 280px;
  background: ${({ $isDark }) => ($isDark ? '#0f0f1a' : '#ffffff')};
  border-left: 1px solid ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.06)' : '#f0f0f0')};
  padding: 20px 16px;
  overflow-y: auto;
  position: relative;
`

const RightHeader = styled.div<{ $isDark: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: ${({ $isDark }) => ($isDark ? '#ffffff' : '#1f2937')};
  margin-bottom: 20px;
`

const TimeGroup = styled.div`
  margin-bottom: 20px;
`

const TimeLabel = styled.div<{ $isDark: boolean }>`
  font-size: 13px;
  font-weight: 500;
  color: ${({ $isDark }) => ($isDark ? '#9ca3af' : '#6b7280')};
  margin-bottom: 12px;
`

const ConversationItem = styled.div<{ $isDark: boolean }>`
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb')};
  }
`

const ConvTitle = styled.div<{ $isDark: boolean }>`
  font-size: 14px;
  font-weight: 500;
  color: ${({ $isDark }) => ($isDark ? '#ffffff' : '#1f2937')};
  margin-bottom: 4px;
`

const ConvTime = styled.span<{ $isDark: boolean }>`
  font-size: 12px;
  color: ${({ $isDark }) => ($isDark ? '#6b7280' : '#9ca3af')};
  float: right;
`

const ConvDesc = styled.div<{ $isDark: boolean }>`
  font-size: 12px;
  color: ${({ $isDark }) => ($isDark ? '#9ca3af' : '#6b7280')};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  clear: both;
`

const ThemeToggleFloat = styled.button<{ $isDark: boolean }>`
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.1)' : '#f3f4f6')};
  color: ${({ $isDark }) => ($isDark ? '#ffffff' : '#1f2937')};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);

  &:hover {
    background: ${({ $isDark }) => ($isDark ? 'rgba(255,255,255,0.15)' : '#e5e7eb')};
    transform: scale(1.05);
  }
`

export default MoYunDemo
