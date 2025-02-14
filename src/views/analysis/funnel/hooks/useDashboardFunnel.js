import { ref, toRefs } from 'vue'
import { useFunnelResultHooks } from '@/views/analysis/funnel/hooks/funnelResultHooks.js'
import useTimeZoneStore from '@/store/modules/time-zone'
import { calculateFunnel } from '@/api/modules/analysis/funnel'
import { isEmpty, cloneDeep, isObject, isString } from 'lodash-es'
import {
  chartTypeMap,
  graphTypeMap,
} from '@/views/analysis/components/AnalysisMain/index.js'
import useCancelRequest from '@/hooks/useCancelRequest.js'
import { getIndexEventName } from '@/views/analysis/hooks/utils'
import { t } from '@/locales/i18n'

export default function (props, emits) {
  const cancelRequest = useCancelRequest()

  const {
    analysisResult,
    chartTypeList,
    chartType,
    getStepTitle,
    stepStart,
    stepEnd,
    onDatazoom,
    renderChartData,
    handleStepChange,
    getEchartsData,
    download,
    echoGlobalFilters,
    initTypeList,
    dashboardChartTypeList,
    dashboardStepLabelWidth,
  } = useFunnelResultHooks(props)

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

      analysisResult.steps = qp?.steps || [0]
      analysisResult.funnelType = qp?.funnelType || 'cover'
      analysisResult.groupCheck = qp?.groupCheck
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
    }

    if (props?.params?.groupBy?.length) {
      newQp.groupBy = cloneDeep(props.params.groupBy)
    }

    if (type) {
      newQp.sortArr = analysisResult.sortArr
    }

    if (!isEmpty(reqConditionParam)) newQp.conditionFilts = reqConditionParam

    newQp.events = newQp.events.map((item) => {
      item.eventNameDisplay = item.eventNameDisplay || item.eventDesc
      return item
    })

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
      if (props?.info?.graphType) {
        chartType.value = graphTypeMap.get(props.info.graphType)
      }
      //
    } else {
      analysisResult.loading = true
      const qp = getRequestParams(type)
      analysisResult.errMessage = ''
      try {
        const res = await calculateFunnel({
          appId: props?.params?.appId,
          qp,
          selectData: type === 'refresh',
          callback: cancelRequest.cancelCallBack,
        })
        if (res.code === 200) {
          getEchartsData(
            res.data,
            qp,
            type
              ? chartTypeMap.get(chartType.value)[0].graphType
              : props.info?.graphType,
            type || 'detail'
          )
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

  const reCalcute = async (flag) => {
    await getData({ type: flag ? 'refresh' : 'reCalcute' })
  }

  /**
   * @description: 探索的参数
   * @return {*}
   */
  const getInfo = () => {
    const info = cloneDeep(props.info) ?? {}
    const qp = getRequestParams('explore')
    qp.steps = analysisResult.steps
    qp.funnelType = analysisResult.funnelType
    qp.groupCheck = analysisResult.groupCheck
    info.qp = JSON.stringify(qp)
    info.graphType = chartTypeMap.get(chartType.value)[0].graphType
    return info
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
    chartTypeList,
    chartType,
    getStepTitle,
    stepStart,
    stepEnd,
    onDatazoom,
    renderChartData,
    handleStepChange,
    download,
    echoGlobalFilters,
    getData,
    reCalcute,
    getInfo,
    initTypeList,
    dashboardChartTypeList,
    dashboardStepLabelWidth,
    cancelCalculate,
    cancelRequest,
    getSetting,
  }
}
