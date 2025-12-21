# Cherry Studio 主机频道功能完整文档

## 一、概述

主机频道（Hosts）是 Cherry Studio 的多角色协作对话系统，允许用户创建"房间"（主机），并在房间内添加多个"专家"（智能体），实现多角色协作对话。

### 核心概念

| 概念 | 说明 | UI 显示名称 |
|------|------|------------|
| **Host（主机）** | 智能体群容器，承载多个专家 | 房间 |
| **Expert（专家）** | 主机内的单个智能体 | 成员 |
| **Topic（话题）** | 对话会话 | Chat 对话 |
| **InfoLibrary（资料库）** | 保存对话内容的文件夹系统 | Information 资料 |

---

## 二、页面结构

### 文件位置

```
src/renderer/src/pages/hosts/
├── HostsPage.tsx              # 主页面入口
├── components/
│   ├── HostsChatArea.tsx      # 聊天区域（标题栏 + 消息 + 输入框）
│   ├── HostsLeftSidebar.tsx   # 左侧边栏
│   ├── HostsInputbar.tsx      # 输入框（继承自 home/Inputbar）
│   ├── HostEditModal.tsx      # 主机编辑弹窗
│   ├── ExpertEditModal.tsx    # 专家编辑弹窗
│   ├── ExpertSettingsPopup.tsx# 专家详细设置弹窗
│   ├── ImportExpertModal.tsx  # 从助手导入专家弹窗
│   ├── InfoFolderContentPanel.tsx # 资料库内容面板
│   └── InformationSection.tsx # 资料库区域组件
├── context/
│   └── ExpertContext.tsx      # 专家状态管理 Context
└── hooks/
    ├── useHosts.ts            # 主机和专家管理 Hook
    ├── useInfoLibrary.ts      # 资料库管理 Hook
    └── useMentionExpertsPanel.ts # @专家面板 Hook
```

### 页面布局

```
┌─────────────────────────────────────────────────────────────┐
│                        Navbar                                │
├──────────────┬──────────────────────────────────────────────┤
│              │            ChatHeader                         │
│   Left       │  ┌─────┐ 标签显示区域（@专家/@模型）  ┌─────┐ │
│   Sidebar    │  │emoji│                               │设置│ │
│   (280px)    │  └─────┘                               └─────┘ │
│              ├──────────────────────────────────────────────┤
│  ┌─────────┐ │                                              │
│  │房间选择 │ │              Messages                        │
│  └─────────┘ │              (消息列表)                       │
│              │                                              │
│  [Chat/Config]│                                              │
│              │                                              │
│  ┌─────────┐ ├──────────────────────────────────────────────┤
│  │对话列表 │ │             HostsInputbar                     │
│  │成员列表 │ │  ┌──────────────────────────────────────┐    │
│  │资料库   │ │  │ @选择专家  输入框（支持@高亮）        │    │
│  │关于     │ │  └──────────────────────────────────────┘    │
│  └─────────┘ │  [ 工具栏 ]               [翻译] [发送]      │
├──────────────┴──────────────────────────────────────────────┤
│               Settings Button                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 三、主机（Host）管理

### 3.1 数据结构

```typescript
// src/renderer/src/types/index.ts:103-111
type Host = Assistant & {
  type: 'host'
  /** 世界分组名称 */
  worldName?: string
  /** 用户在此房间的个人信息 */
  userInfo?: RoomUserInfo
  /** 资料文件夹列表 */
  infoFolders?: InfoFolder[]
}
```

### 3.2 主机创建

**操作方式**：点击房间选择器下拉菜单 → "创建房间"

**字段说明**：
| 字段 | 说明 | 示例 |
|------|------|------|
| name | 房间名称 | "技术讨论" |
| emoji | 房间图标 | "🏠" |
| description | 房间描述（会作为 prompt） | "技术问题讨论空间" |
| welcomeMessage | 欢迎消息（自动发送） | "欢迎来到技术讨论室！" |

**核心代码**：`useHosts.ts:24-46`

### 3.3 主机操作

- **选择主机**：点击房间选择器下拉菜单中的房间
- **编辑主机**：点击底部 Settings 按钮或顶部设置图标
- **删除主机**：在编辑弹窗中操作

---

## 四、专家（Expert）系统

### 4.1 数据结构

```typescript
// src/renderer/src/types/index.ts:114
type Expert = Assistant & {
  type: 'expert'
  hostId: string  // 所属主机ID
}

// 专家提示词设置
type ExpertPromptSettings = {
  /** 是否启用提示词增强模式 */
  enableEnhancedMode?: boolean
  /** 主机提示词处理方式: 'ignore' 或 'append' */
  hostPromptMode?: 'ignore' | 'append'
}
```

### 4.2 专家字段

| 字段 | 说明 | 示例 |
|------|------|------|
| name | 专家名称 | "汪曾祺" |
| emoji | 专家头像 | "👤" |
| handle | @提及名称 | "@汪曾祺" |
| triggerKeywords | 触发关键词 | ["汪曾祺", "老汪"] |
| prompt | 专家提示词 | "你是汪曾祺..." |
| description | 专家描述 | "著名作家" |
| model | 专家使用的模型 | GPT-4 |
| promptSettings | 提示词设置 | { enableEnhancedMode: true } |

### 4.3 专家操作

**创建专家**：
1. 切换到 Configuration 标签
2. 在 Member 区域点击 + 按钮
3. 选择"添加成员"或"从助手导入"

**编辑专家**：点击成员右侧的更多菜单 → 编辑

**@提及专家**：
1. 点击成员列表中的 @ 图标
2. 在输入框输入 `@专家名称`
3. 点击输入框上方的"选择专家"按钮

### 4.4 提示词增强模式

当 `enableEnhancedMode=true` 时，专家提示词会被增强：

```typescript
// src/renderer/src/pages/hosts/components/HostsInputbar.tsx:20-63
function buildExpertPrompt(expert, hostPrompt, userInfo) {
  let finalPrompt = `[当前专家身份]
你现在是 ${expert.name}（${expert.description}）。

[核心指令 - 必须严格遵守]
${expert.prompt}

[重要提醒]
- 你必须始终保持 ${expert.name} 的身份和风格
- 即使对话历史中有其他风格的回复，你也必须按照上述核心指令行事`

  // 添加主机背景信息
  if (hostPromptMode === 'append' && hostPrompt) {
    finalPrompt += `\n\n[背景信息]\n${hostPrompt}`
  }

  // 添加用户个人信息
  if (userInfo) {
    finalPrompt += `\n\n[对话用户信息]
用户身份/角色: ${userInfo.role}
用户自我介绍: ${userInfo.introduction}
请根据用户身份信息调整你的回复方式。`
  }

  return finalPrompt
}
```

---

## 五、话题（Topic）和对话

### 5.1 话题管理

| 操作 | 方式 |
|------|------|
| 创建话题 | 点击 Chat 对话区域的 + 按钮 |
| 切换话题 | 点击话题列表中的项目 |
| 重命名话题 | 点击话题右侧的铅笔图标 |
| 删除话题 | 点击话题右侧的垃圾桶图标 |

### 5.2 欢迎消息

选择主机后，如果主机设置了 `welcomeMessage`，会自动创建一条助手消息：

```typescript
// HostsPage.tsx:68-83
const addWelcomeMessage = async (topicId, hostId, welcomeMessage) => {
  const message = createAssistantMessage(hostId, topicId)
  message.status = AssistantMessageStatus.SUCCESS
  const textBlock = createMainTextBlock(message.id, welcomeMessage)
  // 保存到 Redux 和数据库
}
```

### 5.3 消息与专家关联

发送消息时，如果选中了专家，消息会携带专家信息：

```typescript
// HostsInputbar.tsx:247-263
const handleBeforeSend = (message, blocks) => {
  if (selectedExpert) {
    return {
      message: {
        ...message,
        expertId: selectedExpert.id,
        expertName: selectedExpert.name,
        expertEmoji: selectedExpert.emoji || '👤'
      },
      blocks
    }
  }
  return { message, blocks }
}
```

---

## 六、资料库（InfoLibrary）

### 6.1 数据结构

```typescript
// src/renderer/src/types/infoLibrary.ts
interface InfoFolder {
  id: string
  name: string
  hostId: string
  emoji?: string
  items: InfoItem[]
  createdAt: number
  updatedAt: number
}

interface InfoItem {
  id: string
  folderId: string
  content: string
  sourceMessageId?: string
  sourceTopicId?: string
  createdAt: number
  updatedAt: number
}
```

### 6.2 资料库操作

| 操作 | 方式 |
|------|------|
| 创建文件夹 | Configuration → Information 区域 → + 按钮 |
| 查看内容 | 点击文件夹名称，右侧显示内容面板 |
| 保存内容 | 选中消息文字 → 右键菜单 → "保存到资料库" |
| 删除文件夹 | 点击文件夹右侧的垃圾桶图标 |

### 6.3 保存到资料库弹窗

```typescript
// SaveToLibraryPopup
await SaveToLibraryPopup.show({
  hostId: activeHost.id,
  content: selectedText,
  sourceTopicId: topic.id
})
```

---

## 七、用户信息（UserInfo）

### 7.1 数据结构

```typescript
// src/renderer/src/types/index.ts:93-100
type RoomUserInfo = {
  /** 用户自我介绍 */
  introduction?: string
  /** 用户角色/身份 */
  role?: string
  /** 其他备注信息 */
  notes?: string
}
```

### 7.2 编辑用户信息

**位置**：Configuration → About 关于 → 个人简历

**操作**：
1. 点击"点击添加您的个人信息"或铅笔图标
2. 填写角色/身份和自我介绍
3. 点击保存

### 7.3 集成到提示词

用户信息会自动添加到专家/主机的提示词中：

```typescript
// 添加到提示词末尾
[对话用户信息]
用户身份/角色: 产品经理
用户自我介绍: 负责AI产品设计
请根据用户身份信息调整你的回复方式，更好地为用户服务。
```

---

## 八、输入框和 @提及

### 8.1 组件层次

```
HostsInputbar
└── Inputbar
    └── InputbarToolsProvider
        └── InputbarCore
            └── HighlightTextarea  // @文字高亮
```

### 8.2 @专家功能

**触发方式**：
1. 输入 `@` 字符触发专家面板
2. 点击"选择专家"按钮
3. 点击侧边栏成员列表的 @ 图标

**核心实现**：

```typescript
// useMentionExpertsPanel.ts
export const MENTION_EXPERTS_SYMBOL = '@' as QuickPanelSymbol

// 注册触发器
toolsRegistry.registerTrigger('mention-experts', MENTION_EXPERTS_SYMBOL, handler)
```

### 8.3 @模型功能

与 @专家类似，用户可以 @模型，消息会使用指定模型回复。

### 8.4 标签显示

选中的专家/模型以标签形式显示在 ChatHeader 中间区域：

```typescript
// HostsChatArea.tsx:91-116
{(selectedExpert || mentionedModels.length > 0) && (
  <ChatHeaderTags>
    {selectedExpert && (
      <CustomTag icon={<AtSign size={12} />} closable onClose={handleClearExpert}>
        {selectedExpert.emoji} {selectedExpert.name}
      </CustomTag>
    )}
    {mentionedModels.map(model => (
      <CustomTag key={model.id} closable onClose={() => handleRemoveModel(model)}>
        {model.name}
      </CustomTag>
    ))}
  </ChatHeaderTags>
)}
```

### 8.5 @文字高亮

输入框中的 `@xxx` 文字会以主题色高亮显示：

```typescript
// HighlightTextarea.tsx
const DEFAULT_HIGHLIGHT_PATTERNS = [
  {
    pattern: /@[^\s@]+/g,  // 匹配 @xxx
    color: 'var(--color-primary)'
  }
]
```

**实现原理**：使用覆盖层方案
- 底层：带颜色的高亮文本 div
- 上层：透明背景的 textarea（处理输入）

---

## 九、侧边栏 UI

### 9.1 区域划分

| 区域 | 标签 | 内容 |
|------|------|------|
| 房间选择器 | - | 下拉选择/创建房间 |
| Tab 切换 | Chat / Configuration | 切换显示内容 |
| Chat 对话 | Chat | 话题列表 |
| Member 角色 | Configuration | 专家/成员列表 |
| Information 资料 | Configuration | 资料库文件夹 |
| About 关于 | Configuration | 房间描述、统计、个人简历 |

### 9.2 About 区域统计

显示内容：
- **总成员**：专家数量
- **对话信息**：当前话题消息数量

```typescript
// HostsLeftSidebar.tsx:141-142
const messages = useAppSelector((state) =>
  activeTopic ? selectMessagesForTopic(state, activeTopic.id) : []
)
const messageCount = messages.length
```

---

## 十、状态管理

### 10.1 Redux Store

```typescript
// store/assistants.ts
// 主机和专家都存储在 assistants slice 中
// 通过 type 字段区分: 'host' | 'expert'

selectHosts         // 选择所有主机
selectExpertsByHostId(hostId)  // 选择主机下的所有专家
```

### 10.2 ExpertContext

管理专家提及状态：

```typescript
// context/ExpertContext.tsx
interface ExpertContextValue {
  mentionedExperts: Expert[]      // 当前选中的专家列表
  mentionedExpert: Expert | null  // 从侧边栏点击的专家
  recentExpertIds: string[]       // 最近使用的专家ID（存储在localStorage）
  recordExpertUsage(expertId)     // 记录专家使用
}
```

### 10.3 状态提升

`selectedExpert` 和 `mentionedModels` 状态提升到 `HostsChatArea`：

```
HostsChatArea (状态所有者)
├── ChatHeader (显示标签)
└── HostsInputbar (选择操作)
    └── Inputbar
        └── InputbarToolsProvider (外部状态同步)
```

---

## 十一、数据流图

### 发送消息流程

```
用户输入 @专家名称 + 消息内容
         ↓
HighlightTextarea (高亮显示)
         ↓
ExpertMentionHandler (检测@handle)
         ↓
setSelectedExpert(expert)
         ↓
ChatHeader 显示标签
         ↓
用户点击发送
         ↓
handleBeforeSend (附加专家信息)
         ↓
getEffectiveAssistant (构建增强提示词)
         ↓
发送到 AI 服务
         ↓
消息显示（带专家emoji和名称）
```

### 专家选择流程

```
方式1: 输入 @         方式2: 点击按钮      方式3: 点击侧边栏@
    ↓                     ↓                    ↓
QuickPanel 打开      triggers.emit()      setMentionedExpert
    ↓                     ↓                    ↓
    ←─────────────────────────────────────────┘
                      ↓
               专家选择面板
                      ↓
               选择专家
                      ↓
            setSelectedExpert
                      ↓
            recordExpertUsage
                      ↓
            插入 @handle 到输入框
```

---

## 十二、快速参考

### 主要类型

| 类型 | 文件位置 |
|------|----------|
| Host | `types/index.ts:103-111` |
| Expert | `types/index.ts:114` |
| RoomUserInfo | `types/index.ts:93-100` |
| InfoFolder | `types/infoLibrary.ts:7-15` |
| InfoItem | `types/infoLibrary.ts:18-26` |
| ExpertPromptSettings | `types/index.ts:74-79` |

### 主要 Hooks

| Hook | 作用 |
|------|------|
| `useHosts()` | 主机 CRUD |
| `useExperts(hostId)` | 专家 CRUD |
| `useInfoLibrary(hostId)` | 资料库管理 |
| `useExpertContext()` | 专家状态访问 |
| `useMentionExpertsPanel()` | @专家面板注册 |

### 主要组件

| 组件 | 作用 |
|------|------|
| `HostsPage` | 页面入口，提供 ExpertProvider |
| `HostsLeftSidebar` | 左侧边栏 UI |
| `HostsChatArea` | 聊天区域，状态提升 |
| `HostsInputbar` | 输入框，专家选择逻辑 |
| `HighlightTextarea` | @高亮输入框 |
| `ExpertMentionHandler` | @专家处理器 |

---

## 十三、最近更新 (2025-12-21)

### 新增功能

1. **@专家/@模型 标签移动到页面顶部**
   - 状态从 `HostsInputbar` 提升到 `HostsChatArea`
   - 标签显示在 `ChatHeader` 中间区域

2. **@ 文字高亮显示**
   - 创建 `HighlightTextarea` 组件
   - 使用覆盖层方案实现高亮

3. **About 区域改进**
   - 统计显示改为消息数量
   - 恢复个人简历编辑按钮
   - 个人简历集成到提示词
