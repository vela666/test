import { ref, toRefs } from 'vue'
import { useScatterResultHooks } from './scatterResultHooks.js'
import useTimeZoneStore from '@/store/modules/time-zone'
import { isEmpty, cloneDeep, isObject, isString } from 'lodash-es'
import { scatterCalcute } from '@/api/modules/analysis/scatter'
import useCancelRequest from '@/hooks/useCancelRequest.js'
import { getIndexEventName } from '@/views/analysis/hooks/utils'
import { t } from '@/locales/i18n'

export default function (props, emits) {
  const cancelRequest = useCancelRequest()

  const {
    analysisResult,
    download,
    timeParticleList,
    visible,
    renderTable,
    initTypeList,
    dashboardChartTypeList,
  } = useScatterResultHooks(emits, props)

  const useTimeZone = useTimeZoneStore()

  const initFlag = ref(true)

  /**
   * @description: 格式化请求参数
   * @return {*}
   */
  const getRequestParams = (type) => {
    const qp = props.info.qp ? JSON.parse(props.info.qp) : {}
    const reqConditionParam = props?.params?.reqConditionParam

    if (initFlag.value) {
      if (!qp) return
      analysisResult.dateRange = {
        diff: qp?.recentDay || '',
        recentDay: qp?.recentDay || '',
        mainName: '',
        shortcutType: qp?.shortcutType ?? '',
        startTime: qp?.startTime,
        endTime: qp?.endTime,
      }

      analysisResult.timeParticle = qp.timeParticle
      analysisResult.firstDayOfWeek = qp.firstDayOfWeek
      initFlag.value = false
    }

    if (!type || type === 'date') {
      if (props?.params?.dateRange?.date?.length) {
        analysisResult.dateRange = cloneDeep(props.params.dateRange)
      } else {
        if (!qp) return
        analysisResult.dateRange = {
          diff: qp?.recentDay || '',
          recentDay: qp?.recentDay || '',
          mainName: '',
          shortcutType: qp?.shortcutType ?? '',
          startTime: qp?.startTime,
          endTime: qp?.endTime,
        }
      }
    }

    const { shortcutType, endTime, startTime, recentDay, diff } = toRefs(
      analysisResult.dateRange
    )

    const newQp = {
      ...qp,
      timeZone: useTimeZone.timeZone,
      startTime: startTime.value,
      endTime: endTime.value,
      recentDay: recentDay.value,
      shortcutType: shortcutType.value,
      diff: diff.value,
      timeParticle: analysisResult.timeParticle,
      firstDayOfWeek:
        analysisResult.timeParticle === 'week'
          ? analysisResult.firstDayOfWeek
          : undefined,
    }

    if (type) {
      newQp.sortArr = analysisResult.sortArr
    }

    if (props?.params?.groupBy?.length) {
      newQp.groupBy = cloneDeep(props.params.groupBy)
    }

    newQp.groupBy = cloneDeep(newQp.groupBy).map((item) => {
      item.propertyRangeType =
        item.propertyRangeType === 1 ? 2 : item.propertyRangeType
      return item
    })

    if (
      newQp.events?.eventType &&
      typeof newQp.events?.eventType === 'string'
    ) {
      // 兼容1.0版本  eventType为字符串情况删除当前字段，服务端自行处理事件类型
      delete newQp.events?.eventType
    }

    if (!isEmpty(reqConditionParam)) newQp.conditionFilts = reqConditionParam

    analysisResult.dataQp = newQp

    return newQp
  }

  /**
   * @description: 开始计算
   * @return {*}
   * @param {object} type  请求的类型
   */
  const getData = async (info = {}) => {
    const { type } = info
    if (type === 'notReq') {
      //
    } else {
      analysisResult.loading = true
      const qp = getRequestParams(type)
      analysisResult.errMessage = ''
      try {
        const res = await scatterCalcute({
          appId: props?.params?.appId,
          qp,
          selectData: type === 'refresh',
          callback: cancelRequest.cancelCallBack,
        })
        if (res.code === 200) {
          renderTable(res.data, qp)
          analysisResult.sqlContent = res.data.sql
        } else {
          analysisResult.errMessage = res.message
        }
        cancelRequest.cancelReset()
      } catch (error) {
        console.log(error)
      } finally {
        analysisResult.loading = false
      }
    }
  }

  /**
   * @description: 探索的参数
   * @return {*}
   */
  const getInfo = () => {
    const info = cloneDeep(props.info) ?? {}
    info.qp = JSON.stringify(getRequestParams('explore'))
    return info
  }

  const reCalcute = async (flag) => {
    await getData({ type: flag ? 'refresh' : 'reCalcute' })
  }

  /**
   * @description 取消计算
   */
  const cancelCalculate = () => {
    cancelRequest.cancelCalculate(() => {
      analysisResult.loading = false
      analysisResult.errMessage = t('analysis.reportCalcCanceled')
    })
  }

  // 看板获取全局筛选数据源的事件 eventNames 和分组数据源的事件 eventNames
  const getSetting = () => {
    let info = isObject(props.info) ? cloneDeep(props.info) : {}
    const qpData = isString(info.qp) ? JSON.parse(info.qp) : {}
    const data = getIndexEventName(qpData?.events)
    return cloneDeep(data)
  }

  return {
    analysisResult,
    download,
    getData,
    reCalcute,
    timeParticleList,
    visible,
    getInfo,
    initTypeList,
    dashboardChartTypeList,
    cancelCalculate,
    cancelRequest,
    getSetting,
  }
}
