import { getEnum } from '@/utils/dataProcessing'
import { t } from '@/locales/i18n'

const operationType = [
  {
    label: t('user.customConditionConfiguration'),
    desc: t('user.customConditionConfigurationMsg'),
  },
  {
    label: t('user.idUploadConfiguration'),
    desc: t('user.idUploadConfigurationMsg'),
  },
  {
    label: t('user.firstAndLastFeatureConfiguration'),
    desc: t('user.firstAndLastFeatureTagMsg'),
  },
  {
    label: t('user.indicatorValueConfiguration'),
    desc: t('user.indicatorValueTagMsg'),
  },
  {
    label: t('user.customSql'),
    desc: t('user.sqlTagMsg'),
  },
]

export const modelType = [
  {
    label: t('analysis.event.analysisName'),
    type: 'event',
  },
  {
    label: t('analysis.retention.analysisName'),
    type: 'retention',
  },
  {
    label: t('analysis.funnel.analysisName'),
    type: 'funnel',
  },
  {
    label: t('analysis.interval.analysisName'),
    type: 'interval',
  },
]

export const defaultGroupType = {
  0: t('common.no'),
  1: t('common.yes'),
}

export const belongNotBelongGroupType = {
  0: t('user.notBelongGroup'),
  1: t('user.belongGroup'),
}
