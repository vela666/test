import { computed, reactive, toRefs } from 'vue'
import useOperate from '@/components/PropsFilter/useOperate'
import useAanlysisUtils from '@/views/analysis/hooks/useAanlysisUtils.js'
import { cloneDeep } from 'lodash-es'
import { ElMessage } from 'element-plus'
import useTimeZoneStore from '@/store/modules/time-zone.js'
import { t } from '@/locales/i18n'
import { v4 as uuidv4 } from 'uuid'
import { convertToSeconds } from '@/utils/dataProcessing.js'
import useGroupHooks from '../hooks/groupHooks'
import { isBoolean } from '@/utils/types.js'
import useEventStore from '@/store/modules/event'

export default function ({ state, props, targetGroup, commonGroup }) {
  const eventStore = useEventStore()

  const {
    parseFilterData,
    handleDelConditionData,
    handleAddConditionData,
    omitFiltersHandler,
  } = useOperate()
  const {
    reportId,
    getFirstEvent,
    fetchEventFieldsData,
    setInitEventField,
    fetchFieldList,
    initBeforeGetEvents,
    setIndexDisplay,
    currentEventList,
    generateDefaultCluster,
  } = useAanlysisUtils({ analysisType: 14, anyEvent: true })

  const {
    getFirstField,
    parseGroupItem,
    disabledGroups,
    getGroupFieldsData,
    omitGroups,
  } = useGroupHooks({
    omitAttr: true, // 分组项是否过滤掉['__fid', '__bid', '__did']
    eventIds: true,
  })
  const timeZoneStore = useTimeZoneStore()
  const initVal = () => {
    return {
      targetEvent: {},
      // 归因方式：0 末次归因、1 首次归因、2 线性归因、3 位置归因
      model: 1,
      // 直接转化是否参与归因计算：false 否、true 是
      directConversion: false,
      // 窗口期类型
      windowPeriodType: 1,
      // 归因事件分组
      attributedGruopType: 1,
      windowPeriodTimeVal: {
        time: 1,
        type: 'day',
      },
      // 归因
      attrEvents: [],
    }
  }
  const analysis = reactive(initVal())

  const eventIds = computed(() => {
    let ids = []
    const item = analysis.targetEvent
    if (item?.events?.eventId) {
      ids.push(item.events.eventId)
    }
    if (analysis.attrEvents.length) {
      ids = [...ids, ...analysis.attrEvents.map((item) => item.events.eventId)]
    }

    /* return ids.length > 0
      ? [...new Set(ids)].sort((a, b) => a - b).join(',')
      : ''*/
    return [...new Set(ids)].sort((a, b) => a - b)
  })

  const attrEventsIds = computed(() => {
    return analysis.attrEvents.map((item) => item.events.eventId)
  })

  const targetEventId = computed(() => {
    return analysis.targetEvent?.events?.eventId
  })

  if (!reportId.value) {
    initBeforeGetEvents(initCreateEvent)
  }

  async function initCreateEvent() {
    analysis.targetEvent = await createEvent()
    createAttributionEvent()
  }

  // 生成指标
  async function createEvent() {
    let temp = {
      events: getFirstEvent(),
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

    if (temp?.events?.eventId) {
      temp.eventFieldsData = await fetchEventFieldsData(
        temp?.events?.eventId,
        14
      )
      temp.eventFields = setInitEventField(temp.eventFieldsData)
      temp.fieldsList = await fetchFieldList(temp.events.eventId)
    }
    return temp
  }

  // 生成归因事件
  let isReq = false
  const createAttributionEvent = async () => {
    if (isReq || analysis.attrEvents.length > 5) return
    if (currentEventList.value.length === 0) {
      ElMessage.warning(t('analysis.indicatorsEmpty'))
      return
    }

    let temp = {
      events: getFirstEvent('', eventIds.value),
      fieldsList: {},
      joinOn: [],
      associatedAttributeStatus: false,
      associatedAttributeData: [],
      groupBy: [],
      groupFieldsData: {},
      eventFilters: {
        relation: 0,
        filters: [],
      },
    }

    if (temp?.events?.eventId) {
      try {
        isReq = true
        temp.fieldsList = await fetchFieldList(temp.events.eventId)
        temp.groupFieldsData = await getGroupFieldsData(temp.events.eventId)
      } finally {
        isReq = false
      }
    }

    analysis.attrEvents.push(temp)
  }

  /**
   * @description: 添加条件
   * @return {*}
   */
  const addFilter = (key, index, fIndex) => {
    if (key === 'eventFilters') {
      analysis.targetEvent.eventFilters = handleAddConditionData({
        condition: analysis.targetEvent.eventFilters,
        conditionList: analysis.targetEvent.fieldsList,
        index: index,
      })
    } else {
      analysis.attrEvents[index].eventFilters = handleAddConditionData({
        condition: analysis.attrEvents[index].eventFilters,
        conditionList: analysis.attrEvents[index].fieldsList,
        index: fIndex,
      })
    }
  }

  /**
   * @description: 删除条件
   * @return {*}
   */
  const deleteFilter = (key, i, fIndex, subIndex) => {
    if (key === 'eventFilters') {
      analysis.targetEvent.eventFilters = handleDelConditionData({
        condition: analysis.targetEvent.eventFilters,
        index: fIndex,
        subIndex,
      })
    } else {
      analysis.attrEvents[i].eventFilters = handleDelConditionData({
        condition: analysis.attrEvents[i].eventFilters,
        index: fIndex,
        subIndex,
      })
    }
  }

  // 过滤不存在的属性
  const omitFilters = (data, attrEvent) => {
    let temp = !attrEvent
      ? analysis.targetEvent.eventFilters?.filters
      : attrEvent.eventFilters?.filters
    if (!Array.isArray(temp) || temp.length === 0) return
    const newFilters = omitFiltersHandler(data, temp)

    if (!attrEvent) {
      analysis.targetEvent.eventFilters.filters = newFilters
    } else {
      attrEvent.eventFilters.filters = newFilters
    }
  }

  const targetItemChange = async (index, val) => {
    if (val?.eventId) {
      analysis.attrEvents.forEach((item) => {
        item.associatedAttributeStatus = false
        item.joinOn = []
      })
      const resData = await fetchEventFieldsData(val?.eventId, 14)
      analysis.targetEvent.eventFieldsData = resData
      analysis.targetEvent.eventFields = setInitEventField(resData)
      const fieldsListData = await fetchFieldList(val?.eventId)
      analysis.targetEvent.fieldsList = cloneDeep(fieldsListData)
      omitFilters(fieldsListData)
    }
  }

  const attrEventChange = async (val) => {
    if (val?.events?.eventId) {
      val.associatedAttributeStatus = false
      val.joinOn = []
      val.groupFieldsData = await getGroupFieldsData(val.events.eventId)
      const fieldsListData = await fetchFieldList(val.events.eventId)
      val.fieldsList = fieldsListData
      val.groupBy = omitGroups(val.groupFieldsData, val.groupBy)
      omitFilters(fieldsListData, val)
    }
  }

  const getAttrEventsResult = () => {
    const result = []
    let hasError = false
    // 事件
    for (let i = 0; i < analysis.attrEvents.length; i++) {
      const item = analysis.attrEvents[i]
      const eventObj = {
        eventId: item.events.eventId,
        eventName: item.events.eventName,
        eventNameDisplay: item.events.eventNameZh,
        eventType: item.events.eventType,
        filts: [],
        relation: item.eventFilters.relation || 0,
        groupBy: parseGroupItem(item.groupBy),
        joinOn: item.joinOn,
        associatedAttributeStatus: item.associatedAttributeStatus,
        associatedAttributeData: item.associatedAttributeData,
      }
      if (item.eventFilters?.filters?.length) {
        const event = parseFilterData(item.eventFilters)
        if (isBoolean(event)) {
          hasError = true
          break
        } else {
          eventObj.filts = event.filts
          eventObj.relation = event.relation
        }
      }
      result.push(eventObj)
    }

    if (hasError) return false
    return result
  }

  /**
   * @description: 校验QP
   * @return {*}
   */
  const validateConditions = () => {
    let targetEventFlag = true
    let attrEventsFlag = true
    let conditionFiltersFlag = true
    if (analysis.targetEvent?.eventFilters?.filters.length > 0) {
      targetEventFlag = parseFilterData(analysis.targetEvent.eventFilters)
    }

    if (analysis.attrEvents.length > 0) {
      attrEventsFlag = getAttrEventsResult()
    }

    if (state.conditionFilters.filters.length > 0) {
      conditionFiltersFlag = parseFilterData(state.conditionFilters)
    }

    const mark = targetEventFlag && attrEventsFlag && conditionFiltersFlag
    if (!mark) ElMessage.warning(t('common.filterConditionErr'))
    return mark
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
    if (!validateConditions()) return false
    if (!analysis.attrEvents.length || analysis.attrEvents.length > 5) {
      ElMessage.warning(t('analysis.attributed.attributionEventLimit'))
      return false
    }
    const { shortcutType, endTime, startTime, recentDay, diff } = toRefs(
      props.dateRange
    )

    const events = analysis.targetEvent

    let dynamic_events = {
      eventDesc: events.events.eventDesc || events.events.eventNameZh,
      eventNameDisplay: events.events.eventNameZh,
      eventName: events.events.eventName,
      eventType: events.events.eventType,
      ...events.eventFields,
    }

    const qp = {
      targetEvent: {
        ...parseFilterData(events.eventFilters), // 条件筛选
        ...dynamic_events, // 指标
        alias: undefined,
        round: undefined,
        groupBy: parseGroupItem(targetGroup.state.conditionGroups),
      },
      groupBy: parseGroupItem(commonGroup.state.conditionGroups),
      attrEvents: getAttrEventsResult(),
      windowPeriodType: analysis.windowPeriodType,
      windowPeriodTimeVal:
        analysis.windowPeriodType === 2
          ? initVal().windowPeriodTimeVal
          : analysis.windowPeriodTimeVal,
      period:
        analysis.windowPeriodType === 2
          ? 0
          : convertToSeconds(analysis.windowPeriodTimeVal),
      directConversion: analysis.directConversion,
      model: analysis.model,
      // 时区
      eventView: {
        timeZone: timeZoneStore.timeZone,
        startTime: startTime.value,
        endTime: endTime.value,
        recentDay: recentDay.value,
        shortcutType: shortcutType.value,
        diff: diff.value,
      },
      globalFilts: parseFilterData(state.conditionFilters),
      sortArr: props.sortArr,
      attributedGruopType: analysis.attributedGruopType,
    }
    return qp
  }

  // 删除归因事件
  const removeAttributionEvent = (i) => {
    analysis.attrEvents.splice(i, 1)
    if (analysis.attrEvents.length < 1) {
      commonGroup.state.conditionGroups = []
      analysis.attributedGruopType = 1
    }
  }

  const attributedGruopChange = (val) => {
    if (val === 1) {
      analysis.attrEvents.forEach((item) => {
        item.groupBy = []
      })
    } else {
      commonGroup.state.conditionGroups = []
    }
  }

  // 添加分组项
  const addGroupIterm = (item) => {
    if (Object.keys(item.groupFieldsData).length === 0) {
      ElMessage.warning(t('analysis.ltv.noGroupAdd'))
      return
    }
    const firstField = getFirstField(
      item.groupFieldsData,
      disabledGroups(item.groupBy)
    )
    item.groupBy.push({
      id: uuidv4(),
      ...firstField,
      timeType: ['timestamp', 'datetime'].includes(firstField.fType)
        ? 'day'
        : '',
      range: {
        propertyRange: [],
        propertyRangeType: 1,
      },
    })
  }

  // 删除分组项
  const removeGroupItem = (item, index) => {
    item.groupBy.splice(index, 1)
  }

  return {
    analysis,
    eventIds,
    targetEventId,
    attrEventsIds,
    currentEventList,
    addFilter,
    deleteFilter,
    getParams,
    addGroupIterm,
    removeGroupItem,
    setIndexDisplay,
    attrEventChange,
    targetItemChange,
    getGroupFieldsData,
    initBeforeGetEvents,
    createAttributionEvent,
    removeAttributionEvent,
    generateDefaultCluster,
    attributedGruopChange,
  }
}
