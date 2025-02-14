import { ref, reactive, watch, computed, shallowRef } from 'vue'
import useRetentionAnalysis from '@/views/analysis/retention/components/retention-main/hooks/useRetentionAnalysis.js'
import useTimeZoneStore from '@/store/modules/time-zone.js'
import { cloneDeep, isObject, isString } from 'lodash-es'
import { dateEnum } from '@/enumeration/date.js'

export default function (props, emits) {
  const {
    state,
    fetchRequestData,
    hasGroup,
    shoWSameTime,
    showGroupDrop,
    changeGraphType,
    valueTypeChange,
    changeDataView,
    reCallAnalysis,
    showDetailBtn,
    showDetailTable,
    changeShowType,
    exportTableData,
    showTips,
    chartTypeList,
    setDataShow,
    requestId,
    cancelFetchRequest,
    setDataVisualizationStatus,
    showCluster,
    getClusterParams,
  } = useRetentionAnalysis()

  const timeZoneStore = useTimeZoneStore()
  const disableExport = computed(() => [0, -1].includes(state.status))

  const setDate = (isMounted = false, type = '') => {
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

  function mergeQp(params, state, isMounted) {
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
          dateType: state.dateType,
          analysisPeriod: state.unitCycle.uniNum,
          keepDay: state.unitCycle.uniNum,
          analysisParticle: state.unitCycle.type,
        }
      }
      data['eventView'] = {
        ...eventView,
        ...newView,
      }
    }
    return data
  }

  async function getRequest(options = {}) {
    const { info } = props
    const { isMounted = false, refresh = false, type = '' } = options
    setDataVisualizationStatus(isMounted, info, true)
    setDate(isMounted, type)
    let qpData = JSON.parse(info.qp)
    qpData = mergeQp(qpData, state, isMounted)
    const data = {
      appId: sessionStorage.getItem('appId'),
      qp: isObject(qpData) ? { ...qpData } : {},
      selectData: refresh === true,
    }
    //看板顶部的条件筛选
    if (props?.params?.reqConditionParam?.filts?.length) {
      data.qp['conditionFilts'] = cloneDeep(props.params.reqConditionParam)
    }
    // 探索中的分组替换掉报表中的分组
    if (props?.explore && Array.isArray(props?.params?.groupBy)) {
      data.qp['groupBy'] = cloneDeep(props.params.groupBy)
    }

    try {
      await fetchRequestData({
        appId: props?.params?.appId,
        params: data.qp,
        fromReport: isMounted,
        selectData: refresh,
        isDashboard: true,
        info,
      })
    } catch (error) {
      console.log(error)
    }
  }

  const reCalculateData = async (refresh = false, val, type = '') => {
    if (type === 'unitCycle') {
      if (val.type !== val.oldType) {
        state.keyDays.days = cloneDeep(dateEnum[val.type])
      }
      if (state.unitCycle.type !== 'day') {
        state.dateType = 0
      }
    }

    if (state.status > -1) {
      await getRequest({ isMounted: false, refresh })
    }
  }

  const reSetChartView = () => {
    const { info } = props
    state.graphType = info?.graphType || 6
    setDataShow()
  }

  //type:''/date/condition/refresh/notReq/exploreCalc（点击探索里的计算按钮）
  async function getData(options = {}) {
    const { type = '' } = options
    if (type === 'notReq') {
      reSetChartView()
    } else {
      await getRequest({
        // isMounted: type !== 'exploreCalc',
        isMounted: !type,
        refresh: type === 'refresh',
        type,
      })
    }
  }

  //用于将看板的选择状态带到探索里
  const getInfo = () => {
    let info = isObject(props.info) ? cloneDeep(props.info) : {}
    info.graphType = state.graphType
    const qpData = JSON.parse(info.qp)
    let data = {
      ...qpData,
      eventView: {
        ...qpData.eventView,
        recentDay: state.dateRange.recentDay,
        startTime: state.dateRange.startTime,
        endTime: state.dateRange.endTime,
        shortcutType: state.dateRange.shortcutType,
        dateType: state.dateType,
        analysisPeriod: state.unitCycle.uniNum,
        keepDay: state.unitCycle.uniNum,
        analysisParticle: state.unitCycle.type,
      },
      showChartLabel: state.showChartLabel,
      showType: state.showType,
      cycle: state.unitCycle,
      keyDays: state.keyDays,
      onlyUserAction: state.onlyUserAction,
    }
    if (qpData?.groupCheck !== undefined) {
      const hasGroup = qpData?.groupBy?.length > 0
      const groupOptionsData =
        !hasGroup && state.showType === 2 && state.graphType === 11
          ? cloneDeep(state.loseGroupOptions)
          : cloneDeep(state.groupOptions)
      data['groupCheck'] = {
        ...qpData.groupCheck,
        ...(isObject(groupOptionsData) ? groupOptionsData : {}),
        valueType: state.valueType,
      }
    }
    info.qp = JSON.stringify(data)
    return cloneDeep(info)
  }

  const getIndexEventName = (retention = []) => {
    if (!Array.isArray(retention))
      return {
        conditionEventNames: '',
        groupEventNames: '',
        groupLimit: [],
        conditionLimit: [],
      }

    let filtersEvents = []
    for (const item of retention) {
      if (isString(item.eventName) && item.eventName) {
        filtersEvents.push(item.eventName)
      }
    }
    filtersEvents = [...new Set(filtersEvents)]

    return {
      conditionEventNames: filtersEvents.join(','),
      groupEventNames: retention?.[0]?.eventName || '',
      groupLimit: [],
      conditionLimit: [],
    }
  }

  // 看板获取全局筛选数据源的事件 eventNames 和分组数据源的事件 eventNames
  const getSetting = () => {
    let info = isObject(props.info) ? cloneDeep(props.info) : {}
    const qpData = isString(info.qp) ? JSON.parse(info.qp) : {}
    const data = getIndexEventName(qpData?.retention)
    return cloneDeep(data)
  }

  return {
    state,
    fetchRequestData,
    hasGroup,
    shoWSameTime,
    showGroupDrop,
    changeGraphType,
    valueTypeChange,
    changeDataView,
    reCallAnalysis,
    showDetailBtn,
    showDetailTable,
    changeShowType,
    exportTableData,
    showTips,
    chartTypeList,
    getData,
    reCalculateData,
    getInfo,
    requestId,
    cancelFetchRequest,
    disableExport,
    showCluster,
    getClusterParams,
    getSetting,
  }
}
