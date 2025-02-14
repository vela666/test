import { getRandom } from '@/utils'
import dayjs from 'dayjs'
import { t } from '@/locales/i18n'

export const groupName = (prefix = 'c') => {
  return `${prefix}${
    sessionStorage.getItem('appId')?.slice(-2) || getRandom(2)
  }${getRandom(5)}`
}

export const displayName = (prefix = t('user.group')) => {
  return `${prefix}_${dayjs().format('YYYYMMDD_HHmmss')}`
}
