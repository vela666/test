import useStoreRoute from '@/store/modules/route'
import { getEnum } from '@/utils/dataProcessing.js'
import useUserStore from '@/store/modules/user.js'
import { t } from '@/locales/i18n.js'

const { routes } = useStoreRoute()
const userStore = useUserStore()

export const reportTypeList = [
  {
    type: 1,
    label: t('analysis.event.analysisName'),
    path: '/analysis/event',
    desc: t('analysis.event.analysisTips'),
    icon: 'event-analysis',
  },
  {
    type: 2,
    label: t('analysis.retention.analysisName'),
    path: '/analysis/retention',
    desc: t('analysis.retention.analysisTips'),
    icon: 'retention-analysis',
  },
  {
    type: 3,
    label: t('analysis.funnel.analysisName'),
    path: '/analysis/funnel',
    desc: t('analysis.funnel.analysisTips'),
    icon: 'funnel-analysis',
  },
  {
    type: 4,
    label: t('analysis.attr.analysisName'),
    path: '/analysis/attr',
    desc: t('analysis.attr.analysisTips'),
    icon: 'attr-analysis',
  },
  {
    type: 5,
    label: t('analysis.path.analysisName'),
    path: '/analysis/path',
    desc: t('analysis.path.analysisTips'),
    icon: 'trace-analysis',
  },
  {
    type: 6,
    label: t('analysis.scatter.analysisName'),
    path: '/analysis/scatter',
    desc: t('analysis.scatter.analysisTips'),
    icon: 'scatter-analysis',
  },
  {
    type: 7,
    label: t('analysis.sqlquery.analysisName'),
    path: '/analysis/sqlquery',
    desc: t('analysis.sqlquery.analysisTips'),
    icon: 'sql-query',
  },
  {
    type: 8,
    label: t('analysis.interval.analysisName'),
    path: '/analysis/interval',
    desc: t('analysis.interval.analysisTips'),
    icon: 'interval-analysis',
  },
  {
    type: 9,
    label: t('analysis.ltv.analysisName'),
    path: '/analysis/ltv',
    desc: t('analysis.ltv.analysisTips'),
    icon: 'ltv-analysis',
  },
  {
    type: 14,
    label: t('analysis.attributed.analysisName'),
    path: '/analysis/attributed',
    desc: t('analysis.attributed.analysisTips'),
    icon: 'analysis-attributed',
  },
]

export const reportTypeListMap = getEnum({
  data: reportTypeList,
})
export const reportTypeObjListMap = getEnum({
  data: reportTypeList,
  needObjValue: true,
})

//  reportType(报表类型):
//  1事件分析，2留存分析，3漏斗分析，4用户分析，5路径分析，6 分布分析，7 sql查询，8 间隔分析，9 LTV分析 14 归因
export const reportTypeEnum = new Map([
  ['event', 1],
  ['retention', 2],
  ['funnel', 3],
  ['attr', 4],
  ['path', 5],
  ['scatter', 6],
  ['sqlquery', 7],
  ['interval', 8],
  ['ltv', 9],
  ['attributed', 14],
])

export const getDataTypeList = () => {
  // 账号类型：0 普通用户、1 超管、2 企业管理员
  return [
    { type: 1, label: t('common.all') },
    { type: 2, label: t('dashboard.createdByMe') },
    { type: 3, label: t('common.sharedByOthers') },
  ].filter((item) => (userStore.userInfo.type !== 2 ? item.type !== 1 : true))
}

// 分析子级路径
export const analysisPathMap = []
for (const item of routes.rawData) {
  if (item.path === '/analysis') {
    item.children.forEach((childItem) => {
      analysisPathMap.push({
        title: childItem.title,
        path: childItem.path,
      })
    })
  }
}

// 时区
export const timeZoneList = [
  {
    value: '8',
    label: 'UTC+8',
  },
  {
    value: '0',
    label: 'UTC+0',
  },
  {
    value: 'local',
    label: t('common.localTime'),
    tip: t('common.localTimeOnly'),
  },
]

export const timeZoneListMap = getEnum({
  data: timeZoneList,
  valueKey: 'value',
})
