import { defineStore } from 'pinia'
import { reactive, toRefs } from 'vue'
import {
  asyncGetTemplate,
  getSqlPropertyTipInfo,
} from '@/api/modules/common.js'

export default defineStore('common', () => {
  const initVal = () => {
    return {
      // 条件模板列表 src/components/ConditionTemplate
      conditionsTemplateList: [],
      tipList: [],
    }
  }
  const state = reactive(initVal())

  const getSaveConditionsTemplate = async (appId) => {
    if (!appId) appId = sessionStorage.getItem('appId')
    const { data } = await asyncGetTemplate({ type: 1, appId })
    state.conditionsTemplateList = data
  }

  const getSqlTipInfo = async () => {
    if (!state.tipList.length) {
      const res = await getSqlPropertyTipInfo()
      if (res && res.code === 200) {
        res.data.forEach((item, index) => {
          state.tipList.push({
            meta: item.chineseName,
            caption: item.englishName,
            value: item.englishName,
            score: 100 + index,
          })
        })
      }
    }
    return state.tipList
  }
  return {
    ...toRefs(state),
    getSaveConditionsTemplate,
    getSqlTipInfo,
  }
})
