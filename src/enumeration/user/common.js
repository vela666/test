import { getEnum, restoreGetEnum } from '@/utils/dataProcessing'
import { t } from '@/locales/i18n'

export const typeList = [
  {
    type: '1',
    label: t('user.conditionGroup'),
    group: true,
  },
  {
    type: '2',
    label: t('user.idGroup'),
    group: true,
  },
  {
    type: '3',
    label: t('user.resultGroup'),
    group: true,
    notDisplay: true,
  },
  {
    type: '8',
    label: t('user.customSqlGroup'),
    group: true,
  },
  // 标签的
  {
    type: '4',
    label: t('user.conditionTag'),
    tag: true,
    desc: t('user.conditionTagMsg'),
  },
  {
    type: '5',
    label: t('user.firstAndLastFeatureTag'),
    tag: true,
    desc: t('user.firstAndLastFeatureTagMsg'),
  },
  {
    type: '6',
    label: t('user.indicatorValueTag'),
    tag: true,
    desc: t('user.indicatorValueTagMsg'),
  },
  /*  {
    type: '7',
    label: 'ID标签',
    desc: '上传ID定义标签用户，并同时赋予标签值',
    tag: true,
  },*/
  {
    type: '9',
    label: t('user.sqlTag'),
    tag: true,
    desc: t('user.sqlTagMsg'),
  },
]

// export const groupTypeList = typeList.filter((item) => item.group)
export const groupTypeList = typeList.slice(0, 4)

export const groupTypeListMap = getEnum({
  data: groupTypeList,
})

export const tagTypeList = typeList.slice(4)

export const tagTypeListMap = getEnum({
  data: tagTypeList,
})

export const dataUpdTypeList = [
  { type: '0', label: t('user.manualUpdate') },
  { type: '1', label: t('user.automaticUpdate') },
  { type: '2', label: t('user.noUpdate') },
]

export const dataUpdTypeListtMap = getEnum({
  data: dataUpdTypeList,
})

export const operationTypesList = [
  { type: 'C03', label: t('common.greaterThan') },
  { type: 'C02', label: t('common.lessThan') },
  { type: 'C00', label: t('common.equal') },
  { type: 'C01', label: t('common.notEqual') },
  { type: 'C06', label: t('common.range') },
]

export const operationTypesListMap = getEnum({
  data: operationTypesList,
})

// 表格右对齐
export const numberTypeList = [
  'int2',
  'int4',
  'int8',
  'float8',
  'float4',
  'decimal',
  'numeric',
]
