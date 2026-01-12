# 卡带商店改造计划

## 目标
将 HomePage 的"角色频道"改造成"卡带商店"，简化页面结构。

## 当前结构分析
- **页面文件**: `src/renderer/src/pages/home/HomePage.tsx`
- **标签组件**: `src/renderer/src/pages/home/Tabs/index.tsx`
- **角色列表**: `src/renderer/src/pages/home/Tabs/AssistantsTab.tsx`
- **聊天组件**: `src/renderer/src/pages/home/Chat.tsx`

当前 HomeTabs 有三个标签:
1. `assistants` - 角色 (t('assistants.abbr'))
2. `topic` - 话题 (t('common.topics'))
3. `settings` - 设置 (t('settings.title'))

## 用户需求
1. 隐藏聊天窗口
2. 隐藏话题标签
3. 隐藏设置标签
4. 只保留角色列表，重命名为"卡带商店"

## 实施方案

### 方案一：修改现有 HomePage 结构 (推荐)
修改 `HomePage.tsx` 和 `Tabs/index.tsx`，隐藏不需要的组件。

**优点**: 改动较小，保持现有代码结构
**缺点**: 需要条件渲染逻辑

### 方案二：创建新的 CartridgeStorePage
创建一个独立的卡带商店页面，替换 HomePage。

**优点**: 代码清晰，不影响原有功能
**缺点**: 需要新增路由和页面

## 推荐方案一的具体步骤

### Step 1: 修改 HomePage.tsx
隐藏 Chat 组件，只显示 HomeTabs

```tsx
// 移除或条件隐藏 Chat 组件
<ContentContainer id={isLeftNavbar ? 'content-container' : undefined}>
  <HomeTabs ... style={{ width: '100%' }} /> {/* 全宽显示 */}
  {/* Chat 组件隐藏 */}
</ContentContainer>
```

### Step 2: 修改 Tabs/index.tsx
移除话题和设置标签，只保留角色标签并重命名

```tsx
// 移除 CustomTabs 组件（因为只有一个标签不需要切换）
// 或者重命名标签为"卡带商店"
<TabItem active={tab === 'assistants'} onClick={() => setTab('assistants')}>
  卡带商店
</TabItem>
// 移除 topic 和 settings 的 TabItem
```

### Step 3: 修改 AssistantsTab.tsx
调整样式使其在全宽页面中显示更好

### Step 4: 更新 i18n
添加"卡带商店"的翻译键

### Step 5: 调整 CSS
- 移除 `--assistants-width` 限制
- 使列表适应全宽显示

## 需要修改的文件清单

| 文件 | 修改内容 |
|------|----------|
| `src/renderer/src/pages/home/HomePage.tsx` | 隐藏 Chat 组件 |
| `src/renderer/src/pages/home/Tabs/index.tsx` | 移除 topics/settings 标签 |
| `src/renderer/src/pages/home/Tabs/AssistantsTab.tsx` | 调整布局样式 |
| `src/renderer/src/i18n/locales/zh-cn.json` | 添加"卡带商店"翻译 |
| `src/renderer/src/i18n/locales/en-us.json` | 添加 "Cartridge Store" 翻译 |

## 注意事项
1. 需要保留原有的助手/角色数据和操作功能
2. 添加/编辑/删除卡带功能保持不变
3. 确保热更新后页面正常工作

## 执行顺序
1. 先修改 HomePage.tsx 隐藏 Chat
2. 修改 Tabs/index.tsx 移除多余标签
3. 调整 AssistantsTab 布局
4. 更新 i18n 翻译
5. 测试验证
