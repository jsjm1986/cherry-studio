// @ts-nocheck
import type { PayloadAction } from '@reduxjs/toolkit'
import { createSelector, createSlice } from '@reduxjs/toolkit'
import { DEFAULT_CONTEXTCOUNT, DEFAULT_TEMPERATURE } from '@renderer/config/constant'
import { TopicManager } from '@renderer/hooks/useTopic'
import { DEFAULT_ASSISTANT_SETTINGS, getDefaultAssistant, getDefaultTopic } from '@renderer/services/AssistantService'
import type {
  Assistant,
  AssistantPreset,
  AssistantSettings,
  Expert,
  Host,
  InfoFolder,
  InfoItem,
  Model,
  Topic
} from '@renderer/types'
import { isEmpty, uniqBy } from 'lodash'

import type { RootState } from '.'

export interface AssistantsState {
  defaultAssistant: Assistant
  assistants: Assistant[]
  tagsOrder: string[]
  collapsedTags: Record<string, boolean>
  presets: AssistantPreset[]
  unifiedListOrder: Array<{ type: 'agent' | 'assistant'; id: string }>
}

const initialState: AssistantsState = {
  defaultAssistant: getDefaultAssistant(),
  assistants: [getDefaultAssistant()],
  tagsOrder: [],
  collapsedTags: {},
  presets: [],
  unifiedListOrder: []
}

const assistantsSlice = createSlice({
  name: 'assistants',
  initialState,
  reducers: {
    updateDefaultAssistant: (state, action: PayloadAction<{ assistant: Assistant }>) => {
      // @ts-ignore ts2589
      state.defaultAssistant = action.payload.assistant
    },
    updateAssistants: (state, action: PayloadAction<Assistant[]>) => {
      state.assistants = action.payload
    },
    addAssistant: (state, action: PayloadAction<Assistant>) => {
      state.assistants.unshift(action.payload)
    },
    insertAssistant: (state, action: PayloadAction<{ index: number; assistant: Assistant }>) => {
      const { index, assistant } = action.payload

      if (index < 0 || index > state.assistants.length) {
        throw new Error(`InsertAssistant: index ${index} is out of bounds [0, ${state.assistants.length}]`)
      }

      state.assistants.splice(index, 0, assistant)
    },
    removeAssistant: (state, action: PayloadAction<{ id: string }>) => {
      state.assistants = state.assistants.filter((c) => c.id !== action.payload.id)
    },
    updateAssistant: (state, action: PayloadAction<Partial<Assistant> & { id: string }>) => {
      const { id, ...update } = action.payload
      // @ts-ignore ts2589
      state.assistants = state.assistants.map((c) => (c.id === id ? { ...c, ...update } : c))
    },
    updateAssistantSettings: (
      state,
      action: PayloadAction<{ assistantId: string; settings: Partial<AssistantSettings> }>
    ) => {
      for (const assistant of state.assistants) {
        const settings = action.payload.settings
        if (assistant.id === action.payload.assistantId) {
          for (const key in settings) {
            if (!assistant.settings) {
              assistant.settings = {
                temperature: DEFAULT_TEMPERATURE,
                contextCount: DEFAULT_CONTEXTCOUNT,
                enableMaxTokens: false,
                maxTokens: 0,
                streamOutput: true
              }
            }
            assistant.settings[key] = settings[key]
          }
        }
      }
    },
    setTagsOrder: (state, action: PayloadAction<string[]>) => {
      const newOrder = action.payload
      state.tagsOrder = newOrder
      const prevCollapsed = state.collapsedTags || {}
      const updatedCollapsed: Record<string, boolean> = { ...prevCollapsed }
      newOrder.forEach((tag) => {
        if (!(tag in updatedCollapsed)) {
          updatedCollapsed[tag] = false
        }
      })
      state.collapsedTags = updatedCollapsed
    },
    updateTagCollapse: (state, action: PayloadAction<string>) => {
      const tag = action.payload
      const prev = state.collapsedTags || {}
      state.collapsedTags = {
        ...prev,
        [tag]: !prev[tag]
      }
    },
    setUnifiedListOrder: (state, action: PayloadAction<Array<{ type: 'agent' | 'assistant'; id: string }>>) => {
      state.unifiedListOrder = action.payload
    },
    addTopic: (state, action: PayloadAction<{ assistantId: string; topic: Topic }>) => {
      const topic = action.payload.topic
      topic.createdAt = topic.createdAt || new Date().toISOString()
      topic.updatedAt = topic.updatedAt || new Date().toISOString()
      state.assistants = state.assistants.map((assistant) =>
        assistant.id === action.payload.assistantId
          ? {
              ...assistant,
              topics: uniqBy([topic, ...assistant.topics], 'id')
            }
          : assistant
      )
    },
    removeTopic: (state, action: PayloadAction<{ assistantId: string; topic: Topic }>) => {
      state.assistants = state.assistants.map((assistant) =>
        assistant.id === action.payload.assistantId
          ? {
              ...assistant,
              topics: assistant.topics.filter(({ id }) => id !== action.payload.topic.id)
            }
          : assistant
      )
    },
    updateTopic: (state, action: PayloadAction<{ assistantId: string; topic: Topic }>) => {
      const newTopic = action.payload.topic
      newTopic.updatedAt = new Date().toISOString()
      state.assistants = state.assistants.map((assistant) =>
        assistant.id === action.payload.assistantId
          ? {
              ...assistant,
              topics: assistant.topics.map((topic) => {
                const _topic = topic.id === newTopic.id ? newTopic : topic
                _topic.messages = []
                return _topic
              })
            }
          : assistant
      )
    },
    updateTopics: (state, action: PayloadAction<{ assistantId: string; topics: Topic[] }>) => {
      state.assistants = state.assistants.map((assistant) =>
        assistant.id === action.payload.assistantId
          ? {
              ...assistant,
              topics: action.payload.topics.map((topic) =>
                isEmpty(topic.messages) ? topic : { ...topic, messages: [] }
              )
            }
          : assistant
      )
    },
    removeAllTopics: (state, action: PayloadAction<{ assistantId: string }>) => {
      state.assistants = state.assistants.map((assistant) => {
        if (assistant.id === action.payload.assistantId) {
          assistant.topics.forEach((topic) => TopicManager.removeTopic(topic.id))
          return {
            ...assistant,
            topics: [getDefaultTopic(assistant.id)]
          }
        }
        return assistant
      })
    },
    updateTopicUpdatedAt: (state, action: PayloadAction<{ topicId: string }>) => {
      outer: for (const assistant of state.assistants) {
        for (const topic of assistant.topics) {
          if (topic.id === action.payload.topicId) {
            topic.updatedAt = new Date().toISOString()
            break outer
          }
        }
      }
    },
    setModel: (state, action: PayloadAction<{ assistantId: string; model: Model }>) => {
      state.assistants = state.assistants.map((assistant) =>
        assistant.id === action.payload.assistantId
          ? {
              ...assistant,
              model: action.payload.model
            }
          : assistant
      )
    },
    // Assistant Presets
    setAssistantPresets: (state, action: PayloadAction<AssistantPreset[]>) => {
      const presets = action.payload
      state.presets = []
      presets.forEach((p) => {
        state.presets.push(p)
      })
    },
    addAssistantPreset: (state, action: PayloadAction<AssistantPreset>) => {
      state.presets.push(action.payload)
    },
    removeAssistantPreset: (state, action: PayloadAction<{ id: string }>) => {
      state.presets = state.presets.filter((c) => c.id !== action.payload.id)
    },
    updateAssistantPreset: (state, action: PayloadAction<AssistantPreset>) => {
      const preset = action.payload
      const index = state.presets.findIndex((a) => a.id === preset.id)
      if (index !== -1) {
        state.presets[index] = preset
      }
    },
    updateAssistantPresetSettings: (
      state,
      action: PayloadAction<{ assistantId: string; settings: Partial<AssistantSettings> }>
    ) => {
      for (const agent of state.presets) {
        const settings = action.payload.settings
        if (agent.id === action.payload.assistantId) {
          for (const key in settings) {
            if (!agent.settings) {
              agent.settings = { ...DEFAULT_ASSISTANT_SETTINGS }
            }
            agent.settings[key] = settings[key]
          }
        }
      }
    },
    // === 主机与专家功能 ===
    /** 添加主机 */
    addHost: (state, action: PayloadAction<Host>) => {
      state.assistants.unshift(action.payload)
    },
    /** 删除主机及其所有专家 */
    removeHost: (state, action: PayloadAction<{ id: string }>) => {
      const hostId = action.payload.id
      // 删除主机下的所有专家
      state.assistants = state.assistants.filter((a) => !(a.type === 'expert' && a.hostId === hostId))
      // 删除主机本身
      state.assistants = state.assistants.filter((a) => a.id !== hostId)
    },
    /** 添加专家到主机 */
    addExpert: (state, action: PayloadAction<Expert>) => {
      state.assistants.push(action.payload)
    },
    /** 删除专家 */
    removeExpert: (state, action: PayloadAction<{ id: string }>) => {
      state.assistants = state.assistants.filter((a) => a.id !== action.payload.id)
    },
    // === 资料库功能 ===
    /** 添加资料文件夹 */
    addInfoFolder: (state, action: PayloadAction<{ hostId: string; folder: InfoFolder }>) => {
      const host = state.assistants.find((a) => a.id === action.payload.hostId && a.type === 'host') as Host | undefined
      if (host) {
        if (!host.infoFolders) host.infoFolders = []
        host.infoFolders.push(action.payload.folder)
      }
    },
    /** 删除资料文件夹 */
    removeInfoFolder: (state, action: PayloadAction<{ hostId: string; folderId: string }>) => {
      const host = state.assistants.find((a) => a.id === action.payload.hostId && a.type === 'host') as Host | undefined
      if (host && host.infoFolders) {
        host.infoFolders = host.infoFolders.filter((f) => f.id !== action.payload.folderId)
      }
    },
    /** 更新资料文件夹 */
    updateInfoFolder: (state, action: PayloadAction<{ hostId: string; folder: InfoFolder }>) => {
      const host = state.assistants.find((a) => a.id === action.payload.hostId && a.type === 'host') as Host | undefined
      if (host && host.infoFolders) {
        const index = host.infoFolders.findIndex((f) => f.id === action.payload.folder.id)
        if (index !== -1) {
          host.infoFolders[index] = action.payload.folder
        }
      }
    },
    /** 添加资料项到文件夹 */
    addInfoItem: (state, action: PayloadAction<{ hostId: string; folderId: string; item: InfoItem }>) => {
      const host = state.assistants.find((a) => a.id === action.payload.hostId && a.type === 'host') as Host | undefined
      if (host && host.infoFolders) {
        const folder = host.infoFolders.find((f) => f.id === action.payload.folderId)
        if (folder) {
          folder.items.push(action.payload.item)
          folder.updatedAt = Date.now()
        }
      }
    },
    /** 删除资料项 */
    removeInfoItem: (state, action: PayloadAction<{ hostId: string; folderId: string; itemId: string }>) => {
      const host = state.assistants.find((a) => a.id === action.payload.hostId && a.type === 'host') as Host | undefined
      if (host && host.infoFolders) {
        const folder = host.infoFolders.find((f) => f.id === action.payload.folderId)
        if (folder) {
          folder.items = folder.items.filter((i) => i.id !== action.payload.itemId)
          folder.updatedAt = Date.now()
        }
      }
    },
    /** 更新资料项 */
    updateInfoItem: (state, action: PayloadAction<{ hostId: string; folderId: string; item: InfoItem }>) => {
      const host = state.assistants.find((a) => a.id === action.payload.hostId && a.type === 'host') as Host | undefined
      if (host && host.infoFolders) {
        const folder = host.infoFolders.find((f) => f.id === action.payload.folderId)
        if (folder) {
          const index = folder.items.findIndex((i) => i.id === action.payload.item.id)
          if (index !== -1) {
            folder.items[index] = action.payload.item
            folder.updatedAt = Date.now()
          }
        }
      }
    }
  }
})

export const {
  updateDefaultAssistant,
  updateAssistants,
  addAssistant,
  insertAssistant,
  removeAssistant,
  updateAssistant,
  addTopic,
  removeTopic,
  updateTopic,
  updateTopics,
  removeAllTopics,
  updateTopicUpdatedAt,
  setModel,
  setTagsOrder,
  updateAssistantSettings,
  updateTagCollapse,
  setUnifiedListOrder,
  setAssistantPresets,
  addAssistantPreset,
  removeAssistantPreset,
  updateAssistantPreset,
  updateAssistantPresetSettings,
  // 主机与专家功能
  addHost,
  removeHost,
  addExpert,
  removeExpert,
  // 资料库功能
  addInfoFolder,
  removeInfoFolder,
  updateInfoFolder,
  addInfoItem,
  removeInfoItem,
  updateInfoItem
} = assistantsSlice.actions

export const selectAllTopics = createSelector([(state: RootState) => state.assistants.assistants], (assistants) =>
  assistants.flatMap((assistant: Assistant) => assistant.topics)
)

export const selectTopicsMap = createSelector([selectAllTopics], (topics) => {
  return topics.reduce((map, topic) => {
    map.set(topic.id, topic)
    return map
  }, new Map())
})

// === 主机与专家选择器 ===

/** 选择所有主机 */
export const selectHosts = createSelector([(state: RootState) => state.assistants.assistants], (assistants): Host[] =>
  assistants.filter((a): a is Host => a.type === 'host')
)

/** 选择指定主机下的所有专家 */
export const selectExpertsByHostId = (hostId: string) =>
  createSelector([(state: RootState) => state.assistants.assistants], (assistants): Expert[] =>
    assistants.filter((a): a is Expert => a.type === 'expert' && a.hostId === hostId)
  )

/** 选择所有专家 */
export const selectAllExperts = createSelector(
  [(state: RootState) => state.assistants.assistants],
  (assistants): Expert[] => assistants.filter((a): a is Expert => a.type === 'expert')
)

/** 根据ID选择主机 */
export const selectHostById = (hostId: string) =>
  createSelector([(state: RootState) => state.assistants.assistants], (assistants): Host | undefined =>
    assistants.find((a): a is Host => a.type === 'host' && a.id === hostId)
  )

/** 根据ID选择专家 */
export const selectExpertById = (expertId: string) =>
  createSelector([(state: RootState) => state.assistants.assistants], (assistants): Expert | undefined =>
    assistants.find((a): a is Expert => a.type === 'expert' && a.id === expertId)
  )

/** 选择所有普通助手（非 host 和 expert） */
export const selectRegularAssistants = createSelector(
  [(state: RootState) => state.assistants.assistants],
  (assistants): Assistant[] => assistants.filter((a) => a.type !== 'host' && a.type !== 'expert')
)

// === 资料库选择器 ===

/** 选择指定主机的资料文件夹 */
export const selectInfoFoldersByHostId = (hostId: string) =>
  createSelector([(state: RootState) => state.assistants.assistants], (assistants): InfoFolder[] => {
    const host = assistants.find((a): a is Host => a.type === 'host' && a.id === hostId)
    return host?.infoFolders || []
  })

export default assistantsSlice.reducer
