import { cloneDeep } from 'lodash-es'
import { getFieldList, getHideFieldInfo } from '@/api/modules/analysis/common'
import { t } from '@/locales/i18n'

export default function () {
  const asyncGetFieldList = async (eventIds = '') => {
    const { data } = await getFieldList({ eventIds })
    const cloneFiledData = cloneDeep(data)
    data.eventField.unshift({
      fEn: '__pt_date',
      fType: 'string',
      fZh: t('common.date'),
      permissionStatus: true,
    })
    return {
      filedData: data,
      cloneFiledData,
    }
  }

  const asyncGetFieldStatus = async (params) => {
    const { data } = await getHideFieldInfo([
      {
        appId: sessionStorage.getItem('appId'),
        ...params,
      },
    ])
    return data
  }

  return {
    asyncGetFieldList,
    asyncGetFieldStatus,
  }
}
