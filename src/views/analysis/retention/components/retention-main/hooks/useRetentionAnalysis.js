import { ref, reactive, watch, computed, shallowRef } from 'vue'
import { initOptions } from '@/views/analysis/hooks/utils.js'
import { retentionCalculate } from '@/api/modules/analysis/index.js'
import { cloneDeep, isString, omit, isObject } from 'lodash-es'
import dayjs from 'dayjs'
import useTimeZoneStore from '@/store/modules/time-zone.js'
import { getRetentionDaycolumns, getKeyDaysData, getKeyDay } from './util.js'
import useTableData from './useTableData.js'
import useChartData from './useChartData.js'
import useCancelRequest from '@/hooks/useCancelRequest.js'
import { unitCycleType, dateEnum } from '@/enumeration/date.js'
import { processDates } from '@/utils/dataProcessing.js'
import { formatDateWithWeek } from '@/utils'
import { t } from '@/locales/i18n.js'

export default function (props, emits) {
  const state = reactive({
    columnList: [],
    tableData: [],
    options: initOptions(),
    unionGroups: [],
    groupOptions: {
      customNum: 15,
      defaultGroupNum: 15,
      groupCheckAll: false,
      groupCheckList: [],
    },
    loseGroupOptions: {
      customNum: 15,
      defaultGroupNum: 15,
      groupCheckAll: false,
      groupCheckList: [],
    },
    loseUnionGroups: [],
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
    showType: 1, // 1,留存；2,流失
    dateType: 0,
    status: -1,
    loading: false,
    resultGenerateTime: '',
    showChartLabel: false,
    onlyUserAction: false,
    descMsg: t('common.noData'),
    sqlList: '',
    flag: 0,
    valueType: 1, // 1,比例；2,人数
    resultClusterSql: '',
    dataDesc: '',
    groupName: '',
    info: null,
    initUserResultClusterSql: null,
  })

  const timeZoneStore = useTimeZoneStore()
  const qpCache = shallowRef(null)
  const dataCache = shallowRef({})
  const groupDataMap = ref(new Map())
  let groupColumnSet = []
  const { requestId, cancelCallBack, cancelCalculate, cancelReset } =
    useCancelRequest()

  const chartTypeList = computed(() => {
    const text =
      state.showType === 1
        ? t('analysis.retention.retain')
        : t('analysis.retention.loss')
    return [
      { value: 6, title: t('chart.dataTable'), icon: 'chart-table' },
      {
        value: 10,
        // `第N${unitCycleType[state.unitCycle.type]}${text}`
        title: t('analysis.nthDynamicField', [
          unitCycleType[state.unitCycle.type],
          text,
        ]),
        icon: 'retention-n-day',
      },
      {
        value: 11,
        // `每${unitCycleType[state.unitCycle.type]}${text}`
        title: t('analysis.everyDynamicField', [
          unitCycleType[state.unitCycle.type],
          text,
        ]),
        icon: 'retention-daily',
        disabled:
          (state.onlyUserAction === true && shoWSameTime.value) ||
          (state.showType === 2 && hasGroup.value == true),
      },
    ]
  })

  // 是否有分组
  const hasGroup = computed(() => {
    const group_column = dataCache.value?.group_column || undefined
    return isString(group_column)
  })

  // 同时展示是否可以创建结果分群
  const sameTimeClusterFlag = computed(() => {
    const qpData = qpCache.value
    const sameTime =
      isObject(qpData) && isObject(qpData.event) ? qpData.event : {}
    if (sameTime.analysis === 'A01') return true
    return false
  })

  // 是否有同时展示
  const shoWSameTime = computed(() => {
    return dataCache.value?.same_time_data === true
  })

  // 是否展示分组选择组件
  const showGroupDrop = computed(() => {
    const graphType = state.graphType
    const group_column = dataCache.value?.group_column || undefined
    const hasGroup = isString(group_column)
    return (hasGroup && graphType === 10) || graphType === 11
  })

  // 表格数据处理
  const { setTable, setDetailTable, exportTableData } = useTableData(
    state,
    dataCache,
    qpCache,
    groupDataMap,
    props
  )

  // 图表数据处理
  const { setChart } = useChartData(
    state,
    dataCache,
    groupDataMap,
    hasGroup,
    shoWSameTime
  )

  const clearTableAndChart = () => {
    groupDataMap.value = new Map()
    groupColumnSet = []
    state.columnList = []
    state.tableData = []
    state.options = initOptions()
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
    state.graphType = [6, 10, 11].includes(data.graphType) ? data.graphType : 6
    if (qp?.cycle) {
      state.unitCycle = cloneDeep(qp.cycle)
    } else {
      let day = parseInt(qp?.eventView?.keepDay ?? 7)
      day = Number.isNaN(day) ? 7 : day
      state.unitCycle = { uniNum: day, type: 'day' }
    }
    if (qp?.keyDays) {
      state.keyDays = cloneDeep(qp.keyDays)
    }

    if (qp?.groupCheck?.valueType) {
      state.valueType = qp.groupCheck.valueType
    }

    if ([1, 2].includes(qp?.showType)) {
      state.showType = qp.showType
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

  const fetchRequestData = async (options) => {
    const {
      params,
      fromReport,
      selectData,
      isDashboard = false,
      info = null,
    } = options

    const data = {
      appId: options.appId || sessionStorage.getItem('appId'),
      qp: { ...params },
      selectData,
      callback: cancelCallBack,
    }
    state.info = info
    state.loading = true
    clearTableAndChart()
    try {
      const res = await retentionCalculate(data)
      if (res.code === 200) {
        state.resultGenerateTime = res?.data?.resultGenerateTime
        state.sqlList = res?.data?.sql || ''
        state.resultClusterSql = res?.data?.resultClusterSql || ''
        state.dataDesc = res?.data?.analysis?.dataDesc || ''
        state.initUserResultClusterSql =
          res?.data?.initUserResultClusterSql ?? null
        if (res?.data?.analysis && Object.keys(res?.data?.analysis).length) {
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

  const getEchartsData = ({
    analysis,
    fromReport,
    paramsQp,
    isDashboard = false,
  }) => {
    groupDataMap.value = new Map()
    groupColumnSet = Array.isArray(analysis.group_column_set)
      ? analysis.group_column_set
      : []
    if (groupColumnSet.length > 0) {
      const tempCache = omit(analysis, ['items', 'group_column_set'])
      const tempArr = []
      const itemDatas = analysis?.items ?? []
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
        qp = props.reportInfo?.qp ? JSON.parse(props.reportInfo?.qp) : null
      }
    }

    // 重置只看同时展示数据
    if (state.onlyUserAction === true && analysis.same_time_data !== true) {
      state.onlyUserAction = false
    }

    setGroupSelect(fromReport, qp)

    setDataShow()
  }

  const handleGroupOptions = (
    groupOptionsData,
    isDynamicTime,
    groupOptions,
    type = ''
  ) => {
    return (
      setSavedGroup(groupOptionsData, isDynamicTime, type) ??
      getDefaultGroupOptions(state.unionGroups, groupOptions)
    )
  }

  // 设置分组选中
  const setGroupSelect = (fromReport, qp) => {
    const data = cloneDeep(dataCache.value)
    const hasGroup =
      isString(data.group_column) && data.group_column.trim() !== ''
    if (hasGroup) {
      const group_column_set = Array.isArray(groupColumnSet)
        ? groupColumnSet
        : []
      state.unionGroups = [t('analysis.retention.total'), ...group_column_set]
    } else {
      state.unionGroups = Array.isArray(data.analysis_date)
        ? [t('analysis.retention.stageValue'), ...data.analysis_date]
        : []
      state.loseUnionGroups = Array.isArray(data.analysis_date)
        ? [...data.analysis_date]
        : []
    }

    if (fromReport) {
      if (qp?.groupCheck) {
        const groupOptionsData = cloneDeep(qp.groupCheck)
        if (hasGroup) {
          state.groupOptions = setCustomGroup(groupOptionsData)
        } else {
          const isDynamicTime = qp?.eventView?.recentDay !== ''
          /*if (state.showType === 2 && state.graphType === 11) {
            state.loseGroupOptions =
              setSavedGroup(
                groupOptionsData,
                isDynamicTime,
                'loseGroupOptions'
              ) ??
              getDefaultGroupOptions(state.unionGroups, state.loseGroupOptions)
          } else {
            state.groupOptions =
              setSavedGroup(groupOptionsData, isDynamicTime) ??
              getDefaultGroupOptions(state.unionGroups, state.groupOptions)
          }*/

          state.loseGroupOptions = handleGroupOptions(
            groupOptionsData,
            isDynamicTime,
            state.loseGroupOptions,
            'loseGroupOptions'
          )

          state.groupOptions = handleGroupOptions(
            groupOptionsData,
            isDynamicTime,
            state.groupOptions
          )
        }
      } else {
        setDefaultGroupOptions(state.unionGroups, state.loseUnionGroups)
      }
    } else {
      setDefaultGroupOptions(state.unionGroups, state.loseUnionGroups)
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
  const setSavedGroup = (
    groupOptions = {},
    isDynamicTime = false,
    type = ''
  ) => {
    if (!isDynamicTime) {
      return {
        customNum: groupOptions.customNum,
        defaultGroupNum: groupOptions.defaultGroupNum,
        groupCheckAll: groupOptions.groupCheckAll,
        groupCheckList:
          groupOptions?.groupCheckList ?? groupOptions?.checkedGroups ?? [], // groupOptions?.checkedGroups兼容1.0,
      }
    }
    if (groupOptions.groupCheckAll === true) {
      return getDefaultGroupOptions(
        state.unionGroups.slice(
          type === 'loseGroupOptions' ? +!hasGroup.value : 0
        ),
        groupOptions
      )
    }
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
    if (checkList.includes(t('analysis.retention.stageValue'))) {
      dateArr.unshift(t('analysis.retention.stageValue'))
    }
    if (checkList.includes(t('analysis.retention.total'))) {
      dateArr.unshift(t('analysis.retention.total'))
    }

    return {
      customNum: groupOptions.customNum,
      defaultGroupNum: groupOptions.defaultGroupNum,
      groupCheckAll: false,
      groupCheckList: [...dateArr],
    }
  }

  const setDefaultGroupOptions = (unionGroups = [], loseUnionGroups = []) => {
    state.groupOptions = getDefaultGroupOptions(unionGroups, state.groupOptions)
    state.loseGroupOptions = getDefaultGroupOptions(
      // 没分组时 从元素1开始提取
      unionGroups.slice(+!hasGroup.value),
      state.loseGroupOptions
    )
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

  // 切换数据图表展示类型
  const changeGraphType = () => {
    setDataShow()
  }

  //切换展示数据类型 比例、人数
  const valueTypeChange = () => {
    setChart()
  }

  // 切换视图展示
  const changeDataView = () => {
    if (![-1, 0].includes(state.status)) {
      setDataShow()
    }
  }

  // 切换留存/流失
  const changeShowType = () => {
    if (state.showType === 2) {
      state.onlyUserAction = false
    }
    changeDataView()
  }

  // 数据展示方式
  const setDataShow = () => {
    if (state.graphType === 6) {
      setTable()
    } else {
      setChart()
    }
  }

  const reCallAnalysis = (options = {}, type = '', test) => {
    if (type === 'unitCycle') {
      if (options.type !== options.oldType) {
        state.keyDays.days = cloneDeep(dateEnum[options.type])
      }
      if (state.unitCycle.type !== 'day') {
        state.dateType = 0
      }
    }

    if (state.status !== -1) {
      emits?.('calcute', options)
    }
  }

  //是否展示详情按钮
  const showDetailBtn = (data, index, type) => {
    const hasChildren = data?.children === true
    const flag = hasChildren && index === 0
    return type === 'btn' ? hasChildren && flag : flag
  }

  // 是否展示添加分群标识 type: 1,回访用户指标; 2,同时展示回访用户参与 | isGroupDetail: 是否是分组详情表格
  const showCluster = (row, index, prop, type = 1, isGroupDetail = false) => {
    if (
      !row[prop] ||
      row[prop] === '-' ||
      row['col_0'] === t('analysis.retention.stageValue')
    )
      return false
    const flag = isGroupDetail ? state.flag : 1
    return (
      (index === flag ||
        (index > flag && !(!sameTimeClusterFlag.value && type === 2))) &&
      parseFloat(row[prop], 10)
    )
  }

  // 获取日期数据表格添加分群参数 type: 1,回访用户指标; 2,同时展示回访用户参与
  const getClusterParams = (scope, index, type = 1, isGroupDetail = false) => {
    const temp = {
      appId: sessionStorage.getItem('appId'),
      qp: JSON.stringify(qpCache.value),
      type: 2,
      groupValue: [],
      startDate: isGroupDetail ? state.groupName : scope.row['col_0'],
      data: {
        retention: state.showType,
        retentionResultClusterSql: state.resultClusterSql,
        retentionResultClusterType: 1, // 1：初始事件，2：回访事件，3：同时展示回访用户
        initUserResultClusterSql: state.initUserResultClusterSql,
        analysisParticle: state.unitCycle.type,
      },
      eventAlis: '',
      endDate: '',
    }
    temp.startDate = processDates(temp.startDate)

    const flag = isGroupDetail ? state.flag : 1
    if (index === flag) {
      temp['eventAlis'] = qpCache.value.retention[0].eventDesc
    }
    if (index > flag) {
      const title = scope.column.title
      const dayArr = getRetentionDaycolumns(state.showType, state.unitCycle)
      const dayIndex = dayArr.indexOf(title)
      temp.data['interval'] = dayIndex
      if (type === 1) {
        temp.data['retentionResultClusterType'] = 2
      } else if (type === 2) {
        temp.data['retentionResultClusterType'] = 3
      }
    }

    if (isGroupDetail) {
      const group = []
      for (let i = 0; i < flag; i++) {
        group.push(scope.row[`col_${i}`])
      }
      temp['groupValue'] = group
    }

    return temp
  }

  // 展示分组详情数据
  const showDetailTable = (data, groupDetailRef) => {
    //col_0 为日期的值 如 '2024-02-23'
    let key =
      data?.col_0 === t('analysis.retention.stageValue') ? '-' : data?.col_0
    if (!key) return
    const showDetailData = groupDataMap.value.get(key)
    if (!showDetailData) return
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

  // 展示数据不完整提示
  const showTips = (row, index) => {
    const cacheData = cloneDeep(dataCache.value)
    const offset = 2
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
    setDataShow,
    requestId,
    cancelFetchRequest,
    setDataVisualizationStatus,
    showCluster,
    getClusterParams,
  }
}
