import { ref, reactive, computed, watch, watchEffect, nextTick } from 'vue'
import useOperate from '@/components/PropsFilter/useOperate'
import { useRoute } from 'vue-router'
import { cloneDeep, omit, isNumber, isObject } from 'lodash-es'
import { getTableType } from '@/utils/dataProcessing'
import { getEventFields, getFieldList } from '@/api/modules/analysis/common.js'
import { ElMessage } from 'element-plus'
import { tableKeysArr, tableTypeArr, omitAttr } from '@/enumeration'
import { v4 as uuidv4 } from 'uuid'
import { computedAsync } from '@vueuse/core'
import useAanlysisUtils from '@/views/analysis/hooks/useAanlysisUtils.js'
import useTimeZoneStore from '@/store/modules/time-zone.js'
import dayjs from 'dayjs'
import { t } from '@/locales/i18n'

export default function (emits, props) {
  const router = useRoute()
  const { parseFilterData, parseFiltersFromRes, omitFiltersHandler } =
    useOperate()
  const {
    currentEventList,
    getFirstEvent,
    fetchEventFieldsData,
    setInitEventField,
    fetchFieldList,
    getFirstField,
    initBeforeGetEvents,
    getFormulaRequestParams,
    setIndexDisplay,
    setGlobalFiltersDisplay,
    setGroupByDisplay,
    setEventSplit,
    omitGroupsHandler,
    getEventSplitData,
    getGroupData,
    filterFieldListByOmitAttr,
    generateDefaultCluster,
  } = useAanlysisUtils({ anyEvent: true })

  const AnalysisIndexRef = ref([])
  const timeZoneStore = useTimeZoneStore()
  const analysisList = ref([])
  const { id } = router.query
  const state = reactive({
    globalFiledsData: {},
    globalFilters: {
      relation: 0,
      filters: [],
    },
    groupList: [],
    splitEvents: [],
    needOmitWatch: true,
  })
  if (!id) {
    initBeforeGetEvents(getAnalysisItem)
  }
  // 产生一项指标
  async function getAnalysisItem() {
    if (
      currentEventList.value?.filter((el) => el.permissionStatus !== false)
        .length === 0
    ) {
      ElMessage.warning(t('analysis.indicatorsEmpty'))
      return
    }
    const temp = {
      id: uuidv4(),
      events: {},
      eventFields: {},
      eventFilters: {
        relation: 0,
        filters: [],
      },
      alias: '',
      aliasEdited: false,
      customizable: false,
      hasEventSplit: 0,
      eventFieldsData: {},
      fieldsList: {},
    }
    temp.events = getFirstEvent()
    if (temp?.events?.eventId) {
      temp.eventFieldsData = await fetchEventFieldsData(temp?.events?.eventId)
      temp.eventFields = setInitEventField(temp.eventFieldsData)
      // 获取筛选条件的数据源
      temp.fieldsList = await fetchFieldList(temp.events.eventId)
    }
    analysisList.value.push(temp)
  }

  const eventChange = async (index, val) => {
    if (val?.eventId) {
      const resData = await fetchEventFieldsData(val?.eventId)
      const fieldsListData = await fetchFieldList(val?.eventId)
      analysisList.value[index] = {
        ...analysisList.value[index],
        eventFieldsData: cloneDeep(resData),
        eventFields: setInitEventField(resData),
        fieldsList: cloneDeep(fieldsListData),
      }
      omitFilters(fieldsListData, index)
    }
  }

  // 添加筛选条件: 有fIndex则是添加子筛选项
  const addFilter = (index, fIndex) => {
    if (fIndex !== undefined) {
      if (
        Array.isArray(
          analysisList.value?.[index]?.eventFilters?.filters[fIndex]?.filters
        )
      ) {
        analysisList.value[index].eventFilters.filters[fIndex].filters.push({
          id: uuidv4(),
          ...getFirstField(analysisList.value?.[index]?.fieldsList),
        })
      } else {
        const oldItem = cloneDeep(
          analysisList.value[index].eventFilters.filters[fIndex]
        )
        analysisList.value[index].eventFilters.filters[fIndex] = {
          id: oldItem.id,
          relation: 0,
          filters: [
            { ...oldItem, id: uuidv4() },
            {
              id: uuidv4(),
              ...getFirstField(analysisList.value?.[index]?.fieldsList),
            },
          ],
        }
      }
    } else {
      const fieldsList = analysisList.value?.[index]?.fieldsList
      if (!isObject(fieldsList) || Object.keys(fieldsList).length === 0) return
      if (Array.isArray(analysisList.value?.[index]?.eventFilters?.filters)) {
        analysisList.value[index].eventFilters.filters.push({
          id: uuidv4(),
          ...getFirstField(fieldsList),
        })
      }
    }
  }

  // 删除筛选项:有subfIndex则是删除子筛选项
  const deleteFilter = (index, fIndex, subfIndex) => {
    if (subfIndex !== undefined) {
      analysisList.value?.[index]?.eventFilters?.filters[
        fIndex
      ]?.filters?.splice(subfIndex, 1)
      const len =
        analysisList.value?.[index]?.eventFilters?.filters[fIndex]?.filters
          ?.length
      if (len === 1) {
        const temp = omit(
          analysisList.value?.[index]?.eventFilters?.filters[fIndex]?.filters?.[
            len - 1
          ],
          ['id']
        )
        const tempScreen = omit(
          analysisList.value?.[index]?.eventFilters?.filters[fIndex],
          ['filters', 'relation']
        )
        analysisList.value[index].eventFilters.filters[fIndex] = {
          ...temp,
          ...tempScreen,
        }
      }
    } else {
      analysisList.value[index]?.eventFilters?.filters?.splice(fIndex, 1)
    }
  }
  //添加指标
  const addIndex = () => {
    if (analysisList.value.length > 19) return
    getAnalysisItem()
  }
  // 添加自定义指标
  const addCustomIndex = () => {
    if (analysisList.value.length > 19) return
    getCustomAnalysisItem()
  }

  // 自定义指标事件改变回调
  async function customEventChange(index, events) {
    if (Array.isArray(events)) {
      const fieldsListData = await fetchFieldList(events.join(','))
      analysisList.value[index] = {
        ...analysisList.value[index],
        fieldsList: cloneDeep(fieldsListData),
      }
      omitFilters(fieldsListData, index)
    }
  }
  //添加自定义指标项
  const getCustomAnalysisItem = () => {
    if (currentEventList.value.length === 0) {
      ElMessage.warning(t('analysis.indicatorsEmpty'))
      return
    }
    let maxId = 0
    const nums = []
    const reg = new RegExp(`${t('analysis.customizedMetrics')}(\\d*)$`)
    for (const item of analysisList.value) {
      if (item.customizable && reg.test(item.alias)) {
        let val = item.alias?.replace(reg, '$1') || '0'
        nums.push(parseFloat(val))
      }
    }
    const hasNums = nums.length > 0
    maxId = (hasNums ? Math.max(...nums) : 0) + 1
    const temp = {
      id: uuidv4(),
      code: [],
      eventFilters: {
        relation: 0,
        filters: [],
      },
      alias: `${t('analysis.customizedMetrics')}${hasNums ? maxId : ''}`,
      aliasEdited: true,
      customizable: true,
      fieldsList: {},
      round: 0,
    }
    analysisList.value.push(temp)
    nextTick(() => {
      AnalysisIndexRef.value[analysisList.value.length - 1].handleShowKeyBord()
    })
  }
  // 删除指标
  const deleteIndex = (index) => {
    if (analysisList.value.length == 1) return
    analysisList.value.splice(index, 1)
  }
  // 复制指标
  const copyIndex = (index) => {
    if (analysisList.value.length > 19) return
    const copyItem = cloneDeep(analysisList.value[index])
    analysisList.value.splice(index + 1, 0, { ...copyItem, id: uuidv4() })
  }

  const splitEventSource = computed(() => {
    const arr = []
    const ids = []
    let hasCustom = false
    for (const item of analysisList.value) {
      if (item.customizable) {
        if (Array.isArray(item.code)) {
          hasCustom = true
          for (const subItem of item.code) {
            if (subItem.type === 2) {
              const eventId = subItem?.value?.events?.eventId
              if (eventId && !ids.includes(eventId)) {
                ids.push(eventId)
                arr.push(
                  cloneDeep({
                    ...subItem.value.events,
                    fieldsList: {},
                  })
                )
              }
            }
          }
        }
      } else {
        if (item?.events?.eventId && !ids.includes(item.events.eventId)) {
          ids.push(item.events.eventId)
          arr.push(cloneDeep({ ...item.events, fieldsList: item.fieldsList }))
        }
      }
    }
    if (analysisList.value.length < 2 && !hasCustom) {
      return []
    }
    return arr
  })

  // 全局筛选（分组项）的数据源
  const globalFiledEvents = computed(() => {
    let ids = []
    for (const item of analysisList.value) {
      if (item?.events?.eventId) {
        ids.push(item.events.eventId)
      } else if (item?.customizable && Array.isArray(item?.code)) {
        for (const subItem of item.code) {
          if (subItem.type === 2) {
            if (subItem?.value?.events?.eventId) {
              ids.push(subItem.value.events.eventId)
            }
          }
        }
      }
    }
    return ids.length > 0
      ? [...new Set(ids)].sort((a, b) => a - b).join(',')
      : undefined
  })
  watch(globalFiledEvents, async (val) => {
    if (val) {
      state.globalFiledsData = await fetchFieldList(val)
    }
  })
  watch(
    () => state.globalFiledsData,
    (val) => {
      if (state.needOmitWatch) {
        // 处理全局筛选 剔除当前属性列表不存在的值
        omitFilters(val)
        // 处理分组 剔除当前属性列表不存在的值
        omitGroups(val)
      } else {
        state.needOmitWatch = true
      }
    }
  )

  watch(
    () => state.splitEvents,
    () => {
      analysisList.value.forEach((item) => {
        if (
          state.splitEvents
            .map((el) => el?.events?.eventName)
            .includes(item.events?.eventName)
        ) {
          item['hasEventSplit'] = item['hasEventSplit'] || 1
        } else {
          item['hasEventSplit'] = item['hasEventSplit'] || 0
        }
      })
    },
    {
      immediate: true,
      deep: true,
    }
  )

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

  //处理分组 剔除当前属性列表不存在的值
  const omitGroups = (data) => {
    state.groupList = omitGroupsHandler(data, state.groupList)
  }

  // 处理筛选列表中在数据源中不存在的筛选属性
  const omitFilters = (data, index) => {
    // index === undefined  全局筛选
    let temp =
      index === undefined
        ? state.globalFilters?.filters
        : analysisList.value[index]?.eventFilters?.filters
    if (!Array.isArray(temp) || temp.length === 0) return
    const newFilters = omitFiltersHandler(data, temp)

    if (index === undefined) {
      state.globalFilters.filters = newFilters
    } else {
      analysisList.value[index].eventFilters.filters = newFilters
    }
  }
  // 添加全局筛选项
  const addGlobalFilter = (index) => {
    if (Object.keys(state.globalFiledsData).length === 0) {
      ElMessage.warning(t('analysis.event.filterAttributesEmpty'))
      return
    }
    if (isNumber(index)) {
      if (Array.isArray(state?.globalFilters?.filters?.[index]?.filters)) {
        state.globalFilters.filters?.[index].filters.push({
          id: uuidv4(),
          ...getFirstField(state.globalFiledsData),
        })
      } else {
        const oldItem = cloneDeep(state.globalFilters.filters[index])
        state.globalFilters.filters[index] = {
          id: oldItem.id,
          relation: 0,
          filters: [
            { ...oldItem, id: uuidv4() },
            {
              id: uuidv4(),
              ...getFirstField(state.globalFiledsData),
            },
          ],
        }
      }
    } else {
      if (Array.isArray(state.globalFilters.filters)) {
        state.globalFilters.filters.push({
          id: uuidv4(),
          ...getFirstField(state.globalFiledsData),
        })
      }
    }
  }
  // 全局筛选删除一项
  const deleteGlobalFilter = (index, subIndex) => {
    if (subIndex !== undefined) {
      state.globalFilters.filters[index]?.filters?.splice(subIndex, 1)
      const len = state.globalFilters.filters[index]?.filters?.length
      if (len === 1) {
        const temp = omit(
          state.globalFilters.filters[index]?.filters?.[len - 1],
          ['id']
        )
        const tempScreen = omit(state.globalFilters?.filters?.[index], [
          'filters',
          'relation',
        ])
        state.globalFilters.filters[index] = { ...temp, ...tempScreen }
      }
    } else {
      state.globalFilters.filters.splice(index, 1)
    }
  }

  // 添加分组
  const addGroupItem = () => {
    if (state.groupList.length > 4) return
    if (Object.keys(groupFieldsData.value).length === 0) {
      ElMessage.warning(t('analysis.noGroupAdd'))
      return
    }
    state.groupList.push({
      id: uuidv4(),
      ...getFirstField(groupFieldsData.value, disabledGroups.value),
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
  // 添加事件拆分
  const addSplitEvent = async () => {
    if (splitEventSource.value.length === 0) return
    const event = splitEventSource.value[0]
    const find = analysisList.value.find((el) => {
      if (el?.code?.length) {
        const customFind = el.code.find(
          (data) =>
            data.type === 2 && data?.value?.events?.eventId === event?.eventId
        )
        return customFind !== undefined
      } else {
        return el?.events?.eventId === event?.eventId
      }
    })

    let fieldData = find?.fieldsList?.eventField
    if (find.customizable) {
      const res = await fetchFieldList(event?.eventId)
      fieldData = res?.eventField
    }
    if (find && Array.isArray(fieldData)) {
      const source = fieldData.filter((el) => !omitAttr.includes(el.fEn))
      for (const item of source) {
        const fItem = state.groupList.find((el) => item.fEn === el.fEn)
        if (fItem === undefined) {
          state.splitEvents.push({
            events: {
              eventName: event.eventName,
              eventNameZh: event.eventNameZh,
              eventType: event.eventType,
            },
            attr: {
              fEn: item.fEn,
              fZh: item.fZh,
              fType: item.fType,
              parentId: item.fieldId,
              tableType: getTableType('eventField', item),
            },
            timeType: '',
            range: {
              propertyRange: [],
              propertyRangeType: 1,
            },
          })
          return
        }
      }
    }
  }
  // 在选择分组项中需要禁用掉的事件属性
  const disabledGroups = computed(() => {
    const group = []
    for (const item of state.splitEvents) {
      if (item?.attr?.fEn) {
        group.push({
          fEn: item?.attr?.fEn,
          tableType: item?.attr?.tableType,
        })
      }
    }
    for (const item of state.groupList) {
      if (
        group.findIndex(
          (el) =>
            el.fEn === item.fEn && el.customTableName === item.customTableName
        ) === -1
      ) {
        group.push({
          ...item,
        })
      }
    }
    return group
  })
  // 分组项中去掉 omitAttr 中包含的属性
  const groupFieldsData = computed(() => {
    return filterFieldListByOmitAttr(state.globalFiledsData)
  })
  // 事件指标是否展示拆分按钮
  const showSplitBtn = (item, index) => {
    let flag = false
    const eventName = item?.events?.eventName
    if (eventName) {
      const splitEvents = state.splitEvents.map((el) => el?.events?.eventName)
      flag = splitEvents.includes(eventName)
    }
    return flag
  }
  // 编辑别名
  const editAlias = (index) => {
    analysisList.value[index].aliasEdited = true
  }

  // 获取请求参数
  const getRequestParams = () => {
    const data = {
      events: [],
      globalFilts: {
        filts: [],
        relation: state.globalFilters.relation,
      },
      eventSplit: [], // 事件拆分
      groupBy: [],
    }
    const alisMap = {}
    if (analysisList.value.length === 0) return
    //1、指标部分
    for (const item of analysisList.value) {
      if (item.aliasEdited) {
        if (!item.alias) {
          ElMessage.warning(t('analysis.indicatorsPlaceholder'))
          return
        } else {
          if (item?.alias?.length > 25) {
            ElMessage.warning(t('analysis.event.checkIndicatorsName'))
            return
          }
          if (alisMap[item.alias] !== undefined) {
            ElMessage.warning(
              t('analysis.event.checkIndicatorsNameRepeat', [item.alias])
            )
            return
          } else {
            alisMap[item.alias] = 1
          }
        }
      }

      let temp = {}
      if (item.customizable) {
        const res = getFormulaRequestParams(item.code)
        if (!res) {
          return
        }
        //自定义指标
        temp = {
          alias: item.alias,
          custom: res.custom,
          customIndex: res.customIndex,
          filts: [],
          relation: item.eventFilters.relation,
          round: item.round,
        }
      } else {
        if (!item?.events?.eventName || !item?.eventFields?.analysis) return
        temp = {
          eventName: item.events.eventName,
          eventNameDisplay: item.events.eventNameZh,
          eventType: item.events.eventType,
          propertyName: item.eventFields.propertyName,
          propertyNameDisplay: item.eventFields.propertyNameDisplay,
          analysis: item.eventFields.analysis,
          analysisDesc: item.eventFields.analysisDesc,
          filts: [],
          relation: item.eventFilters.relation,
          alias: item.alias,
          parentId: item.eventFields.parentId || '',
          hasEventSplit: item.hasEventSplit,
        }
      }

      const filters = parseFilterData(item.eventFilters)
      if (!filters) {
        ElMessage.warning(t('common.filterConditionErr'))
        return
      }
      temp.filts = filters.filts
      data.events.push(temp)
    }
    //2、全局筛选
    const gf = parseFilterData(state.globalFilters)
    if (!gf) {
      ElMessage.warning(t('common.filterConditionErr'))
      return
    }
    data.globalFilts = { ...gf }
    //3、事件拆分 state.splitEvents
    data.eventSplit = getEventSplitData(state.splitEvents)
    //4、分组项
    data.groupBy = getGroupData(state.groupList)
    const dateObjArr = [
      props.parentState.dateRange,
      ...props.parentState.versus,
    ]
    if (
      props.parentState.particleType.particle === 'hour' &&
      dateObjArr.some(
        (el) => dayjs(el?.endTime).diff(dayjs(el?.startTime), 'day') > 3
      )
    ) {
      ElMessage.warning(t('analysis.event.checkHourly'))
      emits('clearView')
      return
    }
    return mergeQp(data, props.parentState)
  }

  const mergeQp = (params, state) => {
    let data = {
      ...params,
      eventView: {
        timeZone: timeZoneStore.timeZone ?? '8',
        timeParticle: state.particleType.particle,
        recentDay: state.dateRange.recentDay,
        startTime: state.dateRange.startTime,
        endTime: state.dateRange.endTime,
        shortcutType: state.dateRange.shortcutType,
        graphType: state.graphType,
        // vs对比
        versus: Array.isArray(state.versus) ? state.versus : [],
      },
      eventCheckList: state.eventCheckList,
      showChartLabel: state.showChartLabel,
      affinity: state.approxVal,
      tableType: state.tableType,
      sortArr: state.sortArr,
    }
    if (data.eventSplit.length || data.groupBy.length) {
      data = {
        ...data,
        groupSort: state.sortType,
        groupCheck: cloneDeep(state.groupOptions),
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
    state.needOmitWatch = false
    const { events, globalFilts, eventSplit, groupBy } = data
    analysisList.value = await setIndexDisplay(events)
    state.groupList = setGroupByDisplay(groupBy)
    state.globalFilters = setGlobalFiltersDisplay(globalFilts)
    state.splitEvents = await setEventSplit(eventSplit)
  }

  const showEventSplitAdd = computed(() => {
    let show = false
    if (analysisList.value.length > 1) {
      show = true
    } else {
      const item = analysisList.value[0]
      show = item && item.customizable
    }
    return show && state.splitEvents.length === 0
  })

  return {
    analysisList,
    state,
    splitEventSource,
    eventChange,
    addFilter,
    deleteFilter,
    addIndex,
    addCustomIndex,
    deleteIndex,
    copyIndex,
    addGlobalFilter,
    deleteGlobalFilter,
    addGroupItem,
    removeGroupItem,
    addSplitEvent,
    disabledGroups,
    groupFieldsData,
    showSplitBtn,
    editAlias,
    startAnalysis,
    customEventChange,
    getRequestParams,
    echoReportAndDraft,
    initBeforeGetEvents,
    showEventSplitAdd,
    AnalysisIndexRef,
  }
}
