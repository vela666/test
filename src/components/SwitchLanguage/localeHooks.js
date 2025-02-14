import { useI18n } from 'vue-i18n'
import { onMounted } from 'vue'
import { languageTypeList } from '@/enumeration'
import { useRoute } from 'vue-router'

export function useLocaleHooks() {
  const { locale } = useI18n()
  const route = useRoute()

  onMounted(() => {
    locale.value =
      localStorage.getItem('Accept-Language') === 'en-US' ? 'en' : 'zh'
  })

  const changeLocale = (lang) => {
    const isEn = lang === 'en'
    localStorage.setItem('Accept-Language', isEn ? 'en-US' : 'zh-CN')
    locale.value = lang
    if (route.path !== '/login') {
      location.reload()
    }
  }

  return {
    changeLocale,
    locale,
    languageTypeList,
  }
}
