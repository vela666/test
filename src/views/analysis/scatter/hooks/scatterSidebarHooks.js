import { reactive, computed, toRefs, watch, nextTick } from 'vue'
import useOperate from '@/components/PropsFilter/useOperate'
import useAanlysisUtils from '@/views/analysis/hooks/useAanlysisUtils.js'
import { cloneDeep } from 'lodash-es'
import useEventStore from '@/store/modules/event.js'
import { ElMessage } from 'element-plus'
import useTimeZoneStore from '@/store/modules/time-zone.js'
import { t } from '@/locales/i18n'

export function useScatterSidebarHooks(state, props) {
  const {
    parseFilterData,
    handleDelConditionData,
    handleAddConditionData,
    getFilterItem,
    omitFiltersHandler,
  } = useOperate()
  const {
    reportId,
    getFirstEvent,
    fetchEventFieldsData,
    setInitEventField,
    fetchFieldList,
    initBeforeGetEvents,
    getFormulaRequestParams,
    setIndexDisplay,
    currentEventList,
  } = useAanlysisUtils({ analysisType: 2, anyEvent: true })

  const timeZoneStore = useTimeZoneStore()
  const eventStore = useEventStore()

  const analysis = reactive({
    events: {},
    customizable: false,
    rangeList: [
      { title: t('analysis.scatter.discreteNumbers'), value: 0, fEh: 'def' },
      {
        title: t('analysis.scatter.customRange'),
        value: 2,
        fEh: 'user_defined',
      },
      {
        title: t('analysis.scatter.defaultRange'),
        value: 3,
        fEh: 'def_interval',
      },
    ],
  })

  const eventIds = computed(() => {
    let ids = []
    const item = analysis.events

    if (!analysis.customizable) {
      if (item?.events?.eventId) {
        ids.push(item.events.eventId)
      }
    } else if (analysis.customizable && Array.isArray(item?.code)) {
      // 自定义指标
      for (const subItem of item.code) {
        if (subItem.type === 2) {
          if (subItem?.value?.events?.eventId) {
            ids.push(subItem.value.events.eventId)
          }
        }
      }
    }
    return ids.length > 0
      ? [...new Set(ids)].sort((a, b) => a - b).join(',')
      : undefined
  })

  if (!reportId.value) {
    initBeforeGetEvents(initCreateEvent)
  }

  async function initCreateEvent() {
    analysis.events = await createEvent()
  }

  // 生成指标
  async function createEvent() {
    let temp = {
      events: {},
      eventFilters: {
        relation: 0,
        filters: [],
      },
      fieldsList: {},
      eventFields: {},
      eventFieldsData: {},
      range: {
        propertyRange: [0],
        propertyRangeType: 3,
      },
    }
    temp.events = getFirstEvent()

    if (temp?.events?.eventId) {
      // 分布分析 analysisType = 2
      temp.eventFieldsData = await fetchEventFieldsData(
        temp?.events?.eventId,
        2
      )
      temp.eventFields = setInitEventField(temp.eventFieldsData)
      temp.fieldsList = await fetchFieldList(temp.events.eventId)
    }
    return cloneDeep(temp)
  }

  /**
   * @description: 添加条件
   * @return {*}
   */
  const addFilter = (key, index) => {
    analysis.events.eventFilters = handleAddConditionData({
      condition: analysis.events.eventFilters,
      conditionList: analysis.events.fieldsList,
      index,
    })
  }

  /**
   * @description: 删除条件
   * @return {*}
   */
  const deleteFilter = (key, index, subIndex) => {
    analysis.events.eventFilters = handleDelConditionData({
      condition: analysis.events.eventFilters,
      index,
      subIndex,
    })
  }

  /**
   * @description: 过滤不存在的属性
   * @return {*}
   * @param {*} data
   */
  const omitFilters = (data) => {
    let temp = analysis.events.eventFilters?.filters
    if (!Array.isArray(temp) || temp.length === 0) return
    const newFilters = omitFiltersHandler(data, temp)

    analysis.events.eventFilters.filters = newFilters
  }

  const eventChange = async (index, val) => {
    if (val?.eventId) {
      const resData = await fetchEventFieldsData(val?.eventId, 2)
      analysis.events.eventFieldsData = resData
      analysis.events.eventFields = setInitEventField(resData)

      const fieldsListData = await fetchFieldList(val?.eventId)
      analysis.events.fieldsList = cloneDeep(fieldsListData)
      omitFilters(fieldsListData)
    }
  }

  /**
   * @description: 切换自定义指标与普通指标
   * @return {*}
   */
  const changeCustomizable = () => {
    analysis.customizable = !analysis.customizable
    analysis.events.eventFilters = {
      relation: 0,
      filters: [],
    }
    nextTick(() => {
      analysis.events.range = {
        propertyRange: [0],
        propertyRangeType: 3,
      }
      analysis.events.alias = t('analysis.customizedMetrics')
      analysis.events.round = 1
    })

    analysis.events.code = []

    // 重新生成普通指标
    if (!analysis.customizable) initCreateEvent()
  }

  /**
   * @description: 切换自定义指标的事件
   * @return {*}
   */
  const customEventChange = async (index, events) => {
    if (Array.isArray(events)) {
      analysis.events.fieldsList = await fetchFieldList(events.join(','))
      omitFilters(analysis.events.fieldsList)
    }
  }

  /**
   * @description: 校验QP
   * @return {*}
   */
  const validateConditions = () => {
    let flag = true
    if (analysis.customizable) {
      flag = getFormulaRequestParams(analysis.events.code)
    }

    if (analysis.events.eventFilters.filters.length > 0) {
      flag = parseFilterData(analysis.events.eventFilters)
    }
    if (!flag) ElMessage.warning(t('common.filterConditionErr'))
    return flag
  }

  /**
   * @description: 格式化QP
   * @return {*}
   */
  const getParams = () => {
    if (currentEventList.value.length === 0) {
      ElMessage.warning(t('analysis.indicatorsEmpty'))
      return
    }
    if (!validateConditions()) {
      return false
    }

    const { shortcutType, endTime, startTime, recentDay, diff } = toRefs(
      props.dateRange
    )

    const events = analysis.events

    let dynamic_events
    if (!analysis.customizable) {
      dynamic_events = {
        eventDesc: events.events.eventNameZh || events.events.eventDesc,
        eventName: events.events.eventName,
        eventType: events.events.eventType,
        ...events.eventFields,
      }
    } else {
      // 自定义指标
      dynamic_events = getFormulaRequestParams(events.code)
    }

    const qp = {
      events: {
        ...parseFilterData(events.eventFilters), // 条件筛选
        ...dynamic_events, // 指标
        ...parseGroupRange(events.range), // 区间
        alias: analysis.customizable ? events.alias : undefined,
        round: analysis.customizable ? events.round : undefined,
      },
      groupBy: parseGroupItem(state.conditionGroups),
      // 时区
      timeZone: timeZoneStore.timeZone,
      startTime: startTime.value,
      endTime: endTime.value,
      recentDay: recentDay.value,
      shortcutType: shortcutType.value,
      diff: diff.value,
      timeParticle: props.timeParticle,
      firstDayOfWeek:
        props.timeParticle === 'week' ? props.firstDayOfWeek : undefined,
      affinity: props.approxVal,
      sortArr: props.sortArr,
    }

    return qp
  }

  /**
   * @description:  离散数字、自定义区间、默认区间
   * @return {*}
   * @param {*} range  def 默认离散数字，user_defined 自定义区间，def_interval 默认区间
   */
  const parseGroupRange = (range) => {
    const obj = {
      intervalType:
        analysis.rangeList.find(
          (item) => item.value === range.propertyRangeType
        )?.fEh || 0,
      quotaIntervalArr: [],
    }

    if (range.propertyRangeType === 0 || range.propertyRangeType === 3) {
      obj.quotaIntervalArr = []
    } else if (range.propertyRangeType === 2) {
      obj.quotaIntervalArr =
        range.propertyRange.length > 0 ? range.propertyRange : [0]
    }

    return obj
  }

  /**
   * @description: 回显区间 离散数字、自定义区间、默认区间
   * @return {*}
   */
  const echoGroupRange = (range) => {
    const { intervalType, quotaIntervalArr } = range

    const propertyRangeType = analysis.rangeList.find(
      (item) => item.fEh === intervalType
    )?.value

    analysis.events.range = {
      propertyRange:
        quotaIntervalArr && quotaIntervalArr.length > 0
          ? quotaIntervalArr
          : [0],
      propertyRangeType: propertyRangeType || 0,
    }
  }

  /**
   * @description: 格式化分组项
   * @return {*}
   * @param { Array } data
   */
  const parseGroupItem = (data) => {
    return data.map((item) => {
      return {
        ...getFilterItem(item, []),
        ftv: undefined,
        timeType: item.timeType,
        propertyRange: item.range?.propertyRange,
        propertyRangeType: item.range?.propertyRangeType,
      }
    })
  }

  return {
    analysis,
    eventIds,
    currentEventList,
    addFilter,
    deleteFilter,
    changeCustomizable,
    customEventChange,
    eventChange,
    getParams,
    setIndexDisplay,
    echoGroupRange,
    initBeforeGetEvents,
  }
}
