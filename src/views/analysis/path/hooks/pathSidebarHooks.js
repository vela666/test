import { reactive, computed, toRefs, watch, nextTick } from 'vue'
import useOperate from '@/components/PropsFilter/useOperate'
import useAanlysisUtils from '@/views/analysis/hooks/useAanlysisUtils.js'
import { ElMessage } from 'element-plus'
import { cloneDeep, isEmpty, pick } from 'lodash-es'
import useEventStore from '@/store/modules/event.js'
import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'
import useTimeZoneStore from '@/store/modules/time-zone.js'
import { getHideFieldInfo } from '@/api/modules/analysis/common.js'
import { t } from '@/locales/i18n'

export function usePathSidebarHooks(state, props, emit) {
  const {
    setFilterItem,
    parseFilterData,
    getFilterItem,
    omitFiltersHandler,
    parseFiltersFromRes,
  } = useOperate()

  const { fetchFieldList, initBeforeGetEvents } = useAanlysisUtils()

  const timeZoneStore = useTimeZoneStore()
  const eventStore = useEventStore()
  const currentEventList = computed(() => eventStore.currentEventList)

  const initForm = () => ({
    sourceEvent: {
      relation: 0,
      filters: [],
      sourceType: '0',
    },
    event: [],
  })

  const watchState = reactive({
    eventWatch: true,
    sourceEventWatch: true,
  })

  const analysis = reactive({
    eventNames: [],
    ...initForm(),
  })

  const session = reactive({
    time: 30,
    type: 'minute',
  })

  /**
   * @description: 改变事件
   * @return {*}
   */
  const eventChange = async (val) => {
    if (val.length === 0) {
      Object.assign(analysis, initForm())
    }

    initEventField(val)
    initSourceEvent(val)
  }

  /**
   * @description: 参与分析的事件
   * @return {*}
   */
  const initEventField = (val) => {
    analysis.eventFieldRef?.initEventField(val)
  }

  /**
   * @description: 分析路径以
   * @return {*}
   */
  const initSourceEvent = (val) => {
    analysis.sourceEventRef?.initSourceEvent(val, watchState.sourceEventWatch)
  }

  /**
   * @description: 校验qp是否符合
   * @return {*}
   */
  const validateConditions = () => {
    // 参与分析的事件
    if (analysis.eventNames.length === 0) {
      ElMessage.warning(t('analysis.path.checkSelectEvents'))
      return false
    }

    if (analysis.event.length > 0) {
      const flag_1 = analysis.event.every(
        (item) => item.split || item.filters.length > 0
      )

      if (!flag_1) {
        ElMessage.warning(t('analysis.path.checkDisplayEvents'))
        return false
      }
      const event = cloneDeep(analysis.event)
      const flag_2 = event.every((item) => {
        return parseFilterData(item)
      })
      if (!flag_2) {
        ElMessage.warning(t('common.filterConditionErr'))
        return false
      }
    }

    //  分析路径以 用户满足
    if (
      !parseFilterData(state.conditionFilters) ||
      !parseFilterData(analysis.sourceEvent)
    ) {
      ElMessage.warning('common.filterConditionErr')
      return false
    }

    // 用户满足 需要设置用户筛选条件
    /* if (state.conditionFilters.filters.length === 0) {
      ElMessage.warning('需要设置用户筛选条件')
      return false
    } */

    return true
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
    // 时间范围最多查询一周
    if (dayjs(endTime.value).diff(startTime.value, 'day') >= 7) {
      ElMessage.warning(t('analysis.path.maxQueryTimeRange'))
      return
    }

    // 事件筛选/拆分
    const fields = []
    const event = cloneDeep(analysis.event)
    event.forEach((item) => {
      let obj = {
        eventName: item.eventName,
        ...parseFilterData(item),
      }

      if (!isEmpty(item.fields)) {
        obj = {
          ...obj,
          ...getFilterItem(item.fields, []),
          ftv: undefined,
          timeType: item.fields.timeType,
          propertyRange:
            item.fields.range?.propertyRangeType === 0
              ? []
              : item.fields.range?.propertyRange,
          propertyRangeType: item.fields.range?.propertyRangeType,
        }
      }

      fields.push(obj)
    })

    // 事件过滤条件
    const eventFilters = fields.map((item) => {
      return {
        filts: item.filts,
        relation: item.relation,
        eventName: item.eventName,
      }
    })

    const qp = {
      eventNames: analysis.eventNames.map((item) => item.eventName), // 参与分析的事件
      fields, // 事件筛选/拆分
      eventFilters, // 事件过滤条件
      sourceEvent: {
        ...parseFilterData(analysis.sourceEvent),
        ...pick(analysis.sourceEvent, ['eventName', 'sourceType']),
        eventDesc:
          analysis.sourceEvent.eventNameZh || analysis.sourceEvent.eventDesc,
        eventType: analysis.sourceEvent.eventType,
      }, // 分析路径以
      userFilter: parseFilterData(state.conditionFilters), //用户满足
      // UTC+8
      timeZone: timeZoneStore.timeZone,
      startTime: startTime.value,
      endTime: endTime.value,
      recentDay: recentDay.value,
      shortcutType: shortcutType.value,
      diff: diff.value,
      sessionInterval: session.time,
      sessionType: session.type,
    }
    return qp
  }

  /**
   * @description: 保存草稿
   * @return {*}
   */
  const saveDraft = (cb) => {
    const params = getParams()
    if (!params) return
    const data = {
      ...params,
      dateRange: props.dateRange,
    }
    cb(JSON.stringify(data))
  }

  /**
   * @description: 填充草稿
   * @return {*}
   */
  const paddingDraft = (data) => {
    echoDetail(JSON.parse(data.draftData))
  }

  /**
   * @description: 报表详情回显
   * @return {*}
   */
  const echoDetail = async (data, cb) => {
    if (currentEventList.value.length === 0) {
      ElMessage.success(t('analysis.indicatorsEmpty'))
      return
    }
    state.needOmitWatch = false
    watchState.eventWatch = false
    watchState.sourceEventWatch = false
    const {
      eventNames,
      fields,
      sourceEvent,
      userFilter,
      sessionInterval,
      sessionType,
      diff,
      endTime,
      recentDay,
      shortcutType,
      startTime,
      timeZone = '8',
    } = data
    if (timeZone) {
      timeZoneStore.timeZone = timeZone
    }

    // 参与分析的事件
    analysis.eventNames = eventNames
      .map((item) => {
        const obj = currentEventList.value.find((val) => val.eventName === item)
        return obj
      })
      .filter(Boolean)

    const eventFilters = []

    for (let i = 0; i < fields.length; i++) {
      let obj = {
        id: uuidv4(),
        eventName: fields[i].eventName,
        filts: fields[i].filts || [],
        relation: fields[i].relation || 0,
      }

      const eventId = analysis.eventNames.find(
        (item) => item.eventName === fields[i].eventName
      )?.eventId

      //如果事件被隐藏或无权限
      if (!eventId) {
        await hideEventHandle(obj.eventName, (infoData) => {
          obj['eventNameDisplay'] = infoData.fieldDisplayName
          obj['permissionStatus'] = infoData.status === 0
        })
      }

      const res = await fetchFieldList(eventId)
      obj.eventFieldsData = res

      if (fields[i].propertyName) {
        obj.fields = echoEventSplitItem(fields[i])
        obj.split = true
      }

      // 事件/筛选拆分条件
      if (fields[i].filts) {
        obj = {
          ...obj,
          ...parseFiltersFromRes(obj),
        }
      }

      eventFilters.push(obj)
    }

    analysis.event = eventFilters
    const sourceEventFind = analysis.eventNames.find(
      (item) => item.eventName === sourceEvent.eventName
    )

    const tempData = {}
    //如果事件被隐藏或无权限
    if (!sourceEventFind) {
      await hideEventHandle(sourceEvent.eventName, (infoData) => {
        tempData['eventNameDisplay'] = infoData.fieldDisplayName
        tempData['permissionStatus'] = infoData.status === 0
      })
    }
    // 分析路径以
    analysis.sourceEvent = {
      ...sourceEvent,
      ...parseFiltersFromRes(sourceEvent),
      ...tempData,
    }

    // 会话间隔时长
    session.time = sessionInterval
    session.type = sessionType

    // 用户满足
    state.conditionFilters = parseFiltersFromRes(userFilter)

    // 时间回显
    const date = {
      diff,
      endTime,
      recentDay,
      shortcutType,
      startTime,
    }

    emit('echoGlobalFilters', {
      dateRange: date,
    })

    emit('update:timeZone', timeZone)

    cb && cb()
  }

  /**
   * @description: 回显事件拆分项
   * @return {*}
   */
  const echoEventSplitItem = (item) => {
    const obj = {
      fEn: item.propertyName,
      name: item.propertyNameDisplay,
      fType: item.propertyType,
      tableType: item.tableType,
      parentId: item.parentId,
      timeType: item.timeType,
      range: {
        propertyRange: item.propertyRange,
        propertyRangeType: item.propertyRangeType,
      },
    }

    return obj
  }

  /**
   * @description: 事件被隐藏或无权限处理
   * @return {*}
   */
  const hideEventHandle = async (eventName, callback = () => {}) => {
    const hideInfo = await getHideFieldInfo([
      {
        appId: sessionStorage.getItem('appId'),
        field: eventName,
        type: 0,
      },
    ])
    if (hideInfo.code === 200) {
      const infoData = hideInfo.data?.[0]
      if (typeof callback === 'function') {
        callback(infoData)
      }
    }
  }

  return {
    analysis,
    session,
    currentEventList,
    getParams,
    eventChange,
    saveDraft,
    paddingDraft,
    echoDetail,
    watchState,
    initBeforeGetEvents,
  }
}
