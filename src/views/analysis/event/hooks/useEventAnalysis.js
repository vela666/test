import { reactive, computed, watch, shallowRef, ref, nextTick } from 'vue'
import {
  getActualWidthOfChars,
  thousandsFilter,
  formatDateWithWeek,
} from '@/utils'
import { cloneDeep, intersectionBy } from 'lodash-es'
import { eventCalculate } from '@/api/modules/analysis/index.js'
import {
  chartTypeList,
  formatJson,
  stageExportByDate,
  stageExportByEventAndGrounp,
  diffCalculation,
  initOptions,
  delimiter,
} from '@/views/analysis/hooks/utils.js'
import { analysisExcel, exportToExcel } from '@/utils/excel.js'
import useDataChart from './useDataChart.js'
import useDataTable from './useDataTable.js'
import useTimeZoneStore from '@/store/modules/time-zone.js'
import useCancelRequest from '@/hooks/useCancelRequest.js'
import { recordBehavior } from '@/utils/record-behavior.js'
import { reportTypeListMap } from '@/enumeration/report.js'
import { t } from '@/locales/i18n.js'

export default function ({ eventSidebarRef, resTableRef }) {
  const state = reactive({
    columnList: [],
    tableData: [],
    options: initOptions(),
    pieOptionData: [],
    unionGroups: [],
    groupOptions: {
      customNum: 15,
      defaultGroupNum: 15,
      groupCheckAll: true,
      groupCheckList: [],
    },
    eventCheckOptions: [],
    eventCheckList: [],
    sortType: 'descend',
    showChartLabel: false,
    graphType: 1,
    tableType: 1,
    dateRange: {
      diff: '1-7',
      recentDay: '1-7',
      mainName: '过去7天',
      shortcutType: 'past7Day',
    },
    versus: [],
    // 已选阶段下标 图表
    selectedStageChartIndex: [],
    // 已选阶段下标 表格 默认第二阶段
    selectedStageTableIndex: 1,
    particleType: { particle: 'day' },
    filterGroupsOptions: [],
    filterGroups: '',
    filterGroupsValue: '',
    selectInnerWidth: '85px',
    viewStatus: -1,
    sqlList: '',
    dataDesc: '',
    noticeFlag: false,
    resultGenerateTime: '',
    descMsg: t('analysis.startAnalysisTips'),
    approxVal: 2,
    sortArr: [],
  })

  const timeZoneStore = useTimeZoneStore()
  const loading = ref(false)
  const reportInfo = shallowRef(null)
  const dataCache = shallowRef({})
  const dataChartCache = shallowRef({})
  const qpCache = shallowRef(null)
  const { requestId, cancelCallBack, cancelCalculate, cancelReset } =
    useCancelRequest()

  //报表事件组件、对比组件、报表类型等反显
  watch(reportInfo, (val) => {
    if (val?.qp) {
      const data = JSON.parse(val.qp)
      setDataVisualizationStatus(true, data)
    }
  })

  //echart 图表展示
  const {
    groupComparator,
    setLineOrAreaChart,
    setTotalBarChart,
    setBarChart,
    setPieChart,
    setStackBarChart,
    trendAndCumulative,
    distributed,
  } = useDataChart(state, dataChartCache, dataCache)

  //表格数据展示
  const { totalDate, tableByEvent, tableByGroup, tableByDate } = useDataTable(
    state,
    dataCache,
    qpCache
  )

  watch(
    () => state.filterGroups,
    (val) => {
      state.selectInnerWidth = val
        ? `${
            getActualWidthOfChars(val, {
              size: 14,
              family: 'Microsoft YaHei',
            }) + 55
          }px`
        : '85px'
    }
  )

  const chartTypeLimit = computed(() => {
    let limit = [1, 2, 3]
    if (state.versus.length) {
      limit = [1, 2, 3]
      if (state.particleType.particle === 'summary') {
        limit = [3]
      }
    } else {
      limit = [1, 7, 2, 3]
      if (state.particleType.particle === 'summary') {
        limit = [3]
        if (state.unionGroups.length) {
          limit = [3, 5]
        }
      } else {
        if (state.unionGroups.length) {
          limit = [1, 4, 7, 2, 3, 5]
        } else {
          if (state.eventCheckOptions.length > 1) {
            limit = [1, 4, 7, 2, 3]
          }
        }
      }
    }
    return [...limit]
  })

  const showChartTypeList = computed(() => {
    return [
      ...chartTypeList.filter((item) =>
        chartTypeLimit.value.includes(item.value)
      ),
    ]
  })

  const analysisData = (type = '') => {
    if (state.viewStatus > -1) {
      eventSidebarRef?.value?.startAnalysis(false, type === 'refresh')
    }
  }

  const clearTableAndChart = () => {
    state.columnList = []
    state.tableData = []
    state.options = initOptions()
  }

  const resetChartType = () => {
    if (!chartTypeLimit.value.includes(state.graphType)) {
      state.graphType = chartTypeLimit.value[0]
    }
  }

  //设置展示数据
  const getEchartsData = (res, fromReport, paramsQp) => {
    dataCache.value = cloneDeep(res)
    dataChartCache.value = cloneDeep(res)
    let qp = null
    if (fromReport) {
      qp = reportInfo.value?.qp ? JSON.parse(reportInfo.value.qp) : null
      if (qp.eventSplit && !Array.isArray(qp.eventSplit)) {
        // 兼容1.0单个拆分为对象情况
        qp.eventSplit = [qp.eventSplit]
      }
      qpCache.value = cloneDeep(qp)
    } else {
      qpCache.value = cloneDeep(paramsQp)
    }
    setDataVisualizationStatus(fromReport, qp)
    setEventSelect(fromReport, qp)
    setGroupSelect(fromReport, qp)
    setTableFilterGroups()
    resetChartType()
    nextTick(() => {
      setTable()
      setChart()
    })
  }

  /**
   * @description 取消计算
   */
  const cancelFetchRequest = () => {
    cancelCalculate(() => {
      state.viewStatus = 0
      state.descMsg = t('analysis.reportCalcCanceled')
      loading.value = false
    })
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

  const fetchRequestData = async (options = {}) => {
    const { params, fromReport, selectData } = options
    const data = {
      appId: sessionStorage.getItem('appId'),
      qp: { ...params },
      selectData,
      callback: cancelCallBack,
    }
    loading.value = true
    clearTableAndChart()
    try {
      const res = await eventCalculate(data)
      if (res.code === 200) {
        state.resultGenerateTime = res?.data?.resultGenerateTime
        state.sqlList = res?.data?.sql
        state.dataDesc = res?.data?.analysis?.dataDesc || ''
        state.noticeFlag = true
        if (
          Object.keys(res?.data?.analysis).length &&
          res?.data?.analysis?.y?.length
        ) {
          state.viewStatus = 1
          getEchartsData(
            formatDataSource(res.data.analysis),
            fromReport,
            data.qp
          )
        } else {
          state.descMsg = t('common.noData')
          state.viewStatus = 0
        }
      } else {
        state.descMsg = res?.message || t('common.noData')
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

  // 设置日期、时间粒度（按天...）、图表展示类型、echart是否展示数值、分组排列顺序、表格数据展示类型
  function setDataVisualizationStatus(fromReport, qp) {
    if (!fromReport || !qp) return
    state.approxVal = qp?.affinity || 2
    if (qp?.eventView?.timeZone) {
      timeZoneStore.timeZone = qp.eventView.timeZone
    }
    state.showChartLabel = qp.showChartLabel
    state.graphType = qp?.eventView?.graphType || 1
    state.tableType = qp?.tableType || 1
    state.sortArr = Array.isArray(qp?.sortArr) ? qp.sortArr : []
    state.dateRange = {
      diff: qp?.eventView?.recentDay || '',
      recentDay: qp?.eventView?.recentDay || '',
      mainName: '',
      shortcutType: qp?.eventView?.shortcutType ?? '',
      startTime: qp?.eventView?.startTime,
      endTime: qp?.eventView?.endTime,
    }
    state.particleType = { particle: qp?.eventView?.timeParticle || 'day' }
    state.versus = Array.isArray(qp?.eventView?.versus)
      ? qp.eventView.versus
      : []
  }

  //设置事件选中
  const setEventSelect = (fromReport, qp) => {
    const eventName = dataCache.value.y.map((item) => item.eventName)
    state.eventCheckOptions = eventName
    state.eventCheckList = eventName
    if (fromReport && qp?.eventCheckList) {
      // 包含相同的防止左侧没有
      state.eventCheckList = intersectionBy(
        eventName,
        cloneDeep(qp.eventCheckList)
      )
    }
  }

  // 设置分组选中
  const setGroupSelect = (fromReport, qp) => {
    const data = cloneDeep(dataCache.value)
    let unionGroups = []
    if (Array.isArray(data.unionGroups)) {
      unionGroups = [...data.unionGroups]
    }
    state.unionGroups = unionGroups
    if (state.unionGroups.length) {
      if (fromReport) {
        state.sortType = qp?.groupSort ?? 'descend'
        if (qp?.groupCheck) {
          state.groupOptions = cloneDeep(qp.groupCheck)
        } else {
          setDefaultGroupOptions(state.unionGroups)
        }
      } else {
        setDefaultGroupOptions(state.unionGroups)
      }
    }
  }

  const setDefaultGroupOptions = (unionGroups = []) => {
    state.groupOptions.groupCheckList = unionGroups.slice(
      0,
      state.groupOptions.customNum
    )
    state.groupOptions.groupCheckAll = true
  }

  // 设置表格分组过滤选项
  const setTableFilterGroups = () => {
    const data = cloneDeep(dataCache.value)
    state.filterGroupsValue = ''
    let filterGroupsOptions = []
    if (typeof dataCache.value?.groupColumn === 'string') {
      filterGroupsOptions = [
        {
          label: t('analysis.event.unlimited'),
          value: t('analysis.event.unlimited'),
        },
      ]
      dataCache.value.groupColumn.split(',').forEach((element) => {
        filterGroupsOptions.push({ label: element, value: element })
      })
      state.filterGroups = t('analysis.event.unlimited')
    }
    state.filterGroupsOptions = filterGroupsOptions
  }

  //设置图表显示
  const setChart = () => {
    groupComparator()
    if (state.versus.length) {
      setComparisonEchart()
    } else {
      state.options['animation'] = !state.showChartLabel
      setCustomChart()
    }
  }

  // echart对比展示
  const setComparisonEchart = () => {
    // graphType 图表类型：1 趋势图，2累计图，3分布图
    if ([1, 2].includes(state.graphType)) {
      trendAndCumulative()
    } else {
      distributed()
    }
  }

  //echart非对比展示
  const setCustomChart = () => {
    // graphType 图表类型：1 趋势图，2累计图，3分布图，4堆积图，5饼状图，6数据表,7柱状图
    switch (state.graphType) {
      case 1:
      case 4:
        setLineOrAreaChart()
        break
      case 2:
        setTotalBarChart()
        break
      case 3:
        setBarChart()
        break
      case 5:
        setPieChart()
        break
      case 7:
        setStackBarChart()
        break
      default:
        setLineOrAreaChart()
    }
  }

  //设置表格数据
  const setTable = () => {
    // tableType 1 按日期，2 按事件，3 按分组
    if (state.unionGroups.length === 0 && state.tableType == 3) {
      state.tableType = 1
    }
    switch (state.tableType) {
      case 2:
        tableByEvent()
        break
      case 3:
        tableByGroup()
        break
      default:
        tableByDate()
    }
    setTimeout(() => {
      resTableRef.value?.sortEvent(state.sortArr || [])
    })
  }

  const changeTimeValue = (val, type) => {
    analysisData()
  }

  //切换图表类型
  const changeGraphType = () => {
    setChart()
  }

  //切换图表类型
  const changeTableType = () => {
    setTable()
  }

  const filterGroupChange = () => {
    setTable()
  }

  // 分组选项改变
  const handleCheckedGroupChange = () => {
    setChart()
  }

  // 指标筛选项改变
  const eventCheckChange = () => {
    setChart()
  }

  //图表分组排序和对比阶段选择改变触发
  const groupSortChange = () => {
    setChart()
  }

  //导出表格数据
  const exportTableData = (info) => {
    recordBehavior({
      moduleName: '分析',
      submoduleName: '事件分析',
      operate: '导出报表数据',
      businessId: reportInfo.value?.businessId || info.businessId,
    })
    let tHeader = []
    state.columnList.forEach((item) => {
      tHeader.push(item.title)
    })
    let data = formatJson(state.columnList, state.tableData)

    let fileName = info?.reportName ?? t('analysis.event.analysisName')
    const dateRangePattern = new RegExp(
      `(\\d{4}-\\d{2}-\\d{2})${t('common.to')}(\\d{4}-\\d{2}-\\d{2})`,
      'g'
    )
    const formattedDateRanges = totalDate.value
      .match(dateRangePattern)
      .map((match) => {
        return match.replace(/-/g, '').replace(t('common.to'), '-')
      })
      .join(state.versus.length ? '_VS_' : '')
    fileName = fileName + '_' + formattedDateRanges

    if (state.versus.length) {
      const { columns, columnsData } = {
        1: stageExportByDate,
        2: stageExportByEventAndGrounp,
        3: stageExportByEventAndGrounp,
      }[state.tableType](tHeader, data, state.columnList)
      tHeader = columns
      data = columnsData
    }

    exportToExcel({
      fileName,
      sheets: {
        // sheetName: '工作表',
        sheetData: [tHeader, ...data],
      },
    })
  }

  //异步导出处理
  const exportDataHandle = (callback) => {
    if (typeof callback === 'function') {
      callback({
        appId: sessionStorage.getItem('appId'),
        exportName:
          reportInfo.value?.name ||
          `事件分析_全量数据_${state.dateRange?.date?.[0]}_${state.dateRange?.date?.[1]}`,
        qp: qpCache.value || {},
        sql: state.sqlList,
      })
    }
  }

  // 展示可以创建结果分群
  const showCluster = (row, index, prop) => {
    if (state.tableType === 3) {
      return (
        row.offSetKey !== undefined &&
        index > row.offSetKey &&
        row.isCluster &&
        !isNaN(row[prop]) &&
        parseFloat(row[prop]) > 0
      )
    } else {
      return (
        row.offSetKey !== undefined &&
        index > row.offSetKey &&
        (row.showCluster ||
          (row.clusters && row.clusters.indexOf(index) > -1)) &&
        !isNaN(row[prop]) &&
        parseFloat(row[prop]) > 0
      )
    }
  }

  // 重新处理表格scpoe
  const resetTableRow = (row = {}, prop, val, index) => {
    // tableType 1 按日期，2 按事件，3 按分组
    const col =
      state.tableType === 2 ? 'col_0' : state.tableType === 3 ? 'col_1' : ''
    return {
      ...row,
      [prop]: val,
      ...([2, 3].includes(state.tableType) && {
        [col]: row[col].split(delimiter)[index],
      }),
    }
  }

  // 获取添加分群参数
  const getClusterParams = (scope, params, stageIndex = 0) => {
    const qp = cloneDeep(qpCache.value)
    //看板顶部的条件筛选
    if (params && params.reqConditionParam) {
      qp.conditionFilts = cloneDeep(params.reqConditionParam)
    }
    // 探索中的分组替换掉报表中的分组
    if (params && params.groupBy) {
      qp.groupBy = cloneDeep(params.groupBy)
    }

    if (qp.eventSplit && !Array.isArray(qp.eventSplit)) {
      // 兼容1.0单个拆分为对象情况
      qp.eventSplit = [qp.eventSplit]
    }

    qp.eventView.timeParticle = state.particleType.particle
    qp.eventView.timeZone = timeZoneStore.timeZone ?? '8'

    const temp = {
      appId: sessionStorage.getItem('appId'),
      qp: JSON.stringify(qp),
      type: 1, // 1事件分析 2留存分析 3 间隔分析 4漏斗分析 5分布分析 6用户分析
      groupValue: [],
      startDate: '',
      data: {
        eventAlis: '',
      },
      endDate: '',
    }
    if (state.tableType === 1) {
      temp['startDate'] = scope.column.title?.split(delimiter)[stageIndex]
      const i = scope.row.offSetKey
      temp.data['eventAlis'] = scope.row[`col_${i}`]
      if (i > 0) {
        const group = []
        for (let j = 0; j < i; j++) {
          if (scope.row[`col_${j}`]) {
            group.push(scope.row[`col_${j}`])
          }
        }
        temp['groupValue'] = group
      }
    } else if (state.tableType === 2) {
      temp['startDate'] = scope.row['col_0']?.split(delimiter)[stageIndex]
      temp.data['eventAlis'] = scope.column.title
      const i = scope.row.offSetKey
      if (i > 0) {
        const group = []
        for (let j = 1; j <= i; j++) {
          if (scope.row[`col_${j}`]) {
            group.push(scope.row[`col_${j}`])
          }
        }
        temp['groupValue'] = group
      }
    } else if (state.tableType === 3) {
      temp.data['eventAlis'] = scope.row['col_0']
      temp['startDate'] = scope.row['col_1']?.split(delimiter)[stageIndex]
      temp['groupValue'] = [scope.column.title]
    }

    temp.startDate = formatDateWithWeek(temp.startDate, true)
    // 合计
    const isSummary = state.particleType.particle === 'summary'
    if (isSummary) {
      const hasVersus = state.versus.length
      const index = state.selectedStageTableIndex - 1
      const [dateRangeStart, dateRangeEnd] = state.dateRange.date
      const versusDate = state.versus[index]
      //  stageIndex 值只有0时  没有使用vs对比
      temp.startDate =
        stageIndex === 0
          ? dateRangeStart
          : hasVersus
            ? versusDate.date[0]
            : dateRangeStart
      temp.endDate =
        stageIndex === 0
          ? dateRangeEnd
          : hasVersus
            ? versusDate.date[1]
            : dateRangeEnd
    }

    return temp
  }

  /**
   * @description: 展示事件详情
   * @return {*}
   */
  const showEventDetail = (row, index, prop) => {
    if (state.tableType === 3) {
      return (
        row.offSetKey !== undefined &&
        index > row.offSetKey &&
        !isNaN(row[prop]) &&
        parseFloat(row[prop]) > 0 &&
        row.showEventDetail
      )
    } else {
      return (
        row.offSetKey !== undefined &&
        index > row.offSetKey &&
        (row.showEventDetail ||
          (row.eventDetails && row.eventDetails.indexOf(index) > -1)) &&
        !isNaN(row[prop]) &&
        parseFloat(row[prop]) > 0
      )
    }
  }

  /**
   * @description: 获取事件详情的参数
   * @return {*}
   */
  const getEventDetailParams = (scope, params, stageIndex = 0) => {
    const temp = {
      ...getClusterParams(scope, params, stageIndex),
      eventIndex: scope.row.eventIndex ?? scope.column.eventIndex,
    }

    return temp
  }

  /**
   * @description 数据表排序获取
   */
  const getSortArr = (arr) => {
    state.sortArr = arr
  }

  const clearView = () => {
    if (state.viewStatus == 1) {
      clearTableAndChart()
      state.descMsg = t('common.noData')
      state.viewStatus = 0
    }
  }

  return {
    state,
    fetchRequestData,
    changeGraphType,
    changeTableType,
    loading,
    changeTimeValue,
    showChartTypeList,
    handleCheckedGroupChange,
    eventCheckChange,
    groupSortChange,
    filterGroupChange,
    exportTableData,
    diffCalculation,
    analysisData,
    reportInfo,
    dataCache,
    clearTableAndChart,
    resetChartType,
    setEventSelect,
    setGroupSelect,
    setTable,
    setChart,
    dataChartCache,
    chartTypeLimit,
    exportDataHandle,
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
    getSortArr,
    clearView,
  }
}
