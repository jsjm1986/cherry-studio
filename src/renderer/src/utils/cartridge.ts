/**
 * 人格卡带解析与编译工具
 * 用于解析 Markdown 格式的人格卡带，并编译为系统提示词
 */

/** 卡带结构化数据 */
export interface CartridgeData {
  // 元信息
  title?: string
  version?: string

  // 核心身份
  identity: {
    name?: string
    age?: string
    profession?: string
    tags?: string[]
    motto?: string
  }

  // 核心能力与知识库
  skills?: Array<{
    name: string
    description?: string
    methodology?: string
  }>

  knowledgeDomains?: Array<{
    name: string
    description?: string
  }>

  // 世界观与创作观
  worldview?: {
    coreBeliefs?: string[]
    biases?: {
      despise?: string[]
      admire?: string[]
    }
    catchphrases?: string[]
  }

  // 交互指令
  interaction?: {
    loadCommand?: string
    runLogic?: string
  }
}

/**
 * 解析人格卡带 Markdown
 */
export function parseCartridgeMarkdown(markdown: string): CartridgeData {
  const data: CartridgeData = {
    identity: {}
  }

  // 提取标题
  const titleMatch = markdown.match(/###?\s*\*?\*?\[人格卡带[^：:]*[：:]\s*([^\]]+)\]/)
  if (titleMatch) {
    data.title = titleMatch[1].trim()
  }

  // 提取版本号
  const versionMatch = markdown.match(/版本号[：:]\s*(\S+)/)
  if (versionMatch) {
    data.version = versionMatch[1]
  }

  // 解析核心身份
  const identitySection = extractSection(markdown, '核心身份', '核心能力')

  if (identitySection) {
    // 姓名
    const nameMatch = identitySection.match(/\*?\*?姓名[：:]\*?\*?\s*(.+?)(?:\n|$)/)
    if (nameMatch) data.identity.name = cleanValue(nameMatch[1])

    // 年龄
    const ageMatch = identitySection.match(/\*?\*?年龄[：:]\*?\*?\s*(.+?)(?:\n|$)/)
    if (ageMatch) data.identity.age = cleanValue(ageMatch[1])

    // 职业
    const professionMatch = identitySection.match(/\*?\*?职业[：:]\*?\*?\s*(.+?)(?:\n|$)/)
    if (professionMatch) data.identity.profession = cleanValue(professionMatch[1])

    // 人格标签
    const tagsMatch = identitySection.match(/\*?\*?人格标签[：:]\*?\*?\s*(.+?)(?:\n|$)/)
    if (tagsMatch) {
      data.identity.tags = tagsMatch[1]
        .split(/\s+/)
        .map((t) => t.trim())
        .filter((t) => t.startsWith('#'))
        .map((t) => t.substring(1))
    }

    // 个人宣言/Motto
    const mottoMatch = identitySection.match(/\*?\*?个人宣言[^：:]*[：:]\*?\*?\s*"?(.+?)"?(?:\n|$)/)
    if (mottoMatch) data.identity.motto = cleanValue(mottoMatch[1]).replace(/^"|"$/g, '')
  }

  // 解析专业技能
  const skillsSection = extractSection(markdown, '专业技能', '知识领域')
  if (skillsSection) {
    data.skills = parseSkills(skillsSection)
  }

  // 解析知识领域
  const knowledgeSection = extractSection(markdown, '知识领域', '世界观')
  if (knowledgeSection) {
    data.knowledgeDomains = parseKnowledgeDomains(knowledgeSection)
  }

  // 解析世界观
  const worldviewSection = extractSection(markdown, '世界观', '交互指令')
  if (worldviewSection) {
    data.worldview = parseWorldview(worldviewSection)
  }

  // 解析交互指令
  const interactionSection = extractSection(markdown, '交互指令', null)
  if (interactionSection) {
    const loadMatch = interactionSection.match(/`\[([^\]]+)\]`/)
    if (loadMatch) {
      data.interaction = { loadCommand: loadMatch[1] }
    }
  }

  return data
}

/**
 * 将卡带数据编译为系统提示词
 */
export function compileCartridgeToPrompt(data: CartridgeData): string {
  const sections: string[] = []

  // 核心身份
  if (data.identity.name || data.identity.profession) {
    let identityPart = '## 核心身份\n'
    if (data.identity.name) identityPart += `你是 ${data.identity.name}`
    if (data.identity.age) identityPart += `，${data.identity.age}`
    if (data.identity.profession) identityPart += `，职业是${data.identity.profession}`
    identityPart += '。\n'

    if (data.identity.tags && data.identity.tags.length > 0) {
      identityPart += `\n人格特质：${data.identity.tags.join('、')}\n`
    }

    if (data.identity.motto) {
      identityPart += `\n个人信条："${data.identity.motto}"\n`
    }

    sections.push(identityPart)
  }

  // 专业技能
  if (data.skills && data.skills.length > 0) {
    let skillsPart = '## 专业技能\n'
    for (const skill of data.skills) {
      skillsPart += `\n### ${skill.name}\n`
      if (skill.description) skillsPart += `${skill.description}\n`
      if (skill.methodology) skillsPart += `方法论：${skill.methodology}\n`
    }
    sections.push(skillsPart)
  }

  // 知识领域
  if (data.knowledgeDomains && data.knowledgeDomains.length > 0) {
    let knowledgePart = '## 知识领域\n'
    for (const domain of data.knowledgeDomains) {
      knowledgePart += `\n### ${domain.name}\n`
      if (domain.description) knowledgePart += `${domain.description}\n`
    }
    sections.push(knowledgePart)
  }

  // 世界观与创作观
  if (data.worldview) {
    let worldviewPart = '## 世界观与行为准则\n'

    if (data.worldview.coreBeliefs && data.worldview.coreBeliefs.length > 0) {
      worldviewPart += '\n核心信念：\n'
      for (const belief of data.worldview.coreBeliefs) {
        worldviewPart += `- ${belief}\n`
      }
    }

    if (data.worldview.biases) {
      if (data.worldview.biases.despise && data.worldview.biases.despise.length > 0) {
        worldviewPart += '\n反对/鄙视：\n'
        for (const item of data.worldview.biases.despise) {
          worldviewPart += `- ${item}\n`
        }
      }
      if (data.worldview.biases.admire && data.worldview.biases.admire.length > 0) {
        worldviewPart += '\n推崇/欣赏：\n'
        for (const item of data.worldview.biases.admire) {
          worldviewPart += `- ${item}\n`
        }
      }
    }

    if (data.worldview.catchphrases && data.worldview.catchphrases.length > 0) {
      worldviewPart += '\n常用口头禅/表达方式：\n'
      for (const phrase of data.worldview.catchphrases) {
        worldviewPart += `- "${phrase}"\n`
      }
    }

    sections.push(worldviewPart)
  }

  return sections.join('\n')
}

/**
 * 从专家数据导出为卡带 Markdown
 */
export function exportToCartridgeMarkdown(expert: { name: string; prompt: string; emoji?: string }): string {
  const name = expert.name
  const now = new Date().toISOString().split('T')[0]

  return `### **[人格卡带 v1.0：${name}]**

文档类型： 千面 v2.0 人格数据卡带
卡带名称： ${name}
版本号： 1.0
导出日期： ${now}

------

#### **一、 核心身份 (Core Identity)**

- **姓名：** ${name}
- **年龄：** 未知
- **职业：** 未知
- **人格标签：**
- **个人宣言/Motto：** ""

#### **二、 核心能力与知识库 (Core Abilities & Knowledge Base)**

**1. 专业技能 (Professional Skills):**

（从原始提示词中提取）

**2. 知识领域 (Knowledge Domains):**

（从原始提示词中提取）

#### **三、 世界观与创作观 (Worldview & Creative Philosophy)**

（从原始提示词中提取）

#### **四、 原始提示词 (Original Prompt)**

\`\`\`
${expert.prompt}
\`\`\`

#### **五、 交互指令 (Interaction Command)**

- **加载方式：** \`[加载卡带：${name}]\`
`
}

/**
 * 从卡带数据提取专家基本信息
 */
export function extractExpertInfoFromCartridge(data: CartridgeData): {
  name: string
  handle: string
  triggerKeywords: string[]
} {
  const name = data.identity.name || data.title?.split('-').pop()?.trim() || '未命名专家'
  const handle = `@${name}`
  const triggerKeywords = [name, ...(data.identity.tags || [])]

  return { name, handle, triggerKeywords }
}

// === 辅助函数 ===

function extractSection(markdown: string, startKeyword: string, endKeyword: string | null): string | null {
  const startPattern = new RegExp(`#{2,4}[^#]*${startKeyword}`, 'i')
  const startMatch = markdown.match(startPattern)
  if (!startMatch || startMatch.index === undefined) return null

  const startIndex = startMatch.index
  let endIndex = markdown.length

  if (endKeyword) {
    const endPattern = new RegExp(`#{2,4}[^#]*${endKeyword}`, 'i')
    const remaining = markdown.substring(startIndex + startMatch[0].length)
    const endMatch = remaining.match(endPattern)
    if (endMatch && endMatch.index !== undefined) {
      endIndex = startIndex + startMatch[0].length + endMatch.index
    }
  }

  return markdown.substring(startIndex, endIndex)
}

function cleanValue(value: string): string {
  return value.replace(/\*\*/g, '').trim()
}

function parseSkills(section: string): CartridgeData['skills'] {
  const skills: CartridgeData['skills'] = []

  // 匹配 "- **技能名称 (English):**" 格式
  const skillPattern = /[-*]\s*\*?\*?([^*:]+)\s*(?:\([^)]+\))?[：:]\*?\*?\s*\n([\s\S]*?)(?=\n[-*]\s*\*?\*?[^*\n]+[：:]|\n\*\*\d|$)/g

  let match
  while ((match = skillPattern.exec(section)) !== null) {
    const name = cleanValue(match[1])
    const content = match[2]

    // 提取描述
    const descMatch = content.match(/\*?\*?描述[：:]\*?\*?\s*(.+?)(?=\n\s*[-*]|\n\s*\*\*|$)/s)
    const description = descMatch ? cleanValue(descMatch[1]) : undefined

    // 提取方法论
    const methodMatch = content.match(/\*?\*?方法论[：:]\*?\*?\s*(.+?)(?=\n\s*[-*]|\n\s*\*\*|$)/s)
    const methodology = methodMatch ? cleanValue(methodMatch[1]) : undefined

    if (name && name.length > 1) {
      skills.push({ name, description, methodology })
    }
  }

  return skills.length > 0 ? skills : undefined
}

function parseKnowledgeDomains(section: string): CartridgeData['knowledgeDomains'] {
  const domains: CartridgeData['knowledgeDomains'] = []

  // 匹配 "- **领域名称:**" 格式
  const domainPattern = /[-*]\s*\*?\*?([^*:]+)[：:]\*?\*?\s*\n([\s\S]*?)(?=\n[-*]\s*\*?\*?[^*\n]+[：:]|\n\*\*\d|$)/g

  let match
  while ((match = domainPattern.exec(section)) !== null) {
    const name = cleanValue(match[1])
    const content = match[2]

    // 合并描述内容
    const description = content
      .split('\n')
      .map((line) => cleanValue(line.replace(/^\s*[-*]\s*/, '')))
      .filter((line) => line.length > 0)
      .join(' ')

    if (name && name.length > 1) {
      domains.push({ name, description: description || undefined })
    }
  }

  return domains.length > 0 ? domains : undefined
}

function parseWorldview(section: string): CartridgeData['worldview'] {
  const worldview: CartridgeData['worldview'] = {}

  // 核心信念/焦虑
  const beliefMatch = section.match(/\*?\*?核心(?:信念|焦虑)[：:]\*?\*?\s*"?(.+?)"?(?=\n[-*]|\n\*\*|$)/s)
  if (beliefMatch) {
    worldview.coreBeliefs = [cleanValue(beliefMatch[1]).replace(/^"|"$/g, '')]
  }

  // 鄙视
  const despiseMatch = section.match(/\*?\*?鄙视[：:]\*?\*?\s*(.+?)(?=\n\s*[-*]\s*\*?\*?推崇|\n\s*[-*]\s*\*?\*?矛盾|\n\*\*|$)/s)
  if (despiseMatch) {
    worldview.biases = worldview.biases || {}
    worldview.biases.despise = despiseMatch[1]
      .split(/[；;]/)
      .map((s) => cleanValue(s))
      .filter((s) => s.length > 0)
  }

  // 推崇
  const admireMatch = section.match(/\*?\*?推崇[：:]\*?\*?\s*(.+?)(?=\n\s*[-*]\s*\*?\*?矛盾|\n\*\*|$)/s)
  if (admireMatch) {
    worldview.biases = worldview.biases || {}
    worldview.biases.admire = admireMatch[1]
      .split(/[；;]/)
      .map((s) => cleanValue(s))
      .filter((s) => s.length > 0)
  }

  // 口头禅
  const catchphraseSection = section.match(/\*?\*?口头禅[^：:]*[：:]\*?\*?\s*([\s\S]*?)(?=\n#{2,4}|$)/s)
  if (catchphraseSection) {
    const phrases = catchphraseSection[1].match(/"([^"]+)"/g)
    if (phrases) {
      worldview.catchphrases = phrases.map((p) => p.replace(/"/g, ''))
    }
  }

  return Object.keys(worldview).length > 0 ? worldview : undefined
}
