import type { SidebarIcon } from '@renderer/types'

/**
 * 默认显示的侧边栏图标（锁定配置，用户不可修改）
 * 只显示：助手、主机、文件、笔记
 */
export const DEFAULT_SIDEBAR_ICONS: SidebarIcon[] = ['assistants', 'hosts', 'files', 'notes']

/**
 * 必须显示的侧边栏图标（不能被隐藏）
 * 这些图标必须始终在侧边栏中可见
 * 抽取为参数方便未来扩展
 */
export const REQUIRED_SIDEBAR_ICONS: SidebarIcon[] = ['assistants']
