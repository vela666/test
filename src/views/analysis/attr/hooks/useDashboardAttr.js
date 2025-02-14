import { nextTick, computed, watch, reactive } from 'vue'
import { calculateUserProps } from '@/api/modules/analysis/attr.js'
import { getFieldInfo } from '@/api/modules/analysis/common.js'
import { useAnalysisResult } from './analysisResultHooks'
import { isEmpty, cloneDeep } from 'lodash-es'
import useTimeZoneStore from '@/store/modules/time-zone'
import {
  chartTypeMap,
  graphTypeMap,
} from '@/views/analysis/components/AnalysisMain/index'
import useCancelRequest from '@/hooks/useCancelRequest.js'
import { t } from '@/locales/i18n'

/**
 * @description: 看板--用户分析
 * @return {*}
 * @param {*} props
 */
export function useAttrDashBoardHooks(props) {
  const cancelRequest = useCancelRequest()
  const {
    analysisResult,
    chartTypeList,
    chartType,
    isUserCluster,
    getEchartsData,
    groupSortChange,
  } = useAnalysisResult()

  const useTimeZone = useTimeZoneStore()

  const miniInfo = reactive({
    numDesc: '',
    num: '',
    unit: '',
  })

  const dashboardChartTypeList = computed(() => [
    ...chartTypeList.value,
    {
      value: 'table',
      title: t('chart.dataTable'),
      icon: 'chart-table',
      graphType: 6,
    },
  ])

  /**
   * @description: 格式化图表类型选择
   * @return {*}
   */
  const initTypeList = computed(() => {
    const chartList = []
    dashboardChartTypeList.value.forEach((item) => {
      chartList.push({
        ...item,
        value: item.graphType,
      })
    })

    return chartList
  })

  /**
   * @description: 开始计算
   * @return {*}
   * @param {object} type  请求的类型
   */
  function getData(info = {}) {
    const { type } = info
    if (type === 'notReq') {
      if (props?.info?.graphType) {
        chartType.value = graphTypeMap.get(props.info.graphType)
      }
      return
    }
    analysisResult.loading = true

    const qp = getRequestParams(type)
    analysisResult.errMessage = ''
    return new Promise((resolve) => {
      calculateUserProps({
        appId: props?.params?.appId,
        qp,
        selectData: type === 'refresh',
        callback: cancelRequest.cancelCallBack,
      })
        .then((res) => {
          if (res.code === 200) {
            if (analysisResult.sortType) {
              qp.sortType = analysisResult.sortType
            }
            getEchartsData(
              res.data,
              qp.groupBy,
              qp,
              type
                ? chartTypeMap.get(chartType.value)[0].graphType
                : props.info?.graphType
            )

            if (!props.explore) initMiniChart()
          } else {
            analysisResult.errMessage = res.message
          }
          cancelRequest.cancelReset()
          resolve()
        })
        .finally(() => {
          analysisResult.loading = false
        })
    })
  }

  /**
   * @description: 格式化请求参数
   * @return {*}
   */
  function getRequestParams() {
    const qp = props.info.qp ? JSON.parse(props.info.qp) : {}
    const reqConditionParam = props?.params?.reqConditionParam
    const newQp = {
      ...qp,
      timeZone: useTimeZone.timeZone,
      groupBy: props?.params?.groupBy || qp.groupBy,
    }

    if (!isEmpty(reqConditionParam)) newQp.conditionFilts = reqConditionParam

    analysisResult.dataQp = newQp

    return newQp
  }

  /**
   * @description: 数据导出
   * @return {*}
   */
  const exportData = () => {
    analysisResult.tableRef?.download()
  }

  /**
   * @description: 设置小图显示: 无分组，无对比情况
   * @return {*}
   */
  const initMiniChart = async () => {
    const { info } = props
    let qp = JSON.parse(info.qp)

    if (!qp.groupBy.length && !qp.userCrowds.length) {
      if (!qp.events.propertyName && qp.events.analysis === 'A01') {
        // 用户数默认单位：人
        miniInfo.unit = t('analysis.event.people')
      } else if (qp.events.propertyName) {
        const res = await getFieldInfo({
          fieldName: qp.events.propertyName,
          tableType: 1,
        })
        if (res.code === 200 && res.data) {
          miniInfo.unit = res.data.fUnit || ''
        }
      } else {
        miniInfo.unit = ''
      }

      miniInfo.numDesc = analysisResult.chartData.dataList[0].groupCols[0]
      miniInfo.num = analysisResult.chartData.dataList[0].values

      analysisResult.isMini = true // 是否可以设置为小图
    } else {
      analysisResult.isMini = false
    }
  }

  /**
   * @description: 探索的参数
   * @return {*}
   */
  const getInfo = () => {
    const info = cloneDeep(props.info) ?? {}
    info.graphType = chartTypeMap.get(chartType.value)[0]?.graphType
    const qp = JSON.parse(info.qp)
    qp.sortArr = analysisResult.sortArr
    qp.sortType = analysisResult.sortType
    info.qp = JSON.stringify(qp)
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

  return {
    analysisResult,
    miniInfo,
    chartType,
    chartTypeList,
    dashboardChartTypeList,
    initTypeList,
    isUserCluster,
    getData,
    exportData,
    getInfo,
    cancelCalculate,
    groupSortChange,
    cancelRequest,
  }
}
