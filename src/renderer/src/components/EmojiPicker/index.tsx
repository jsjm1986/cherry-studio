import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { useTheme } from '@renderer/context/ThemeProvider'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  onEmojiClick: (emoji: string) => void
}

// 语言映射
const localeMap: Record<string, string> = {
  'en-US': 'en',
  'zh-CN': 'zh',
  'zh-TW': 'zh',
  'de-DE': 'de',
  'el-GR': 'en',
  'es-ES': 'es',
  'fr-FR': 'fr',
  'ja-JP': 'ja',
  'pt-PT': 'pt',
  'ru-RU': 'ru'
}

// 只显示常用类别，去掉符号和旗帜
const categories = [
  'frequent',
  'people',
  'nature',
  'foods',
  'activity',
  'places',
  'objects'
]

const EmojiPicker: FC<Props> = ({ onEmojiClick }) => {
  const { theme } = useTheme()
  const { i18n } = useTranslation()
  const locale = localeMap[i18n.language] || 'en'

  const handleEmojiSelect = (emoji: { native: string }) => {
    onEmojiClick(emoji.native)
  }

  return (
    <Picker
      data={data}
      onEmojiSelect={handleEmojiSelect}
      theme={theme === 'dark' ? 'dark' : 'light'}
      locale={locale}
      categories={categories}
      previewPosition="none"
      skinTonePosition="search"
      set="native"
      emojiSize={22}
      emojiButtonSize={32}
      perLine={9}
      maxFrequentRows={2}
    />
  )
}

export default EmojiPicker
