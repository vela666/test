import { ref, reactive, watch, computed, watchEffect } from 'vue'
import { cloneDeep, omit, isNumber, isObject } from 'lodash-es'
import useOperate from '@/components/PropsFilter/useOperate'
import useAanlysisUtils from '@/views/analysis/hooks/useAanlysisUtils.js'
import useTimeZoneStore from '@/store/modules/time-zone.js'
import { useRoute } from 'vue-router'
import { v4 as uuidv4 } from 'uuid'
import { ElMessage } from 'element-plus'
import { tableKeysArr } from '@/enumeration'
import { t } from '@/locales/i18n'

const limit = tableKeysArr

export default function (emits, props) {
  const {
    handleAddConditionData,
    handleDelConditionData,
    parseFilterData,
    parseFiltersFromRes,
    omitFiltersHandler,
  } = useOperate()
  const {
    reportId,
    currentEventList,
    getFirstEvent,
    fetchEventFieldsData,
    setInitEventField,
    fetchFieldList,
    getFirstField,
    initBeforeGetEvents,
    getIndexItem,
    setInitialEventIndex,
    setGlobalFiltersDisplay,
    setGroupByDisplay,
    omitGroupsHandler,
    getGroupData,
    filterFieldListByOmitAttr,
    generateDefaultCluster,
  } = useAanlysisUtils({ analysisType: 3, anyEvent: true })

  const router = useRoute()
  const timeZoneStore = useTimeZoneStore()
  const state = reactive({
    showUserAction: false,
    initialEvent: {},
    returnVisitEvent: {},
    userAction: {},
    globalFiledsData: {},
    globalFilters: {
      relation: 0,
      filters: [],
    },
    groupList: [],
    globalWatch: true,
    groupWatch: true,
  })

  if (!reportId.value) {
    initBeforeGetEvents(initAnalysisStatus)
  }

  async function initAnalysisStatus() {
    state.initialEvent = await getAnalysisItem('initialEvent')
    state.returnVisitEvent = await getAnalysisItem('returnVisitEvent')
  }

  // 生成普通指标
  async function getAnalysisItem(key) {
    const isUserAction = key === 'userAction'
    let temp = {
      events: {},
      eventFilters: {
        relation: 0,
        filters: [],
      },
      fieldsList: {},
    }
    if (isUserAction) {
      temp = {
        ...temp,
        eventFields: {},
        eventFieldsData: {},
      }
    }
    temp.events = getFirstEvent()
    if (temp?.events?.eventId) {
      if (isUserAction) {
        temp.eventFieldsData = await fetchEventFieldsData(temp?.events?.eventId)
        temp.eventFields = setInitEventField(temp.eventFieldsData)
      }
      // 获取筛选条件的数据源
      temp.fieldsList = await fetchFieldList(temp.events.eventId)
    }
    return cloneDeep(temp)
  }

  // 切换开关（初始日期指标、同时展示回访用户参与）
  const switchIndexStatus = async (status) => {
    state.userAction = status ? await getAnalysisItem('userAction') : {}
  }

  // 添加筛选条件: 有fIndex则是添加子筛选项
  const addFilter = (key, index) => {
    state[key].eventFilters = handleAddConditionData({
      condition: state[key].eventFilters,
      noLimit: limit,
      conditionList: state[key].fieldsList,
      index,
    })
  }

  // 删除筛选项:有subfIndex则是删除子筛选项
  const deleteFilter = (key, index, subIndex) => {
    state[key].eventFilters = handleDelConditionData({
      condition: state[key].eventFilters,
      index,
      subIndex,
    })
  }

  // 处理筛选列表中在数据源中不存在的筛选属性
  const omitFilters = (data, index) => {
    // index === undefined  全局筛选
    let temp =
      index === undefined
        ? state.globalFilters?.filters
        : state[index]?.eventFilters?.filters
    if (!Array.isArray(temp) || temp.length === 0) return
    const newFilters = omitFiltersHandler(data, temp)

    if (index === undefined) {
      state.globalFilters.filters = newFilters
    } else {
      state[index].eventFilters.filters = newFilters
    }
  }

  //指标事件切换
  const eventChange = async (index, val) => {
    if (val?.eventId) {
      if (index === 'userAction') {
        const resData = await fetchEventFieldsData(val?.eventId)
        state[index].eventFieldsData = resData
        state[index].eventFields = setInitEventField(resData)
      }
      const fieldsListData = await fetchFieldList(val?.eventId)
      state[index].fieldsList = cloneDeep(fieldsListData)
      omitFilters(fieldsListData, index)
    }
  }

  // 全局筛选相关的事件id集合
  const getGlobFiledEvents = () => {
    const events = []
    const eventsArr = ['initialEvent', 'returnVisitEvent']
    for (const k of eventsArr) {
      const eventId = state[k]?.events?.eventId
      if (isNumber(eventId)) {
        events.push(eventId)
      }
    }
    return events
  }

  const globalFiledEvents = computed(() => {
    const events = getGlobFiledEvents()
    return [...new Set(events)].sort((a, b) => a - b).join(',')
  })

  watch(globalFiledEvents, async (val) => {
    const eventId =
      typeof val === 'string'
        ? val
            .split(',')
            .filter((el) => el)
            .join(',')
        : val
    state.globalFiledsData = await fetchFieldList(eventId)
  })

  watch(
    () => state.globalFiledsData,
    (val) => {
      if (state.globalWatch) {
        // 处理全局筛选 剔除当前属性列表不存在的值
        omitFilters(val)
      } else {
        state.globalWatch = true
      }
    }
  )

  // 添加默认分群处理
  if (!router?.query?.id) {
    const stopWf = watchEffect(
      () => {
        const data = cloneDeep(state.globalFiledsData)
        if (isObject(data) && Object.keys(data).length > 0) {
          const item = generateDefaultCluster(
            data?.defaultCluster?.[0],
            router.path
          )
          if (item && isObject(item) && Object.keys(item).length > 0) {
            state.globalFilters.filters.push(item)
          }
          stopWf()
        }
      },
      {
        flush: 'post',
      }
    )
  }

  // 添加全局筛选项
  const addGlobalFilter = (index) => {
    state.globalFilters = handleAddConditionData({
      condition: state.globalFilters,
      noLimit: limit,
      conditionList: state.globalFiledsData,
      index,
    })
  }

  // 全局筛选删除一项
  const deleteGlobalFilter = (index, subIndex) => {
    state.globalFilters = handleDelConditionData({
      condition: state.globalFilters,
      index,
      subIndex,
    })
  }

  // 分组项中的数据源
  const groupdsFieldsData = computed(() => {
    const data = state.initialEvent?.fieldsList ?? {}
    return filterFieldListByOmitAttr(data)
  })

  // state.groupWatch标识用于处理报表反显中被删除、禁用的分组项属性被 omitGroupsHandler 处理函数给移除无法展示的问题
  watch(groupdsFieldsData, (val) => {
    if (state.groupWatch) {
      state.groupList = omitGroupsHandler(val, state.groupList)
    } else {
      state.groupWatch = true
    }
  })

  const addGroupItem = () => {
    if (state.groupList.length > 4) return
    if (Object.keys(groupdsFieldsData.value).length === 0) {
      ElMessage.warning(t('analysis.retention.noGroupAdd'))
      return
    }
    state.groupList.push({
      id: uuidv4(),
      ...getFirstField(groupdsFieldsData.value, state.groupList),
      timeType: '',
      range: {
        propertyRange: [],
        propertyRangeType: 1,
      },
    })
  }

  // 删除一项分组项
  const removeGroupItem = (index) => {
    if (!isNumber(index)) return
    state.groupList.splice(index, 1)
  }

  // 获取请求参数
  const getRequestParams = (isSaveReport = false) => {
    const data = {
      retention: [],
      event: {},
      globalFilts: {
        filts: [],
        relation: state.globalFilters.relation,
      },
      groupBy: [],
    }
    const eventsArr = [{ ...state.initialEvent }, { ...state.returnVisitEvent }]
    for (const item of eventsArr) {
      if (!item?.events?.eventName) {
        ElMessage.warning(t('analysis.retention.checkIndicator'))
        return
      }
      const tempData = {
        alias: '',
        eventId: item?.events?.eventId,
        eventName: item?.events?.eventName,
        eventDesc: item?.events?.eventNameZh,
        eventType: item?.events?.eventType,
        filts: [],
        relation: item?.eventFilters?.relation || 0,
      }
      const filters = parseFilterData(item.eventFilters)
      if (!filters) {
        ElMessage.warning(t('common.filterConditionErr'))
        return
      }
      tempData['filts'] = filters?.filts ?? []
      data.retention.push(tempData)
    }
    // 判断是否有同时展示
    if (state.showUserAction) {
      const userData = state.userAction
      if (!userData?.events?.eventName || !userData?.eventFields?.analysis) {
        ElMessage.warning(t('analysis.retention.checkDisplayIndicators'))
        return
      }
      data.event = {
        alias: '',
        eventId: userData?.events?.eventId,
        eventName: userData?.events?.eventName,
        eventNameDisplay: userData?.events?.eventNameZh,
        eventType: userData?.events?.eventType,
        propertyName: userData?.eventFields?.propertyName || '',
        propertyNameDisplay: userData?.eventFields?.propertyNameDisplay || '',
        analysis: userData?.eventFields?.analysis || '',
        analysisDesc: userData?.eventFields?.analysisDesc || '',
        filts: [],
        relation: userData?.eventFilters?.relation,
        parentId: userData?.eventFields?.parentId ?? '',
      }
      const filters = parseFilterData(userData.eventFilters)
      if (!filters) {
        ElMessage.warning(t('common.filterConditionErr'))
        return
      }
      data.event['filts'] = filters?.filts ?? []
    }
    //2、全局筛选
    const gf = parseFilterData(state.globalFilters)
    if (!gf) {
      ElMessage.warning(t('common.filterConditionErr'))
      return
    }
    data.globalFilts = { ...gf }
    // 分组处理
    data.groupBy = getGroupData(state.groupList)

    return mergeQp(data, props.mainState, isSaveReport, state.groupList)
  }

  const mergeQp = (params, state, isSaveReport, groupList = []) => {
    let data = {
      ...params,
      eventView: {
        timeZone: timeZoneStore.timeZone,
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
    }
    if (isSaveReport) {
      data = {
        ...data,
        showType: state.showType,
        cycle: state.unitCycle,
        keyDays: state.keyDays,
        onlyUserAction: state.onlyUserAction,
        showChartLabel: state.showChartLabel,
      }
      if (state.graphType !== 6) {
        const hasGroup = groupList.length > 0
        const groupOptionsData =
          !hasGroup && state.showType === 2 && state.graphType === 11
            ? cloneDeep(state.loseGroupOptions)
            : cloneDeep(state.groupOptions)
        data['groupCheck'] = {
          ...(isObject(groupOptionsData) ? groupOptionsData : {}),
          valueType: state.valueType,
          hasGroupItem: hasGroup,
        }
      }
    }
    return data
  }

  // 点击开始分析
  const startAnalysis = (fromReport = false, refresh = false) => {
    const res = getRequestParams()
    if (!res) return
    emits('analysis', { params: res, selectData: refresh, fromReport })
  }

  // 报表、草稿回显
  const echoReportAndDraft = async (data) => {
    if (!isObject(data)) return
    state.globalWatch = false
    state.groupWatch = false

    // 重置同时展示回访用户参与
    state.showUserAction = false
    state.userAction = {}

    const { event: sameTimeShow, retention, globalFilts, groupBy } = data
    await setIndexConfig(retention)
    await setSameTimeShowIndex(sameTimeShow)
    state.groupList = setGroupByDisplay(groupBy)
    state.globalFilters = setGlobalFiltersDisplay(globalFilts)
  }

  // 设置初始事件、回访事件指标回显
  const setIndexConfig = async (retention = []) => {
    const indexNames = ['initialEvent', 'returnVisitEvent']
    for (const i in retention) {
      state[indexNames[i]] = await setInitialEventIndex(retention[i])
    }
  }

  // 设置同时展示回访用户参与
  const setSameTimeShowIndex = async (config = {}) => {
    if (!config || Object.keys(config).length === 0) return
    state.showUserAction = true
    state.userAction = await getIndexItem(config)
  }

  return {
    state,
    addFilter,
    deleteFilter,
    eventChange,
    addGlobalFilter,
    deleteGlobalFilter,
    switchIndexStatus,
    groupdsFieldsData,
    addGroupItem,
    removeGroupItem,
    getRequestParams,
    startAnalysis,
    initBeforeGetEvents,
    echoReportAndDraft,
  }
}
