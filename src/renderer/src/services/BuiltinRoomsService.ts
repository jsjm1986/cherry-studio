/**
 * 内置房间初始化服务
 */
import { db } from '@renderer/databases'
import store from '@renderer/store'
import { addAssistant, addHost, updateAssistant } from '@renderer/store/assistants'
import type { Expert, Host } from '@renderer/types'
import { v4 as uuid } from 'uuid'

import { BUILTIN_ROOMS } from '../config/builtinRooms'
import { DEFAULT_ASSISTANT_SETTINGS, getDefaultTopic } from './AssistantService'

const BUILTIN_ROOMS_INITIALIZED_KEY = 'roome:builtin-rooms-initialized'
// 版本号：当内置房间配置更新时，增加此版本号以触发重新初始化
const BUILTIN_ROOMS_VERSION = '10'
const BUILTIN_ROOMS_VERSION_KEY = 'roome:builtin-rooms-version'

/**
 * 检查内置房间是否已初始化（且版本匹配）
 */
export function isBuiltinRoomsInitialized(): boolean {
  const initialized = localStorage.getItem(BUILTIN_ROOMS_INITIALIZED_KEY) === 'true'
  const version = localStorage.getItem(BUILTIN_ROOMS_VERSION_KEY)
  // 如果版本不匹配，需要重新初始化
  return initialized && version === BUILTIN_ROOMS_VERSION
}

/**
 * 标记内置房间已初始化
 */
export function markBuiltinRoomsInitialized(): void {
  localStorage.setItem(BUILTIN_ROOMS_INITIALIZED_KEY, 'true')
  localStorage.setItem(BUILTIN_ROOMS_VERSION_KEY, BUILTIN_ROOMS_VERSION)
}

/**
 * 初始化内置房间和专家
 */
export async function initializeBuiltinRooms(): Promise<void> {
  const currentVersion = localStorage.getItem(BUILTIN_ROOMS_VERSION_KEY)
  const needsUpdate = currentVersion !== BUILTIN_ROOMS_VERSION

  console.log(
    `[BuiltinRooms] 当前版本: ${currentVersion}, 目标版本: ${BUILTIN_ROOMS_VERSION}, 需要更新: ${needsUpdate}`
  )

  if (isBuiltinRoomsInitialized() && !needsUpdate) {
    console.log('[BuiltinRooms] 已初始化且版本匹配，跳过')
    return
  }

  // 获取现有房间列表
  const existingHosts = store.getState().assistants.assistants.filter((a) => a.type === 'host') as Host[]
  const existingHostsMap = new Map(existingHosts.map((h) => [h.name, h]))

  for (const roomConfig of BUILTIN_ROOMS) {
    const existingHost = existingHostsMap.get(roomConfig.name)

    if (existingHost) {
      // 如果房间已存在且需要更新，则更新其配置
      if (needsUpdate) {
        console.log(`[BuiltinRooms] 更新房间: ${roomConfig.name}`)
        console.log(`[BuiltinRooms] 新欢迎语长度: ${roomConfig.welcomeMessage.length}`)

        const updatedHost: Partial<Host> & { id: string } = {
          id: existingHost.id,
          emoji: roomConfig.emoji,
          description: roomConfig.description,
          prompt: roomConfig.prompt,
          welcomeMessage: roomConfig.welcomeMessage
        }
        store.dispatch(updateAssistant(updatedHost))

        // 更新该房间的所有专家
        const existingExperts = store
          .getState()
          .assistants.assistants.filter(
            (a) => a.type === 'expert' && (a as Expert).hostId === existingHost.id
          ) as Expert[]

        console.log(`[BuiltinRooms] 找到 ${existingExperts.length} 个现有专家`)

        // 创建专家名称到配置的映射（通过 handle 匹配）
        const expertConfigMap = new Map(roomConfig.experts.map((e) => [e.handle, e]))

        // 更新现有专家
        for (const expert of existingExperts) {
          // 尝试通过 handle 找到对应的新配置
          const newConfig = expert.handle ? expertConfigMap.get(expert.handle) : null
          if (newConfig) {
            // 更新专家信息
            store.dispatch(
              updateAssistant({
                id: expert.id,
                name: newConfig.name,
                emoji: newConfig.emoji,
                description: newConfig.description,
                handle: newConfig.handle,
                triggerKeywords: newConfig.triggerKeywords,
                prompt: newConfig.prompt
              })
            )
            console.log(`[BuiltinRooms] 更新专家: ${expert.name} -> ${newConfig.name}`)
          }
        }

        // 如果新配置中有更多专家，创建它们
        const existingHandles = new Set(existingExperts.map((e) => e.handle))
        for (const expertConfig of roomConfig.experts) {
          if (!existingHandles.has(expertConfig.handle)) {
            const expertId = uuid()
            const expert: Expert = {
              id: expertId,
              hostId: existingHost.id,
              name: expertConfig.name,
              emoji: expertConfig.emoji,
              description: expertConfig.description,
              handle: expertConfig.handle,
              triggerKeywords: expertConfig.triggerKeywords,
              prompt: expertConfig.prompt,
              type: 'expert',
              topics: [],
              settings: DEFAULT_ASSISTANT_SETTINGS
            } as Expert
            store.dispatch(addAssistant(expert))
            console.log(`[BuiltinRooms] 创建新专家: ${expertConfig.name}`)
          }
        }

        console.log(`[BuiltinRooms] 专家更新完成`)

        // 清空该房间的所有 Topic，让欢迎消息在下次打开时重新创建
        // 这样可以确保新的欢迎消息被显示
        if (existingHost.topics && existingHost.topics.length > 0) {
          console.log(`[BuiltinRooms] 清空 ${existingHost.topics.length} 个 Topic 的消息`)
          for (const topic of existingHost.topics) {
            // 删除 Topic 中的所有消息
            await db.topics.update(topic.id, { messages: [] })
          }
        }
      }
      continue
    }

    // 创建新房间
    const hostId = uuid()
    const defaultTopic = getDefaultTopic(hostId)

    const host: Host = {
      id: hostId,
      name: roomConfig.name,
      emoji: roomConfig.emoji,
      description: roomConfig.description,
      prompt: roomConfig.prompt,
      welcomeMessage: roomConfig.welcomeMessage,
      projectFolderPath: '',
      type: 'host',
      topics: [defaultTopic],
      settings: DEFAULT_ASSISTANT_SETTINGS
    } as Host

    // 添加房间到数据库
    await db.topics.add({ id: defaultTopic.id, messages: [] })
    store.dispatch(addHost(host))

    // 创建专家
    for (const expertConfig of roomConfig.experts) {
      const expertId = uuid()

      const expert: Expert = {
        id: expertId,
        hostId,
        name: expertConfig.name,
        emoji: expertConfig.emoji,
        description: expertConfig.description,
        handle: expertConfig.handle,
        triggerKeywords: expertConfig.triggerKeywords,
        prompt: expertConfig.prompt,
        type: 'expert',
        topics: [],
        settings: DEFAULT_ASSISTANT_SETTINGS
      } as Expert

      store.dispatch(addAssistant(expert))
    }
  }

  markBuiltinRoomsInitialized()
}
