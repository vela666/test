import { ref, reactive, computed, watch, onMounted } from 'vue'
import useOperate from '@/components/PropsFilter/useOperate'
import { cloneDeep, omit, isNumber, isObject } from 'lodash-es'
import { v4 as uuidv4 } from 'uuid'
import { ElMessage } from 'element-plus'
import useAanlysisUtils from '@/views/analysis/hooks/useAanlysisUtils.js'
import { omitAttr } from '@/enumeration'
import useTimeZoneStore from '@/store/modules/time-zone.js'
import { tableKeysArr } from '@/enumeration'
import { t } from '@/locales/i18n'

const eventFieldTypeEnum = {
  returnVisitEvent: 4,
  initialDate: 5,
  userAction: 6,
}

const typeEnum = {
  returnVisitEvent: 'return_visit',
  initialDate: 'on_init',
  userAction: 'same_time',
}

const getCalcArr = () => [
  { label: t('analysis.ltv.followUserIndicators'), value: 'return_visit' },
  { label: t('analysis.ltv.initialDateIndicator'), value: 'on_init' },
]

const symbolsArr = [
  { label: '+', value: '+' },
  { label: '-', value: '-' },
  { label: '×', value: '×' },
  { label: '÷', value: '÷' },
]

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
    getFormulaRequestParams,
    getIndexItem,
    getFormulaIndexItem,
    setGlobalFiltersDisplay,
    setGroupByDisplay,
    omitGroupsHandler,
    getGroupData,
    setInitialEventIndex,
    setUserPropsIndex,
    filterFieldListByOmitAttr,
  } = useAanlysisUtils()

  const timeZoneStore = useTimeZoneStore()

  const state = reactive({
    userPropSwitch: false,
    showUserAction: false,
    showInitialDate: false,
    indexCalc: false,
    initialEvent: {},
    returnVisitEvent: {},
    initialDate: {},
    userAction: {},
    calcArr: getCalcArr(),
    calcSymbol: '+',
    calcRound: 0,
    globalFiledsData: {},
    globalFilters: {
      relation: 0,
      filters: [],
    },
    groupList: [],
    userProps: {},
    userFieldList: {},
    globalWatch: true,
    groupWatch: true,
  })

  getUserProps()

  if (!reportId.value) {
    initBeforeGetEvents(initAnalysisStatus)
  }

  async function initAnalysisStatus() {
    state.initialEvent = await getAnalysisItem('initialEvent')
    state.returnVisitEvent = await getAnalysisItem('returnVisitEvent')
  }

  //剔除掉'__fid', '__bid', '__did'
  const omitUserFieldList = (userFieldList) => {
    if (!userFieldList || !Object.keys(userFieldList).length) return {}
    const temp = {}
    for (const key in userFieldList) {
      temp[key] = ['userField', 'eventFiled'].includes(key)
        ? userFieldList[key].filter((el) => !omitAttr.includes(el.fEn))
        : userFieldList[key]
    }
    return cloneDeep(temp)
  }

  async function getUserProps() {
    const result = await fetchFieldList()
    //relationTableType 关联表类型 0表示用户表 1表示事件表
    result.customTableList = result.customTableList.filter(
      (item) => item.relationTableType === 0
    )
    state.userFieldList = omit(cloneDeep(result), 'eventField')
    const temp = {}
    if (Array.isArray(result?.userField)) {
      temp['field'] =
        result.userField.filter((el) =>
          ['timestamp', 'datetime'].includes(el.fType)
        ) || []
    }
    state.userProps = cloneDeep(temp)
  }

  // 生成普通指标
  async function getAnalysisItem(key) {
    const isInitUser = key === 'initialEvent'
    let temp = {
      events: {},
      eventFilters: {
        relation: 0,
        filters: [],
      },
      fieldsList: {},
    }
    if (!isInitUser) {
      temp = {
        ...temp,
        customizable: false,
        eventFields: {},
        eventFieldsData: {},
      }
    }
    temp.events = getFirstEvent()
    if (temp?.events?.eventId) {
      if (!isInitUser) {
        temp.eventFieldsData = await fetchEventFieldsData(
          temp?.events?.eventId,
          eventFieldTypeEnum[key]
        )
        temp.eventFields = setInitEventField(temp.eventFieldsData)
      }
      // 获取筛选条件的数据源
      temp.fieldsList = await fetchFieldList(temp.events.eventId)
    }
    return cloneDeep(temp)
  }

  // 初始用户中的用户事件和用户属性切换
  const switchToUserProps = async () => {
    state.userPropSwitch = !state.userPropSwitch
    state.globalFilters = {
      relation: 0,
      filters: [],
    }
    if (state.userPropSwitch) {
      if (Array.isArray(state.userProps?.field) && state.userProps.field?.[0]) {
        const field = state.userProps.field[0]
        state.initialEvent = {
          userField: {
            parentId: field?.fieldId,
            permissionStatus: field?.permissionStatus,
            propertyName: field?.fEn,
            propertyNameDisplay: field?.fZh,
          },
        }
      }
    } else {
      state.initialEvent = await getAnalysisItem('initialEvent')
    }
  }
  // 切换开关（初始日期指标、同时展示回访用户参与）
  const switchIndexStatus = async (key, status) => {
    if (!['initialDate', 'userAction'].includes(key)) return
    state[key] = status ? await getAnalysisItem(key) : {}
    if (['userAction', 'initialDate'].includes(key) && !status) {
      state.indexCalc = false
    }
  }

  // 获取各个分析指标中的事件id
  const getIndexEventId = (index) => {
    const eId = state[index]?.events?.eventId
    if (!eId && index === 'initialEvent') {
      return 0
    }
    const code = state[index]?.code
    if (!eId && Array.isArray(code) && code.length > 0) {
      let ids = []
      for (const item of code) {
        if (item.type === 2 && item?.value?.events?.eventId) {
          ids.push(item.value.events.eventId)
        }
      }
      ids = [...new Set(ids)].sort((a, b) => a - b)
      return ids.length > 0 ? ids.join(',') : 0
    }
    return eId
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

  // 全局筛选相关的事件id集合
  const getGlobFiledEvents = () => {
    const events = []
    const eventsArr = ['initialEvent', 'returnVisitEvent']
    // 开启同时展示并且不是指标计算
    if (state.showUserAction && !state.indexCalc) {
      eventsArr.push('userAction')
    }
    // 是否有初始日期指标
    if (state.showInitialDate) {
      eventsArr.push('initialDate')
    }
    for (const k of eventsArr) {
      const eventId = getIndexEventId(k)
      if (typeof eventId === 'number') {
        events.push(eventId)
      } else if (typeof eventId === 'string') {
        events.push(...eventId.split(','))
      }
    }
    return events
  }

  // 全局筛选数据源的请求中所要用到的事件id集合
  const globalFiledEvents = computed(() => {
    const events = getGlobFiledEvents()
    return [...new Set(events)].sort((a, b) => a - b).join(',')
  })

  // 侦听全局筛选数据源的请求中所要用到的事件id集合改变重新请求数据
  watch(globalFiledEvents, async (val) => {
    const eventId =
      typeof val === 'string'
        ? val
            .split(',')
            .filter((el) => Number(el) !== 0 && !isNaN(Number(el)))
            .join(',')
        : val
    let resData = await fetchFieldList(eventId)
    if (state.userPropSwitch) {
      Reflect.deleteProperty(resData, 'eventField')
      //relationTableType 关联表类型 0表示用户表 1表示事件表
      resData.customTableList = resData.customTableList.filter(
        (item) => item.relationTableType === 0
      )
    }
    state.globalFiledsData = resData
  })

  watch(
    () => state.globalFiledsData,
    (val) => {
      if (state.globalWatch) {
        // 处理全局筛选 剔除当前属性列表不存在的值
        omitFilters(val)
      } else {
        state.gloablWatch = false
      }
    }
  )

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
    const isInitUser = index === 'initialEvent'
    if (val?.eventId) {
      if (!isInitUser) {
        const resData = await fetchEventFieldsData(
          val?.eventId,
          eventFieldTypeEnum[index]
        )
        state[index].eventFieldsData = resData
        state[index].eventFields = setInitEventField(resData)
      }
      const fieldsListData = await fetchFieldList(val?.eventId)
      state[index].fieldsList = cloneDeep(fieldsListData)
      omitFilters(fieldsListData, index)
    }
  }

  // 分组项中的数据源
  const groupdsFieldsData = computed(() => {
    let resData = {}
    if (!state.userPropSwitch) {
      resData = omitUserFieldList(cloneDeep(state.initialEvent.fieldsList))
    } else {
      resData = omitUserFieldList(cloneDeep(state.userFieldList))
    }
    return filterFieldListByOmitAttr(resData)
  })

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
      ElMessage.warning(t('analysis.ltv.noGroupAdd'))
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

  //生成自定义指标
  const getCustomAnalysisItem = () => {
    const temp = {
      code: [],
      eventFilters: {
        relation: 0,
        filters: [],
      },
      alias: t('analysis.customizedMetrics'),
      aliasEdited: true,
      customizable: true,
      fieldsList: {},
      round: 0,
    }
    return cloneDeep(temp)
  }

  // 切换指标形态（普通指标和自定义指标）
  const switchIndex = async (index) => {
    if (!state[index].customizable) {
      state[index] = getCustomAnalysisItem()
    } else {
      state[index] = await getAnalysisItem(index)
    }
  }

  const switchTip = (customizable) =>
    customizable
      ? t('analysis.returnIndicatorSelection')
      : t('analysis.switchCustomIndicators')

  // 自定义指标事件改变回调
  async function customEventChange(index, events) {
    if (Array.isArray(events)) {
      state[index].fieldsList = await fetchFieldList(events.join(','))
      omitFilters(state[index].fieldsList, index)
    }
  }

  // 改变计算因子顺序
  const changeCalculateOrder = () => {
    state.calcArr.reverse()
  }

  const getCommonIndexParams = (index) => {
    const data = state[index]
    let params = {}
    if (index === 'initialEvent') {
      if (state.userPropSwitch) {
        if (!data?.userField?.propertyName) {
          ElMessage.warning(t('analysis.ltv.checkIndicator'))
          return false
        }
        // 用户属性
        params = {
          type: 'source_user',
          propertyName: data?.userField?.propertyName,
          propertyNameDisplay: data?.userField?.propertyNameDisplay,
          filts: [],
          parentId: data?.userField?.parentId,
        }
      } else {
        if (!data?.events?.eventName) {
          ElMessage.warning(t('analysis.ltv.checkIndicator'))
          return false
        }
        // 用户事件
        params = {
          type: 'source_event',
          eventId: data?.events?.eventId,
          eventName: data?.events?.eventName,
          eventNameDisplay: data?.events?.eventNameZh,
          eventType: data?.events?.eventType,
          filts: [],
          relation: data?.eventFilters?.relation || 0,
        }
      }
    } else {
      if (data.customizable) {
        if (!data.alias) {
          ElMessage.warning(t('analysis.ltv.checkCustomIndicatorName'))
          return false
        }
        const res = getFormulaRequestParams(data.code)
        if (!res) {
          return false
        }
        params = {
          type: typeEnum[index],
          alias: data.alias,
          custom: res.custom,
          customIndex:
            res?.customIndex?.map((el) => ({
              type: typeEnum[index],
              ...el,
            })) ?? [],
          round: data.round,
          filts: [],
          relation: data?.eventFilters?.relation || 0,
        }
      } else {
        if (!data?.events?.eventName || !data?.eventFields?.analysis) {
          ElMessage.warning(t('analysis.ltv.checkIndicator'))
          return false
        }
        params = {
          type: typeEnum[index],
          eventId: data?.events?.eventId,
          eventName: data?.events?.eventName,
          eventNameDisplay: data?.events?.eventNameZh,
          eventType: data?.events?.eventType,
          propertyName: data?.eventFields?.propertyName || '',
          propertyNameDisplay: data?.eventFields?.propertyNameDisplay || '',
          analysis: data?.eventFields?.analysis || '',
          analysisDesc: data?.eventFields?.analysisDesc || '',
          filts: [],
          relation: data?.eventFilters?.relation,
          parentId: data?.eventFields?.parentId ?? '',
        }
      }
    }

    // 指标条件筛选
    if (params.type !== 'source_user') {
      const filters = parseFilterData(data.eventFilters)
      if (!filters) {
        ElMessage.warning(t('common.filterConditionErr'))
        return false
      }
      params['filts'] = filters?.filts ?? []
    }

    return { ...params }
  }

  // 获取请求参数
  const getRequestParams = (isSaveReport = false) => {
    const data = {
      events: [],
      globalFilts: {
        filts: [],
        relation: state.globalFilters.relation,
      },
      groupBy: [],
    }
    // 初始用户、回访用户指标
    const eventIndex = ['initialEvent', 'returnVisitEvent']
    // 初始日期指标
    if (state.showInitialDate) {
      eventIndex.push('initialDate')
    }
    // 同时展示（非指标计算形式）
    if (state.showUserAction && !state.indexCalc) {
      eventIndex.push('userAction')
    }

    for (const item of eventIndex) {
      const res = getCommonIndexParams(item)
      if (!res) {
        return
      }
      data.events.push({ ...res })
    }

    // 同时展示（指标计算）
    if (state.showUserAction && state.showInitialDate && state.indexCalc) {
      let symbol = state.calcSymbol
      if (symbol === '×') {
        symbol = '*'
      } else if (symbol === '÷') {
        symbol = '/'
      }
      data.events.push({
        type: 'same_time_arithmetic',
        custom: state.calcArr.map((el) => el.value).join(symbol),
        filts: [],
        round: state.calcRound,
      })
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

    return mergeQp(data, props.mainState, isSaveReport)
  }

  const mergeQp = (params, state, isSaveReport) => {
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
        analysisParticle: state.unitCycle.type,
      },
      showChartLabel: state.showChartLabel,
    }
    if (isSaveReport) {
      data = {
        ...data,
        cycle: state.unitCycle,
        keyDays: state.keyDays,
        onlyUserAction: state.onlyUserAction,
        showChartLabel: state.showChartLabel,
      }
      if (state.graphType !== 6) {
        data['groupCheck'] = cloneDeep(state.groupOptions)
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
    const { events, globalFilts, groupBy } = data
    await setIndexConfig(events)
    state.groupList = setGroupByDisplay(groupBy)
    state.globalFilters = setGlobalFiltersDisplay(globalFilts)
  }

  // 设置指标回显
  const setIndexConfig = async (events = []) => {
    if (!Array.isArray(events)) return
    const indexEnum = {
      source_event: 'initialEvent',
      source_user: 'initialEvent',
      return_visit: 'returnVisitEvent',
      on_init: 'initialDate',
      same_time: 'userAction',
      same_time_arithmetic: 'userAction',
    }

    // 重置初始日期指标和同时展示回访用户参与
    state.showUserAction = false
    state.showInitialDate = false
    state.userPropSwitch = false
    state.initialDate = {}
    state.userAction = {}

    // 初始用户指标和同时展示需要特殊处理 initialEvent 和 userAction
    for (const item of events) {
      const type = indexEnum[item.type]
      if (type === 'initialEvent') {
        await setInitialEvent(type, item)
      } else if (type === 'userAction') {
        if (item.type === 'same_time_arithmetic') {
          setUserActionArithmetic(item)
        } else {
          await setCommonEvent(type, item, eventFieldTypeEnum[type] || 1)
        }
      } else {
        await setCommonEvent(type, item, eventFieldTypeEnum[type] || 1)
      }
    }
  }

  // 设置初始用户
  const setInitialEvent = async (name, config) => {
    // 判断初始用户的分析指标是事件还是用户属性
    const isUserAttr = config.type === 'source_user'
    if (isUserAttr) {
      state.userPropSwitch = true
      await getUserProps()
      state[name] = setUserPropsIndex(config, state.userProps?.field)
    } else {
      state[name] = await setInitialEventIndex(config)
    }
  }

  const setCommonEvent = async (name, config, type = 1) => {
    // 同时展示开关开启
    if (name === 'userAction') {
      state.showUserAction = true
    }
    // 初始日期指标
    if (name === 'initialDate') {
      state.showInitialDate = true
    }
    config['analysisType'] = type
    //自定义指标和普通指标
    if (Array.isArray(config?.customIndex)) {
      state[name] = await getFormulaIndexItem(config)
    } else {
      state[name] = await getIndexItem(config)
    }
  }

  const setUserActionArithmetic = (config) => {
    state.showUserAction = true
    state.indexCalc = true
    state.calcRound = config.round
    let symbol = '+'
    if (typeof config.custom === 'string') {
      // eslint-disable-next-line no-useless-escape
      const result = config.custom.match(/[\+\-\*\/]/g)
      if (Array.isArray(result) && result.length > 0) {
        symbol = result[0]
      }
      if (symbol === '*') {
        symbol = '×'
      } else if (symbol === '/') {
        symbol = '÷'
      }
      state.calcSymbol = symbol
      // eslint-disable-next-line no-useless-escape
      const formula = config.custom.split(/[\+\-\*\/]/)
      const fIndex = formula.indexOf('return_visit')
      const calcArr = getCalcArr()
      state.calcArr = fIndex === 0 ? calcArr : calcArr.reverse()
    }
  }

  return {
    state,
    switchToUserProps,
    switchIndexStatus,
    addFilter,
    deleteFilter,
    addGlobalFilter,
    deleteGlobalFilter,
    eventChange,
    groupdsFieldsData,
    addGroupItem,
    removeGroupItem,
    switchIndex,
    switchTip,
    customEventChange,
    changeCalculateOrder,
    symbolsArr,
    startAnalysis,
    getRequestParams,
    initBeforeGetEvents,
    echoReportAndDraft,
  }
}
