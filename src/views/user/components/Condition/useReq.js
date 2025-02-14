import {
  getEventFields,
  getFieldList,
  getHideFieldInfo,
} from '@/api/modules/analysis/common'
import { t } from '@/locales/i18n'

export default function () {
  const asyncGetFieldList = async (eventIds = '', type) => {
    const { data } = await getFieldList({ eventIds })
    return data
  }

  const asyncGetEventFields = async (eventId) => {
    //analysisType: 1
    const { data } = await getEventFields({ eventId })
    ;['A01', 'A02'].forEach((item) => {
      Reflect.deleteProperty(data.common, item)
    })
    data.field.unshift({
      fEn: '__pt_date',
      fType: 'string',
      fZh: t('common.date'),
    })
    const commonList = Object.keys(data.common).reduce((p, c) => {
      p.push({
        value: c,
        label: data.common[c],
      })
      return p
    }, [])
    return {
      eventFields: data,
      commonList,
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
    asyncGetEventFields,
    asyncGetFieldStatus,
    // ...toRefs(state),
  }
}
