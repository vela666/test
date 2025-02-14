import { reactive, computed, watch, ref, toRefs } from 'vue'
import useEventStore from '@/store/modules/event.js'
import { useRoute } from 'vue-router'
import { v4 as uuidv4 } from 'uuid'
import { cloneDeep } from 'lodash-es'
import { getFieldList } from '@/api/modules/analysis/common.js'
import useOperate from '@/components/PropsFilter/useOperate'
import useTimeZoneStore from '@/store/modules/time-zone.js'
import { ElMessage } from 'element-plus'
import useAanlysisUtils from '@/views/analysis/hooks/useAanlysisUtils.js'
import { t } from '@/locales/i18n'

export function useFunnelSidebarHooks(state, props) {
  const {
    parseFilterData,
    handleDelConditionData,
    handleAddConditionData,
    getFilterItem,
    omitFiltersHandler,
  } = useOperate()

  const { fetchFieldList, initBeforeGetEvents, generateDefaultCluster } =
    useAanlysisUtils()

  const timeZoneStore = useTimeZoneStore()
  const route = useRoute()
  const eventStore = useEventStore()
  const currentEventList = computed(() => eventStore.currentEventList)

  const analysis = ref([])
  const windowsGap = reactive({
    time: 1,
    type: 'day',
  })
  // 相邻步骤同时发生，将用户计入下一步骤
  const enableCoincide = ref(false)

  const eventIds = computed(() => {
    let ids = []
    for (const item of analysis.value) {
      if (item?.eventId) {
        ids.push(item.eventId)
      }
    }

    return ids.length > 0
      ? [...new Set(ids)].sort((a, b) => a - b).join(',')
      : undefined
  })

  if (!route.query.id) {
    // 处理登录系统进入此页面时 currentEventList 还未生成的情况
    initBeforeGetEvents(() => {
      createDefaultEvent()
    })
  }

  /**
   * @description: 默认生成两项步骤指标
   * @return {*}
   */
  async function createDefaultEvent() {
    for (let i = 0; i < 2; i++) {
      createEvent()
    }
  }

  /**
   * @description: 生成步骤指标
   * @return {*}
   * @param {object} data
   * @param {string} type  默认为新增  回显：type ='echo'
   */
  async function createEvent(data = {}, type) {
    if (currentEventList.value.length === 0) {
      ElMessage.warning(t('analysis.indicatorsEmpty'))
      return
    }
    let temp = {
      id: uuidv4(),
      alias: '',
      relation: 0,
      filters: [],
      eventFieldsData: {},
      ...data,
    }
    if (type === 'echo') {
      temp.eventId = currentEventList.value.find(
        (val) => val.eventName === data.eventName
      )?.eventId
    } else {
      for (const item of currentEventList.value) {
        if (item?.eventId) {
          temp = { ...cloneDeep(item), ...temp }
          temp.alias = temp.eventNameZh
          break
        }
      }
    }
    temp.eventFieldsData = await fetchFieldList(temp?.eventId)
    if (type === 'echo') {
      return temp
    } else {
      analysis.value.push(temp)
    }
  }

  // /**
  //  * @description: 获取指标中每一项的属性
  //  * @return {*}
  //  * @param {*} eventIds
  //  */
  // async function fetchFieldList(eventIds) {
  //   let temp = {}
  //   if (eventIds) {
  //     const res2 = await getFieldList({ eventIds })
  //     if (res2.code === 200 && res2.data) {
  //       temp = cloneDeep(res2.data)
  //     }
  //   }
  //   return temp
  // }

  /**
   * @description: 删除步骤指标
   * @return {*}
   */
  const removeEvent = (i) => {
    analysis.value.splice(i, 1)
  }

  /**
   * @description: 复制步骤指标
   * @return {*}
   */
  const copyEvent = (i) => {
    if (analysis.value.length >= 20) {
      ElMessage.warning(t('analysis.funnel.stepIndicatorLimit'))
      return
    }
    analysis.value.splice(i, 0, {
      ...cloneDeep(analysis.value[i]),
      id: uuidv4(),
    })
  }

  /**
   * @description: 添加指标条件
   * @return {*}
   */
  const addEventFilter = (i, index) => {
    analysis.value[i] = handleAddConditionData({
      condition: analysis.value[i],
      noLimit: ['eventField'],
      conditionList: analysis.value[i].eventFieldsData,
      index,
    })
  }

  /**
   * @description: 生成步骤指标
   * @return {*}
   */
  const generateEventFilter = (i) => {
    const step = cloneDeep(analysis.value[i])
    const values = step.filters[0].selectedList
    const newSteps = []
    for (const val of values) {
      const temp = cloneDeep(step)
      temp.filters[0].selectedList = [val]
      temp.id = uuidv4()
      newSteps.push(temp)
    }
    analysis.value.splice(i, 1, ...newSteps)
  }

  /**
   * @description: 删除指标条件
   * @return {*}
   */
  const removeEventFilter = (i, index, subIndex) => {
    analysis.value[i] = handleDelConditionData({
      condition: analysis.value[i],
      index,
      subIndex,
    })
  }

  /**
   * @description: 事件
   * @return {*}
   */
  const eventChange = async (val, i) => {
    if (val?.eventId) {
      const eventFieldsData = await fetchFieldList(val?.eventId)
      analysis.value[i].eventFieldsData = cloneDeep(eventFieldsData)
      analysis.value[i].alias = val.eventNameZh
      // 需剔除掉不存在的属性
      omitEventFilters(eventFieldsData, i)
    }
  }

  /**
   * @description: 剔除掉不存在的属性
   * @return {*}
   */
  const omitEventFilters = (data, i) => {
    let temp = analysis.value[i]?.filters
    if (!Array.isArray(temp) || temp.length === 0) return
    const newFilters = omitFiltersHandler(data, temp)
    analysis.value[i].filters = newFilters
  }

  /**
   * @description: 校验qp是否符合
   * @return {*}
   */
  const validateConditions = () => {
    // 全局筛选
    if (!parseFilterData(state.conditionFilters)) {
      ElMessage.warning(t('common.filterConditionErr'))
      return false
    }

    // 步骤指标
    const flag = analysis.value.every((item) => {
      if (item.filters.length > 0) {
        return parseFilterData(item)
      }
      return true
    })
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
    if (analysis.value.length > 20) {
      ElMessage.warning(t('analysis.funnel.stepIndicatorLimit'))
      return
    }
    if (!validateConditions()) {
      return false
    }
    const { shortcutType, endTime, startTime, recentDay, diff } = toRefs(
      props.dateRange
    )
    const qp = {
      events: analysis.value.map((item) => {
        const obj = {
          ...parseFilterData(item),
          eventDesc: item.eventNameZh || item.eventDesc,
          eventName: item.eventName,
          eventType: item.eventType,
        }
        obj.eventNameDisplay =
          item.aliasRename || item.eventNameDisplay || obj.eventDesc
        return obj
      }),
      globalFilts: parseFilterData(state.conditionFilters),
      groupBy: parseGroupItem(state.conditionGroups),
      enableCoincide: enableCoincide.value,
      windowsGapMs: windowsGap.time,
      windowsGapTu: windowsGap.type,
      // UTC+8
      timeZone: timeZoneStore.timeZone,
      startTime: startTime.value,
      endTime: endTime.value,
      recentDay: recentDay.value,
      shortcutType: shortcutType.value,
      diff: diff.value,
      funnelType: props.funnelType,
      steps: props.steps,
      groupCheck: props.groupCheck,
    }
    return qp
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
    windowsGap,
    enableCoincide,
    createEvent,
    removeEvent,
    copyEvent,
    eventChange,
    addEventFilter,
    generateEventFilter,
    removeEventFilter,
    getParams,
    initBeforeGetEvents,
    generateDefaultCluster,
  }
}
