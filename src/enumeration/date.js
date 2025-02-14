import dayjs from 'dayjs'
import { getEnum } from '@/utils/dataProcessing'
import { t } from '@/locales/i18n.js'
export const unitCycleType = {
  day: t('common.day'),
  week: t('common.week'),
  month: t('common.month'),
  customday: t('common.day'),
  customweek: t('common.week'),
  custommonth: t('common.month'),
}

export const dateEnum = {
  day: [0, 1, 7, 14, 30],
  week: [0, 1, 4, 8, 16],
  month: [0, 1, 3, 4],
}

export const dateFormat1 = 'YYYY-MM-DD'
export const dateFormat2 = 'YYYY-MM-DD HH:mm:ss'
export const currentDate = () => {
  return dayjs()
}
// 最近7天
export const recent7DayStart = dayjs()
  .subtract(6, 'day')
  .startOf('day')
  .format(dateFormat1)
export const recent7DayEnd = dayjs().endOf('day').format(dateFormat1)

// 过去7天
export const past7DayStart = currentDate()
  .subtract(7, 'day')
  .format(dateFormat1)
export const past7DayEnd = currentDate().subtract(1, 'day').format(dateFormat1)

// 过去30天
export const past30DayStart = currentDate()
  .subtract(30, 'day')
  .format(dateFormat1)

export const past30DayEnd = currentDate().subtract(1, 'day').format(dateFormat1)

export const past7DayRange = {
  date: [past7DayStart, past7DayEnd],
  diff: '1-7',
}

export const past30DayRange = {
  date: [past30DayStart, past30DayEnd],
  diff: '1-30',
}

export const timeTypeList = [
  { label: t('common.byDay'), type: 'day' },
  { label: t('common.byMinute'), type: 'minute' },
  { label: t('common.byHour'), type: 'hour' },
  { label: t('common.byWeek'), type: 'week' },
  { label: t('common.byMonth'), type: 'month' },
  { label: t('common.total'), type: 'summary' },
]

export const timeTypeListMap = getEnum({
  data: timeTypeList,
})
export const weekList = [
  { label: t('common.monday'), type: 1 },
  { label: t('common.tuesday'), type: 2 },
  { label: t('common.wednesday'), type: 3 },
  { label: t('common.thursday'), type: 4 },
  { label: t('common.friday'), type: 5 },
  { label: t('common.saturday'), type: 6 },
  { label: t('common.sunday'), type: 7 },
]
export const weekListMap = getEnum({
  data: weekList,
})
