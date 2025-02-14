import { getEnum } from '@/utils/dataProcessing'
import { t } from '@/locales/i18n'
// 外部链接
export const externalUrl = {
  projectTeamUseGuide:
    'https://yifants.feishu.cn/wiki/SbDuwIb3eisWoIk1HHncuJRdnrb',
  // 事件模板
  event:
    'https://fineboostres.oss-ap-southeast-1.aliyuncs.com/res/eas/事件.xlsx',
  // 事件属性模板
  eventAttr:
    'https://fineboostres.oss-ap-southeast-1.aliyuncs.com/res/eas/事件属性(2.0).xlsx',
  // 用户属性模板
  userAttr:
    'https://fineboostres.oss-ap-southeast-1.aliyuncs.com/res/eas/用户属性.xlsx',
  dimensionTable:
    'https://fineboostres.oss-ap-southeast-1.aliyuncs.com/res/eas/维度表.xlsx',
  // 维度表上传说明
  dimensionTableTip:
    'https://yifants.feishu.cn/wiki/QArswkYtIiesWNkYLXHc5VbHnIc',
  // 埋点方案模板
  buryingPointProgramme:
    'https://fineboostres.oss-ap-southeast-1.aliyuncs.com/res/eas/埋点方案.xlsx',
}

/** --运营管理相关 start-- **/
// 版本
export const versionOptions = [
  {
    type: 1,
    label: '国内版',
  },
  {
    type: 2,
    label: '海外版',
  },
  {
    type: 3,
    label: '国内版与海外版',
  },
]
export const versionEum = getEnum({
  data: versionOptions,
})
// 团队状态
export const companyStatus = [
  {
    type: 0,
    label: '正常',
  },
  {
    type: 1,
    label: '禁用',
  },
]
export const companyStatusEum = getEnum({
  data: companyStatus,
})
export const menuRoleEnum = {
  adminList: '企业管理员',
  analystList: '分析师',
  normalList: '普通成员',
}
// 角色对应初始角色ID
export const roleInitIdsEnum = {
  adminList: '10001',
  analystList: '10002',
  normalList: '10003',
}
/** --运营管理相关 end-- **/

export const appStatusType = [
  {
    type: 0,
    label: t('btn.enable'),
    class: 'success-status',
  },
  {
    type: 1,
    label: t('btn.deactivate'),
    class: 'fail-status',
  },
]

export const appStatusTypeMap = getEnum({
  data: appStatusType,
  needObjValue: true,
})

// 自定义表列数据类型
export const columnTypeList = [
  {
    value: 'text',
    label: t('common.text'),
  },
  {
    value: 'numeric(38,2)',
    label: t('dataManagement.numeralDecimal', [2]),
  },
  {
    value: 'numeric(38,4)',
    label: t('dataManagement.numeralDecimal', [4]),
  },
  {
    value: 'numeric(38,6)',
    label: t('dataManagement.numeralDecimal', [6]),
  },
  {
    value: 'int4',
    label: t('dataManagement.numeralInteger'),
  },
  {
    value: 'timestamp',
    label: t('common.timeDate'),
  },
]

export const columnTypeListMap = getEnum({
  data: columnTypeList,
  valueKey: 'value',
  needObjValue: true,
})

/**tableType 相关**/
/*tableType值对照说明 :
0,用户属性; 1,事件属性; 2,用户维度表; 3,事件维度表;
4,用户分群; 5,用户标签; 6,事件虚拟属性; 7,用户虚拟属性; 8,自定义表。
*/

//tableType 对应的属性分类标签
export const tableTypeArr = [
  'userField',
  'eventField',
  'userField',
  'eventField',
  'userCluster',
  'userLabel',
  'eventField',
  'userField',
  'customTableList',
]

export const tableTypeBase = {
  eventField: 1,
  userField: 0,
  userCluster: 4,
  userLabel: 5,
  customTableList: 8,
}

export const titleMap = {
  eventField: t('dataManagement.eventAttribute'),
  userField: t('dataManagement.userAttribute'),
  userCluster: t('analysis.userGroup'),
  userLabel: t('analysis.userTag'),
  customTableList: t('analysis.sqlquery.customTable'),
}

export const tableKeysArr = [
  'eventField',
  'userField',
  'userCluster',
  'userLabel',
  'customTableList',
]

export const omitAttr = ['__fid', '__bid', '__did']

export const paramKey = 'search'

export const propsConfig = {
  C13: {
    before: '过去',
    between: '区间',
  },
  C14: {
    that_monty: '当月',
    that_day: '当天',
    that_week: '当周',
    between: '区间',
  },
  timeunit: {
    hour: '小时',
    day: '天',
    minute: '分钟',
  },
  int: {
    C00: '等于',
    C01: '不等于',
    C02: '小于',
    C03: '大于',
    C04: '有值',
    C05: '无值',
    C06: '区间',
    C19: '小于等于',
    C20: '大于等于',
  },
  double: {
    C00: '等于',
    C01: '不等于',
    C02: '小于',
    C03: '大于',
    C04: '有值',
    C05: '无值',
    C06: '区间',
    C19: '小于等于',
    C20: '大于等于',
  },
  string: {
    C00: '等于',
    C01: '不等于',
    C07: '包括',
    C08: '不包括',
    C04: '有值',
    C05: '无值',
  },
  datetime: {
    C09: '绝对时间',
    C13: '相对当前日期',
    C14: '相对事件发生时刻',
    C04: '有值',
    C05: '无值',
    C02: '小于',
    C03: '大于',
  },
  timestamp: {
    C09: '绝对时间',
    C13: '相对当前日期',
    C14: '相对事件发生时刻',
    C04: '有值',
    C05: '无值',
    C02: '小于',
    C03: '大于',
  },
  enum: {
    C00: '等于',
    C01: '不等于',
    C04: '有值',
    C05: '无值',
  },
  group: {
    C15: '属于分群',
    C16: '不属于分群',
  },
  boolean: {
    C17: '为真',
    C18: '为假',
    C04: '有值',
    C05: '无值',
  },
}

// 数据表对应关系
export const userAttrDimensionsTypeList = [
  {
    label: t('dataManagement.userAttribute'),
    type: 0,
    alias: 'userField',
  },
  {
    label: t('dataManagement.eventAttribute'),
    type: 1,
    alias: 'eventField',
  },
  {
    label: t('analysis.userDimensionTable'),
    type: 2,
    alias: 'userField',
  },
  {
    label: t('analysis.eventDimensionTable'),
    type: 3,
    alias: 'eventField',
  },
  {
    label: t('analysis.userGroup'),
    type: 4,
    alias: 'userCluster',
  },
  {
    label: t('analysis.userTag'),
    type: 5,
    alias: 'userLabel',
  },
  {
    label: t('analysis.eventVirtualAttributes'),
    type: 6,
    alias: 'eventField',
  },
  {
    label: t('analysis.userVirtualAttributes'),
    type: 7,
    alias: 'userField',
  },
  {
    label: t('analysis.sqlquery.customTable'),
    type: 8,
    alias: 'customTableList',
  },
]

export const userAttrDimensionsTypeListLabelMap = getEnum({
  data: userAttrDimensionsTypeList,
  valueKey: 'label',
  labelKey: 'type',
})

export const userAttrDimensionsTypeListMap = getEnum({
  data: userAttrDimensionsTypeList,
})

export const userAttrDimensionsTypeListAliasMap = getEnum({
  data: userAttrDimensionsTypeList,
  valueKey: 'type',
  labelKey: 'alias',
})

export const dataTypeList = [
  { value: 0, label: t('analysis.component.naturalDay') },
  {
    value: 2,
    label: t('analysis.component.naturalDayDist'),
    tip: t('analysis.component.naturalDayDistTip'),
  },
  { value: 1, label: t('analysis.component.fewhours', [24]) },
]

export const retentionTypeList = [
  { value: 1, label: t('analysis.retention.retain') },
  { value: 2, label: t('analysis.retention.loss') },
]

export const languageTypeList = [
  {
    value: 'zh',
    label: '中文',
  },
  {
    value: 'en',
    label: 'English',
  },
]
