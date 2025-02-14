import { computed, watch, inject, toRef } from 'vue'
import { useRoute } from 'vue-router'
import { cloneDeep, isNumber, isObject, isArray } from 'lodash-es'
import { ElMessage } from 'element-plus'
import useOperate from '@/components/PropsFilter/useOperate'
import { v4 as uuidv4 } from 'uuid'
import { getTableType } from '@/utils/dataProcessing'
import { tableKeysArr, tableTypeArr, omitAttr } from '@/enumeration'
import { getEventFields, getFieldList } from '@/api/modules/analysis/common.js'
import { loadUserProps } from '@/api/modules/analysis/attr.js'
import useEventStore from '@/store/modules/event.js'
import { t } from '@/locales/i18n'

// 处理归因分析
function process14Data(data) {
  const common = { A00: data.common.A00 }
  const config = {
    int: { A03: data.config.int?.A03 },
    double: { A03: data.config.double?.A03 },
  }
  const field = data.field.filter(
    (field) => field.fType === 'int' || field.fType === 'double'
  )
  return { ...data, common, config, field }
}

export default function (props = {}) {
  const appId = toRef(inject('appId', sessionStorage.getItem('appId')))
  const { analysisType = 1, anyEvent = false, filterFType = [] } = props
  const router = useRoute()
  const { parseFilterData, parseFiltersFromRes } = useOperate()
  const eventStore = useEventStore()
  const currentEventList = computed(() => {
    if (anyEvent === true) {
      const count =
        eventStore.currentEventList.filter(
          (el) => el.permissionStatus !== false
        )?.length || 0
      let data = [...eventStore.currentEventList]
      if (count > 0) {
        data = [
          ...data,
          {
            eventId: -1,
            eventName: '任意事件',
            eventNameZh: t('analysis.anyEvent'),
          },
        ]
      }
      return data
    } else {
      return eventStore.currentEventList
    }
  })
  const reportId = computed(() => router.query?.id)

  function initBeforeGetEvents(callback) {
    // 处理登录系统进入此页面时 currentEventList 还未生成的情况
    if (currentEventList.value.length === 0) {
      const stop = watch(currentEventList, (val, oldVal) => {
        if (oldVal.length === 0) {
          callback()
          stop()
        }
      })
    } else {
      callback()
    }
  }

  function getFirstEvent(eventFlag, excludeList) {
    let callback = (event) =>
      event?.eventId != undefined && event?.permissionStatus !== false
    if (eventFlag) {
      callback = isNumber(eventFlag)
        ? (event) =>
            event.eventId === eventFlag && event?.permissionStatus !== false
        : (event) =>
            event.eventName === eventFlag && event?.permissionStatus !== false
    }

    if (Array.isArray(excludeList) && excludeList.length > 0) {
      const originalCallback = callback
      callback = (event) =>
        originalCallback(event) &&
        !excludeList.some((flag) =>
          isNumber(flag) ? event.eventId === flag : event.eventName === flag
        )
    }
    const event = currentEventList.value.find(callback)
    return cloneDeep(event) ?? {}
  }

  /**
   * @description 根据下边获取事件对象
   * @author fengsi<294068744@qq.com>
   * @date 2024-02-22 15:25:45
   */
  function getEventByIndex(index = 0) {
    if (currentEventList.value.length === 1) return currentEventList.value[0]
    return cloneDeep(currentEventList.value[index]) ?? {}
  }

  // 获取对应事件的事件属性 type:1 事件分析、 2 分布分析、3 留存分析、4 ltv分析-回访事件、5 ltv分析-初始日期指标、6 ltv分析-同时展示指标 14 归因
  async function fetchEventFieldsData(eventId, type) {
    let temp = {}
    if (eventId) {
      const res = await getEventFields({
        eventId,
        analysisType: type || analysisType,
      })
      if (res.code === 200 && res.data) {
        // 分布分析 次数、天数、小时数需要排序展示
        if (analysisType === 2) {
          const obj = new Map(
            Object.entries(res.data.common).sort((a, b) =>
              a[0].localeCompare(b[0])
            )
          )
          const common = {}
          for (const [key, value] of obj) {
            common[key] = value
          }
          temp = cloneDeep({ ...res.data, common })
        } else if (analysisType === 14) {
          temp = cloneDeep(process14Data(res.data))
        } else {
          temp = cloneDeep(res.data)
        }
      }
    }

    if (isArray(filterFType) && filterFType.length) {
      temp.field = temp.field.filter(
        (item) => !filterFType.includes(item.fType)
      )
    }
    return temp
  }

  function setInitEventField(data) {
    let res = {}
    if (data?.common) {
      for (const key in data.common) {
        res = {
          analysis: key,
          analysisDesc: data.common[key],
        }
        break
      }
    }
    return res
  }

  // 获取对应事件的事件属性和用户属性、用户分群、用户标签
  async function fetchFieldList(eventParams) {
    let temp = {}
    let params = {
      eventIds: '',
    }
    if (
      isNumber(eventParams) ||
      (eventParams && eventParams?.split(',')?.every((el) => !isNaN(el)))
    ) {
      params.eventIds = eventParams
    } else {
      params = {
        eventNames: eventParams,
      }
    }

    const res2 = await getFieldList({ ...params, appId: appId?.value })
    if (res2.code === 200 && res2.data) {
      temp = cloneDeep(res2.data)
    }
    return temp
  }

  //获取只有用户相关的属性(用户属性、用户分群、用户标签)
  async function fetchUserProps() {
    let temp = {}
    const res = await loadUserProps()
    if (res.code === 200 && res.data) {
      temp = cloneDeep(res.data)
    }
    return temp
  }

  //获取筛选属性列表中的第一个属性 (分组中要剔除已经选择的属性)
  function getFirstField(fieldsList, groups) {
    let pVal = {}
    if (Object.keys(fieldsList)?.length) {
      for (const key of tableKeysArr) {
        let tempData = fieldsList?.[key]
        if (!Array.isArray(tempData)) continue
        tempData = tempData.filter((item) => item.permissionStatus !== false)
        if (Array.isArray(groups)) {
          for (const item of tempData) {
            const tableType = getTableType(key, item)
            const find = groups.find(
              (el) => item.fEn === el.fEn && tableType === el.tableType
            )
            if (!find) {
              return {
                fEn: item?.fEn,
                tableType,
                fType: item?.fType,
                parentId: item?.fieldId,
                name: item?.fZh,
              }
            }
          }
        } else {
          if (tempData?.[0]) {
            pVal = {
              fEn: tempData[0]?.fEn,
              tableType: getTableType(key, tempData[0]),
              fType: tempData[0]?.fType,
              parentId: tempData[0]?.fieldId,
              name: tempData[0]?.fZh,
            }
            break
          }
        }
      }
    }

    return pVal
  }

  //处理分组 剔除当前属性列表不存在的值
  const omitGroupsHandler = (data, groupListData) => {
    const newGroup = []
    for (const group of groupListData) {
      const key = tableTypeArr[group.tableType]
      if (['eventField', 'customTableList'].includes(key)) {
        const groupfields = data?.[key]
        const callBack =
          key === 'customTableList'
            ? (el) => el.fEn === group.customTableName
            : (el) => el.fEn === group.fEn
        if (Array.isArray(groupfields)) {
          if (groupfields.find(callBack) !== undefined) {
            newGroup.push(group)
          }
        }
      } else {
        newGroup.push(group)
      }
    }
    return cloneDeep(newGroup)
  }

  //自定义指标处理为请求参数所需的数据格式
  const getFormulaRequestParams = (val) => {
    let custom = ''
    let count = 0
    const customIndex = []
    const data = cloneDeep(val)
    for (const item of data) {
      if (item.type === 1) {
        custom += item.value
      } else if (item.type === 2) {
        if (
          !item?.value?.events?.eventName ||
          !item?.value?.eventFields?.analysis
        ) {
          return false
        }
        custom += `事件${count}`
        const temp = {
          event: `事件${count}`,
          eventId: item.value.events.eventId,
          eventName: item.value.events.eventName,
          eventNameDisplay: item.value.events.eventNameZh,
          eventType: item?.value?.events?.eventType,
          propertyName: item.value.eventFields.propertyName ?? '',
          propertyNameDisplay: item.value.eventFields.propertyNameDisplay ?? '',
          analysis: item.value.eventFields.analysis ?? '',
          analysisDesc: item.value.eventFields.analysisDesc ?? '',
          filts: [],
          relation: item?.value?.eventFilters?.relation ?? 0,
          parentId: item?.value?.eventFields.parentId ?? '',
          hasEventSplit: item?.value?.hasEventSplit,
        }
        if (Array.isArray(item?.value?.eventFilters?.filters)) {
          const filters = parseFilterData(item.value.eventFilters)
          if (!filters) {
            ElMessage.warning(t('common.filterConditionErr'))
            return false
          }
          temp['filts'] = filters.filts
        }

        customIndex.push(temp)
        count++
      }
    }
    if (customIndex.length === 0) {
      ElMessage.warning(t('analysis.selectEventIndicators'))
      return false
    }
    return { custom, customIndex }
  }

  const setFormulaCodeItem = async (
    data = {},
    eventFieldsMap,
    cacheFieldsList
  ) => {
    let eventData = getFirstEvent(data.eventName)
    if (!isObject(eventData) || Object.keys(eventData).length === 0) {
      eventData = {
        eventName: data.eventName,
        eventNameZh: data.eventNameDisplay,
        eventId: data.eventId,
      }
      if (data?.eventType) {
        eventData['eventType'] = data.eventType
      }
    }
    let eventFieldsData = {}
    if (eventFieldsMap[data.eventName]) {
      eventFieldsData = cloneDeep(eventFieldsMap[data.eventName])
    } else {
      eventFieldsData = await fetchEventFieldsData(
        eventData?.eventId,
        data?.analysisType
      )
      eventFieldsMap[data.eventName] = cloneDeep(eventFieldsData)
    }
    const eventFields = setEventFields(data, eventFieldsData)
    const tempCode = {
      id: uuidv4(),
      type: 2,
      value: {
        events: { ...eventData },
        eventFields: { ...eventFields },
        eventFilters: cloneDeep(parseFiltersFromRes(data)),
        hasEventSplit: data.hasEventSplit,
      },
    }
    return cloneDeep(tempCode)
  }

  // 自定义指标处理（请求参数形式的数据转化为页面展示所需）
  const getFormulaCode = async (customIndex, custom, analysisType) => {
    if (!Array.isArray(customIndex)) return []
    const code = []
    const ids = []
    const customIndexMap = {}
    for (const item of customIndex) {
      custom = custom.replace(item.event, `,${item.event},`)
      customIndexMap[item.event] = item
      if (item?.eventId) {
        ids.push(item.eventId)
      }
    }
    custom = custom.replace(/(\+|-|\*|\/|\(|\))/g, ',$1,')
    custom = custom.replace(/,{1,}/g, ',')
    const formula = custom.split(',').filter((el) => el)
    const cacheFieldsList = {}
    const eventFieldsMap = {}
    for (const item of formula) {
      const eventData = customIndexMap[item]
      let codeItem = {}
      if (eventData) {
        eventData['analysisType'] =
          (eventData['analysisType'] ?? analysisType) || 1
        codeItem = await setFormulaCodeItem(
          eventData,
          eventFieldsMap,
          cacheFieldsList
        )
      } else {
        codeItem = {
          id: uuidv4(),
          type: 1,
          value: item,
        }
      }
      code.push(codeItem)
    }
    return { code, events: [...new Set(ids)] }
  }

  //自定义指标
  const getFormulaIndexItem = async (data) => {
    const codeRes = await getFormulaCode(
      data?.customIndex,
      data?.custom,
      data?.analysisType
    )
    const res = {
      id: uuidv4(),
      alias: data.alias,
      aliasEdited: true,
      code: cloneDeep(codeRes?.code) ?? [],
      customizable: true,
      eventFilters: cloneDeep(parseFiltersFromRes(data)),
      fieldsList: {},
      round: data.round,
    }
    res.fieldsList = await fetchFieldList(codeRes?.events.join(','))
    return cloneDeep(res)
  }

  //事件指标的属性：总次数、xxx的总次数 等等
  const setEventFields = (source, fieldsData) => {
    let eventFields = {}
    if (source?.propertyName) {
      // 有事件属性
      eventFields = {
        analysis: source.analysis,
        analysisDesc: source.analysisDesc,
        propertyName: source.propertyName,
        propertyNameDisplay: source.propertyNameDisplay,
        parentId: source.parentId,
      }
      if (Array.isArray(fieldsData?.field)) {
        const find =
          fieldsData?.field?.find((el) => el.fEn === source.propertyName) ?? {}
        eventFields = {
          ...eventFields,
          permissionStatus: find?.permissionStatus ?? null,
          propertyNameDisplay: find?.fZh || source?.propertyNameDisplay,
        }
      }
    } else {
      eventFields = {
        analysis: source.analysis,
        analysisDesc: source.analysisDesc,
      }
    }
    return cloneDeep(eventFields)
  }

  //普通指标
  const getIndexItem = async (
    data = {},
    eventFieldsMap = {},
    cacheFieldsList = {}
  ) => {
    let eventData = getFirstEvent(data.eventName)
    if (!isObject(eventData) || Object.keys(eventData).length === 0) {
      eventData = {
        eventName: data.eventName,
        eventNameZh: data.eventNameDisplay,
      }
      if (data?.eventType) {
        eventData['eventType'] = data.eventType
      }
    }
    const res = {
      id: uuidv4(),
      events: { ...eventData },
      eventFields: {},
      eventFilters: cloneDeep(parseFiltersFromRes(data)),
      alias: data.alias,
      aliasEdited: data.alias ? true : false,
      customizable: false,
      hasEventSplit: data.hasEventSplit,
      eventFieldsData: {},
      fieldsList: {},
    }

    if (eventFieldsMap[data.eventName]) {
      res.eventFieldsData = cloneDeep(eventFieldsMap[data.eventName])
    } else {
      res.eventFieldsData = await fetchEventFieldsData(
        eventData?.eventId,
        data?.analysisType
      )
      eventFieldsMap[data.eventName] = cloneDeep(res.eventFieldsData)
    }

    res.eventFields = setEventFields(data, res.eventFieldsData)

    if (cacheFieldsList[data.eventName]) {
      res.fieldsList = cloneDeep(cacheFieldsList[data.eventName])
    } else {
      res.fieldsList = await fetchFieldList(
        eventData?.eventId ?? eventData?.eventName
      )
      cacheFieldsList[data.eventName] = cloneDeep(res.fieldsList)
    }

    return cloneDeep(res)
  }

  // 指标反显
  const setIndexDisplay = async (source = []) => {
    const cacheFieldsList = {}
    const eventFieldsMap = {}
    const tempList = []

    for (const item of source) {
      let res = {}
      //自定义指标和普通指标
      if (Array.isArray(item.customIndex)) {
        res = await getFormulaIndexItem(item)
      } else {
        res = await getIndexItem(item, eventFieldsMap, cacheFieldsList)
      }
      tempList.push(res)
    }
    return cloneDeep(tempList)
  }

  // 全局筛选反显
  const setGlobalFiltersDisplay = (data = {}) => {
    return cloneDeep(parseFiltersFromRes(data))
  }

  // 分组反显
  const setGroupByDisplay = (source = []) => {
    const tempGroup = source.map(
      (item) =>
        item && {
          id: uuidv4(),
          fEn: item.propertyName,
          name: item.propertyNameDisplay || item.columnDesc, // 兼容1.0迁移 columnDesc
          fType: item.propertyType,
          tableType: item.tableType,
          parentId: item.parentId,
          timeType: item.timeType,
          range: {
            propertyRange: item.propertyRange,
            propertyRangeType: item.propertyRangeType,
          },
          customTableName: item?.customTableName,
          customTableId: item?.customTableId,
        }
    )
    return cloneDeep(tempGroup)
  }

  // 事件拆分反显
  const setEventSplit = async (source = []) => {
    const tempSplit = []
    // 兼容1.0的只有一个对象形式的拆分项
    const sourceArr = Array.isArray(source) ? source : [source]
    for (const item of sourceArr) {
      let eventData = getFirstEvent(item.eventName)
      if (!isObject(eventData) || Object.keys(eventData).length === 0) {
        eventData = {
          eventName: item.eventName,
          eventNameZh: item.eventNameDisplay,
        }
      }
      const fieldsList = await fetchFieldList(
        eventData?.eventId ?? eventData?.eventName
      )
      const find = fieldsList?.eventField?.find(
        (el) => el.fEn === item.propertyName
      )
      const splitItem = {
        attr: {
          fEn: item.propertyName,
          fType: item.propertyType,
          fZh: find?.fZh ?? item.eventNameDisplay,
          parentId: item.parentId,
          tableType: item.tableType,
        },
        events: {
          eventName: item.eventName,
          eventNameZh: eventData?.eventNameZh,
        },
        range: {
          propertyRange: item.propertyRange,
          propertyRangeType: item.propertyRangeType,
        },
        timeType: item.timeType,
      }
      if (item?.eventType) {
        splitItem.events['eventType'] = item.eventType
      }
      tempSplit.push(splitItem)
    }
    return cloneDeep(tempSplit)
  }

  // 日期类型格式
  const isTimeDataType = (type) => ['datetime', 'timestamp'].includes(type)
  // 数值类型格式
  const isNumberDataType = (type) => ['int', 'double'].includes(type)

  // 发送请求所需的事件拆分的数据
  const getEventSplitData = (splitEvents = []) => {
    return splitEvents.map((splitItem) => ({
      eventName: splitItem?.events?.eventName ?? '',
      eventNameDisplay: splitItem?.events?.eventNameZh ?? '',
      eventType: splitItem?.events?.eventType,
      propertyName: splitItem?.attr?.fEn ?? '',
      propertyType: splitItem?.attr?.fType ?? '',
      propertyNameDisplay: splitItem?.attr?.fZh ?? '',
      tableType: splitItem?.attr?.tableType ?? '',
      parentId: splitItem?.attr?.parentId ?? splitItem?.attr?.fieldId ?? '',
      propertyRangeType: isNumberDataType(splitItem?.attr?.fType)
        ? splitItem?.range?.propertyRangeType
        : 0,
      propertyRange: isNumberDataType(splitItem?.attr?.fType)
        ? cloneDeep(splitItem?.range?.propertyRange)
        : [],
      timeType: isTimeDataType(splitItem?.attr?.fType)
        ? splitItem.timeType
        : '',
    }))
  }

  // 发送请求时的分组数据
  const getGroupData = (groupList = []) => {
    return groupList.map((item) => ({
      propertyName: item.fEn,
      propertyType: item.fType,
      propertyNameDisplay: item.name,
      tableType: item.tableType,
      parentId: item.parentId ?? item.fieldId ?? '',
      timeType: isTimeDataType(item.fType) ? item.timeType : '',
      propertyRangeType: isNumberDataType(item.fType)
        ? item?.range?.propertyRangeType
        : 0,
      propertyRange: isNumberDataType(item.fType)
        ? cloneDeep(item?.range?.propertyRange)
        : [],
      customTableName: item?.customTableName,
      customTableId: item?.customTableId,
    }))
  }

  //ltv分析中的初始用户 （用户属性）
  const setUserPropsIndex = (data, propsList) => {
    let find
    if (Array.isArray(propsList)) {
      find = propsList.find((el) => el.fEn === data?.propertyName)
    }
    const res = {
      userField: {
        parentId: find?.fieldId || '',
        permissionStatus: find?.permissionStatus,
        propertyName: find?.fEn || data?.propertyName,
        propertyNameDisplay: find?.fZh || data?.propertyNameDisplay,
      },
    }
    return cloneDeep(res)
  }
  //ltv分析中的初始用户 （用户事件）或者留存的初始事件（回访事件）
  const setInitialEventIndex = async (data) => {
    let eventData = getFirstEvent(data.eventName)
    if (!isObject(eventData) || Object.keys(eventData).length === 0) {
      eventData = {
        eventName: data.eventName,
        eventNameZh: data.eventNameDisplay,
      }
    }
    const res = {
      events: { ...eventData },
      eventFilters: cloneDeep(parseFiltersFromRes(data)),
      fieldsList: {},
    }
    if (data?.eventType) {
      res.events['eventType'] = data.eventType
    }
    res.fieldsList = await fetchFieldList(
      eventData?.eventId ?? eventData?.eventName
    )
    return cloneDeep(res)
  }

  // 过滤掉属性数据中的 ['__fid', '__bid', '__did']
  const filterFieldListByOmitAttr = (resData) => {
    const temp = {}
    for (const key in resData) {
      const data = resData[key]
      temp[key] = tableKeysArr.includes(key)
        ? data.filter((el) => !omitAttr.includes(el.fEn))
        : data
    }
    return cloneDeep(temp)
  }

  // 生成默认分群
  const generateDefaultCluster = (defaultCluster, path) => {
    if (isObject(defaultCluster) && Object.keys(defaultCluster).length > 0) {
      const analyse = defaultCluster?.analyseId?.split(',')
      if (Array.isArray(analyse) && analyse.some((a) => path.includes(a))) {
        return {
          id: uuidv4(),
          equation: defaultCluster?.belongCluster === 0 ? 'C16' : 'C15',
          timeRelation: '',
          timeUnit: '',
          singleValue: '',
          before: 0,
          after: 1,
          selected: '',
          selectedList: [],
          datetimeVal: '',
          datetimerangeval: [],
          fEn: defaultCluster?.fEn ?? '',
          tableType: 4,
          fType: 'group',
          name: defaultCluster?.fZh ?? '',
        }
      }
    }
    return null
  }

  return {
    reportId,
    currentEventList,
    getFirstEvent,
    getEventByIndex,
    initBeforeGetEvents,
    fetchEventFieldsData,
    setInitEventField,
    fetchFieldList,
    getFirstField,
    getFormulaRequestParams,
    setIndexDisplay,
    getFormulaIndexItem,
    getIndexItem,
    setGlobalFiltersDisplay,
    setGroupByDisplay,
    setEventSplit,
    fetchUserProps,
    omitGroupsHandler,
    getEventSplitData,
    getGroupData,
    setInitialEventIndex,
    setUserPropsIndex,
    filterFieldListByOmitAttr,
    generateDefaultCluster,
  }
}
