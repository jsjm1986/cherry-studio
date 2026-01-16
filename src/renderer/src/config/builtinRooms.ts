/**
 * 内置房间和专家配置
 * 基于 MPP (模块化人格协议) 设计
 * 使用 Vite ?raw 导入直接读取 MD 文件完整内容
 */

// ==================== 通用协议 ====================
// ==================== 写作房间 ====================
import WRITING_ROOM_PROMPT from '@renderer/assets/prompts/01 写作房间/00 房间提示词.md?raw'
import EXPERT_MOJIANSHAN from '@renderer/assets/prompts/01 写作房间/01 总编-墨见山.md?raw'
import EXPERT_ZHANGCHU from '@renderer/assets/prompts/01 写作房间/02 公文笔杆子-张处.md?raw'
import EXPERT_SANJIE from '@renderer/assets/prompts/01 写作房间/03 旅行作家-三姐.md?raw'
import EXPERT_LAOMA from '@renderer/assets/prompts/01 写作房间/04 历史小说-老马.md?raw'
import EXPERT_LAOWANG from '@renderer/assets/prompts/01 写作房间/05 散文-老汪.md?raw'
import EXPERT_LAOWAN from '@renderer/assets/prompts/01 写作房间/06 科普作家-老万.md?raw'
import EXPERT_LAOGUI from '@renderer/assets/prompts/01 写作房间/07 风格模仿-老鬼.md?raw'
// ==================== 预测房间 ====================
import PREDICTION_ROOM_PROMPT from '@renderer/assets/prompts/02 预测房间/00 预测房间.md?raw'
import EXPERT_LIYUNHE from '@renderer/assets/prompts/02 预测房间/01 八字命理-李云鹤.md?raw'
import EXPERT_TAIQI from '@renderer/assets/prompts/02 预测房间/02 奇门断事-太七.md?raw'
import EXPERT_XUANJI from '@renderer/assets/prompts/02 预测房间/03 五行命理-玄机.md?raw'
import EXPERT_ANNA from '@renderer/assets/prompts/02 预测房间/04 韦特塔罗-安娜.md?raw'
import EXPERT_KUNLING from '@renderer/assets/prompts/02 预测房间/05 紫薇斗术-坤灵.md?raw'
import EXPERT_XUANYUAN from '@renderer/assets/prompts/02 预测房间/06 格局架构 - 玄源.md?raw'
import EXPERT_SHIYANKONG from '@renderer/assets/prompts/04 人类群星/[人格卡带 v1.0：传统佛教阐释者 - 释衍空].md?raw'
import EXPERT_HEERMAN from '@renderer/assets/prompts/04 人类群星/[人格卡带 v1.0：复杂系统理论家 - 赫尔曼].md?raw'
import EXPERT_DEMIWUER from '@renderer/assets/prompts/04 人类群星/[人格卡带 v1.0：异界造物主 - 德米吾尔].md?raw'
import EXPERT_LIAOBOERDE from '@renderer/assets/prompts/04 人类群星/[人格卡带 v1.0：思想史考古学家 - 利奥波德].md?raw'
import EXPERT_V from '@renderer/assets/prompts/04 人类群星/[人格卡带 v1.0：思辨狂想家 - V].md?raw'
import EXPERT_JIERBOTE from '@renderer/assets/prompts/04 人类群星/[人格卡带 v1.0：日常语言学派阐释者 - 吉尔伯特].md?raw'
import EXPERT_YISUOERDE from '@renderer/assets/prompts/04 人类群星/[人格卡带 v1.0：深层心理侧写师 - 伊索尔德].md?raw'
import EXPERT_YILISHABAI from '@renderer/assets/prompts/04 人类群星/[人格卡带 v1.0：深度心理学家 - 伊丽莎白].md?raw'
import EXPERT_KELAOSU from '@renderer/assets/prompts/04 人类群星/[人格卡带 v1.0：现象学哲学家 - 克劳斯].md?raw'
import EXPERT_WOKE from '@renderer/assets/prompts/04 人类群星/[人格卡带 v1.0：痕迹学侦探 - 沃克].md?raw'
import EXPERT_NIHONG from '@renderer/assets/prompts/04 人类群星/[人格卡带 v1.0：赛博情报商 - 霓虹].md?raw'
import EXPERT_BOERHESI from '@renderer/assets/prompts/04 人类群星/[人格卡带 v2.0：迷宫守门人 - 博尔赫斯].md?raw'
// ==================== 人类群星 ====================
import STARS_ROOM_PROMPT from '@renderer/assets/prompts/04 人类群星/房间prompt.md?raw'
// ==================== 教研房间 ====================
import EXPERT_LAOPAN from '@renderer/assets/prompts/05 教研房间/01 课题研究 - 老潘.md?raw'
import EXPERT_FANG from '@renderer/assets/prompts/05 教研房间/02 教学目标 - 方老师.md?raw'
import EXPERT_XIAOSHEN from '@renderer/assets/prompts/05 教研房间/03 学习体验 - 小沈.md?raw'
import EXPERT_CATTY from '@renderer/assets/prompts/05 教研房间/04 PPT 大神 - Catty.md?raw'
import MPP_KERNEL from '@renderer/assets/prompts/通用房间协议.md?raw'

// ==================== 类型定义 ====================
export interface BuiltinExpert {
  name: string
  emoji: string
  description: string
  handle: string
  triggerKeywords: string[]
  prompt: string
}

export interface BuiltinRoom {
  id: string
  name: string
  emoji: string
  description: string
  prompt: string
  welcomeMessage: string
  experts: BuiltinExpert[]
}

// ==================== 内置房间配置 ====================
export const BUILTIN_ROOMS: BuiltinRoom[] = [
  // 写作房间
  {
    id: 'builtin-writing-room',
    name: '写作房间',
    emoji: '📚',
    description: '万卷书局 - 高阶文学创作思维殿堂',
    prompt: MPP_KERNEL + '\n\n' + WRITING_ROOM_PROMPT,
    welcomeMessage: '欢迎来到写作房间，你可以在对话框中输入"@"符号来召唤不同的写作专家。如果不知道怎么用，可以先@总编-墨见山',
    experts: [
      {
        name: '总编-墨见山',
        emoji: '📝',
        description: '万卷书局执行总编，负责需求分析和专家调度',
        handle: '@总编-墨见山',
        triggerKeywords: ['墨见山', '总编', '选题'],
        prompt: EXPERT_MOJIANSHAN
      },
      {
        name: '公文-张处',
        emoji: '📋',
        description: '体制内笔杆子，擅长公文、通知、讲话稿',
        handle: '@公文-张处',
        triggerKeywords: ['张处', '公文', '通知', '讲话稿', '汇报'],
        prompt: EXPERT_ZHANGCHU
      },
      {
        name: '游记-三姐',
        emoji: '✈️',
        description: '旅行作家，擅长游记、情感散文',
        handle: '@游记-三姐',
        triggerKeywords: ['三姐', '游记', '旅行', '散文'],
        prompt: EXPERT_SANJIE
      },
      {
        name: '历史-老马',
        emoji: '📜',
        description: '历史小说家，擅长历史考据、政治惊悚',
        handle: '@历史-老马',
        triggerKeywords: ['老马', '历史', '小说', '考据'],
        prompt: EXPERT_LAOMA
      },
      {
        name: '散文-老汪',
        emoji: '🍵',
        description: '散文大师，擅长人间烟火、美食散文',
        handle: '@散文-老汪',
        triggerKeywords: ['老汪', '散文', '美食', '怀旧'],
        prompt: EXPERT_LAOWANG
      },
      {
        name: '科普-老万',
        emoji: '🔬',
        description: '科普作家，擅长硬核科普、认知升级',
        handle: '@科普-老万',
        triggerKeywords: ['老万', '科普', '科学', '技术'],
        prompt: EXPERT_LAOWAN
      },
      {
        name: '仿写-老鬼',
        emoji: '👻',
        description: '风格模仿专家，擅长文风复刻、名著戏仿',
        handle: '@仿写-老鬼',
        triggerKeywords: ['老鬼', '仿写', '模仿', '风格'],
        prompt: EXPERT_LAOGUI
      }
    ]
  },
  // 预测房间
  {
    id: 'builtin-prediction-room',
    name: '预测房间',
    emoji: '🔮',
    description: '命理预测殿堂 - 八字、奇门、塔罗、紫微',
    prompt: MPP_KERNEL + '\n\n' + PREDICTION_ROOM_PROMPT,
    welcomeMessage: '欢迎来到预测房间，这里汇聚了各类命理预测专家。输入"@"召唤专家。',
    experts: [
      {
        name: '八字-李云鹤',
        emoji: '📅',
        description: '资深八字命理师，从业23年',
        handle: '@八字-李云鹤',
        triggerKeywords: ['李云鹤', '八字', '命理', '生辰'],
        prompt: EXPERT_LIYUNHE
      },
      {
        name: '奇门-太七',
        emoji: '🎯',
        description: '奇门遁甲断事宗师',
        handle: '@奇门-太七',
        triggerKeywords: ['太七', '奇门', '遁甲', '断事'],
        prompt: EXPERT_TAIQI
      },
      {
        name: '五行-玄机',
        emoji: '☯️',
        description: '五行命理推演大师',
        handle: '@五行-玄机',
        triggerKeywords: ['玄机', '五行', '推演'],
        prompt: EXPERT_XUANJI
      },
      {
        name: '塔罗-安娜',
        emoji: '🃏',
        description: '韦特塔罗占卜师',
        handle: '@塔罗-安娜',
        triggerKeywords: ['安娜', '塔罗', '占卜', '牌阵'],
        prompt: EXPERT_ANNA
      },
      {
        name: '紫微-坤灵',
        emoji: '⭐',
        description: '紫微斗数演算系统',
        handle: '@紫微-坤灵',
        triggerKeywords: ['坤灵', '紫微', '斗数', '命盘'],
        prompt: EXPERT_KUNLING
      },
      {
        name: '格局-玄源',
        emoji: '🏛️',
        description: '格局架构师，命理学究',
        handle: '@格局-玄源',
        triggerKeywords: ['玄源', '格局', '用神'],
        prompt: EXPERT_XUANYUAN
      }
    ]
  },
  // 人类群星房间
  {
    id: 'builtin-stars-room',
    name: '人类群星',
    emoji: '🌟',
    description: '汇聚各领域顶尖思想家的智慧殿堂',
    prompt: MPP_KERNEL + '\n\n' + STARS_ROOM_PROMPT,
    welcomeMessage: '欢迎来到人类群星，这里汇聚了各领域的深度思想家。输入"@"召唤专家。',
    experts: [
      {
        name: '情报商-霓虹',
        emoji: '🌃',
        description: '赛博情报商，信息去噪专家',
        handle: '@情报商-霓虹',
        triggerKeywords: ['霓虹', '情报', '内幕', '黑料'],
        prompt: EXPERT_NIHONG
      },
      {
        name: '侦探-沃克',
        emoji: '🔍',
        description: '痕迹学侦探，行为分析专家',
        handle: '@侦探-沃克',
        triggerKeywords: ['沃克', '侦探', '痕迹', '分析'],
        prompt: EXPERT_WOKE
      },
      {
        name: '侧写师-伊索尔德',
        emoji: '🧠',
        description: '深层心理侧写师',
        handle: '@侧写师-伊索尔德',
        triggerKeywords: ['伊索尔德', '侧写', '心理'],
        prompt: EXPERT_YISUOERDE
      },
      {
        name: '心理学家-伊丽莎白',
        emoji: '💭',
        description: '深度心理学家',
        handle: '@心理学家-伊丽莎白',
        triggerKeywords: ['伊丽莎白', '心理学', '深度'],
        prompt: EXPERT_YILISHABAI
      },
      {
        name: '狂想家-V',
        emoji: '💡',
        description: '思辨狂想家',
        handle: '@狂想家-V',
        triggerKeywords: ['V', '狂想', '思辨'],
        prompt: EXPERT_V
      },
      {
        name: '系统论-赫尔曼',
        emoji: '🔗',
        description: '复杂系统理论家',
        handle: '@系统论-赫尔曼',
        triggerKeywords: ['赫尔曼', '系统', '复杂'],
        prompt: EXPERT_HEERMAN
      },
      {
        name: '思想史-利奥波德',
        emoji: '📖',
        description: '思想史考古学家',
        handle: '@思想史-利奥波德',
        triggerKeywords: ['利奥波德', '思想史', '考古'],
        prompt: EXPERT_LIAOBOERDE
      },
      {
        name: '现象学-克劳斯',
        emoji: '🌀',
        description: '现象学哲学家',
        handle: '@现象学-克劳斯',
        triggerKeywords: ['克劳斯', '现象学', '哲学'],
        prompt: EXPERT_KELAOSU
      },
      {
        name: '语言学-吉尔伯特',
        emoji: '🗣️',
        description: '日常语言学派阐释者',
        handle: '@语言学-吉尔伯特',
        triggerKeywords: ['吉尔伯特', '语言学', '日常'],
        prompt: EXPERT_JIERBOTE
      },
      {
        name: '佛学-释衍空',
        emoji: '🙏',
        description: '传统佛教阐释者',
        handle: '@佛学-释衍空',
        triggerKeywords: ['释衍空', '佛学', '佛教'],
        prompt: EXPERT_SHIYANKONG
      },
      {
        name: '造物主-德米吾尔',
        emoji: '🌌',
        description: '异界造物主',
        handle: '@造物主-德米吾尔',
        triggerKeywords: ['德米吾尔', '造物', '异界'],
        prompt: EXPERT_DEMIWUER
      },
      {
        name: '迷宫-博尔赫斯',
        emoji: '🏛️',
        description: '迷宫守门人',
        handle: '@迷宫-博尔赫斯',
        triggerKeywords: ['博尔赫斯', '迷宫', '守门'],
        prompt: EXPERT_BOERHESI
      }
    ]
  },
  // 教研房间
  {
    id: 'builtin-teaching-room',
    name: '教研房间',
    emoji: '🎓',
    description: '专业课程设计与教学研究工作室',
    prompt: MPP_KERNEL,
    welcomeMessage: '欢迎来到教研房间，这里有专业的课程设计专家。输入"@"召唤专家。',
    experts: [
      {
        name: '课题-老潘',
        emoji: '📊',
        description: '资深教务主任，课程产品终审官',
        handle: '@课题-老潘',
        triggerKeywords: ['老潘', '课题', '选题', '审核'],
        prompt: EXPERT_LAOPAN
      },
      {
        name: '目标-方老师',
        emoji: '🎯',
        description: '教学目标架构师',
        handle: '@目标-方老师',
        triggerKeywords: ['方老师', '目标', '大纲', '考核'],
        prompt: EXPERT_FANG
      },
      {
        name: '体验-小沈',
        emoji: '🎮',
        description: '学习体验设计师',
        handle: '@体验-小沈',
        triggerKeywords: ['小沈', '体验', '游戏化', '互动'],
        prompt: EXPERT_XIAOSHEN
      },
      {
        name: 'PPT-Catty',
        emoji: '📽️',
        description: 'PPT内容架构师',
        handle: '@PPT-Catty',
        triggerKeywords: ['Catty', 'PPT', '演讲', '分镜'],
        prompt: EXPERT_CATTY
      }
    ]
  }
]
