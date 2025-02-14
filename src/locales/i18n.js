import { createI18n } from 'vue-i18n'
let locale = 'zh'

// 引入语言文件（假设它们已存在）
import enjson from './en.json'
import zhjson from './zh.json'
// 准备翻译的语言环境信息
const messages = {
  zh: zhjson,
  en: enjson,
}

if (localStorage.getItem('Accept-Language') === 'en-US') {
  locale = 'en'
}

// 通过选项创建 VueI18n 实例
export const i18n = createI18n({
  locale, // 设置地区
  messages, // 设置地区信息
})

export const t = i18n.global.t
