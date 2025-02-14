import { reactive, computed, watch, shallowRef, ref, nextTick } from 'vue'
import {
  getActualWidthOfChars,
  thousandsFilter,
  formatDateWithWeek,
} from '@/utils'
import { cloneDeep, intersectionBy, isObject, isString } from 'lodash-es'
import useEventAnalysis from '@/views/analysis/event/hooks/useEventAnalysis.js'
import { eventCalculate } from '@/api/modules/analysis/index.js'
import { getFieldInfo } from '@/api/modules/analysis/common.js'
import useOperate from '@/components/PropsFilter/useOperate'
import useTimeZoneStore from '@/store/modules/time-zone.js'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import { getIndexEventName } from '@/views/analysis/hooks/utils'
import { t } from '@/locales/i18n'

const initCompareData = () => ({
  num: '-',
  numDesc: '',
  summary: '-',
  avg: '-',
  tongbi: null,
  tongbiDesc: '',
  huanbi: null,
  huanbiDesc: '',
  unit: '',
})

const getCompareRate = (num1, num2) => {
  if (num1 === '-' || num2 === '-' || (num1 == 0 && num2 == 0)) {
    return null
  }
  if (num1 === 0) {
    return num2 > num1 ? '100%' : '-100%'
  }
  return (((num2 - num1) / num1) * 100).toFixed(1) + '%'
}

export default function ({ props, emits, resTableRef }) {
  const {
    state,
    groupSortChange,
    showChartTypeList,
    diffCalculation,
    clearTableAndChart,
    setEventSelect,
    setGroupSelect,
    setTable,
    setChart,
    dataCache,
    dataChartCache,
    chartTypeLimit,
    eventCheckChange,
    changeTableType,
    exportTableData,
    showCluster,
    resetTableRow,
    qpCache,
    getClusterParams,
    showEventDetail,
    getEventDetailParams,
    requestId,
    cancelCallBack,
    cancelReset,
    cancelFetchRequest,
  } = useEventAnalysis({ resTableRef })

  const { parseFilterData } = useOperate()
  const timeZoneStore = useTimeZoneStore()

  const dashboardChartTypeList = computed(() => [
    { value: 6, title: t('chart.dataTable'), icon: 'chart-table' },
    ...showChartTypeList.value,
  ])

  const dashboardChartTypeLimit = computed(() => [6, ...chartTypeLimit.value])
  const showRateLabel = computed(
    () => dashboardState.mini && state.graphType === 1 && !props.explore
  )
  const dashboardState = reactive({
    descMsg: t('common.noData'),
    compareData: initCompareData(),
    mini: false,
  })
  const loading = ref(false)

  const dashboardResetChartType = () => {
    if (!dashboardChartTypeLimit.value.includes(state.graphType)) {
      state.graphType = dashboardChartTypeLimit.value[0]
    }
  }

  const disableExport = computed(() => [0, -1].includes(state.viewStatus))

  const hasTableData = ref(false)

  function getWeekDesc(desc) {
    let text = ''
    const isValid = dayjs(desc).isValid()
    if (isValid) {
      return `${desc}`
    }
    return text
  }

  // 是否可以显示小图: 只有一个指标（无分组、无事件拆分、无时间对比）
  async function canSetMiniView() {
    const { info } = props
    let qp = JSON.parse(info.qp)
    if (
      !(qp.eventView.versus && qp.eventView.versus.length) &&
      qp.events.length === 1 &&
      !qp.groupBy.length &&
      (!qp.eventSplit ||
        (qp.eventSplit && JSON.stringify(qp.eventSplit) === '{}') ||
        (Array.isArray(qp.eventSplit) && qp.eventSplit.length === 0))
    ) {
      dashboardState.mini = true
      if (
        !qp.events[0].propertyName &&
        (qp.events[0].analysis === 'A00' || qp.events[0].analysis === 'A02')
      ) {
        // 总次数、人均次数 默认单位：次
        dashboardState.compareData.unit = t('analysis.event.times')
      } else if (
        !qp.events[0].propertyName &&
        qp.events[0].analysis === 'A01'
      ) {
        // 触发用户数默认单位：人
        dashboardState.compareData.unit = t('analysis.event.people')
      } else if (qp.events[0].propertyName) {
        try {
          const res = await getFieldInfo({
            appId: sessionStorage.getItem('appId'),
            fieldName: qp.events[0].propertyName,
            tableType: 0,
          })
          if (res.code === 200 && res.data) {
            dashboardState.compareData.unit = res.data?.fUnit ?? ''
          }
        } catch (error) {
          //
        }
      } else {
        dashboardState.compareData.unit = ''
      }
    }
  }

  // 设置日期、时间粒度（按天...）、图表展示类型、echart是否展示数值、分组排列顺序、表格数据展示类型
  function setDataVisualizationStatus(info, isMounted = false) {
    const qp = JSON.parse(info.qp)
    if (!qp || !isMounted) return
    state.showChartLabel = qp.showChartLabel
    state.graphType = info?.graphType || 6
    state.tableType = qp?.tableType || 1
    state.particleType = { particle: qp?.eventView?.timeParticle || 'day' }
    state.versus = Array.isArray(qp?.eventView?.versus)
      ? qp.eventView.versus
      : []
    state.sortArr = Array.isArray(qp?.sortArr) ? qp.sortArr : []
  }

  // 重新赋值qp
  const mergeQp = (params, state, isMounted = false) => {
    if (!isObject(params)) return params
    const eventView = cloneDeep(params?.eventView)
    const data = {
      ...params,
    }
    if (isObject(eventView)) {
      let newView = {
        recentDay: state.dateRange.recentDay,
        startTime: state.dateRange.startTime,
        endTime: state.dateRange.endTime,
        shortcutType: state.dateRange.shortcutType,
        timeZone: timeZoneStore.timeZone ?? '8',
      }
      if (!isMounted) {
        newView = {
          ...newView,
          timeParticle: state.particleType.particle,
          // vs对比
          versus: Array.isArray(state.versus) ? state.versus : [],
        }
      }
      data['eventView'] = {
        ...eventView,
        ...newView,
      }
    }
    return data
  }

  // 设置时间选择
  const setDateRange = (isMounted = false, type = '') => {
    if (isMounted || type === 'date') {
      if (props?.params?.dateRange?.date?.length) {
        state.dateRange = cloneDeep(props.params.dateRange)
      } else {
        const { info } = props
        const qp = JSON.parse(info.qp)
        if (!qp) return
        state.dateRange = {
          diff: qp?.eventView?.recentDay || '',
          recentDay: qp?.eventView?.recentDay || '',
          mainName: '',
          shortcutType: qp?.eventView?.shortcutType ?? '',
          startTime: qp?.eventView?.startTime,
          endTime: qp?.eventView?.endTime,
        }
      }
    }
  }

  /**
   * @description: 处理日期格式转为日期(星期)
   * @return {*}
   */
  const formatDataSource = (data) => {
    const dataSource = cloneDeep(data)
    if (dataSource.x) {
      dataSource.x = dataSource.x.map((item) => formatDateWithWeek(item))
    }
    return dataSource
  }

  //请求获取数据
  const fetchRequestData = async (options = {}) => {
    const { isMounted = false, refresh = false, type = '' } = options
    const { info } = props

    setDataVisualizationStatus(info, isMounted)
    setDateRange(isMounted, type)

    let qpData = JSON.parse(info.qp)
    qpData = mergeQp(qpData, state, isMounted)
    const data = {
      appId: props?.params?.appId || sessionStorage.getItem('appId'),
      qp: isObject(qpData) ? { ...qpData } : {},
      selectData: refresh,
      callback: cancelCallBack,
    }
    //看板顶部的条件筛选
    if (props?.params?.reqConditionParam?.filts?.length) {
      data.qp['conditionFilts'] = cloneDeep(props.params.reqConditionParam)
    }
    // 探索中的分组替换掉报表中的分组
    if (props?.explore && Array.isArray(props?.params?.groupBy)) {
      data.qp['groupBy'] = cloneDeep(props.params.groupBy)
    }
    //兼容1.0的事件拆分
    if (!data?.qp?.['eventSplit']) {
      data.qp['eventSplit'] = []
    } else if (
      data?.qp?.['eventSplit'] &&
      !Array.isArray(data.qp['eventSplit'])
    ) {
      data.qp['eventSplit'] = [cloneDeep(data.qp['eventSplit'])]
    }
    clearTableAndChart()
    const dateObjArr = [state.dateRange, ...state.versus]
    if (
      state.particleType.particle === 'hour' &&
      dateObjArr.some(
        (el) => dayjs(el?.endTime).diff(dayjs(el?.startTime), 'day') > 3
      )
    ) {
      dashboardState.descMsg = t('common.noData')
      state.viewStatus = 0
      ElMessage.warning(t('analysis.event.checkHourly'))
      return
    }
    loading.value = true
    try {
      const res = await eventCalculate(data)
      if (res.code === 200) {
        state.resultGenerateTime = res?.data.resultGenerateTime
        state.sqlList = res?.data.sql
        state.limit = res?.data.limit ?? false
        if (
          Object.keys(res?.data?.analysis).length &&
          res?.data?.analysis?.y?.length
        ) {
          state.viewStatus = 1
          setDataVisualization(formatDataSource(res.data.analysis), info)
        } else {
          dashboardState.descMsg = t('common.noData')
          state.viewStatus = 0
        }
      } else {
        dashboardState.descMsg = res?.message || t('common.noData')
        state.viewStatus = 0
      }
      loading.value = false
      cancelReset()
    } catch (error) {
      console.log(error)
      state.viewStatus = 0
      loading.value = false
    }
  }

  //设置事件选中
  /*
  const setDashboardEventSelect = (qp) => {
    const eventName = dataCache.value.y.map((item) => item.eventName)
    state.eventCheckOptions = eventName
    state.eventCheckList = []
    const isExplore = props?.explore === true

    if (isExplore && Array.isArray(qp?.eventCheckList)) {
      state.eventCheckList = cloneDeep(qp.eventCheckList)
    } else {
      state.eventCheckList = intersectionBy(
        eventName,
        cloneDeep(qp.eventCheckList)
      )
    }
  }
*/

  // 设置数据展示
  const setDataVisualization = (res, info) => {
    dataCache.value = cloneDeep(res)
    dataChartCache.value = cloneDeep(res)
    const qp = JSON.parse(info.qp)
    qpCache.value = cloneDeep(qp)
    // setDashboardEventSelect(qp)
    setEventSelect(true, qp)
    setGroupSelect(true, qp)
    setCompareRate()
    nextTick(() => {
      setDataShow()
    })
  }

  //只有一个指标（无分组、无事件拆分、无时间对比）数据同比、环比
  // 环比: 与前一天比较,  同比: 与上一周某一天（比如：当前周二 与上一周的周二比较）
  function setCompareRate() {
    if (!dashboardState.mini || props.explore) return
    const unit = dashboardState.compareData.unit
    dashboardState.compareData = { ...initCompareData(), unit }
    const resData = cloneDeep(dataCache.value)
    const xData = resData?.x
    const showData = resData?.y?.[0]?.item?.[0]?.values
    if (!Array.isArray(showData)) return
    const len = showData.length
    const num = showData[len - 1] ?? '-'
    dashboardState.compareData.num = thousandsFilter(num)
    dashboardState.compareData.numDesc = xData?.[len - 1]
      ? getWeekDesc(xData[len - 1])
      : ''

    const qp = JSON.parse(props?.info?.qp)
    if (state.particleType.particle === 'day') {
      //环比数据
      const huanbiNum = showData[len - 2] ?? '-'
      dashboardState.compareData.huanbi = getCompareRate(huanbiNum, num)
      dashboardState.compareData.huanbiDesc = getWeekDesc(xData[len - 2])
      // 同比数据
      const tongbiNum = showData[len - 8] ?? '-'
      dashboardState.compareData.tongbi = getCompareRate(tongbiNum, num)
      dashboardState.compareData.tongbiDesc = getWeekDesc(xData[len - 8])
    }
    //合计数据
    const totalNum = showData.reduce((acc, cur) => acc + cur, 0)
    dashboardState.compareData.summary = thousandsFilter(
      String(totalNum).indexOf('.') > -1
        ? Number(totalNum.toFixed(2))
        : totalNum
    )
    //均值数据
    dashboardState.compareData.avg = thousandsFilter(
      Number((totalNum / len).toFixed(2))
    )
  }

  const setDataShow = () => {
    dashboardResetChartType()
    if (state.graphType === 6) {
      hasTableData.value = true
      setTable()
    } else {
      setChart()
    }
  }

  const reCalculateData = async (refresh = false) => {
    if (state.viewStatus > -1) {
      await fetchRequestData({ isMounted: false, refresh })
    }
  }

  const chartTypeChange = () => {
    reSetDataview()
  }

  const reSetDataview = () => {
    if (state.viewStatus > 0) {
      setDataShow()
    }
  }

  // 导出表格数据
  const toExportData = () => {
    if (!hasTableData.value) {
      setTable()
    }
    const { info } = props
    exportTableData(info)
  }

  // 重新设置图表类型并渲染
  const reSetChartType = () => {
    const { info } = props
    state.graphType = info?.graphType || 6
    reSetDataview()
  }

  //type:''/date/condition/refresh/notReq/exploreCalc（点击探索里的计算按钮）
  async function getData(options = {}) {
    const { type = '' } = options
    if (!props.explore) {
      await canSetMiniView()
      // 初始进入时判断当报表中的w=3时，是否能设置小图
      if (!dashboardState.mini && props.w === 3 && !type) {
        emits?.('updReportSet', {
          businessId: props?.info?.businessId,
          viewSizeType: 2,
        })
      }
    }

    if (type === 'notReq') {
      reSetChartType()
    } else {
      await fetchRequestData({
        // isMounted: type !== 'exploreCalc',
        isMounted: !type,
        refresh: type === 'refresh',
        type,
      })
    }
  }

  const getInfo = () => {
    let info = isObject(props.info) ? cloneDeep(props.info) : {}
    info.graphType = state.graphType
    const qpData = JSON.parse(info.qp)

    let data = {
      ...qpData,
      eventView: {
        ...qpData.eventView,
        timeParticle: state.particleType.particle,
        recentDay: state.dateRange.recentDay,
        startTime: state.dateRange.startTime,
        endTime: state.dateRange.endTime,
        shortcutType: state.dateRange.shortcutType,
        graphType: state.graphType,
        // vs对比
        versus: Array.isArray(state.versus) ? state.versus : [],
      },
      showChartLabel: state.showChartLabel,
    }
    const hasSplit = isObject(qpData?.eventSplit)
      ? Object.keys(qpData.eventSplit).length > 0
      : qpData?.eventSplit?.length > 0
    if (hasSplit || qpData?.groupBy?.length > 0) {
      data = {
        ...data,
        groupSort: state.sortType,
        groupCheck: cloneDeep(state.groupOptions),
      }
    }
    if (state.eventCheckList) {
      data['eventCheckList'] = cloneDeep(state.eventCheckList)
    }
    info.qp = JSON.stringify(data)
    return cloneDeep(info)
  }

  // 看板获取全局筛选数据源的事件 eventNames 和分组数据源的事件 eventNames
  const getSetting = () => {
    let info = isObject(props.info) ? cloneDeep(props.info) : {}
    const qpData = isString(info.qp) ? JSON.parse(info.qp) : {}
    const data = getIndexEventName(qpData?.events)
    return cloneDeep(data)
  }

  return {
    state,
    dataCache,
    dashboardState,
    groupSortChange,
    dashboardChartTypeList,
    diffCalculation,
    loading,
    reCalculateData,
    chartTypeChange,
    eventCheckChange,
    changeTableType,
    showRateLabel,
    getData,
    reSetDataview,
    toExportData,
    getInfo,
    showCluster,
    resetTableRow,
    getClusterParams,
    showEventDetail,
    getEventDetailParams,
    requestId,
    cancelFetchRequest,
    disableExport,
    getSetting,
  }
}
