import { ref, toRefs } from 'vue'
import useResultHooks from './resultHooks.js'
import useTimeZoneStore from '@/store/modules/time-zone'
import { isEmpty, cloneDeep, isObject, isString } from 'lodash-es'
import { attributedCalcute } from '@/api/modules/analysis/attributed.js'
import useCancelRequest from '@/hooks/useCancelRequest.js'
import { getIndexEventName } from '@/views/analysis/hooks/utils'
import { t } from '@/locales/i18n'

export default function (props, emits) {
  const cancelRequest = useCancelRequest()

  const {
    analysisResult,
    download,
    visible,
    renderTable,
    initTypeList,
    dashboardChartTypeList,
  } = useResultHooks(emits, props)

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
        diff: qp.eventView?.recentDay || '',
        recentDay: qp.eventView?.recentDay || '',
        mainName: '',
        shortcutType: qp.eventView?.shortcutType ?? '',
        startTime: qp.eventView?.startTime,
        endTime: qp.eventView?.endTime,
      }

      initFlag.value = false
    }

    if (!type || type === 'date') {
      if (props?.params?.dateRange?.date?.length) {
        analysisResult.dateRange = cloneDeep(props.params.dateRange)
      } else {
        if (!qp) return
        analysisResult.dateRange = {
          diff: qp.eventView?.recentDay || '',
          recentDay: qp.eventView?.recentDay || '',
          mainName: '',
          shortcutType: qp.eventView?.shortcutType ?? '',
          startTime: qp.eventView?.startTime,
          endTime: qp.eventView?.endTime,
        }
      }
    }

    const { shortcutType, endTime, startTime, recentDay, diff } = toRefs(
      analysisResult.dateRange
    )

    const newQp = {
      ...qp,
      eventView: {
        timeZone: useTimeZone.timeZone,
        startTime: startTime.value,
        endTime: endTime.value,
        recentDay: recentDay.value,
        shortcutType: shortcutType.value,
        diff: diff.value,
      },
    }

    if (type) {
      newQp.sortArr = analysisResult.sortArr
    }

    /* if (props?.params?.groupBy?.length) {
      newQp.groupBy = cloneDeep(props.params.groupBy)
    }

    newQp.groupBy = cloneDeep(newQp.groupBy).map((item) => {
      item.propertyRangeType =
        item.propertyRangeType === 1 ? 2 : item.propertyRangeType
      return item
    })*/

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
        const res = await attributedCalcute({
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
    return cloneDeep(qpData)
  }

  return {
    analysisResult,
    download,
    getData,
    reCalcute,
    visible,
    getInfo,
    initTypeList,
    dashboardChartTypeList,
    cancelCalculate,
    cancelRequest,
    getSetting,
  }
}
