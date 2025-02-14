import {
  reactive,
  shallowRef,
  computed,
  inject,
  watchEffect,
  nextTick,
} from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { v4 as uuidv4 } from 'uuid'
import { cloneDeep, isObject } from 'lodash-es'
import useAnalysisUtils from '@/views/analysis/hooks/useAanlysisUtils.js'
import useOperate from '@/components/PropsFilter/useOperate'
import dayjs from 'dayjs'
import { tableKeysArr } from '@/enumeration'
import { t } from '@/locales/i18n'

const useSidebarHook = (props, { emits }) => {
  const route = useRoute()
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
    getEventByIndex,
    fetchEventFieldsData,
    setInitEventField,
    fetchFieldList,
    getFirstField,
    filterFieldListByOmitAttr,
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
    generateDefaultCluster,
  } = useAnalysisUtils()
  const {
    state: intervalState,
    handleIntervalAnalyse,
    mainRef,
  } = inject('intervalState')

  const LIMITS = tableKeysArr
  const EVENT_ITEMS = [
    { label: '起点事件', value: 'startEvent' },
    { label: '终点事件', value: 'endEvent' },
  ]
  const RELATION_TYPES = [
    { value: 1, label: t('analysis.interval.equal') },
    { value: 2, label: t('analysis.interval.high') },
    { value: 3, label: t('analysis.interval.low') },
  ]
  const state = reactive({
    loading: false,
  })

  const events = reactive({
    /**
     * @description 起点事件
     * @author fengsi<294068744@qq.com>
     * @date 2024-02-22 11:37:36
     */
    startEvent: {
      index: 'startEvent',
      showEventFields: false,
      fieldsList: {},
      event: {},
      filters: {
        relation: 0,
        filters: [],
      },
    },

    /**
     * @description 终点事件
     * @author fengsi<294068744@qq.com>
     * @date 2024-02-22 11:37:45
     */
    endEvent: {
      index: 'endEvent',
      showEventFields: false,
      fieldsList: shallowRef({}),
      event: {},
      filters: {
        relation: 0,
        filters: [],
      },
    },
  })

  /**
   * @description 关联属性
   * @author fengsi<294068744@qq.com>
   * @date 2024-02-22 11:42:03
   */
  const associationField = reactive({
    enable: true,
    startEvent: {
      fieldsList: {},
      field: {},
    },
    endEvent: {
      fieldsList: {},
      field: {},
      relation: {
        compareType: 1,
        compareValue: 0,
      },
    },
  })

  /**
   * @description 间隔上限
   * @author fengsi<294068744@qq.com>
   * @date 2024-02-22 11:54:51
   */
  const intervalLimit = reactive({
    time: 1,
    type: 'hour',
  })

  /**
   * @description 全局筛选
   * @author fengsi<294068744@qq.com>
   * @date 2024-02-23 10:48:57
   */
  const globalFilter = reactive({
    fieldsList: {},
    filters: {
      relation: 0,
      filters: [],
    },
  })

  /**
   * @description 分组项
   * @author fengsi<294068744@qq.com>
   * @date 2024-02-23 10:49:06
   */
  const groupOption = reactive({
    fieldsList: {},
    fields: [],
  })
  /**
   * @description 添加分组
   * @author fengsi<294068744@qq.com>
   * @date 2024-02-27 16:12:00
   */
  const handleGroupOptionAdd = () => {
    if (groupOption.fields.length > 4) return

    if (Object.keys(groupOption.fieldsList).length === 0) {
      ElMessage.warning(t('analysis.noGroupAdd'))
      return
    }

    groupOption.fields.push({
      id: uuidv4(),
      ...getFirstField(groupOption.fieldsList, groupOption.fields),
      timeType: '',
      range: {
        propertyRange: [],
        propertyRangeType: 1,
      },
    })
  }
  /**
   * @description 移除分组
   * @author fengsi<294068744@qq.com>
   * @date 2024-02-27 16:13:44
   */
  const handleGroupOptionRemove = (index) => {
    groupOption.fields.splice(index, 1)
  }

  /**
   * @description 事件变更后之前已选的事件属性可能不存在，需要清除掉
   * @author fengsi<294068744@qq.com>
   * @date 2024-02-23 11:38:29
   */
  const omitFilters = (fieldsList = {}, index = 'startEvent') => {
    const target = index === 'globalFilter' ? globalFilter : events[index]

    target.filters.filters = omitFiltersHandler(
      fieldsList,
      target.filters.filters
    )
  }

  /**
   * @description 变更选择事件后的回调
   * @author fengsi<294068744@qq.com>
   * @date 2024-02-22 16:09:58
   */
  const handleEventChange = async (
    index = 'startEvent',
    { eventId },
    field = null,
    isOnload = false
  ) => {
    if (eventId) {
      try {
        events[index].fieldsList = await fetchFieldList(eventId)
        associationField[index].fieldsList = {
          ...(events[index].fieldsList || {}),
        }

        if (index === 'startEvent') {
          associationField.startEvent.field =
            field || getFirstField(associationField.startEvent.fieldsList)

          // 分组使用起点事件的属性
          groupOption.fieldsList = filterFieldListByOmitAttr(
            cloneDeep(events[index].fieldsList)
          )
          if (!isOnload) {
            groupOption.fields = omitGroupsHandler(
              groupOption.fieldsList,
              groupOption.fields
            )
          }
        } else {
          if (!field) {
            associationField.endEvent.relation.compareType = 1
            associationField.endEvent.relation.compareValue = 0
          }
        }

        if (!isOnload || index !== 'startEvent') {
          associationField.endEvent.fieldsList.eventField = (
            events.endEvent.fieldsList.eventField || []
          ).filter(
            (item) => item.fType === associationField.startEvent.field.fType
          )
        }
        associationField.endEvent.field =
          field || getFirstField(associationField.endEvent.fieldsList)

        !isOnload &&
          events[index].filters.filters.length > 0 &&
          omitFilters(events[index].fieldsList, index)

        if (startAndEndEventIds.value.length === 2) {
          globalFilter.fieldsList = await fetchFieldList(
            startAndEndEventIds.value.join(',')
          )
          !isOnload &&
            globalFilter.filters.filters.length > 0 &&
            omitFilters(globalFilter.fieldsList, 'globalFilter')
        }
      } catch (e) {
        events[index].fieldsList = {}
        associationField[index].fieldsList = {}
        associationField[index].field = {}
        events[index].filters.filters = []
      }
    }
  }

  /**
   * @description 添加条件
   * @author fengsi<294068744@qq.com>
   * @date 2024-02-22 17:06:24
   */
  const handleAddFilter = (index = 'startEvent', filterIndex = null) => {
    const target = index === 'globalFilter' ? globalFilter : events[index]

    target.filters = handleAddConditionData({
      condition: target.filters,
      noLimit: LIMITS,
      conditionList: target.fieldsList,
      index: filterIndex,
    })
  }

  /**
   * @description 删除条件
   * @author fengsi<294068744@qq.com>
   * @date 2024-02-23 12:07:42
   */
  const handleRemoveFilter = (
    index = 'startEvent',
    filterIndex = null,
    filterSubIndex = null
  ) => {
    const target = index === 'globalFilter' ? globalFilter : events[index]

    target.filters = handleDelConditionData({
      condition: target.filters,
      index: filterIndex,
      subIndex: filterSubIndex,
    })
  }

  /**
   * @description 变更选择关联属性后回调
   * @author fengsi<294068744@qq.com>
   * @date 2024-02-22 18:20:35
   */
  const handleFieldChange = (index = 'startEvent', field = {}) => {
    if (index === 'startEvent') {
      associationField.endEvent.fieldsList = {
        ...(events.endEvent.fieldsList || {}),
      }
      associationField.endEvent.fieldsList.eventField = (
        associationField.endEvent.fieldsList.eventField || []
      ).filter((item) => item.fType === associationField.startEvent.field.fType)
      associationField.endEvent.field = getFirstField(
        associationField.endEvent.fieldsList
      )
    }
  }

  /**
   * @description 获取起点事件跟终点事件的事件ID的交集，用于获取全局筛选项的事件属性列表数据
   * @author fengsi<294068744@qq.com>
   * @date 2024-02-23 11:03:32
   */
  const startAndEndEventIds = computed(() => {
    return [events.startEvent.event.eventId, events.endEvent.event.eventId]
      .filter((id) => id)
      .sort((a, b) => a - b)
  })

  /**
   * @description 保存报表（获取分析参数）
   * @author fengsi<294068744@qq.com>
   * @date 2024-02-23 17:25:01
   */
  const getRequestParams = () => {
    if (currentEventList.value.length === 0) {
      ElMessage.warning(t('analysis.interval.eventEmpty'))
      return
    }
    if (
      intervalState.timeParticle === 'hour' &&
      dayjs(intervalState.dateRange.endTime).diff(
        dayjs(intervalState.dateRange.startTime),
        'day'
      ) > 3
    ) {
      ElMessage.warning(t('analysis.interval.checkHourly'))
      emits('clearView')
      return
    }

    const data = {
      affinity: intervalState.affinity,
      startEvent: {},
      endEvent: {},
      eventView: {
        endTime: intervalState.dateRange.endTime,
        recentDay: intervalState.dateRange.recentDay,
        shortcutType: intervalState.dateRange.shortcutType,
        startTime: intervalState.dateRange.startTime,
        timeParticle: intervalState.timeParticle,
        timeZone: intervalState.timeZone,
        graphType: intervalState.graphType,
      },
      intervalRange: {
        unit: intervalLimit.type,
        value: intervalLimit.time,
      },
      globalFilts: {
        filts: [],
        relation: globalFilter.filters.relation,
      },
      groupCheck: intervalState.groupCheck,
      sortArr: intervalState.sortArr,
      intervalSplit: intervalState.intervalSplit,
    }

    if (!/^\d+(\.\d+)?$/.test(`${data.intervalRange.value}`)) {
      ElMessage.warning(t('analysis.interval.intervalLimitError'))
      return null
    }

    try {
      EVENT_ITEMS.forEach((item) => {
        const { index, event, filters } = events[item.value]

        const tempData = {
          alias: '',
          eventId: event.eventId,
          eventName: event.eventName,
          eventDesc: event.eventNameZh,
          eventType: event.eventType,
          filts: [],
          relation: filters.relation || 0,
        }

        if (associationField.enable) {
          tempData.assoProperty = getGroupData([
            associationField[index].field,
          ])[0]

          if (index === 'endEvent')
            Object.assign(
              tempData.assoProperty,
              associationField.endEvent.relation
            )

          if (
            ['int', 'double'].indexOf(associationField.endEvent.field.fType) ===
            -1
          ) {
            tempData.assoProperty.compareType = 1
            tempData.assoProperty.compareValue = 0
          }
        }

        const _filters = parseFilterData(filters)

        if (!_filters) {
          ElMessage.warning(t('common.filterConditionErr'))
          throw null
        }
        tempData['filts'] = _filters?.filts ?? []
        data[index] = tempData

        const globalFilters = parseFilterData(globalFilter.filters)
        if (!globalFilters) {
          ElMessage.warning(t('common.filterConditionErr'))
          throw null
        }
        data.globalFilts = { ...globalFilters }

        data.groupBy = getGroupData(groupOption.fields)
      })
    } catch (e) {
      return
    }

    return data
  }

  /**
   * @description 保存当前分析条件为草稿
   * @author fengsi<294068744@qq.com>
   * @date 2024-02-23 17:21:08
   */
  const handleDraftSave = (callback) => {
    const params = getRequestParams()
    if (!params) return
    callback(JSON.stringify(params))
  }

  /**
   * @description 填充草稿
   * @author fengsi<294068744@qq.com>
   * @date 2024-02-23 17:21:26
   */
  const handleDraftPadding = (data) => {
    const draftData = JSON.parse(data.draftData)
    handleReportOrDraftPadding(draftData)
  }

  const setEventByIndexs = async (eventList = {}, fields = {}) => {
    for (const key in eventList) {
      events[key].event = getFirstEvent(
        eventList[key].eventId || eventList[key].eventName
      )
      if (Object.keys(events[key].event).length === 0) {
        events[key].event = {
          eventNameZh: eventList[key].eventDesc,
          eventId: eventList[key].eventId || null,
          eventName: eventList[key].eventName,
          permissionStatus: false,
        }
      }

      events[key].filters = cloneDeep(parseFiltersFromRes(eventList[key]))
      await handleEventChange(
        events[key].index,
        events[key].event,
        fields[key],
        true
      )
    }
  }

  /**
   * @description 报表、草稿回显
   * @author fengsi<294068744@qq.com>
   * @date 2024-02-26 18:36:05
   * @fromSave 从保存场景来的,不重新计算
   */
  const handleReportOrDraftPadding = async (data, fromSave = false) => {
    if (!isObject(data)) return

    state.loading = true
    const {
      affinity,
      eventView,
      startEvent,
      endEvent,
      intervalRange,
      globalFilts,
      groupBy,
      groupCheck,
      sortArr,
      intervalSplit,
    } = data

    await setEventByIndexs(
      { startEvent, endEvent },
      {
        startEvent: startEvent.assoProperty
          ? setGroupByDisplay([startEvent.assoProperty])[0]
          : null,
        endEvent: endEvent.assoProperty
          ? setGroupByDisplay([endEvent.assoProperty])[0]
          : null,
      }
    )
    if (endEvent.assoProperty) {
      associationField.enable = true
      associationField.endEvent.relation.compareType =
        endEvent.assoProperty?.compareType
      associationField.endEvent.relation.compareValue =
        endEvent.assoProperty?.compareValue
    } else {
      associationField.enable = false
    }
    intervalLimit.type = intervalRange.unit
    intervalLimit.time = intervalRange.value
    groupOption.fields = setGroupByDisplay(groupBy)
    globalFilter.filters = setGlobalFiltersDisplay(globalFilts)

    setTimeout(() => {
      globalFilter.filters = setGlobalFiltersDisplay(globalFilts)
    }, 2000)

    intervalState.affinity = affinity
    intervalState.timeZone = eventView.timeZone
    intervalState.timeParticle = eventView.timeParticle
    intervalState.graphType = eventView.graphType
    intervalState.dateRange = {
      diff: eventView.recentDay,
      recentDay: eventView.recentDay,
      mainName: eventView.mainName,
      shortcutType: eventView.shortcutType || '',
      startTime: eventView.startTime,
      endTime: eventView.endTime,
    }

    if (intervalSplit) {
      intervalState.intervalSplit = intervalSplit
    }
    if (groupCheck) intervalState.groupCheck = groupCheck
    if (sortArr) intervalState.sortArr = sortArr

    state.loading = false
    if (!fromSave) {
      handleIntervalAnalyse(getRequestParams(), false, false)
    }
  }

  const getAnalysisItem = () => {
    events.startEvent.event = getEventByIndex(0)
    handleEventChange(events.startEvent.index, events.startEvent.event).then(
      () => {
        events.endEvent.event = getEventByIndex(1)
        handleEventChange(events.endEvent.index, events.endEvent.event)
      }
    )
  }

  if (!route.query.id) {
    initBeforeGetEvents(getAnalysisItem)
    addDefaultCluster()
  } else {
    getAnalysisItem()
  }

  // 处理默认分群
  function addDefaultCluster() {
    const stopWf = watchEffect(
      () => {
        const data = cloneDeep(globalFilter.fieldsList)
        if (isObject(data) && Object.keys(data).length > 0) {
          const item = generateDefaultCluster(
            data?.defaultCluster?.[0],
            route.path
          )
          if (item && isObject(item) && Object.keys(item).length > 0) {
            globalFilter.filters.filters.push(item)
          }
          stopWf()
        }
      },
      {
        flush: 'post',
      }
    )
  }

  const durationChange = () => {
    mainRef.value.intervalRangeRef.resetRange()
  }

  return {
    LIMITS,
    EVENT_ITEMS,
    RELATION_TYPES,
    state,
    events,
    associationField,
    intervalLimit,
    globalFilter,
    groupOption,
    durationChange,
    handleGroupOptionAdd,
    handleGroupOptionRemove,
    handleEventChange,
    getRequestParams,
    handleAddFilter,
    handleRemoveFilter,
    handleFieldChange,
    handleDraftSave,
    handleDraftPadding,
    handleReportOrDraftPadding,
  }
}

export default useSidebarHook
