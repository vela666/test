import { reactive, computed, onMounted, watch, shallowRef, ref } from 'vue'
import { initOptions } from '@/views/analysis/hooks/utils.js'
import { ltvCalculate } from '@/api/modules/analysis/index.js'
import { cloneDeep, isString, omit } from 'lodash-es'
import dayjs from 'dayjs'
import useTimeZoneStore from '@/store/modules/time-zone.js'
import { getLtvDaycolumns, getKeyDaysData, getKeyDay } from './util.js'
import useTableData from './useTableData.js'
import useChartData from './useChartData.js'
import useCancelRequest from '@/hooks/useCancelRequest.js'
import { formatDateWithWeek } from '@/utils'
import { processDates } from '@/utils/dataProcessing.js'
import { dateEnum, unitCycleType } from '@/enumeration/date.js'
import { t } from '@/locales/i18n.js'

const chartTypeList = (type) => {
  return [
    { value: 6, title: t('chart.dataTable'), icon: 'chart-table' },
    {
      value: 12,
      // `第N${unitCycleType[type]}LTV`
      title: t('analysis.nthDynamicField', [unitCycleType[type], 'LTV']),
      icon: 'retention-n-day',
    },
    {
      value: 13,
      // `每${unitCycleType[type]}LTV`
      title: t('analysis.everyDynamicField', [unitCycleType[type], 'LTV']),
      icon: 'retention-daily',
    },
  ]
}

export default function (props, emit) {
  const state = reactive({
    columnList: [],
    tableData: [],
    options: initOptions(),
    unionGroups: [],
    groupOptions: {
      customNum: 15,
      defaultGroupNum: 15,
      groupCheckAll: true,
      groupCheckList: [],
    },
    graphType: 6,
    dateRange: {
      diff: '1-7',
      recentDay: '1-7',
      mainName: '过去7天',
      shortcutType: 'past7Day',
    },
    unitCycle: { uniNum: 7, type: 'day' },
    keyDays: {
      apply: 1,
      days: [0, 1, 7, 14, 30],
    },
    dateType: 0,
    status: -1,
    loading: false,
    resultGenerateTime: '',
    showChartLabel: false,
    onlyUserAction: false,
    descMsg: t('common.noData'),
    sqlList: '',
    flag: 0,
    resultClusterSql: '',
    dataDesc: '',
    groupName: '',
    info: null,
    initDateResultClusterSql: null,
    initUserResultClusterSql: null,
  })

  const timeZoneStore = useTimeZoneStore()
  const qpCache = shallowRef(null)
  const dataCache = shallowRef({})
  let groupDataMap = ref(new Map())
  let groupColumnSet = []
  const { requestId, cancelCallBack, cancelCalculate, cancelReset } =
    useCancelRequest()

  //表格数据生成
  const { setTable, setDetailTable, exportTableData } = useTableData(
    state,
    dataCache,
    qpCache,
    groupDataMap,
    props
  )

  // 图表生成
  const { setChart } = useChartData(state, dataCache, qpCache, groupDataMap)

  const reCallAnalysis = (options = {}, type = '') => {
    if (type === 'unitCycle') {
      if (options.type !== options.oldType) {
        state.keyDays.days = cloneDeep(dateEnum[options.type])
      }
      if (state.unitCycle.type !== 'day') {
        state.dateType = 0
      }
    }

    if (state.status !== -1) {
      emit?.('calcute', options)
    }
  }

  const changeDataView = () => {
    if (![-1, 0].includes(state.status)) {
      setDataShow()
    }
  }

  //报表事件组件、对比组件、报表类型等反显
  watch(
    () => props?.reportInfo,
    (val) => {
      setDataVisualizationStatus(true, val)
    }
  )
  const setDataVisualizationStatus = (
    fromReport,
    data,
    isDashboard = false
  ) => {
    const qp = JSON.parse(data.qp)
    if (!fromReport || !qp) return
    state.graphType = [6, 12, 13].includes(data.graphType) ? data.graphType : 6
    if (qp?.cycle) {
      state.unitCycle = cloneDeep(qp.cycle)
    }
    if (qp?.keyDays) {
      state.keyDays = cloneDeep(qp.keyDays)
    }

    state.onlyUserAction = qp?.onlyUserAction ?? false
    state.showChartLabel = qp.showChartLabel
    state.dateType = qp?.eventView?.dateType ?? 0
    if (!isDashboard) {
      state.dateRange = {
        diff: qp?.eventView?.recentDay || '',
        recentDay: qp?.eventView?.recentDay || '',
        mainName: '',
        shortcutType: qp?.eventView?.shortcutType ?? '',
        startTime: qp?.eventView?.startTime,
        endTime: qp?.eventView?.endTime,
      }
      if (qp?.eventView?.timeZone) {
        timeZoneStore.timeZone = qp.eventView.timeZone
      }
    }
  }

  // 是否有分组
  const hasGroup = computed(() => {
    return (
      dataCache.value?.group_column && isString(dataCache.value?.group_column)
    )
  })

  const showChartTypeList = computed(() => {
    return hasGroup.value
      ? chartTypeList(state.unitCycle.type).map((el) => {
          return el.value === 13 ? { ...el, disabled: true } : { ...el }
        })
      : chartTypeList(state.unitCycle.type)
  })

  // 是否展示分组选择组件
  const showGroupDrop = computed(() => {
    const graphType = state.graphType
    const hasGroup =
      dataCache.value?.group_column && isString(dataCache.value?.group_column)
    return !(
      graphType === 6 ||
      (hasGroup && graphType === 13) ||
      (!hasGroup && graphType === 12)
    )
  })

  // 是否有同时展示
  const shoWSameTime = computed(() => {
    return dataCache.value?.same_time_data === true
  })

  /* 分析指标是否可以创建结果分群（带有触发用户数的指标*/
  const returnVisitClusterFlag = computed(() => {
    // 回访用户指标
    return searchClusterFlag('return_visit')
  })

  const onInitClusterFlag = computed(() => {
    // 初始日期指标
    return searchClusterFlag('on_init')
  })

  const sameTimeClusterFlag = computed(() => {
    // 同时展示
    return searchClusterFlag('same_time')
  })

  // 是否有初始日期指标
  const showOnInit = computed(() => {
    return dataCache.value?.on_init_data === true
  })
  // 判断指标是否可以创建结果分群
  function searchClusterFlag(type = null) {
    const events = Array.isArray(qpCache.value?.events)
      ? cloneDeep(qpCache.value.events)
      : []
    const find = events.find((el) => el.type === type)
    if (find) {
      if (find.analysis === 'A01') {
        return true
      } else if (
        Array.isArray(find.customIndex) &&
        find.customIndex.length === 1 &&
        find.customIndex[0].analysis === 'A01'
      ) {
        return true
      }
    }
    return false
  }

  /**
   * @description 取消计算
   */
  const cancelFetchRequest = () => {
    cancelCalculate(() => {
      state.status = 0
      state.descMsg = t('analysis.reportCalcCanceled')
      state.loading = false
    })
  }

  /**
   * @description: 处理日期格式转为日期(星期)
   * @return {*}
   */
  const formatDataSource = (data) => {
    const dataSource = cloneDeep(data)
    if (dataSource.analysis_date) {
      dataSource.analysis_date = dataSource.analysis_date.map((item) =>
        formatDateWithWeek(item)
      )
    }
    if (dataSource.items) {
      dataSource.items = dataSource.items.map((item) => {
        item.on_date = formatDateWithWeek(item.on_date)
        return item
      })
    }
    return dataSource
  }

  const fetchRequestData = async (options = {}) => {
    const {
      params,
      fromReport,
      selectData,
      isDashboard = false,
      info = null,
    } = options

    const data = {
      appId: options?.appId,
      qp: { ...params },
      selectData,
      callback: cancelCallBack,
    }
    state.info = info
    state.loading = true
    clearTableAndChart()
    try {
      const res = await ltvCalculate(data)
      if (res.code === 200) {
        state.resultGenerateTime = res?.data.resultGenerateTime
        state.sqlList = res?.data.sql || ''
        state.resultClusterSql = res?.data?.resultClusterSql || ''
        state.dataDesc = res?.data?.analysis?.dataDesc || ''
        state.initDateResultClusterSql =
          res?.data?.initDateResultClusterSql ?? null
        state.initUserResultClusterSql =
          res?.data?.initUserResultClusterSql ?? null
        if (res.data?.analysis && Object.keys(res?.data?.analysis).length) {
          state.status = 1
          getEchartsData({
            analysis: formatDataSource(res.data.analysis),
            fromReport,
            paramsQp: data.qp,
            isDashboard,
          })
        } else {
          state.status = 0
          state.descMsg = t('common.noData')
        }
      } else {
        state.descMsg = res?.message || t('common.noData')
        state.status = 0
      }
      state.loading = false
      cancelReset()
    } catch (error) {
      console.log(error)
      state.status = 0
      state.loading = false
    }
  }

  const clearTableAndChart = () => {
    groupDataMap.value = new Map()
    groupColumnSet = []
    state.columnList = []
    state.tableData = []
    state.options = initOptions()
  }

  // 设置分组选中
  const setGroupSelect = (fromReport, qp) => {
    const data = cloneDeep(dataCache.value)
    const hasGroup =
      isString(data?.group_column) && data.group_column.trim() !== ''
    if (hasGroup) {
      const group_column_set = Array.isArray(groupColumnSet)
        ? groupColumnSet
        : []
      state.unionGroups = [t('analysis.ltv.total'), ...group_column_set]
    } else {
      state.unionGroups = Array.isArray(data.analysis_date)
        ? data.analysis_date
        : []
    }
    if (fromReport) {
      if (qp?.groupCheck) {
        if (hasGroup) {
          state.groupOptions = setCustomGroup(cloneDeep(qp.groupCheck))
        } else {
          const isDynamicTime = qp?.eventView?.recentDay !== ''
          state.groupOptions =
            setSavedGroup(cloneDeep(qp.groupCheck), isDynamicTime) ??
            getDefaultGroupOptions(state.unionGroups, state.groupOptions)
        }
      } else {
        setDefaultGroupOptions(state.unionGroups)
      }
    } else {
      setDefaultGroupOptions(state.unionGroups)
    }
  }

  // 设置非时间的分组
  const setCustomGroup = (groupOptions = {}) => {
    let groups =
      groupOptions?.groupCheckList ?? groupOptions?.checkedGroups ?? [] // groupOptions?.checkedGroups兼容1.0
    groups = (Array.isArray(groups) ? groups : []).filter((el) =>
      state.unionGroups.includes(el)
    )
    return {
      customNum: groupOptions.customNum,
      defaultGroupNum: groupOptions.defaultGroupNum,
      groupCheckAll: groupOptions.groupCheckAll,
      groupCheckList: groups,
    }
  }

  // 设置时间分组选择
  const setSavedGroup = (groupOptions = {}, isDynamicTime) => {
    if (!isDynamicTime) {
      return {
        customNum: groupOptions.customNum,
        defaultGroupNum: groupOptions.defaultGroupNum,
        groupCheckAll: groupOptions.groupCheckAll,
        groupCheckList:
          groupOptions?.groupCheckList ?? groupOptions?.checkedGroups ?? [],
      }
    }
    if (groupOptions.groupCheckAll === true) {
      return getDefaultGroupOptions(state.unionGroups, groupOptions)
    }
    // 动态时间处理
    const updateTime = props?.reportInfo?.updateTime ?? state.info?.updateTime
    if (!dayjs(updateTime).isValid()) return
    const diff = dayjs().diff(dayjs(updateTime), 'day')
    const checkList = groupOptions?.groupCheckList ?? []

    const dateArr = []
    checkList.forEach((item) => {
      if (item && dayjs(item).isValid()) {
        const tempDate = dayjs(item).add(diff, 'day').format('YYYY-MM-DD')
        if (state.unionGroups.includes(tempDate)) {
          dateArr.push(tempDate)
        }
      }
    })
    if (checkList.includes(t('analysis.ltv.stageValue'))) {
      dateArr.unshift(t('analysis.ltv.stageValue'))
    }
    if (checkList.includes(t('analysis.ltv.total'))) {
      dateArr.unshift(t('analysis.ltv.total'))
    }

    return Object.assign(groupOptions, {
      groupCheckAll: false,
      groupCheckList: [...dateArr],
    })
  }

  const setDefaultGroupOptions = (unionGroups = []) => {
    state.groupOptions = getDefaultGroupOptions(unionGroups, state.groupOptions)
  }

  const getDefaultGroupOptions = (unionGroups = [], groupOptions = {}) => {
    const checkList = unionGroups.slice(0, groupOptions.customNum)
    return {
      customNum: groupOptions.customNum,
      defaultGroupNum: groupOptions.defaultGroupNum,
      groupCheckAll: true,
      groupCheckList: [...checkList],
    }
  }

  const getEchartsData = ({
    analysis,
    fromReport,
    paramsQp,
    isDashboard = false,
  }) => {
    groupColumnSet = Array.isArray(analysis.group_column_set)
      ? analysis.group_column_set
      : []
    if (groupColumnSet.length > 0) {
      const itemDatas = analysis?.items ?? []
      const tempCache = omit(analysis, ['items', 'group_column_set'])
      const tempArr = []
      for (const item of itemDatas) {
        groupDataMap.value.set(item.on_date, item.group_data)
        tempArr.push(omit(item, 'group_data'))
      }
      tempCache['items'] = cloneDeep(tempArr)
      dataCache.value = cloneDeep(tempCache)
    } else {
      dataCache.value = cloneDeep(analysis)
    }

    qpCache.value = cloneDeep(paramsQp)
    let qp = null
    if (fromReport) {
      if (isDashboard) {
        qp = cloneDeep(paramsQp)
      } else {
        qp = props?.reportInfo?.qp ? JSON.parse(props.reportInfo?.qp) : null
      }
    }

    // 重置只看同时展示数据
    if (state.onlyUserAction === true && analysis.same_time_data !== true) {
      state.onlyUserAction = false
    }

    setGroupSelect(fromReport, qp)

    setDataShow()
  }

  const changeGraphType = () => {
    setDataShow()
  }

  // 数据展示方式
  const setDataShow = () => {
    if (state.graphType === 6) {
      setTable()
    } else {
      // 有分组时不展示 每日LTV
      if (hasGroup.value && state.graphType === 13) {
        state.graphType = 12
      }
      state.options['animation'] = !state.showChartLabel
      setChart()
    }
  }

  //是否展示详情按钮
  const showDetailBtn = (data, index, type) => {
    const hasChildren = data?.children === true
    const flag = hasChildren && index === 0
    return type === 'btn' ? hasChildren && flag : flag
  }

  // 展示数据不完整提示
  const showTips = (row, index) => {
    const cacheData = cloneDeep(dataCache.value)
    // 是否有初始日期指标
    const hasInit = cacheData.on_init_data === true
    const offset = hasInit ? 3 : 2
    const data = row
    let flag = false
    const dateStr =
      typeof data['col_0'] === 'string'
        ? data['col_0'].replace(/-/g, '/')
        : data['col_0']
    if (index >= offset) {
      const dayIndex = index - offset
      const date = dayjs(dateStr).add(dayIndex, 'day').valueOf()
      const todayStr = dayjs().format('YYYY-MM-DD')
      const today = dayjs(todayStr).valueOf()
      const tomorrow = dayjs(todayStr).add(1, 'day').valueOf()
      if (date >= today && date < tomorrow) {
        flag = true
      }
    }
    return flag
  }

  // 是否展示添加分群标识 type: 1,回访用户指标; 2,同时展示回访用户参与 | isGroupDetail: 是否是分组详情表格
  const showCluster = (row, index, prop, type = 1, isGroupDetail = false) => {
    if (!row[prop] || row[prop] === '-') return false
    const flag = isGroupDetail ? state.flag : 1
    if (typeof flag !== 'number' || flag < 1) return false
    const showOnInitFlag = showOnInit.value
    if (index === flag) {
      if (showOnInitFlag) {
        if (onInitClusterFlag.value) return true
      } else {
        return true
      }
    } else if (index >= flag + 1) {
      if (showOnInitFlag && index === flag + 1) {
        return true
      }
      return type === 2
        ? sameTimeClusterFlag.value
        : type === 1
          ? returnVisitClusterFlag.value
          : false
    }
    return false
  }

  // 获取添加分群参数 type: 1,回访用户指标; 2,同时展示回访用户参与 | isGroupDetail: 是否是分组详情表格
  const getClusterParams = (scope, index, type = 1, isGroupDetail = false) => {
    const params = {
      appId: sessionStorage.getItem('appId'),
      qp: JSON.stringify(qpCache.value),
      type: 9,
      groupValue: [],
      startDate: isGroupDetail
        ? formatDateWithWeek(state.groupName, true)
        : formatDateWithWeek(scope.row['col_0'], true),
      data: {
        ltvResultClusterSql: state.resultClusterSql,
        ltvResultClusterType: 0,
        initDateResultClusterSql: state.initDateResultClusterSql,
        initUserResultClusterSql: state.initUserResultClusterSql,
        analysisParticle: state.unitCycle.type,
      },
    }
    params.startDate = processDates(params.startDate)

    const flag = isGroupDetail ? state.flag : 1
    const onInitCluster = onInitClusterFlag.value // 是否展示初始日期指标
    let resultClusterType = 0 // 1：初始用户，2：回访用户指标，3：初始日期指标，4：同时展示回访用户参数
    if (index === flag) {
      resultClusterType = onInitCluster ? 3 : 1
    } else if (index >= flag + 1) {
      if (showOnInit.value && index === flag + 1) {
        resultClusterType = 1
      } else {
        const dayArr = getLtvDaycolumns(state.unitCycle)
        const dayIndex = dayArr.indexOf(scope.column.title)
        params.data['interval'] = dayIndex
        resultClusterType = type === 2 ? 4 : 2
      }
    }
    params.data['ltvResultClusterType'] = resultClusterType
    if (isGroupDetail) {
      const group = []
      for (let i = 0; i < flag; i++) {
        group.push(scope.row[`col_${i}`])
      }
      params['groupValue'] = group
    }
    return params
  }

  // 展示详情表格
  const showDetailTable = (data, groupDetailRef) => {
    //col_0 为日期的值 如 '2024-02-23'
    const showDetailData = groupDataMap.value.get(data?.col_0)
    if (!data?.col_0 || !showDetailData) return
    state.groupName = data?.col_0 || ''
    const { tableData, colums } = setDetailTable(showDetailData)
    groupDetailRef?.open?.({
      data,
      columnList: colums,
      tableData,
      showCluster,
      onlyUserAction: state.onlyUserAction,
      flag: state.flag,
      getClusterParams,
      dataDesc: state.dataDesc,
    })
  }

  return {
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
    reCallAnalysis,
    changeDataView,
    setDataShow,
    requestId,
    cancelFetchRequest,
    setDataVisualizationStatus,
    getClusterParams,
  }
}
