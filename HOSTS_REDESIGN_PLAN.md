# Hosts 页面重构计划

## 一、现有架构分析

### 1.1 当前组件结构
```
HostsPage.tsx (主容器)
├── HostList.tsx (左侧主机列表)
├── HostSettingsPopup.tsx (主机设置弹窗)
├── ExpertList.tsx (右侧专家列表)
├── ExpertSettingsModal.tsx (专家设置弹窗)
├── HostsInputbar.tsx (输入栏，含专家选择器)
├── HostsTopics.tsx (话题列表)
├── ChatMessages.tsx (消息展示)
└── ExpertContext.tsx (专家上下文)
```

### 1.2 当前数据模型
```typescript
// Host = 主机
type Host = Assistant & { type: 'host' }

// Expert = 专家（属于某个主机）
type Expert = Assistant & { type: 'expert'; hostId: string }
```

### 1.3 当前布局
```
┌─────────────────────────────────────────────────────────┐
│ 导航栏                                                   │
├──────────┬──────────────────────────────┬───────────────┤
│ HostList │      ChatMessages            │  ExpertList   │
│ (主机列表)│      (聊天消息区域)           │  (专家列表)   │
│          │                              │               │
│          ├──────────────────────────────┤               │
│          │      HostsInputbar           │               │
│          │      (输入栏+专家选择器)       │               │
└──────────┴──────────────────────────────┴───────────────┘
```

---

## 二、新设计方案

### 2.1 术语映射
| 旧术语 | 新术语 | 说明 |
|--------|--------|------|
| Host | Room (房间) | 一个对话空间 |
| Expert | Member (成员) | 房间内的AI成员 |
| - | World (世界) | 新概念：房间的分组/容器 |
| - | Project (项目) | UI分组概念 |

### 2.2 新布局设计
```
┌─────────────────────────────────────────────────────────┐
│ 顶部栏: [World下拉选择器] [Room下拉选择器]                 │
├──────────────────────────────────────────┬──────────────┤
│              [Chat] [Configuration]      │              │
│              ─────────────────────       │   Project    │
│                                          │   > Member 1 │
│              ChatMessages                │   > Member 2 │
│              (聊天消息区域)               │   > Member 3 │
│                                          ├──────────────┤
│                                          │ Information  │
│                                          │ (信息区域)    │
├──────────────────────────────────────────┤              │
│              HostsInputbar               │              │
│              (输入栏)                     ├──────────────┤
│                                          │    About     │
│                                          │  (关于区域)   │
└──────────────────────────────────────────┴──────────────┘
```

### 2.3 新组件结构
```
HostsPage.tsx (主容器)
├── HostsHeader.tsx (新：顶部栏)
│   ├── WorldSelector.tsx (新：世界下拉选择器)
│   └── RoomSelector.tsx (新：房间下拉选择器)
├── HostsContent.tsx (新：内容区容器)
│   ├── HostsTabs.tsx (新：Chat/Configuration 标签切换)
│   ├── ChatPanel.tsx (聊天面板 - 原有功能重组)
│   │   ├── ChatMessages.tsx (消息展示)
│   │   └── HostsInputbar.tsx (输入栏)
│   └── ConfigurationPanel.tsx (新：配置面板)
├── HostsSidebar.tsx (新：右侧边栏)
│   ├── ProjectSection.tsx (新：项目区域)
│   │   └── MemberList.tsx (成员列表 - 原ExpertList改造)
│   ├── InformationSection.tsx (新：信息区域)
│   └── AboutSection.tsx (新：关于区域)
└── context/
    └── ExpertContext.tsx (保留，可能重命名)
```

---

## 三、数据模型变更

### 3.1 新增 World 类型
```typescript
// 方案A：World 作为独立类型
interface World {
  id: string
  name: string
  emoji?: string
  description?: string
  hostIds: string[]  // 关联的房间ID列表
  createdAt: string
  updatedAt?: string
}

// 方案B：World 作为 Host 的分组标签（更简单）
type Host = Assistant & {
  type: 'host'
  worldId?: string  // 可选：所属世界ID
  worldName?: string  // 或直接用名称分组
}
```

### 3.2 术语重命名（可选）
```typescript
// 类型别名（保持内部兼容）
type Room = Host
type Member = Expert

// 或完全重命名（需要更多重构）
```

### 3.3 推荐方案
**建议采用方案B**（简单扩展），原因：
1. 保持现有数据结构兼容性
2. 减少数据库迁移风险
3. UI层面进行术语映射即可

---

## 四、国际化变更

### 4.1 新增翻译键
```json
{
  "hosts": {
    "world": {
      "title": "世界",
      "select": "选择世界",
      "all": "所有世界",
      "create": "创建世界",
      "edit": "编辑世界",
      "delete": "删除世界"
    },
    "room": {
      "title": "房间",
      "select": "选择房间",
      "create": "创建房间"
    },
    "member": {
      "title": "成员",
      "add": "添加成员"
    },
    "project": {
      "title": "项目"
    },
    "information": {
      "title": "信息"
    },
    "about": {
      "title": "关于"
    },
    "tabs": {
      "chat": "聊天",
      "configuration": "配置"
    }
  }
}
```

---

## 五、实施阶段

### 阶段1：基础结构重构 (预计2-3天)
1. 创建新的组件目录结构
2. 实现 HostsHeader 组件
   - WorldSelector 下拉选择器
   - RoomSelector 下拉选择器
3. 实现 HostsTabs 标签切换组件
4. 重构 HostsPage 布局

### 阶段2：侧边栏重构 (预计1-2天)
1. 创建 HostsSidebar 容器组件
2. 实现 ProjectSection（包含MemberList）
3. 实现 InformationSection
4. 实现 AboutSection
5. 将原 ExpertList 迁移为 MemberList

### 阶段3：功能面板实现 (预计1-2天)
1. 实现 ChatPanel（整合现有聊天功能）
2. 实现 ConfigurationPanel（配置页面）
3. 标签切换逻辑

### 阶段4：数据层扩展（可选）(预计1天)
1. 如需 World 功能，扩展数据模型
2. 更新 Redux store
3. 数据迁移脚本

### 阶段5：样式和优化 (预计1天)
1. 统一样式
2. 响应式适配
3. 动画效果
4. 性能优化

---

## 六、风险评估

### 6.1 低风险
- UI组件重构（纯前端变更）
- 样式调整
- 国际化文本

### 6.2 中风险
- 状态管理变更
- 组件间通信重构
- Context 重构

### 6.3 高风险
- 数据模型变更（需要数据迁移）
- 现有功能破坏（需充分测试）

---

## 七、待确认问题

### 问题1：World 功能范围
- [ ] World 是否需要持久化存储？
- [ ] World 是否支持 CRUD 操作？
- [ ] 还是仅作为 UI 分组展示？

### 问题2：Configuration 面板内容
- [ ] 包含哪些配置项？
- [ ] 是否复用现有的 HostSettingsPopup？
- [ ] 还是全新的配置界面？

### 问题3：Information 区域内容
- [ ] 显示什么信息？
- [ ] 当前房间的描述？
- [ ] 当前成员的信息？
- [ ] 统计数据？

### 问题4：About 区域内容
- [ ] 显示什么内容？
- [ ] 房间的详细介绍？
- [ ] 使用说明？

### 问题5：术语变更策略
- [ ] 仅在 UI 层面显示新术语？
- [ ] 还是代码内部也要重命名？
- [ ] 建议：UI 显示新术语，代码保持原命名

---

## 八、验收标准

1. [ ] 新布局与设计稿一致
2. [ ] 所有现有功能正常工作
3. [ ] 新功能（World、Tabs）可用
4. [ ] 国际化完整
5. [ ] 响应式适配良好
6. [ ] 无 TypeScript 错误
7. [ ] 通过 lint 和 test

---

## 九、下一步

请确认以下内容：
1. 上述计划是否符合预期？
2. 第七节的待确认问题
3. 是否有其他需求或修改？

确认后即可开始开发。
