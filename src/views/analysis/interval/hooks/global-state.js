import { reactive, ref, shallowRef, watch } from 'vue'
import { intervalCalculate } from '@/api/modules/analysis'
import useTimeZoneStore from '@/store/modules/time-zone.js'
import useCancelRequest from '@/hooks/useCancelRequest.js'
import useAnalysisUtils from '@/views/analysis/hooks/useAanlysisUtils.js'
import { cloneDeep } from 'lodash-es'
import { formatDateWithWeek } from '@/utils'
import { t } from '@/locales/i18n'
import { initRanges } from '../enum.js'

export const useIntervalState = () => {
  const cancelRequest = useCancelRequest()
  const { initBeforeGetEvents } = useAnalysisUtils()

  const sidebarRef = ref(null)
  const mainRef = ref(null)
  const reportInfo = shallowRef(null)
  const timeZoneStore = useTimeZoneStore()
  const state = reactive({
    loading: false,
    title: t('analysis.analysisConditions'),
    titleTip: t('analysis.interval.analysisTips'),
    approvable: true, // 是否显示近似计算开关
    affinity: 2, // 是否开启近似计算
    reportType: 'interval',
    analysisType: 8,
    timeZone: timeZoneStore.timeZone, // 是否开启近似计算
    timeParticle: 'day',
    graphType: 8,
    dateRange: {
      diff: '1-7',
      recentDay: '1-7',
      mainName: '过去7天',
      shortcutType: 'past7Day',
    },
    groupBy: [],
    groupCheck: {
      barChecked: null,
      boxplotChecked: [],
      checkedTime: null,
      intervalType: 1, // 人数userNumData-1、次数numData-2
    },
    // 表格排序
    sortArr: {
      boxplot: [],
      bar: [],
    },
    errMessage: '',
    intervalSplit: initRanges(),
  })

  /**
   * @description 分析结果
   * @author fengsi<294068744@qq.com>
   * @date 2024-02-27 16:22:33
   */
  const initRequestData = () => ({
    analysis: {},
    cache: false,
    resultClusterSql: null,
    resultGenerateTime: null,
    sql: null,
  })
  const requestData = shallowRef(initRequestData())

  /**
   * @description: 处理日期格式转为日期(星期)
   * @return {*}
   */
  const formatDataSource = (data) => {
    const dataSource = cloneDeep(data)
    if (dataSource.analysis?.days) {
      dataSource.analysis.days = dataSource.analysis?.days.map((item) =>
        formatDateWithWeek(item)
      )
    }
    return dataSource
  }

  /**
   * @description 开始分析
   * @author fengsi<294068744@qq.com>
   * @date 2024-02-27 15:51:04
   */
  const handleIntervalAnalyse = (
    params = {},
    refresh = false,
    empty = true
  ) => {
    if (!params || Object.keys(params).length === 0) return

    const qp = { ...params }

    Reflect.deleteProperty(qp, 'groupCheck')
    Reflect.deleteProperty(qp, 'sortArr')
    state.loading = true
    state.errMessage = ''
    intervalCalculate({
      analysisType: state.analysisType,
      appId: sessionStorage.appId,
      qp,
      selectData: refresh,
      callback: cancelRequest.cancelCallBack,
    })
      .then((response) => {
        if (response.code === 200) {
          try {
            // 多语言处理 总体
            if (response?.data?.analysis?.days[0] === '总体') {
              response.data.analysis.days[0] = t('analysis.total')
            }
          } catch (error) {}
          requestData.value = formatDataSource({ ...response.data, qp })

          if (mainRef.value) {
            mainRef.value.state.status =
              response.data.analysis.days.length > 0 ? 1 : 0
          }

          if (empty) {
            state.groupCheck.barChecked = null
            state.groupCheck.boxplotChecked = []
            state.groupCheck.checkedTime = null
          }
        } else {
          state.errMessage = response.message
        }
        cancelRequest.cancelReset()
      })
      .catch(() => {
        Object.assign(requestData, initRequestData())
        if (mainRef.value) {
          mainRef.value.state.status = -1
        }
      })
      .finally(() => {
        state.loading = false
      })
  }

  watch(
    () => reportInfo.value,
    (reportInfo) => {
      if (reportInfo) {
        initBeforeGetEvents(() => {
          const qp = JSON.parse(reportInfo.qp)
          sidebarRef.value?.handleReportOrDraftPadding(qp, reportInfo.fromSave)
        })
      }
    },
    { immediate: true }
  )

  watch(
    () => [state.affinity, state.timeZone],
    ([affinity, timeZone]) => {
      timeZoneStore.timeZone = timeZone

      if (
        mainRef.value &&
        mainRef.value.state.status > -1 &&
        sidebarRef.value
      ) {
        handleIntervalAnalyse(sidebarRef.value.getRequestParams())
      }
    },
    { immediate: false }
  )

  /**
   * @description 取消计算
   */
  const cancelCalculate = () => {
    cancelRequest.cancelCalculate(() => {
      state.loading = false
      state.errMessage = t('analysis.reportCalcCanceled')
    })
  }

  const clearView = () => {
    if (mainRef.value.state.status == 1) {
      mainRef.value.state.status = 0
      state.errMessage = ''
    }
  }

  return {
    sidebarRef,
    mainRef,
    state,
    requestData,
    reportInfo,
    handleIntervalAnalyse,
    cancelCalculate,
    cancelRequest,
    clearView,
  }
}
