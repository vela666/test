import { getEnum } from '@/utils/dataProcessing'
import { t } from '@/locales/i18n.js'

// 旧数据的key
// 时区
// 'timeZone',
// 按天/小时/合计
// 'timeParticle',
// 动态时间 '1(结束日期N天前)-7(开始日期N天前)'
// 'recentDay',
// 'startTime',
// 'endTime',
// 'graphType',

export const dateLabelList = [
  { type: 'yesterday', label: '昨日' },
  { type: 'today', label: '今日' },
  { type: 'lastWeek', label: '上周' },
  { type: 'currentWeek', label: '本周' },
  { type: 'lastMonth', label: '上月' },
  { type: 'currentMonth', label: '本月' },
  { type: 'past7Day', label: '过去7天' },
  { type: 'past8Day', label: '过去8天' },
  { type: 'past30Day', label: '过去30天' },
  { type: 'certainDayToYesterday', label: '自某日至昨日' },
  { type: 'certainDayToToday', label: '自某日至今' },
]
export const skipKey = dateLabelList.slice(-2).map((item) => item.type)
export const dateTypeEnum = getEnum({
  data: dateLabelList,
})
export const dateLabelEnum = getEnum({
  data: dateLabelList,
  valueKey: 'label',
  labelKey: 'type',
})
export const kanBanFilterDate = `kanBanFilterDate${sessionStorage.getItem(
  'appId'
)}`

export const todayAndYesterday = {
  0: t('dateRangeSelect.today'),
  1: t('dateRangeSelect.yesterday'),
}

export const dateSeparator = ' ~ '
