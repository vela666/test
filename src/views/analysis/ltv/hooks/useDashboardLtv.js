import { onMounted, computed } from 'vue'
import useLtvAnalysis from '@/views/analysis/ltv/components/ltv-main/hooks/useLtvAnalysis.js'
import useTimeZoneStore from '@/store/modules/time-zone.js'
import { cloneDeep, isObject, isString } from 'lodash-es'
import { dateEnum } from '@/enumeration/date.js'

export default function (props, emits) {
  const {
    state,
    fetchRequestData,
    changeGraphType,
    shoWSameTime,
    showGroupDrop,
    hasGroup,
    showDetailBtn,
    showDetailTable,
    showTips,
    showCluster,
    showChartTypeList,
    exportTableData,
    changeDataView,
    setDataShow,
    requestId,
    cancelFetchRequest,
    setDataVisualizationStatus,
    getClusterParams,
  } = useLtvAnalysis()

  const timeZoneStore = useTimeZoneStore()

  const dashboardChartTypeList = computed(() => [...showChartTypeList.value])

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
    await fetchRequestData({
      appId: props?.params?.appId,
      params: data.qp,
      fromReport: isMounted,
      selectData: refresh,
      isDashboard: true,
      info,
    })
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
        analysisParticle: state.unitCycle.type,
      },
      showChartLabel: state.showChartLabel,
      cycle: state.unitCycle,
      keyDays: state.keyDays,
      onlyUserAction: state.onlyUserAction,
    }
    if (qpData?.groupCheck !== undefined) {
      data['groupCheck'] = cloneDeep(state.groupOptions)
    }
    info.qp = JSON.stringify(data)
    return cloneDeep(info)
  }

  const getIndexEventName = (events = []) => {
    if (!Array.isArray(events))
      return {
        conditionEventNames: '',
        groupEventNames: '',
        groupLimit: [],
        conditionLimit: [],
      }

    const indexEnum = {
      source_event: 'initialEvent',
      source_user: 'initialEvent',
      return_visit: 'returnVisitEvent',
      on_init: 'initialDate',
      same_time: 'userAction',
      same_time_arithmetic: 'userAction',
    }
    // 分组事件
    let groupEvents = ''
    // 筛选事件
    let filtersEvents = []
    // 初始用户指标和同时展示需要特殊处理 initialEvent 和 userAction
    for (const item of events) {
      const type = indexEnum[item.type]
      if (type === 'initialEvent') {
        // 判断初始用户的分析指标是事件还是用户属性
        const isUserAttr = item.type === 'source_user'
        groupEvents = isUserAttr ? '' : item.eventName
        if (!isUserAttr) {
          filtersEvents.push(item.eventName)
        }
      } else if (type === 'userAction') {
        if (item.type !== 'same_time_arithmetic') {
          // 判断是否是自定义指标
          if (Array.isArray(item?.customIndex)) {
            for (const data of item.customIndex) {
              filtersEvents.push(data.eventName)
            }
          } else {
            filtersEvents.push(item.eventName)
          }
        }
      } else {
        // 判断是否是自定义指标
        if (Array.isArray(item?.customIndex)) {
          for (const data of item.customIndex) {
            filtersEvents.push(data.eventName)
          }
        } else {
          filtersEvents.push(item.eventName)
        }
      }
    }
    filtersEvents = [...new Set(filtersEvents)]

    return {
      // 用于探索里获取条件的请求参数
      conditionEventNames: filtersEvents.join(','),
      // 用于探索里获取分组的请求参数
      groupEventNames: groupEvents,
      // 用于删除条件分组如事件/用户属性等
      groupLimit: [groupEvents === '' ? 'eventField' : ''],
      conditionLimit: [groupEvents === '' ? 'eventField' : ''],
    }
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
    changeGraphType,
    shoWSameTime,
    showGroupDrop,
    hasGroup,
    showDetailBtn,
    showDetailTable,
    showTips,
    showCluster,
    dashboardChartTypeList,
    exportTableData,
    reCalculateData,
    changeDataView,
    getData,
    getInfo,
    requestId,
    cancelFetchRequest,
    disableExport,
    getClusterParams,
    getSetting,
  }
}
