import { t } from '@/locales/i18n'
import { getEnum } from '@/utils/dataProcessing'

export const displayStateTypeList = [
  { type: 0, label: t('dataManagement.display') },
  { type: 1, label: t('dataManagement.hide') },
]

export const releaseStatusList = [
  { type: 0, label: t('dataManagement.unpublished') },
  { type: 1, label: t('dataManagement.published') },
  // 2不需要发布（维度属性和虚拟属性)
]

export const releaseStatusListMap = getEnum({
  data: releaseStatusList,
})

export const configAttrTypeList = [
  { type: 1, label: t('dataManagement.configured') },
  { type: 2, label: t('dataManagement.notConfigured') },
]

export const withOrWithoutTypeList = [
  { type: 0, label: t('dataManagement.no') },
  { type: 1, label: t('dataManagement.yes') },
]
