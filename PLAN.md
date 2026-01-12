# Hosts 功能全面优化计划

## 一、当前问题分析

根据截图和代码分析，当前 Hosts 页面存在以下问题：

1. **UI/UX 问题**
   - 侧边栏布局不够清晰，主机列表和专家列表区分不明显
   - 聊天区域头部信息展示不够优雅
   - 专家选择交互不够直观
   - 缺少视觉层次感

2. **功能缺失**
   - @专家后，消息回复没有显示是哪个专家在回复
   - 专家配置过于简单，缺少完整的助手配置（模型、知识库、MCP等）
   - 添加专家只能自定义，无法从助手库导入

3. **数据结构问题**
   - Expert 类型已继承 Assistant，但配置界面未充分利用

---

## 二、优化计划

### 阶段 1: 消息显示专家身份（核心功能）

#### 1.1 消息数据结构扩展
**文件**: `src/renderer/src/types/newMessage.ts`

- [ ] 在 Message 类型中添加 `expertId?: string` 字段
- [ ] 在 Message 类型中添加 `expertName?: string` 字段
- [ ] 在 Message 类型中添加 `expertEmoji?: string` 字段

#### 1.2 发送消息时记录专家信息
**文件**: `src/renderer/src/pages/hosts/components/HostsInputbar.tsx`

- [ ] 修改发送消息逻辑，将选中的专家信息附加到消息中
- [ ] 创建自定义的发送消息函数，包含专家上下文

**文件**: `src/renderer/src/store/thunk/messageThunk.ts`

- [ ] 扩展 sendMessage thunk，支持专家信息

#### 1.3 消息显示组件修改
**文件**: `src/renderer/src/pages/home/Messages/MessageHeader.tsx`

- [ ] 检测消息是否来自专家
- [ ] 显示专家头像和名称（替代默认的模型名称）
- [ ] 添加专家标识样式

**文件**: `src/renderer/src/pages/home/Messages/Message.tsx`

- [ ] 为专家消息添加特殊样式
- [ ] 显示专家 emoji 作为头像

---

### 阶段 2: 专家完整配置功能

#### 2.1 创建专家设置弹窗
**新建文件**: `src/renderer/src/pages/hosts/components/ExpertSettingsPopup.tsx`

- [ ] 复用 AssistantSettings 的结构
- [ ] 包含以下配置项：
  - 基本信息（名称、emoji、描述、handle、触发关键词）
  - 模型设置（复用 AssistantModelSettings）
  - 提示词设置（复用 AssistantPromptSettings）
  - 知识库设置（复用 AssistantKnowledgeBaseSettings）
  - MCP 设置（复用 AssistantMCPSettings）
  - 记忆设置（复用 AssistantMemorySettings）

#### 2.2 修改专家编辑入口
**文件**: `src/renderer/src/pages/hosts/components/ExpertList.tsx`

- [ ] 点击编辑时打开完整的 ExpertSettingsPopup
- [ ] 添加快速配置入口（右键菜单）

**文件**: `src/renderer/src/pages/hosts/HostsPage.tsx`

- [ ] 修改 handleEditExpert 使用新的设置弹窗

#### 2.3 专家数据持久化
**文件**: `src/renderer/src/pages/hosts/hooks/useHosts.ts`

- [ ] 确保专家的完整配置能够保存
- [ ] 更新 createExpert 支持完整的 Assistant 字段
- [ ] 更新 updateExpert 支持完整的 Assistant 字段

---

### 阶段 3: 从助手库导入专家

#### 3.1 创建导入选择弹窗
**新建文件**: `src/renderer/src/pages/hosts/components/ImportExpertModal.tsx`

- [ ] 显示助手库中的所有助手
- [ ] 支持搜索和筛选
- [ ] 支持多选导入
- [ ] 显示助手预览信息

#### 3.2 修改添加专家入口
**文件**: `src/renderer/src/pages/hosts/components/ExpertList.tsx`

- [ ] 添加按钮改为下拉菜单，包含两个选项：
  - "从助手库导入"
  - "自定义添加"

**文件**: `src/renderer/src/pages/hosts/HostsPage.tsx`

- [ ] 添加 handleImportExpert 函数
- [ ] 实现从助手库复制并转换为专家的逻辑

#### 3.3 助手转专家逻辑
**文件**: `src/renderer/src/pages/hosts/hooks/useHosts.ts`

- [ ] 添加 importExpertFromAssistant 函数
- [ ] 复制助手的所有配置
- [ ] 设置 type 为 'expert'
- [ ] 设置 hostId 为当前主机
- [ ] 生成新的 id
- [ ] 设置默认的 handle 和 triggerKeywords

---

### 阶段 4: UI/UX 全面优化

#### 4.1 侧边栏布局优化
**文件**: `src/renderer/src/pages/hosts/HostsPage.tsx`

- [ ] 重新设计侧边栏布局，增加视觉分隔
- [ ] 主机列表区域添加标题图标和更好的视觉层次
- [ ] 专家列表区域优化，显示更多信息（模型、状态等）
- [ ] 添加主机信息卡片，显示当前主机详情

#### 4.2 聊天区域头部优化
**文件**: `src/renderer/src/pages/hosts/components/HostsChatArea.tsx`

- [ ] 重新设计 ChatHeader，更优雅地展示主机信息
- [ ] 添加专家快速切换/选择按钮
- [ ] 显示当前对话的专家状态

#### 4.3 专家选择交互优化
**文件**: `src/renderer/src/pages/hosts/components/HostsInputbar.tsx`

- [ ] 优化专家选择按钮样式
- [ ] 添加专家头像预览
- [ ] 选中专家后显示更明显的标识

#### 4.4 整体视觉风格统一
- [ ] 统一颜色变量使用
- [ ] 优化间距和圆角
- [ ] 添加适当的动画过渡效果

---

### 阶段 5: i18n 国际化完善

#### 5.1 添加新的翻译键
**文件**: `src/renderer/src/i18n/locales/zh-cn.json`
**文件**: `src/renderer/src/i18n/locales/en-us.json`

- [ ] 添加专家设置相关翻译
- [ ] 添加导入功能相关翻译
- [ ] 添加消息显示相关翻译

---

## 三、文件修改清单

### 新建文件
1. `src/renderer/src/pages/hosts/components/ExpertSettingsPopup.tsx` - 专家完整设置弹窗
2. `src/renderer/src/pages/hosts/components/ImportExpertModal.tsx` - 从助手库导入弹窗

### 修改文件
1. `src/renderer/src/types/newMessage.ts` - 添加专家字段
2. `src/renderer/src/pages/hosts/HostsPage.tsx` - 页面布局和逻辑优化
3. `src/renderer/src/pages/hosts/components/HostsChatArea.tsx` - 聊天区域优化
4. `src/renderer/src/pages/hosts/components/HostsInputbar.tsx` - 输入框优化，发送专家消息
5. `src/renderer/src/pages/hosts/components/HostList.tsx` - 主机列表优化
6. `src/renderer/src/pages/hosts/components/ExpertList.tsx` - 专家列表优化，添加导入入口
7. `src/renderer/src/pages/hosts/components/ExpertEditModal.tsx` - 简化为基本信息编辑
8. `src/renderer/src/pages/hosts/hooks/useHosts.ts` - 添加导入功能
9. `src/renderer/src/pages/home/Messages/MessageHeader.tsx` - 显示专家信息
10. `src/renderer/src/pages/home/Messages/Message.tsx` - 专家消息样式
11. `src/renderer/src/store/thunk/messageThunk.ts` - 支持专家信息
12. `src/renderer/src/i18n/locales/zh-cn.json` - 中文翻译
13. `src/renderer/src/i18n/locales/en-us.json` - 英文翻译

---

## 四、技术要点

### 4.1 专家消息识别
```typescript
// 在消息中添加专家信息
interface Message {
  // ... 现有字段
  expertId?: string
  expertName?: string
  expertEmoji?: string
}
```

### 4.2 专家配置复用
```typescript
// Expert 已继承 Assistant，可直接使用 AssistantSettings 组件
// 只需要在 ExpertSettingsPopup 中过滤掉不需要的配置项
```

### 4.3 助手导入转换
```typescript
const importExpertFromAssistant = (assistant: Assistant, hostId: string): Expert => {
  return {
    ...assistant,
    id: uuid(),
    type: 'expert',
    hostId,
    handle: `@${assistant.name}`,
    triggerKeywords: [assistant.name],
    topics: [] // 专家不独立存储 topics
  }
}
```

---

## 五、风险评估

1. **消息数据迁移**: 现有消息没有专家信息，需要兼容处理
2. **性能考虑**: 专家配置增多后，需要注意数据加载性能
3. **UI 兼容性**: 确保在不同屏幕尺寸下的显示效果

---

## 六、验收标准

1. [ ] @专家发送消息后，回复消息显示专家头像和名称
2. [ ] 点击专家编辑，打开完整的配置弹窗（包含模型、知识库、MCP等）
3. [ ] 添加专家时可选择"从助手库导入"或"自定义添加"
4. [ ] UI 整体风格统一，交互流畅
5. [ ] 所有文本支持中英文切换

---

# 对话次数限制功能实现计划

## 需求概述
1. 用户注册时赠送 10 次对话机会
2. 每次发送消息，大模型成功响应后，次数 -1
3. 次数用完后不能继续对话
4. 次数需要与服务器同步
5. 服务端可以修改/增加用户次数
6. 前端需要显示剩余次数

## 技术分析

### 关键代码位置
- **后端用户数据**: `server/src/db.js` - JSON 文件存储
- **前端认证状态**: `src/renderer/src/store/auth.ts` + `AuthService.ts`
- **消息发送成功回调**: `src/renderer/src/services/messageStreaming/callbacks/baseCallbacks.ts:129` - `onComplete` 函数
- **消息完成事件**: `EventEmitter.emit(EVENT_NAMES.MESSAGE_COMPLETE, ...)` 在响应成功时触发

### 扣减时机
在 `baseCallbacks.ts` 的 `onComplete` 回调中，当 `status === 'success'` 时，说明大模型成功响应，此时扣减次数。

---

## 实现计划

### 第一阶段：后端改造

#### 1.1 修改用户数据结构
**文件**: `server/src/db.js`
- 用户创建时添加 `message_quota: 10` 字段（默认10次）

#### 1.2 添加次数相关 API
**文件**: `server/src/routes/auth.js`
- `POST /api/auth/consume` - 消耗一次对话次数（需认证）
  - 检查次数是否 > 0
  - 扣减次数
  - 返回剩余次数
- `GET /api/auth/quota` - 获取当前剩余次数（需认证）

#### 1.3 管理员接口
**文件**: `server/src/routes/admin.js`
- 用户列表返回 `message_quota` 字段
- 更新用户时支持修改 `message_quota`
- 管理后台界面显示和编辑次数

---

### 第二阶段：前端状态管理

#### 2.1 更新认证类型定义
**文件**: `src/renderer/src/store/auth.ts`
```typescript
export interface AuthUser {
  // ... 现有字段
  messageQuota?: number  // 新增：剩余对话次数
}
```

#### 2.2 添加次数相关 action
**文件**: `src/renderer/src/store/auth.ts`
- `setMessageQuota` - 设置次数
- `decrementQuota` - 次数 -1

#### 2.3 更新 AuthService
**文件**: `src/renderer/src/services/AuthService.ts`
- `consumeQuota()` - 调用后端消耗次数 API
- `getQuota()` - 获取剩余次数
- 登录/注册成功后返回 `message_quota`

---

### 第三阶段：消息发送拦截

#### 3.1 发送前检查次数
**文件**: `src/renderer/src/store/thunk/messageThunk.ts`
- 在 `sendMessage` 开头检查：
  - 用户是否登录
  - 剩余次数是否 > 0
  - 次数不足时显示提示并阻止发送

#### 3.2 成功响应后扣减次数
**文件**: `src/renderer/src/services/messageStreaming/callbacks/baseCallbacks.ts`
- 在 `onComplete` 中当 `status === 'success'` 时：
  - 调用 `authService.consumeQuota()` 扣减次数
  - 更新 Redux store 中的 `messageQuota`

---

### 第四阶段：前端显示

#### 4.1 侧边栏显示剩余次数
**文件**: `src/renderer/src/components/app/Sidebar.tsx`
- 在头像下方显示剩余次数徽标
- 样式：小圆形徽标，显示数字
- 未登录时不显示
- 次数为 0 时显示红色警告

#### 4.2 AuthPopup 显示次数
**文件**: `src/renderer/src/components/Popups/AuthPopup.tsx`
- 已登录状态下显示"剩余对话次数: X"
- 次数为 0 时显示"次数已用完"提示

#### 4.3 次数不足提示
- 当用户尝试发送消息但次数为 0 时
- 弹出提示框，引导用户联系管理员充值

---

### 第五阶段：管理后台

#### 5.1 更新管理后台界面
**文件**: `server/src/public/index.html`
- 用户列表显示剩余次数列
- 编辑用户时可修改次数
- 添加"充值"按钮快速增加次数

---

## 文件修改清单

### 后端 (server/)
1. `src/db.js` - 用户数据结构添加 message_quota
2. `src/routes/auth.js` - 添加 consume/quota API
3. `src/routes/admin.js` - 返回和更新 message_quota
4. `src/public/index.html` - 管理后台显示次数

### 前端 (src/renderer/)
1. `src/store/auth.ts` - 添加 messageQuota 字段和 actions
2. `src/services/AuthService.ts` - 添加 consumeQuota/getQuota 方法
3. `src/store/thunk/messageThunk.ts` - 发送前检查次数
4. `src/services/messageStreaming/callbacks/baseCallbacks.ts` - 成功后扣减
5. `src/components/app/Sidebar.tsx` - 显示剩余次数
6. `src/components/Popups/AuthPopup.tsx` - 显示剩余次数

---

## 数据流程图

```
用户发送消息
    ↓
检查登录状态和剩余次数
    ↓ (次数 > 0)
发送消息到大模型
    ↓
大模型返回响应
    ↓
onComplete(status='success')
    ↓
调用 POST /api/auth/consume
    ↓
服务端次数 -1，返回剩余次数
    ↓
更新前端 Redux store
    ↓
UI 自动更新显示新次数
```

---

## 注意事项

1. **离线使用**: 如果网络断开，次数扣减会失败，需要处理这种情况
2. **并发安全**: 服务端需要处理并发请求的次数扣减
3. **用户体验**: 次数不足时给出清晰的提示和引导
4. **数据同步**: 每次登录时重新获取最新次数，避免本地缓存不一致

