import { t } from '@/locales/i18n'
import { getEnum } from '@/utils/dataProcessing'

export const valueTypeList = [
  {
    type: 0,
    label: t('common.text'),
  },
  {
    type: 1,
    label: t('common.numeralInteger'),
  },
  {
    type: 2,
    label: t('common.numeralFloat'),
  },
  {
    type: 3,
    label: t('common.timeDate'),
  },
]

export const valueTypeListListMap = getEnum({
  data: valueTypeList,
})
