import { getEnum } from '@/utils/dataProcessing'
import { dataTypeList } from './event-attr'
import { t } from '@/locales/i18n'
// 事件管理
export const eventTypeList = [
  {
    type: 1,
    label: t('dataManagement.customEvents'),
    // 对应执行方法名
    mark: 'custom',
  },
  {
    notDisplay: true,
    type: 2,
    label: t('dataManagement.presetEvents'),
  },
  {
    type: 3,
    label: t('dataManagement.virtualEvents'),
    mark: 'virtual',
  },
]

export const eventTypeListMap = getEnum({
  data: eventTypeList,
})

/*export const dataTypeList = [
  // numeric: '数值（小数）',
  {
    type: 'string',
    label: '文本',
  },
  {
    type: 'int',
    label: '数值（整数）',
    notShow: true,
  },
  {
    type: 'double',
    label: '数值',
    // label: '数值（小数）',
  },
  {
    type: 'datetime',
    label: '时间(日期)',
  },
  {
    type: 'timestamp',
    label: '时间(时间戳)',
  },
  {
    type: 'array',
    label: '数组',
  },
  {
    type: 'boolean',
    label: '布尔',
  },
]*/

export const eventDataTypeList = dataTypeList.slice(0, 7)

export const eventDataTypeListMap = getEnum({
  data: eventDataTypeList,
})
